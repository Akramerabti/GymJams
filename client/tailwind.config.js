/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', 
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}",
  ],  
  theme: {
    extend: {

      fontFamily: {
        gym: ['Montserrat', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      animation: {
        'floatOnce': 'floatOnce 2s ease-out forwards',
        'slideDownFromVideo': 'slideDownFromVideo 0.5s ease-out forwards',
        'floatUpSection': 'floatUpSection 0.8s ease-out forwards',
        'fadeInUp': 'fadeInUp 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'fadeInScale': 'fadeInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slideInLeft': 'slideInLeft 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slideInRight': 'slideInRight 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'floatIn': 'floatIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slideUpFade': 'slideUpFade 0.6s ease-out forwards',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'pulse-soft': 'pulse-soft 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'reveal-section': 'revealSection 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'morph-bg': 'morphBackground 20s ease-in-out infinite',
        'floating-elements': 'floatingElements 8s ease-in-out infinite',
        'gradient-flow': 'gradientFlow 8s ease infinite',
        'glow-pulse': 'pulseGlow 3s ease-in-out infinite',
        'slide-left': 'slideInFromLeft 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slide-right': 'slideInFromRight 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'scale-bounce': 'scaleUpBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'text-shimmer': 'textShimmer 2s infinite',
      },      
      keyframes: {
        floatOnce: {
          '0%': { transform: 'translateY(0px)', opacity: '0' },
          '25%': { opacity: '1', transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(-12px)' },
          '75%': { transform: 'translateY(-6px)' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },
        slideDownFromVideo: {
          '0%': { transform: 'translateY(-150px)', opacity: '0', visibility: 'hidden' },
          '100%': { transform: 'translateY(0)', opacity: '1', visibility: 'visible' },
        },
        floatUpSection: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(60px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(30px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { 'box-shadow': '0 0 20px rgba(79, 70, 229, 0.3)' },
          '100%': { 'box-shadow': '0 0 30px rgba(79, 70, 229, 0.6)' },
        },
        revealSection: {
          '0%': { opacity: '0', transform: 'translateY(100px) scale(0.95)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
        },
        morphBackground: {
          '0%, 100%': { 'border-radius': '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { 'border-radius': '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        floatingElements: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
        gradientFlow: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        pulseGlow: {
          '0%, 100%': { 
            'box-shadow': '0 0 20px rgba(79, 70, 229, 0.3), 0 0 40px rgba(124, 58, 237, 0.2), 0 0 60px rgba(236, 72, 153, 0.1)' 
          },
          '50%': { 
            'box-shadow': '0 0 30px rgba(79, 70, 229, 0.5), 0 0 60px rgba(124, 58, 237, 0.3), 0 0 90px rgba(236, 72, 153, 0.2)' 
          },
        },
        slideInFromLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100px) rotate(-5deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0deg)' },
        },
        slideInFromRight: {
          '0%': { opacity: '0', transform: 'translateX(100px) rotate(5deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0deg)' },
        },
        scaleUpBounce: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        textShimmer: {
          '0%': { 'background-position': '-200% center' },
          '100%': { 'background-position': '200% center' },
        },
      },
    },
  },
  plugins: [],
}