import React from 'react';

const Progress = ({ value, className }) => {
  // Ensure the value is between 0 and 100
  const progressValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-2 bg-blue-600 rounded-full transition-all duration-300"
        style={{ width: `${progressValue}%` }}
      ></div>
    </div>
  );
};

// Export the Progress component as the default export
export default Progress;