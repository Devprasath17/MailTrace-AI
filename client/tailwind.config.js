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
        security: {
          bg: '#090d16',
          card: '#111827',
          border: '#1f293d',
          hover: '#1e293b',
          accent: '#06b6d4', // Cyan
          danger: '#f43f5e', // Rose
          warning: '#f59e0b', // Amber
          success: '#10b981', // Emerald
          info: '#3b82f6', // Blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
