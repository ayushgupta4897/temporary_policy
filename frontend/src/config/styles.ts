// ============================================================================
// REUSABLE STYLE CONSTANTS
// Common UI patterns and Tailwind class combinations for consistent styling
// ============================================================================

// ============================================================================
// CARD STYLES
// ============================================================================

export const CARD_STYLES = {
  base: "pwc-card p-6",
  elevated: "pwc-card-elevated p-8",
  glass: "pwc-card-glass p-6",
  neural: "neural-card p-6",

  // Specific card variants
  compact: "pwc-card p-4",
  large: "pwc-card p-8",
  interactive: "pwc-card p-6 cursor-pointer hover:shadow-2xl transition-shadow",
} as const;

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const BUTTON_STYLES = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",

  // Size variants
  small: "btn px-4 py-2 text-xs",
  large: "btn px-8 py-4 text-base",

  // State variants
  loading: "btn opacity-70 cursor-wait",
  disabled: "btn opacity-50 cursor-not-allowed",
} as const;

// ============================================================================
// STATUS BADGE STYLES
// ============================================================================

export const STATUS_STYLES = {
  processing: "status-processing",
  done: "status-done",
  completed: "status-done",
  failed: "status-failed",
  error: "status-failed",
  pending: "status-badge bg-gray-900/30 text-gray-400 border border-gray-700/50",
} as const;

// ============================================================================
// TEXT STYLES
// ============================================================================

export const TEXT_STYLES = {
  // Headings
  h1: "font-serif text-4xl lg:text-5xl text-neutral-50",
  h2: "font-serif text-3xl lg:text-4xl text-neutral-50",
  h3: "font-serif text-2xl lg:text-3xl text-neutral-100",
  h4: "font-serif text-xl lg:text-2xl text-neutral-100",
  h5: "font-serif text-lg lg:text-xl text-neutral-200",
  h6: "font-serif text-base lg:text-lg text-neutral-300",

  // Body text
  body: "font-sans text-neutral-200",
  bodyLarge: "font-sans text-lg text-neutral-200",
  bodySmall: "font-sans text-sm text-neutral-300",

  // Special text
  label: "text-xs font-medium text-gray-400 uppercase tracking-wider",
  caption: "text-xs text-gray-500",
  muted: "text-gray-400",
  emphasized: "font-semibold text-neutral-50",

  // Gradients
  gradient: "bg-gradient-to-r from-gradient-from via-gradient-via to-gradient-to bg-clip-text text-transparent",
  gradientPrimary: "text-gradient-from",
} as const;

// ============================================================================
// INPUT STYLES
// ============================================================================

export const INPUT_STYLES = {
  base: "input",
  textarea: "textarea",
  select: "input cursor-pointer",

  // State variants
  error: "input border-red-500 focus:ring-red-500",
  success: "input border-green-500 focus:ring-green-500",
  disabled: "input opacity-50 cursor-not-allowed",
} as const;

// ============================================================================
// LAYOUT STYLES
// ============================================================================

export const LAYOUT_STYLES = {
  container: "page-container",
  section: "section-spacing",
  centered: "max-w-4xl mx-auto",
  fullWidth: "w-full",

  // Flex layouts
  flexRow: "flex flex-row items-center",
  flexCol: "flex flex-col",
  flexCenter: "flex items-center justify-center",
  flexBetween: "flex items-center justify-between",
  flexWrap: "flex flex-wrap gap-4",

  // Grid layouts
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-6",
  grid3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  grid4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
} as const;

// ============================================================================
// ANIMATION STYLES
// ============================================================================

export const ANIMATION_STYLES = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  slideInRight: "animate-slide-in-right",
  stagger: "animate-stagger",
  pulse: "animate-pulse-soft",
  spin: "animate-spin",
  spinSlow: "animate-spin-slow",
  spinSlower: "animate-spin-slower",

  // Loading states
  loading: "loading-spinner",
  loadingPulse: "loading-pulse",
} as const;

// ============================================================================
// SPACING UTILITIES
// ============================================================================

export const SPACING = {
  // Padding
  p0: "p-0",
  p1: "p-1",
  p2: "p-2",
  p4: "p-4",
  p6: "p-6",
  p8: "p-8",

  // Margin
  m0: "m-0",
  m2: "m-2",
  m4: "m-4",
  m6: "m-6",
  m8: "m-8",

  // Gap
  gap2: "gap-2",
  gap4: "gap-4",
  gap6: "gap-6",
  gap8: "gap-8",
} as const;

// ============================================================================
// BORDER STYLES
// ============================================================================

export const BORDER_STYLES = {
  base: "border border-dark-300",
  accent: "border border-primary-700",
  rounded: "rounded-lg",
  roundedFull: "rounded-full",

  // Border colors
  dark: "border-dark-500",
  light: "border-neutral-200",
  primary: "border-primary-700",
} as const;

// ============================================================================
// SHADOW STYLES
// ============================================================================

export const SHADOW_STYLES = {
  sm: "shadow-sm",
  base: "shadow",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
  none: "shadow-none",

  // Special shadows
  glow: "shadow-lg shadow-primary-700/50",
  neural: "shadow-xl shadow-primary-800/30",
} as const;

// ============================================================================
// SCROLLBAR STYLES
// ============================================================================

export const SCROLLBAR_STYLES = {
  custom: "custom-scrollbar",
  hidden: "scrollbar-hide",
  thin: "scrollbar-thin",
} as const;

// ============================================================================
// HOVER & INTERACTION STYLES
// ============================================================================

export const INTERACTION_STYLES = {
  clickable: "cursor-pointer hover:opacity-80 transition-opacity",
  hoverable: "hover:bg-dark-300/50 transition-colors",
  focusRing: "focus-ring",
  activeScale: "active:scale-95 transition-transform",

  // Disabled states
  disabled: "opacity-50 cursor-not-allowed pointer-events-none",
} as const;

// ============================================================================
// COMBINED UTILITY PATTERNS
// ============================================================================

export const COMMON_PATTERNS = {
  // Modal/Dialog
  modal: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center",
  modalContent: "pwc-card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto",

  // Tooltip
  tooltip: "absolute z-50 px-3 py-2 text-xs bg-dark-600 text-neutral-100 rounded shadow-lg",

  // Badge
  badge: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",

  // Divider
  divider: "border-t border-dark-400",
  dividerVertical: "border-l border-dark-400",

  // Loading overlay
  loadingOverlay: "absolute inset-0 bg-dark-900/70 backdrop-blur-sm flex items-center justify-center z-40",

  // Empty state
  emptyState: "flex flex-col items-center justify-center py-12 text-center text-gray-400",

  // Error state
  errorState: "flex flex-col items-center justify-center py-12 text-center text-red-400",
} as const;

// ============================================================================
// EXPORT ALL STYLES
// ============================================================================

export const STYLES = {
  CARDS: CARD_STYLES,
  BUTTONS: BUTTON_STYLES,
  STATUS: STATUS_STYLES,
  TEXT: TEXT_STYLES,
  INPUTS: INPUT_STYLES,
  LAYOUT: LAYOUT_STYLES,
  ANIMATIONS: ANIMATION_STYLES,
  SPACING,
  BORDERS: BORDER_STYLES,
  SHADOWS: SHADOW_STYLES,
  SCROLLBAR: SCROLLBAR_STYLES,
  INTERACTIONS: INTERACTION_STYLES,
  PATTERNS: COMMON_PATTERNS,
} as const;
