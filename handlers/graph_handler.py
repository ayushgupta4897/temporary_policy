"""
Graph Handler - Routes for graph building queries
Handles routes: /graphs
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path

# Add parent directory to path to import services
sys.path.append(str(Path(__file__).parent.parent))
from services.graph_service import graph_service

# Create router
router = APIRouter()

# Pydantic models
class GraphQueryRequest(BaseModel):
    query: str
    geography: str
    time_range: str
    intervention: Optional[str] = None

class QueryResponse(BaseModel):
    queryId: str
    message: str

class PipelineStep(BaseModel):
    id: str
    name: str
    description: str
    state: str  # pending, in_progress, completed, error
    timestamp: Optional[str] = None

class GraphStatus(BaseModel):
    queryId: str
    query: str
    displayTitle: Optional[str] = ""
    status: str
    createdAt: str
    completedAt: Optional[str] = None
    errorMessage: Optional[str] = None
    blobUrls: List[Dict] = []
    durationMinutes: Optional[int] = 0
    nodeCount: Optional[int] = 0
    edgeCount: Optional[int] = 0
    geography: str = "Dubai, UAE"
    timeRange: str = "2015present"
    intervention: Optional[str] = None
    progress: Optional[int] = 0
    currentStep: Optional[str] = "Initializing"
    steps: List[PipelineStep] = []

class GraphContent(BaseModel):
    content: str
    contentType: str

# Routes
@router.post("/graphs", response_model=QueryResponse)
async def submit_graph_query(graph_req: GraphQueryRequest):
    """Submit a new graph building query."""
    try:
        query_id = graph_service.submit_graph_query(
            graph_req.query,
            graph_req.geography,
            graph_req.time_range,
            graph_req.intervention
        )

        return QueryResponse(
            queryId=query_id,
            message="Graph query submitted successfully. Analysis started."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit graph query: {str(e)}")

@router.get("/graphs/{query_id}", response_model=GraphStatus)
async def get_graph_status(query_id: str):
    """Get the status of a specific graph query."""
    graph_data = graph_service.get_graph_status(query_id)

    if not graph_data:
        raise HTTPException(status_code=404, detail="Graph query not found")

    return GraphStatus(
        queryId=graph_data.get("queryId", graph_data["RowKey"]),
        query=graph_data["query"],
        displayTitle=graph_data.get("displayTitle", ""),
        status=graph_data["status"],
        createdAt=graph_data["createdAt"],
        completedAt=graph_data.get("completedAt"),
        errorMessage=graph_data.get("errorMessage"),
        blobUrls=graph_data.get("blobUrls", []),
        durationMinutes=graph_data.get("durationMinutes", 0),
        nodeCount=graph_data.get("nodeCount", 0),
        edgeCount=graph_data.get("edgeCount", 0),
        geography=graph_data.get("geography", "Dubai, UAE"),
        timeRange=graph_data.get("timeRange", "2015present"),
        intervention=graph_data.get("intervention"),
        progress=graph_data.get("progress", 0),
        currentStep=graph_data.get("currentStep", "Initializing"),
        steps=graph_data.get("steps", [])
    )

@router.get("/graphs", response_model=List[GraphStatus])
async def list_graph_queries():
    """List all graph queries."""
    graphs = graph_service.list_graph_queries()

    return [
        GraphStatus(
            queryId=g["queryId"],
            query=g["query"],
            displayTitle=g.get("displayTitle", ""),
            status=g["status"],
            createdAt=g["createdAt"],
            completedAt=g.get("completedAt"),
            errorMessage=g.get("errorMessage"),
            blobUrls=[],
            durationMinutes=g.get("durationMinutes", 0),
            nodeCount=g.get("nodeCount", 0),
            edgeCount=g.get("edgeCount", 0),
            geography=g.get("geography", "Dubai, UAE"),
            timeRange=g.get("timeRange", "2015present"),
            intervention=g.get("intervention"),
            progress=g.get("progress", 0),
            currentStep=g.get("currentStep", "Initializing"),
            steps=g.get("steps", [])
        )
        for g in graphs
    ]

@router.get("/graphs/{query_id}/content/{content_type}", response_model=GraphContent)
async def get_graph_content(query_id: str, content_type: str):
    """Get specific content for a graph query.

    Content types: interactive, json, csv, executive, full
    """
    if content_type not in ["interactive", "json", "csv", "executive", "full"]:
        raise HTTPException(status_code=400, detail="Invalid content type")

    content = graph_service.get_graph_content(query_id, content_type)

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return GraphContent(content=content, contentType=content_type)

@router.delete("/graphs/{query_id}")
async def delete_graph_query(query_id: str):
    """Delete a graph query and all its content."""
    try:
        graph_data = graph_service.get_graph_status(query_id)
        if not graph_data:
            raise HTTPException(status_code=404, detail="Graph query not found")

        success = graph_service.delete_graph_query(query_id)

        if success:
            return {"message": f"Graph query {query_id} deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete graph query")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete graph query: {str(e)}")
