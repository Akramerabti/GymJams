import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const Home = () => {
  // DOM references
  const containerRef = useRef(null);
  
  // State
  const [currentSection, setCurrentSection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [currentDragAmount, setCurrentDragAmount] = useState(0);
  const [lastScrollPos, setLastScrollPos] = useState(0);
  
  // Section data
  const sections = [
    {
      id: 'hero',
      title: 'Elevate Your Fitness Journey',
      description: 'Premium equipment, expert coaching, and community support.',
      buttonText: 'Get Started',
      route: '/',
      bgImage: "/api/placeholder/1920/1080",
      color: 'from-blue-800 to-blue-900'
    },
    {
      id: 'shop',
      title: 'Premium Equipment Shop',
      description: 'Discover professional-grade fitness equipment for home and commercial gyms.',
      buttonText: 'Shop Now',
      route: '/shop',
      bgImage: "/api/placeholder/1920/1080",
      color: 'from-indigo-600 to-indigo-900'
    },
    {
      id: 'gymBros',
      title: 'Track Your Gains',
      description: 'Monitor your progress, set new records, and celebrate achievements.',
      buttonText: 'Track Gains',
      route: '/gymbros',
      bgImage: "/api/placeholder/1920/1080",
      color: 'from-purple-600 to-purple-900'
    },
    {
      id: 'games',
      title: 'Fitness Games',
      description: 'Play exclusive games, earn points, and unlock special rewards.',
      buttonText: 'Play Games',
      route: '/games',
      bgImage: "/api/placeholder/1920/1080",
      color: 'from-green-600 to-green-900'
    },
    {
      id: 'coaching',
      title: 'Expert Coaching',
      description: 'Transform your fitness journey with guidance from certified trainers.',
      buttonText: 'Find a Coach',
      route: '/coaching',
      bgImage: "/api/placeholder/1920/1080",
      color: 'from-red-600 to-red-900'
    }
  ];
  
  // Handle device size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Update current section based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      if (isDragging) return; // Don't update during active dragging
      
      const scrollPos = isMobile ? container.scrollTop : container.scrollLeft;
      const viewportSize = isMobile ? container.clientHeight : container.clientWidth;
      const sectionIndex = Math.round(scrollPos / viewportSize);
      
      setCurrentSection(Math.max(0, Math.min(sectionIndex, sections.length - 1)));
      setLastScrollPos(scrollPos);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isDragging, isMobile, sections.length]);
  
  // Navigate to section
  const goToSection = (index, behavior = 'smooth') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const viewportSize = isMobile ? container.clientHeight : container.clientWidth;
    
    container.scrollTo({
      left: isMobile ? 0 : index * viewportSize,
      top: isMobile ? index * viewportSize : 0,
      behavior
    });
    
    setCurrentSection(index);
  };
  
  // Mouse drag handlers (for horizontal scrolling on desktop)
  const handleMouseDown = (e) => {
    // Only handle left button dragging
    if (e.button !== 0) return;
    
    // Prevent default to avoid text selection
    e.preventDefault();
    
    setIsDragging(true);
    setStartDragPos({ x: e.clientX, y: e.clientY });
    setCurrentDragAmount(0);
    
    // Change cursor style
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Calculate drag distance
    const dragAmount = isMobile 
      ? startDragPos.y - e.clientY 
      : startDragPos.x - e.clientX;
      
    // Apply a multiplier to make dragging more sensitive
    const dragMultiplier = 1.5;
    
    // Update container scroll position
    if (isMobile) {
      container.scrollTop = lastScrollPos + (dragAmount * dragMultiplier);
    } else {
      container.scrollLeft = lastScrollPos + (dragAmount * dragMultiplier);
    }
    
    setCurrentDragAmount(dragAmount);
  };
  
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    finishDragging();
  };

  // Touch handlers (for both desktop and mobile)
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    
    setIsDragging(true);
    setStartDragPos({ x: touch.clientX, y: touch.clientY });
    setCurrentDragAmount(0);
    
    // Store the current scroll position
    const container = containerRef.current;
    if (container) {
      setLastScrollPos(isMobile ? container.scrollTop : container.scrollLeft);
    }
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;
    
    // Calculate drag distance
    const dragAmount = isMobile 
      ? startDragPos.y - touch.clientY 
      : startDragPos.x - touch.clientX;
      
    // Apply a multiplier to make dragging more sensitive
    const dragMultiplier = 1.8;
    
    // Update container scroll position with the multiplier
    if (isMobile) {
      container.scrollTop = lastScrollPos + (dragAmount * dragMultiplier);
    } else {
      container.scrollLeft = lastScrollPos + (dragAmount * dragMultiplier);
    }
    
    setCurrentDragAmount(dragAmount);
    
    // Prevent default to avoid page scrolling
    if (Math.abs(dragAmount) > 10) {
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    finishDragging();
  };
  
  // Common logic to finish dragging and decide where to snap
  const finishDragging = () => {
    setIsDragging(false);
    
    // Reset styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    const container = containerRef.current;
    if (!container) return;
    
    const viewportSize = isMobile ? container.clientHeight : container.clientWidth;
    const currentPos = isMobile ? container.scrollTop : container.scrollLeft;
    
    // Get current section index based on scroll position
    const currentIndex = Math.floor(currentPos / viewportSize);
    
    // Calculate how far into the section we are (0-1)
    const sectionProgress = (currentPos % viewportSize) / viewportSize;
    
    // Determine direction based on drag amount
    const isDraggingForward = currentDragAmount > 0;
    
    // Threshold for switching sections (lower = more sensitive)
    // Only need to drag 30% of screen width to switch sections
    const dragThreshold = 0.3;
    
    let targetSection;
    
    if (sectionProgress > dragThreshold && isDraggingForward) {
      // If we've dragged forward past threshold, go to next section
      targetSection = Math.min(currentIndex + 1, sections.length - 1);
    } else if (sectionProgress < (1 - dragThreshold) && !isDraggingForward) {
      // If we've dragged backward past threshold, go to previous section
      targetSection = Math.max(currentIndex - 1, 0);
    } else {
      // Otherwise, stay on current section
      targetSection = currentIndex;
    }
    
    // Snap to target section
    goToSection(targetSection);
    
    // Reset drag amount
    setCurrentDragAmount(0);
  };
  
  // Navigation (would use router in real app)
  const handleNavigate = (route) => {
    alert(`Navigating to: ${route}`);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Main scrolling container */}
      <div 
        ref={containerRef}
        className={`h-full w-full ${isMobile ? 'overflow-y-auto' : 'overflow-x-auto'} overflow-hidden scroll-smooth`}
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Hide scrollbar */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {/* Sections container */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full w-full`}>
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="relative h-screen w-screen flex-shrink-0"
            >
              {/* Parallax background */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ 
                  backgroundImage: `url(${section.bgImage})`,
                  transform: `translate${isMobile ? 'Y' : 'X'}(${(index - currentSection) * -5}%)` // Parallax effect
                }}
              >
                {/* Color overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-70`}></div>
              </div>
              
              {/* Content with fade effect */}
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div 
                  className="max-w-4xl mx-auto text-center transition-all duration-500"
                  style={{
                    opacity: index === currentSection ? 1 : 0,
                    transform: `translate${isMobile ? 'Y' : 'X'}(${
                      index === currentSection ? 0 : 
                      index < currentSection ? -50 : 50
                    }px)`
                  }}
                >
                  <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                    {section.title}
                  </h2>
                  
                  <p className="text-xl text-white/90 mb-8 max-w-xl mx-auto">
                    {section.description}
                  </p>
                  
                  <button
                    onClick={() => handleNavigate(section.route)}
                    className="px-8 py-3 bg-white text-gray-900 font-bold rounded-full flex items-center gap-2 mx-auto hover:bg-opacity-90 transition-all hover:scale-105"
                  >
                    {section.buttonText}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation dots */}
      <div 
        className={`fixed z-20 ${
          isMobile 
            ? 'right-4 top-1/2 -translate-y-1/2 flex-col'
            : 'bottom-6 left-1/2 -translate-x-1/2 flex-row'
        } flex gap-3`}
      >
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSection(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === index
                ? 'bg-white scale-125'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Direction indicators - show when dragging */}
      {isDragging && Math.abs(currentDragAmount) > 20 && (
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div 
            className={`text-white/20 text-9xl transition-opacity duration-300 ${Math.abs(currentDragAmount) > 50 ? 'opacity-100' : 'opacity-50'}`}
          >
            {currentDragAmount > 0 ? 
              (isMobile ? '↓' : '→') : 
              (isMobile ? '↑' : '←')
            }
          </div>
        </div>
      )}
      
      {/* Left/Right navigation arrows (desktop only) */}
      {!isMobile && (
        <>
          {currentSection > 0 && (
            <button
              onClick={() => goToSection(currentSection - 1)}
              className="fixed left-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
              aria-label="Previous section"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          
          {currentSection < sections.length - 1 && (
            <button
              onClick={() => goToSection(currentSection + 1)}
              className="fixed right-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
              aria-label="Next section"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </>
      )}
      
      {/* Drag instruction (first visit only) */}
      <div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/70 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none"
        style={{
          opacity: currentSection === 0 ? 0.7 : 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 6l-6 6 6 6"/>
        </svg>
        {isMobile ? 'Swipe up/down' : 'Drag or swipe to navigate'} 
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 6l6 6-6 6"/>
        </svg>
      </div>
    </div>
  );
};

export default Home;