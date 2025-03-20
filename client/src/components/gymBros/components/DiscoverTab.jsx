import React from 'react';
import GymBrosMatches from '../GymBrosMatches';
import { Dumbbell } from 'lucide-react';

const DiscoverTab = ({ 
  profiles, 
  currentIndex, 
  setCurrentIndex, 
  handleSwipe, 
  fetchProfiles, 
  loading, 
  filters 
}) => {
  // Handle swipe from the GymBrosMatches component
  const handleSwipeFromMatchComponent = (direction, profileId, viewDuration) => {
    handleSwipe(direction, profileId);
  };
  
  // Only pass profiles up to the current index + a few more for performance
  const visibleProfiles = profiles.slice(0, currentIndex + 5);
  
  return (
    <div className="h-[calc(100vh-136px)] flex items-center justify-center pb-16">
      {profiles.length > 0 ? (
        <div className="relative w-full h-full">
          <GymBrosMatches
            externalProfiles={visibleProfiles}
            externalLoading={loading}
            onSwipe={handleSwipeFromMatchComponent}
            onRefresh={fetchProfiles}
            filters={filters}
          />
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
          <Dumbbell size={48} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No more profiles</h3>
          <p className="text-gray-500 mb-4">We couldn't find gym buddies matching your criteria.</p>
          <button 
            onClick={fetchProfiles}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscoverTab;