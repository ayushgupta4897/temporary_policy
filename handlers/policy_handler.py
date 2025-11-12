"""
Policy Handler - Routes for policy queries and admin operations
Handles routes: /queries and /admin
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path

# Add parent directory to path to import services
sys.path.append(str(Path(__file__).parent.parent))
from services.policy_service import policy_service

# Create router with prefix and tags
router = APIRouter()

# Pydantic models
class QueryRequest(BaseModel):
    query: str
    analysis_mode: str = "full"  # "full" or "research_only"

class QueryResponse(BaseModel):
    queryId: str
    message: str

class QueryStatus(BaseModel):
    queryId: str
    query: str
    displayTitle: Optional[str] = ""
    status: str
    createdAt: str
    completedAt: Optional[str] = None
    errorMessage: Optional[str] = None
    blobUrls: List[dict] = []
    durationMinutes: Optional[int] = 0
    citationsCount: Optional[int] = 0
    analysisMode: str = "full"

class ReportContent(BaseModel):
    content: str

class ReportInfo(BaseModel):
    name: str
    url: str
    size: Optional[int] = None

class VisualizationRequest(BaseModel):
    force_regenerate: bool = False

class VisualizationResponse(BaseModel):
    visualization_data: dict
    cached: bool

# Routes
@router.post("/queries", response_model=QueryResponse)
async def submit_query(query_req: QueryRequest):
    """Submit a new policy query for processing."""
    try:
        # Validate analysis mode
        if query_req.analysis_mode not in ["full", "research_only"]:
            raise HTTPException(status_code=400, detail="Invalid analysis mode. Must be 'full' or 'research_only'")

        query_id = policy_service.submit_query(query_req.query, query_req.analysis_mode)

        mode_description = "full policy analysis" if query_req.analysis_mode == "full" else "research-only analysis"
        return QueryResponse(
            queryId=query_id,
            message=f"Query submitted successfully. {mode_description.title()} started."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit query: {str(e)}")

@router.get("/queries/{query_id}", response_model=QueryStatus)
async def get_query_status(query_id: str):
    """Get the status of a specific query."""
    query_data = policy_service.get_query_status(query_id)

    if not query_data:
        raise HTTPException(status_code=404, detail="Query not found")

    return QueryStatus(
        queryId=query_data.get("queryId", query_data["RowKey"]),
        query=query_data["query"],
        displayTitle=query_data.get("displayTitle", ""),
        status=query_data["status"],
        createdAt=query_data["createdAt"],
        completedAt=query_data.get("completedAt"),
        errorMessage=query_data.get("errorMessage"),
        blobUrls=query_data.get("blobUrls", []),
        durationMinutes=query_data.get("durationMinutes", 0),
        citationsCount=query_data.get("citationsCount", 0),
        analysisMode=query_data.get("analysisMode") or "full"
    )

@router.get("/queries", response_model=List[QueryStatus])
async def list_queries():
    """List all queries."""
    queries = policy_service.list_queries()

    return [
        QueryStatus(
            queryId=q["queryId"],
            query=q["query"],
            displayTitle=q.get("displayTitle", ""),
            status=q["status"],
            createdAt=q["createdAt"],
            completedAt=q.get("completedAt"),
            errorMessage=q.get("errorMessage"),
            blobUrls=[],  # Don't include blob URLs in list view for performance
            durationMinutes=q.get("durationMinutes", 0),
            citationsCount=q.get("citationsCount", 0),
            analysisMode=q.get("analysisMode") or "full"
        )
        for q in queries
    ]

@router.get("/queries/{query_id}/reports", response_model=List[ReportInfo])
async def list_reports(query_id: str):
    """Get a list of all reports available for a specific query."""
    try:
        # First check if the query exists
        query_data = policy_service.get_query_status(query_id)
        if not query_data:
            raise HTTPException(status_code=404, detail="Query not found")

        # Get list of reports for this query
        report_names = policy_service.list_reports(query_id)

        reports = []
        for report_name in report_names:
            reports.append(ReportInfo(
                name=report_name,
                url=f"/queries/{query_id}/reports/{report_name}",
                size=None  # Could be enhanced to include file size
            ))

        return reports

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {str(e)}")

@router.get("/queries/{query_id}/reports/{report_name}", response_model=ReportContent)
async def get_report_content(query_id: str, report_name: str):
    """Get the content of a specific report."""
    content = policy_service.get_report_content(query_id, report_name)

    if not content:
        raise HTTPException(status_code=404, detail="Report not found")

    return ReportContent(content=content)

@router.delete("/queries/{query_id}")
async def delete_query(query_id: str):
    """Delete a specific query and all its associated reports."""
    try:
        # Check if query exists first
        query_data = policy_service.get_query_status(query_id)
        if not query_data:
            raise HTTPException(status_code=404, detail="Query not found")

        # Delete the query and its reports
        success = policy_service.delete_query(query_id)

        if success:
            return {"message": f"Query {query_id} deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete query")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete query: {str(e)}")

@router.post("/admin/fix-stuck-queries")
async def fix_stuck_queries():
    """Admin endpoint to fix queries stuck in processing but with completed reports."""
    try:
        policy_service.fix_stuck_queries()
        return {"message": "Stuck query check and fix completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fixing stuck queries: {str(e)}")

@router.post("/admin/sync-query/{query_id}")
async def sync_query(query_id: str):
    """Admin endpoint to manually sync reports for a specific query from production."""
    try:
        synced_reports = policy_service.sync_reports_from_production(query_id)
        return {
            "message": f"Sync completed for query {query_id}",
            "synced_reports": synced_reports,
            "report_count": len(synced_reports)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing query {query_id}: {str(e)}")

@router.post("/queries/{query_id}/visualization", response_model=VisualizationResponse)
async def generate_visualization(query_id: str, request: VisualizationRequest = VisualizationRequest()):
    """
    Generate or retrieve visualization data for a query's analytics report.

    This endpoint:
    1. Checks if visualization data is already cached in blob storage
    2. If not cached or force_regenerate=True, extracts data from analytics_report.md via LLM
    3. Caches the result in blob storage as chart_data.json
    4. Returns Recharts-compatible JSON for frontend visualization

    Only works for queries with analysisMode='full' (requires analytics_report.md)
    """
    try:
        # Check if query exists
        query_data = policy_service.get_query_status(query_id)
        if not query_data:
            raise HTTPException(status_code=404, detail="Query not found")

        # Verify query is in full analysis mode
        analysis_mode = query_data.get("analysisMode") or "full"
        if analysis_mode != "full":
            raise HTTPException(
                status_code=400,
                detail="Visualization is only available for full analysis mode queries"
            )

        # Verify query is completed (backend uses "done" status)
        if query_data["status"] != "done":
            raise HTTPException(
                status_code=400,
                detail=f"Query is not completed yet. Current status: {query_data['status']}"
            )

        # Generate or retrieve visualization data
        visualization_data = policy_service.generate_visualization(
            query_id=query_id,
            force_regenerate=request.force_regenerate
        )

        if not visualization_data:
            raise HTTPException(
                status_code=404,
                detail="Could not generate visualization. Analytics report may be missing."
            )

        return VisualizationResponse(
            visualization_data=visualization_data["data"],
            cached=visualization_data["cached"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate visualization: {str(e)}")

@router.get("/queries/{query_id}/visualization/status")
async def check_visualization_status(query_id: str):
    """
    Check if visualization data exists for a query without generating it.

    Returns:
        - exists: bool (whether cached visualization data exists)
        - available: bool (whether visualization can be generated - full mode + completed)
        - reason: str (explanation if not available)
    """
    try:
        # Check if query exists
        query_data = policy_service.get_query_status(query_id)
        if not query_data:
            raise HTTPException(status_code=404, detail="Query not found")

        # Check if visualization data is cached
        has_cached = policy_service.has_cached_visualization(query_id)

        # Check if visualization can be generated (backend uses "done" status)
        analysis_mode = query_data.get("analysisMode") or "full"
        status = query_data["status"]

        can_generate = analysis_mode == "full" and status == "done"

        reason = ""
        if not can_generate:
            if analysis_mode != "full":
                reason = "Visualization only available for full analysis mode"
            elif status != "done":
                reason = f"Query not completed yet (status: {status})"

        return {
            "exists": has_cached,
            "available": can_generate,
            "reason": reason,
            "analysisMode": analysis_mode,
            "status": status
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check visualization status: {str(e)}")
