"""
FastAPI Backend for Policy Drafter UI
Strategy& PWC - AI Policy Drafter
"""

import os
import sys
from pathlib import Path

# Initialize New Relic agent first
# Set to 'development' by default (monitor_mode=false, won't send data)
# Set NEW_RELIC_ENVIRONMENT='production' in deployment to enable monitoring
# import newrelic.agent
# Try multiple paths for newrelic.ini (local dev vs Docker)
# newrelic_config_paths = [
#     '/app/newrelic.ini',  # Docker path
#     os.path.join(Path(__file__).parent.parent, 'newrelic.ini'),  # Local dev path
# ]
# newrelic_config_path = next((p for p in newrelic_config_paths if os.path.exists(p)), None)
# if newrelic_config_path:
#     nr_environment = os.getenv('NEW_RELIC_ENVIRONMENT', 'development')
#     newrelic.agent.initialize(newrelic_config_path, environment=nr_environment)
#     print(f"✓ New Relic initialized in '{nr_environment}' mode from {newrelic_config_path}")
# else:
#     print(f"⚠ New Relic config not found. Tried: {newrelic_config_paths}")

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path to import config
sys.path.append(str(Path(__file__).parent.parent))
from config.app_config import PolicyDrafterConfig

# Set OPENAI_API_KEY environment variable from config as fallback
os.environ["OPENAI_API_KEY"] = PolicyDrafterConfig.OPENAI_API_KEY

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import all handlers
from handlers.chat_handler import router as chat_router
from handlers.policy_handler import router as policy_router
from handlers.graph_handler import router as graph_router
from handlers.contextual_search_handler import router as contextual_search_router
from handlers.impact_analysis_handler import router as impact_analysis_router
from handlers.impact_visualization_handler import router as impact_visualization_router
from handlers.news_scrape_handler import router as news_scrape_router
from handlers.analytics_handler import router as analytics_router
from handlers.foresight_radar_handler import router as foresight_radar_router
from handlers.dsm_handler import router as dsm_router

VERSION = "1.1.2"

# Initialize FastAPI app
app = FastAPI(
    title="Policy Drafter API",
    description="Strategy& PWC AI-Powered Policy Drafting System",
    version=VERSION
)

# Note: New Relic ASGI wrapper removed - causing compatibility issues
# If monitoring is needed, uncomment the initialization code above (lines 10-25)
# and use newrelic-admin run-program instead of direct wrapping

# CORS Configuration - Allow frontend to access API
# FRONTEND_URL is loaded from environment variable (set in Azure Container Apps or .env.azure)
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

# Build allowed origins list
allowed_origins = [
    "http://localhost:3000",  # Local development
    "https://ca-policy-frontend.happycliff-41c6de54.eastus.azurecontainerapps.io",  # Production frontend
    "https://ca-policy-frontend.whitestone-31d90b86.eastus.azurecontainerapps.io",  # Old production frontend (for backward compatibility)
]

# Add production frontend URL if configured
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)
    print(f"✓ CORS configured for production frontend: {FRONTEND_URL}")
else:
    print("⚠ FRONTEND_URL not set - only localhost allowed. Set FRONTEND_URL in .env.azure for production.")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(policy_router)
app.include_router(graph_router)
app.include_router(contextual_search_router)
app.include_router(impact_analysis_router)
app.include_router(impact_visualization_router)
app.include_router(news_scrape_router)
app.include_router(analytics_router)
app.include_router(foresight_radar_router)
app.include_router(dsm_router, prefix="/api", tags=["dynamic-systems-modeler"])


# Hardcoded password
ADMIN_PASSWORD = os.getenv("POLICY_DRAFTER_PASSWORD", "strategy2024")


# Pydantic models for auth
class AuthRequest(BaseModel):
    password: str


class AuthResponse(BaseModel):
    success: bool
    message: str


def verify_password(password: str) -> bool:
    """Verify password against hardcoded value."""
    return password == ADMIN_PASSWORD


# Core routes
@app.get("/")
async def root():
    return {"message": "Strategy& PWC Policy Drafter API"}


@app.post("/auth", response_model=AuthResponse)
async def authenticate(auth: AuthRequest):
    """Simple password verification."""
    if verify_password(auth.password):
        return AuthResponse(success=True, message="Authentication successful")
    else:
        return AuthResponse(success=False, message="Invalid password")


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "policy-drafter-api",
        "version": VERSION
    }


if __name__ == "__main__":
    import uvicorn

    # Get port from environment or default to 8000
    port = int(os.getenv("PORT", "8000"))

    print(f"Starting Policy Drafter API on port {port}...")
    print(f"API Documentation: http://localhost:{port}/docs")
    print(f"Health Check: http://localhost:{port}/health")

    uvicorn.run(
        app,  # Pass the app object directly
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload when passing app object
        log_level="info"
    )
