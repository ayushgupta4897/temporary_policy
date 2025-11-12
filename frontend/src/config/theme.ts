// ============================================================================
// THEME CONSTANTS - Strategy& Design System & Ideation Center Branding
// All hardcoded colors, dimensions, and visual configurations centralized here
// Aligned with Strategy& visual identity and professional consulting aesthetics
// ============================================================================

// ============================================================================
// STRATEGY& BRAND COLORS
// ============================================================================

export const BRAND_COLORS = {
  // Strategy& Primary Colors (Exact brand specifications)
  ACCENT_RED: '#C52A2F',    // Strategy& Primary Accent Red
  MAROON: '#A32020',        // Strategy& Signature Maroon (legacy support)

  // Neutral Palette (Strategy& Standards)
  OFF_WHITE: '#F5F3EE',     // Strategy& Off-white for text on dark
  INK: '#111214',           // Ink for card backgrounds
  CHARCOAL: '#0B0B0C',      // Charcoal for darkest elements
  HAIRLINE: '#232427',      // Hairline border color
  DARK_GRAY: '#333333',     // Strategy& Dark Gray
  LIGHT_GRAY: '#F2F2F2',    // Strategy& Light Gray
  WHITE: '#FFFFFF',
  BLACK: '#000000',
};

// ============================================================================
// BASE BACKGROUND COLORS
// ============================================================================

export const BACKGROUND_COLORS = {
  // Body background gradient (professional dark with subtle variation)
  GRADIENT: {
    START: '#1a1a1a',
    STEP_1: '#242424',
    STEP_2: '#2d2d2d',
    STEP_3: '#242424',
    STEP_4: '#1f1f1f',
    END: '#1a1a1a',
  },

  // Base background colors
  PRIMARY: '#1a1a1a',
  SECONDARY: '#242424',
  TERTIARY: '#2d2d2d',
};

// ============================================================================
// CARD BACKGROUND COLORS - Strategy& Style
// ============================================================================

export const CARD_BACKGROUNDS = {
  // Standard card (.strategyand-card) - Clean and professional
  STANDARD: {
    GRADIENT_START: 'rgba(45, 45, 45, 0.9)',
    GRADIENT_END: 'rgba(30, 30, 30, 0.95)',
    BORDER: 'rgba(163, 32, 32, 0.25)',
    SHADOW_PRIMARY: 'rgba(0, 0, 0, 0.3)',
    SHADOW_SECONDARY: 'rgba(0, 0, 0, 0.2)',
  },

  // Accent card with Strategy& maroon (.strategyand-accent-card)
  ACCENT: {
    GRADIENT_START: 'rgba(40, 40, 40, 0.92)',
    GRADIENT_END: 'rgba(28, 28, 28, 0.96)',
    BORDER: 'rgba(163, 32, 32, 0.4)',
    SHADOW_PRIMARY: 'rgba(0, 0, 0, 0.4)',
    SHADOW_ACCENT: 'rgba(163, 32, 32, 0.25)',
  },

  // Elevated card (.strategyand-card-elevated) - Premium feel
  ELEVATED: {
    GRADIENT_START: 'rgba(50, 50, 50, 0.95)',
    GRADIENT_END: 'rgba(35, 35, 35, 0.95)',
    BORDER: 'rgba(163, 32, 32, 0.35)',
    SHADOW_PRIMARY: 'rgba(0, 0, 0, 0.5)',
    SHADOW_ACCENT: 'rgba(163, 32, 32, 0.15)',
  },

  // Glass card (.strategyand-card-glass) - Subtle and modern
  GLASS: {
    GRADIENT_START: 'rgba(55, 55, 55, 0.65)',
    GRADIENT_END: 'rgba(40, 40, 40, 0.55)',
    BORDER: 'rgba(163, 32, 32, 0.2)',
  },

  // Light card for contrast (.strategyand-card-light)
  LIGHT: {
    GRADIENT_START: 'rgba(242, 242, 242, 0.98)',
    GRADIENT_END: 'rgba(235, 235, 235, 0.98)',
    BORDER: 'rgba(163, 32, 32, 0.15)',
    SHADOW_PRIMARY: 'rgba(0, 0, 0, 0.08)',
    SHADOW_SECONDARY: 'rgba(0, 0, 0, 0.05)',
  },
};

