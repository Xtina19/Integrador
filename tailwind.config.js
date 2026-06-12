/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        corporate: {
          DEFAULT: '#1E2D86',
          dark: '#151f63',
          light: '#2a3da0',
        },
        gold: {
          DEFAULT: '#F4D22E',
          dark: '#d4b520',
          light: '#f7de5c',
        },
        surface: '#F5F5F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
