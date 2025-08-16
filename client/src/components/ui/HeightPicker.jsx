import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const HeightPicker = ({ 
  value, 
  unit = 'cm', 
  onHeightChange, 
  onUnitChange, 
  className = "" 
}) => {
  const { darkMode } = useTheme();
  const [selectedHeight, setSelectedHeight] = useState(value || '');
  const scrollRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const itemHeight = 44; // Fixed height for each item
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showWheelHint, setShowWheelHint] = useState(false);

  // Detect if this is a touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
      return hasTouch;
    };
    
    const isTouch = checkTouchDevice();
    
    // Only show wheel hint on non-touch devices
    if (!isTouch) {
      setShowWheelHint(true);
      const hide = () => setShowWheelHint(false);
      window.addEventListener('wheel', hide, { once: true });
      const timeout = setTimeout(hide, 4000);
      return () => {
        window.removeEventListener('wheel', hide);
        clearTimeout(timeout);
      };
    }
  }, []);

  // Generate height options based on unit
  const generateHeightOptions = useCallback(() => {
    if (unit === 'cm') {
      const options = [];
      for (let cm = 120; cm <= 220; cm++) {
        options.push({
          value: cm.toString(),
          label: `${cm} cm`,
          displayValue: cm
        });
      }
      return options;
    } else {
      const options = [];
      for (let feet = 4; feet <= 7; feet++) {
        const maxInches = feet === 7 ? 11 : 11;
        const startInches = feet === 4 ? 1 : 0;
        
        for (let inches = startInches; inches <= maxInches; inches++) {
          const totalInches = feet * 12 + inches;
          options.push({
            value: totalInches.toString(),
            label: `${feet}'${inches}"`,
            displayValue: `${feet}'${inches}"`
          });
        }
      }
      return options;
    }
  }, [unit]);

  const heightOptions = generateHeightOptions();

  // Find current index
  const getCurrentIndex = useCallback(() => {
    return heightOptions.findIndex(option => option.value === selectedHeight);
  }, [heightOptions, selectedHeight]);

  // Update selected height when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setSelectedHeight(value.toString());
    }
  }, [value]);

  // Scroll to selected item when component mounts or unit changes
  useEffect(() => {
    if (!scrollRef.current || !selectedHeight) return;
    
    const index = getCurrentIndex();
    if (index === -1) return;
    
    const scrollTop = index * itemHeight;
    scrollRef.current.scrollTop = scrollTop;
  }, [unit, selectedHeight, getCurrentIndex]);

  // Optimized scroll handler for mobile vs desktop
  const handleScroll = useCallback((event) => {
    if (!scrollRef.current) return;
    
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Different timing for touch vs mouse/wheel
    const debounceTime = isTouchDevice ? 50 : 100; // Much faster for touch
    
    // Set new timeout for snap behavior
    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, heightOptions.length - 1));
      const selectedOption = heightOptions[clampedIndex];
      
      if (selectedOption && selectedOption.value !== selectedHeight) {
        setSelectedHeight(selectedOption.value);
        if (onHeightChange) {
          onHeightChange(selectedOption.value);
        }
      }
      
      // Only snap if we're not on a touch device or if the scroll has settled
      if (!isTouchDevice) {
        const targetScrollTop = clampedIndex * itemHeight;
        if (Math.abs(scrollRef.current.scrollTop - targetScrollTop) > 1) {
          scrollRef.current.scrollTop = targetScrollTop;
        }
      }
      
      setIsScrolling(false);
    }, debounceTime);
  }, [heightOptions, selectedHeight, onHeightChange, isTouchDevice]);

  // Wheel handler specifically for desktop (mouse wheel)
  const handleWheel = useCallback((event) => {
    // Only handle wheel events on non-touch devices
    if (isTouchDevice) return;
    
    event.preventDefault();
    
    if (!scrollRef.current) return;
    
    const currentScrollTop = scrollRef.current.scrollTop;
    const currentIndex = Math.round(currentScrollTop / itemHeight);
    
    // Determine direction and move by exactly one item
    const deltaY = event.deltaY;
    const direction = deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(currentIndex + direction, heightOptions.length - 1));
    
    // Scroll to the exact position
    scrollRef.current.scrollTop = newIndex * itemHeight;
    
    // Update selected option immediately for better responsiveness
    const selectedOption = heightOptions[newIndex];
    if (selectedOption && selectedOption.value !== selectedHeight) {
      setSelectedHeight(selectedOption.value);
      if (onHeightChange) {
        onHeightChange(selectedOption.value);
      }
    }
  }, [heightOptions, selectedHeight, onHeightChange, itemHeight, isTouchDevice]);

  // Touch handlers for better mobile experience
  const handleTouchStart = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    setIsScrolling(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Let the momentum scroll finish naturally on mobile
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, heightOptions.length - 1));
      const selectedOption = heightOptions[clampedIndex];
      
      if (selectedOption && selectedOption.value !== selectedHeight) {
        setSelectedHeight(selectedOption.value);
        if (onHeightChange) {
          onHeightChange(selectedOption.value);
        }
      }
      
      setIsScrolling(false);
    }, 200); // Longer delay for touch to let momentum scrolling finish
  }, [heightOptions, selectedHeight, onHeightChange]);

  // Attach scroll and wheel listeners
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    
    // Always add scroll listener
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    // Only add wheel listener for non-touch devices
    if (!isTouchDevice) {
      scrollElement.addEventListener('wheel', handleWheel, { passive: false });
    } else {
      // Add touch-specific listeners for mobile
      scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      scrollElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (!isTouchDevice) {
        scrollElement.removeEventListener('wheel', handleWheel);
      } else {
        scrollElement.removeEventListener('touchstart', handleTouchStart);
        scrollElement.removeEventListener('touchend', handleTouchEnd);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, handleWheel, handleTouchStart, handleTouchEnd, isTouchDevice]);

  // Handle unit toggle
  const handleUnitToggle = () => {
    const newUnit = unit === 'cm' ? 'inches' : 'cm';
    
    if (onUnitChange) {
      onUnitChange(newUnit);
    }
    
    // Convert current height to new unit
    if (selectedHeight) {
      let convertedHeight;
      if (newUnit === 'cm' && unit === 'inches') {
        convertedHeight = Math.round(parseInt(selectedHeight) * 2.54);
      } else if (newUnit === 'inches' && unit === 'cm') {
        convertedHeight = Math.round(parseInt(selectedHeight) / 2.54);
      }
      
      if (convertedHeight) {
        // Generate options for new unit
        const newOptions = newUnit === 'cm' ? 
          (() => {
            const opts = [];
            for (let cm = 120; cm <= 220; cm++) {
              opts.push({ value: cm.toString(), label: `${cm} cm` });
            }
            return opts;
          })() :
          (() => {
            const opts = [];
            for (let feet = 4; feet <= 7; feet++) {
              const maxInches = feet === 7 ? 11 : 11;
              const startInches = feet === 4 ? 1 : 0;
              for (let inches = startInches; inches <= maxInches; inches++) {
                const totalInches = feet * 12 + inches;
                opts.push({ 
                  value: totalInches.toString(), 
                  label: `${feet}'${inches}"` 
                });
              }
            }
            return opts;
          })();
        
        // Find closest option
        const closestOption = newOptions.reduce((prev, curr) => {
          const prevDiff = Math.abs(parseInt(prev.value) - convertedHeight);
          const currDiff = Math.abs(parseInt(curr.value) - convertedHeight);
          return currDiff < prevDiff ? curr : prev;
        });
        
        setSelectedHeight(closestOption.value);
        if (onHeightChange) {
          onHeightChange(closestOption.value);
        }
      }
    }
  };

  // Handle item click
  const handleItemClick = (optionValue) => {
    setSelectedHeight(optionValue);
    if (onHeightChange) {
      onHeightChange(optionValue);
    }
    
    // Scroll to clicked item
    const index = heightOptions.findIndex(option => option.value === optionValue);
    if (index !== -1 && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
    }
  };

  const containerHeight = 200;
  const visibleItems = Math.floor(containerHeight / itemHeight);
  const paddingItems = Math.floor(visibleItems / 2);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Elegant scroll wheel hint for desktop only */}
      {showWheelHint && !isTouchDevice && (
        <div className="absolute left-1/2 -translate-x-1/2 top-2 z-40 flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-full shadow text-xs font-medium text-gray-700 dark:text-gray-200 pointer-events-none animate-fade-in">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <rect x="7" y="2" width="10" height="20" rx="5" fill="#888" />
            <rect x="11" y="5" width="2" height="4" rx="1" fill="#fff" />
          </svg>
          <span>Tip: Use your scroll wheel</span>
        </div>
      )}
      
      {/* Touch hint for mobile */}
      {isTouchDevice && (
        <div className="text-center mb-2">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Swipe up or down to select your height
          </p>
        </div>
      )}
      
      {/* Main container */}
      <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-white border-gray-300'
      }`} style={{ height: containerHeight }}>
        
        {/* Unit toggle button */}
        <div className="absolute right-3 top-3 z-30">
          <button
            type="button"
            onClick={handleUnitToggle}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 border-2 touch-manipulation ${
              darkMode
                ? 'bg-gray-700 border-gray-500 text-gray-200 hover:bg-gray-600 hover:border-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
            }`}
          >
            {unit === 'cm' ? 'CM' : 'FT'}
          </button>
        </div>

        {/* Selection indicator line */}
        <div 
          className={`absolute left-0 right-0 z-20 border-t-2 border-b-2 pointer-events-none ${
            darkMode ? 'border-blue-400' : 'border-blue-500'
          }`}
          style={{
            top: `${(containerHeight - itemHeight) / 2}px`,
            height: `${itemHeight}px`
          }}
        />

        {/* Top gradient overlay */}
        <div className={`absolute top-0 left-0 right-0 z-10 pointer-events-none h-16 ${
          darkMode 
            ? 'bg-gradient-to-b from-gray-800 via-gray-800/80 to-transparent' 
            : 'bg-gradient-to-b from-white via-white/80 to-transparent'
        }`} />

        {/* Bottom gradient overlay */}
        <div className={`absolute bottom-0 left-0 right-0 z-10 pointer-events-none h-16 ${
          darkMode 
            ? 'bg-gradient-to-t from-gray-800 via-gray-800/80 to-transparent' 
            : 'bg-gradient-to-t from-white via-white/80 to-transparent'
        }`} />

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="h-full overflow-y-scroll scrollbar-hide"
          style={{
            // Only use scroll snap on desktop, let mobile scroll naturally
            scrollSnapType: isTouchDevice ? 'none' : 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            // Better mobile scrolling
            touchAction: 'pan-y'
          }}
        >
          {/* Top padding */}
          <div style={{ height: `${paddingItems * itemHeight}px` }} />
          
          {/* Height options */}
          {heightOptions.map((option, index) => {
            const isSelected = selectedHeight === option.value;
            const distanceFromCenter = Math.abs(
              getCurrentIndex() - index
            );
            const opacity = Math.max(0.3, 1 - (distanceFromCenter * 0.15));
            const scale = Math.max(0.85, 1 - (distanceFromCenter * 0.05));
            
            return (
              <div
                key={option.value}
                className={`flex items-center justify-center cursor-pointer transition-all duration-200 touch-manipulation ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
                style={{
                  height: `${itemHeight}px`,
                  scrollSnapAlign: isTouchDevice ? 'none' : 'center',
                  opacity: isScrolling ? 1 : opacity,
                  transform: isScrolling ? 'scale(1)' : `scale(${scale})`,
                  fontWeight: isSelected ? '600' : '400',
                  fontSize: isSelected ? '18px' : '16px',
                  color: isSelected ? 
                    (darkMode ? '#60a5fa' : '#2563eb') : 
                    (darkMode ? '#e5e7eb' : '#374151')
                }}
                onClick={() => handleItemClick(option.value)}
              >
                <span className="select-none">
                  {option.displayValue || option.label}
                </span>
              </div>
            );
          })}
          
          {/* Bottom padding */}
          <div style={{ height: `${paddingItems * itemHeight}px` }} />
        </div>
      </div>

      {/* Current selection display */}
      <div className={`text-center mt-2 text-sm ${
        darkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Selected: <span className={`font-medium ${
          darkMode ? 'text-blue-400' : 'text-blue-600'
        }`}>
          {heightOptions.find(opt => opt.value === selectedHeight)?.displayValue || 
           heightOptions.find(opt => opt.value === selectedHeight)?.label || 
           'None'}
        </span>
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.5s;
        }
        
        /* Optimize touch scrolling performance */
        .scrollbar-hide {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
      `}</style>
    </div>
  );
};

export default HeightPicker;