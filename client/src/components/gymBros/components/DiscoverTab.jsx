import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { 
  Loader, RefreshCw, Filter, Star, X, Heart, 
  ArrowUp, Info, Crown, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useSwipeable } from 'react-swipeable';
import ProfileDetailModal from './ProfileDetailModal';
import MatchModal from './MatchModal';
import EmptyStateMessage from './EmptyStateMessage';
import gymbrosService from '../../../services/gymbros.service';
import { usePoints } from '../../../hooks/usePoints';
import useAuthStore from '../../../stores/authStore';

// Premium feature costs
const PREMIUM_FEATURES = {
  REKINDLE: 30,
  SUPERSTAR: 20
};

const ProfileCard = ({ 
  profile, 
  isActive, 
  onSwipe, 
  onInfoClick, 
  onSuperLike, 
  onRekindle,
  isPremium,
  distanceUnit = 'miles',
  isBehindActive = false,
  isTopCard = false
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const cardRef = useRef(null);

  // Reset to first image when profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  }, [profile?._id]);

  // Format image URL
  const formatImageUrl = (url) => {
    if (!url) return "/api/placeholder/400/600";
    
    if (url.startsWith('blob:')) {
      return url;
    } else if (url.startsWith('http')) {
      return url;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
  };
  
  // Get current image to display
  const currentImage = profile.images && profile.images.length > 0 
    ? formatImageUrl(profile.images[currentImageIndex])
    : formatImageUrl(profile.profileImage);
  
  // Provide haptic feedback if available
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };
  
  // Handle swipe gestures
  const handlers = useSwipeable({
    onSwipeStart: (eventData) => {
      if (!isActive) return;
      setDragStart({ x: eventData.initial[0], y: eventData.initial[1] });
      setDragActive(true);
    },
    onSwiping: (eventData) => {
      if (!isActive) return;
      
      // Calculate offset from start position
      const offsetX = eventData.deltaX;
      const offsetY = eventData.deltaY;
      
      setDragOffset({ x: offsetX, y: offsetY });
      
      // Determine swipe direction for visual feedback
      const horizontalThreshold = 80;
      const verticalThreshold = 80;
      
      if (offsetX > horizontalThreshold) {
        setSwipeDirection('right');
      } else if (offsetX < -horizontalThreshold) {
        setSwipeDirection('left');
      } else if (offsetY < -verticalThreshold) {
        setSwipeDirection('up');
      } else {
        setSwipeDirection(null);
      }
    },
    onSwiped: (eventData) => {
      if (!isActive) return;
      
      // Check if swipe was strong enough to count
      const threshold = 100;
      
      if (eventData.absX > threshold && Math.abs(eventData.absX) > Math.abs(eventData.absY)) {
        // Horizontal swipe
        if (eventData.dir === 'Right') {
          handleSwipeComplete('right');
        } else if (eventData.dir === 'Left') {
          handleSwipeComplete('left');
        }
      } else if (eventData.absY > threshold && eventData.dir === 'Up') {
        // Upward swipe (super like)
        handleSwipeComplete('up');
      } else {
        // Not enough to trigger action, reset
        setDragOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
        setDragActive(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });
  
  // Handle completed swipe gesture
  const handleSwipeComplete = (direction) => {
    vibrate();
    
    // Animate card off screen based on direction
    if (direction === 'right') {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.5s ease';
        cardRef.current.style.transform = 'translateX(1000px) rotate(30deg)';
      }
      setTimeout(() => {
        if (onSwipe) onSwipe('right', profile._id);
      }, 300);
    } else if (direction === 'left') {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.5s ease';
        cardRef.current.style.transform = 'translateX(-1000px) rotate(-30deg)';
      }
      setTimeout(() => {
        if (onSwipe) onSwipe('left', profile._id);
      }, 300);
    } else if (direction === 'up') {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.5s ease';
        cardRef.current.style.transform = 'translateY(-1000px) scale(0.8)';
      }
      setTimeout(() => {
        if (onSuperLike) onSuperLike(profile._id);
      }, 300);
    }
    
    setDragActive(false);
  };
  
  // Handle manual button clicks
  const handleAction = (action) => {
    vibrate();
    
    if (action === 'like') {
      handleSwipeComplete('right');
    } else if (action === 'dislike') {
      handleSwipeComplete('left');
    } else if (action === 'superstar') {
      handleSwipeComplete('up');
    }
  };
  
  // Handle photo carousel navigation
  const goToNextImage = (e) => {
    if (e) e.stopPropagation();
    if (profile.images && currentImageIndex < profile.images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };
  
  const goToPreviousImage = (e) => {
    if (e) e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };
  
  // Calculate rotation and position based on drag
  const rotation = dragOffset.x * 0.1; // 0.1 degree rotation per pixel dragged
  const x = dragOffset.x;
  const y = dragOffset.y;
  
  // Skip rendering if profile is undefined
  if (!profile) return null;
  
  return (
    <div 
      className={`absolute inset-0 ${isActive ? 'z-10' : 'z-0'} touch-none`}
      ref={cardRef}
      {...handlers}
      style={{
        transform: isActive ? `translate(${x}px, ${y}px) rotate(${rotation}deg)` : 'none',
        transition: dragActive ? 'none' : 'transform 0.5s ease-out',
        opacity: isBehindActive ? 0.7 : 1,
        scale: isBehindActive ? 0.95 : 1,
        pointerEvents: isActive ? 'auto' : 'none'
      }}
    >
      <div className={`relative h-full rounded-xl overflow-hidden shadow-xl bg-white ${
        isBehindActive ? 'transform scale-95' : 'transform scale-100'
      }`}>
        {/* Swipe direction indicators */}
        <AnimatePresence>
          {swipeDirection === 'right' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-4 border-green-500 bg-green-500/10"
            >
              <div className="p-6 bg-white/80 rounded-full shadow-xl">
                <Heart size={64} className="text-green-500" />
              </div>
            </motion.div>
          )}
          
          {swipeDirection === 'left' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-4 border-red-500 bg-red-500/10"
            >
              <div className="p-6 bg-white/80 rounded-full shadow-xl">
                <X size={64} className="text-red-500" />
              </div>
            </motion.div>
          )}
          
          {swipeDirection === 'up' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-4 border-amber-500 bg-amber-500/10"
            >
              <div className="p-6 bg-white/80 rounded-full shadow-xl">
                <Star size={64} className="text-amber-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main image carousel */}
        <div className="h-full">
          <img 
            src={currentImage}
            alt={profile.name || 'Profile'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/api/placeholder/400/600";
            }}
          />
          
          {/* Carousel navigation buttons */}
          {isActive && profile.images && profile.images.length > 1 && (
            <>
              <button 
                onClick={goToPreviousImage}
                disabled={currentImageIndex === 0}
                className={`absolute top-1/2 left-3 transform -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white z-20 ${
                  currentImageIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={goToNextImage}
                disabled={currentImageIndex === profile.images.length - 1}
                className={`absolute top-1/2 right-3 transform -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white z-20 ${
                  currentImageIndex === profile.images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          
          {/* Carousel progress dots */}
          {profile.images && profile.images.length > 1 && (
            <div className="absolute top-3 left-0 right-0 flex justify-center space-x-1 z-20">
              {profile.images.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white w-6' : 'bg-white/40 w-2'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Gradient overlay for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
          
          {/* Info button */}
          {isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onInfoClick) onInfoClick(profile);
              }}
              className="absolute bottom-20 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors z-20"
            >
              <Info size={24} />
            </button>
          )}
          
          {/* Rekindle Premium Button */}
          {isActive && isPremium && onRekindle && isTopCard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                vibrate();
                if (onRekindle) onRekindle();
              }}
              className="absolute top-20 left-4 p-3 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white shadow-lg z-20"
            >
              <RefreshCw size={24} />
            </button>
          )}
          
          {/* Profile text content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10 pointer-events-none">
            {/* Show main info on first card */}
            {currentImageIndex === 0 && (
              <>
                <div className="flex items-center mb-1">
                  <h2 className="text-3xl font-bold mr-2">{profile.name}</h2>
                  <h3 className="text-2xl">{profile.age}</h3>
                  {profile.verified && (
                    <div className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs">✓</div>
                  )}
                </div>
                
                {/* Active status */}
                {profile.lastActive && (
                  <div className="mb-2">
                    {profile.lastActive && new Date(profile.lastActive) > new Date(Date.now() - 3600000) ? (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                        <span className="text-green-300 text-sm">Active now</span>
                      </div>
                    ) : profile.lastActive && new Date(profile.lastActive) > new Date(Date.now() - 5 * 3600000) ? (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                        <span className="text-green-300 text-sm">Recently active</span>
                      </div>
                    ) : null}
                  </div>
                )}
                
                <div className="flex items-center mt-2 mb-3">
                  <MapPin size={16} className="mr-1" />
                  <span>{profile.location?.distance || 0} {distanceUnit}</span>
                </div>
              </>
            )}
            
            {/* Show bio on second card */}
            {currentImageIndex === 1 && (
              <div className="space-y-3">
                <p className="text-lg font-medium">{profile.bio || "No bio available"}</p>
              </div>
            )}
            
            {/* Show workout info on third card */}
            {currentImageIndex === 2 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.workoutTypes?.slice(0, 3).map(type => (
                    <span key={type} className="bg-white/20 px-2 py-1 rounded-full text-sm backdrop-blur-sm">
                      {type}
                    </span>
                  ))}
                  {profile.workoutTypes?.length > 3 && (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm backdrop-blur-sm">
                      +{profile.workoutTypes.length - 3}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Experience:</span>
                    <span>{profile.experienceLevel || 'Any level'}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Time:</span>
                    <span>{profile.preferredTime || 'Flexible'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show goals on fourth card */}
            {currentImageIndex >= 3 && (
              <div className="mt-2">
                <h4 className="text-sm opacity-80 mb-1">Goals:</h4>
                <p className="text-sm">{profile.goals || "No goals specified"}</p>
              </div>
            )}
            
            {/* Match score indicator */}
            {profile.matchScore && (
              <div className="mt-3 flex items-center">
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${profile.matchScore}%` }}
                  />
                </div>
                <span className="ml-2 text-xs font-semibold">{Math.round(profile.matchScore)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DiscoverTab = ({ 
  fetchProfiles,
  loading,
  filters,
  setShowFilters,
  distanceUnit = 'miles',
  isPremium = false
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
  const [initialProfiles, setInitialProfiles] = useState(null);
  
  // Container ref for pull-to-refresh
  const containerRef = useRef(null);

  useEffect(() => {
    if (initialProfiles && Array.isArray(initialProfiles) && initialProfiles.length > 0) {
      console.log('DiscoverTab: Setting profiles from initialProfiles:', initialProfiles.length, 
        initialProfiles.map(p => p.name));
      // Force state update with spread operator to ensure React detects the change
      setProfiles([...initialProfiles]);
      setCurrentIndex(0); // Fixed: removed reference to initialIndex, using 0 instead
      setNetworkError(false); // Clear any network errors
    }
  }, [initialProfiles]);
  
  
  // Load initial profiles
  useEffect(() => {
    loadInitialProfiles();
  }, []);
  
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
  
  // Load initial set of profiles
  const loadInitialProfiles = async () => {
    try {
      setNetworkError(false);
      const fetchedProfiles = await gymbrosService.getRecommendedProfiles(filters);
      setProfiles(fetchedProfiles);
      setCurrentIndex(0);
      setHasMoreProfiles(fetchedProfiles.length >= 10); // Assume more if we got a full page
    } catch (error) {
      console.error('Error loading initial profiles:', error);
      setNetworkError(true);
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
    // Calculate view duration
    const viewDuration = Date.now() - viewStartTime;
    
    try {
      // Store last swiped for potential undo
      setLastSwiped({
        profile: profiles[currentIndex],
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
          setMatchedProfile(profiles[currentIndex]);
          // Show match modal
          setShowMatchModal(true);
        }
      } else if (direction === 'left') {
        // Handle dislike
        await gymbrosService.dislikeProfile(profileId, viewDuration);
      } else if (direction === 'super') {
        if (!isAuthenticated) {
          toast.error('Please log in to use Superstar Likes');
        } else if (pointsBalance < PREMIUM_FEATURES.SUPERSTAR) {
          toast.error(`Not enough points for a Superstar Like (${PREMIUM_FEATURES.SUPERSTAR} points needed)`);
        } else {
          // Deduct points for super like
          subtractPoints(PREMIUM_FEATURES.SUPERSTAR);
          updatePointsInBackend(-PREMIUM_FEATURES.SUPERSTAR);
          
          // Actually perform the like (implementation may vary)
          const response = await gymbrosService.likeProfile(profileId, viewDuration);
          
          // Check if it's a match
          if (response.match) {
            setMatchedProfile(profiles[currentIndex]);
            setShowMatchModal(true);
          }
          
          toast.success('Superstar Like sent!');
        }
      }
      
      // Move to next profile
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error(`Error handling ${direction} swipe:`, error);
      toast.error('Failed to process your action');
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
    setCurrentIndex(prev => prev - 1);
    
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
  
  if (loading && profiles.length === 0) {
    console.log('DiscoverTab: Rendering loading state');
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
  
  if (networkError) {
    console.log('DiscoverTab: Rendering network error state');
    return (
      <EmptyStateMessage 
        type="networkError" 
        onRefresh={handleRefresh} 
      />
    );
  }
  
  if (!Array.isArray(profiles) || profiles.length === 0) {
    console.log('DiscoverTab: Rendering empty state (no profiles)', 
      `initialProfiles: ${initialProfiles?.length || 0}, profiles: ${profiles?.length || 0}`);
    
    // If initialProfiles has content but profiles state doesn't, log the discrepancy
    if (initialProfiles && initialProfiles.length > 0) {
      console.warn('DiscoverTab: initialProfiles has content but profiles state is empty!', 
        'initialProfiles:', initialProfiles);
        
      // CRITICAL FIX: Use initialProfiles directly if available
      return (
        <div className="relative h-full w-full">
          <AnimatePresence>
            {initialProfiles.slice(0, 3).map((profile, index) => {
              if (!profile || !profile.name) {
                console.warn('DiscoverTab: Invalid profile data at index', index, profile);
                return null;
              }
              
              return (
                <SwipeableCard
                  key={`${profile._id || profile.id || index}-${index}`}
                  profile={profile}
                  onSwipe={handleSwipe}
                  onInfoClick={() => {
                    setShowProfileDetail(true);
                  }}
                  onSuperLike={(profileId) => handleSwipe('super', profileId)}
                  onRekindle={handleRekindle}
                  distanceUnit={distanceUnit}
                  isPremium={isPremium}
                  isActive={index === 0}
                  isBehindActive={index > 0}
                  isTopCard={index === 0}
                />
              );
            })}
          </AnimatePresence>
        </div>
      );
    }
    
    return (
      <EmptyStateMessage 
        type="noProfiles" 
        onRefresh={handleRefresh} 
        onFilterClick={() => setShowFilters(true)} 
      />
    );
  }
  
  if (currentIndex >= profiles.length) {
    console.log('DiscoverTab: Rendering end of profiles state');
    return (
      <EmptyStateMessage 
        message="You've seen all profiles"
        description="Check back later or try different filters"
        icon={<RefreshCw size={48} className="text-gray-400" />}
        actionLabel="Refresh"
        onRefresh={handleRefresh}
      />
    );
  }
  
  console.log('DiscoverTab: Rendering profile cards, currentIndex:', currentIndex, 
    'available profiles:', profiles.slice(currentIndex, currentIndex + 3).map(p => p.name));
  
    return (
      <div 
        ref={containerRef}
        className="h-full relative overflow-hidden"
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
      
      {/* Profile cards stack */}
      <div className="relative h-full w-full">
        <AnimatePresence>
          {/* Show current and next few cards for better performance */}
          {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => {
            // FIXED: Validate profile data before rendering
            if (!profile || !profile.name) {
              console.warn('DiscoverTab: Invalid profile data at index', currentIndex + index, profile);
              return null;
            }
            
            return (
              <SwipeableCard
                key={`${profile._id || profile.id || index}-${index}`}
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
                isTopCard={index === 0 && currentIndex === 0} // Very first card
              />
            );
          })}
        </AnimatePresence>
      </div>

      
      {/* Action buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
        {/* Rekindle Button */}
        <button 
          onClick={handleRekindle}
          className={`p-3 rounded-full bg-white shadow-lg border ${
            isPremium 
              ? 'text-purple-500 border-purple-200 hover:bg-purple-50' 
              : 'text-gray-400 border-gray-200'
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
          className="p-3 rounded-full bg-white shadow-lg border border-amber-200 text-amber-500 hover:bg-amber-50"
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
      
      {/* Filter button */}
      <button
        onClick={() => setShowFilters(true)}
        className="absolute bottom-6 left-4 p-3 rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 hover:bg-gray-50 z-20"
      >
        <Filter size={24} />
      </button>
      
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