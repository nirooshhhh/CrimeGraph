/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          canvas: '#0F1115',
          primary: '#0F1115',
          secondary: '#171A21',
          elevated: '#1E232D',
          hover: '#262D38',
        },
        surface: {
          DEFAULT: '#171A21',
          raised: '#1E232D',
          border: '#262B35',
          'border-strong': '#363C48',
        },
        accent: {
          DEFAULT: '#0EA5E9',
          light: '#38BDF8',
          dim: '#0369A1',
          teal: '#14B8A6',
          cyan: '#06B6D4',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        border: {
          subtle: '#1F242D',
          DEFAULT: '#262B35',
          strong: '#363C48',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        entity: {
          person: '#818CF8',
          phone: '#34D399',
          vehicle: '#FB923C',
          location: '#38BDF8',
          organization: '#E879F9',
          account: '#FACC15',
          other: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        panel: '16px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.4)',
        elevated: '0 8px 32px rgba(0, 0, 0, 0.5)',
        glow: '0 0 24px rgba(14, 165, 233, 0.2)',
      },
    },
  },
  plugins: [],
}
