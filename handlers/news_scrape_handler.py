"""
News Scrape Handler - Routes for news scraping queries
Handles routes: /news-scrapes (excluding analytics routes)
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path
import json

# Add parent directory to path to import services
sys.path.append(str(Path(__file__).parent.parent))
from services.news_scrape_service import news_scrape_service

# Create router
router = APIRouter()

# Pydantic models
class NewsScrapeRequest(BaseModel):
    query: str
    timeline: str = "last_6_months"

class QueryResponse(BaseModel):
    queryId: str
    message: str

class NewsScrapeStatus(BaseModel):
    queryId: str
    query: str
    displayTitle: Optional[str] = ""
    status: str
    createdAt: str
    completedAt: Optional[str] = None
    errorMessage: Optional[str] = None
    blobUrls: List[Dict] = []
    durationMinutes: Optional[int] = 0
    totalCitations: Optional[int] = 0
    hierarchies: List[str] = []
    geographiesCount: Optional[int] = 0
    timeline: Optional[str] = "last_6_months"

class NewsScrapeContent(BaseModel):
    content: str
    contentType: str

# Routes
@router.post("/news-scrapes", response_model=QueryResponse)
async def submit_news_scrape(request: NewsScrapeRequest):
    """Submit a new news scrape query."""
    try:
        query_id = news_scrape_service.submit_news_scrape(request.query, request.timeline)
        return QueryResponse(
            queryId=query_id,
            message=f"News scrape submitted successfully. Processing news across geographic hierarchies (timeline: {request.timeline})."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit news scrape: {str(e)}")

@router.get("/news-scrapes/{query_id}", response_model=NewsScrapeStatus)
async def get_news_scrape_status(query_id: str):
    """Get the status of a specific news scrape."""
    scrape_data = news_scrape_service.get_news_scrape_status(query_id)

    if not scrape_data:
        raise HTTPException(status_code=404, detail="News scrape not found")

    hierarchies_raw = scrape_data.get("hierarchies", "[]")
    if isinstance(hierarchies_raw, str):
        try:
            hierarchies = json.loads(hierarchies_raw)
        except:
            hierarchies = []
    elif isinstance(hierarchies_raw, list):
        hierarchies = hierarchies_raw
    else:
        hierarchies = []

    return NewsScrapeStatus(
        queryId=scrape_data.get("queryId", scrape_data.get("RowKey", query_id)),
        query=scrape_data.get("query", ""),
        displayTitle=scrape_data.get("displayTitle", ""),
        status=scrape_data.get("status", "processing"),
        createdAt=scrape_data.get("createdAt", ""),
        completedAt=scrape_data.get("completedAt"),
        errorMessage=scrape_data.get("errorMessage"),
        blobUrls=scrape_data.get("blobUrls", []),
        durationMinutes=scrape_data.get("durationMinutes", 0),
        totalCitations=scrape_data.get("totalCitations", 0),
        hierarchies=hierarchies,
        geographiesCount=scrape_data.get("geographiesCount", 0),
        timeline=scrape_data.get("timeline", "last_6_months")
    )

@router.get("/news-scrapes", response_model=List[NewsScrapeStatus])
async def list_news_scrapes():
    """List all news scrapes."""
    scrapes = news_scrape_service.list_news_scrapes()

    result = []
    for s in scrapes:
        hierarchies_raw = s.get("hierarchies", "[]")
        if isinstance(hierarchies_raw, str):
            try:
                hierarchies = json.loads(hierarchies_raw)
            except:
                hierarchies = []
        elif isinstance(hierarchies_raw, list):
            hierarchies = hierarchies_raw
        else:
            hierarchies = []

        result.append(NewsScrapeStatus(
            queryId=s.get("queryId", s.get("RowKey", "")),
            query=s.get("query", ""),
            displayTitle=s.get("displayTitle", ""),
            status=s.get("status", "processing"),
            createdAt=s.get("createdAt", ""),
            completedAt=s.get("completedAt"),
            errorMessage=s.get("errorMessage"),
            blobUrls=[],
            durationMinutes=s.get("durationMinutes", 0),
            totalCitations=s.get("totalCitations", 0),
            hierarchies=hierarchies,
            geographiesCount=s.get("geographiesCount", 0),
            timeline=s.get("timeline", "last_6_months")
        ))

    return result

@router.get("/news-scrapes/{query_id}/content/{content_type}", response_model=NewsScrapeContent)
async def get_news_scrape_content(query_id: str, content_type: str):
    """Get specific content for a news scrape.

    Content types: full, hierarchy, summaries, citations
    """
    if content_type not in ["full", "hierarchy", "summaries", "citations"]:
        raise HTTPException(status_code=400, detail="Invalid content type")

    content = news_scrape_service.get_news_scrape_content(query_id, content_type)

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return NewsScrapeContent(content=content, contentType=content_type)

@router.delete("/news-scrapes/{query_id}")
async def delete_news_scrape(query_id: str):
    """Delete a news scrape and all its content."""
    try:
        scrape_data = news_scrape_service.get_news_scrape_status(query_id)
        if not scrape_data:
            raise HTTPException(status_code=404, detail="News scrape not found")

        success = news_scrape_service.delete_news_scrape(query_id)

        if success:
            return {"message": f"News scrape {query_id} deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete news scrape")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete news scrape: {str(e)}")
