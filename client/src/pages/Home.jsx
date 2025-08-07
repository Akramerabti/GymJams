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
  
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const animationFrameId = useRef(null);
  
  useEffect(() => {
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
        threshold: [0, 0.1, 0.5, 1],
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
  }, []);

  // --- THIS IS THE FIX ---
  useEffect(() => {
    // 1. Tell the browser to let us handle scrolling on refresh
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // 2. Scroll to the top of the page
    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      setIsLoaded(true);
      const heroElement = sectionRefs.current[0];
      if (heroElement) {
        heroElement.classList.add('animate-fadeInUp');
      }
    }, 300);
    
    // 3. Restore default browser behavior when the component unmounts
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

  const navigateToSection = useCallback((sectionIndex) => {
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
    const isMobile = window.innerWidth < 768;
    
    let extraOffset = 0;
    if (isMobile && (sectionIndex === 2 || sectionIndex === 3)) {
      extraOffset = -50;
    }
    
    const targetPosition = Math.max(0, sectionTop - navbarHeight - extraOffset);
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    setActiveSection(sectionIndex);
  }, []);

  const getParallaxOffset = (sectionIndex, intensity = 0.15) => {
    const sectionElement = sectionRefs.current[sectionIndex];
    if (!sectionElement) return { y: 0, scale: 1, opacity: 1 };
    
    const rect = sectionElement.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const distanceFromCenter = sectionCenter - viewportCenter;
    
    const parallaxY = distanceFromCenter * intensity;
    
    const viewportDistance = Math.abs(distanceFromCenter) / window.innerHeight;
    const scale = Math.max(0.85, 1 - viewportDistance * 0.15);
    
    let opacity;
    if (Math.abs(distanceFromCenter) < window.innerHeight * 0.3) {
      opacity = 1;
    } else if (Math.abs(distanceFromCenter) < window.innerHeight * 0.8) {
      const fadeRatio = (Math.abs(distanceFromCenter) - window.innerHeight * 0.3) / (window.innerHeight * 0.5);
      opacity = Math.max(0.1, 1 - Math.pow(fadeRatio, 1.5));
    } else {
      opacity = 0.1;
    }
    
    return {
      y: parallaxY,
      scale: scale,
      opacity: isActiveSection(sectionIndex) ? 1 : opacity
    };
  };

  const getBackgroundEffect = (sectionIndex) => {
    const effects = getParallaxOffset(sectionIndex, 0.1);
    
    const blurAmount = effects.opacity < 0.8 ? (1 - effects.opacity) * 8 : 0;
    
    return {
      transform: `
        translateY(${effects.y}px) 
        scale(${effects.scale})
      `,
      opacity: effects.opacity,
      filter: `blur(${blurAmount}px) brightness(${0.3 + effects.opacity * 0.7})`,
      transition: 'opacity 0.6s ease-out, filter 0.6s ease-out, transform 0.3s ease-out',
    };
  };

   const getSectionAnimation = () => {
    return 'animate-fadeIn';
  };

  const scrollProgress = Math.min(
    100,
    (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .section-hidden { opacity: 0; }
        .section-active { z-index: 10; }
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

        <section 
          ref={el => sectionRefs.current[0] = el}
          data-section-index={0}
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(0) ? `animate-fadeIn` : 'section-hidden'} ${isActiveSection(0) ? 'section-active' : ''}`}
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
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(1) ? `animate-fadeIn` : 'section-hidden'} ${isActiveSection(1) ? 'section-active' : ''}`}
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
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(2) ? `animate-fadeIn` : 'section-hidden'} ${isActiveSection(2) ? 'section-active' : ''}`}
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
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(3) ? `animate-fadeIn` : 'section-hidden'} ${isActiveSection(3) ? 'section-active' : ''}`}
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
          className={`min-h-screen w-full relative overflow-hidden ${isSectionVisible(4) ? `animate-fadeIn` : 'section-hidden'} ${isActiveSection(4) ? 'section-active' : ''}`}
        >
          <GamesSection 
            onNavigate={handleNavigate} 
            isActive={isSectionVisible(4)}
            scrollY={scrollY}
            isLastSection={true}
          />
        </section>

        <div
          className="fixed top-0 left-0 w-full h-2 bg-black/20 backdrop-blur-sm z-50"
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${scrollProgress}%` }}
          ></div>
        </div>

        <div
          className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 space-y-4"
        >
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
                className={`block w-3 h-3 rounded-full transition-all duration-300 relative
                  ${isActiveSection(index)
                    ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-400/40'
                    : (darkMode ? 'bg-gray-600 hover:bg-gray-400' : 'bg-gray-300 hover:bg-gray-500')
                  }`}
                aria-label={`Go to ${label} section`}
                style={{
                  transitionProperty: 'background, transform, box-shadow',
                  transitionDuration: isActiveSection(index) ? '400ms' : '200ms',
                  transitionTimingFunction: isActiveSection(index) ? 'cubic-bezier(.4,2,.6,1)' : 'ease'
                }}
              >
                {/* Animated pulse for active dot */}
                {isActiveSection(index) && (
                  <span
                    className="absolute inset-0 rounded-full bg-blue-400/40 animate-ping"
                    style={{
                      zIndex: 0,
                      animationDuration: '1.2s'
                    }}
                  />
                )}
              </button>
              {/* Tooltip */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;