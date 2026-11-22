import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080b0e',
          900: '#0b1014',
          850: '#0f151a',
          800: '#131b21',
          750: '#182229',
          700: '#1e2a33',
          600: '#2a3944',
        },
        mint: {
          300: '#7ff0c0',
          400: '#4fe0a6',
          500: '#2fcf92',
          600: '#1fa877',
        },
        cyanx: {
          300: '#7dd9f5',
          400: '#45c7ee',
          500: '#22aed8',
        },
        muted: '#8fa1ae',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 40px rgba(0,0,0,0.28)',
        glow: '0 0 0 1px rgba(79,224,166,0.18), 0 8px 30px rgba(47,207,146,0.08)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
