import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        'autozy-yellow': '#F5C518',
        'autozy-yellow-dark': '#E0B316',
        'autozy-yellow-light': '#FFE66B',
        'autozy-dark': '#0F1117',
        'autozy-charcoal': '#1F2230',
        'autozy-blue': '#2563EB',

        // Surfaces (light theme)
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F7F8FA',
          subtle: '#EEF0F4',
          border: '#E5E7EB',
        },

        // Sidebar (dark theme)
        nav: {
          bg: '#0F1117',
          surface: '#1A1D27',
          hover: '#252836',
          border: '#2A2E3D',
          text: '#9CA3B0',
          'text-muted': '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(15, 17, 23, 0.04), 0 1px 3px 0 rgba(15, 17, 23, 0.06)',
        'card': '0 1px 3px 0 rgba(15, 17, 23, 0.06), 0 4px 12px -2px rgba(15, 17, 23, 0.04)',
        'pop': '0 8px 24px -4px rgba(15, 17, 23, 0.12), 0 2px 4px -2px rgba(15, 17, 23, 0.06)',
        'glow-yellow': '0 0 0 4px rgba(245, 197, 24, 0.18)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
