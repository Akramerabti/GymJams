import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Loader, RefreshCw, Star, X, Heart, 
  Info, Shield
} from 'lucide-react';
import ProfileDetailModal from './ProfileDetailModal';
import MatchModal from './MatchModal';
import EmptyStateMessage from './EmptyStateMessage';
import SwipeableCard from './SwipeableCard';
import gymbrosService from '../../../services/gymbros.service';
import { usePoints } from '../../../hooks/usePoints';
import useAuthStore from '../../../stores/authStore';
import useApiOptimization from '../../../hooks/useApiOptimization';
import useRealtimeUpdates from '../../../hooks/useRealtimeUpdates';
import ActiveBoostNotification from './ActiveBoostNotification';
import useGymBrosData from '../../../hooks/useGymBrosData';

const PREMIUM_FEATURES = {
  REKINDLE: 30,
  SUPERSTAR: 20
};

const DiscoverTab = ({ 

  loading: externalLoading, 
  filters,
  setShowFilters,
  distanceUnit = 'miles',
  isPremium = false,
  initialProfiles = [], 
  initialIndex = 0,
  userProfile = null,
  onNavigateToMatches
}) => {
    const { 
    profiles: sharedProfiles, 
    loading: dataLoading, 
    fetchProfiles: fetchSharedProfiles,
    invalidate 
  } = useGymBrosData();
  const { balance: pointsBalance, subtractPoints, updatePointsInBackend } = usePoints();
  const { isAuthenticated, user } = useAuthStore();
  const { optimizedApiCall, debouncedApiCall, clearCache } = useApiOptimization();
  const { subscribeToNewMatches } = useRealtimeUpdates();
  
   const [profiles, setProfiles] = useState(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const loading = dataLoading.profiles || externalLoading;

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
  const [forceSwipeDirection, setForceSwipeDirection] = useState(null);
  const [processingSwipe, setProcessingSwipe] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Track last processed profile ID to prevent duplicate swipes
  const lastProcessedProfileRef = useRef(null);
  const swipeLockRef = useRef(false);
  
  // Container ref for pull-to-refresh
  const containerRef = useRef(null);
  
  // Get user ID for real-time updates
  const userId = user?.id || user?.user?.id;
  

  useEffect(() => {
    if (sharedProfiles.length > 0) {
      setProfiles(sharedProfiles);
      setCurrentIndex(0);
    } else if (initialProfiles.length > 0) {
      setProfiles(initialProfiles);
      setCurrentIndex(initialIndex);
    }
  }, [sharedProfiles, initialProfiles, initialIndex]);

  useEffect(() => {
    if (filters) {
      fetchSharedProfiles(filters);
    }
  }, [filters, fetchSharedProfiles]);

  useEffect(() => {
    if (initialProfiles && Array.isArray(initialProfiles) && initialProfiles.length > 0) {
      //('DiscoverTab: Setting profiles from initialProfiles:', initialProfiles.length);
      setProfiles(initialProfiles);
      setCurrentIndex(initialIndex || 0);
      setNetworkError(false);
    }
    
    // Subscribe to new matches to clear profile cache when needed
    let unsubscribeNewMatches;
    if (userId) {
      unsubscribeNewMatches = subscribeToNewMatches(userId, (newMatchData) => {
        //('New match in discover tab:', newMatchData);
        // Clear profiles cache to ensure fresh data
        clearCache('recommended-profiles');
      });
    }
    
    return () => {
      if (unsubscribeNewMatches) unsubscribeNewMatches();
    };
  }, [initialProfiles, initialIndex, userId, clearCache]); // Updated dependencies
  
  useEffect(() => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      setViewStartTime(Date.now());
      // Reset the last processed profile when current index changes
      lastProcessedProfileRef.current = null; // 🔴 Reset here
      swipeLockRef.current = false;
    }
  }, [currentIndex, profiles]);
  
  useEffect(() => {
    if (forceSwipeDirection) {
      const timer = setTimeout(() => {
        setForceSwipeDirection(null); // 🔴 Reset forceDirection
      }, 500);
  
      return () => clearTimeout(timer);
    }
  }, [forceSwipeDirection]);
  
  useEffect(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length && hasMoreProfiles && !loadingMoreProfiles) {
    
      loadMoreProfiles();
    }
  }, [currentIndex, profiles.length, hasMoreProfiles, loadingMoreProfiles]);

  // Smooth transition when reaching the end of profiles
  useEffect(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length && !isTransitioning) {
      // Set transitioning state to show a smooth transition to empty state
      setIsTransitioning(true);
      
      // Wait for card exit animation to complete before showing empty state
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [currentIndex, profiles.length, isTransitioning]);

  
   const loadMoreProfiles = async () => {
    if (loadingMoreProfiles || !hasMoreProfiles) return;

    setLoadingMoreProfiles(true);

    try {
      const moreProfiles = await fetchSharedProfiles({
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
      toast.error('Failed to load more profiles');
    } finally {
      setLoadingMoreProfiles(false);
    }
  };


    const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    try {

      setProfiles([]);
      setCurrentIndex(0);

      invalidate('profiles');

      await fetchSharedProfiles(filters, true); // force = true
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
    // Skip if no valid profiles or already at the end
    if (!profiles.length || currentIndex >= profiles.length) {
      console.warn('DiscoverTab: No valid profile to swipe');
      return;
    }
  
    // Use a ref for swipe locking to prevent race conditions
    if (swipeLockRef.current) {
      //('DiscoverTab: Swipe locked, ignoring this swipe');
      return;
    }
  
    // Immediately lock swiping to prevent duplicate swipes
    swipeLockRef.current = true;
  
    // Check if we've already processed this profile
    const currentProfile = profiles[currentIndex];
    const currentProfileId = currentProfile._id || currentProfile.id;
  
    // Skip if we've already processed this profile
    if (lastProcessedProfileRef.current === currentProfileId) {
      //('DiscoverTab: Already processed profile', currentProfileId);
      swipeLockRef.current = false; // Unlock the swipe
      return;
    }
  
    // Mark that we're processing this profile
    lastProcessedProfileRef.current = currentProfileId;
  
    // Calculate view duration
    const viewDuration = Date.now() - viewStartTime;
  
    try {
      // Store last swiped for potential undo
      setLastSwiped({
        profile: currentProfile,
        direction,
        index: currentIndex
      });
  
      // Set forceDirection - this triggers the card animation
      setForceSwipeDirection(direction);      // Handle like/dislike API calls with debouncing for rapid swipes
      let matchResult = false;

      if (direction === 'right') {
        // Handle like with debouncing to prevent rapid-fire requests
        const response = await debouncedApiCall(
          `like-profile-${profileId}-${Date.now()}`,
          () => gymbrosService.likeProfile(profileId, viewDuration),
          {
            debounceDelay: 200, // 200ms debounce for swipes
            minInterval: 500,   // Minimum 500ms between actual API calls
          }
        );
        //('Like response received:', response);

        // Check if it's a match
        matchResult = response.match === true;

        // Provide feedback
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      } else if (direction === 'left') {
        // Handle dislike with debouncing
        await debouncedApiCall(
          `dislike-profile-${profileId}-${Date.now()}`,
          () => gymbrosService.dislikeProfile(profileId, viewDuration),
          {
            debounceDelay: 200,
            minInterval: 500,
          }
        );
      } else if (direction === 'super') {
        // Handle super like
        if (!isAuthenticated) {
          toast.error('Please log in to use Superstar Likes');
          swipeLockRef.current = false;
          setProcessingSwipe(false);
          lastProcessedProfileRef.current = null; // Reset so we can try again
          return;
        }
  
        if (pointsBalance < PREMIUM_FEATURES.SUPERSTAR) {
          toast.error(`Not enough points for a Superstar Like (${PREMIUM_FEATURES.SUPERSTAR} points needed)`);
          swipeLockRef.current = false;
          setProcessingSwipe(false);
          lastProcessedProfileRef.current = null; // Reset so we can try again
          return;
        }
  
        // Deduct points for super like
        subtractPoints(PREMIUM_FEATURES.SUPERSTAR);
        updatePointsInBackend(-PREMIUM_FEATURES.SUPERSTAR);        // Perform the like with debouncing
        const response = await debouncedApiCall(
          `super-like-profile-${profileId}-${Date.now()}`,
          () => gymbrosService.likeProfile(profileId, viewDuration),
          {
            debounceDelay: 200,
            minInterval: 500,
          }
        );
  
        // Check if it's a match
        matchResult = response.match === true;
  
        // Show success message
        if (!matchResult) {
          toast.success('Superstar Like sent!');
        }
      }
  
       if (matchResult) {
        console.log('MATCH DETECTED with profile:', currentProfile.name);

        // Store matched profile and show modal
        setMatchedProfile({ ...currentProfile });

        // ADD: Invalidate caches after match
        invalidate('profiles');
        invalidate('matches');

        // Wait for animation to complete before showing match modal
        setTimeout(() => {
          setShowMatchModal(true);
          setProcessingSwipe(false);
          swipeLockRef.current = false;
        }, 500);

        return;
      }


      // If no match, advance to next profile after animation completes
      setTimeout(() => {
        setCurrentIndex(prevIndex => prevIndex + 1);
        // Reset processing state to allow new swipes
        setProcessingSwipe(false);
        swipeLockRef.current = false;
        // Reset force direction to null
        setForceSwipeDirection(null);
        // Reset last processed profile
        lastProcessedProfileRef.current = null; // 🔴 Reset here
      }, 500);
    } catch (error) {
      console.error(`Error handling ${direction} swipe:`, error);
      toast.error('Failed to process your action');
      // Reset states on error
      setProcessingSwipe(false);
      swipeLockRef.current = false;
      lastProcessedProfileRef.current = null; // 🔴 Reset here
      setForceSwipeDirection(null);
    }
  };

  
  // Handle button click for swipe actions
  const handleButtonSwipe = (direction) => {
    if (!profiles.length || currentIndex >= profiles.length || processingSwipe) {
      return;
    }
    
    // Get the current profile
    const currentProfile = profiles[currentIndex];
    const profileId = currentProfile._id || currentProfile.id;
    
    // Process the swipe directly
    handleSwipe(direction, profileId);
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
  
  // In DiscoverTab.jsx
const handleSendMessage = () => {
  // Close the match modal
  setShowMatchModal(false);
  
  // Navigate to the matches tab with the matched profile
  if (onNavigateToMatches && typeof onNavigateToMatches === 'function') {
    onNavigateToMatches(matchedProfile);
  }
  
  // Advance to next profile after a delay to allow for smooth transition
  setTimeout(() => {
    setCurrentIndex(prev => prev + 1);
    // Reset processing state to allow new swipes
    setProcessingSwipe(false);
    swipeLockRef.current = false;
  }, 500);
};
  
  const handleKeepSwiping = () => {
    //('Closing match modal and continuing to swipe');
    setShowMatchModal(false);
    
    // Advance to next profile with a small delay
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 100);
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
  
  if (currentIndex >= profiles.length && !hasMoreProfiles) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full"
      >
        <EmptyStateMessage 
          message="You've seen all profiles"
          description="Check back later or try different filters"
          icon={<RefreshCw size={48} className="text-gray-400" />}
          actionLabel="Refresh"
          onRefresh={handleRefresh}
        />
      </motion.div>
    );
  }
  
  // Render end of profiles state with smooth transition
  if (currentIndex >= profiles.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full"
      >
        <EmptyStateMessage 
          message="You've seen all profiles"
          description="Check back later or try different filters"
          icon={<RefreshCw size={48} className="text-gray-400" />}
          actionLabel="Refresh"
          onRefresh={handleRefresh}
        />
      </motion.div>
    );
  }
  
  // Get current profile
  const currentProfile = profiles[currentIndex];
  
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
      <ActiveBoostNotification />
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
      )}      {/* Profile cards stack */}
      <div className="absolute inset-x-4 top-4 bottom-40 flex items-center justify-center p-2">
        {/* Only render the current card to fix AnimatePresence issues */}
        {profiles[currentIndex] && (
          <div 
            key={`card-container-${currentProfile._id || currentProfile.id}`}
            className="w-full h-full flex items-center justify-center"
          >
            <SwipeableCard
              key={`card-${currentProfile._id || currentProfile.id}`}
              profile={currentProfile}
              onSwipe={handleSwipe}
              onInfoClick={() => {
                setShowProfileDetail(true);
              }}
              onSuperLike={() => handleSwipe('super', currentProfile._id || currentProfile.id)}
              onRekindle={handleRekindle}
              distanceUnit={distanceUnit}
              isPremium={isPremium}
              isActive={true}
              forceDirection={forceSwipeDirection}
            />
          </div>
        )}
      </div>
      
      {/* Premium Action Buttons */}
