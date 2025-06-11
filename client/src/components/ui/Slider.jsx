// Slider.jsx
import React from 'react';

const Slider = ({ value, onValueChange, min, max, step, className }) => {
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      min={min}
      max={max}
      step={step}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
    />
  );
};

export default Slider; // Default export