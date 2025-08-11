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
  const [lastScrollTime, setLastScrollTime] = useState(0);
  
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

  // Enhanced scroll handler with better sensitivity for desktop
  const handleScroll = useCallback((event) => {
    if (!scrollRef.current) return;
    
    const now = Date.now();
    const timeDiff = now - lastScrollTime;
    setLastScrollTime(now);
    
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // For wheel events (desktop), use more immediate response
    const isWheelEvent = event.type === 'wheel';
    const debounceTime = isWheelEvent ? 50 : 150; // Much faster for wheel events
    
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
      
      // Snap to center
      const targetScrollTop = clampedIndex * itemHeight;
      if (Math.abs(scrollRef.current.scrollTop - targetScrollTop) > 1) {
        scrollRef.current.scrollTop = targetScrollTop;
      }
      setIsScrolling(false);
    }, debounceTime);
  }, [heightOptions, selectedHeight, onHeightChange, lastScrollTime]);

  // Enhanced wheel handler for better desktop experience
  const handleWheel = useCallback((event) => {
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
  }, [heightOptions, selectedHeight, onHeightChange, itemHeight]);

  // Attach scroll and wheel listeners
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    
    // Add both scroll and wheel listeners
    scrollElement.addEventListener('scroll', handleScroll);
    scrollElement.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      scrollElement.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, handleWheel]);

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
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 border-2 ${
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
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch'
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
                className={`flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
                style={{
                  height: `${itemHeight}px`,
                  scrollSnapAlign: 'center',
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
      `}</style>
    </div>
  );
};

export default HeightPicker;