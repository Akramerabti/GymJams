/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // This ensures dark: variants use the 'dark' class
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
