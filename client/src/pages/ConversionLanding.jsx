import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ShopSection, 
  GymBrosSection, 
  GamesSection, 
  CoachingSection 
} from '../components/home-sections';
import ConversionHeroSection from '../components/home-sections/ConversionHeroSection';
import { useTranslation } from 'react-i18next';

const CONVERSION_LOADED_KEY = 'gymtonic-conversion-loaded';

const ConversionLanding = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // ACTUAL random background that changes on refresh - use Date.now() to force randomization
  const [backgroundColor] = useState(() => {
    const seed = Date.now() + Math.random();
    return seed % 2 > 1 ? '#ffffff' : '#000000';
  });
  
  const textColor = backgroundColor === '#ffffff' ? '#000000' : '#ffffff';
  
  // Check if conversion has been loaded this session
  const hasLoadedThisSession = sessionStorage.getItem(CONVERSION_LOADED_KEY) === 'true';
  
  const [visibleSections, setVisibleSections] = useState(new Set([0]));
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [isLoaded, setIsLoaded] = useState(hasLoadedThisSession);
  const [activeSection, setActiveSection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  // For ConversionLanding, there's no navbar, so set to 0
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [snapTimeout, setSnapTimeout] = useState(null);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const animationFrameId = useRef(null);
  const scrollTimeout = useRef(null);
  
  // Detect mobile, navbar height, and viewport height
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    
    // For ConversionLanding, explicitly check if navbar exists (it shouldn't)
    const getNavbarHeight = () => {
      const navbar = document.querySelector('nav, [data-navbar], .fixed.top-0, header');
      // ConversionLanding should NOT have a navbar, so force to 0
      setNavbarHeight(0);
      console.log('ConversionLanding: Navbar height set to 0 (no navbar expected)');
    };
    
    checkMobile();
    getNavbarHeight();
    updateViewportHeight();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', getNavbarHeight);
    window.addEventListener('resize', updateViewportHeight);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', getNavbarHeight);
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  // Enhanced intersection observer with better mobile support
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionIndex = parseInt(entry.target.dataset.sectionIndex);
          setVisibleSections(prev => {
            const newSet = new Set(prev);
            if (entry.isIntersecting) {
              newSet.add(sectionIndex);
              const threshold = isMobile ? 0.3 : 0.5;
              if (entry.intersectionRatio > threshold) {
                setActiveSection(sectionIndex);
              }
            } else {
              if (entry.intersectionRatio < 0.05) {
                newSet.delete(sectionIndex);
              }
            }
            return newSet;
          });
        });
      },
      {
        threshold: isMobile ? [0, 0.05, 0.3, 0.7, 1] : [0, 0.1, 0.5, 0.8, 1],
        rootMargin: isMobile ? '-10% 0px -10% 0px' : '-5% 0px -5% 0px'
      }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isMobile]);

  // Enhanced scroll handling with snap-to-center functionality
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const currentTime = Date.now();
    
    const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
    const velocity = Math.abs(currentScrollY - lastScrollY.current) / (currentTime - lastScrollTime.current) || 0;
    
    setScrollY(currentScrollY);
    setScrollDirection(direction);
    setScrollVelocity(velocity);
    setIsScrolling(true);
    
    if (snapTimeout) {
      clearTimeout(snapTimeout);
    }
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
      
      const snapDelay = isMobile ? 150 : 100;
      const newSnapTimeout = setTimeout(() => {
        snapToNearestSection();
      }, snapDelay);
      
      setSnapTimeout(newSnapTimeout);
    }, isMobile ? 150 : 100);
    
    lastScrollY.current = currentScrollY;
    lastScrollTime.current = currentTime;
  }, [isMobile, snapTimeout]);

  // Smooth snap-to-center functionality
  const snapToNearestSection = useCallback(() => {
    if (isScrolling) return;
    
    const currentScroll = window.scrollY;
    let nearestSection = 0;
    let minDistance = Infinity;
    
    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;
      
      const rect = ref.getBoundingClientRect();
      const sectionTop = currentScroll + rect.top;
      const sectionCenter = sectionTop + rect.height / 2;
      const viewportCenter = currentScroll + viewportHeight / 2;
      const distance = Math.abs(sectionCenter - viewportCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestSection = index;
      }
    });
    
    const snapThreshold = viewportHeight * (isMobile ? 0.3 : 0.25);
    if (minDistance < snapThreshold) {
      navigateToSection(nearestSection, true);
    }
  }, [isScrolling, isMobile, viewportHeight]);

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
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      if (snapTimeout) {
        clearTimeout(snapTimeout);
      }
    };
  }, [handleScroll, snapTimeout]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo(0, 0);

    if (hasLoadedThisSession) {
      const heroElement = sectionRefs.current[0];
      if (heroElement) {
        heroElement.classList.add('animate-fadeInUp');
      }
    } else {
      sessionStorage.setItem(CONVERSION_LOADED_KEY, 'true');
      
      const timer = setTimeout(() => {
        setIsLoaded(true);
        const heroElement = sectionRefs.current[0];
        if (heroElement) {
          heroElement.classList.add('animate-fadeInUp');
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'auto';
        }
      };
    }
  }, [hasLoadedThisSession]);

  const handleNavigate = (route) => {
    sessionStorage.setItem('conversion-back-nav', 'true');
    
    if (route === '/demo') {
      navigate('/coaching');
    } else if (route === '/register') {
      navigate('/register');
    } else {
      navigate(route);
    }
  };

  const isSectionVisible = (index) => visibleSections.has(index);
  const isActiveSection = (index) => activeSection === index;

  // Enhanced navigation with smooth scrolling - using actual viewport height
  const navigateToSection = useCallback((sectionIndex, isSnap = false) => {
    const targetSection = sectionRefs.current[sectionIndex];
    if (!targetSection) {
      console.warn('Target section not found:', sectionIndex);
      return;
    }

    if (snapTimeout) {
      clearTimeout(snapTimeout);
      setSnapTimeout(null);
    }

    if (sectionIndex === 0) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setActiveSection(sectionIndex);
      return;
    }

    const sectionTop = targetSection.offsetTop;
    // No navbar in ConversionLanding, so no navbarHeight offset needed
    const extraOffset = isMobile && (sectionIndex === 2 || sectionIndex === 3) ? -50 : 0;
    
    let targetPosition;
    if (isSnap) {
      const sectionHeight = targetSection.offsetHeight;
      const sectionCenter = sectionTop + sectionHeight / 2;
      targetPosition = Math.max(0, sectionCenter - viewportHeight / 2);
    } else {
      targetPosition = Math.max(0, sectionTop + extraOffset);
    }
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    setActiveSection(sectionIndex);
  }, [snapTimeout, isMobile, viewportHeight]);

  const scrollProgress = Math.min(
    100,
    (scrollY / (document.documentElement.scrollHeight - viewportHeight)) * 100
  );

  // Responsive pagination dots configuration
  const getDotSize = () => isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const getDotSpacing = () => isMobile ? 'space-y-3' : 'space-y-4';
  const getPaginationPosition = () => isMobile ? 'right-3 top-1/2' : 'right-6 top-1/2';

  // Calculate the actual available height (full viewport since no navbar)
  const availableHeight = viewportHeight;

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          height: 100%;
          width: 100%;
          overflow-x: hidden;
        }

        /* Mobile viewport fix */
        @supports (-webkit-touch-callout: none) {
          .conversion-section {
            height: ${availableHeight}px;
            min-height: ${availableHeight}px;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }
        
        .section-hidden { 
          opacity: 0; 
        }
        
        .section-active { 
          z-index: 10; 
        }
        
        .pagination-dot {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .pagination-dot:hover {
          transform: scale(1.2);
        }
        
        .pagination-dot.active {
          transform: scale(1.3);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        
        .pagination-tooltip {
          transform: translateX(-100%) translateY(-50%);
          transition: all 0.2s ease-out;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        @media (max-width: 768px) {
          .pagination-tooltip {
            transform: translateX(-100%) translateY(-50%) scale(0.9);
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
        }

        .conversion-section {
          height: ${availableHeight}px;
          min-height: ${availableHeight}px;
          max-height: ${availableHeight}px;
          width: 100vw;
          max-width: 100vw;
          overflow: hidden;
          position: relative;
          padding: clamp(1rem, 4vw, 2rem);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: ${backgroundColor};
          color: ${textColor};
        }

        .conversion-section * {
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Force mobile browsers to use the correct height */
        @media (max-width: 768px) {
          .conversion-section {
            padding: 1rem;
            height: ${availableHeight}px;
            min-height: ${availableHeight}px;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className="conversion-fluid w-full relative"
        style={{
          margin: 0,
          padding: 0,
          backgroundColor,
          color: textColor,
          width: '100vw',
          maxWidth: '100vw',
          overflowX: 'hidden'
        }}
      >
        {!isLoaded && !hasLoadedThisSession && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ 
              backgroundColor,
              height: `${availableHeight}px`,
              width: '100vw'
            }}
          >
            <div className="text-center">
              <div 
                className="w-12 h-12 border-4 rounded-full animate-spin mb-4 mx-auto"
                style={{ 
                  borderColor: `${textColor}20`,
                  borderTopColor: textColor
                }}
              ></div>
              <p 
                className="text-lg font-medium animate-pulse"
                style={{ color: textColor }}
              >
                {t('home.loading')}
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section 
          ref={el => sectionRefs.current[0] = el}
          data-section-index={0}
          className={`conversion-section ${isSectionVisible(0) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(0) ? 'section-active' : ''}`}
        >
          <ConversionHeroSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(0)}
            goToSection={navigateToSection}
            scrollY={scrollY}
            backgroundColor={backgroundColor}
            textColor={textColor}
          />
        </section>

        {/* Shop Section */}
        <section 
          ref={el => sectionRefs.current[1] = el}
          data-section-index={1}
          className={`conversion-section ${isSectionVisible(1) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(1) ? 'section-active' : ''}`}
        >
          <ShopSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(1)}
            scrollY={scrollY}
            backgroundColor={backgroundColor}
            textColor={textColor}
          />
        </section>

        {/* Coaching Section */}
        <section 
          ref={el => sectionRefs.current[2] = el}
          data-section-index={2}
          className={`conversion-section ${isSectionVisible(2) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(2) ? 'section-active' : ''}`}
        >
          <CoachingSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(2)}
            scrollY={scrollY}
            scrollDirection={scrollDirection}
            backgroundColor={backgroundColor}
            textColor={textColor}
          />
        </section>

        {/* GymBros Section */}
        <section 
          ref={el => sectionRefs.current[3] = el}
          data-section-index={3}
          className={`conversion-section ${isSectionVisible(3) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(3) ? 'section-active' : ''}`}
        >
          <GymBrosSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(3)}
            scrollY={scrollY}
            scrollVelocity={scrollVelocity}
            backgroundColor={backgroundColor}
            textColor={textColor}
          />
        </section>

        {/* Games Section */}
        <section 
          ref={el => sectionRefs.current[4] = el}
          data-section-index={4}
          className={`conversion-section ${isSectionVisible(4) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(4) ? 'section-active' : ''}`}
        >
          <GamesSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(4)}
            scrollY={scrollY}
            isLastSection={true}
            backgroundColor={backgroundColor}
            textColor={textColor}
          />
        </section>

        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-black/10 backdrop-blur-sm z-50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Pagination Dots */}
        <div className={`fixed ${getPaginationPosition()} transform -translate-y-1/2 z-40 ${getDotSpacing()}`}>
          {[
            { index: 0, label: t('home.sections.home') },
            { index: 1, label: t('home.sections.shop') },
            { index: 2, label: t('home.sections.coaching') },
            { index: 3, label: t('home.sections.community') },
            { index: 4, label: t('home.sections.games') }
          ].map(({ index, label }) => (
            <div key={index} className="relative group flex items-center">
              <button
                onClick={() => navigateToSection(index)}
                className={`pagination-dot block ${getDotSize()} rounded-full relative
                  ${isActiveSection(index)
                    ? 'bg-blue-500 active'
                    : (backgroundColor === '#000000' ? 'bg-gray-300/50 hover:bg-gray-100/70' : 'bg-gray-600/50 hover:bg-gray-800/70')
                  }`}
                aria-label={`Go to ${label} section`}
              >
                {isActiveSection(index) && (
                  <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" />
                )}
              </button>
              
              <div className={`pagination-tooltip absolute right-6 top-1/2 px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg
                ${backgroundColor === '#000000' ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-800'}`}>
                {label}
                <div className={`absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent
                  ${backgroundColor === '#000000' ? 'border-l-gray-800/90' : 'border-l-white/90'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ConversionLanding;