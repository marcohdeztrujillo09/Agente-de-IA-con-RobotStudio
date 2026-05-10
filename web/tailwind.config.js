/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abb: {
          red: '#e30613',
          dark: '#333333',
          light: '#f4f4f4',
          hover: '#b0050f'
        }
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