// ============================================================================
// BUTTON BACKGROUND COLORS
// ============================================================================

export const BUTTON_BACKGROUNDS = {
  PRIMARY: {
    GRADIENT_START: '#A32020',
    GRADIENT_END: '#D93954',
  },
  DARK: {
    BASE: '#333333',
    HOVER: '#2b2b2b',
  },
};

// ============================================================================
// INPUT BACKGROUND COLORS
// ============================================================================

export const INPUT_BACKGROUNDS = {
  BASE: 'rgba(43, 43, 43, 0.7)', // dark-400/70
  BORDER: '#383838', // dark-200
  FOCUS_RING: '#A32020', // primary-700
};

// ============================================================================
// BORDER COLORS
// ============================================================================

export const BORDER_COLORS = {
  PRIMARY: 'rgba(163, 32, 32, 0.3)',
  PRIMARY_STRONG: 'rgba(163, 32, 32, 0.5)',
  PRIMARY_SUBTLE: 'rgba(163, 32, 32, 0.25)',
  DARK: {
    300: '#333333',
    400: '#2b2b2b',
  },
};

// ============================================================================
// SHADOW COLORS
// ============================================================================

export const SHADOW_COLORS = {
  BLACK: {
    STRONG: 'rgba(0, 0, 0, 0.6)',
    MEDIUM: 'rgba(0, 0, 0, 0.5)',
    LIGHT: 'rgba(0, 0, 0, 0.4)',
  },
  PRIMARY: {
    MEDIUM: 'rgba(163, 32, 32, 0.3)',
    LIGHT: 'rgba(163, 32, 32, 0.2)',
  },
};

// ============================================================================
// RADAR CHART THEME
// ============================================================================

export const RADAR_THEME = {
  QUADRANTS: [
    { name: 'Social', angle: 60, color: '#818cf8', hoverColor: '#a5b4fc' },
    { name: 'Technological', angle: 120, color: '#a78bfa', hoverColor: '#c4b5fd' },
    { name: 'Economic', angle: 180, color: '#34d399', hoverColor: '#6ee7b7' },
    { name: 'Environmental', angle: 240, color: '#5eead4', hoverColor: '#99f6e4' },
    { name: 'Political', angle: 300, color: '#fbbf24', hoverColor: '#fcd34d' },
    { name: 'Geopolitical', angle: 0, color: '#ff6b9d', hoverColor: '#ff8bb4' },
  ],

  RINGS: [
    { name: 'Now', radius: 25, label: '0-12mo', color: '#e11d48' },
    { name: 'Next', radius: 50, label: '1-3yr', color: '#f97316' },
    { name: 'Later', radius: 75, label: '3-10yr', color: '#eab308' },
  ],

  DIMENSIONS: {
    CENTER_X: 50,
    CENTER_Y: 50,
    MAX_RADIUS: 75,
    ANGLE_VARIATION_MAX: 50,
    RADIUS_VARIATION_MAX: 5,
  },

  SIGNAL: {
    BASE_SIZE: 0.8,
    MAX_SIZE_MULTIPLIER: 1.2,
    MAX_PRIORITY_SCORE: 25,
  },

  ZOOM: {
    MIN: 0.5,
    MAX: 3,
    DELTA_IN: 1.1,
    DELTA_OUT: 0.9,
  },
};

// ============================================================================
// ENTITY GRAPH THEME
// ============================================================================

export const ENTITY_GRAPH_THEME = {
  NODE_COLORS: {
    COUNTRIES: '#3b82f6',      // Blue
    ORGANIZATIONS: '#8b5cf6',  // Purple
    TOPICS: '#10b981',          // Green
    DEFAULT: '#6b7280',         // Gray
  },

  DIMENSIONS: {
    CENTER_X: 300,
    CENTER_Y: 200,
    RADIUS_COUNTRIES: 150,
    RADIUS_TOPICS: 120,
    RADIUS_ORGANIZATIONS: 90,
    CENTRALITY_MIN_MULTIPLIER: 0.8,
    CENTRALITY_MAX_MULTIPLIER: 0.4,
  },

  LIMITS: {
    MAX_NODES_DISPLAY: 30,
    TOP_COUNTRIES: 10,
    TOP_TOPICS: 10,
    TOP_ORGANIZATIONS: 10,
  },

  EFFECTS: {
    GLOW_BLUR: 2,
    EDGE_OPACITY: 0.3,
    EDGE_OPACITY_HOVER: 0.6,
    EDGE_WIDTH: 1,
    EDGE_WIDTH_HOVER: 2,
  },
};

