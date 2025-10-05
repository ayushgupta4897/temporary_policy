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
        // Dark Grayish Theme with Maroon/Purple Undertones
        'dark': {
          50: '#4a4650',   // Dark gray with purple hint
          100: '#3f3845',  // Dark gray with maroon
          200: '#363139',  // Darker gray with purple
          300: '#2e2a32',  // Dark gray with maroon
          400: '#26222a',  // Darker gray with purple
          500: '#1e1b22',  // Dark with maroon undertone
          600: '#181520',  // Very dark with purple
          700: '#141118',  // Very dark with maroon
          800: '#0f0d12',  // Almost black with purple
          900: '#0a090c',  // Light black with maroon
        },
        'primary': {
          50: '#fef2f2',
          100: '#fee2e2', 
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#7a1818', // Main burgundy - #7a1818
          800: '#991b1b',
          900: '#7f1d1d',
        },
        'neutral': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Subtle Maroon/Purple Gradient colors
        'gradient': {
          from: '#A855F7',  // Purple
          via: '#8B5CF6',   // Light Purple  
          to: '#7A1818',    // Burgundy
        },
        // Status colors - Brighter and more vibrant
        'status': {
          'complete': '#22C55E',  // Bright Green
          'running': '#FBBF24',   // Bright Amber
          'error': '#F87171',     // Bright Red
          'draft': '#9CA3AF',     // Light Gray
          'needs-input': '#A78BFA', // Bright Purple
        },
        // Policy Bot accent colors
        'accent-pink': '#EA9696',
        // Legacy colors for gradual migration
        'strategy-burgundy': '#7a1818',
        'strategy-light': '#fafafa',
        'strategy-gray': '#737373',
        'strategy-dark': '#262626',
      },
      fontFamily: {
        'sans': ['Arial', 'Helvetica', 'sans-serif'],
        'serif': ['Georgia', 'Times New Roman', 'serif'],
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
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
            transform: 'scale(1)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
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
            boxShadow: '0 0 5px rgba(168, 85, 247, 0.2), 0 0 10px rgba(139, 92, 246, 0.1)',
          },
          '100%': { 
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), 0 0 30px rgba(122, 24, 24, 0.2)',
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
