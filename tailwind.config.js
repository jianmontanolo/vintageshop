/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#378ADD',
          50:  '#EBF3FB',
          100: '#D7E8F8',
          200: '#AFCFF1',
          300: '#87B7EA',
          400: '#5F9EE3',
          500: '#378ADD',
          600: '#1E72CC',
          700: '#175AA0',
          800: '#114374',
          900: '#0B2B48',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
