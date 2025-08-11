import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const HeightPicker = ({ value, unit = 'cm', onHeightChange, onUnitChange, className = "" }) => {
  const { darkMode } = useTheme();
  const [selectedHeight, setSelectedHeight] = useState(value || '');
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate height options based on unit
  const generateHeightOptions = () => {
    if (unit === 'cm') {
      // 120cm to 220cm (about 4ft to 7ft2)
      const options = [];
      for (let cm = 120; cm <= 220; cm++) {
        const feet = Math.floor(cm / 30.48);
        const inches = Math.round((cm / 30.48 - feet) * 12);
        options.push({
          value: cm.toString(),
          label: `${cm} cm`,
          secondary: `${feet}'${inches}"`
        });
      }
      return options;
    } else {
      // 4ft1 to 8ft (inches)
      const options = [];
      for (let feet = 4; feet <= 8; feet++) {
        const maxInches = feet === 8 ? 0 : 11; // Stop at 8'0"
        const startInches = feet === 4 ? 1 : 0; // Start at 4'1"
        
        for (let inches = startInches; inches <= maxInches; inches++) {
          const totalInches = feet * 12 + inches;
          const cm = Math.round(totalInches * 2.54);
          options.push({
            value: totalInches.toString(),
            label: `${feet}'${inches}"`,
            secondary: `${cm} cm`
          });
        }
      }
      return options;
    }
  };

  const heightOptions = generateHeightOptions();

  // Update selected height when value prop changes
  useEffect(() => {
    setSelectedHeight(value || '');
  }, [value]);

  // Center the selected item when component mounts or value changes
  useEffect(() => {
    if (scrollRef.current && selectedHeight) {
      const selectedIndex = heightOptions.findIndex(option => option.value === selectedHeight);
      if (selectedIndex !== -1) {
        const itemHeight = 60; // Height of each item in pixels
        const containerHeight = scrollRef.current.clientHeight;
        const scrollTop = selectedIndex * itemHeight - (containerHeight / 2) + (itemHeight / 2);
        scrollRef.current.scrollTop = Math.max(0, scrollTop);
      }
    }
  }, [selectedHeight, heightOptions, unit]);

  // Handle scroll to update selected value
  const handleScroll = () => {
    if (isDragging || !scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const itemHeight = 60;
    const containerHeight = scrollRef.current.clientHeight;
    const centerOffset = (containerHeight / 2) - (itemHeight / 2);
    const selectedIndex = Math.round((scrollTop + centerOffset) / itemHeight);
    
    const clampedIndex = Math.max(0, Math.min(selectedIndex, heightOptions.length - 1));
    const newSelectedHeight = heightOptions[clampedIndex];
    
    if (newSelectedHeight && newSelectedHeight.value !== selectedHeight) {
      setSelectedHeight(newSelectedHeight.value);
      onHeightChange(newSelectedHeight.value);
    }
  };

  // Debounced scroll handler
  useEffect(() => {
    const timeoutId = setTimeout(handleScroll, 100);
    return () => clearTimeout(timeoutId);
  }, [scrollRef.current?.scrollTop]);

  const handleUnitToggle = () => {
    const newUnit = unit === 'cm' ? 'inches' : 'cm';
    onUnitChange(newUnit);
    
    // Convert current height to new unit
    if (selectedHeight) {
      let convertedHeight;
      if (newUnit === 'cm' && unit === 'inches') {
        // Convert inches to cm
        convertedHeight = Math.round(parseInt(selectedHeight) * 2.54).toString();
      } else if (newUnit === 'inches' && unit === 'cm') {
        // Convert cm to inches
        convertedHeight = Math.round(parseInt(selectedHeight) / 2.54).toString();
      }
      
      if (convertedHeight) {
        // Find the closest valid option in the new unit
        const newOptions = newUnit === 'cm' ? generateHeightOptionsForCm() : generateHeightOptionsForInches();
        const closestOption = newOptions.reduce((prev, curr) => {
          return Math.abs(parseInt(curr.value) - parseInt(convertedHeight)) < Math.abs(parseInt(prev.value) - parseInt(convertedHeight)) ? curr : prev;
        });
        
        setSelectedHeight(closestOption.value);
        onHeightChange(closestOption.value);
      }
    }
  };

  // Helper functions for unit conversion
  const generateHeightOptionsForCm = () => {
    const options = [];
    for (let cm = 120; cm <= 220; cm++) {
      const feet = Math.floor(cm / 30.48);
      const inches = Math.round((cm / 30.48 - feet) * 12);
      options.push({
        value: cm.toString(),
        label: `${cm} cm`,
        secondary: `${feet}'${inches}"`
      });
    }
    return options;
  };

  const generateHeightOptionsForInches = () => {
    const options = [];
    for (let feet = 4; feet <= 8; feet++) {
      const maxInches = feet === 8 ? 0 : 11;
      const startInches = feet === 4 ? 1 : 0;
      
      for (let inches = startInches; inches <= maxInches; inches++) {
        const totalInches = feet * 12 + inches;
        const cm = Math.round(totalInches * 2.54);
        options.push({
          value: totalInches.toString(),
          label: `${feet}'${inches}"`,
          secondary: `${cm} cm`
        });
      }
    }
    return options;
  };

  // Theme-aware styles
  const getContainerStyles = () => {
    const baseStyles = "relative w-full";
    return `${baseStyles} ${className}`;
  };

  const getScrollContainerStyles = () => {
    const baseStyles = "relative h-48 overflow-hidden rounded-xl border-2";
    const themeStyles = darkMode 
      ? "bg-gray-800 border-gray-600" 
      : "bg-white border-gray-300";
    
    return `${baseStyles} ${themeStyles}`;
  };

  const getItemStyles = (isCenter = false, distance = 0) => {
    const baseStyles = "flex items-center justify-between px-4 py-3 text-center transition-all duration-200 h-15";
    
    // Calculate opacity based on distance from center
    const opacity = isCenter ? 1 : Math.max(0.3, 1 - (distance * 0.2));
    const scale = isCenter ? 1 : Math.max(0.9, 1 - (distance * 0.05));
    
    if (darkMode) {
      return `${baseStyles} text-white`;
    } else {
      return `${baseStyles} text-black`;
    }
  };

  const getUnitButtonStyles = () => {
    const baseStyles = "px-4 py-3 border-2 rounded-xl transition-colors hover:bg-opacity-50 min-w-20 font-medium mt-2";
    const themeStyles = darkMode 
      ? "border-gray-600 text-gray-300 hover:bg-gray-700 bg-gray-800" 
      : "border-gray-300 text-gray-600 hover:bg-gray-50 bg-white";
    
    return `${baseStyles} ${themeStyles}`;
  };

  return (
    <div className={getContainerStyles()}>
      {/* Scroll Container */}
      <div className={getScrollContainerStyles()}>
        {/* Center line indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className={`w-full h-15 border-t-2 border-b-2 ${
            darkMode ? 'border-blue-400' : 'border-blue-500'
          } opacity-30`}></div>
        </div>
        
        {/* Gradient overlays for fade effect */}
        <div className={`absolute top-0 left-0 right-0 h-16 z-20 pointer-events-none ${
          darkMode 
            ? 'bg-gradient-to-b from-gray-800 to-transparent' 
            : 'bg-gradient-to-b from-white to-transparent'
        }`}></div>
        <div className={`absolute bottom-0 left-0 right-0 h-16 z-20 pointer-events-none ${
          darkMode 
            ? 'bg-gradient-to-t from-gray-800 to-transparent' 
            : 'bg-gradient-to-t from-white to-transparent'
        }`}></div>

        {/* Scrollable content */}
        <div 
          ref={scrollRef}
          className="h-full overflow-y-scroll scrollbar-none relative z-10"
          onScroll={handleScroll}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: 'none'
          }}
        >
          {/* Padding for centering */}
          <div className="h-24"></div>
          
          {heightOptions.map((option, index) => {
            const isSelected = selectedHeight === option.value;
            const centerIndex = heightOptions.findIndex(opt => opt.value === selectedHeight);
            const distance = Math.abs(index - centerIndex);
            const opacity = isSelected ? 1 : Math.max(0.3, 1 - (distance * 0.15));
            const scale = isSelected ? 1.1 : Math.max(0.85, 1 - (distance * 0.05));
            
            return (
              <div
                key={option.value}
                className={`${getItemStyles(isSelected, distance)} h-15`}
                style={{
                  opacity,
                  transform: `scale(${scale})`,
                  fontWeight: isSelected ? 'bold' : 'normal',
                  fontSize: isSelected ? '1.1em' : '1em'
                }}
                onClick={() => {
                  setSelectedHeight(option.value);
                  onHeightChange(option.value);
                }}
              >
                <span className="font-medium">{option.label}</span>
                <span className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {option.secondary}
                </span>
              </div>
            );
          })}
          
          {/* Padding for centering */}
          <div className="h-24"></div>
        </div>
      </div>

      {/* Unit toggle button */}
      <button
        type="button"
        onClick={handleUnitToggle}
        className={getUnitButtonStyles()}
      >
        Switch to {unit === 'cm' ? 'inches' : 'cm'}
      </button>

      {/* Custom scrollbar hiding styles */}
      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default HeightPicker;