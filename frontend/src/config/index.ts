// Centralized Configuration for Policy Bot Platform
// All configurable parameters should be defined here

export const CONFIG = {
  // API Configuration
  API: {
    // Backend URLs for different environments
    BACKEND_URL: {
      development: 'http://localhost:8000',
      production: 'https://ca-policy-backend.whitestone-31d90b86.eastus.azurecontainerapps.io'
    },
    // Get current backend URL based on environment
    get BASE_URL() {
      // Use environment variable if available, otherwise fallback to config
      if (typeof window !== 'undefined' && (window as any).__ENV?.API_BASE_URL) {
        return (window as any).__ENV.API_BASE_URL;
      }
      if (process.env.API_BASE_URL) {
        return process.env.API_BASE_URL;
      }
      return process.env.NODE_ENV === 'production' 
        ? this.BACKEND_URL.production 
        : this.BACKEND_URL.development;
    },
    
    // Request timeout in milliseconds
    TIMEOUT: 30000,
    
    // Retry configuration
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },

  // UI Configuration
  UI: {
    // App branding
    APP_NAME: 'Policy Bot',
    APP_SUBTITLE: 'Strategy& PWC',
    
    // Theme colors (matching Tailwind config)
    COLORS: {
      PRIMARY: '#7a1818', // Updated burgundy
      ACCENT: '#EA9696', // Accent pink
      NEUTRAL: '#262626', // Dark grey
    },
    
    // Layout
    SIDEBAR_WIDTH: '300px',
    
    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    
    // Refresh intervals (in milliseconds)
    QUERY_STATUS_REFRESH_INTERVAL: 5000, // 5 seconds
    HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  },

  // Feature Flags
  FEATURES: {
    ENABLE_HEALTH_CHECK: true,
    ENABLE_PDF_EXPORT: true,
    ENABLE_REAL_TIME_UPDATES: true,
    ENABLE_QUERY_HISTORY: true,
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
