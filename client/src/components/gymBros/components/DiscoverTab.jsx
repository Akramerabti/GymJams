import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader, RefreshCw, Star, X, Heart, 
  Info, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import ProfileDetailModal from './ProfileDetailModal';
import MatchModal from './MatchModal';
import EmptyStateMessage from './EmptyStateMessage';
import SwipeableCard from './SwipeableCard';
import gymbrosService from '../../../services/gymbros.service';
import { usePoints } from '../../../hooks/usePoints';
import useAuthStore from '../../../stores/authStore';

// Premium feature costs
const PREMIUM_FEATURES = {
  REKINDLE: 30,
  SUPERSTAR: 20
};

const DiscoverTab = ({ 
  fetchProfiles,
  loading,
  filters,
  setShowFilters,
  distanceUnit = 'miles',
  isPremium = false,
  initialProfiles = [],  // Default to empty array
  initialIndex = 0,    // Default to 0
  userProfile = null
}) => {
  const { balance: pointsBalance, subtractPoints, updatePointsInBackend } = usePoints();
  const { isAuthenticated } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [viewStartTime, setViewStartTime] = useState(Date.now());
  const [loadingMoreProfiles, setLoadingMoreProfiles] = useState(false);
  const [hasMoreProfiles, setHasMoreProfiles] = useState(true);
  const [lastSwiped, setLastSwiped] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  
  // Container ref for pull-to-refresh
  const containerRef = useRef(null);

  // Use initialProfiles if provided
  useEffect(() => {
    if (initialProfiles && Array.isArray(initialProfiles) && initialProfiles.length > 0) {
      console.log('DiscoverTab: Setting profiles from initialProfiles:', initialProfiles.length);
      setProfiles(initialProfiles);
      setCurrentIndex(initialIndex || 0);
      setNetworkError(false);
    }
  }, [initialProfiles, initialIndex]);
  
  // Set view start time when profile changes
  useEffect(() => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      setViewStartTime(Date.now());
    }
  }, [currentIndex, profiles]);
  
  // Load more profiles when running low
  useEffect(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length - 2 && hasMoreProfiles && !loadingMoreProfiles) {
      loadMoreProfiles();
    }
  }, [currentIndex, profiles.length, hasMoreProfiles, loadingMoreProfiles]);
  
  // Load more profiles when running low
  const loadMoreProfiles = async () => {
    if (loadingMoreProfiles || !hasMoreProfiles) return;
    
    setLoadingMoreProfiles(true);
    
    try {
      // In a real implementation, you'd add pagination parameters
      const moreProfiles = await gymbrosService.getRecommendedProfiles({
        ...filters,
        skip: profiles.length
      });
      
      if (moreProfiles.length > 0) {
        setProfiles(prev => [...prev, ...moreProfiles]);
        setHasMoreProfiles(moreProfiles.length >= 10);
      } else {
        setHasMoreProfiles(false);
      }
    } catch (error) {
      console.error('Error loading more profiles:', error);
    } finally {
      setLoadingMoreProfiles(false);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    try {
      // Clear existing profiles and fetch new ones
      setProfiles([]);
      setCurrentIndex(0);
      
      if (fetchProfiles && typeof fetchProfiles === 'function') {
        await fetchProfiles();
      }
      
      toast.success('Profiles refreshed');
    } catch (error) {
      console.error('Error refreshing profiles:', error);
      toast.error('Failed to refresh profiles');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh logic
  const handleTouchStart = (e) => {
    if (!containerRef.current) return;
    
    const touchY = e.touches[0].clientY;
    setPullStartY(touchY);
    
    // Only allow pull-down when at the top of the container
    if (containerRef.current.scrollTop === 0) {
      setIsPulling(true);
    }
  };
  
  const handleTouchMove = (e) => {
    if (!isPulling || !containerRef.current) return;
    
    const touchY = e.touches[0].clientY;
    const newPullDistance = Math.max(0, touchY - pullStartY);
    
    // Only allow pulling down to a certain distance with resistance
    const maxPullDistance = 200;
    const resistance = 0.4;
    
    const distance = Math.min(maxPullDistance, newPullDistance * resistance);
    setPullDistance(distance);
    
    if (containerRef.current.scrollTop === 0 && newPullDistance > 0) {
      e.preventDefault(); // Prevent scroll
    }
  };
  
  const handleTouchEnd = () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    // If pulled past threshold, trigger refresh
    const refreshThreshold = 80;
    if (pullDistance > refreshThreshold) {
      handleRefresh();
    }
    
    // Reset pull distance with animation
    setPullDistance(0);
  };
  
const handleSwipe = async (direction, profileId) => {
  if (!profiles.length || currentIndex >= profiles.length) {
    console.warn('DiscoverTab: No valid profile to swipe');
    return;
  }
  
  // Calculate view duration
  const viewDuration = Date.now() - viewStartTime;
  
  try {
    // Store the profile that's being swiped for potential undo
    const swipedProfile = profiles[currentIndex];
    
    // Immediately remove the profile from the local array to prevent re-showing
    const newProfiles = [...profiles];
    newProfiles.splice(currentIndex, 1);
    setProfiles(newProfiles);
    
    // Store last swiped for potential undo
    setLastSwiped({
      profile: swipedProfile,
      direction,
      index: currentIndex
    });
    
    if (direction === 'right') {
      // Handle like
      const response = await gymbrosService.likeProfile(profileId, viewDuration);
      
      // Provide vibration feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
      
      // Check if it's a match
      if (response.match) {
        // Set the matched profile for the modal
        setMatchedProfile(swipedProfile);
        // Show match modal
        setShowMatchModal(true);
      }
    } else if (direction === 'left') {
      // Handle dislike
      await gymbrosService.dislikeProfile(profileId, viewDuration);
    } else if (direction === 'super') {
      // Super like handling...
    }
    
    // No need to increment the current index since we removed the profile
    // The next profile is already at the current index
    
    // Load more profiles if we're running low
    if (newProfiles.length < 3 && hasMoreProfiles && !loadingMoreProfiles) {
      loadMoreProfiles();
    }
    
  } catch (error) {
    console.error(`Error handling ${direction} swipe:`, error);
    toast.error('Failed to process your action');
    
    // If there was an error, we might want to put the profile back
    // But this could lead to duplicate likes/dislikes if the API call
    // actually succeeded but had a response error
  }
};
  
  // Handle Rekindle (undo last swipe) - Premium feature
  const handleRekindle = () => {
    if (!lastSwiped) {
      toast.info('Nothing to undo');
      return;
    }
    
    if (!isPremium) {
      if (!isAuthenticated) {
        toast.error('Please log in to use the Rekindle feature');
        return;
      }
      
      if (pointsBalance < PREMIUM_FEATURES.REKINDLE) {
        toast('Not Enough Points', {
          description: `You need ${PREMIUM_FEATURES.REKINDLE} points to Rekindle`,
          icon: <Shield className="text-red-500" />
        });
        return;
      }
      
      // Deduct points for premium feature
      subtractPoints(PREMIUM_FEATURES.REKINDLE);
      updatePointsInBackend(-PREMIUM_FEATURES.REKINDLE);
    }
    
    // Insert the last swiped profile at the current index
    const newProfiles = [...profiles];
    newProfiles.splice(currentIndex, 0, lastSwiped.profile);
    setProfiles(newProfiles);
    
    // Reset the current index to show the inserted profile
    setCurrentIndex(prev => Math.max(0, prev - 1));
    
    // Clear the last swiped state
    setLastSwiped(null);
    
    toast.success('Profile recovered');
  };
  
  // Handle match modal actions
  const handleSendMessage = () => {
    // In a real implementation, navigate to messages with this user
    toast.success(`Starting conversation with ${matchedProfile?.name}`);
    setShowMatchModal(false);
  };
  
  const handleKeepSwiping = () => {
    setShowMatchModal(false);
  };
  
  // Render loading state
  if (loading && (!profiles || profiles.length === 0)) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center px-6">
        <div className="relative h-16 w-16 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <Loader size={64} className="text-blue-500" />
          </motion.div>
        </div>
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg font-medium text-gray-700"
        >
          Finding your perfect gym partner...
        </motion.p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
      </div>
    );
  }
  
  // Render network error state
  if (networkError) {
    return (
      <div className="h-full w-full">
        <EmptyStateMessage 
          type="networkError" 
          onRefresh={handleRefresh} 
        />
      </div>
    );
  }
  
  // Render empty state
  if (!profiles || profiles.length === 0) {
    return (
      <div className="h-full w-full">
        <EmptyStateMessage 
          type="noProfiles" 
          onRefresh={handleRefresh} 
          onFilterClick={() => setShowFilters(true)} 
        />
      </div>
    );
  }
  
  // Render end of profiles state
  if (currentIndex >= profiles.length) {
    return (
      <div className="h-full w-full">
        <EmptyStateMessage 
          message="You've seen all profiles"
          description="Check back later or try different filters"
          icon={<RefreshCw size={48} className="text-gray-400" />}
          actionLabel="Refresh"
          onRefresh={handleRefresh}
        />
      </div>
    );
  }
  
  // Main rendering
  return (
    <div 
      ref={containerRef}
      className="h-full w-full relative overflow-hidden"
      style={{ 
        transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {isPulling && pullDistance > 0 && (
        <div className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none">
          <div className="bg-white rounded-full p-2 shadow-md mt-2">
            <RefreshCw 
              size={20} 
              className="text-blue-500"
              style={{ 
                transform: `rotate(${pullDistance * 1.8}deg)`,
              }} 
            />
          </div>
        </div>
      )}

      {/* Profile cards stack - with proper height calculation */}
      <div className="relative w-full h-[calc(100%-120px)]">
        <AnimatePresence>
          {/* Show current and next few cards for better performance */}
          {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => {
            // Validate profile data before rendering
            if (!profile || !profile.name) {
              console.warn('DiscoverTab: Invalid profile data at index', currentIndex + index, profile);
              return null;
            }
            
            return (
              <div 
                key={`card-container-${profile._id || profile.id || index}`}
                className="absolute inset-0"
                style={{
                  transform: `translateY(${-index * 10}px) scale(${1 - index * 0.05})`,
                  zIndex: 30 - index
                }}
              >
                <SwipeableCard
                  key={`${profile._id || profile.id || index}-${currentIndex + index}`}
                  profile={profile}
                  onSwipe={handleSwipe}
                  onInfoClick={() => {
                    setShowProfileDetail(true);
                  }}
                  onSuperLike={(profileId) => handleSwipe('super', profileId)}
                  onRekindle={handleRekindle}
                  distanceUnit={distanceUnit}
                  isPremium={isPremium}
                  isActive={index === 0} // Only the top card is active
                  isBehindActive={index > 0} // Cards behind the active one
                />
              </div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Action buttons - Using exact order and positioning as requested */}
      <div className="absolute bottom-20 inset-x-4 flex items-center justify-center space-x-5 z-30">
        {/* Rekindle Button */}
        <button 
          onClick={handleRekindle}
          className={`p-3 rounded-full shadow-lg border-4 ${
            isPremium 
              ? 'text-purple-500 bg-purple-300 border-purple-500 hover:bg-purple-50' 
              : 'text-gray-400 bg-white border-gray-500'
          }`}
        >
          <RefreshCw size={18} />
        </button>

        {/* Dislike Button */}
        <button 
          onClick={() => profiles[currentIndex] && handleSwipe('left', profiles[currentIndex]._id)}
          className="p-4 rounded-full bg-red-200 shadow-lg border-4 border-red-500 text-white text- hover:bg-red-50"
        >
          <X size={32} />
        </button>
        
        {/* Super Like Button */}
        <button 
          onClick={() => profiles[currentIndex] && handleSwipe('super', profiles[currentIndex]._id)}
          className="p-3 rounded-full bg-amber-200 shadow-lg border-4 border-amber-500 text-white hover:bg-amber-50"
        >
          <Star size={29} />
        </button>
        
        {/* Like Button */}
        <button 
          onClick={() => profiles[currentIndex] && handleSwipe('right', profiles[currentIndex]._id)}
          className="p-4 rounded-full bg-green-200 shadow-lg border-4 border-green-500 text-white hover:bg-green-50"
        >
          <Heart size={32} />
        </button>

        <button 
          onClick={handleRekindle}
          className={`p-3 rounded-full shadow-lg border-4 ${
            isPremium 
              ? 'text-purple-500 bg-purple-300 border-purple-500 hover:bg-purple-50' 
              : 'text-gray-400 bg-white border-gray-500'
          }`}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      
      {/* Loading more indicator */}
      <AnimatePresence>
        {loadingMoreProfiles && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-36 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center shadow-md"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <Loader size={16} className="text-blue-500" />
            </motion.div>
            <span className="text-sm text-gray-600">Finding more gym partners...</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Refresh indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center shadow-md"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <Loader size={16} className="text-blue-500" />
            </motion.div>
            <span className="text-sm text-gray-600">Refreshing...</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Profile Detail Modal */}
      <ProfileDetailModal
    isVisible={showProfileDetail}
    profile={profiles[currentIndex]}
    userProfile={userProfile} // Pass the user's profile from props
    onClose={() => setShowProfileDetail(false)}
    onLike={() => {
      setShowProfileDetail(false);
      if (profiles[currentIndex]) {
        handleSwipe('right', profiles[currentIndex]._id);
      }
    }}
    onDislike={() => {
      setShowProfileDetail(false);
      if (profiles[currentIndex]) {
        handleSwipe('left', profiles[currentIndex]._id);
      }
    }}
    onSuperLike={() => {
      setShowProfileDetail(false);
      if (profiles[currentIndex]) {
        handleSwipe('super', profiles[currentIndex]._id);
      }
    }}
    isPremium={isPremium}
    distanceUnit={distanceUnit}
  />
      
      {/* Match Modal */}
      <MatchModal
        isVisible={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
        currentUser={null} // You'll need to pass the current user here
        matchedUser={matchedProfile}
      />
    </div>
  );
};

export default DiscoverTab;