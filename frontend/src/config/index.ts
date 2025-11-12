// Centralized Configuration for Policy Bot Platform
// All configurable parameters should be defined here

import { BACKGROUND_COLORS, CARD_BACKGROUNDS } from './theme';

export const CONFIG = {
  // API Configuration
  API: {
    // Backend URLs for different environments
    BACKEND_URL: {
      development: 'http://localhost:8000',
      // Production URL is now injected via environment variable at build time
      production: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    },
    // Get current backend URL based on environment
    get BASE_URL() {
      // Priority order:
      // 1. Window-injected environment variable (runtime)
      // 2. Next.js public environment variable (build-time)
      // 3. Process environment variable
      // 4. Config-based fallback (development/production)

      if (typeof window !== 'undefined' && (window as any).__ENV?.API_BASE_URL) {
        return (window as any).__ENV.API_BASE_URL;
      }

      // Use NEXT_PUBLIC_API_BASE_URL if available (set at build time by Azure deployment)
      if (process.env.NEXT_PUBLIC_API_BASE_URL) {
        return process.env.NEXT_PUBLIC_API_BASE_URL;
      }

      if (process.env.API_BASE_URL) {
        return process.env.API_BASE_URL;
      }

      return process.env.NODE_ENV === 'production'
        ? this.BACKEND_URL.production
        : this.BACKEND_URL.development;
    },

    // API Endpoints
    ENDPOINTS: {
      AUTH: '/auth',
      HEALTH: '/health',
      QUERIES: '/queries',
      GRAPHS: '/graphs',
      CONTEXTUAL_SEARCH: '/contextual-search',
      IMPACT_ANALYSIS: '/impact-analysis',
      NEWS_SCRAPE: '/news-scrape',
      FORESIGHT_RADAR: '/foresight-radar',
      CHAT: '/chat',
    },

    // Request timeout in milliseconds
    TIMEOUT: 60000, // Increased to 60s (DSM submit endpoints take ~2s for Azure Table propagation)

    // Retry configuration
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  // UI Configuration
  UI: {
    // App branding - Ideation Center by Strategy&
    APP_NAME: 'Policy Intelligence Suite',
    APP_SUBTITLE: 'Ideation Center',
    BRAND_LINE: 'Strategy& | Part of the PwC network',
    TAGLINE: 'Bold missions unlock sustainable transformation',

    // Theme colors (Strategy& Brand Colors)
    COLORS: {
      PRIMARY: '#A32020',      // Strategy& Maroon (exact brand color)
      ACCENT: '#D93954',       // Strategy& Bright Red (exact brand color)
      DARK_GRAY: '#333333',    // Strategy& Dark Gray (exact brand color)
      LIGHT_GRAY: '#F2F2F2',   // Strategy& Light Gray (exact brand color)
      NEUTRAL: '#1a1a1a',      // Professional dark background
      // Background colors (imported from theme.ts)
      BG_PRIMARY: BACKGROUND_COLORS.PRIMARY,
      BG_SECONDARY: BACKGROUND_COLORS.SECONDARY,
      BG_TERTIARY: BACKGROUND_COLORS.TERTIARY,
    },

    // Typography - Strategy& System
    FONTS: {
      SANS: 'Inter, "Helvetica Neue", Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      SERIF: '"ITC Charter", Charter, Georgia, "Times New Roman", serif',
      MONO: '"Söhne Mono", Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    },

    // Layout dimensions
    LAYOUT: {
      SIDEBAR_WIDTH: '300px',
      MAX_WIDTH: '1280px', // max-w-7xl
      CARD_PADDING: '1.5rem',
      SECTION_SPACING: '3rem',
    },

    // Spacing values (in pixels or rem)
    SPACING: {
      XS: '0.5rem',
      SM: '1rem',
      MD: '1.5rem',
      LG: '2rem',
      XL: '3rem',
      XXL: '4rem',
    },

    // Animation durations (in milliseconds)
    ANIMATIONS: {
      DURATION_FAST: 200,
      DURATION_NORMAL: 300,
      DURATION_SLOW: 500,
      DURATION_VERY_SLOW: 700,
      FADE_IN: '0.3s',
      SLIDE_UP: '0.3s',
      SLIDE_IN_RIGHT: '0.4s',
    },

    // Timer intervals (in milliseconds)
    TIMERS: {
      QUERY_STATUS_REFRESH: 30000, // 30 seconds
      HEALTH_CHECK: 60000, // 1 minute
      TIME_UPDATE: 1000, // 1 second
      CHAT_SCROLL_DELAY: 100, // 100ms
      CONTEXTUAL_SEARCH_DELAY: 500, // 500ms
    },

    // Dimensions for charts and visualizations
    DIMENSIONS: {
      CHART_HEIGHT: 320,
      CHART_HEIGHT_LARGE: 400,
      RADAR_CENTER_X: 50,
      RADAR_CENTER_Y: 50,
      RADAR_MAX_RADIUS: 75,
      SVG_VIEWBOX_WIDTH: 600,
      SVG_VIEWBOX_HEIGHT: 400,
    },

    // Zoom and interaction limits
    INTERACTIONS: {
      ZOOM_MIN: 0.5,
      ZOOM_MAX: 3,
      ZOOM_DELTA_IN: 1.1,
      ZOOM_DELTA_OUT: 0.9,
      PAN_ENABLED: true,
    },

    // Pagination
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 10,
      ITEMS_PER_PAGE_OPTIONS: [10, 20, 50, 100],
    },

    // Display limits
    DISPLAY_LIMITS: {
      MAX_CITATIONS_DISPLAY: 20,
      MAX_CHART_NODES: 30,
      MAX_CHART_EDGES: 50,
      TOP_COUNTRIES: 15,
      TOP_ORGANIZATIONS: 15,
      TOP_TOPICS: 20,
      TRUNCATE_TITLE_LENGTH: 80,
    },
  },

  // Feature Flags
  FEATURES: {
    ENABLE_HEALTH_CHECK: true,
    ENABLE_PDF_EXPORT: true,
    ENABLE_REAL_TIME_UPDATES: true,
    ENABLE_QUERY_HISTORY: true,
  },

  // Feature-Specific Configuration
  POLICY_CHAT: {
    MAX_CHAT_HISTORY: 5,
    MAX_DOCUMENT_COUNT_FULL: 7,
    MAX_DOCUMENT_COUNT_RESEARCH: 1,
    STAGES_FULL: [
      { name: 'Query Elaboration', icon: '🔍', description: 'Analyzing and expanding your policy request' },
      { name: 'Deep Research', icon: '📚', description: 'Conducting comprehensive web research with citations' },
      { name: 'Citation Analysis', icon: '🔗', description: 'Verifying sources and evaluating credibility' },
      { name: 'Policy Drafting', icon: '📄', description: 'Creating implementation-ready policy document' },
      { name: 'Scenario Simulation', icon: '🎭', description: 'Generating risk scenarios and impact analysis' },
      { name: 'Data Analytics', icon: '📊', description: 'Creating KPIs and metrics visualizations' },
      { name: 'Report Generation', icon: '📋', description: 'Compiling final deliverables and presentations' },
    ],
    STAGES_RESEARCH_ONLY: [
      { name: 'Query Elaboration', icon: '🔍', description: 'Analyzing and expanding your policy request' },
      { name: 'Deep Research', icon: '📚', description: 'Conducting comprehensive web research with citations' },
      { name: 'Citation Analysis', icon: '🔗', description: 'Verifying sources and evaluating credibility' },
    ],
  },

  ANALYSIS_MODES: {
    FULL: 'full' as const,
    RESEARCH_ONLY: 'research_only' as const,
  },

  STATUS_TYPES: {
    PROCESSING: 'processing' as const,
    COMPLETED: 'completed' as const,
    DONE: 'done' as const,
    FAILED: 'failed' as const,
  },

  // Environment Info
  ENV: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  }
};

// Export individual configs for convenience
export const API_CONFIG = CONFIG.API;
export const UI_CONFIG = CONFIG.UI;
export const FEATURE_FLAGS = CONFIG.FEATURES;
export const POLICY_CHAT_CONFIG = CONFIG.POLICY_CHAT;
export const ANALYSIS_MODES = CONFIG.ANALYSIS_MODES;
export const STATUS_TYPES = CONFIG.STATUS_TYPES;
