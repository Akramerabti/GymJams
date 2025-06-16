import React from 'react';

const ActiveStatus = ({ 
  lastActive, 
  textColorClass = "text-green-300", 
  dotColorClass = "bg-green-500"
}) => {
  if (!lastActive) return null;

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