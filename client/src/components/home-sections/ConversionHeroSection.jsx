import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Users, Target, Download } from 'lucide-react';
import * as THREE from 'three';

const ModernConversionLanding = ({ onNavigate, backgroundColor = '#000000', textColor = '#ffffff' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMock, setSelectedMock] = useState(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const threeContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const { scrollY } = useScroll();

  // Parallax effect for hero
  const heroY = useTransform(scrollY, [0, 300], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  useEffect(() => {
    // Set up viewport height with dvh support
    const updateViewport = () => {
      const dvh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--dvh', `${dvh}px`);
      setViewportHeight(window.innerHeight);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    // Initialize Three.js scene
    initThreeJS();

    // Trigger initial load animation
    setTimeout(() => setIsLoaded(true), 100);

    return () => {
      window.removeEventListener('resize', updateViewport);
      cleanupThreeJS();
    };
  }, []);

  const initThreeJS = () => {
    if (!threeContainerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    threeContainerRef.current.appendChild(renderer.domElement);

    // Create floating particles - more particles
    const particleCount = window.innerWidth < 768 ? 150 : 300;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xC0C0C0,
      size: 0.02,
      transparent: true,
      opacity: 0.6
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      particleSystem.rotation.x += 0.001;
      particleSystem.rotation.y += 0.001;
      
      renderer.render(scene, camera);
    };

    animate();
    sceneRef.current = { scene, camera, renderer, particleSystem };

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
  };

  const cleanupThreeJS = () => {
    if (sceneRef.current) {
      const { renderer } = sceneRef.current;
      if (threeContainerRef.current && renderer.domElement) {
        threeContainerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }
  };

  const handleMockSelection = (mockType, route) => {
    setSelectedMock(mockType);
    setTimeout(() => {
      onNavigate(route);
    }, 800);
  };

  const mockFeatures = [
    {
      id: 'coaching',
      title: 'Premium Coaching',
      description: 'Experience personalized workout plans, progress tracking, and expert guidance',
      route: '/mock-coaching',
      icon: Target
    },
    {
      id: 'social',
      title: 'GymBros Network',
      description: 'Connect with workout partners, share achievements, and build your fitness community',
      route: '/mock-social',
      icon: Users
    }
  ];

  return (
    <div 
      className="relative w-full overflow-hidden"
      style={{ 
        height: '100dvh',
        minHeight: '100vh', // fallback
        backgroundColor: '#000000',
        color: '#ffffff'
      }}
    >
      {/* Three.js Background */}
      <div 
        ref={threeContainerRef}
        className="absolute inset-0 z-0"
      />

      {/* Main Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Hero Section */}
        <motion.section 
          className="flex-shrink-0 px-4 md:px-8 pt-8 md:pt-12"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 
                className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent"
                style={{
                  fontFamily: 'Rubik, Arial, sans-serif',
                  fontWeight: '800',
                  fontStyle: 'italic',
                  letterSpacing: '-0.05em',
                  textShadow: '4px 4px 0 rgba(255,255,255,0.2)',
                  lineHeight: '0.9'
                }}
              >
                GYMTONIC
              </h1>
              
              <motion.p 
                className="text-lg md:text-xl text-slate-300 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Get fit, get compensated, stay motivated, and connect with a community that shares your passion for fitness.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mb-8 md:mb-12"
              >
                <span
                  className="underline cursor-pointer hover:text-slate-300 transition-colors text-base md:text-lg font-semibold"
                  style={{ display: 'inline-block', padding: '0.25em 0.5em' }}
                  onClick={() => onNavigate && onNavigate('/login')}
                >
                  Login
                </span>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Mock Features Split-Screen */}
        <section className="flex-1 px-4 md:px-8 pb-4 md:pb-8 flex items-center">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 lg:gap-8 max-w-5xl mx-auto h-full max-h-[60vh] md:max-h-[50vh]">
            {mockFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                className="group cursor-pointer h-full"
                initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
                animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.2, ease: "easeOut" }}
                onClick={() => handleMockSelection(feature.id, feature.route)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className={`
                    mock-container h-full rounded-2xl md:rounded-3xl 
                    bg-transparent
                    border-2 border-slate-300/50
                    shadow-2xl hover:shadow-white/10
                    transition-all duration-500
                    flex flex-col items-center justify-center text-center
                    hover:border-white/70
                    backdrop-blur-sm
                    overflow-hidden
                    mobile-container-animation
                  `}
                  style={{
                    background: 'rgba(0,0,0,0.1)',
                    padding: 'clamp(0.5rem, 2.5vw, 1.5rem)'
                  }}
                >
                  {/* Title above bubble - ultra responsive */}
                  <h3 
                    className="mock-title font-bold text-white leading-tight"
                    style={{
                      fontSize: 'clamp(0.875rem, 4vw, 2rem)',
                      marginBottom: 'clamp(0.25rem, 1.5vw, 1rem)'
                    }}
                  >
                    {feature.title}
                  </h3>

                  {/* Round bubble with image - much bigger relative to container */}
                  <div className="relative flex-shrink-0" style={{ marginBottom: 'clamp(0.25rem, 1.5vw, 1rem)' }}>
                    <div 
                      className={`
                        mock-bubble rounded-full 
                        bg-gradient-to-br from-white/20 to-white/5
                        border border-white/30
                        flex items-center justify-center
                        shadow-xl
                        group-hover:scale-110 transition-transform duration-300
                        overflow-hidden
                        mobile-glow-animation
                      `}
                      style={{
                        width: 'clamp(6rem, 18vw, 14rem)',
                        height: 'clamp(6rem, 18vw, 14rem)'
                      }}
                    >
                      {feature.imageUrl ? (
                        <img 
                          src={feature.imageUrl}
                          alt={feature.title}
                          className="mock-icon w-full h-full object-cover rounded-full"
                          style={{
                            filter: 'brightness(0.9) contrast(1.1)'
                          }}
                        />
                      ) : (
                        <feature.icon 
                          className="mock-icon w-2/3 h-2/3 text-white/80"
                          style={{ width: '66%', height: '66%' }}
                        />
                      )}
                    </div>
                    {/* Pulse animation */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse" />
                  </div>

                  {/* Description - ultra responsive */}
                  <p 
                    className="mock-description text-slate-200 max-w-[95%] line-clamp-3 flex-grow flex items-center"
                    style={{
                      fontSize: 'clamp(0.625rem, 2.5vw, 1rem)',
                      lineHeight: 'clamp(1, 1.4, 1.6)',
                      marginBottom: 'clamp(0.25rem, 1vw, 0.75rem)'
                    }}
                  >
                    {feature.description}
                  </p>

                  {/* CTA indicator */}
                  <div className="mock-cta flex items-center gap-2 text-white/80 group-hover:text-white transition-colors mt-auto">
                    <Play style={{ width: 'clamp(0.75rem, 2vw, 1rem)', height: 'clamp(0.75rem, 2vw, 1rem)' }} />
                    <span style={{ fontSize: 'clamp(0.625rem, 2vw, 0.875rem)' }} className="font-medium">Try Now</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* App Store Download Section */}
        {/* App Store Download Section */}
        <motion.section 
          className="flex-shrink-0 px-4 md:px-8 pb-4 md:pb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <div className="text-center">
            <p className="text-xs md:text-xs text-slate-400 mb-4 md:mb-6">
              Download the full app
            </p>
            <div className="flex items-center justify-center gap-4 md:gap-6">
              {/* Google Play Badge */}
              <button 
                className="flex items-center bg-black border border-slate-600 rounded-lg px-3 py-2 md:px-4 md:py-3 
                         hover:bg-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ minWidth: '140px', height: '48px' }}
              >
                <div className="flex items-center gap-2">
                  {/* Google Play Icon */}
                  <div className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path fill="#34A853" d="M3.609 1.814L13.792 12L3.609 22.186A1.8 1.8 0 013 20.814V3.186c0-.667.24-1.24.609-1.372z"/>
                      <path fill="#FBBC04" d="M13.792 12l6.838-6.838c.577-.577 1.37-.577 1.947 0L3.609 1.814 13.792 12z"/>
                      <path fill="#EA4335" d="M3.609 22.186l16.968-3.348c.577-.577.577-1.37 0-1.947L13.792 12l-10.183 10.186z"/>
                      <path fill="#1A73E8" d="M13.792 12L22.577 3.215c-.577-.577-1.37-.577-1.947 0L13.792 12z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-slate-300 leading-none">GET IT ON</div>
                    <div className="text-sm md:text-base font-semibold text-white leading-tight">Google Play</div>
                  </div>
                </div>
              </button>

              {/* App Store Badge */}
              <button 
                className="flex items-center bg-black border border-slate-600 rounded-lg px-3 py-2 md:px-4 md:py-3 
                         hover:bg-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ minWidth: '140px', height: '48px' }}
              >
                <div className="flex items-center gap-2">
                  {/* Apple Icon */}
                  <div className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill="white">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-slate-300 leading-none">Download on the</div>
                    <div className="text-sm md:text-base font-semibold text-white leading-tight">App Store</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </motion.section>

        {/* Scroll Down Indicator */}
        <motion.section 
          className="flex-shrink-0 px-4 md:px-10 pb-10 md:pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <div className="text-center">
            <motion.div
              className="inline-flex flex-col items-center cursor-pointer scroll-indicator"
              animate={{ 
                y: [0, 8, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <p className="text-xs text-slate-500 mb-2 font-medium">
                Swipe down for more
              </p>
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  className="w-5 h-5 md:w-6 md:h-6 border-2 border-slate-400 rounded-full flex items-center justify-center"
                  animate={{ 
                    borderColor: ['rgba(148, 163, 184, 0.4)', 'rgba(148, 163, 184, 0.8)', 'rgba(148, 163, 184, 0.4)'],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <motion.div
                    className="w-1 h-2 bg-slate-400 rounded-full"
                    animate={{ 
                      y: [0, 4, 0],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                <motion.svg 
                  className="w-4 h-4 md:w-5 md:h-5 text-slate-400"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  animate={{ 
                    opacity: [0.3, 0.8, 0.3],
                    y: [0, 3, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </motion.svg>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>

      {/* Loading Overlay for Mock Selection */}
      {selectedMock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg md:text-xl font-semibold text-white mb-2">
              Loading {selectedMock === 'coaching' ? 'Premium Coaching' : 'GymBros Network'}
            </p>
            <p className="text-sm text-slate-400">
              Preparing your preview experience...
            </p>
          </div>
        </motion.div>
      )}

      {/* CSS for dvh support and ultra-responsive scaling */}
      <style jsx>{`
        :root {
          --dvh: 1vh;
        }
        
        @supports (height: 100dvh) {
          .dvh-full {
            height: 100dvh;
          }
        }

        /* Line clamp utility for text overflow */
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Mobile glow animation - subtle recurring glow effect */
        @keyframes mobileGlow {
          0% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1);
          }
          100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
          }
        }

        /* Mobile container hover simulation - scale, border, and shadow changes */
        @keyframes mobileContainerHover {
          0% {
            transform: scale(1);
            border-color: rgba(203, 213, 225, 0.5);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          50% {
            transform: scale(1.02);
            border-color: rgba(255, 255, 255, 0.7);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
          }
          100% {
            transform: scale(1);
            border-color: rgba(203, 213, 225, 0.5);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
        }

        /* Apply animations only on mobile devices */
        @media (max-width: 768px) {
          .mobile-glow-animation {
            animation: mobileGlow 3s ease-in-out infinite;
            animation-delay: var(--glow-delay, 0s);
          }
          
          .mobile-container-animation {
            animation: mobileContainerHover 4s ease-in-out infinite;
            animation-delay: var(--container-delay, 0s);
          }
          
          /* Stagger animations for different containers */
          .mock-container:nth-child(1) {
            --glow-delay: 0s;
            --container-delay: 0.5s;
          }
          
          .mock-container:nth-child(2) {
            --glow-delay: 1.5s;
            --container-delay: 2.5s;
          }
        }

        /* Keep desktop hover effects */
        @media (min-width: 769px) {
          .mock-bubble:hover {
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.2), 0 0 35px rgba(255, 255, 255, 0.1);
          }
          
          .mock-container:hover {
            transform: scale(1.02);
            border-color: rgba(255, 255, 255, 0.7);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
          }
        }

        /* Ultra-responsive container scaling */
        @media (max-height: 500px) {
          .mock-container {
            padding: 0.25rem !important;
          }
          .mock-title {
            font-size: 0.75rem !important;
            margin-bottom: 0.125rem !important;
          }
          .mock-bubble {
            width: 4rem !important;
            height: 4rem !important;
          }
          .mock-icon {
            width: 4rem !important;
            height: 4rem !important;
          }
          .mock-description {
            font-size: 0.5rem !important;
            line-height: 1.1 !important;
            margin-bottom: 0.125rem !important;
          }
          .mock-cta {
            font-size: 0.5rem !important;
          }
          .mock-cta svg {
            width: 0.5rem !important;
            height: 0.5rem !important;
          }
        }

        @media (max-height: 600px) {
          .mock-container {
            padding: 0.375rem !important;
          }
          .mock-title {
            font-size: 0.875rem !important;
            margin-bottom: 0.25rem !important;
          }
          .mock-bubble {
            width: 4.5rem !important;
            height: 4.5rem !important;
          }
          .mock-icon {
            width: 4.5rem !important;
            height: 4.5rem !important;
          }
          .mock-description {
            font-size: 0.625rem !important;
            line-height: 1.2 !important;
          }
        }

        /* Width-based scaling for mobile */
        @media (max-width: 480px) {
          .mock-container {
            padding: 0.5rem !important;
          }
        }

        /* Combined small screen handling */
        @media (max-width: 480px) and (max-height: 700px) {
          .mock-container {
            padding: 0.25rem !important;
          }
          .mock-title {
            font-size: 0.75rem !important;
          }
          .mock-description {
            font-size: 0.5rem !important;
            -webkit-line-clamp: 2 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ModernConversionLanding;