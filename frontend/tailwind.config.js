/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Strategy& Design System - Aligned with Brand Guidelines
        'dark': {
          50: '#4d4d4d',   // Medium gray
          100: '#404040',  // Charcoal gray
          200: '#383838',  // Dark charcoal
          300: '#333333',  // Strategy& dark gray (exact brand color)
          400: '#2b2b2b',  // Darker gray
          500: '#242424',  // Very dark gray
          600: '#1a1a1a',  // Professional dark background
          700: '#181818',  // Near black
          800: '#141414',  // Deep black
          900: '#0f0f0f',  // Almost black
        },
        'primary': {
          50: '#FFF5F5',   // Very light red tint
          100: '#FEE2E2',  // Light red tint
          200: '#FECACA',  // Pale red
          300: '#FCA5A5',  // Light red
          400: '#F87171',  // Medium red
          500: '#EF4444',  // Bright red
          600: '#DC2626',  // Strong red
          700: '#A32020',  // Strategy& Maroon (exact brand color)
          800: '#D93954',  // Strategy& Bright Red (exact brand color)
          900: '#8B1A1A',  // Deep maroon
        },
        'neutral': {
          50: '#FAFAFA',   // Strategy& light background
          100: '#F5F5F5',  // Very light gray
          200: '#F2F2F2',  // Strategy& light gray (exact brand color)
          300: '#E5E5E5',  // Light gray
          400: '#D4D4D4',  // Medium light gray
          500: '#A3A3A3',  // Medium gray
          600: '#737373',  // Dark gray
          700: '#525252',  // Darker gray
          800: '#333333',  // Strategy& dark gray (exact brand color)
          900: '#1A1A1A',  // Almost black
        },
        // Strategy& Brand Gradients
        'gradient': {
          from: '#1a1a1a',  // Professional dark
          via: '#A32020',   // Strategy& Maroon
          to: '#D93954',    // Strategy& Bright Red
        },
        // Status colors - Professional consulting tones
        'status': {
          'complete': '#22C55E',  // Green
          'running': '#F59E0B',   // Amber
          'error': '#EF4444',     // Red
          'draft': '#9CA3AF',     // Gray
          'needs-input': '#D93954', // Strategy& Red
        },
        // Strategy& Accent Colors (Exact Brand Specifications)
        'strategyand': {
          'accent': '#C52A2F',      // Primary accent red (exact brand)
          'maroon': '#A32020',      // Legacy maroon support
          'red': '#D93954',         // Secondary brand color
          'off-white': '#F5F3EE',   // Text on dark backgrounds
          'ink': '#111214',         // Card backgrounds
          'hairline': '#232427',    // Minimal borders
          'dark-gray': '#333333',   // Brand dark
          'light-gray': '#F2F2F2',  // Brand light
        },
        // Monument Valley Design System - Analytics Components
        'monument': {
          'stone': '#4A4A4A',       // Dark gray for text on light backgrounds
          'sand': '#F5F0E8',        // Light beige/sand background
          'mint': '#7FC4B3',        // Mint green for success/positive
          'blush': '#FFB893',       // Coral/blush for warnings/negative
          'sky': '#A8D4FF',         // Sky blue for info
          'cream': '#FFD8A5',       // Cream/amber for neutral
        },
      },
      letterSpacing: {
        'zen': '-0.02em',           // Monument Valley zen tracking
      },
      fontFamily: {
        // Strategy& Typography System
        'sans': [
          'Inter',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"'
        ],
        'serif': [
          'Spectral',
          '"Libre Baskerville"',
          '"ITC Charter"',
          'Charter',
          'Georgia',
          '"Times New Roman"',
          'serif'
        ],
        'mono': [
          '"Söhne Mono"',
          'Monaco',
          '"Andale Mono"',
          '"Ubuntu Mono"',
          'monospace'
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '96': '24rem',    // 96px vertical sections
        '128': '32rem',   // 128px vertical sections
      },
      maxWidth: {
        // Strategy& Professional Max Widths
        'strategy': '1120px',   // Min recommended width
        'strategy-max': '1200px', // Max recommended width
      },
      animation: {
        // Strategy& Professional Animations (280ms, calm, minimal)
        'fade-in': 'fadeIn 280ms cubic-bezier(0.2, 0.6, 0.2, 1)',
        'slide-up': 'slideUp 280ms cubic-bezier(0.2, 0.6, 0.2, 1)',
        'slide-in-right': 'slideInRight 280ms cubic-bezier(0.2, 0.6, 0.2, 1)',
        // Keep essential utility animations
        'shimmer': 'shimmer 2s linear infinite',
        'rotate-slow': 'rotateSlow 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
