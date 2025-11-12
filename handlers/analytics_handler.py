"""
Analytics Handler - Routes for news scrape analytics
Handles routes: /news-scrapes/{query_id}/analytics
"""

from typing import Optional, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path
import json

# Add parent directory to path to import services
sys.path.append(str(Path(__file__).parent.parent))
from services.analytics_service import news_analytics_service
from services.news_scrape_service import news_scrape_service

# Create router
router = APIRouter()

# Pydantic models
class AnalyticsStatus(BaseModel):
    analytics_id: str
    query_id: str
    status: str
    createdAt: str
    completedAt: Optional[str] = None
    articlesFetched: Optional[int] = 0
    clusterCount: Optional[int] = 0
    entityCount: Optional[int] = 0
    processingTimeSeconds: Optional[float] = 0.0

class AnalyticsContent(BaseModel):
    content: Dict
    analytics_type: str

# Routes
@router.post("/news-scrapes/{query_id}/analytics", response_model=Dict)
async def submit_analytics_job(query_id: str):
    """Submit an analytics job for a completed news scrape."""
    try:
        scrape_data = news_scrape_service.get_news_scrape_status(query_id)
        if not scrape_data:
            raise HTTPException(status_code=404, detail="News scrape not found")

        if scrape_data.get("status") != "done":
            raise HTTPException(status_code=400, detail="News scrape must be completed before running analytics")

        citations_content = news_scrape_service.get_news_scrape_content(query_id, "citations")
        if not citations_content:
            raise HTTPException(status_code=404, detail="No citations found for this news scrape")

        citations_data = json.loads(citations_content)
        citations = citations_data.get("citations", [])

        analytics_id = news_analytics_service.submit_analytics_job(query_id, citations)

        return {
            "analytics_id": analytics_id,
            "query_id": query_id,
            "message": f"Analytics job submitted. Processing {len(citations)} citations."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit analytics job: {str(e)}")

@router.get("/news-scrapes/{query_id}/analytics/latest", response_model=AnalyticsStatus)
async def get_latest_analytics(query_id: str):
    """Get the latest analytics for a news scrape query."""
    status_data = news_analytics_service.get_latest_analytics(query_id)

    if not status_data:
        raise HTTPException(status_code=404, detail="No analytics found for this query")

    return AnalyticsStatus(
        analytics_id=status_data.get("analytics_id", status_data.get("RowKey", "")),
        query_id=query_id,
        status=status_data.get("status", "processing"),
        createdAt=status_data.get("createdAt", ""),
        completedAt=status_data.get("completedAt"),
        articlesFetched=status_data.get("articlesFetched", 0),
        clusterCount=status_data.get("clusterCount", 0),
        entityCount=status_data.get("entityCount", 0),
        processingTimeSeconds=status_data.get("processingTimeSeconds", 0.0)
    )

@router.get("/news-scrapes/{query_id}/analytics/{analytics_id}", response_model=AnalyticsStatus)
async def get_analytics_status(query_id: str, analytics_id: str):
    """Get the status of a specific analytics job."""
    status_data = news_analytics_service.get_analytics_status(query_id, analytics_id)

    if not status_data:
        raise HTTPException(status_code=404, detail="Analytics job not found")

    return AnalyticsStatus(
        analytics_id=status_data.get("RowKey", analytics_id),
        query_id=query_id,
        status=status_data.get("status", "processing"),
        createdAt=status_data.get("createdAt", ""),
        completedAt=status_data.get("completedAt"),
        articlesFetched=status_data.get("articlesFetched", 0),
        clusterCount=status_data.get("clusterCount", 0),
        entityCount=status_data.get("entityCount", 0),
        processingTimeSeconds=status_data.get("processingTimeSeconds", 0.0)
    )

@router.get("/news-scrapes/{query_id}/analytics/results/{analytics_type}", response_model=AnalyticsContent)
async def get_analytics_results(query_id: str, analytics_type: str):
    """Get analytics results for a specific analytics type.

    Analytics types: clustering, trends, entities, geo, sentiment, summary
    """
    valid_types = ["clustering", "trends", "entities", "geo", "sentiment", "summary"]

    if analytics_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid analytics type. Must be one of: {', '.join(valid_types)}")

    results = news_analytics_service.get_analytics_results(query_id, analytics_type)

    if not results:
        raise HTTPException(status_code=404, detail="Analytics results not found")

    return AnalyticsContent(content=results, analytics_type=analytics_type)
