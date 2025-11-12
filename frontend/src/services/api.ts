import {
  AuthRequest,
  AuthResponse,
  Query,
  QueryRequest,
  QueryResponse,
  ReportContent,
  ReportInfo,
  ContextualSearchRequest,
  ContextualSearchQuery,
  ContextualSearchContent,
  ImpactAnalysisRequest,
  ImpactAnalysisResponse,
  ImpactAnalysisStatusResponse,
  NewsScrapeRequest,
  NewsScrapeQuery,
  NewsScrapeContent,
  ForesightRadarRequest,
  ForesightRadarQuery,
  ForesightRadarContent
} from '@/types';
import { API_CONFIG } from '@/config';

const API_BASE_URL = API_CONFIG.BASE_URL;

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add timeout to request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`API Request timeout after ${API_CONFIG.TIMEOUT}ms`);
      }
      throw error;
    }
  }

  async authenticate(password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async submitQuery(query: string, analysisMode: 'full' | 'research_only' = 'full'): Promise<QueryResponse> {
    return this.request<QueryResponse>(API_CONFIG.ENDPOINTS.QUERIES, {
      method: 'POST',
      body: JSON.stringify({ query, analysis_mode: analysisMode }),
    });
  }

  async getQueryStatus(queryId: string): Promise<Query> {
    return this.request<Query>(`${API_CONFIG.ENDPOINTS.QUERIES}/${queryId}`);
  }

  async listQueries(): Promise<Query[]> {
    return this.request<Query[]>(API_CONFIG.ENDPOINTS.QUERIES);
  }

  async listReports(queryId: string): Promise<ReportInfo[]> {
    return this.request<ReportInfo[]>(`${API_CONFIG.ENDPOINTS.QUERIES}/${queryId}/reports`);
  }

  async getReportContent(queryId: string, reportName: string): Promise<ReportContent> {
    return this.request<ReportContent>(`${API_CONFIG.ENDPOINTS.QUERIES}/${queryId}/reports/${reportName}`);
  }

  async deleteQuery(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.QUERIES}/${queryId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(API_CONFIG.ENDPOINTS.HEALTH);
  }

  // Graph Builder endpoints
  async submitGraphQuery(data: {
    query: string;
    geography: string;
    time_range: string;
    intervention?: string | null;
  }): Promise<QueryResponse> {
    return this.request<QueryResponse>(API_CONFIG.ENDPOINTS.GRAPHS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGraphStatus(queryId: string): Promise<any> {
    return this.request<any>(`${API_CONFIG.ENDPOINTS.GRAPHS}/${queryId}`);
  }

  async listGraphQueries(): Promise<any[]> {
    return this.request<any[]>(API_CONFIG.ENDPOINTS.GRAPHS);
  }

  async getGraphContent(queryId: string, contentType: string): Promise<{ content: string; contentType: string }> {
    return this.request<{ content: string; contentType: string }>(`${API_CONFIG.ENDPOINTS.GRAPHS}/${queryId}/content/${contentType}`);
  }

  async deleteGraphQuery(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.GRAPHS}/${queryId}`, {
      method: 'DELETE',
    });
  }

  // Contextual Search endpoints
  async submitContextualSearch(data: ContextualSearchRequest): Promise<QueryResponse> {
    return this.request<QueryResponse>(`${API_CONFIG.ENDPOINTS.CONTEXTUAL_SEARCH}es`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getContextualSearchStatus(queryId: string): Promise<ContextualSearchQuery> {
    return this.request<ContextualSearchQuery>(`${API_CONFIG.ENDPOINTS.CONTEXTUAL_SEARCH}es/${queryId}`);
  }

  async listContextualSearches(): Promise<ContextualSearchQuery[]> {
    return this.request<ContextualSearchQuery[]>(`${API_CONFIG.ENDPOINTS.CONTEXTUAL_SEARCH}es`);
  }

  async getContextualSearchContent(queryId: string, contentType: string): Promise<ContextualSearchContent> {
    return this.request<ContextualSearchContent>(`${API_CONFIG.ENDPOINTS.CONTEXTUAL_SEARCH}es/${queryId}/content/${contentType}`);
  }

  async deleteContextualSearch(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.CONTEXTUAL_SEARCH}es/${queryId}`, {
      method: 'DELETE',
    });
  }

  // Impact Analysis endpoints
  async submitImpactAnalysis(data: ImpactAnalysisRequest): Promise<ImpactAnalysisResponse> {
    return this.request<ImpactAnalysisResponse>(`/api${API_CONFIG.ENDPOINTS.IMPACT_ANALYSIS}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getImpactAnalysis(analysisId: string): Promise<ImpactAnalysisResponse> {
    return this.request<ImpactAnalysisResponse>(`/api${API_CONFIG.ENDPOINTS.IMPACT_ANALYSIS}/${analysisId}`);
  }

  async listImpactAnalyses(limit?: number): Promise<ImpactAnalysisResponse[]> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return this.request<ImpactAnalysisResponse[]>(`/api${API_CONFIG.ENDPOINTS.IMPACT_ANALYSIS}/${queryParams}`);
  }

  async getImpactAnalysisStatus(analysisId: string): Promise<ImpactAnalysisStatusResponse> {
    return this.request<ImpactAnalysisStatusResponse>(`/api${API_CONFIG.ENDPOINTS.IMPACT_ANALYSIS}/${analysisId}/status`);
  }

  async deleteImpactAnalysis(analysisId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api${API_CONFIG.ENDPOINTS.IMPACT_ANALYSIS}/${analysisId}`, {
      method: 'DELETE',
    });
  }

  async regenerateImpactAnalysis(analysisId: string): Promise<ImpactAnalysisResponse> {
    return this.request<ImpactAnalysisResponse>(`/api${API_CONFIG.ENDPOINTS.IMPACT_ANALYSIS}/${analysisId}/regenerate`, {
      method: 'POST',
    });
  }

  // Impact Visualization endpoints
  async getImpactVisualizationStatus(analysisId: string): Promise<{ exists: boolean; available: boolean; reason?: string }> {
    return this.request<{ exists: boolean; available: boolean; reason?: string }>(`/api/impact-analysis/${analysisId}/visualization/status`);
  }

  async generateImpactVisualization(analysisId: string, forceRegenerate: boolean = false): Promise<{
    analysis_id: string;
    exists: boolean;
    generated: boolean;
    visualization_data: any;
    error?: string;
  }> {
    return this.request<any>(`/api/impact-analysis/${analysisId}/visualization`, {
      method: 'POST',
      body: JSON.stringify({ force_regenerate: forceRegenerate }),
    });
  }

  async deleteImpactVisualization(analysisId: string): Promise<{ message: string; analysis_id: string }> {
    return this.request<{ message: string; analysis_id: string }>(`/api/impact-analysis/${analysisId}/visualization`, {
      method: 'DELETE',
    });
  }

  async submitNewsScrape(data: NewsScrapeRequest): Promise<QueryResponse> {
    return this.request<QueryResponse>(`${API_CONFIG.ENDPOINTS.NEWS_SCRAPE}s`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNewsScrapeStatus(queryId: string): Promise<NewsScrapeQuery> {
    return this.request<NewsScrapeQuery>(`${API_CONFIG.ENDPOINTS.NEWS_SCRAPE}s/${queryId}`);
  }

  async listNewsScrapes(): Promise<NewsScrapeQuery[]> {
    return this.request<NewsScrapeQuery[]>(`${API_CONFIG.ENDPOINTS.NEWS_SCRAPE}s`);
  }

  async getNewsScrapeContent(queryId: string, contentType: string): Promise<NewsScrapeContent> {
    return this.request<NewsScrapeContent>(`${API_CONFIG.ENDPOINTS.NEWS_SCRAPE}s/${queryId}/content/${contentType}`);
  }

  async deleteNewsScrape(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.NEWS_SCRAPE}s/${queryId}`, {
      method: 'DELETE',
    });
  }

  // Foresight Radar API
  async submitForesightRadar(request: ForesightRadarRequest): Promise<QueryResponse> {
    return this.request<QueryResponse>(`${API_CONFIG.ENDPOINTS.FORESIGHT_RADAR}s`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async listForesightRadars(): Promise<ForesightRadarQuery[]> {
    return this.request<ForesightRadarQuery[]>(`${API_CONFIG.ENDPOINTS.FORESIGHT_RADAR}s`);
  }

  async getForesightRadarStatus(queryId: string): Promise<ForesightRadarQuery> {
    return this.request<ForesightRadarQuery>(`${API_CONFIG.ENDPOINTS.FORESIGHT_RADAR}s/${queryId}`);
  }

  async getForesightRadarContent(queryId: string, contentType: string): Promise<ForesightRadarContent> {
    return this.request<ForesightRadarContent>(`${API_CONFIG.ENDPOINTS.FORESIGHT_RADAR}s/${queryId}/content/${contentType}`);
  }

  async deleteForesightRadar(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`${API_CONFIG.ENDPOINTS.FORESIGHT_RADAR}s/${queryId}`, {
      method: 'DELETE',
    });
  }

  // ========================================================================
  // Dynamic Systems Modeler (DSM) endpoints
  // ========================================================================

  async suggestParentCategories(main_query: string): Promise<{ categories: string[] }> {
    return this.request<{ categories: string[] }>('/api/dsm/suggest-categories', {
      method: 'POST',
      body: JSON.stringify({ main_query }),
    });
  }

  async submitTaxonomyGeneration(data: {
    main_query: string;
    parent_categories: string[];
  }): Promise<QueryResponse> {
    return this.request<QueryResponse>('/api/dsm/taxonomy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitBaseGraph(data: {
    main_query: string;
    taxonomy: any;
  }): Promise<QueryResponse> {
    return this.request<QueryResponse>('/api/dsm/base-graph', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitIntervention(data: {
    base_graph_id: string;
    intervention_name: string;
    intervention_details?: any;
  }): Promise<QueryResponse> {
    return this.request<QueryResponse>('/api/dsm/intervention', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDSMQueryStatus(queryId: string): Promise<any> {
    return this.request<any>(`/api/dsm/queries/${queryId}`);
  }

  async listBaseGraphs(): Promise<any[]> {
    return this.request<any[]>('/api/dsm/base-graphs');
  }

  async listInterventions(baseGraphId: string): Promise<any[]> {
    return this.request<any[]>(`/api/dsm/interventions/${baseGraphId}`);
  }

  async getDSMContent(queryId: string, contentType: string): Promise<{ content: string; content_type: string }> {
    return this.request<{ content: string; content_type: string }>(`/api/dsm/content/${queryId}/${contentType}`);
  }

  async deleteDSMQuery(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/dsm/queries/${queryId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
