/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#FFB74D', // orange-300
          DEFAULT: '#F97316', // orange-600 (was orange-500, 600 for better contrast)
          dark: '#E65100' // orange-800
        },
        secondary: {
          light: '#64B5F6', // blue-300
          DEFAULT: '#2196F3', // blue-500
          dark: '#1565C0'  // blue-700
        },
        accent: '#4CAF50', // green-500
      }
    },
  },
  plugins: [],
} 