<div className="absolute bottom-24 inset-x-4 flex items-center justify-center space-x-5 z-30">
  
  {/* Rekindle Button */}
  <div className={`p-[3px] rounded-full ${isPremium ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} ${processingSwipe ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <button 
      onClick={handleRekindle}
      disabled={processingSwipe}
      className={`p-3 rounded-full ${isPremium ? 'bg-gradient-to-br from-purple-600 to-fuchsia-700' : 'bg-gradient-to-br from-gray-500 to-gray-600'} hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative`}
    >
      <RefreshCw 
        size={18} 
        className="text-white group-hover:rotate-180 transition-transform duration-300" 
        strokeWidth={2.5}
      />
      <span className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
    </button>
  </div>

  {/* Dislike Button */}
  <div className={`p-[3px] rounded-full bg-gradient-to-br from-rose-300 to-red-600 ${processingSwipe ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <button 
      onClick={() => handleButtonSwipe('left')}
      disabled={processingSwipe}
      className="p-4 rounded-full bg-gradient-to-br from-rose-600 to-red-700 hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative"
    >
      <X 
        size={32} 
        className="text-white group-hover:scale-110 transition-transform duration-300" 
        strokeWidth={3}
      />
      <span className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
    </button>
  </div>
  
  {/* Super Like Button */}
  <div className={`p-[3px] rounded-full bg-gradient-to-br from-sky-400 to-blue-600 ${processingSwipe ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <button 
      onClick={() => handleButtonSwipe('up')}
      disabled={processingSwipe}
      className="p-3 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative"
    >
      <Star 
        size={29} 
        className="text-white group-hover:scale-110 transition-transform duration-300" 
        strokeWidth={2.8}
        fill="url(#superlike-gradient)"
      />
      <svg width="0" height="0">
        <linearGradient id="superlike-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop stopColor="#7DD3FC" offset="0%" /> {/* sky-300 */}
          <stop stopColor="#60A5FA" offset="100%" /> {/* blue-400 */}
        </linearGradient>
      </svg>
      <span className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
    </button>
  </div>
  
  {/* Like Button */}
  <div className={`p-[3px] rounded-full bg-gradient-to-br to-emerald-200 from-green-600 ${processingSwipe ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <button 
      onClick={() => handleButtonSwipe('right')}
      disabled={processingSwipe}
      className="p-4 rounded-full bg-gradient-to-br from-emerald-500 to-green-700 hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative"
    >
      <Heart 
        size={32} 
        className="text-white group-hover:scale-110 transition-transform duration-300" 
        strokeWidth={3}
        fill="url(#like-gradient)"
      />
      <svg width="0" height="0">
        <linearGradient id="like-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop stopColor="#6EE7B7" offset="0%" /> {/* emerald-300 */}
          <stop stopColor="#34D399" offset="100%" /> {/* emerald-400 */}
        </linearGradient>
      </svg>
      <span className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
    </button>
  </div>

  {/* Extra Rekindle Button */}
  <div className={`p-[3px] rounded-full ${isPremium ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} ${processingSwipe ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <button 
      onClick={handleRekindle}
      disabled={processingSwipe}
      className={`p-3 rounded-full ${isPremium ? 'bg-gradient-to-br from-purple-600 to-fuchsia-700' : 'bg-gradient-to-br from-gray-500 to-gray-600'} hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative`}
    >
      <RefreshCw 
        size={18} 
        className="text-white group-hover:rotate-180 transition-transform duration-300" 
        strokeWidth={2.5}
      />
      <span className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300" />
    </button>
  </div>
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
            <span className="text-sm text-gray-600">Refreshing...</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Profile Detail Modal */}
      <ProfileDetailModal
        isVisible={showProfileDetail}
        profile={currentProfile}
        userProfile={userProfile}
        onClose={() => setShowProfileDetail(false)}
        onLike={() => {
          setShowProfileDetail(false);
          handleButtonSwipe('right');
        }}
        onDislike={() => {
          setShowProfileDetail(false);
          handleButtonSwipe('left');
        }}
        onSuperLike={() => {
          setShowProfileDetail(false);
          handleButtonSwipe('up');
        }}
        isPremium={isPremium}
        distanceUnit={distanceUnit}
      />
      
      {/* Match Modal */}
      {matchedProfile && (
        <MatchModal
          isVisible={showMatchModal}
          onClose={() => {
            //("Manual close of match modal");
            setShowMatchModal(false);
            // Advance to next profile on close with a slight delay
            setTimeout(() => {
              setCurrentIndex(prev => prev + 1);
              swipeLockRef.current = false;
            }, 300);
          }}
          onSendMessage={handleSendMessage}
          onKeepSwiping={handleKeepSwiping}
          currentUser={userProfile}
          matchedUser={matchedProfile}
        />
      )}
    </div>
  );
};

export default React.memo(DiscoverTab);