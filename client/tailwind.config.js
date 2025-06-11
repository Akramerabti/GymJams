/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 'media' will activate dark mode based on system preferences
  content: [
    "./index.html", // Add your paths here
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
     extend: {
      fontFamily: {
        gym: ['Montserrat', 'sans-serif'],
      },
  },
  },
  plugins: [],
}
