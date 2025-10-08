"""
FastAPI Backend for Policy Drafter UI
Strategy& PWC - AI Policy Drafter
"""

import os
import sys
from pathlib import Path
# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path to import config
sys.path.append(str(Path(__file__).parent.parent))
from policy_drafter.config import PolicyDrafterConfig

# Set OPENAI_API_KEY environment variable from config as fallback
os.environ["OPENAI_API_KEY"] = PolicyDrafterConfig.OPENAI_API_KEY

from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query as QueryParam
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import json
from policy_service import policy_service
from graph_service import graph_service
from contextual_search_service import contextual_search_service
from impact_analysis_service import impact_analysis_service
from news_scrape_service import news_scrape_service
from analytics_service import news_analytics_service

# Initialize FastAPI app
app = FastAPI(
    title="Policy Drafter API",
    description="Strategy& PWC AI-Powered Policy Drafting System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "https://ca-policy-frontend.whitestone-31d90b86.eastus.azurecontainerapps.io",  # Production frontend
        "https://ca-policy-frontend.whitestone-31d90b86.eastus.azurecontainerapps.io/"   # With trailing slash
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded password
ADMIN_PASSWORD = os.getenv("POLICY_DRAFTER_PASSWORD", "strategy2024")

# Pydantic models
class AuthRequest(BaseModel):
    password: str

class AuthResponse(BaseModel):
    success: bool
    message: str

class QueryRequest(BaseModel):
    query: str
    analysis_mode: str = "full"  # "full" or "research_only"

class GraphQueryRequest(BaseModel):
    query: str
    geography: str
    time_range: str
    intervention: Optional[str] = None

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
    blobUrls: List[Dict] = []
    durationMinutes: Optional[int] = 0
    citationsCount: Optional[int] = 0
    analysisMode: str = "full"

class ReportContent(BaseModel):
    content: str

class ReportInfo(BaseModel):
    name: str
    url: str
    size: Optional[int] = None

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
    timeRange: str = "2015–present"
    intervention: Optional[str] = None

class GraphContent(BaseModel):
    content: str
    contentType: str

# Contextual Search Models
class ContextualSearchRequest(BaseModel):
    query: str

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

class NewsScrapeRequest(BaseModel):
    query: str
    timeline: str = "last_6_months"

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

class AnalyticsRequest(BaseModel):
    query_id: str

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

# Impact Analysis Models
MIN_QUERY_LENGTH = 10
MAX_QUERY_LENGTH = 1000
DEFAULT_LIST_LIMIT = 50
MAX_LIST_LIMIT = 200

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
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class AnalysisStatusResponse(BaseModel):
    analysis_id: str
    status: str
    query: str
    citations_count: int
    created_at: Optional[str] = None
    message: Optional[str] = None

# Dependency for password verification (optional - can be done in frontend)
def verify_password(password: str) -> bool:
    return password == ADMIN_PASSWORD


# Routes
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

@app.post("/queries", response_model=QueryResponse)
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

@app.get("/queries/{query_id}", response_model=QueryStatus)
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

@app.get("/queries", response_model=List[QueryStatus])
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

@app.get("/queries/{query_id}/reports", response_model=List[ReportInfo])
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

@app.get("/queries/{query_id}/reports/{report_name}", response_model=ReportContent)
async def get_report_content(query_id: str, report_name: str):
    """Get the content of a specific report."""
    content = policy_service.get_report_content(query_id, report_name)
    
    if not content:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return ReportContent(content=content)

@app.delete("/queries/{query_id}")
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

@app.post("/admin/fix-stuck-queries")
async def fix_stuck_queries():
    """Admin endpoint to fix queries stuck in processing but with completed reports."""
    try:
        policy_service.fix_stuck_queries()
        return {"message": "Stuck query check and fix completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fixing stuck queries: {str(e)}")

@app.post("/admin/sync-query/{query_id}")
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

# Graph Builder endpoints
@app.post("/graphs", response_model=QueryResponse)
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

@app.get("/graphs/{query_id}", response_model=GraphStatus)
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
        timeRange=graph_data.get("timeRange", "2015–present"),
        intervention=graph_data.get("intervention")
    )

@app.get("/graphs", response_model=List[GraphStatus])
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
            timeRange=g.get("timeRange", "2015–present"),
            intervention=g.get("intervention")
        )
        for g in graphs
    ]

@app.get("/graphs/{query_id}/content/{content_type}", response_model=GraphContent)
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