// ============================================================================
// CLUSTER CHART THEME
// ============================================================================

export const CLUSTER_CHART_THEME = {
  COLORS: [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
  ],

  DIMENSIONS: {
    BAR_HEIGHT: 40,
    MIN_HEIGHT: 300,
    MAX_HEIGHT: 600,
  },
};

// ============================================================================
// TREND CHART THEME
// ============================================================================

export const TREND_CHART_THEME = {
  COLORS: {
    LINE: '#3b82f6',           // Blue
    FILL: 'rgba(59, 130, 246, 0.1)',
    GRID: '#374151',           // Gray
    AXIS: '#9ca3af',           // Light gray
  },

  DIMENSIONS: {
    HEIGHT: 320,
    PADDING: {
      TOP: 20,
      RIGHT: 20,
      BOTTOM: 40,
      LEFT: 50,
    },
  },
};

// ============================================================================
// SENTIMENT TIMELINE THEME
// ============================================================================

export const SENTIMENT_TIMELINE_THEME = {
  COLORS: {
    POSITIVE: '#10b981',  // Green
    NEUTRAL: '#6b7280',   // Gray
    NEGATIVE: '#ef4444',  // Red
  },

  DIMENSIONS: {
    HEIGHT: 300,
    LINE_WIDTH: 2,
  },
};

// ============================================================================
// GEO HEATMAP THEME
// ============================================================================

export const GEO_HEATMAP_THEME = {
  COLOR_SCALE: [
    '#1e3a8a', // Dark blue (low intensity)
    '#3b82f6', // Blue
    '#60a5fa', // Light blue
    '#93c5fd', // Lighter blue
    '#dbeafe', // Lightest blue (high intensity)
  ],

  DIMENSIONS: {
    MIN_OPACITY: 0.3,
    MAX_OPACITY: 1.0,
  },
};

// ============================================================================
// WORD CLOUD THEME
// ============================================================================

export const WORD_CLOUD_THEME = {
  COLORS: [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#a855f7', // Violet
    '#eab308', // Yellow
  ],

  FONT: {
    FAMILY: 'Arial, sans-serif',
    MIN_SIZE: 12,
    MAX_SIZE: 48,
  },

  DIMENSIONS: {
    WIDTH: 600,
    HEIGHT: 400,
  },
};

// ============================================================================
// SCORE METER THEME
// ============================================================================

