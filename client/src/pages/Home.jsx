import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HeroSection, 
  ShopSection, 
  CoachingSection, 
  GymBrosSection, 
  GamesSection 
} from '../components/home-sections';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [activeSection, setActiveSection] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);
  
  // Define your sections here - you can adjust to only 4 if needed
  const sections = [
    { component: HeroSection, label: 'Home' },
    { component: ShopSection, label: 'Shop' },
    { component: CoachingSection, label: 'Coaching' },
    { component: GymBrosSection, label: 'Community' },
    { component: GamesSection, label: 'Games' }
  ];
  
  useEffect(() => {
    const getNavbarHeight = () => {
      // Directly measure the actual navbar element
      const navbar = document.querySelector('div[class*="shadow-lg"][class*="fixed"][class*="top-0"]');
      
      if (navbar) {
        const height = navbar.getBoundingClientRect().height;
        console.log('📏 Measured navbar height:', height);
        setNavbarHeight(height);
      } else {
        console.warn('⚠️ Navbar not found, retrying...');
        // Retry after a short delay if navbar isn't rendered yet
        setTimeout(getNavbarHeight, 50);
      }
    };

    // Initial measurement
    getNavbarHeight();
    
    // Re-measure on resize to capture responsive changes
    const handleResize = () => {
      requestAnimationFrame(getNavbarHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also re-measure when fonts load (can affect height)
    document.fonts.ready.then(getNavbarHeight);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Intersection observer for active section
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: `-${navbarHeight}px 0px -50% 0px`,
      threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.sectionIndex);
          setActiveSection(index);
        }
      });
    }, options);
    
    sectionRefs.current.forEach(section => {
      if (section) observer.observe(section);
    });
    
    return () => observer.disconnect();
  }, [navbarHeight]);
  
  // Navigate to section
  const navigateToSection = (index) => {
    const section = sectionRefs.current[index];
    if (!section) return;
    
    // Use offsetTop directly without subtracting navbar height
    // The browser will handle the positioning correctly
    const sectionTop = section.offsetTop;
    window.scrollTo({
      top: sectionTop,
      behavior: 'smooth'
    });
  };
  
  return (
    <>
      <style>{`
        :root {
          --navbar-height: ${navbarHeight}px;
        }
        
        * {
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          width: 100%;
        }
        
        .home-container {
          width: 100%;
          overflow-x: hidden;
          position: relative;
          /* Add top padding to account for fixed navbar */
          padding-top: var(--navbar-height);
        }
        
        .home-section {
          width: 100%;
          height: 100vh;           /* Use full viewport height */
          height: 100dvh;          /* Use dynamic viewport height where supported */
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        /* Ensure dynamic viewport height is used where supported */
        @supports (height: 100dvh) {
          .home-section {
            height: 100dvh;
          }
        }
        
        @supports not (height: 100dvh) {
          .home-section {
            height: 100vh;
          }
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
          /* Remove blur to prevent white halo */
          padding: 0;
          position: relative;
        }
        
        .nav-dot:hover {
          transform: scale(1.2);
          background: rgba(255, 255, 255, 0.5);
        }
        
        .nav-dot.active {
          background: #3b82f6 !important;
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
        
        /* Loading state */
        .loading-screen {
          position: fixed;
          inset: 0;
          background: #1e293b;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Section animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .section-content {
          width: 100%;
          height: 100%;
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
      
      <div ref={containerRef} className="home-container">
        {/* Main sections */}
        {sections.map((section, index) => {
          const SectionComponent = section.component;
          return (
            <section
              key={index}
              ref={el => sectionRefs.current[index] = el}
              data-section-index={index}
              className={`home-section ${darkMode ? 'dark' : ''}`}
            >
              <div className="section-content">
                <SectionComponent
                  onNavigate={(route) => navigate(route)}
                  isActive={activeSection === index}
                  goToSection={navigateToSection}
                  navbarHeight={navbarHeight}
                />
              </div>
            </section>
          );
        })}
        
        {/* Navigation dots */}
        <nav
          className="nav-dots"
          aria-label="Section navigation"
          style={{ background: 'transparent', boxShadow: 'none' }}
        >
          {sections.map((section, index) => (
            <button
              key={index}
              onClick={() => navigateToSection(index)}
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

export default Home;