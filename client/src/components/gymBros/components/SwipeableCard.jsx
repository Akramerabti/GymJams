import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { 
  Heart, X, Star, ChevronLeft, ChevronRight, 
  Info, MapPin, Award, Dumbbell, Clock, RefreshCw
} from 'lucide-react';
import ActiveStatus from './ActiveStatus';

const SwipeableCard = ({ 
    profile, 
    onSwipe, 
    onInfoClick,
    onSuper,
    onRekindle,
    distanceUnit = 'miles',
    isActive = true,
    isPremium = false
  }) => {

    const isValidProfile = profile && 
    typeof profile === 'object' && 
    profile.name && 
    (profile._id || profile.id);

    if (!isValidProfile) {
        console.error('SwipeableCard received invalid profile:', profile);
        return null; // Don't render invalid profiles
      } else {
        console.log('SwipeableCard rendering profile:', profile.name, profile._id || profile.id);
      }

  // Motion values for swipe gestures
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const cardOpacity = useTransform(
    x, 
    [-300, -150, 0, 150, 300], 
    [0.5, 1, 1, 1, 0.5]
  );
  
  const controls = useAnimation();
  
  // State for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startDragPoint, setStartDragPoint] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [dragDistance, setDragDistance] = useState({ x: 0, y: 0 });
  const [showSuper, setShowSuper] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  
  // Track if we're moving horizontally or vertically
  const isDraggingHorizontal = useRef(false);
  const isDraggingVertical = useRef(false);
  
  // Track swipe thresholds
  const swipeThreshold = 100;
  const superSwipeThreshold = -100; // negative because up is negative in Y axis
  
  // Start vibration API reference
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  // Reset image index when profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoadError(false);
  }, [profile._id || profile.id]);
  
  // FIXED: Enhanced error handling for image URLs
  const formatImageUrl = (url) => {
    // Default fallback image
    const fallbackImage = "/api/placeholder/400/600";
    
    if (!url) {
      console.warn('SwipeableCard: Missing image URL, using fallback');
      return fallbackImage;
    }
    
    try {
      if (url.startsWith('blob:')) {
        return url;
      } else if (url.startsWith('http')) {
        return url;
      } else {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
      }
    } catch (error) {
      console.error('SwipeableCard: Error formatting image URL:', url, error);
      return fallbackImage;
    }
  };
  
  const getCurrentImage = () => {
    try {
      // Check if profile has images array with valid entries
      if (profile.images && Array.isArray(profile.images) && profile.images.length > 0) {
        // Ensure current index is valid
        const safeIndex = Math.min(currentImageIndex, profile.images.length - 1);
        return formatImageUrl(profile.images[safeIndex]);
      }
      
      // Fallback to profileImage if no images array or it's empty
      if (profile.profileImage) {
        return formatImageUrl(profile.profileImage);
      }
      
      // Last resort fallback
      console.warn('SwipeableCard: No valid images found for profile', profile.name);
      return "/api/placeholder/400/600";
    } catch (error) {
      console.error('SwipeableCard: Error getting current image:', error);
      return "/api/placeholder/400/600";
    }
  };
  
  const currentImage = getCurrentImage();
  
  // Handle carousel navigation
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
  
  // Handle drag start
  const handleDragStart = (event, info) => {
    setIsDragging(true);
    setStartDragPoint({ x: info.point.x, y: info.point.y });
    // Reset direction tracking at start of drag
    isDraggingHorizontal.current = false;
    isDraggingVertical.current = false;
  };
  
  // Handle drag move
  const handleDragUpdate = (event, info) => {
    // Calculate distance moved
    const xDist = info.point.x - startDragPoint.x;
    const yDist = info.point.y - startDragPoint.y;
    
    setDragDistance({ x: xDist, y: yDist });
    
    // Determine primary drag direction if it's not already set
    if (!isDraggingHorizontal.current && !isDraggingVertical.current) {
      if (Math.abs(xDist) > Math.abs(yDist) + 10) {
        isDraggingHorizontal.current = true;
      } else if (Math.abs(yDist) > Math.abs(xDist) + 10) {
        isDraggingVertical.current = true;
      }
    }
    
    // Show super like indicator when dragging up significantly
    if (yDist < superSwipeThreshold / 2) {
      setShowSuper(true);
    } else {
      setShowSuper(false);
    }
    
    // Set swipe direction indicators
    if (xDist > swipeThreshold / 2) {
      setSwipeDirection('right');
    } else if (xDist < -swipeThreshold / 2) {
      setSwipeDirection('left');
    } else if (yDist < superSwipeThreshold / 2) {
      setSwipeDirection('up');
    } else {
      setSwipeDirection(null);
    }
  };
  
  // Handle drag end
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    setShowSuper(false);
    
    const xDist = info.point.x - startDragPoint.x;
    const yDist = info.point.y - startDragPoint.y;
    
    // Determine if we should count as a swipe
    if (Math.abs(xDist) > swipeThreshold && isDraggingHorizontal.current) {
      // Horizontal swipe
      const direction = xDist > 0 ? 'right' : 'left';
      
      // Trigger vibration for tactile feedback
      vibrate();
      
      // Animate card off screen
      controls.start({
        x: direction === 'right' ? 1000 : -1000,
        opacity: 0,
        transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }
      }).then(() => {
        // Call swipe handler when animation is complete
        if (onSwipe) {
          onSwipe(direction, profile._id);
        }
      });
    } else if (yDist < superSwipeThreshold && isDraggingVertical.current) {
      // Upward swipe (super like)
      vibrate();
      
      // Animate card scaling up and fading out
      controls.start({
        y: -1000,
        scale: 0.8,
        opacity: 0,
        transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }
      }).then(() => {
        if (onSuper) {
          onSuper(profile._id);
        } else if (onSwipe) {
          // Fallback to normal like if no super handler
          onSwipe('super', profile._id);
        }
      });
    } else {
      // Return to center if not swiped far enough
      controls.start({
        x: 0,
        y: 0,
        transition: { 
          type: "spring", 
          stiffness: 500, 
          damping: 30 
        }
      });
    }
    
    // Reset state
    setSwipeDirection(null);
    setDragDistance({ x: 0, y: 0 });
  };

  // Determine whether to show info on first or second card
  const showBioOnSecondCard = currentImageIndex === 1;
  
  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{ 
        x, 
        y, 
        rotate,
        opacity: cardOpacity,
        zIndex: isActive ? 10 : 0
      }}
      drag={isActive}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDrag={handleDragUpdate}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ opacity: 0, scale: 0.8 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-full rounded-xl overflow-hidden shadow-xl bg-white">
        {/* Drag overlay indicators */}
        <AnimatePresence>
          {swipeDirection === 'right' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-4 border-green-500 bg-green-500/10"
            >
              <div className="p-6 bg-white/80 rounded-full shadow-2xl">
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
              <div className="p-6 bg-white/80 rounded-full shadow-2xl">
                <X size={64} className="text-red-500" />
              </div>
            </motion.div>
          )}
          
          {swipeDirection === 'up' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-4 border-blue-500 bg-blue-500/10"
            >
              <div className="p-6 bg-white/80 rounded-full shadow-2xl">
                <Star size={64} className="text-blue-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Super indicator */}
        <AnimatePresence>
          {showSuper && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="p-6 bg-white/80 rounded-full shadow-2xl">
                <Star size={64} className="text-yellow-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Image */}
        <div className="h-full">
          <img 
            src={currentImage}
            alt={profile.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error(`SwipeableCard: Image load error for ${currentImage}`);
              e.target.onerror = null;
              e.target.src = "/api/placeholder/400/600";
              setImageLoadError(true);
            }}
          />
          
          {/* Carousel navigation dots */}
          {profile.images && profile.images.length > 1 && (
            <div className="absolute top-3 left-0 right-0 flex justify-center space-x-1 px-4">
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
          
          {/* Carousel navigation buttons */}
          {profile.images && profile.images.length > 1 && (
            <>
              <button 
                onClick={goToPreviousImage}
                disabled={currentImageIndex === 0}
                className={`absolute top-1/2 left-2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white ${
                  currentImageIndex === 0 ? 'opacity-0' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ zIndex: 15 }}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={goToNextImage}
                disabled={currentImageIndex === profile.images.length - 1}
                className={`absolute top-1/2 right-2 transform -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white ${
                  currentImageIndex === profile.images.length - 1 ? 'opacity-0' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ zIndex: 15 }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          
          {/* Surface overlay gradient */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80"
          />
          
          {/* Info button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onInfoClick) onInfoClick(profile);
            }}
            className="absolute bottom-20 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/50 transition-colors z-20"
          >
            <Info size={24} />
          </button>
          
          {/* Rekindle button (premium) */}
          {isPremium && onRekindle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                vibrate();
                if (onRekindle) onRekindle(profile._id);
              }}
              className="absolute bottom-20 left-4 p-3 rounded-full bg-purple-500 text-white shadow-lg z-20"
            >
              <RefreshCw size={24} />
            </button>
          )}
          
          {/* Profile Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
            {/* Show main info on first card */}
            {currentImageIndex === 0 && (
              <>
                <div className="flex items-center mb-1">
                  <h2 className="text-3xl font-bold mr-2">{profile.name || 'Unknown'}</h2>
                  <h3 className="text-2xl">{profile.age || '?'}</h3>
                  {profile.verified && (
                    <div className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs">✓</div>
                  )}
                </div>
                
                {/* Active status */}
                {profile.lastActive && (
                  <ActiveStatus lastActive={profile.lastActive} />
                )}
                
                <div className="flex items-center mt-2 mb-3">
                  <MapPin size={16} className="mr-1" />
                  <span>{(profile.location?.distance || 0)} {distanceUnit}</span>
                </div>
              </>
            )}
            
            {/* Show bio on second card */}
            {showBioOnSecondCard && (
              <div className="space-y-3">
                <p className="text-lg font-medium">{profile.bio || "No bio available"}</p>
              </div>
            )}
            
            {/* Show workout info on subsequent cards */}
            {currentImageIndex > 1 && (
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
                    <Award size={14} className="mr-1" />
                    <span>{profile.experienceLevel || 'Any level'}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    <span>{profile.preferredTime || 'Flexible'}</span>
                  </div>
                </div>
                
                {profile.goals && (
                  <div className="mt-2">
                    <h4 className="text-sm opacity-80 mb-1">Goals:</h4>
                    <p className="text-sm">{profile.goals}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Match score indicator */}
            {profile.matchScore && (
              <div className="mt-3 flex items-center">
                <Dumbbell size={16} className="mr-1 text-blue-300" />
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
    </motion.div>
  );
};

export default SwipeableCard;