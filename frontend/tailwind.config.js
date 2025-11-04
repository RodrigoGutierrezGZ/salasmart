/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#4F46E5",
        "secondary": "#06B6D4",
        "success": "#10B981",
        "warning": "#F59E0B",
        "danger": "#EF4444",
        "background-light": "#FAFAFA",
        "background-dark": "#1F2937",
        "neutral-dark": "#1F2937",
        "neutral-light": "#F3F4F6",
        "card-bg-light": "#FFFFFF",
        "card-bg-dark": "#2d3748",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "heading": ["Poppins", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px",
      },
      boxShadow: {
        "soft": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
      animation: {
        'gradient-bg': 'gradient-bg 15s ease infinite',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 1s ease-out forwards',
        'spinner-rotate': 'spinner-rotate 1.2s linear infinite',
      },
      keyframes: {
        'gradient-bg': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        'spinner-rotate': {
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
