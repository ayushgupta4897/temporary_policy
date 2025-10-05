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
  NewsScrapeContent
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
    return this.request<AuthResponse>('/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async submitQuery(query: string, analysisMode: 'full' | 'research_only' = 'full'): Promise<QueryResponse> {
    return this.request<QueryResponse>('/queries', {
      method: 'POST',
      body: JSON.stringify({ query, analysis_mode: analysisMode }),
    });
  }

  async getQueryStatus(queryId: string): Promise<Query> {
    return this.request<Query>(`/queries/${queryId}`);
  }

  async listQueries(): Promise<Query[]> {
    return this.request<Query[]>('/queries');
  }

  async listReports(queryId: string): Promise<ReportInfo[]> {
    return this.request<ReportInfo[]>(`/queries/${queryId}/reports`);
  }

  async getReportContent(queryId: string, reportName: string): Promise<ReportContent> {
    return this.request<ReportContent>(`/queries/${queryId}/reports/${reportName}`);
  }

  async deleteQuery(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/queries/${queryId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health');
  }

  // Graph Builder endpoints
  async submitGraphQuery(data: {
    query: string;
    geography: string;
    time_range: string;
    intervention?: string | null;
  }): Promise<QueryResponse> {
    return this.request<QueryResponse>('/graphs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGraphStatus(queryId: string): Promise<any> {
    return this.request<any>(`/graphs/${queryId}`);
  }

  async listGraphQueries(): Promise<any[]> {
    return this.request<any[]>('/graphs');
  }

  async getGraphContent(queryId: string, contentType: string): Promise<{ content: string; contentType: string }> {
    return this.request<{ content: string; contentType: string }>(`/graphs/${queryId}/content/${contentType}`);
  }

  async deleteGraphQuery(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/graphs/${queryId}`, {
      method: 'DELETE',
    });
  }

  // Contextual Search endpoints
  async submitContextualSearch(data: ContextualSearchRequest): Promise<QueryResponse> {
    return this.request<QueryResponse>('/contextual-searches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getContextualSearchStatus(queryId: string): Promise<ContextualSearchQuery> {
    return this.request<ContextualSearchQuery>(`/contextual-searches/${queryId}`);
  }

  async listContextualSearches(): Promise<ContextualSearchQuery[]> {
    return this.request<ContextualSearchQuery[]>('/contextual-searches');
  }

  async getContextualSearchContent(queryId: string, contentType: string): Promise<ContextualSearchContent> {
    return this.request<ContextualSearchContent>(`/contextual-searches/${queryId}/content/${contentType}`);
  }

  async deleteContextualSearch(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/contextual-searches/${queryId}`, {
      method: 'DELETE',
    });
  }

  // Impact Analysis endpoints
  async submitImpactAnalysis(data: ImpactAnalysisRequest): Promise<ImpactAnalysisResponse> {
    return this.request<ImpactAnalysisResponse>('/api/impact-analysis/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getImpactAnalysis(analysisId: string): Promise<ImpactAnalysisResponse> {
    return this.request<ImpactAnalysisResponse>(`/api/impact-analysis/${analysisId}`);
  }

  async listImpactAnalyses(limit?: number): Promise<ImpactAnalysisResponse[]> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return this.request<ImpactAnalysisResponse[]>(`/api/impact-analysis/${queryParams}`);
  }

  async getImpactAnalysisStatus(analysisId: string): Promise<ImpactAnalysisStatusResponse> {
    return this.request<ImpactAnalysisStatusResponse>(`/api/impact-analysis/${analysisId}/status`);
  }

  async deleteImpactAnalysis(analysisId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/impact-analysis/${analysisId}`, {
      method: 'DELETE',
    });
  }

  async regenerateImpactAnalysis(analysisId: string): Promise<ImpactAnalysisResponse> {
    return this.request<ImpactAnalysisResponse>(`/api/impact-analysis/${analysisId}/regenerate`, {
      method: 'POST',
    });
  }

  async submitNewsScrape(data: NewsScrapeRequest): Promise<QueryResponse> {
    return this.request<QueryResponse>('/news-scrapes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNewsScrapeStatus(queryId: string): Promise<NewsScrapeQuery> {
    return this.request<NewsScrapeQuery>(`/news-scrapes/${queryId}`);
  }

  async listNewsScrapes(): Promise<NewsScrapeQuery[]> {
    return this.request<NewsScrapeQuery[]>('/news-scrapes');
  }

  async getNewsScrapeContent(queryId: string, contentType: string): Promise<NewsScrapeContent> {
    return this.request<NewsScrapeContent>(`/news-scrapes/${queryId}/content/${contentType}`);
  }

  async deleteNewsScrape(queryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/news-scrapes/${queryId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
