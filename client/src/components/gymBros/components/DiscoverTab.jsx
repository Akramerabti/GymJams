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
  initialProfiles = [],
  initialIndex = 0,
  userProfile = null,
  onNavigateToMatches
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
  const [forceSwipeDirection, setForceSwipeDirection] = useState(null);
  const [processingSwipe, setProcessingSwipe] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Track last processed profile ID to prevent duplicate swipes
  const lastProcessedProfileRef = useRef(null);
  
  // Container ref for pull-to-refresh
  const containerRef = useRef(null);

  // Initialize with initial profiles only once
  useEffect(() => {
    if (initialProfiles && Array.isArray(initialProfiles) && initialProfiles.length > 0) {
      console.log('DiscoverTab: Setting profiles from initialProfiles:', initialProfiles.length);
      setProfiles(initialProfiles);
      setCurrentIndex(initialIndex || 0);
      setNetworkError(false);
    }
  }, []); // Empty dependency array - only run on mount
  
  // Set view start time when profile changes
  useEffect(() => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      setViewStartTime(Date.now());
      // Also reset the last processed profile when current index changes
      lastProcessedProfileRef.current = null;
    }
  }, [currentIndex, profiles]);
  
  // Reset force direction after animation completes
  useEffect(() => {
    if (forceSwipeDirection) {
      const timer = setTimeout(() => {
        setForceSwipeDirection(null);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [forceSwipeDirection]);
  
  // Load more profiles when running low
  useEffect(() => {
    if (profiles.length > 0 && currentIndex >= profiles.length - 2 && hasMoreProfiles && !loadingMoreProfiles) {
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
  
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    try {
      // Clear existing profiles and fetch new ones
      setProfiles([]);
      setCurrentIndex(0);
      
      // Use the fetchProfiles prop which now points to fetchProfilesWithFilters
      if (fetchProfiles && typeof fetchProfiles === 'function') {
        // Pass the current filters
        await fetchProfiles(filters);
        toast.success('Profiles refreshed');
      } else {
        toast.error('Refresh function not available');
      }
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
  
  // Handle swipe gesture
  const handleSwipe = async (direction, profileId) => {
    // Skip if no valid profiles or already at the end
    if (!profiles.length || currentIndex >= profiles.length) {
      console.warn('DiscoverTab: No valid profile to swipe');
      return;
    }
    
    // Check if we're still processing a previous swipe
    if (processingSwipe) {
      console.log('DiscoverTab: Already processing a swipe, ignoring...');
      return;
    }
    
    // Check if we've already processed this profile
    const currentProfile = profiles[currentIndex];
    const currentProfileId = currentProfile._id || currentProfile.id;
    
    // Skip if we've already processed this profile - critical for preventing duplicates
    if (lastProcessedProfileRef.current === currentProfileId) {
      console.log('DiscoverTab: Already processed profile', currentProfileId);
      return;
    }
    
    // Mark that we're processing this profile
    lastProcessedProfileRef.current = currentProfileId;
    
    // Start swipe processing - important to set this BEFORE triggering animation
    setProcessingSwipe(true);
    
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
      setForceSwipeDirection(direction);
      
      // Handle like/dislike API calls
      let matchResult = false;
      
      if (direction === 'right') {
        // Handle like
        const response = await gymbrosService.likeProfile(profileId, viewDuration);
        console.log('Like response received:', response);
        
        // Check if it's a match
        matchResult = response.match === true;
        
        // Provide feedback
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      } else if (direction === 'left') {
        // Handle dislike
        await gymbrosService.dislikeProfile(profileId, viewDuration);
      } else if (direction === 'super') {
        // Handle super like
        if (!isAuthenticated) {
          toast.error('Please log in to use Superstar Likes');
          setProcessingSwipe(false);
          lastProcessedProfileRef.current = null; // Reset so we can try again
          return;
        }
        
        if (pointsBalance < PREMIUM_FEATURES.SUPERSTAR) {
          toast.error(`Not enough points for a Superstar Like (${PREMIUM_FEATURES.SUPERSTAR} points needed)`);
          setProcessingSwipe(false);
          lastProcessedProfileRef.current = null; // Reset so we can try again
          return;
        }
        
        // Deduct points for super like
        subtractPoints(PREMIUM_FEATURES.SUPERSTAR);
        updatePointsInBackend(-PREMIUM_FEATURES.SUPERSTAR);
        
        // Perform the like
        const response = await gymbrosService.likeProfile(profileId, viewDuration);
        
        // Check if it's a match
        matchResult = response.match === true;
        
        // Show success message
        if (!matchResult) {
          toast.success('Superstar Like sent!');
        }
      }
      
      // Handle match if one occurred
      if (matchResult) {
        console.log('MATCH DETECTED with profile:', currentProfile.name);
        
        // Store matched profile and show modal
        setMatchedProfile({...currentProfile});
        
        // Wait for animation to complete before showing match modal
        setTimeout(() => {
          setShowMatchModal(true);
          // Reset processing state to allow new swipes after match is shown
          setProcessingSwipe(false);
        }, 500);
        
        return;
      }
      
      // If no match, advance to next profile after animation completes
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        // Reset processing state to allow new swipes
        setProcessingSwipe(false);
        // Reset force direction to null
        setForceSwipeDirection(null);
      }, 500);
      
    } catch (error) {
      console.error(`Error handling ${direction} swipe:`, error);
      toast.error('Failed to process your action');
      // Reset states on error
      setProcessingSwipe(false);
      lastProcessedProfileRef.current = null;
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
  
  const handleSendMessage = () => {
    // Close the match modal
    setShowMatchModal(false);
    
    // Navigate to the matches tab using the callback
    if (onNavigateToMatches && typeof onNavigateToMatches === 'function') {
      onNavigateToMatches(matchedProfile);
    }
    
    // Now advance to next profile
    setCurrentIndex(prev => prev + 1);
  };
  
  const handleKeepSwiping = () => {
    console.log('Closing match modal and continuing to swipe');
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

      {/* Profile cards stack - with proper height calculation and FIXED KEYS */}
      <div className="relative w-full h-[calc(100%-120px)]">
        <AnimatePresence mode="wait">
          {/* Show current and next few cards for better performance */}
          {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => {
            // Validate profile data before rendering
            if (!profile || !profile.name) {
              console.warn('DiscoverTab: Invalid profile data at index', currentIndex + index, profile);
              return null;
            }
            
            // Create a truly unique key with all components
            const profileId = profile._id || profile.id || `profile-${index}`;
            const uniqueKey = `profile-${profileId}-position-${index}-global-${currentIndex}`;
            
            // Skip rendering if processingSwipe and not the current card
            if (processingSwipe && index > 0) return null;
            
            return (
              <div 
                key={`card-container-${uniqueKey}`}
                className="absolute inset-0"
                style={{
                  transform: `translateY(${-index * 10}px) scale(${1 - index * 0.05})`,
                  zIndex: 30 - index
                }}
              >
                <SwipeableCard
                  key={uniqueKey}
                  profile={profile}
                  onSwipe={handleSwipe}
                  onInfoClick={() => {
                    setShowProfileDetail(true);
                  }}
                  onSuperLike={() => handleSwipe('super', profileId)}
                  onRekindle={handleRekindle}
                  distanceUnit={distanceUnit}
                  isPremium={isPremium}
                  isActive={index === 0} // Only the top card is active
                  isBehindActive={index > 0} // Cards behind the active one
                  forceDirection={index === 0 ? forceSwipeDirection : null} // Only force direction on top card
                />
              </div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Action buttons */}
      <div className="absolute bottom-20 inset-x-4 flex items-center justify-center space-x-5 z-30">
        {/* Rekindle Button */}
        <button 
          onClick={handleRekindle}
          disabled={processingSwipe}
          className={`p-3 rounded-full shadow-lg border-4 ${
            isPremium 
              ? 'text-purple-500 bg-white border-purple-500 hover:bg-purple-50' 
              : 'text-gray-400 bg-white border-gray-300'
          } ${processingSwipe ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw size={18} />
        </button>

        {/* Dislike Button */}
        <button 
          onClick={() => handleButtonSwipe('left')}
          disabled={processingSwipe}
          className={`p-4 rounded-full bg-white shadow-lg border-4 border-red-500 text-red-500 hover:bg-red-50 ${
            processingSwipe ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <X size={32} />
        </button>
        
        {/* Super Like Button */}
        <button 
          onClick={() => handleButtonSwipe('up')}
          disabled={processingSwipe}
          className={`p-3 rounded-full bg-white shadow-lg border-4 border-blue-500 text-blue-500 hover:bg-blue-50 ${
            processingSwipe ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Star size={29} />
        </button>
        
        {/* Like Button */}
        <button 
          onClick={() => handleButtonSwipe('right')}
          disabled={processingSwipe}
          className={`p-4 rounded-full bg-white shadow-lg border-4 border-green-500 text-green-500 hover:bg-green-50 ${
            processingSwipe ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Heart size={32} />
        </button>

        {/* Extra button (or empty) */}
        <button 
          onClick={handleRekindle}
          disabled={processingSwipe}
          className={`p-3 rounded-full shadow-lg border-4 ${
            isPremium 
              ? 'text-purple-500 bg-white border-purple-500 hover:bg-purple-50' 
              : 'text-gray-400 bg-white border-gray-300'
          } ${processingSwipe ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            console.log("Manual close of match modal");
            setShowMatchModal(false);
            // Advance to next profile on close with a slight delay
            setTimeout(() => {
              setCurrentIndex(prev => prev + 1);
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