/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cursor-inspired color palette
        // Dark mode colors
        dark: {
          bg: {
            primary: '#0d0d0d',
            secondary: '#141414',
            tertiary: '#1a1a1a',
            elevated: '#1f1f1f',
            hover: '#262626',
          },
          border: {
            primary: '#2a2a2a',
            secondary: '#333333',
            subtle: '#1f1f1f',
          },
          text: {
            primary: '#fafafa',
            secondary: '#a1a1a1',
            tertiary: '#6b6b6b',
            muted: '#525252',
          },
        },
        // Light mode colors
        light: {
          bg: {
            primary: '#ffffff',
            secondary: '#fafafa',
            tertiary: '#f5f5f5',
            elevated: '#ffffff',
            hover: '#f0f0f0',
          },
          border: {
            primary: '#e5e5e5',
            secondary: '#d4d4d4',
            subtle: '#f0f0f0',
          },
          text: {
            primary: '#0a0a0a',
            secondary: '#525252',
            tertiary: '#737373',
            muted: '#a3a3a3',
          },
        },
        // Accent colors
        accent: {
          primary: '#3b82f6',
          hover: '#2563eb',
          muted: 'rgba(59, 130, 246, 0.1)',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'dark-soft': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'dark-medium': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'dark-elevated': '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
