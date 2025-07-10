import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HeroSection, 
  ShopSection, 
  GymBrosSection, 
  GamesSection, 
  CoachingSection 
} from '../components/home-sections';

const Home = () => {  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [visibleSections, setVisibleSections] = useState(new Set([0]));
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const animationFrameId = useRef(null);  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionIndex = parseInt(entry.target.dataset.sectionIndex);
          setVisibleSections(prev => {
            const newSet = new Set(prev);
            if (entry.isIntersecting) {
              newSet.add(sectionIndex);
              if (entry.intersectionRatio > 0.5) {
                setActiveSection(sectionIndex);
              }
            } else {
              if (entry.intersectionRatio < 0.1) {
                newSet.delete(sectionIndex);
              }
            }
            return newSet;
          });
        });
      },
      {
        threshold: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
        rootMargin: '-5% 0px -5% 0px'
      }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const currentTime = Date.now();
    
    const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
    const velocity = Math.abs(currentScrollY - lastScrollY.current) / (currentTime - lastScrollTime.current);
    
    setScrollY(currentScrollY);
    setScrollDirection(direction);
    setScrollVelocity(velocity);
    
    lastScrollY.current = currentScrollY;
    lastScrollTime.current = currentTime;
  }, []);
  useEffect(() => {
    const optimizedScrollHandler = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    return () => {
      window.removeEventListener('scroll', optimizedScrollHandler);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleScroll]);
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Multiple methods to force scroll to top, especially for pull-to-refresh
    const forceScrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    // Immediate scroll to top
    forceScrollToTop();
    
    // Handle page show event (covers pull-to-refresh and back button)
    const handlePageShow = (event) => {
      if (event.persisted) {
        // Page was loaded from cache (like pull-to-refresh)
        forceScrollToTop();
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);
    
    const timer = setTimeout(() => {
      // Force scroll to top again after component loads
      forceScrollToTop();
      setIsLoaded(true);
      const heroElement = sectionRefs.current[0];
      if (heroElement) {
        heroElement.classList.add('animate-fadeInUp');
      }
    }, 300);
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.removeEventListener('pageshow', handlePageShow);
      clearTimeout(timer);
    };
  }, []);
  const handleNavigate = (route) => {
    if (route === '/demo') {
      navigate('/coaching');
    } else if (route === '/register') {
      navigate('/register');
    } else {
      navigate(route);
    }
  };

  const isSectionVisible = (index) => visibleSections.has(index);
  const isActiveSection = (index) => activeSection === index;  const navigateToSection = useCallback((sectionIndex) => {
    const targetSection = sectionRefs.current[sectionIndex];
    if (!targetSection) {
      console.warn('Target section not found:', sectionIndex);
      return;
    }

    if (sectionIndex === 0) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setActiveSection(sectionIndex);
      return;
    }

    const navbarSelectors = [
      'nav',
      '[data-navbar]', 
      '.fixed.top-0',
      'header',
      '.navbar',
      '.nav'
    ];
    
    let navbar = null;
    for (const selector of navbarSelectors) {
      navbar = document.querySelector(selector);
      if (navbar && navbar.getBoundingClientRect().height > 0) {
        break;
      }
    }
    
    let navbarHeight = 0;
    if (navbar) {
      const navbarRect = navbar.getBoundingClientRect();
      navbarHeight = navbarRect.height;
    }
    
    const sectionTop = targetSection.offsetTop;
      // Check if we're on mobile (screen width less than 768px)
    const isMobile = window.innerWidth < 768;
    
    // Add extra offset for Coaching (section 2) and GymBros (section 3) on mobile
    let extraOffset = 0;
    if (isMobile && (sectionIndex === 2 || sectionIndex === 3)) {
      extraOffset = -50; // Scroll 100px higher for these sections on mobile
    }
    
    const targetPosition = Math.max(0, sectionTop - navbarHeight - extraOffset);
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    setActiveSection(sectionIndex);
  }, []);
  // Advanced parallax calculations with momentum and enhanced fading
  const getParallaxOffset = (sectionIndex, intensity = 0.15) => {
    const sectionElement = sectionRefs.current[sectionIndex];
    if (!sectionElement) return { y: 0, scale: 1, opacity: 1 };
    
    const rect = sectionElement.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const distanceFromCenter = sectionCenter - viewportCenter;
    
    // Calculate parallax with easing
    const parallaxY = distanceFromCenter * intensity;
    
    // Enhanced scale and opacity calculations for dramatic fading
    const viewportDistance = Math.abs(distanceFromCenter) / window.innerHeight;
    const scale = Math.max(0.85, 1 - viewportDistance * 0.15); // More dramatic scaling
    
    // Enhanced opacity fade - more dramatic transition
    let opacity;
    if (Math.abs(distanceFromCenter) < window.innerHeight * 0.3) {
      // Section is mostly in view - full opacity
      opacity = 1;
    } else if (Math.abs(distanceFromCenter) < window.innerHeight * 0.8) {
      // Section is partially in view - gradual fade
      const fadeRatio = (Math.abs(distanceFromCenter) - window.innerHeight * 0.3) / (window.innerHeight * 0.5);
      opacity = Math.max(0.1, 1 - Math.pow(fadeRatio, 1.5)); // Exponential fade for smoother transition
    } else {
      // Section is mostly out of view - minimum opacity
      opacity = 0.1;
    }
    
    return {
      y: parallaxY,
      scale: scale,
      opacity: isActiveSection(sectionIndex) ? 1 : opacity
    };
  };

  // Enhanced background effects with dramatic fading
  const getBackgroundEffect = (sectionIndex) => {
    const effects = getParallaxOffset(sectionIndex, 0.1);
    const mouseX = mousePosition.x * 10;
    const mouseY = mousePosition.y * 10;
    
    // Additional blur effect for out-of-focus sections
    const blurAmount = effects.opacity < 0.8 ? (1 - effects.opacity) * 8 : 0;
    
    return {
      transform: `
        translateY(${effects.y}px) 
        translateX(${mouseX * 0.5}px) 
        scale(${effects.scale})
      `,
      opacity: effects.opacity,
      filter: `blur(${blurAmount}px) brightness(${0.3 + effects.opacity * 0.7})`,
      transition: 'opacity 0.6s ease-out, filter 0.6s ease-out, transform 0.3s ease-out',
    };
  };

  // Section animation variants
  const getSectionAnimation = (index) => {
    const animations = [
      'animate-fadeInScale', // Hero
      'animate-slideInLeft', // Shop
      'animate-slideInRight', // Coaching
      'animate-floatIn', // Gym Bros
      'animate-slideUpFade', // Games
    ];
    return animations[index] || 'animate-fadeInUp';
  };

  // Calculate scroll progress
  const scrollProgress = Math.min(
    100,
    (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );
  return (
    <>
      {/* Enhanced Global CSS for sophisticated animations */}
      <style jsx>{`        @keyframes revealSection {
          from {
            opacity: 0;
            transform: translateY(100px) scale(0.9);
            filter: blur(15px) brightness(0.3);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px) brightness(1);
          }
        }

        @keyframes morphBackground {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }

        @keyframes floatingElements {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(1deg);
          }
          66% {
            transform: translateY(5px) rotate(-1deg);
          }
        }

        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(79, 70, 229, 0.3), 
                        0 0 40px rgba(124, 58, 237, 0.2),
                        0 0 60px rgba(236, 72, 153, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(79, 70, 229, 0.5), 
                        0 0 60px rgba(124, 58, 237, 0.3),
                        0 0 90px rgba(236, 72, 153, 0.2);
          }
        }

        .section-transition {
          transition: all 1.0s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .section-visible {
          animation: revealSection 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .section-hidden {
          opacity: 0;
          transform: translateY(100px) scale(0.9);
          filter: blur(15px) brightness(0.3);
        }

        .section-active {
          transform: scale(1.02);
          z-index: 10;
          filter: brightness(1.1) contrast(1.05);
        }

        .parallax-bg {
          transition: transform 0.3s ease-out, opacity 0.6s ease-out, filter 0.6s ease-out;
        }

        .floating-elements {
          animation: floatingElements 8s ease-in-out infinite;
        }

        .morphing-bg {
          animation: morphBackground 20s ease-in-out infinite;
        }

        .gradient-flow {
          background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe);
          background-size: 400% 400%;
          animation: gradientFlow 8s ease infinite;
        }

        .glow-effect {
          animation: pulseGlow 3s ease-in-out infinite;
        }

        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 12px;
        }

        ::-webkit-scrollbar-track {
          background: ${darkMode ? 'rgba(31, 41, 55, 0.3)' : 'rgba(243, 244, 246, 0.3)'};
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #4f46e5, #7c3aed, #ec4899);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #4338ca, #6d28d9, #db2777);
          background-clip: content-box;
        }
      `}</style>

      <div ref={containerRef} className="w-full relative overflow-hidden" style={{ margin: 0, padding: 0, top: 0 }}>
        {/* Enhanced loading overlay with animated elements */}
        {!isLoaded && (
          <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
            <div className="text-center relative">
              {/* Animated background elements */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full morphing-bg"></div>
              <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-purple-500/20 rounded-full morphing-bg" style={{animationDelay: '3s'}}></div>
              
              {/* Loading spinner with glow effect */}
              <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6 mx-auto glow-effect"></div>
              
              {/* Animated text */}
              <p className="text-white text-xl font-medium mb-2 animate-pulse">Loading your fitness journey...</p>
              <div className="flex justify-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating decorative elements */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-4 h-4 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full floating-elements`}
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${6 + i * 0.5}s`
              }}
            />
          ))}
        </div>        {/* Hero Section with enhanced effects */}        <section 
          ref={el => sectionRefs.current[0] = el}
          data-section-index={0}
          className={`min-h-screen w-full relative overflow-hidden section-transition ${
            isSectionVisible(0) ? `section-visible ${getSectionAnimation(0)}` : 'section-hidden'
          } ${isActiveSection(0) ? 'section-active' : ''}`}
          style={{ margin: 0, padding: 0, top: 0, position: 'relative' }}
        >
          <div 
            className="absolute inset-0 parallax-bg"
            style={getBackgroundEffect(0)}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 gradient-flow"></div>
              <HeroSection 
              onNavigate={handleNavigate} 
              isActive={isSectionVisible(0)}
              goToSection={navigateToSection}
              scrollY={scrollY}
              mousePosition={mousePosition}
            />
          </div>
          
          {/* Section transition effect */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-transparent via-gray-900/10 to-transparent pointer-events-none"></div>
        </section>

        {/* Shop Section with slide-in animation */}
        <section 
          ref={el => sectionRefs.current[1] = el}
          data-section-index={1}
          className={`min-h-screen w-full relative overflow-hidden section-transition ${
            isSectionVisible(1) ? `section-visible ${getSectionAnimation(1)}` : 'section-hidden'
          } ${isActiveSection(1) ? 'section-active' : ''}`}
        >
          <div 
            className="absolute inset-0 parallax-bg"
            style={{
              ...getBackgroundEffect(1),
              animationDelay: '0.2s'
            }}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/10 via-blue-900/10 to-purple-900/10"></div>
            
            <ShopSection 
              onNavigate={handleNavigate} 
              isActive={isSectionVisible(1)}
              scrollY={scrollY}
              parallaxOffset={getParallaxOffset(1)}
            />
          </div>
          
          {/* Subtle border effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </section>

        {/* Coaching Section with slide-in from right */}
        <section 
          ref={el => sectionRefs.current[2] = el}
          data-section-index={2}
          className={`min-h-screen w-full relative overflow-hidden section-transition ${
            isSectionVisible(2) ? `section-visible ${getSectionAnimation(2)}` : 'section-hidden'
          } ${isActiveSection(2) ? 'section-active' : ''}`}
        >
          <div 
            className="absolute inset-0 parallax-bg"
            style={{
              ...getBackgroundEffect(2),
              animationDelay: '0.4s'
            }}
          >
            {/* Dynamic background */}
            <div className="absolute inset-0 bg-gradient-to-l from-orange-900/10 via-red-900/10 to-pink-900/10"></div>
            
            <CoachingSection 
              onNavigate={handleNavigate} 
              isActive={isSectionVisible(2)}
              scrollY={scrollY}
              scrollDirection={scrollDirection}
            />
          </div>
          
          {/* Glowing accent line */}
          <div className="absolute top-1/2 left-0 w-2 h-32 bg-gradient-to-b from-orange-500/50 via-red-500/50 to-pink-500/50 rounded-r-full blur-sm"></div>
        </section>

        {/* Gym Bros Section with float-in animation */}
        <section 
          ref={el => sectionRefs.current[3] = el}
          data-section-index={3}
          className={`min-h-screen w-full relative overflow-hidden section-transition ${
            isSectionVisible(3) ? `section-visible ${getSectionAnimation(3)}` : 'section-hidden'
          } ${isActiveSection(3) ? 'section-active' : ''}`}
        >
          <div 
            className="absolute inset-0 parallax-bg"
            style={{
              ...getBackgroundEffect(3),
              animationDelay: '0.6s'
            }}
          >
            {/* Morphing background */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900/10 via-blue-900/10 to-indigo-900/10 morphing-bg"></div>
            
            <GymBrosSection 
              onNavigate={handleNavigate} 
              isActive={isSectionVisible(3)}
              scrollY={scrollY}
              scrollVelocity={scrollVelocity}
            />
          </div>
          
          {/* Animated corner accents */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/20 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-tr-full"></div>
        </section>

        {/* Games Section with slide-up animation */}
        <section 
          ref={el => sectionRefs.current[4] = el}
          data-section-index={4}
          className={`min-h-screen w-full relative overflow-hidden section-transition ${
            isSectionVisible(4) ? `section-visible ${getSectionAnimation(4)}` : 'section-hidden'
          } ${isActiveSection(4) ? 'section-active' : ''}`}
        >
          <div 
            className="absolute inset-0 parallax-bg"
            style={{
              ...getBackgroundEffect(4),
              animationDelay: '0.8s'
            }}
          >
            {/* Gaming-themed background */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 via-pink-900/10 to-yellow-900/10"></div>
            
            <GamesSection 
              onNavigate={handleNavigate} 
              isActive={isSectionVisible(4)}
              scrollY={scrollY}
              isLastSection={true}
            />
          </div>
          
          {/* Bottom glow effect */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-2 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent blur-sm"></div>
        </section>        {/* Enhanced Scroll Progress Indicator */}
        <div className="fixed top-0 left-0 w-full h-2 bg-black/20 backdrop-blur-sm z-50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${scrollProgress}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>        {/* Enhanced Section Navigation with labels */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 space-y-6">
          {[
            { index: 0, label: 'Home', icon: '🏠' },
            { index: 1, label: 'Shop', icon: '🛍️' },
            { index: 2, label: 'Coaching', icon: '💪' },
            { index: 3, label: 'Community', icon: '👥' },
            { index: 4, label: 'Games', icon: '🎮' }
          ].map(({ index, label, icon }) => (
            <div key={index} className="relative group">
              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`block w-4 h-4 rounded-full transition-all duration-500 relative overflow-hidden ${
                  isActiveSection(index)
                    ? `${darkMode ? 'bg-white' : 'bg-gray-900'} scale-150 shadow-lg ${darkMode ? 'shadow-white/50 ring-2 ring-white/30' : 'shadow-gray-900/50 ring-2 ring-gray-900/30'}`
                    : isSectionVisible(index)
                    ? `${darkMode ? 'bg-white/80' : 'bg-gray-900/80'} scale-125 shadow-md ${darkMode ? 'shadow-white/30' : 'shadow-gray-900/30'}`
                    : `${darkMode ? 'bg-white/30 hover:bg-white/60' : 'bg-gray-900/30 hover:bg-gray-900/60'} hover:scale-110`
                }`}
                aria-label={`Go to ${label} section`}
              >
                {/* Pulsing center dot for active section */}
                {isActiveSection(index) && (
                  <div className={`absolute inset-1 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'} rounded-full animate-ping`}></div>
                )}
              </button>
              
              {/* Tooltip */}
              <div className={`absolute right-8 top-1/2 transform -translate-y-1/2 ${darkMode ? 'bg-black/80 text-white' : 'bg-white/90 text-gray-900'} px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg`}>
                <span className="mr-2">{icon}</span>
                {label}
                <div className={`absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent ${darkMode ? 'border-l-black/80' : 'border-l-white/90'}`}></div>
              </div>
            </div>
          ))}
        </div>{/* Section transition overlays */}
        <div className="fixed inset-0 pointer-events-none z-30">
          {/* Dynamic background overlay based on active section */}
          <div 
            className="absolute inset-0 transition-all duration-1000 ease-in-out"
            style={{
              background: activeSection === 0 ? 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)' :
                         activeSection === 1 ? 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)' :
                         activeSection === 2 ? 'radial-gradient(circle at 20% 20%, rgba(245, 101, 101, 0.05) 0%, transparent 50%)' :
                         activeSection === 3 ? 'radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)' :
                         activeSection === 4 ? 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)' :
                         'transparent'
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Home;