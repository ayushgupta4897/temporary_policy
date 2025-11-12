"""
DSM Handler - FastAPI routes for Dynamic Systems Modeler
Handles routes: /dsm/*
"""

from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict
import sys
from pathlib import Path
import json

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))
from services.dsm_service import dsm_service

# Create router
router = APIRouter()

# ============================================================================
# Pydantic Models
# ============================================================================


class ParentCategorySuggestionRequest(BaseModel):
    main_query: str


class ParentCategorySuggestionResponse(BaseModel):
    categories: List[str]


class TaxonomyGenerationRequest(BaseModel):
    main_query: str
    parent_categories: List[str]


class BaseGraphRequest(BaseModel):
    main_query: str
    taxonomy: Dict


class InterventionRequest(BaseModel):
    base_graph_id: str
    intervention_name: str
    intervention_details: Optional[Dict] = None


class QueryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    query_id: str = Field(serialization_alias='queryId')
    message: str


class DSMQueryStatus(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    query_id: str = Field(serialization_alias='queryId')
    query: str
    display_title: str = Field(serialization_alias='displayTitle')
    status: str  # processing, done, failed
    stage: str  # taxonomy_generation, taxonomy_ready, base_graph_building, base_graph_ready, intervention_building, intervention_ready
    created_at: str = Field(serialization_alias='createdAt')
    completed_at: Optional[str] = Field(default=None, serialization_alias='completedAt')
    error_message: Optional[str] = Field(default=None, serialization_alias='errorMessage')

    # Metadata
    is_base_graph: Optional[bool] = Field(default=False, serialization_alias='isBaseGraph')
    base_graph_id: Optional[str] = Field(default=None, serialization_alias='baseGraphId')
    intervention: Optional[str] = None
    intervention_details: Optional[Dict] = Field(default=None, serialization_alias='interventionDetails')

    # Graph stats
    node_count: Optional[int] = Field(default=0, serialization_alias='nodeCount')
    edge_count: Optional[int] = Field(default=0, serialization_alias='edgeCount')
    nodes_changed: Optional[int] = Field(default=0, serialization_alias='nodesChanged')
    edges_changed: Optional[int] = Field(default=0, serialization_alias='edgesChanged')

    # Taxonomy
    total_children: Optional[int] = Field(default=0, serialization_alias='totalChildren')


class ContentResponse(BaseModel):
    content: str
    content_type: str


# ============================================================================
# Routes
# ============================================================================


@router.post("/dsm/suggest-categories", response_model=ParentCategorySuggestionResponse)
async def suggest_parent_categories(request: ParentCategorySuggestionRequest):
    """
    Generate LLM-suggested parent categories based on the main query.

    This is called before taxonomy generation to provide intelligent defaults
    instead of hardcoded categories.
    """
    try:
        categories = dsm_service.suggest_parent_categories(request.main_query)

        return ParentCategorySuggestionResponse(categories=categories)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dsm/taxonomy", response_model=QueryResponse)
async def generate_taxonomy(request: TaxonomyGenerationRequest):
    """
    Generate custom taxonomy from parent categories.

    Step 1 of DSM workflow.
    """
    try:
        # Validate input
        if len(request.parent_categories) != 10:
            raise HTTPException(
                status_code=400,
                detail="Exactly 10 parent categories required"
            )

        query_id = dsm_service.submit_taxonomy_generation(
            request.main_query,
            request.parent_categories
        )

        return QueryResponse(
            query_id=query_id,
            message="Taxonomy generation started. This will take 2-3 minutes."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dsm/base-graph", response_model=QueryResponse)
async def build_base_graph(request: BaseGraphRequest):
    """
    Build base graph from custom taxonomy.

    Step 2 of DSM workflow.
    """
    try:
        query_id = dsm_service.submit_base_graph(
            request.main_query,
            request.taxonomy
        )

        return QueryResponse(
            query_id=query_id,
            message="Base graph construction started. This will take 10-15 minutes."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dsm/intervention", response_model=QueryResponse)
async def create_intervention(request: InterventionRequest):
    """
    Create intervention scenario graph.

    Step 3 of DSM workflow (can be repeated multiple times).
    """
    try:
        query_id = dsm_service.submit_intervention(
            request.base_graph_id,
            request.intervention_name,
            request.intervention_details
        )

        return QueryResponse(
            query_id=query_id,
            message=f"Intervention '{request.intervention_name}' analysis started. This will take 10-15 minutes."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dsm/queries/{query_id}", response_model=DSMQueryStatus)
async def get_query_status(query_id: str):
    """Get status of a specific DSM query."""
    query_data = dsm_service.get_query(query_id)

    if not query_data:
        raise HTTPException(status_code=404, detail="Query not found")

    return _map_to_status_model(query_data)


@router.get("/dsm/base-graphs", response_model=List[DSMQueryStatus])
async def list_base_graphs():
    """List all base graphs."""
    queries = dsm_service.list_base_graphs()
    return [_map_to_status_model(q) for q in queries]


@router.get("/dsm/interventions/{base_graph_id}", response_model=List[DSMQueryStatus])
async def list_interventions(base_graph_id: str):
    """List all interventions for a base graph."""
    interventions = dsm_service.list_interventions(base_graph_id)
    return [_map_to_status_model(i) for i in interventions]


@router.get("/dsm/content/{query_id}/{content_type}", response_model=ContentResponse)
async def get_content(query_id: str, content_type: str):
    """
    Get content for a query.

    Content types:
    - taxonomy: Custom taxonomy JSON
    - base_graph: Base graph JSON
    - intervention_graph: Intervention graph JSON
    - delta: Delta analysis JSON
    - executive: Executive summary (markdown)
    - csv: Data tables (CSV)
    - visualization: Interactive HTML (dense graph)
    - hierarchical: Interactive HTML (hierarchical collapsible view)
    - node_analyses: Node deep dive analyses JSON
    """
    valid_types = [
        "taxonomy", "base_graph", "intervention_graph",
        "delta", "executive", "csv", "visualization", "hierarchical",
        "node_analyses"
    ]

    if content_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid content type. Valid types: {valid_types}")

    content = dsm_service.get_graph_content(query_id, content_type)

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return ContentResponse(
        content=content,
        content_type=content_type
    )


@router.delete("/dsm/queries/{query_id}")
async def delete_query(query_id: str):
    """Delete a DSM query and all associated content."""
    try:
        query_data = dsm_service.get_query(query_id)
        if not query_data:
            raise HTTPException(status_code=404, detail="Query not found")

        success = dsm_service.delete_query(query_id)

        if success:
            return {"message": f"Query {query_id} deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete query")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Helper Functions
# ============================================================================


def _map_to_status_model(query_data: Dict) -> DSMQueryStatus:
    """Map query data to status model."""
    # Parse intervention_details if it's a JSON string
    intervention_details = query_data.get("intervention_details")
    if isinstance(intervention_details, str):
        try:
            intervention_details = json.loads(intervention_details) if intervention_details else None
        except:
            intervention_details = None

    return DSMQueryStatus(
        query_id=query_data.get("queryId", query_data.get("RowKey", "")),
        query=query_data.get("query", ""),
        display_title=query_data.get("displayTitle", ""),
        status=query_data.get("status", "processing"),
        stage=query_data.get("stage", "unknown"),
        created_at=query_data.get("createdAt", ""),
        completed_at=query_data.get("completedAt"),
        error_message=query_data.get("errorMessage"),
        is_base_graph=query_data.get("is_base_graph", False),
        base_graph_id=query_data.get("base_graph_id"),
        intervention=query_data.get("intervention"),
        intervention_details=intervention_details,
        node_count=query_data.get("node_count", 0),
        edge_count=query_data.get("edge_count", 0),
        nodes_changed=query_data.get("nodes_changed", 0),
        edges_changed=query_data.get("edges_changed", 0),
        total_children=query_data.get("total_children", 0)
    )
