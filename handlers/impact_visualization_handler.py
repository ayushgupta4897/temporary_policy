"""
Impact Visualization Handler - Routes for impact analysis visualizations
Handles routes: /api/impact-analysis/{analysis_id}/visualization
"""

from fastapi import APIRouter, HTTPException, Path as PathParam
from pydantic import BaseModel, Field
import sys
from pathlib import Path

# Add parent directory to path to import services
sys.path.append(str(Path(__file__).parent.parent))
from services.impact_visualization_service import impact_visualization_service

# Create router
router = APIRouter()


# Pydantic models
class VisualizationRequest(BaseModel):
    force_regenerate: bool = Field(False, description="Force regeneration even if cached version exists")


class VisualizationStatusResponse(BaseModel):
    exists: bool = Field(..., description="Whether cached visualization exists")
    available: bool = Field(..., description="Whether visualization can be generated")
    reason: str | None = Field(None, description="Reason if not available")


class VisualizationResponse(BaseModel):
    analysis_id: str
    exists: bool
    generated: bool
    visualization_data: dict | None
    error: str | None = None


# Routes
@router.get(
    "/api/impact-analysis/{analysis_id}/visualization/status",
    response_model=VisualizationStatusResponse,
    tags=["impact-visualization"]
)
def get_visualization_status(
    analysis_id: str = PathParam(..., description="ID of the impact analysis")
):
    """Check if visualization exists and can be generated for an analysis."""
    status = impact_visualization_service.check_visualization_status(analysis_id)
    return VisualizationStatusResponse(**status)


@router.post(
    "/api/impact-analysis/{analysis_id}/visualization",
    response_model=VisualizationResponse,
    tags=["impact-visualization"]
)
def generate_or_get_visualization(
    analysis_id: str = PathParam(..., description="ID of the impact analysis"),
    request: VisualizationRequest = VisualizationRequest()
):
    """
    Generate or retrieve cached visualization for an impact analysis.

    - If cached version exists and force_regenerate=False, returns cached version
    - Otherwise, generates new visualization using LLM
    - Caches the result for future requests
    """
    result = impact_visualization_service.get_or_generate_visualization(
        analysis_id=analysis_id,
        force_regenerate=request.force_regenerate
    )

    if result.get('error') and not result.get('exists'):
        # Return error as 200 with error field (not 404) to allow frontend to display message
        return VisualizationResponse(
            analysis_id=analysis_id,
            exists=False,
            generated=False,
            visualization_data=None,
            error=result['error']
        )

    return VisualizationResponse(
        analysis_id=analysis_id,
        exists=result['exists'],
        generated=result.get('generated', False),
        visualization_data=result.get('visualization_data'),
        error=result.get('error')
    )


@router.delete(
    "/api/impact-analysis/{analysis_id}/visualization",
    tags=["impact-visualization"]
)
def delete_visualization(
    analysis_id: str = PathParam(..., description="ID of the impact analysis")
):
    """Delete cached visualization for an analysis."""
    success = impact_visualization_service.delete_visualization(analysis_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Visualization not found or could not be deleted"
        )

    return {
        "message": "Visualization deleted successfully",
        "analysis_id": analysis_id
    }


@router.get(
    "/api/impact-visualization/health/check",
    tags=["impact-visualization"]
)
def visualization_health_check():
    """Health check endpoint for impact visualization service."""
    return {
        "status": "healthy",
        "service": "impact-visualization",
        "version": "1.0.0"
    }