export const SCORE_METER_THEME = {
  BLUE: {
    bg: 'bg-blue-500/20',
    fill: 'bg-gradient-to-r from-blue-500 to-blue-400',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  GREEN: {
    bg: 'bg-green-500/20',
    fill: 'bg-gradient-to-r from-green-500 to-emerald-400',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  ORANGE: {
    bg: 'bg-orange-500/20',
    fill: 'bg-gradient-to-r from-orange-500 to-amber-400',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
};

// ============================================================================
// FORESIGHT RADAR VIEWER THEME
// ============================================================================

export const FORESIGHT_RADAR_VIEWER_THEME = {
  QUADRANTS: [
    { name: 'Social', color: '#818cf8', textColor: 'text-indigo-400' },
    { name: 'Technological', color: '#a78bfa', textColor: 'text-purple-400' },
    { name: 'Economic', color: '#34d399', textColor: 'text-emerald-400' },
    { name: 'Environmental', color: '#5eead4', textColor: 'text-teal-400' },
    { name: 'Political', color: '#fbbf24', textColor: 'text-amber-400' },
    { name: 'Geopolitical', color: '#ff6b9d', textColor: 'text-pink-400' },
  ],

  RINGS: [
    { name: 'Now', color: '#e11d48', bgColor: 'bg-rose-900/20', textColor: 'text-rose-400', borderColor: 'border-rose-500/50' },
    { name: 'Next', color: '#f97316', bgColor: 'bg-orange-900/20', textColor: 'text-orange-400', borderColor: 'border-orange-500/50' },
    { name: 'Later', color: '#eab308', bgColor: 'bg-yellow-900/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/50' },
  ],
};

// ============================================================================
// CONTEXTUAL SEARCH VIEWER THEME
// ============================================================================

export const CONTEXTUAL_SEARCH_THEME = {
  TIER_COLORS: {
    TIER_1: '#10b981',  // Green - Government/Official
    TIER_2: '#3b82f6',  // Blue - Academic/Research
    TIER_3: '#8b5cf6',  // Purple - Industry/Professional
    TIER_4: '#f59e0b',  // Amber - Media/News
    TIER_5: '#6b7280',  // Gray - Other
  },

  TIER_LABELS: {
    TIER_1: 'Government & Official',
    TIER_2: 'Academic & Research',
    TIER_3: 'Industry & Professional',
    TIER_4: 'Media & News',
    TIER_5: 'Other Sources',
  },
};

// ============================================================================
// NEWS SCRAPE (NEWS HORIZON) THEME
// ============================================================================

export const NEWS_SCRAPE_THEME = {
  // Tag colors for citation filtering
  TAG_COLORS: {
    REGION: {
      bg: 'bg-strategyand-accent/20',
      text: 'text-strategyand-accent',
      border: 'border-strategyand-accent/30',
    },
    COUNTRY: {
      bg: 'bg-primary-700/20',
      text: 'text-primary-800',
      border: 'border-primary-700/30',
    },
    TOPICS: {
      bg: 'bg-dark-500/50',
      text: 'text-gray-300',
      border: 'border-dark-400/30',
    },
    INDUSTRY: {
      bg: 'bg-neutral-500/20',
      text: 'text-neutral-300',
      border: 'border-neutral-500/30',
    },
  },

  // Citation card styling
  CITATION_CARD: {
    BACKGROUND: 'bg-dark-600/60',
    BORDER: 'border-dark-400/30',
    BORDER_WIDTH: 'border',
    HOVER_BORDER: 'hover:border-strategyand-accent/40',
    HOVER_BG: 'hover:bg-dark-600/80',
    TRANSITION: 'transition-all duration-[280ms] cubic-bezier(0.2, 0.6, 0.2, 1)',
    ROUNDED: 'rounded-2xl',
  },

  // Query card styling
  QUERY_CARD: {
    BACKGROUND: 'bg-dark-500',
    BORDER: 'border-dark-400',
    BORDER_WIDTH: 'border',
    HOVER_BORDER: 'hover:border-dark-300',
    HOVER_BG: 'hover:bg-dark-400/50',
    SELECTED_BG: 'bg-dark-600/60',
    SELECTED_BORDER: 'border-strategyand-accent',
    SELECTED_BORDER_WIDTH: 'border-2',
    ROUNDED: 'rounded-lg',
    TRANSITION: 'transition-all duration-[280ms] cubic-bezier(0.2, 0.6, 0.2, 1)',
  },

  // Status badge colors
  STATUS_BADGES: {
    COMPLETE: {
      label: 'Complete',
      bg: 'bg-status-complete/20',
      text: 'text-status-complete',
      border: 'border-status-complete/40',
    },
    RUNNING: {
      label: 'Running',
      bg: 'bg-status-running/20',
      text: 'text-status-running',
      border: 'border-status-running/40',
    },
    ERROR: {
      label: 'Error',
      bg: 'bg-status-error/20',
      text: 'text-status-error',
      border: 'border-status-error/40',
    },
  },

  // Filter tag styling (active/inactive states)
  FILTER_TAGS: {
    INACTIVE: {
      bg: 'bg-dark-500/50',
      text: 'text-gray-400',
      border: 'border-dark-400/50',
      hoverBg: 'hover:bg-dark-500',
      hoverText: 'hover:text-gray-300',
    },
    ACTIVE: {
      bg: 'bg-strategyand-accent/30',
      text: 'text-strategyand-accent',
      border: 'border-strategyand-accent',
      hoverBg: 'hover:bg-strategyand-accent/40',
      hoverText: '',
    },
  },

  // Article type badge
  ARTICLE_TYPE: {
    bg: 'bg-dark-500/50',
    text: 'text-gray-300',
    border: 'border-dark-400/30',
  },

  // Date badge
  DATE_BADGE: {
    bg: 'bg-dark-500/40',
    text: 'text-gray-500',
  },

  // Hierarchy level badge
  HIERARCHY_BADGE: {
    bg: 'bg-dark-500/40',
    text: 'text-gray-400',
  },
};

// ============================================================================
// COMMON CHART DIMENSIONS
// ============================================================================

export const CHART_DIMENSIONS = {
  DEFAULT_HEIGHT: 320,
  LARGE_HEIGHT: 400,
  SMALL_HEIGHT: 200,
  SVG_VIEWBOX: {
    WIDTH: 600,
    HEIGHT: 400,
  },
};

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

export const ANIMATION_CONFIG = {
  DURATIONS: {
    SPIN_SLOW: '3s',
    SPIN_SLOWER: '5s',
    FADE_IN: '0.3s',
    SLIDE_IN: '0.4s',
  },

  DELAYS: {
    DELAY_1: '1s',
    DELAY_2: '2s',
    DELAY_4: '4s',
  },

  STAGGER: {
    STAGGER_1: '50ms',
    STAGGER_2: '100ms',
    STAGGER_3: '150ms',
    STAGGER_4: '200ms',
    STAGGER_5: '250ms',
  },
};

// ============================================================================
// TYPOGRAPHY SYSTEM - Strategy& Fonts
// ============================================================================

export const TYPOGRAPHY = {
  FONTS: {
    SERIF: '"Spectral", "Libre Baskerville", "ITC Charter", Georgia, serif',
    SANS: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    MONO: '"Söhne Mono", Monaco, "Andale Mono", "Ubuntu Mono", monospace',
  },

  SIZES: {
    // Strategy& Professional Scale
    H1: '56px',             // Main headings (44-56px range)
    H2: '32px',             // Section headings (28-32px range)
    H3: '28px',             // Subsection headings
    H4: '24px',             // Card headings
    H5: '21px',             // Small headings
    BODY: '16px',           // Body text (16px with 28px line-height)
    BASE: '16px',           // Base text
    SMALL: '14px',          // Small text
    TINY: '12px',           // Tiny text
  },

  LINE_HEIGHTS: {
    H1: '1.1',              // Tight for large headings
    H2: '1.2',              // Tight for headings
    BODY: '1.75',           // 28px line-height for 16px text
    BASE: '1.6',            // Default
  },

  LETTER_SPACING: {
    TIGHT: '-0.005em',      // -0.5% for headings
    NORMAL: '0',
    WIDE: '0.025em',
  },

  WEIGHTS: {
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
};

// ============================================================================
// EXPORT ALL THEMES
// ============================================================================

export const THEME = {
  // Brand
  BRAND: BRAND_COLORS,

  // Base colors
  BACKGROUND: BACKGROUND_COLORS,
  CARDS: CARD_BACKGROUNDS,
  BUTTONS: BUTTON_BACKGROUNDS,
  INPUTS: INPUT_BACKGROUNDS,
  BORDERS: BORDER_COLORS,
  SHADOWS: SHADOW_COLORS,

  // Typography
  TYPOGRAPHY,

  // Chart themes
  RADAR: RADAR_THEME,
  ENTITY_GRAPH: ENTITY_GRAPH_THEME,
  CLUSTER_CHART: CLUSTER_CHART_THEME,
  TREND_CHART: TREND_CHART_THEME,
  SENTIMENT_TIMELINE: SENTIMENT_TIMELINE_THEME,
  GEO_HEATMAP: GEO_HEATMAP_THEME,
  WORD_CLOUD: WORD_CLOUD_THEME,
  SCORE_METER: SCORE_METER_THEME,
  FORESIGHT_RADAR_VIEWER: FORESIGHT_RADAR_VIEWER_THEME,
  CONTEXTUAL_SEARCH: CONTEXTUAL_SEARCH_THEME,
  NEWS_SCRAPE: NEWS_SCRAPE_THEME,

  // Common
  CHART_DIMENSIONS,
  ANIMATIONS: ANIMATION_CONFIG,
};
