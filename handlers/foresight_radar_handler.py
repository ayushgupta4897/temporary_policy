"""
Foresight Radar Handler - Routes for foresight radar queries
Handles routes: /foresight-radars
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path

# Add parent directory to path to import services
sys.path.append(str(Path(__file__).parent.parent))
from services.foresight_radar_service import foresight_radar_service

# Create router
router = APIRouter()

# Pydantic models
class ForesightRadarRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    queryId: str
    message: str

class ForesightRadarStatus(BaseModel):
    queryId: str
    query: str
    displayTitle: Optional[str] = ""
    status: str
    createdAt: str
    completedAt: Optional[str] = None
    errorMessage: Optional[str] = None
    blobUrls: List[Dict] = []
    durationMinutes: Optional[int] = 0
    totalSearches: Optional[int] = 0
    uniqueCitations: Optional[int] = 0
    signalsCount: Optional[int] = 0
    scenariosCount: Optional[int] = 0
    watchlistCount: Optional[int] = 0
    batchSize: Optional[int] = 10

class ForesightRadarContent(BaseModel):
    content: str
    contentType: str

# Routes
@router.post("/foresight-radars", response_model=QueryResponse)
async def submit_foresight_radar(request: ForesightRadarRequest):
    """Submit a new foresight radar query."""
    query_id = foresight_radar_service.submit_foresight_radar(request.query)

    return QueryResponse(
        queryId=query_id,
        message=f"Foresight radar submitted successfully. Processing 25 high-trust source searches across STEEP-G framework."
    )

@router.get("/foresight-radars/{query_id}", response_model=ForesightRadarStatus)
async def get_foresight_radar_status(query_id: str):
    """Get the status of a specific foresight radar."""
    radar_data = foresight_radar_service.get_foresight_radar_status(query_id)

    if not radar_data:
        raise HTTPException(status_code=404, detail="Foresight radar not found")

    return ForesightRadarStatus(
        queryId=radar_data.get("queryId", radar_data.get("RowKey", query_id)),
        query=radar_data.get("query", ""),
        displayTitle=radar_data.get("displayTitle", ""),
        status=radar_data.get("status", "processing"),
        createdAt=radar_data.get("createdAt", ""),
        completedAt=radar_data.get("completedAt"),
        errorMessage=radar_data.get("errorMessage"),
        blobUrls=radar_data.get("blobUrls", []),
        durationMinutes=radar_data.get("durationMinutes", 0),
        totalSearches=radar_data.get("totalSearches", 0),
        uniqueCitations=radar_data.get("uniqueCitations", 0),
        signalsCount=radar_data.get("signalsCount", 0),
        scenariosCount=radar_data.get("scenariosCount", 0),
        watchlistCount=radar_data.get("watchlistCount", 0),
        batchSize=radar_data.get("batchSize", 10)
    )

@router.get("/foresight-radars", response_model=List[ForesightRadarStatus])
async def list_foresight_radars():
    """List all foresight radar queries."""
    radars = foresight_radar_service.list_foresight_radars()

    result = []
    for r in radars:
        result.append(ForesightRadarStatus(
            queryId=r.get("queryId", r.get("RowKey", "")),
            query=r.get("query", ""),
            displayTitle=r.get("displayTitle", ""),
            status=r.get("status", "processing"),
            createdAt=r.get("createdAt", ""),
            completedAt=r.get("completedAt"),
            errorMessage=r.get("errorMessage"),
            blobUrls=[],  # Don't include blob URLs in list view for performance
            durationMinutes=r.get("durationMinutes", 0),
            totalSearches=r.get("totalSearches", 0),
            uniqueCitations=r.get("uniqueCitations", 0),
            signalsCount=r.get("signalsCount", 0),
            scenariosCount=r.get("scenariosCount", 0),
            watchlistCount=r.get("watchlistCount", 0),
            batchSize=r.get("batchSize", 10)
        ))

    return result

@router.get("/foresight-radars/{query_id}/content/{content_type}", response_model=ForesightRadarContent)
async def get_foresight_radar_content(query_id: str, content_type: str):
    """Get specific content for a foresight radar.

    Content types: radar_json, brief, citations, signals, scenarios, watchlist
    """
    valid_types = ["radar_json", "brief", "citations", "signals", "scenarios", "watchlist"]

    if content_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid content type. Must be one of: {', '.join(valid_types)}")

    content = foresight_radar_service.get_foresight_radar_content(query_id, content_type)

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return ForesightRadarContent(content=content, contentType=content_type)

@router.delete("/foresight-radars/{query_id}")
async def delete_foresight_radar(query_id: str):
    """Delete a foresight radar and all its content."""
    radar_data = foresight_radar_service.get_foresight_radar_status(query_id)
    if not radar_data:
        raise HTTPException(status_code=404, detail="Foresight radar not found")

    success = foresight_radar_service.delete_foresight_radar(query_id)

    if success:
        return {"message": f"Foresight radar {query_id} deleted successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete foresight radar")
