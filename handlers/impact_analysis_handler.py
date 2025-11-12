"""
Impact Analysis Handler - Routes for impact analysis queries
Handles routes: /api/impact-analysis
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Query as QueryParam
from pydantic import BaseModel, Field, field_validator
import sys
from pathlib import Path

# Add parent directory to path to import services
sys.path.append(str(Path(__file__).parent.parent))
from services.impact_analysis_service import impact_analysis_service

# Create router
router = APIRouter()

# Constants
MIN_QUERY_LENGTH = 10
MAX_QUERY_LENGTH = 1000
DEFAULT_LIST_LIMIT = 50
MAX_LIST_LIMIT = 200

# Pydantic models
class ImpactAnalysisRequest(BaseModel):
    query: str = Field(..., description="The causal impact query to analyze")
    async_mode: bool = Field(False, description="Run analysis asynchronously")

    @field_validator('query')
    @classmethod
    def validate_query(cls, v):
        if not v or not v.strip():
            raise ValueError('Query cannot be empty')
        if len(v) < MIN_QUERY_LENGTH:
            raise ValueError(f'Query must be at least {MIN_QUERY_LENGTH} characters')
        if len(v) > MAX_QUERY_LENGTH:
            raise ValueError(f'Query cannot exceed {MAX_QUERY_LENGTH} characters')
        return v.strip()

class ImpactAnalysisResponse(BaseModel):
    analysis_id: str
    query: str
    status: str
    meta_prompt: Optional[str] = None
    citations_count: int = 0
    citations: List[Dict] = []
    impact_analysis: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class AnalysisStatusResponse(BaseModel):
    analysis_id: str
    status: str
    query: str
    citations_count: int
    created_at: Optional[str] = None
    message: Optional[str] = None

# Routes
@router.post("/api/impact-analysis/", response_model=ImpactAnalysisResponse)
async def create_impact_analysis(request: ImpactAnalysisRequest):
    """Create a new impact analysis."""
    if request.async_mode:
        result = await impact_analysis_service.create_analysis_async(request.query)
        return ImpactAnalysisResponse(
            analysis_id=result['analysis_id'],
            query=request.query,
            status=result['status'],
            citations_count=0
        )
    else:
        result = impact_analysis_service.create_analysis(request.query)
        return ImpactAnalysisResponse(**result)

@router.get("/api/impact-analysis/{analysis_id}", response_model=ImpactAnalysisResponse)
def get_impact_analysis(analysis_id: str):
    """Get a specific impact analysis by ID."""
    analysis = impact_analysis_service.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return ImpactAnalysisResponse(**analysis)

@router.get("/api/impact-analysis/", response_model=List[ImpactAnalysisResponse])
def list_impact_analyses(
    limit: int = QueryParam(DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT)
):
    """List all impact analyses."""
    analyses = impact_analysis_service.list_analyses(limit)
    return [ImpactAnalysisResponse(**a) for a in analyses]

@router.delete("/api/impact-analysis/{analysis_id}")
def delete_impact_analysis(analysis_id: str):
    """Delete a specific impact analysis."""
    analysis = impact_analysis_service.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    impact_analysis_service.delete_analysis(analysis_id)
    return {"message": "Analysis deleted successfully"}

@router.get("/api/impact-analysis/{analysis_id}/status", response_model=AnalysisStatusResponse)
def get_analysis_status(analysis_id: str):
    """Get the status of a specific impact analysis."""
    status = impact_analysis_service.get_analysis_status(analysis_id)
    if status.get('status') == 'not_found':
        raise HTTPException(status_code=404, detail="Analysis not found")

    return AnalysisStatusResponse(
        analysis_id=analysis_id,
        status=status['status'],
        query=status['query'],
        citations_count=status['citations_count'],
        created_at=status.get('created_at')
    )

@router.post("/api/impact-analysis/{analysis_id}/regenerate", response_model=ImpactAnalysisResponse)
def regenerate_analysis(analysis_id: str):
    """Regenerate an existing impact analysis."""
    result = impact_analysis_service.regenerate_analysis(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return ImpactAnalysisResponse(**result)

@router.get("/api/impact-analysis/health/check")
def impact_analysis_health_check():
    """Health check endpoint for impact analysis service."""
    return {
        "status": "healthy",
        "service": "impact-analysis",
        "version": "1.0.0"
    }
