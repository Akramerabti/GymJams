/** @type {import('tailwindcss').Config} */

// Helper function to generate a REM-based scale.
// This creates a map of numbers (e.g., 4) to their rem equivalent (e.g., '1rem').
// The base font size is assumed to be 16px.
const createRemScale = (limit) => {
  const scale = {};
  for (let i = 0; i <= limit; i++) {
    // We add common half steps for finer control (e.g., 2.5 for 10px)
    if (i <= 20) {
      scale[`${i}.5`] = `${i * 0.25 + 0.125}rem`;
    }
    scale[i] = `${i * 0.25}rem`;
  }
  return scale;
};

// Generate a comprehensive scale for spacing, width, height, etc.
const spacingScale = createRemScale(400);

module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // By defining the entire theme object, we override Tailwind's defaults
    // to ensure everything uses our new, robust REM-based system.

    // 1. BREAKPOINTS
    // Added a new `xxs` breakpoint for screens down to 320px.
    // This gives you more control on the smallest devices.
    screens: {
      'xxs': '320px', // Extra-extra-small for tiny phones
      'xs': '480px',  // Small mobile
      'sm': '640px',  // Tablets
      'md': '768px',  // Small laptops
      'lg': '1024px', // Laptops
      'xl': '1280px', // Desktops
      '2xl': '1536px',// Large desktops
    },

    // 2. SPACING, WIDTH, HEIGHT
    // Using our generated REM scale for all sizing utilities.
    // Now, `p-4` (1rem), `w-64` (16rem), etc., will all scale with zoom.
    spacing: spacingScale,
    width: (theme) => ({ ...theme('spacing'), auto: 'auto', '1/2': '50%', '1/3': '33.333333%', '2/3': '66.666667%', '1/4': '25%', '2/4': '50%', '3/4': '75%', '1/5': '20%', '2/5': '40%', '3/5': '60%', '4/5': '80%', full: '100%', screen: '100vw' }),
    height: (theme) => ({ ...theme('spacing'), auto: 'auto', full: '100%', screen: '100vh' }),
    minWidth: (theme) => ({ ...theme('width'), }),
    maxWidth: (theme) => ({ ...theme('width'), none: 'none', full: '100%', screen: '100vw' }),
    minHeight: (theme) => ({ ...theme('height'), }),
    maxHeight: (theme) => ({ ...theme('height'), }),

    // 3. TYPOGRAPHY
    fontFamily: {
      // Your custom font family is preserved.
      sans: ['Montserrat', 'system-ui', 'sans-serif'], // Set Montserrat as the default sans-serif font
    },
 fontSize: {
  'xs': 'clamp(0.75rem, 0.5vw + 0.6rem, 0.875rem)',   // 12px -> 14px
  'sm': 'clamp(0.875rem, 0.5vw + 0.7rem, 1rem)',      // 14px -> 16px
  'base': 'clamp(1rem, 1vw + 0.75rem, 1.125rem)',     // 16px -> 18px
  'lg': 'clamp(1.125rem, 1vw + 0.85rem, 1.25rem)',    // 18px -> 20px
  'xl': 'clamp(1.25rem, 1.5vw + 0.9rem, 1.5rem)',     // 20px -> 24px
  '2xl': 'clamp(1.5rem, 2vw + 1rem, 1.875rem)',       // 24px -> 30px
  '3xl': 'clamp(1.875rem, 2.5vw + 1.2rem, 2.25rem)',  // 30px -> 36px
  '4xl': 'clamp(2.25rem, 3vw + 1.5rem, 3rem)',        // 36px -> 48px
  '5xl': 'clamp(3rem, 4vw + 2rem, 3.75rem)',          // 48px -> 60px
  '6xl': 'clamp(3.75rem, 5vw + 2.5rem, 4.5rem)',      // 60px -> 72px
},
    // 4. COLORS & OTHER PROPERTIES
    // It's good practice to define your color palette here.
    // For now, we'll extend the default colors.
    extend: {
      colors: {
        // Example of adding custom colors
        primary: '#4f46e5',
        secondary: '#ec4899',
      },
      // Your animations and keyframes are preserved perfectly.
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
        // All your keyframes are preserved here...
        floatOnce: { '0%': { transform: 'translateY(0px)', opacity: '0' }, '25%': { opacity: '1', transform: 'translateY(-8px)' }, '50%': { transform: 'translateY(-12px)' }, '75%': { transform: 'translateY(-6px)' }, '100%': { transform: 'translateY(0px)', opacity: '1' } },
        slideDownFromVideo: { '0%': { transform: 'translateY(-150px)', opacity: '0', visibility: 'hidden' }, '100%': { transform: 'translateY(0)', opacity: '1', visibility: 'visible' } },
        floatUpSection: { '0%': { transform: 'translateY(30px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(60px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeInScale: { '0%': { opacity: '0', transform: 'scale(0.9) translateY(30px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-100px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(100px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        floatIn: { '0%': { opacity: '0', transform: 'translateY(30px) scale(0.95)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        slideUpFade: { '0%': { opacity: '0', transform: 'translateY(40px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'gradient-shift': { '0%': { 'background-position': '0% 50%' }, '50%': { 'background-position': '100% 50%' }, '100%': { 'background-position': '0% 50%' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        glow: { '0%': { 'box-shadow': '0 0 20px rgba(79, 70, 229, 0.3)' }, '100%': { 'box-shadow': '0 0 30px rgba(79, 70, 229, 0.6)' } },
        revealSection: { '0%': { opacity: '0', transform: 'translateY(100px) scale(0.95)', filter: 'blur(10px)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0px)' } },
        morphBackground: { '0%, 100%': { 'border-radius': '60% 40% 30% 70% / 60% 30% 70% 40%' }, '50%': { 'border-radius': '30% 60% 70% 40% / 50% 60% 30% 60%' } },
        floatingElements: { '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' }, '33%': { transform: 'translateY(-10px) rotate(1deg)' }, '66%': { transform: 'translateY(5px) rotate(-1deg)' } },
        gradientFlow: { '0%': { 'background-position': '0% 50%' }, '50%': { 'background-position': '100% 50%' }, '100%': { 'background-position': '0% 50%' } },
        pulseGlow: { '0%, 100%': { 'box-shadow': '0 0 20px rgba(79, 70, 229, 0.3), 0 0 40px rgba(124, 58, 237, 0.2), 0 0 60px rgba(236, 72, 153, 0.1)' }, '50%': { 'box-shadow': '0 0 30px rgba(79, 70, 229, 0.5), 0 0 60px rgba(124, 58, 237, 0.3), 0 0 90px rgba(236, 72, 153, 0.2)' } },
        slideInFromLeft: { '0%': { opacity: '0', transform: 'translateX(-100px) rotate(-5deg)' }, '100%': { opacity: '1', transform: 'translateX(0) rotate(0deg)' } },
        slideInFromRight: { '0%': { opacity: '0', transform: 'translateX(100px) rotate(5deg)' }, '100%': { opacity: '1', transform: 'translateX(0) rotate(0deg)' } },
        scaleUpBounce: { '0%': { opacity: '0', transform: 'scale(0.3)' }, '50%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.9)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        textShimmer: { '0%': { 'background-position': '-200% center' }, '100%': { 'background-position': '200% center' } },
      },
    },
  },
  plugins: [],
};