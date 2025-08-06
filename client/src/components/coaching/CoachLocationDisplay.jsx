import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

const CoachLocationDisplay = ({ 
  location, 
  distance, 
  showDistance = true, 
  className = "",
  size = "sm" // sm, md, lg
}) => {
  if (!location) return null;

  const sizeClasses = {
    sm: {
      icon: "w-3 h-3",
      text: "text-xs",
      container: "px-2 py-1"
    },
    md: {
      icon: "w-4 h-4", 
      text: "text-sm",
      container: "px-3 py-1.5"
    },
    lg: {
      icon: "w-5 h-5",
      text: "text-base",
      container: "px-4 py-2"
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.sm;

  // Format display text
  const getDisplayText = () => {
    let text = location.city || 'Location not set';
    
    if (showDistance && distance !== null && distance !== undefined && distance < 999) {
      const roundedDistance = Math.round(distance);
      if (roundedDistance === 0) {
        text += ' (nearby)';
      } else if (roundedDistance === 1) {
        text += ' (1 mi)';
      } else {
        text += ` (${roundedDistance} mi)`;
      }
    }
    
    return text;
  };

  // Determine if this is a nearby coach (within 25 miles)
  const isNearby = distance !== null && distance !== undefined && distance <= 25;
  
  return (
    <div className={`
      inline-flex items-center space-x-1.5 rounded-full border
      ${isNearby 
        ? 'bg-green-50 border-green-200 text-green-700' 
        : 'bg-gray-50 border-gray-200 text-gray-600'
      }
      ${currentSize.container} ${className}
    `}>
      <MapPin className={`${currentSize.icon} flex-shrink-0`} />
      <span className={`${currentSize.text} font-medium truncate`}>
        {getDisplayText()}
      </span>
      {isNearby && (
        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
      )}
    </div>
  );
};

// Component specifically for coach cards
export const CoachLocationBadge = ({ coach, userLocation, className = "" }) => {
  if (!coach?.location?.city) return null;

  let distance = null;
  
  // Calculate distance if user location is available
  if (userLocation && coach.location.lat && coach.location.lng && userLocation.lat && userLocation.lng) {
    distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      coach.location.lat,
      coach.location.lng
    );
  }

  return (
    <CoachLocationDisplay
      location={coach.location}
      distance={distance}
      className={className}
      size="sm"
    />
  );
};

// Utility function to calculate distance (same as backend)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

export default CoachLocationDisplay;
