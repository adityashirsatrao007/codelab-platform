/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lc: {
          'layer-1': '#1a1a1a',
          'layer-2': '#282828',
          'layer-3': '#303030',
          'layer-4': '#3e3e3e',
          'fill-1': 'rgba(255, 255, 255, 0.04)',
          'fill-2': 'rgba(255, 255, 255, 0.06)',
          'fill-3': 'rgba(255, 255, 255, 0.10)',
          'fill-4': 'rgba(255, 255, 255, 0.14)',
          'border': '#3e3e3e',
          'text-primary': '#eff1f6',
          'text-secondary': 'rgba(239, 241, 246, 0.75)',
          'text-tertiary': 'rgba(239, 241, 246, 0.5)',
          'accent': '#ffa116',
          'green': '#2cbb5d',
          'easy': '#00b8a3',
          'medium': '#ffc01e',
          'hard': '#ff375f',
          'brand-orange': '#ffa116',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
