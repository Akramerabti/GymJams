import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Heart, ChevronLeft, ChevronRight, Info, MapPin, Clock, Award } from 'lucide-react';
import { toast } from 'sonner';

const GymBrosMatches = ({ 
  externalProfiles = [], 
  externalLoading = false,
  onSwipe = null,
  onRefresh = null,
  filters = {}
}) => {
  // State for tracking profiles and current index
  const [profiles, setProfiles] = useState(externalProfiles || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Effect to update profiles when externally changed
  useEffect(() => {
    if (externalProfiles !== null) {
      console.log("GymBrosMatches: Setting profiles from external source", externalProfiles.length);
      setProfiles(externalProfiles);
    }
  }, [externalProfiles]);
  
  // Calculate if we have a current profile to display
  const currentProfile = profiles?.[currentIndex] || null;
  const hasProfiles = profiles && profiles.length > 0;

  // Get base URL for images
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Format image URL
  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return "/api/placeholder/400/600";
    
    if (imageUrl.startsWith('blob:')) {
      return imageUrl;
    } else if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else {
      return `${baseUrl}${imageUrl}`;
    }
  };
  
  // Get current image URL
  const currentImage = currentProfile?.images && currentProfile.images.length > 0 
    ? formatImageUrl(currentProfile.images[0])
    : formatImageUrl(currentProfile?.profileImage);
    
  // Handle like/dislike
  const handleAction = (direction) => {
    if (!currentProfile) return;
    
    // Call the provided swipe handler
    onSwipe?.(direction, currentProfile._id, 0);
    
    // Move to next profile
    goToNextProfile();
  };
  
  // Go to next profile
  const goToNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // No more profiles
      toast.info("You've seen all profiles for now");
      onRefresh?.();
    }
  };
  
  // Go to previous profile
  const goToPrevProfile = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  // Display loading state when no profiles
  if (externalLoading && !hasProfiles) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading profiles...</p>
        </div>
      </div>
    );
  }
  
  // Display empty state when no profiles
  if (!hasProfiles) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No profiles available</h3>
          <p className="text-gray-500 mb-4">We couldn't find any profiles matching your criteria</p>
          <button 
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Profile cards - using a flex column container for stacking */}
      <div className="flex-1 relative">
        {/* Current Profile Card - Fixed 7:10 aspect ratio */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-full max-w-sm mx-auto relative"
            style={{ 
              aspectRatio: '7/10',
              maxHeight: '80vh'
            }}
          >
            {/* Card content */}
            <div className="w-full h-full rounded-xl overflow-hidden shadow-xl bg-white relative">
              {/* Image */}
              <div className="w-full h-full relative">
                {/* Main image */}
                <img 
                  src={currentImage}
                  alt={currentProfile?.name || 'Profile'} 
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center top' }}
                  onError={(e) => {
                    console.error('Image load error:', e.target.src);
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/400/600";
                  }}
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                
                {/* Info button */}
                <button
                  onClick={() => {}}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 transition-colors"
                >
                  <Info size={20} />
                </button>
                
                {/* Profile info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center">
                    <h2 className="text-3xl font-bold mr-2">{currentProfile?.name || 'Name'}</h2>
                    <h3 className="text-2xl">{currentProfile?.age || '?'}</h3>
                  </div>
                  
                  {/* Active status */}
                  {currentProfile?.lastActive && (
                    <div className="flex items-center mt-1 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                      <span className="text-green-300 text-sm">Recently active</span>
                    </div>
                  )}
                  
                  <div className="flex items-center mt-1 mb-3">
                    <MapPin size={16} className="mr-1" />
                    <span>{currentProfile?.location?.distance || 0} miles away</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentProfile?.workoutTypes?.slice(0, 3).map(type => (
                      <span key={type} className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-3 text-sm mb-2">
                    <div className="flex items-center">
                      <Award size={14} className="mr-1" />
                      <span>{currentProfile?.experienceLevel || 'Any level'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>{currentProfile?.preferredTime || 'Flexible'}</span>
                    </div>
                  </div>
                  
                  <p className="text-white/90 line-clamp-2 text-sm">
                    {currentProfile?.bio || currentProfile?.goals || 'Looking for a workout partner'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="p-4 flex justify-center space-x-6">
        <button
          onClick={() => handleAction('left')}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <X size={24} className="text-red-500" />
        </button>
        
        <button
          onClick={() => handleAction('right')}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Heart size={24} className="text-green-500" />
        </button>
      </div>
      
      {/* Profile counter */}
      <div className="pb-2 text-center text-sm text-gray-500">
        Profile {currentIndex + 1} of {profiles.length}
      </div>
    </div>
  );
};

export default GymBrosMatches;