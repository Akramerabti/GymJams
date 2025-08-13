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
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [visibleSections, setVisibleSections] = useState(new Set([0]));
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isMobile, setIsMobile] = useState(false);
  const [snapTimeout, setSnapTimeout] = useState(null);
  
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const animationFrameId = useRef(null);
  const scrollTimeout = useRef(null);
  
  // Detect mobile and navbar height
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const getNavbarHeight = () => {
      const navbar = document.querySelector('nav, [data-navbar], .fixed.top-0, header');
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      }
    };
    
    checkMobile();
    getNavbarHeight();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', getNavbarHeight);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', getNavbarHeight);
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
              // More sensitive threshold for mobile devices
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
    
    // Clear existing snap timeout
    if (snapTimeout) {
      clearTimeout(snapTimeout);
    }
    
    // Set scrolling state timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
      
      // Snap-to-center logic with iOS-friendly timing
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
    
    const viewportHeight = window.innerHeight;
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
    
    // Only snap if the section is close enough to center
    const snapThreshold = viewportHeight * (isMobile ? 0.3 : 0.25);
    if (minDistance < snapThreshold) {
      navigateToSection(nearestSection, true);
    }
  }, [isScrolling, isMobile]);

  useEffect(() => {
    const optimizedScrollHandler = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(handleScroll);
    };

    // Use passive listeners for better performance on iOS
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

  // Enhanced page load handling
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      setIsLoaded(true);
      const heroElement = sectionRefs.current[0];
      if (heroElement) {
        heroElement.classList.add('animate-fadeInUp');
      }
    }, 300);
    
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
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
  const isActiveSection = (index) => activeSection === index;

  // Enhanced navigation with smooth scrolling and iOS optimization
  const navigateToSection = useCallback((sectionIndex, isSnap = false) => {
    const targetSection = sectionRefs.current[sectionIndex];
    if (!targetSection) {
      console.warn('Target section not found:', sectionIndex);
      return;
    }

    // Clear any pending snap timeout
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
    const extraOffset = isMobile && (sectionIndex === 2 || sectionIndex === 3) ? -50 : 0;
    
    // More precise positioning for snap-to-center
    let targetPosition;
    if (isSnap) {
      const sectionHeight = targetSection.offsetHeight;
      const viewportHeight = window.innerHeight;
      const sectionCenter = sectionTop + sectionHeight / 2;
      targetPosition = Math.max(0, sectionCenter - viewportHeight / 2);
    } else {
      targetPosition = Math.max(0, sectionTop - navbarHeight - extraOffset);
    }
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    setActiveSection(sectionIndex);
  }, [snapTimeout, isMobile, navbarHeight]);

  const scrollProgress = Math.min(
    100,
    (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );

  // Responsive pagination dots configuration
  const getDotSize = () => {
    if (isMobile) {
      return 'w-2.5 h-2.5';
    }
    return 'w-3 h-3';
  };

  const getDotSpacing = () => {
    if (isMobile) {
      return 'space-y-3';
    }
    return 'space-y-4';
  };

  const getPaginationPosition = () => {
    if (isMobile) {
      return 'right-3 top-1/2';
    }
    return 'right-6 top-1/2';
  };

  return (
    <>
      <style jsx>{`
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
        
        /* iOS-specific optimizations */
        @supports (-webkit-touch-callout: none) {
          .home-fluid {
            -webkit-overflow-scrolling: touch;
          }
          
          .pagination-dot {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className="home-fluid w-full relative overflow-hidden"
        style={{
          margin: 0,
          padding: 0,
          top: 0,
          fontSize: 'clamp(1rem, 1vw + 0.75rem, 1.125rem)',
        }}
      >
        {!isLoaded && (
          <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6 mx-auto"></div>
              <p className="text-white text-xl font-medium animate-pulse">{t('home.loading')}</p>
            </div>
          </div>
        )}

        {/* Sections */}
        <section 
          ref={el => sectionRefs.current[0] = el}
          data-section-index={0}
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(0) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(0) ? 'section-active' : ''}`}
        >
          <HeroSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(0)}
            goToSection={navigateToSection}
            scrollY={scrollY}
          />
        </section>

        <section 
          ref={el => sectionRefs.current[1] = el}
          data-section-index={1}
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(1) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(1) ? 'section-active' : ''}`}
        >
          <ShopSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(1)}
            scrollY={scrollY}
          />
        </section>

        <section 
          ref={el => sectionRefs.current[2] = el}
          data-section-index={2}
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(2) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(2) ? 'section-active' : ''}`}
        >
          <CoachingSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(2)}
            scrollY={scrollY}
            scrollDirection={scrollDirection}
          />
        </section>

        <section 
          ref={el => sectionRefs.current[3] = el}
          data-section-index={3}
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(3) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(3) ? 'section-active' : ''}`}
        >
          <GymBrosSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(3)}
            scrollY={scrollY}
            scrollVelocity={scrollVelocity}
          />
        </section>

        <section 
          ref={el => sectionRefs.current[4] = el}
          data-section-index={4}
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(4) ? 'animate-fadeIn' : 'section-hidden'} ${isActiveSection(4) ? 'section-active' : ''}`}
        >
          <GamesSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(4)}
            scrollY={scrollY}
            isLastSection={true}
          />
        </section>

        {/* Enhanced Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-black/10 backdrop-blur-sm z-50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Enhanced Responsive Pagination Dots */}
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
                    : (darkMode ? 'bg-gray-600/50 hover:bg-gray-400/70' : 'bg-gray-300/50 hover:bg-gray-500/70')
                  }`}
                aria-label={`Go to ${label} section`}
              >
                {isActiveSection(index) && (
                  <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" />
                )}
              </button>
              
              {/* Enhanced Tooltip */}
              <div className={`pagination-tooltip absolute right-6 top-1/2 px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg
                ${darkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-800'}`}>
                {label}
                <div className={`absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent
                  ${darkMode ? 'border-l-gray-800/90' : 'border-l-white/90'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;