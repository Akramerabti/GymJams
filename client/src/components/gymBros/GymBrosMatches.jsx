import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, Star, ChevronLeft, ChevronRight, 
  UserPlus, Loader, RefreshCw, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import gymbrosService from '../../services/gymbros.service';
import MatchCard from './components/MatchCard';
import ProfileDetailModal from './components/DiscoverProfileDetails';

const GymBrosMatches = ({ 
  externalProfiles = null, 
  externalLoading = null,
  onSwipe = null,
  onRefresh = null,
  filters = {}
}) => {
  // State is managed internally if not provided as props
  const [profiles, setProfiles] = useState(externalProfiles || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(externalLoading !== null ? externalLoading : true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [swipedProfiles, setSwipedProfiles] = useState([]);
  const [viewStartTime, setViewStartTime] = useState(Date.now());
  
  // Handle cases where props change
  useEffect(() => {
    if (externalProfiles !== null) {
      setProfiles(externalProfiles);
    }
  }, [externalProfiles]);

  useEffect(() => {
    if (externalLoading !== null) {
      setLoading(externalLoading);
    }
  }, [externalLoading]);

  // Set view start time when profile changes
  useEffect(() => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      setViewStartTime(Date.now());
    }
  }, [currentIndex, profiles]);
  
  // Load profiles when component mounts (only if not provided externally)
  useEffect(() => {
    if (externalProfiles === null) {
      loadProfiles(true);
    }
  }, [externalProfiles]);
  
  // Load profiles from API
  const loadProfiles = async (reset = false) => {
    if (loading || externalProfiles !== null) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get recommended profiles from service
      const response = await gymbrosService.getRecommendedProfiles(filters);
      
      if (!response || response.length === 0) {
        setHasMore(false);
        if (reset) setProfiles([]);
        return;
      }
      
      // Filter out already swiped profiles
      const newProfiles = response.filter(
        profile => !swipedProfiles.includes(profile._id)
      );
      
      // Update profiles state
      setProfiles(prev => {
        if (reset) return newProfiles;
        return [...prev, ...newProfiles];
      });
      
      // Reset index if requested
      if (reset) {
        setCurrentIndex(0);
        setCurrentImageIndex(0);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle swiping on profile
  const handleSwipe = async (direction, profileId) => {
    try {
      // Calculate view duration
      const viewDuration = Date.now() - viewStartTime;
      
      // Add to swiped profiles to avoid showing again
      setSwipedProfiles(prev => [...prev, profileId]);
      
      // If parent component provided onSwipe handler, use that
      if (onSwipe) {
        onSwipe(direction, profileId, viewDuration);
      } else {
        // Otherwise handle internally
        if (direction === 'right') {
          await gymbrosService.likeProfile(profileId, viewDuration);
          // Subtle indication of successful like
          toast.custom((t) => (
            <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg">
              <Heart className="text-red-500 h-8 w-8" />
            </div>
          ), { position: 'top-center', duration: 1000 });
        } else {
          await gymbrosService.dislikeProfile(profileId, viewDuration);
        }
      }
      
      // Move to next profile
      setCurrentIndex(prev => prev + 1);
      setCurrentImageIndex(0); // Reset image index for next profile
      
      // If we're running low on profiles, load more
      if (externalProfiles === null && currentIndex > profiles.length - 3 && hasMore) {
        loadProfiles();
      }
    } catch (err) {
      console.error('Error handling swipe:', err);
      toast.error('Failed to process your action');
    }
  };
  
  // Handle refresh button
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      loadProfiles(true);
    }
  };
  
  // Current profile being displayed
  const currentProfile = profiles[currentIndex];
  
  // Render loading state
  if (loading && profiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="relative h-12 w-12 mb-4">
          <Loader size={48} className="animate-spin text-blue-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart size={24} className="text-blue-700" />
          </div>
        </div>
        <p className="text-gray-500">Finding your perfect gym partner...</p>
      </div>
    );
  }
  
  // Render error state
  if (error && profiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <X size={48} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-full flex items-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} className="mr-2" />
          Try Again
        </button>
      </div>
    );
  }
  
  // Render empty state
  if (profiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <UserPlus size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">No more profiles</h3>
        <p className="text-gray-500 mb-6">We couldn't find any more gym partners matching your criteria</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-full flex items-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </button>
      </div>
    );
  }
  
  // If we've gone through all profiles
  if (currentIndex >= profiles.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <RefreshCw size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">You've seen all profiles</h3>
        <p className="text-gray-500 mb-6">Check back later or try different filters</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-full flex items-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </button>
      </div>
    );
  }
  
  return (
    <div className="relative h-full flex flex-col">
      {/* Action buttons at bottom of screen */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center items-center space-x-4">
        <button
          onClick={() => handleSwipe('left', currentProfile._id)}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-90 transition-transform"
          aria-label="Dislike"
        >
          <X size={30} className="text-red-500" />
        </button>
        
        <button
          onClick={() => handleSwipe('right', currentProfile._id)}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-90 transition-transform"
          aria-label="Like"
        >
          <Heart size={30} className="text-green-500" />
        </button>
      </div>
      
      {/* Card Stack */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence>
          {currentProfile && (
            <MatchCard
              key={currentProfile._id}
              profile={currentProfile}
              onSwipe={handleSwipe}
              currentImageIndex={currentImageIndex}
              setCurrentImageIndex={setCurrentImageIndex}
              onInfoClick={() => setShowProfileDetail(true)}
            />
          )}
        </AnimatePresence>
        
        {/* Show loading indicator when fetching more at the end */}
        {loading && profiles.length > 0 && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center shadow-md">
              <Loader size={16} className="animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">Loading more profiles...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Profile Detail Modal */}
      <ProfileDetailModal
        profile={currentProfile}
        isVisible={showProfileDetail}
        onClose={() => setShowProfileDetail(false)}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
      />
    </div>
  );
};

export default GymBrosMatches;