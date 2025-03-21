import React from 'react';

/**
 * Displays a user's active status based on their last active timestamp
 * 
 * @param {Object} props
 * @param {string|Date} props.lastActive - The timestamp when the user was last active
 * @param {string} props.textColorClass - Optional CSS class for text color (default: "text-green-300")
 * @param {string} props.dotColorClass - Optional CSS class for dot color (default: "bg-green-500")
 * @param {boolean} props.showDot - Whether to show the pulsing dot (default: true)
 */
const ActiveStatus = ({ 
  lastActive, 
  textColorClass = "text-green-300", 
  dotColorClass = "bg-green-500",
  showDot = true
}) => {
  if (!lastActive) return null;
  
  const getActiveStatus = () => {
    const lastActiveDate = typeof lastActive === 'string' 
      ? new Date(lastActive) 
      : lastActive;
      
    const now = new Date();
    const hoursDiff = (now - lastActiveDate) / (1000 * 60 * 60);
    
    if (hoursDiff <= 1) return 'Active now';
    if (hoursDiff <= 5) return 'Recently active';
    
    // If more than 24 hours, show the date
    if (hoursDiff > 24) {
      const days = Math.floor(hoursDiff / 24);
      if (days === 1) return 'Active yesterday';
      if (days <= 7) return `Active ${days} days ago`;
      
      // If more than a week, show the date
      return `Active on ${lastActiveDate.toLocaleDateString()}`;
    }
    
    return `Active ${Math.floor(hoursDiff)} hours ago`;
  };
  
  return (
    <div className="flex items-center">
      {showDot && (
        <div className={`w-2 h-2 rounded-full ${dotColorClass} mr-1.5 animate-pulse`}></div>
      )}
      <span className={`${textColorClass} text-sm`}>{getActiveStatus()}</span>
    </div>
  );
};

export default ActiveStatus;