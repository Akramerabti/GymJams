import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const Home = () => {
  // DOM references
  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  
  // State
  const [currentSection, setCurrentSection] = useState(0);
  const [prevSection, setPrevSection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [currentDragAmount, setCurrentDragAmount] = useState(0);
  const [lastScrollPos, setLastScrollPos] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchIdentifier, setTouchIdentifier] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Section data
  const sections = [
    {
      id: 'hero',
      title: 'Elevate Your Fitness Journey',
      description: 'Premium equipment, expert coaching, and community support to help you reach your fitness goals. Start your transformation today.',
      buttonText: 'Get Started',
      route: '/',
      videoSrc: "/api/placeholder/1920/1080", // Replace with actual video URLs
      color: 'from-blue-800/80 to-blue-900/80'
    },
    {
      id: 'shop',
      title: 'Premium Equipment Shop',
      description: 'Discover professional-grade fitness equipment for home and commercial gyms. Quality gear that lasts, designed for optimal performance.',
      buttonText: 'Shop Now',
      route: '/shop',
      videoSrc: "/api/placeholder/1920/1080", // Replace with actual video URLs
      color: 'from-indigo-600/80 to-indigo-900/80'
    },
    {
      id: 'gymBros',
      title: 'Track Your Gains',
      description: 'Monitor your progress, set new records, and celebrate achievements. Our intelligent tracking helps you visualize your journey and stay motivated.',
      buttonText: 'Track Gains',
      route: '/gymbros',
      videoSrc: "/api/placeholder/1920/1080", // Replace with actual video URLs
      color: 'from-purple-600/80 to-purple-900/80'
    },
    {
      id: 'games',
      title: 'Fitness Games',
      description: 'Play exclusive games, earn points, and unlock special rewards. Make your workout fun and engaging with gamified fitness experiences.',
      buttonText: 'Play Games',
      route: '/games',
      videoSrc: "/api/placeholder/1920/1080", // Replace with actual video URLs
      color: 'from-green-600/80 to-green-900/80'
    },
    {
      id: 'coaching',
      title: 'Expert Coaching',
      description: 'Transform your fitness journey with guidance from certified trainers. Personalized plans, real-time feedback, and continuous support.',
      buttonText: 'Find a Coach',
      route: '/coaching',
      videoSrc: "/api/placeholder/1920/1080", // Replace with actual video URLs
      color: 'from-red-600/80 to-red-900/80'
    }
  ];
  
  // Initialize video refs array
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, sections.length);
  }, [sections.length]);
  
  // Play current section video and pause others
  useEffect(() => {
    if (isTransitioning) return;
    
    videoRefs.current.forEach((videoRef, index) => {
      if (!videoRef) return;
      
      if (index === currentSection) {
        if (videoRef.paused) {
          try {
            const playPromise = videoRef.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => console.error("Video play error:", err));
            }
          } catch (err) {
            console.error("Video play error:", err);
          }
        }
      } else {
        if (!videoRef.paused) {
          videoRef.pause();
        }
      }
    });
  }, [currentSection, isTransitioning]);
  
  // Handle device size and initial loading
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Reset scroll position when switching between mobile and desktop
      const container = containerRef.current;
      if (container) {
        if (mobile) {
          container.scrollTop = currentSection * container.clientHeight;
          container.scrollLeft = 0;
        } else {
          container.scrollLeft = currentSection * container.clientWidth;
          container.scrollTop = 0;
        }
      }
    };
    
    handleResize();
    
    // Mark as loaded after a short delay to ensure everything is rendered
    setTimeout(() => {
      setHasLoaded(true);
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentSection]);
  
  // Handle section transition
  useEffect(() => {
    if (prevSection !== currentSection) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1000); // Match this with your CSS transition duration
      
      setPrevSection(currentSection);
      return () => clearTimeout(timer);
    }
  }, [currentSection, prevSection]);
  
  // Handle touch behavior for mobile scrolling
  useEffect(() => {
    // Only for handling very specific touch events that need prevention
    // Regular scrolling should work with default touch behavior
    const handleTouchMove = (e) => {
      // Only prevent default if we're actively dragging
      // and it's a horizontal swipe on mobile
      if (isDragging && isMobile && Math.abs(currentDragAmount) > 10) {
        // Prevent only for touches we're tracking
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchIdentifier) {
            e.preventDefault();
            break;
          }
        }
      }
    };
    
    // Use passive: false only when needed for mobile
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, isMobile, currentDragAmount, touchIdentifier]);
  
  // Update current section based on scroll position
  const updateCurrentSection = () => {
    const container = containerRef.current;
    if (!container || isDragging) return;
    
    const scrollPos = isMobile ? container.scrollTop : container.scrollLeft;
    const viewportSize = isMobile ? container.clientHeight : container.clientWidth;
    const sectionIndex = Math.round(scrollPos / viewportSize);
    
    if (sectionIndex !== currentSection) {
      setPrevSection(currentSection);
      setCurrentSection(Math.max(0, Math.min(sectionIndex, sections.length - 1)));
    }
    setLastScrollPos(scrollPos);
  };
  
  // Use the more efficient requestAnimationFrame for scroll handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let rafId;
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Schedule the update on the next animation frame
      rafId = requestAnimationFrame(updateCurrentSection);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isDragging, isMobile, sections.length, currentSection]);
  
  // Preload videos
  useEffect(() => {
    sections.forEach((section) => {
      if (!section.videoSrc) return;
      
      const video = document.createElement('video');
      video.src = section.videoSrc;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      
      // Preload metadata only to save bandwidth
      video.preload = "metadata";
      
      // Force low resolution for mobile devices
      if (window.innerWidth < 768) {
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
      }
    });
  }, []);
  
  // Navigate to section with ice-like momentum
  const goToSection = (index, behavior = 'smooth') => {
    if (!containerRef.current) return;
    
    // No change needed
    if (index === currentSection) return;
    
    // Ensure index is within bounds
    const boundedIndex = Math.max(0, Math.min(index, sections.length - 1));
    
    const container = containerRef.current;
    const viewportSize = isMobile ? container.clientHeight : container.clientWidth;
    
    setPrevSection(currentSection);
    
    // For very fast swipes, use 'auto' to create that ice-like snap
    // For normal transitions, use smooth scrolling
    const scrollBehavior = behavior === 'auto' ? 'auto' : 'smooth';
    
    // Try using scroll behavior for seamless effect
    try {
      if (isMobile) {
        container.scrollTo({
          left: 0,
          top: boundedIndex * viewportSize,
          behavior: scrollBehavior
        });
      } else {
        container.scrollTo({
          left: boundedIndex * viewportSize,
          top: 0,
          behavior: scrollBehavior
        });
      }
    } catch (err) {
      // Fallback for browsers without smooth scrolling support
      if (isMobile) {
        container.scrollTop = boundedIndex * viewportSize;
      } else {
        container.scrollLeft = boundedIndex * viewportSize;
      }
    }
    
    setCurrentSection(boundedIndex);
  };
  
  // Touch handlers with improved inertia and natural "ice-like" flow
  const handleTouchStart = (e) => {
    // Prevent handling when touching interactive elements
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    
    // Only track the first touch point
    if (touchIdentifier !== null) return;
    
    const touch = e.touches[0];
    setTouchIdentifier(touch.identifier);
    
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
    
    // Find the touch point we're tracking
    let touch = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdentifier) {
        touch = e.changedTouches[i];
        break;
      }
    }
    
    if (!touch) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Calculate drag distance - maintain exact ratio for all drag sizes
    const dragAmount = isMobile 
      ? startDragPos.y - touch.clientY 
      : startDragPos.x - touch.clientX;
    
    // Use a consistent multiplier regardless of drag size
    // This ensures small and large movements feel the same
    const consistentMultiplier = 1.2;
    
    // Ice-like effect: reduce resistance for small movements
    // and gradually increase for larger ones (feels like momentum on ice)
    const maxDragThreshold = 300; // Max threshold for calculating resistance
    const normalizedDrag = Math.min(Math.abs(dragAmount), maxDragThreshold);
    
    // For small movements: less resistance (more slippery)
    // For large movements: more resistance (natural damping)
    const resistanceRatio = normalizedDrag / maxDragThreshold;
    const iceEffect = 1 - (resistanceRatio * 0.3); // 0.7 to 1.0 range
    
    // Calculate the new position with our ice-like physics
    const newPosition = lastScrollPos + (dragAmount * consistentMultiplier * iceEffect);
    
    // Update the scroll position with fluid movement
    if (isMobile) {
      container.scrollTop = newPosition;
    } else {
      container.scrollLeft = newPosition;
    }
    
    setCurrentDragAmount(dragAmount);
    
    // Only prevent default for significant drags to allow small adjustments
    if (Math.abs(dragAmount) > 5) {
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = (e) => {
    // Find the touch point we're tracking
    let touchFound = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdentifier) {
        touchFound = true;
        break;
      }
    }
    
    if (!touchFound) return;
    
    // Reset touch tracking
    setTouchIdentifier(null);
    
    if (!isDragging) return;
    
    finishDragging();
  };
  
  // Mouse drag handlers with ice-like physics for desktop
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
    
    // Calculate drag distance with consistent ratio for all movements
    const dragAmount = isMobile 
      ? startDragPos.y - e.clientY 
      : startDragPos.x - e.clientX;
    
    // Use the same ice-like physics as touch events
    const maxDragThreshold = 300;
    const normalizedDrag = Math.min(Math.abs(dragAmount), maxDragThreshold);
    const resistanceRatio = normalizedDrag / maxDragThreshold;
    
    // Less resistance for small movements (feels like ice)
    const iceEffect = 1 - (resistanceRatio * 0.2); // Subtle resistance increase for large movements
    
    // Higher multiplier for desktop to match touch behavior
    const desktopMultiplier = 1.2;
    
    // Calculate position with ice-like physics
    const newPosition = lastScrollPos + (dragAmount * desktopMultiplier * iceEffect);
    
    // Update scroll with momentum feel
    if (isMobile) {
      container.scrollTop = newPosition;
    } else {
      container.scrollLeft = newPosition;
    }
    
    setCurrentDragAmount(dragAmount);
  };
  
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    finishDragging();
  };
  
  // Common logic to finish dragging with momentum-based snapping
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
    
    // Apply ice-like physics for momentum effect
    // Use the same ratio for small and large movements
    
    // Calculate the "velocity" of the swipe
    const absAmount = Math.abs(currentDragAmount);
    const swipeVelocity = Math.min(absAmount / 50, 1.5); // Cap velocity for stability
    
    // For ice-like effect: small movements should have proportionally the same effect as large ones
    // Use a non-linear scaling that feels natural at all magnitudes
    
    // Base threshold adjusted by velocity
    const baseThreshold = 0.1 + (0.3 / (1 + swipeVelocity)); // Ranges from 0.1 to 0.4
    
    // Determine next section based on progress and momentum
    let targetSection;
    
    // Extremely small movements (tap/click) - stay on current
    if (absAmount < 3) {
      targetSection = currentIndex;
    } 
    // Fast swipe with sufficient movement - follow direction
    else if (swipeVelocity > 0.7 && absAmount > 10) {
      targetSection = isDraggingForward
        ? Math.min(currentIndex + 1, sections.length - 1)
        : Math.max(currentIndex - 1, 0);
    }
    // Medium-velocity swipe - use position-based threshold
    else if (isDraggingForward && sectionProgress > baseThreshold) {
      targetSection = Math.min(currentIndex + 1, sections.length - 1);
    } 
    else if (!isDraggingForward && sectionProgress < (1 - baseThreshold)) {
      targetSection = Math.max(currentIndex - 1, 0);
    }
    // Default - stay on current section
    else {
      targetSection = currentIndex;
    }
    
    // Apply true momentum effect
    const momentum = Math.min(Math.max(swipeVelocity * 0.8, 0.5), 1.0);
    
    // Snap to target section with speed based on momentum
    goToSection(targetSection, momentum > 0.8 ? 'auto' : 'smooth');
    
    // Reset drag amount
    setCurrentDragAmount(0);
  };
  
  // Navigation (would use router in real app)
  const handleNavigate = (route) => {
    window.location.href = route;
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Loading indicator */}
      {!hasLoaded && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Main scrolling container */}
      <div 
        ref={containerRef}
        className={`h-full w-full ${isMobile ? 'overflow-y-auto' : 'overflow-x-auto'} scroll-smooth will-change-transform`}
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          cursor: isDragging ? 'grabbing' : 'grab',
          visibility: hasLoaded ? 'visible' : 'hidden'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Hide scrollbar */}
        <style jsx="true">{`
          div::-webkit-scrollbar {
            display: none;
          }
          
          .info-box {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transform: translateZ(0);
          }
          
          .video-transition {
            transition: opacity 1s ease-in-out, transform 1.2s ease-in-out;
            will-change: opacity, transform;
          }
          
          .content-transition {
            transition: opacity 0.7s ease-out, transform 0.7s ease-out;
            will-change: opacity, transform;
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
        `}</style>
        
        {/* Sections container */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full w-full will-change-transform`}>
          {sections.map((section, index) => (
            <div
              key={section.id}
              data-section={index}
              className="relative h-screen w-screen flex-shrink-0 will-change-transform"
              style={{
                transform: 'translateZ(0)', // Force GPU acceleration
              }}
            >
              {/* Video or Image background */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Use image placeholder on mobile for better performance */}
                {isMobile ? (
                  <div 
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
                      currentSection === index ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      backgroundImage: `url(${section.videoSrc})`,
                      transform: 'translateZ(0)', // Force GPU acceleration
                    }}
                  />
                ) : (
                  <video
                    ref={el => videoRefs.current[index] = el}
                    src={section.videoSrc}
                    className={`absolute inset-0 object-cover w-full h-full video-transition ${
                      currentSection === index 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-110'
                    }`}
                    playsInline
                    muted
                    loop
                    autoPlay={index === 0}
                    preload="metadata" // Only preload metadata initially
                    style={{
                      transform: 'translateZ(0)', // Force GPU acceleration
                    }}
                  />
                )}
                {/* Color overlay gradient */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${section.color} transition-opacity duration-1000 ${
                    currentSection === index ? 'opacity-80' : 'opacity-0'
                  }`}
                  style={{
                    transform: 'translateZ(0)', // Force GPU acceleration
                  }}
                />
              </div>
              
              {/* Content with fade effect */}
              <div className="absolute inset-0 flex items-center justify-center p-6 md:p-12 pointer-events-none">
                <div 
                  className={`max-w-4xl mx-auto content-transition ${
                    currentSection === index 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    transform: currentSection === index 
                      ? 'translateY(0) translateZ(0)'
                      : 'translateY(2rem) translateZ(0)',
                  }}
                >
                  {/* Semi-transparent info box */}
                  <div className="info-box bg-gray-900/40 rounded-xl p-6 md:p-8 border border-white/20 shadow-xl text-center pointer-events-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6">
                      {section.title}
                    </h2>
                    
                    <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
                      {section.description}
                    </p>
                    
                    <button
                      onClick={() => handleNavigate(section.route)}
                      className="relative overflow-hidden group px-8 py-3 bg-white text-gray-900 font-bold rounded-full flex items-center gap-2 mx-auto hover:bg-opacity-95 transition-all"
                    >
                      <span className="relative z-10">{section.buttonText}</span>
                      <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation dots - Use transform for better performance */}
      <div 
        className={`fixed z-20 ${
          isMobile 
            ? 'right-4 top-1/2 flex-col'
            : 'bottom-8 left-1/2 flex-row'
        } flex gap-3`}
        style={{
          transform: isMobile 
            ? 'translateY(-50%)' 
            : 'translateX(-50%)',
        }}
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
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          
          {currentSection < sections.length - 1 && (
            <button
              onClick={() => goToSection(currentSection + 1)}
              className="fixed right-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
              aria-label="Next section"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </>
      )}
      
      {/* Section title indicator (mobile and desktop) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
          <p className="text-white/90 text-sm font-medium">
            {sections[currentSection].id.charAt(0).toUpperCase() + sections[currentSection].id.slice(1)}
          </p>
        </div>
      </div>
      
      {/* Mobile swipe instruction (more prominent) */}
      {isMobile && hasLoaded && (
        <div 
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 text-white text-base bg-blue-600/80 backdrop-blur-sm px-4 py-3 rounded-full flex items-center gap-2 pointer-events-none shadow-lg animate-pulse"
          style={{
            opacity: currentSection === 0 ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            transform: 'translateX(-50%)',
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="animate-bounce"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          Swipe to explore
        </div>
      )}
      
      {/* Desktop instruction (first visit only) */}
      {!isMobile && (
        <div 
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/70 text-sm bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none"
          style={{
            opacity: currentSection === 0 ? 0.7 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          Drag or swipe to navigate
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default Home;