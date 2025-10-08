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
        // Strategy& Design System - Professional & Corporate
        'dark': {
          50: '#4d4d4d',   // Medium gray
          100: '#404040',  // Charcoal gray
          200: '#383838',  // Dark charcoal
          300: '#333333',  // Strategy& dark gray
          400: '#2b2b2b',  // Darker gray
          500: '#242424',  // Very dark gray
          600: '#1a1a1a',  // Almost black
          700: '#141414',  // Near black
          800: '#0d0d0d',  // Deep black
          900: '#000000',  // Pure black (Strategy& primary)
        },
        'primary': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#A32020', // Strategy& Maroon
          800: '#D93954', // Strategy& Bright Red
          900: '#8B1A1A',
        },
        'neutral': {
          50: '#fafafa',   // Strategy& light bg
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',  // Strategy& gray
          600: '#525252',
          700: '#404040',
          800: '#262626',  // Strategy& dark
          900: '#171717',
        },
        // Strategy& inspired gradient - Black to Maroon
        'gradient': {
          from: '#000000',  // Pure Black
          via: '#A32020',   // Strategy& Maroon
          to: '#D93954',    // Strategy& Bright Red
        },
        // Status colors - Professional tones
        'status': {
          'complete': '#22C55E',  // Green
          'running': '#F59E0B',   // Amber
          'error': '#EF4444',     // Red
          'draft': '#9CA3AF',     // Gray
          'needs-input': '#D93954', // Strategy& Red
        },
        // Strategy& Accent
        'accent-red': '#D93954',
        'accent-maroon': '#A32020',
      },
      fontFamily: {
        'sans': ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        'serif': ['"ITC Charter Com"', 'Georgia', '"Times New Roman"', 'serif'],
        'mono': ['Monaco', 'Consolas', 'monospace'],
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
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'neural-pulse': 'neuralPulse 3s ease-in-out infinite',
        'data-flow': 'dataFlow 4s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        'scale-breath': 'scaleBreath 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        neuralPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(163, 32, 32, 0.3)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(217, 57, 84, 0.4)',
            transform: 'scale(1.02)',
          },
        },
        dataFlow: {
          '0%': { 
            backgroundPosition: '0% 50%',
            opacity: '0.5',
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            opacity: '1',
          },
          '100%': { 
            backgroundPosition: '200% 50%',
            opacity: '0.5',
          },
        },
        glow: {
          '0%': {
            boxShadow: '0 0 5px rgba(163, 32, 32, 0.3), 0 0 10px rgba(163, 32, 32, 0.2)',
          },
          '100%': {
            boxShadow: '0 0 20px rgba(217, 57, 84, 0.5), 0 0 30px rgba(163, 32, 32, 0.3)',
          },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scaleBreath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
