import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader, RefreshCw, Filter, Zap, Star, X, Heart, 
  ArrowUp, Info, Crown
} from 'lucide-react';
import SwipeableCard from './SwipeableCard';
import ProfileDetailModal from './DiscoverProfileDetails';
import MatchModal from './MatchModal';
import EmptyStateMessage from './EmptyStateMessage';
import gymbrosService from '../../../services/gymbros.service';
import { usePoints } from '../../../hooks/usePoints';
import useAuthStore from '../../../stores/authStore';
import { toast } from 'sonner';

const DiscoverTab = ({ 
  fetchProfiles,
  loading,
  filters,
  setShowFilters,
  distanceUnit = 'miles'
}) => {
  const { balance: pointsBalance, subtractPoints, updatePointsInBackend } = usePoints();
  const { isAuthenticated, user } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [viewStartTime, setViewStartTime] = useState(Date.now());
  const [loadingMoreProfiles, setLoadingMoreProfiles] = useState(false);
  const [hasMoreProfiles, setHasMoreProfiles] = useState(true);
  const [isPremium, setIsPremium] = useState(false); // Would be set based on user subscription
  const [lastSwiped, setLastSwiped] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Ref for the refresh pull gesture
  const pullToRefreshRef = useRef(null);
  const pullStartY = useRef(0);
  const refreshThreshold = 100; // pixels to pull down to trigger refresh
  
  // Set initial profiles and determine if user has premium
  useEffect(() => {
    // Check if user has premium subscription
    if (user && user.subscription && user.subscription.level === 'premium') {
      setIsPremium(true);
    }
    
    // Load initial profiles
    loadInitialProfiles();
  }, [user]);
  
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
  }, [currentIndex, profiles.length, hasMoreProfiles]);
  
  // Set up pull-to-refresh handler
  useEffect(() => {
    const container = pullToRefreshRef.current;
    if (!container) return;
    
    const handleTouchStart = (e) => {
      pullStartY.current = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e) => {
      const pullDistance = e.touches[0].clientY - pullStartY.current;
      
      // Only allow pull-down when at the top of the container
      if (container.scrollTop === 0 && pullDistance > 0) {
        // Prevent default to disable scrolling
        e.preventDefault();
        
        // Apply pull-down effect with resistance
        const resistance = 0.4;
        container.style.transform = `translateY(${pullDistance * resistance}px)`;
        
        // Show visual indicator when past threshold
        if (pullDistance > refreshThreshold) {
          // Show refresh indicator
        }
      }
    };
    
    const handleTouchEnd = (e) => {
      const element = pullToRefreshRef.current;
      const pullDistance = element ? parseInt(element.style.transform?.replace('translateY(', '').replace('px)', '') || '0', 10) : 0;
      
      // Reset position with animation
      element.style.transition = 'transform 0.3s ease';
      element.style.transform = 'translateY(0)';
      
      // Remove transition after animation completes
      setTimeout(() => {
        if (element) element.style.transition = '';
      }, 300);
      
      // If pulled past threshold, trigger refresh
      if (pullDistance > refreshThreshold) {
        handleRefresh();
      }
    };
    
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  // Load initial set of profiles
  const loadInitialProfiles = async () => {
    try {
      const fetchedProfiles = await gymbrosService.getRecommendedProfiles(filters);
      setProfiles(fetchedProfiles);
      setCurrentIndex(0);
      setHasMoreProfiles(fetchedProfiles.length >= 10); // Assume more if we got a full page
    } catch (error) {
      console.error('Error loading initial profiles:', error);
      toast.error('Failed to load profiles');
    }
  };
  
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
      await loadInitialProfiles();
      toast.success('Profiles refreshed');
    } catch (error) {
      console.error('Error refreshing profiles:', error);
      toast.error('Failed to refresh profiles');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle swipe gesture
  const handleSwipe = async (direction, profileId) => {
    // Calculate view duration
    const viewDuration = Date.now() - viewStartTime;
    
    try {
      // Store last swiped for potential undo
      setLastSwiped({
        profile: profiles[currentIndex],
        direction,
        index: currentIndex
      });
      
      if (direction === 'right' || direction === 'super') {
        // Handle like
        const response = await gymbrosService.likeProfile(profileId, viewDuration);
        
        // Provide vibration feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
        
        // Check if it's a match
        if (response.match) {
          // Set the matched profile for the modal
          setMatchedProfile(profiles[currentIndex]);
          // Show match modal
          setShowMatchModal(true);
        }
        
        // Handle super like (costs points)
        if (direction === 'super') {
          if (!isAuthenticated) {
            toast.error('Please log in to use Super Likes');
          } else if (pointsBalance < 20) {
            toast.error('Not enough points for a Super Like');
          } else {
            // Deduct points for super like
            subtractPoints(20);
            updatePointsInBackend(-20);
            toast.success('Super Like sent!');
          }
        }
      } else if (direction === 'left') {
        // Handle dislike
        await gymbrosService.dislikeProfile(profileId, viewDuration);
      }
      
      // Move to next profile
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error(`Error handling ${direction} swipe:`, error);
      toast.error('Failed to process your action');
    }
  };
  
  // Handle profile detail view
  const handleShowProfileDetail = () => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      setShowProfileDetail(true);
    }
  };
  
  // Handle match actions
  const handleSendMessage = () => {
    // In a real implementation, navigate to messages with this user
    toast.info(`Starting conversation with ${matchedProfile?.name}`);
    setShowMatchModal(false);
  };
  
  const handleKeepSwiping = () => {
    setShowMatchModal(false);
  };
  
  // Handle Rekindle (undo) - Premium feature
  const handleRekindle = () => {
    if (!isPremium) {
      toast('Premium Feature', {
        description: 'Upgrade to premium to undo swipes',
        icon: <Crown className="text-yellow-500" />
      });
      return;
    }
    
    if (!lastSwiped) {
      toast.info('Nothing to undo');
      return;
    }
    
    // Insert the last swiped profile at the current index
    const newProfiles = [...profiles];
    newProfiles.splice(currentIndex, 0, lastSwiped.profile);
    setProfiles(newProfiles);
    
    // Reset the current index to show the inserted profile
    setCurrentIndex(prev => prev - 1);
    
    // Clear the last swiped state
    setLastSwiped(null);
    
    toast.success('Profile recovered');
  };
  
  // Render loading state
  if (loading && profiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
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
  
  // Render empty state
  if (profiles.length === 0) {
    return (
      <EmptyStateMessage onRefresh={handleRefresh} onFilterClick={() => setShowFilters(true)} />
    );
  }
  
  // Render out of profiles state
  if (currentIndex >= profiles.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="bg-gray-100 rounded-full p-6 mb-6">
          <RefreshCw size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">You've seen all profiles</h3>
        <p className="text-gray-500 mb-8">Check back later or try different filters</p>
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
    <div ref={pullToRefreshRef} className="h-full relative overflow-hidden">
      {/* Profile cards stack */}
      <div className="relative h-full w-full">
        <AnimatePresence>
          {/* Show current and next few cards for better performance */}
          {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => (
            <SwipeableCard
              key={`${profile._id}-${index}`}
              profile={profile}
              onSwipe={handleSwipe}
              onInfoClick={handleShowProfileDetail}
              onSuper={(profileId) => handleSwipe('super', profileId)}
              onRekindle={handleRekindle}
              distanceUnit={distanceUnit}
              isPremium={isPremium}
              isActive={index === 0} // Only the top card is active
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Action buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
        {/* Rekindle (Undo) Button - Premium only */}
        <button 
          onClick={handleRekindle}
          className={`p-3 rounded-full bg-white shadow-lg border ${
            isPremium ? 'text-amber-500 border-amber-200 hover:bg-amber-50' : 'text-gray-400 border-gray-200'
          }`}
        >
          <RefreshCw size={28} />
        </button>
        
        {/* Dislike Button */}
        <button 
          onClick={() => profiles[currentIndex] && handleSwipe('left', profiles[currentIndex]._id)}
          className="p-4 rounded-full bg-white shadow-lg border border-red-200 text-red-500 hover:bg-red-50"
        >
          <X size={32} />
        </button>
        
        {/* Super Like Button */}
        <button 
          onClick={() => profiles[currentIndex] && handleSwipe('super', profiles[currentIndex]._id)}
          className="p-3 rounded-full bg-white shadow-lg border border-blue-200 text-blue-500 hover:bg-blue-50"
        >
          <Star size={28} />
        </button>
        
        {/* Like Button */}
        <button 
          onClick={() => profiles[currentIndex] && handleSwipe('right', profiles[currentIndex]._id)}
          className="p-4 rounded-full bg-white shadow-lg border border-green-200 text-green-500 hover:bg-green-50"
        >
          <Heart size={32} />
        </button>
      </div>
      
      {/* Info button (alternative way to open details) */}
      <button
        onClick={handleShowProfileDetail}
        className="absolute bottom-6 right-4 p-3 rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 hover:bg-gray-50 z-20"
      >
        <Info size={24} />
      </button>
      
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
      
      {/* Loading more indicator */}
      <AnimatePresence>
        {loadingMoreProfiles && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center shadow-md"
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
      
      {/* Profile Detail Modal */}
      <ProfileDetailModal
        isVisible={showProfileDetail}
        profile={profiles[currentIndex]}
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
        distanceUnit={distanceUnit}
      />
      
      {/* Match Modal */}
      <MatchModal
        isVisible={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        onSendMessage={handleSendMessage}
        onKeepSwiping={handleKeepSwiping}
        currentUser={user}
        matchedUser={matchedProfile}
      />
    </div>
  );
};

export default DiscoverTab;