/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 'media' will activate dark mode based on system preferences
  content: [
    "./index.html", // Add your paths here
    "./src/**/*.{js,ts,jsx,tsx}",
  ],  theme: {
     extend: {
      fontFamily: {
        gym: ['Montserrat', 'sans-serif'],
      },      animation: {
        'floatOnce': 'floatOnce 2s ease-out forwards',
        'slideDownFromVideo': 'slideDownFromVideo 0.8s ease-out forwards',
      },
      keyframes: {
        floatOnce: {
          '0%': { transform: 'translateY(0px)', opacity: '0' },
          '25%': { opacity: '1', transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(-12px)' },
          '75%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },        slideDownFromVideo: {
          '0%': { transform: 'translateY(-150px)', opacity: '0', visibility: 'hidden' },
          '100%': { transform: 'translateY(0)', opacity: '1', visibility: 'visible' },
        },
      },
  },
  },
  plugins: [],
}
