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
        background: '#090a0f',
        surface: '#11131a',
        'surface-elevated': '#181b24',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-hover': 'rgba(255, 255, 255, 0.16)',
        primary: '#3b82f6',
        'primary-glow': 'rgba(59, 130, 246, 0.15)',
        accent: '#8b5cf6',
        success: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 40px -10px rgba(59, 130, 246, 0.25)',
        'glow-accent': '0 0 40px -10px rgba(139, 92, 246, 0.25)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
