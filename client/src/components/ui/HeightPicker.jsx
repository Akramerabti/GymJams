import React, { useState, useRef, useEffect } from 'react';

const HeightPicker = ({ value, unit = 'cm', onHeightChange, onUnitChange, className = "" }) => {
  const [selectedHeight, setSelectedHeight] = useState(value || '');
  const scrollRef = useRef(null);
  const itemRef = useRef(null);
  const [itemHeight, setItemHeight] = useState(50);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Generate height options based on unit
  const generateHeightOptions = () => {
    if (unit === 'cm') {
      // 120cm to 220cm
      const options = [];
      for (let cm = 120; cm <= 220; cm++) {
        options.push({
          value: cm.toString(),
          label: cm.toString()
        });
      }
      return options;
    } else {
      // 4ft1 to 8ft (in inches format)
      const options = [];
      for (let feet = 4; feet <= 7; feet++) {
        const maxInches = feet === 7 ? 11 : 11; // Go up to 7'11"
        const startInches = feet === 4 ? 1 : 0; // Start at 4'1"
        
        for (let inches = startInches; inches <= maxInches; inches++) {
          const totalInches = feet * 12 + inches;
          options.push({
            value: totalInches.toString(),
            label: `${feet}'${inches}"`
          });
        }
      }
      return options;
    }
  };

  const heightOptions = generateHeightOptions();

  // Update selected height when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setSelectedHeight(value.toString());
    }
  }, [value]);

  // Dynamically set item height from DOM
  useEffect(() => {
    if (itemRef.current) {
      setItemHeight(itemRef.current.offsetHeight);
    }
  }, [unit]);

  // Center the selected item when component mounts or unit/selectedHeight changes
  useEffect(() => {
    if (!scrollRef.current || !selectedHeight) return;
    const selectedIndex = heightOptions.findIndex(option => option.value === selectedHeight);
    if (selectedIndex === -1) return;
    const scrollTop = selectedIndex * itemHeight;
    scrollRef.current.scrollTop = scrollTop;
  }, [unit, heightOptions, selectedHeight, itemHeight]);

  // Snap to nearest item on scroll end, but only if user is not clicking an item
  useEffect(() => {
    if (!scrollRef.current) return;
    let timeoutId;
    const handleScroll = () => {
      setIsUserScrolling(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsUserScrolling(false);
        if (!scrollRef.current) return;
        const scrollTop = scrollRef.current.scrollTop;
        const nearestIndex = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(nearestIndex, heightOptions.length - 1));
        const newSelected = heightOptions[clampedIndex];
        // Only update if not already selected
        if (newSelected && newSelected.value !== selectedHeight) {
          setSelectedHeight(newSelected.value);
          if (onHeightChange) {
            const returnValue = unit === 'inches' ? newSelected.label : newSelected.value;
            onHeightChange(returnValue);
          }
        }
        // Snap scroll position only if not already centered
        if (scrollRef.current.scrollTop !== clampedIndex * itemHeight) {
          scrollRef.current.scrollTo({
            top: clampedIndex * itemHeight,
            behavior: 'auto'
          });
        }
      }, 200); // Slightly longer debounce for better UX
    };
    const el = scrollRef.current;
    el.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timeoutId);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [heightOptions, selectedHeight, itemHeight, unit, onHeightChange]);

  const handleUnitToggle = () => {
    const newUnit = unit === 'cm' ? 'inches' : 'cm';
    if (onUnitChange) {
      onUnitChange(newUnit);
    }
    
    // Convert current height to new unit and find the closest option
    if (selectedHeight) {
      let convertedHeight;
      if (newUnit === 'cm' && unit === 'inches') {
        // Convert inches to cm
        convertedHeight = Math.round(parseInt(selectedHeight) * 2.54);
      } else if (newUnit === 'inches' && unit === 'cm') {
        // Convert cm to inches
        convertedHeight = Math.round(parseInt(selectedHeight) / 2.54);
      }
      
      if (convertedHeight) {
        // Generate new options for the new unit
        const newOptions = newUnit === 'cm' ? 
          generateHeightOptionsForCm() : 
          generateHeightOptionsForInches();
        
        // Find the closest option in the new unit
        const closestOption = newOptions.reduce((prev, curr) => {
          const prevDiff = Math.abs(parseInt(prev.value) - convertedHeight);
          const currDiff = Math.abs(parseInt(curr.value) - convertedHeight);
          return currDiff < prevDiff ? curr : prev;
        });
        
        setSelectedHeight(closestOption.value);
        if (onHeightChange) {
          // Return the appropriate value format
          const returnValue = newUnit === 'inches' ? closestOption.label : closestOption.value;
          onHeightChange(returnValue);
        }
      }
    }
  };

  const handleItemClick = (optionValue, optionLabel) => {
    setSelectedHeight(optionValue);
    if (onHeightChange) {
      const returnValue = unit === 'inches' ? optionLabel : optionValue;
      onHeightChange(returnValue);
    }
    // Snap to item
    const selectedIndex = heightOptions.findIndex(option => option.value === optionValue);
    if (selectedIndex !== -1 && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: selectedIndex * itemHeight,
        behavior: 'smooth'
      });
    }
  };

  // Calculate dynamic top/bottom padding for centering
  const containerHeight = 240; // h-60 = 240px
  const dynamicPadding = (containerHeight - itemHeight) / 2;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative h-60 overflow-hidden rounded-lg bg-white">
        {/* Unit toggle button */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
          <button
            type="button"
            onClick={handleUnitToggle}
            className="px-3 py-1 text-sm border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            {unit === 'cm' ? 'ft' : 'cm'}
          </button>
        </div>
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-20 z-20 pointer-events-none bg-gradient-to-b from-white to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-20 z-20 pointer-events-none bg-gradient-to-t from-white to-transparent"></div>
        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="h-full overflow-y-scroll relative z-10"
          style={{
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Top padding for centering */}
          <div style={{ height: dynamicPadding }}></div>
          {heightOptions.map((option, index) => {
            const isSelected = selectedHeight === option.value;
            
            return (
              <div
                key={option.value}
                ref={isSelected ? itemRef : null}
                className="flex items-center justify-center px-4 text-center transition-all duration-200 cursor-pointer"
                style={{
                  height: `${itemHeight}px`,
                  scrollSnapAlign: 'center',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  fontSize: isSelected ? '1.2em' : '1em',
                  color: isSelected ? '#1e40af' : '#374151', // Always blue for selected, even in ft
                  background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent'
                }}
                onClick={() => handleItemClick(option.value, option.label)}
              >
                <span>{option.label}</span>
              </div>
            );
          })}
          {/* Bottom padding for centering */}
          <div style={{ height: dynamicPadding }}></div>
        </div>
      </div>
      {/* Hide scrollbar */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

// Demo component to test the height picker
const HeightPickerDemo = () => {
  const [height, setHeight] = useState('170'); // Start with cm
  const [unit, setUnit] = useState('cm');

  return (
    <div className=" min-h-screen">
      <div className="mb-4 text-center">
        <p className="text-lg">Selected Height:</p>
        <p className="text-xl font-bold text-blue-600">
          {height} {unit === 'cm' ? 'cm' : ''}
        </p>
      </div>
      
      <HeightPicker
        value={height}
        unit={unit}
        onHeightChange={setHeight}
        onUnitChange={setUnit}
      />
    </div>
  );
};

export default HeightPickerDemo;