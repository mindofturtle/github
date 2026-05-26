/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08080f',
        surface: '#10101a',
        card: '#14141f',
        border: '#1e1e2e',
        cyan: {
          DEFAULT: '#00f5d4',
          dim: '#00c5aa',
        },
        violet: {
          DEFAULT: '#7b2fff',
          dim: '#5b1fdf',
        },
        amber: {
          DEFAULT: '#ffd60a',
        },
        rose: {
          DEFAULT: '#ef233c',
        },
        muted: '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 245, 212, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 245, 212, 0.7), 0 0 40px rgba(0, 245, 212, 0.3)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
