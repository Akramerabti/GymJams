import React, { useState, useRef, useEffect } from 'react';

const RangeSlider = ({
  min = 0,
  max = 100,
  minValue = 25,
  maxValue = 75,
  step = 1,
  onChange,
  className = '',
  trackColor = 'bg-blue-500',
  thumbColor = 'bg-white border-blue-500',
}) => {
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);
  const [isDragging, setIsDragging] = useState(null); // 'min', 'max', or null
  const [activeTouch, setActiveTouch] = useState(null); // Store touch identifier to avoid conflicts
  const trackRef = useRef(null);
  const minThumbRef = useRef(null);
  const maxThumbRef = useRef(null);

  // Update local state when props change
  useEffect(() => {
    setLocalMin(minValue);
    setLocalMax(maxValue);
  }, [minValue, maxValue]);

  // Calculate percentage for positioning
  const getPercentage = (value) => {
    return ((value - min) / (max - min)) * 100;
  };

  // Convert percentage to value
  const getValueFromPercentage = (percentage) => {
    const rawValue = (percentage * (max - min)) / 100 + min;
    // Round to nearest step
    return Math.round(rawValue / step) * step;
  };

  // Get position from mouse or touch event
  const getPositionFromEvent = (e) => {
    // For mouse events
    if (e.type.includes('mouse')) {
      return { clientX: e.clientX };
    }
    // For touch events
    else if (e.touches && e.touches[0]) {
      return { clientX: e.touches[0].clientX };
    }
    return null;
  };

  // Start dragging the min or max thumb
  const startDrag = (e, thumbType) => {
    // Prevent default behavior to avoid text selection during drag
    e.preventDefault();
    
    // Set which thumb is being dragged
    setIsDragging(thumbType);
    
    // Immediately handle the first click/touch position
    handleInitialPosition(e, thumbType);
    
    // Add event listeners for movement and release
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('touchmove', handleDrag, { passive: false });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
  };
  
  // Handle the initial click/touch position to move thumb immediately
  const handleInitialPosition = (e, thumbType) => {
    if (!trackRef.current) return;
    
    const position = getPositionFromEvent(e);
    if (!position) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = Math.min(rect.width, Math.max(0, position.clientX - rect.left));
    const percentage = (offsetX / rect.width) * 100;
    const newValue = getValueFromPercentage(percentage);
    
    // Determine which thumb to update based on position and currently selected thumb
    if (thumbType === 'min') {
      const clampedValue = Math.min(Math.max(min, newValue), localMax - step);
      setLocalMin(clampedValue);
      onChange?.({ min: clampedValue, max: localMax });
    } else if (thumbType === 'max') {
      const clampedValue = Math.max(Math.min(max, newValue), localMin + step);
      setLocalMax(clampedValue);
      onChange?.({ min: localMin, max: clampedValue });
    }
  };

  // Handle dragging motion
  const handleDrag = (e) => {
    // Stop if no thumb is being dragged
    if (!isDragging || !trackRef.current) return;
    
    // Prevent default to avoid scrolling on touch devices
    if (e.cancelable) {
      e.preventDefault();
    }
    
    // Get the current position
    const position = getPositionFromEvent(e);
    if (!position) return;
    
    // Calculate new value based on position
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = Math.min(rect.width, Math.max(0, position.clientX - rect.left));
    const percentage = (offsetX / rect.width) * 100;
    const newValue = getValueFromPercentage(percentage);
    
    // Update the appropriate value
    if (isDragging === 'min') {
      // Ensure min doesn't exceed max - step
      const clampedValue = Math.min(Math.max(min, newValue), localMax - step);
      setLocalMin(clampedValue);
      onChange?.({ min: clampedValue, max: localMax });
    } else if (isDragging === 'max') {
      // Ensure max doesn't go below min + step
      const clampedValue = Math.max(Math.min(max, newValue), localMin + step);
      setLocalMax(clampedValue);
      onChange?.({ min: localMin, max: clampedValue });
    }
  };

  // Stop dragging
  const stopDrag = () => {
    setIsDragging(null);
    
    // Remove all event listeners
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('touchmove', handleDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchend', stopDrag);
  };

  // Handle keyboard accessibility
  const handleKeyDown = (e, thumbType) => {
    const step = 1;
    let newValue;
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      newValue = thumbType === 'min' ? localMin - step : localMax - step;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      newValue = thumbType === 'min' ? localMin + step : localMax + step;
    } else if (e.key === 'Home') {
      newValue = thumbType === 'min' ? min : localMin + step;
    } else if (e.key === 'End') {
      newValue = thumbType === 'min' ? localMax - step : max;
    } else {
      return; // Not a key we care about
    }
    
    if (thumbType === 'min') {
      const clampedValue = Math.min(Math.max(min, newValue), localMax - step);
      setLocalMin(clampedValue);
      onChange?.({ min: clampedValue, max: localMax });
    } else {
      const clampedValue = Math.max(Math.min(max, newValue), localMin + step);
      setLocalMax(clampedValue);
      onChange?.({ min: localMin, max: clampedValue });
    }
    
    e.preventDefault(); // Prevent page scrolling
  };

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [isDragging]); // Re-create cleanup when isDragging changes

  return (
    <div className={`relative h-10 ${className}`}>
      {/* Background track */}
      <div
        ref={trackRef}
        className="absolute h-2 bg-gray-200 rounded-full w-full top-1/2 -translate-y-1/2 cursor-pointer"
        onClick={(e) => {
          // Determine if click is closer to min or max thumb and update accordingly
          const rect = trackRef.current.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const minX = (getPercentage(localMin) / 100) * rect.width;
          const maxX = (getPercentage(localMax) / 100) * rect.width;
          
          // Move the closest thumb to the click position
          const thumbType = Math.abs(clickX - minX) <= Math.abs(clickX - maxX) ? 'min' : 'max';
          handleInitialPosition(e, thumbType);
        }}
      >
        {/* Colored range between min and max */}
        <div
          className={`absolute h-full ${trackColor} rounded-full`}
          style={{
            left: `${getPercentage(localMin)}%`,
            width: `${getPercentage(localMax) - getPercentage(localMin)}%`,
          }}
        ></div>
      </div>

      {/* Min thumb */}
      <div
        ref={minThumbRef}
        className={`absolute w-6 h-6 ${thumbColor} rounded-full border-2 shadow top-1/2 -translate-y-1/2 -ml-3 cursor-grab active:cursor-grabbing z-10 touch-none`}
        style={{ left: `${getPercentage(localMin)}%` }}
        onMouseDown={(e) => startDrag(e, 'min')}
        onTouchStart={(e) => startDrag(e, 'min')}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={localMax}
        aria-valuenow={localMin}
        tabIndex={0}
      ></div>

      {/* Max thumb */}
      <div
        ref={maxThumbRef}
        className={`absolute w-6 h-6 ${thumbColor} rounded-full border-2 shadow top-1/2 -translate-y-1/2 -ml-3 cursor-grab active:cursor-grabbing z-10 touch-none`}
        style={{ left: `${getPercentage(localMax)}%` }}
        onMouseDown={(e) => startDrag(e, 'max')}
        onTouchStart={(e) => startDrag(e, 'max')}
        role="slider"
        aria-valuemin={localMin}
        aria-valuemax={max}
        aria-valuenow={localMax}
        tabIndex={0}
      ></div>
    </div>
  );
};

export default RangeSlider;