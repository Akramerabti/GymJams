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
  
  const [backgroundColor] = useState(() => {
    // Use Math.random() for true 50/50 chance
    return Math.random() < 0.5 ? '#ffffff' : '#000000';
  });
  
  const textColor = backgroundColor === '#ffffff' ? '#000000' : '#ffffff';
  
  const [visibleSections, setVisibleSections] = useState(new Set([0]));
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [snapTimeout, setSnapTimeout] = useState(null);
  
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const animationFrameId = useRef(null);
  const scrollTimeout = useRef(null);
  
  // Define sections like in Home.jsx
  const sections = [
    { 
      component: ConversionHeroSection, 
      label: t('home.sections.home') || 'Home',
      props: { backgroundColor, textColor }
    },
    { 
      component: ShopSection, 
      label: t('home.sections.shop') || 'Shop',
      props: { backgroundColor, textColor, navbarHeight: 0 } // Explicit navbarHeight for context
    },
    { 
      component: CoachingSection, 
      label: t('home.sections.coaching') || 'Coaching',
      props: { backgroundColor, textColor }
    },
    { 
      component: GymBrosSection, 
      label: t('home.sections.community') || 'Community',
      props: { backgroundColor, textColor }
    },
    { 
      component: GamesSection, 
      label: t('home.sections.games') || 'Games',
      props: { backgroundColor, textColor, isLastSection: true }
    }
  ];
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Intersection observer - simplified like Home.jsx
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px 0px -50% 0px', // No navbar offset needed
      threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const sectionIndex = parseInt(entry.target.dataset.sectionIndex);
        
        if (entry.isIntersecting) {
          console.log('Setting active section via observer:', sectionIndex);
          setActiveSection(sectionIndex);
          setVisibleSections(prev => new Set(prev).add(sectionIndex));
        } else {
          setVisibleSections(prev => {
            const newSet = new Set(prev);
            newSet.delete(sectionIndex);
            return newSet;
          });
        }
      });
    }, options);
    
    sectionRefs.current.forEach(section => {
      if (section) observer.observe(section);
    });
    
    return () => observer.disconnect();
  }, []);

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
        // Simple snapping logic
        const viewportHeight = window.innerHeight;
        const currentScroll = window.scrollY;
        const currentSectionFloat = currentScroll / viewportHeight;
        const nearestSection = Math.round(currentSectionFloat);
        const distanceFromNearest = Math.abs(currentSectionFloat - nearestSection);
        
        if (distanceFromNearest > 0.1) {
          navigateToSection(nearestSection);
        }
      }, snapDelay);
      
      setSnapTimeout(newSnapTimeout);
    }, isMobile ? 150 : 100);
    
    lastScrollY.current = currentScrollY;
    lastScrollTime.current = currentTime;
  }, [isMobile, snapTimeout]);

  // Navigate to section - like Home.jsx but no navbar offset
  const navigateToSection = useCallback((index) => {
    const section = sectionRefs.current[index];
    if (!section) {
      console.error('Target section not found:', index);
      return;
    }

    if (snapTimeout) {
      clearTimeout(snapTimeout);
      setSnapTimeout(null);
    }

    const sectionTop = section.offsetTop; // No navbar offset needed
    
    console.log('Scrolling to section:', index, 'position:', sectionTop);
    console.log('Document height:', document.documentElement.scrollHeight);
    
    window.scrollTo({
      top: sectionTop,
      behavior: 'smooth'
    });
    
    setActiveSection(index);
  }, [snapTimeout]);

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

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

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

  const scrollProgress = Math.min(
    100,
    (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );

  // Responsive pagination dots configuration
  const getDotSize = () => isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const getDotSpacing = () => isMobile ? 'space-y-3' : 'space-y-4';
  const getPaginationPosition = () => isMobile ? 'right-3 top-1/2' : 'right-6 top-1/2';

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Force html/body to allow full document height */
        html, body {
          height: auto !important;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          overflow-y: auto !important;
        }

        /* Main container */
        .conversion-container {
          width: 100%;
          overflow-x: hidden;
          position: relative;
        }

        /* Section styling - FIXED: Exact viewport height, no extra padding */
        .conversion-section {
          width: 100%;
          height: 100vh; /* Changed from min-height to height */
          height: 100dvh; /* Use dvh when supported */
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background-color: ${backgroundColor};
          color: ${textColor};
          /* Removed padding from here - will be handled by inner content */
        }

        /* Fallback for browsers that don't support dvh */
        @supports not (height: 100dvh) {
          .conversion-section {
            height: 100vh;
          }
        }

        /* Section content wrapper with proper padding */
        .section-content {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Add padding here instead of on the section */
          padding: clamp(1rem, 4vw, 2rem);
          box-sizing: border-box;
        }

        /* Mobile specific adjustments */
        @media (max-width: 768px) {
          .section-content {
            padding: 1rem;
          }
          
          /* Ensure mobile browsers respect the height */
          .conversion-section {
            height: 100vh;
            height: 100dvh;
          }
        }

        /* Animation classes */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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

        /* Navigation dots */
        .nav-dots {
          position: fixed;
          right: 2rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: transparent !important;
          box-shadow: none !important;
        }
        
        @media (max-width: 768px) {
          .nav-dots {
            right: 1rem;
            gap: 0.75rem;
          }
        }
        
        .nav-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #d1d5db !important; /* gray-300 */
          padding: 0;
          position: relative;
        }
        
        .nav-dot:hover {
          transform: scale(1.2);
          background: rgba(255, 255, 255, 0.5);
        }
        
        .nav-dot.active {
          background: #000 !important;
          transform: scale(1.3);
        }
        
        .nav-dot-tooltip {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        
        .nav-dot:hover .nav-dot-tooltip {
          opacity: 1;
        }

        /* Dark mode adjustments */
        .dark .nav-dot {
          background: rgba(0, 0, 0, 0.5);
        }
        
        .dark .nav-dot:hover {
          background: rgba(0, 0, 0, 0.7);
        }

        /* CSS Custom Properties for dvh support */
        :root {
          --vh: 1vh;
          --dvh: 1vh;
        }

        /* Set custom property on page load/resize */
        @supports (height: 100dvh) {
          :root {
            --dvh: 1dvh;
          }
        }
      `}</style>

      <div ref={containerRef} className="conversion-container">
        {/* Main sections */}
        {sections.map((section, index) => {
          const SectionComponent = section.component;
          return (
            <section
              key={index}
              ref={el => sectionRefs.current[index] = el}
              data-section-index={index}
              className={`conversion-section ${darkMode ? 'dark' : ''}`}
            >
              <div className="section-content">
                <SectionComponent
                  onNavigate={handleNavigate}
                  isActive={activeSection === index}
                  goToSection={navigateToSection}
                  scrollY={scrollY}
                  scrollDirection={scrollDirection}
                  scrollVelocity={scrollVelocity}
                  {...section.props}
                />
              </div>
            </section>
          );
        })}

        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-black/10 backdrop-blur-sm z-50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 transition-all duration-300 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Navigation dots */}
        <nav className="nav-dots" aria-label="Section navigation">
          {sections.map((section, index) => (
            <button
              key={index}
              onClick={() => {
                console.log('Dot clicked for section:', index);
                navigateToSection(index);
              }}
              className={`nav-dot ${activeSection === index ? 'active' : ''}`}
              aria-label={`Go to ${section.label}`}
            >
              <span className="nav-dot-tooltip">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};

export default ConversionLanding;