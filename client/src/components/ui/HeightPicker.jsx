import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const HeightPicker = ({ value, unit = 'cm', onHeightChange, onUnitChange, className = "" }) => {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHeight, setSelectedHeight] = useState(value || '');
  const dropdownRef = useRef(null);
  const scrollRef = useRef(null);

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

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected height when value prop changes
  useEffect(() => {
    setSelectedHeight(value || '');
  }, [value]);

  // Scroll to selected item when dropdown opens
  useEffect(() => {
    if (isOpen && scrollRef.current && selectedHeight) {
      const selectedIndex = heightOptions.findIndex(option => option.value === selectedHeight);
      if (selectedIndex !== -1) {
        const itemHeight = 48; // Height of each item in pixels
        const scrollTop = selectedIndex * itemHeight - 96; // Center the item
        scrollRef.current.scrollTop = Math.max(0, scrollTop);
      }
    }
  }, [isOpen, selectedHeight, heightOptions]);

  const handleHeightSelect = (height) => {
    setSelectedHeight(height.value);
    onHeightChange(height.value);
    setIsOpen(false);
  };

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
        const newOptions = unit === 'cm' ? generateHeightOptionsForInches() : generateHeightOptionsForCm();
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

  const getSelectedLabel = () => {
    if (!selectedHeight) return 'Select height';
    
    const option = heightOptions.find(opt => opt.value === selectedHeight);
    return option ? option.label : 'Select height';
  };

  // Theme-aware styles
  const getContainerStyles = () => {
    const baseStyles = "relative w-full";
    return `${baseStyles} ${className}`;
  };

  const getButtonStyles = () => {
    const baseStyles = "w-full flex items-center justify-between px-3 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none";
    const themeStyles = darkMode 
      ? "bg-gray-800 border-gray-600 text-white hover:border-gray-500 focus:border-blue-400" 
      : "bg-white border-gray-300 text-black hover:border-gray-400 focus:border-blue-500";
    
    return `${baseStyles} ${themeStyles}`;
  };

  const getDropdownStyles = () => {
    const baseStyles = "absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border shadow-lg max-h-64 overflow-hidden";
    const themeStyles = darkMode 
      ? "bg-gray-800 border-gray-600" 
      : "bg-white border-gray-200";
    
    return `${baseStyles} ${themeStyles}`;
  };

  const getItemStyles = (isSelected = false) => {
    const baseStyles = "px-3 py-3 cursor-pointer transition-colors flex items-center justify-between h-12";
    
    if (darkMode) {
      return `${baseStyles} ${isSelected 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-300 hover:bg-gray-700'
      }`;
    } else {
      return `${baseStyles} ${isSelected 
        ? 'bg-blue-50 text-blue-700' 
        : 'text-gray-700 hover:bg-gray-50'
      }`;
    }
  };

  const getUnitButtonStyles = () => {
    const baseStyles = "px-4 py-3 border-l-2 transition-colors hover:bg-opacity-50 min-w-20 font-medium";
    const themeStyles = darkMode 
      ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
      : "border-gray-300 text-gray-600 hover:bg-gray-50";
    
    return `${baseStyles} ${themeStyles}`;
  };

  return (
    <div className={getContainerStyles()} ref={dropdownRef}>
      <div className="flex">
        {/* Height selector */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${getButtonStyles()} rounded-r-none border-r-0 flex-1`}
        >
          <span className="font-medium">{getSelectedLabel()}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
        
        {/* Unit toggle */}
        <button
          type="button"
          onClick={handleUnitToggle}
          className={`${getUnitButtonStyles()} rounded-l-none rounded-r-xl border-2 ${
            darkMode ? 'border-gray-600' : 'border-gray-300'
          }`}
        >
          {unit}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={getDropdownStyles()}>
          <div 
            ref={scrollRef}
            className="max-h-64 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#4B5563 #374151' : '#D1D5DB #F3F4F6'
            }}
          >
            {heightOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleHeightSelect(option)}
                className={getItemStyles(selectedHeight === option.value)}
              >
                <span className="font-medium">{option.label}</span>
                <span className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {option.secondary}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .max-h-64::-webkit-scrollbar {
          width: 6px;
        }
        .max-h-64::-webkit-scrollbar-track {
          background: ${darkMode ? '#374151' : '#F3F4F6'};
          border-radius: 3px;
        }
        .max-h-64::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4B5563' : '#D1D5DB'};
          border-radius: 3px;
        }
        .max-h-64::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#6B7280' : '#9CA3AF'};
        }
      `}</style>
    </div>
  );
};

export default HeightPicker;