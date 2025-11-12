"""
Contextual Search Handler - Routes for contextual web searches
Handles routes: /contextual-searches
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path

# Add parent directory to path to import services
sys.path.append(str(Path(__file__).parent.parent))
from services.contextual_search_service import contextual_search_service

# Create router
router = APIRouter()

# Pydantic models
class ContextualSearchRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    queryId: str
    message: str

class ContextualSearchStatus(BaseModel):
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
    sourceTiersCovered: Optional[int] = 0
    batchSize: Optional[int] = 10

class ContextualSearchContent(BaseModel):
    content: str
    contentType: str

# Routes
@router.post("/contextual-searches", response_model=QueryResponse)
async def submit_contextual_search(search_req: ContextualSearchRequest):
    """Submit a new contextual web search query."""
    try:
        query_id = contextual_search_service.submit_contextual_search(search_req.query)

        return QueryResponse(
            queryId=query_id,
            message=f"Contextual search submitted successfully. Processing {30} search streams across multiple source tiers."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit contextual search: {str(e)}")

@router.get("/contextual-searches/{query_id}", response_model=ContextualSearchStatus)
async def get_contextual_search_status(query_id: str):
    """Get the status of a specific contextual search."""
    search_data = contextual_search_service.get_contextual_search_status(query_id)

    if not search_data:
        raise HTTPException(status_code=404, detail="Contextual search not found")

    return ContextualSearchStatus(
        queryId=search_data.get("queryId", search_data["RowKey"]),
        query=search_data["query"],
        displayTitle=search_data.get("displayTitle", ""),
        status=search_data["status"],
        createdAt=search_data["createdAt"],
        completedAt=search_data.get("completedAt"),
        errorMessage=search_data.get("errorMessage"),
        blobUrls=search_data.get("blobUrls", []),
        durationMinutes=search_data.get("durationMinutes", 0),
        totalSearches=search_data.get("totalSearches", 0),
        uniqueCitations=search_data.get("uniqueCitations", 0),
        sourceTiersCovered=search_data.get("sourceTiersCovered", 0),
        batchSize=search_data.get("batchSize", 10)
    )

@router.get("/contextual-searches", response_model=List[ContextualSearchStatus])
async def list_contextual_searches():
    """List all contextual searches."""
    searches = contextual_search_service.list_contextual_searches()

    return [
        ContextualSearchStatus(
            queryId=s["queryId"],
            query=s["query"],
            displayTitle=s.get("displayTitle", ""),
            status=s["status"],
            createdAt=s["createdAt"],
            completedAt=s.get("completedAt"),
            errorMessage=s.get("errorMessage"),
            blobUrls=[],  # Don't include blob URLs in list view for performance
            durationMinutes=s.get("durationMinutes", 0),
            totalSearches=s.get("totalSearches", 0),
            uniqueCitations=s.get("uniqueCitations", 0),
            sourceTiersCovered=s.get("sourceTiersCovered", 0),
            batchSize=s.get("batchSize", 10)
        )
        for s in searches
    ]

@router.get("/contextual-searches/{query_id}/content/{content_type}", response_model=ContextualSearchContent)
async def get_contextual_search_content(query_id: str, content_type: str):
    """Get specific content for a contextual search.

    Content types: results, citations, tier_analysis, raw_data
    """
    if content_type not in ["results", "citations", "tier_analysis", "raw_data"]:
        raise HTTPException(status_code=400, detail="Invalid content type")

    content = contextual_search_service.get_contextual_search_content(query_id, content_type)

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return ContextualSearchContent(content=content, contentType=content_type)

@router.delete("/contextual-searches/{query_id}")
async def delete_contextual_search(query_id: str):
    """Delete a contextual search and all its content."""
    try:
        search_data = contextual_search_service.get_contextual_search_status(query_id)
        if not search_data:
            raise HTTPException(status_code=404, detail="Contextual search not found")

        success = contextual_search_service.delete_contextual_search(query_id)

        if success:
            return {"message": f"Contextual search {query_id} deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete contextual search")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete contextual search: {str(e)}")
