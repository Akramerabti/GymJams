import React from 'react';

/**
 * ActiveStatus - Displays a user's active status based on lastActive timestamp
 * 
 * @param {Object} props
 * @param {Date|string} props.lastActive - Timestamp of user's last activity
 * @param {string} props.textColorClass - Optional custom text color class
 * @param {string} props.dotColorClass - Optional custom dot color class
 */
const ActiveStatus = ({ 
  lastActive, 
  textColorClass = "text-green-300", 
  dotColorClass = "bg-green-500"
}) => {
  if (!lastActive) return null;
  
  // Calculate status based on how recently active
  const getActiveStatus = () => {
    const lastActiveDate = typeof lastActive === 'string' 
      ? new Date(lastActive) 
      : lastActive;
      
    const now = new Date();
    const diffMs = now - lastActiveDate;
    const hoursDiff = diffMs / (1000 * 60 * 60);
    
    if (hoursDiff <= 1) return 'Active now';
    if (hoursDiff <= 5) return 'Recently active';
    
    // If more than 24 hours, show the date
    if (hoursDiff > 24) {
      const days = Math.floor(hoursDiff / 24);
      if (days === 1) return 'Active yesterday';
      if (days <= 7) return `Active ${days} days ago`;
      
      // For older activity, show the date
      const options = { month: 'short', day: 'numeric' };
      return `Active on ${lastActiveDate.toLocaleDateString(undefined, options)}`;
    }
    
    return `Active ${Math.floor(hoursDiff)} hours ago`;
  };
  
  // Only show status for recent activity (≤ 5 hours)
  const status = getActiveStatus();
  const isRecent = status === 'Active now' || status === 'Recently active';
  
  if (!isRecent) return null;
  
  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full ${dotColorClass} mr-1.5 ${status === 'Active now' ? 'animate-pulse' : ''}`}></div>
      <span className={`${textColorClass} text-sm`}>{status}</span>
    </div>
  );
};

export default ActiveStatus;