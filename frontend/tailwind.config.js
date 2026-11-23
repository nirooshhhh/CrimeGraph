/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#101419',
          secondary: '#171D24',
          elevated: '#202832',
          hover: '#252E3A',
        },
        amber: {
          forensic: '#F2A900',
          light: '#FFB800',
          dim: '#A67500',
        },
        teal: {
          forensic: '#43B8A5',
          light: '#5DD9C4',
          dim: '#2E8075',
        },
        text: {
          primary: '#F4F3EF',
          secondary: '#A0AAB7',
          muted: '#6B7685',
        },
        border: {
          subtle: '#252E3A',
          DEFAULT: '#2D3844',
          strong: '#3D4B59',
        },
        status: {
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          info: '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'panel': '16px',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0,0,0,0.3)',
        'elevated': '0 8px 32px rgba(0,0,0,0.4)',
        'glow-amber': '0 0 20px rgba(242, 169, 0, 0.15)',
        'glow-teal': '0 0 20px rgba(67, 184, 165, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