@app.delete("/graphs/{query_id}")
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

# Contextual Search endpoints
@app.post("/contextual-searches", response_model=QueryResponse)
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

@app.get("/contextual-searches/{query_id}", response_model=ContextualSearchStatus)
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

@app.get("/contextual-searches", response_model=List[ContextualSearchStatus])
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

@app.get("/contextual-searches/{query_id}/content/{content_type}", response_model=ContextualSearchContent)
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

@app.delete("/contextual-searches/{query_id}")
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

# Impact Analysis endpoints
@app.post("/api/impact-analysis/", response_model=ImpactAnalysisResponse)
async def create_impact_analysis(request: ImpactAnalysisRequest):
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

@app.get("/api/impact-analysis/{analysis_id}", response_model=ImpactAnalysisResponse)
def get_impact_analysis(analysis_id: str):
    analysis = impact_analysis_service.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return ImpactAnalysisResponse(**analysis)

@app.get("/api/impact-analysis/", response_model=List[ImpactAnalysisResponse])
def list_impact_analyses(
    limit: int = QueryParam(DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT)
):
    analyses = impact_analysis_service.list_analyses(limit)
    return [ImpactAnalysisResponse(**a) for a in analyses]

@app.delete("/api/impact-analysis/{analysis_id}")
def delete_impact_analysis(analysis_id: str):
    analysis = impact_analysis_service.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    impact_analysis_service.delete_analysis(analysis_id)
    return {"message": "Analysis deleted successfully"}

@app.get("/api/impact-analysis/{analysis_id}/status", response_model=AnalysisStatusResponse)
def get_analysis_status(analysis_id: str):
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

@app.post("/api/impact-analysis/{analysis_id}/regenerate", response_model=ImpactAnalysisResponse)
def regenerate_analysis(analysis_id: str):
    result = impact_analysis_service.regenerate_analysis(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return ImpactAnalysisResponse(**result)

@app.get("/api/impact-analysis/health/check")
def impact_analysis_health_check():
    return {
        "status": "healthy",
        "service": "impact-analysis",
        "version": "1.0.0"
    }

@app.post("/news-scrapes", response_model=QueryResponse)
async def submit_news_scrape(request: NewsScrapeRequest):
    try:
        query_id = news_scrape_service.submit_news_scrape(request.query, request.timeline)
        return QueryResponse(
            queryId=query_id,
            message=f"News scrape submitted successfully. Processing news across geographic hierarchies (timeline: {request.timeline})."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit news scrape: {str(e)}")

@app.get("/news-scrapes/{query_id}", response_model=NewsScrapeStatus)
async def get_news_scrape_status(query_id: str):
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

@app.get("/news-scrapes", response_model=List[NewsScrapeStatus])
async def list_news_scrapes():
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

@app.get("/news-scrapes/{query_id}/content/{content_type}", response_model=NewsScrapeContent)
async def get_news_scrape_content(query_id: str, content_type: str):
    if content_type not in ["full", "hierarchy", "summaries", "citations"]:
        raise HTTPException(status_code=400, detail="Invalid content type")
    
    content = news_scrape_service.get_news_scrape_content(query_id, content_type)
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return NewsScrapeContent(content=content, contentType=content_type)

@app.delete("/news-scrapes/{query_id}")
async def delete_news_scrape(query_id: str):
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

@app.post("/news-scrapes/{query_id}/analytics", response_model=Dict)
async def submit_analytics_job(query_id: str):
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

@app.get("/news-scrapes/{query_id}/analytics/latest", response_model=AnalyticsStatus)
async def get_latest_analytics(query_id: str):
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

@app.get("/news-scrapes/{query_id}/analytics/{analytics_id}", response_model=AnalyticsStatus)
async def get_analytics_status(query_id: str, analytics_id: str):
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

@app.get("/news-scrapes/{query_id}/analytics/results/{analytics_type}", response_model=AnalyticsContent)
async def get_analytics_results(query_id: str, analytics_type: str):
    valid_types = ["clustering", "trends", "entities", "geo", "sentiment", "summary"]

    if analytics_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid analytics type. Must be one of: {', '.join(valid_types)}")

    results = news_analytics_service.get_analytics_results(query_id, analytics_type)

    if not results:
        raise HTTPException(status_code=404, detail="Analytics results not found")

    return AnalyticsContent(content=results, analytics_type=analytics_type)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Policy Drafter API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
