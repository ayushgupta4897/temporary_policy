export interface Query {
  queryId: string;
  query: string;
  displayTitle?: string;
  status: 'processing' | 'done' | 'failed';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  blobUrls?: BlobUrl[];
  durationMinutes?: number;
  citationsCount?: number;
  analysisMode?: 'full' | 'research_only';
  queryType?: 'graph' | 'policy';
}

export interface BlobUrl {
  type: string;
  filename: string;
  url: string;
}

export interface AuthRequest {
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
}

export interface QueryRequest {
  query: string;
  analysis_mode?: 'full' | 'research_only';
}

export interface QueryResponse {
  queryId: string;
  message: string;
}

export interface ReportContent {
  content: string;
}

export interface ReportInfo {
  name: string;
  url: string;
  size?: number;
}

// Contextual Search Types
export interface ContextualSearchRequest {
  query: string;
}

export interface ContextualSearchQuery {
  queryId: string;
  query: string;
  displayTitle?: string;
  status: 'processing' | 'done' | 'failed';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  blobUrls?: BlobUrl[];
  durationMinutes?: number;
  totalSearches?: number;
  uniqueCitations?: number;
  sourceTiersCovered?: number;
  batchSize?: number;
}

export interface ContextualSearchContent {
  content: string;
  contentType: string;
}

export interface Citation {
  title: string;
  url: string;
  publisher: string;
  year: string;
  doi?: string;
  key_quote?: string;
  summary: string;
  source_tier?: string;
  source_type?: string;
  search_streams?: string[];
  extracted_at?: string;
}

export interface SourceTierAnalysis {
  tier_coverage: number;
  tier_distribution: Record<string, number>;
  tier_quality_metrics: Record<string, {
    total: number;
    with_doi: number;
    recent: number;
  }>;
  top_performing_tiers: [string, number][];
}

export interface SearchResults {
  query: string;
  total_searches: number;
  total_citations: number;
  timestamp: string;
  top_citations: Citation[];
  search_metadata: {
    unique_sources: number;
    year_range: {
      earliest: number | null;
      latest: number | null;
      span: number;
    };
    source_types: Record<string, number>;
  };
}

// Impact Analysis Types
export interface ImpactAnalysisRequest {
  query: string;
  async_mode?: boolean;
}

export interface ImpactAnalysisResponse {
  analysis_id: string;
  query: string;
  status: 'processing' | 'completed' | 'failed';
  meta_prompt?: string;
  citations_count: number;
  citations: ImpactCitation[];
  impact_analysis?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ImpactCitation {
  title: string;
  url: string;
  publisher: string;
  year: string;
  doi?: string;
  key_finding: string;
  methodology: string;
  multiplier?: string;
  source_tier: string;
  quality_score: 'high' | 'medium' | 'low';
}

export interface ImpactAnalysisStatusResponse {
  analysis_id: string;
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  query: string;
  citations_count: number;
  created_at?: string;
  message?: string;
}

export interface NewsScrapeRequest {
  query: string;
  timeline: string;
}

export interface NewsScrapeQuery {
  queryId: string;
  query: string;
  displayTitle?: string;
  status: 'processing' | 'done' | 'failed';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  blobUrls?: BlobUrl[];
  durationMinutes?: number;
  totalCitations?: number;
  hierarchies?: string[];
  geographiesCount?: number;
  timeline?: string;
}

export interface NewsScrapeContent {
  content: string;
  contentType: string;
}

export interface NewsCitation {
  title: string;
  url: string;
  publisher: string;
  author?: string;
  year: string;
  date: string;
  summary: string;
  key_quote?: string;
  country?: string | string[];
  region?: string | string[];
  geography?: string;
  hierarchy_level?: string;
  sentiment_score?: number;
  trust_score?: number;
  relevance_score?: number;
  article_type?: string;
  image_url?: string;
  topics?: string[];
  industry?: string[];
}

export interface ExecutiveSummary {
  level: string;
  geography: string;
  summary: string;
  citation_count: number;
}

export interface GeographyHierarchy {
  hierarchies: string[];
  countries?: string[];
  regions?: string[];
  search_focus?: string;
}

export interface NewsScrapeResults {
  query: string;
  hierarchy: GeographyHierarchy;
  news_by_geography: Record<string, Record<string, NewsCitation[]>>;
  executive_summaries: Record<string, ExecutiveSummary>;
  total_citations: number;
  timestamp: string;
}

// Foresight Radar Types
export interface ForesightRadarRequest {
  query: string;
}

export interface ForesightRadarQuery {
  queryId: string;
  query: string;
  displayTitle?: string;
  status: 'processing' | 'done' | 'failed';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  blobUrls?: BlobUrl[];
  durationMinutes?: number;
  totalSearches?: number;
  uniqueCitations?: number;
  signalsCount?: number;
  scenariosCount?: number;
  watchlistCount?: number;
  batchSize?: number;
}

export interface ForesightRadarContent {
  content: string;
  contentType: string;
}

export interface RadarSignal {
  title: string;
  ring: 'Now' | 'Next' | 'Later';
  quadrant: 'Social' | 'Technological' | 'Economic' | 'Environmental' | 'Political' | 'Geopolitical';
  impact_0to5: number;
  likelihood_0to5: number;
  confidence_0to5: number;
  direction: 'up' | 'down' | 'flat';
  driver_type: string;
  uncertainty_class: 'deep' | 'estimable';
  rationale: string;
  citations: string[];
  priority_score?: number;
}

export interface RadarScenario {
  name: string;
  axes: string[];
  summary: string;
  signposts: Array<{
    metric: string;
    threshold: string;
    source: string;
  }>;
  implications: {
    opportunities: string[];
    hedges: string[];
    no_regret_moves: string[];
  };
}

export interface WatchlistIndicator {
  metric: string;
  unit: string;
  source: string;
  frequency: string;
  expected_direction: 'up' | 'down' | 'flat';
  alert_thresholds: {
    amber: string;
    red: string;
  };
}

export interface RadarJSON {
  query: string;
  as_of_date: string;
  scope?: {
    restatement: string;
    unit_of_analysis: string;
    dependent_variables: string[];
  };
  radar_items: RadarSignal[];
  cross_impact: Array<{
    from: string;
    to: string;
    relation: 'amplifies' | 'dampens';
    note: string;
  }>;
  scenarios: RadarScenario[];
  watchlist: WatchlistIndicator[];
  keystone_drivers?: Array<{
    driver: string;
    influence_score: number;
    affected_signals: string[];
  }>;
  fragility_points?: Array<{
    point: string;
    risk_level: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
}
