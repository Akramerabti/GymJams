import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionWrapper from '../components/home-sections/SectionWrapper';
import { useTheme } from '../contexts/ThemeContext';

const Home = () => {
  const { darkMode } = useTheme(); // Add theme context
  // Refs
  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const animationFrameRef = useRef(null);

  // Core state
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
    // Touch/swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  // Section data
  const sections = [
    {
      id: 'hero',
      title: 'Transform Your Fitness Journey',
      description: 'Join thousands of fitness enthusiasts who\'ve revolutionized their health with our AI-powered platform, expert coaching, and gamified workouts.',
      buttonText: 'Start Free Trial',
      route: '/register',
      videoSrc: "/GymTonic.mp4",
      color: 'from-blue-900/70 to-black/50'
    },
    {
      id: 'shop',
      title: 'Premium Equipment Shop',
      description: 'Discover professional-grade fitness equipment for home and commercial gyms. Quality gear that lasts, designed for optimal performance.',
      buttonText: 'Shop Now',
      route: '/shop',
      videoSrc: "/GymTonic.mp4",
      color: 'from-indigo-600/80 to-indigo-900/80'
    },
    {
      id: 'gymBros',
      title: 'Track Your Gains',
      description: 'Monitor your progress, set new records, and celebrate achievements. Our intelligent tracking helps you visualize your journey and stay motivated.',
      buttonText: 'Track Gains',
      route: '/gymbros',
      videoSrc: "/GymTonic.mp4",
      color: 'from-purple-600/80 to-purple-900/80'
    },
    {
      id: 'games',
      title: 'Fitness Games',
      description: 'Play exclusive games, earn points, and unlock special rewards. Make your workout fun and engaging with gamified fitness experiences.',
      buttonText: 'Play Games',
      route: '/games',
      videoSrc: "/GymTonic.mp4",
      color: 'from-green-600/80 to-green-900/80'
    },
    {
      id: 'coaching',
      title: 'Expert Coaching',
      description: 'Transform your fitness journey with guidance from certified trainers. Personalized plans, real-time feedback, and continuous support.',
      buttonText: 'Find a Coach',
      route: '/coaching',
      videoSrc: "/GymTonic.mp4",
      color: 'from-red-600/80 to-red-900/80'
    }
  ];
  // Initialize video refs
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, sections.length);
  }, [sections.length]);  // Prevent document scrolling and pull-to-refresh for ENTIRE Home page
  useEffect(() => {    // Store original styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;
      // Apply Home-specific styles - prevent scrolling but allow navbar interaction
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    // Removed touchAction: 'none' to allow navbar interaction
      // SELECTIVE pull-to-refresh prevention - allow navbar interaction
    const preventPullToRefresh = (e) => {
      // Allow navbar interactions - check if click is in navbar area
      const navbar = document.querySelector('nav') || document.querySelector('[class*="navbar"]') || document.querySelector('[class*="fixed top"]');
      if (navbar && navbar.contains(e.target)) {
        return; // Don't prevent navbar interactions
      }
      
      // Allow button and link interactions anywhere
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) {
        return; // Don't prevent interactive elements
      }
      
      // Only prevent pull-to-refresh for main content area
      e.preventDefault();
      e.stopPropagation();
    };
    
    document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
      // Cleanup on unmount - restore original styles
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
      document.removeEventListener('touchstart', preventPullToRefresh);
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
      checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Set loaded after components are ready - increased delay for smooth UX
    setTimeout(() => setHasLoaded(true), 800);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Video playback control
  useEffect(() => {
    if (isTransitioning) return;
    
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      
      if (index === currentSection) {
        if (video.paused) {
          video.play().catch(console.error);
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }, [currentSection, isTransitioning]);
  // Navigation function with faster transitions
  const goToSection = (targetIndex) => {
    if (targetIndex === currentSection) return;
    
    const boundedIndex = Math.max(0, Math.min(targetIndex, sections.length - 1));
    
    setIsTransitioning(true);
    setCurrentSection(boundedIndex);
    
    // Much faster reset of transition state
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400); // Reduced from 800ms to 400ms
  };  // Selective touch handling - allow navbar interactions
  const handleTouchStart = (e) => {
    // Allow navbar interactions
    const navbar = document.querySelector('nav') || document.querySelector('[class*="navbar"]') || document.querySelector('[class*="fixed top"]');
    if (navbar && navbar.contains(e.target)) {
      return; // Don't interfere with navbar
    }
    
    // Skip if touching interactive elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) return;
    
    // Prevent pull-to-refresh for main content area
    e.preventDefault();
    e.stopPropagation();
    
    // Store initial touch position
    touchStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now(),
      startY: e.touches[0].clientY
    };
    
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    // Allow navbar interactions
    const navbar = document.querySelector('nav') || document.querySelector('[class*="navbar"]') || document.querySelector('[class*="fixed top"]');
    if (navbar && navbar.contains(e.target)) {
      return; // Don't interfere with navbar
    }
    
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) return;
    
    // Prevent pull-to-refresh and browser scrolling for main content
    e.preventDefault();
    e.stopPropagation();
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartRef.current.startY;
    const maxDrag = window.innerHeight * 0.3;
    
    // Less resistance for more responsive feel
    let boundedDelta = deltaY;
    if (currentSection === 0 && deltaY > 0) {
      boundedDelta = Math.min(maxDrag * 0.4, deltaY * 0.4);
    } else if (currentSection === sections.length - 1 && deltaY < 0) {
      boundedDelta = Math.max(-maxDrag * 0.4, deltaY * 0.4);
    } else {
      boundedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaY));
    }
    
    setDragOffset(boundedDelta);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - touchStartRef.current.startY;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaY) / deltaTime;
    
    // Much more responsive thresholds for touch
    const threshold = window.innerHeight * 0.04; // Very low threshold
    const velocityThreshold = 0.15; // Lower velocity threshold
    
    let targetSection = currentSection;
    
    // Fast swipe - immediate response
    if (velocity > velocityThreshold && Math.abs(deltaY) > 20) {
      if (deltaY > 0 && currentSection > 0) {
        targetSection = currentSection - 1;
      } else if (deltaY < 0 && currentSection < sections.length - 1) {
        targetSection = currentSection + 1;
      }
    } 
    // Slow drag - very responsive threshold
    else if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentSection > 0) {
        targetSection = currentSection - 1;
      } else if (deltaY < 0 && currentSection < sections.length - 1) {
        targetSection = currentSection + 1;
      }
    }
    
    setDragOffset(0);
    goToSection(targetSection);
  };// Mouse handlers for desktop
  const handleMouseDown = (e) => {
    if (e.button !== 0 || isTransitioning) return;
    if (e.target.closest('button') || e.target.closest('a')) return;
    
    e.preventDefault();
    setIsDragging(true);
    touchStartRef.current = {
      y: e.clientY,
      time: Date.now(),
      startY: e.clientY
    };
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isTransitioning) return;
    
    const deltaY = e.clientY - touchStartRef.current.startY;
    const maxDrag = window.innerHeight * 0.25;
    
    let boundedDelta = deltaY;
    if (currentSection === 0 && deltaY > 0) {
      boundedDelta = Math.min(maxDrag * 0.2, deltaY * 0.2);
    } else if (currentSection === sections.length - 1 && deltaY < 0) {
      boundedDelta = Math.max(-maxDrag * 0.2, deltaY * 0.2);
    } else {
      boundedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaY));
    }
    
    setDragOffset(boundedDelta);
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const deltaY = e.clientY - touchStartRef.current.startY;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaY) / deltaTime;
    
    const threshold = window.innerHeight * 0.12;
    const velocityThreshold = 0.4;
    
    let targetSection = currentSection;
    
    if (velocity > velocityThreshold && Math.abs(deltaY) > 40) {
      if (deltaY > 0 && currentSection > 0) {
        targetSection = currentSection - 1;
      } else if (deltaY < 0 && currentSection < sections.length - 1) {
        targetSection = currentSection + 1;
      }
    } else if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0 && currentSection > 0) {
        targetSection = currentSection - 1;
      } else if (deltaY < 0 && currentSection < sections.length - 1) {
        targetSection = currentSection + 1;
      }
    }
    
    setDragOffset(0);
    goToSection(targetSection);
  };
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSection(currentSection - 1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToSection(currentSection + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection]);  // Highly responsive wheel handling for fast consecutive scrolls
  useEffect(() => {
    let wheelTimeout;
    let accumulatedDelta = 0;
    let lastWheelTime = 0;
    let consecutiveScrollCount = 0;
    
    const handleWheel = (e) => {
      if (isTransitioning) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastWheelTime;
      
      // Reset accumulated delta if too much time has passed
      if (timeDiff > 100) {
        accumulatedDelta = 0;
        consecutiveScrollCount = 0;
      } else {
        consecutiveScrollCount++;
      }
      
      lastWheelTime = currentTime;
      accumulatedDelta += e.deltaY;
      
      setIsScrolling(true);
      setScrollOffset(Math.max(-200, Math.min(200, accumulatedDelta * 0.3)));
      
      clearTimeout(wheelTimeout);
      
      // Much more responsive thresholds
      let threshold = 40; // Base threshold
      
      // Reduce threshold for consecutive scrolls to make it more responsive
      if (consecutiveScrollCount > 1) {
        threshold = Math.max(20, threshold - (consecutiveScrollCount * 5));
      }
      
      wheelTimeout = setTimeout(() => {
        let targetSection = currentSection;
        
        if (accumulatedDelta > threshold && currentSection < sections.length - 1) {
          targetSection = currentSection + 1;
        } else if (accumulatedDelta < -threshold && currentSection > 0) {
          targetSection = currentSection - 1;
        }
        
        // Always reset scroll state
        setIsScrolling(false);
        setScrollOffset(0);
        accumulatedDelta = 0;
        consecutiveScrollCount = 0;
        
        if (targetSection !== currentSection) {
          goToSection(targetSection);
        }
      }, 50); // Much faster debounce time for quick response
    };
    
    const containerElement = containerRef.current;
    if (containerElement) {
      containerElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        containerElement.removeEventListener('wheel', handleWheel);
        clearTimeout(wheelTimeout);
      };
    }
  }, [currentSection, isTransitioning, sections.length]);
  // Mouse event cleanup
  useEffect(() => {
    const handleMouseUpGlobal = (e) => handleMouseUp(e);
    const handleMouseMoveGlobal = (e) => handleMouseMove(e);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveGlobal);
      document.addEventListener('mouseup', handleMouseUpGlobal);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [isDragging]);
  // Calculate transform for sections
  const getSectionTransform = () => {
    const baseTransform = -currentSection * 100; // Each section is 100vh
    const dragTransform = isDragging ? (dragOffset / window.innerHeight) * 100 : 0;
    const scrollTransform = isScrolling ? (scrollOffset / window.innerHeight) * 100 : 0;
    return baseTransform + dragTransform + scrollTransform;
  };
  const navigate = useNavigate();
  
  const handleNavigate = (route) => {
    // Handle special routes
    if (route === '/demo') {
      // For demo, we could scroll to a specific section or open a modal
      // For now, let's navigate to the coaching section as a demo
      navigate('/coaching');
    } else if (route === '/register') {
      // Navigate to registration/signup
      navigate('/register');
    } else {
      navigate(route);
    }
  };return (
    <>
      {/* CSS to completely hide scrollbars on all browsers */}      <style jsx>{`
        .no-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }        /* Prevent body and html from scrolling ONLY when Home component is active - but allow navbar */
        body, html {
          overflow: hidden !important;
          width: 100% !important;
          height: 100% !important;
          overscroll-behavior: none !important;
        }
        /* Allow pointer events for navbar area */
        .navbar, nav, [class*="fixed top"] {
          pointer-events: all !important;
          z-index: 9999 !important;
        }
      `}</style>
        <div 
        className="relative w-full bg-black no-scrollbar" 
        style={{ 
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,          // Prevent scrolling but allow navbar interaction
          overscrollBehavior: 'none',
          // Hide scrollbars completely
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
      {/* Loading indicator */}
      {!hasLoaded && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}      {/* Main container with minimal touch interference */}      <div 
        ref={containerRef}
        className="h-full w-full overflow-hidden cursor-grab active:cursor-grabbing no-scrollbar"
        style={{ 
          visibility: hasLoaded ? 'visible' : 'hidden',
          userSelect: 'none',
          height: '100vh',
          width: '100vw',
          position: 'relative',
          overflow: 'hidden',
          // Completely hide scrollbars
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',          // Prevent any form of scrolling and selective pull-to-refresh prevention
          overscrollBehavior: 'none',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >{/* Sections container */}        <div 
          className="flex flex-col h-full w-full will-change-transform"
          style={{
            transform: `translateY(${getSectionTransform()}vh)`,            transition: (isDragging || isScrolling)
              ? 'none' 
              : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Much faster transition
          }}        >          {sections.map((section, index) => (
            <SectionWrapper
              key={section.id}
              section={section}
              index={index}
              currentSection={currentSection}
              videoRef={el => videoRefs.current[index] = el}
              onNavigate={handleNavigate}
              goToSection={goToSection}
            />
          ))}
        </div>
      </div>
        {/* Section indicators */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSection(index)}
            className={`w-4 h-4 rounded-full transition-all duration-300 border-2 ${
              currentSection === index
                ? darkMode 
                  ? 'bg-white border-white scale-125'
                  : 'bg-gray-900 border-gray-900 scale-125'
                : darkMode
                  ? 'bg-transparent border-white/50 hover:border-white hover:bg-white/20'
                  : 'bg-transparent border-gray-900/50 hover:border-gray-900 hover:bg-gray-900/20'
            }`}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>
        {/* Navigation arrows - REMOVED */}
      
      {/* Section title indicator - REMOVED */}        {/* Drag indicator */}
      {(isDragging || isScrolling) && (
        <div className="fixed inset-x-0 bottom-8 z-30 flex justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
            <p className="text-white text-sm font-medium">
              {isDragging 
                ? (dragOffset > 20 ? '↑ Release to go back' : dragOffset < -20 ? '↓ Release to continue' : 'Drag to navigate')
                : (scrollOffset > 20 ? '↓ Scrolling down' : scrollOffset < -20 ? '↑ Scrolling up' : 'Scroll to navigate')
              }
            </p>
          </div>        </div>
      )}
    </div>
    </>
  );
};

export default Home;