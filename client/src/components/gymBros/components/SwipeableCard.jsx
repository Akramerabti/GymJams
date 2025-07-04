import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { 
  Heart, X, Star, ChevronLeft, ChevronRight, 
  Plus, MapPin, Award, Dumbbell, Clock, RefreshCw
} from 'lucide-react';
import ActiveStatus from './ActiveStatus';
import { getFallbackAvatarUrl } from '../../../utils/imageUtils';

const SwipeableCard = ({ 
    profile, 
    onSwipe, 
    onInfoClick,
    onSuper,
    onRekindle,
    distanceUnit = 'miles',
    isActive = true,
    isPremium = false,
    isBehindActive = false,
    forceDirection = null 
  }) => {

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
    const controls = useAnimation();

    if (!profile || !profile.name || !(profile._id || profile.id)) {
      console.error('SwipeableCard received invalid profile:', profile);
      return null;
    }

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [startDragPoint, setStartDragPoint] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [dragDistance, setDragDistance] = useState({ x: 0, y: 0 });
    const [showSuper, setShowSuper] = useState(false);
    
    const isDraggingHorizontal = useRef(false);
    const isDraggingVertical = useRef(false);
    
    // Track swipe thresholds
    const swipeThreshold = 100;
    const superSwipeThreshold = -100; // negative because up is negative in Y axis

    // Run entrance animation when profile changes
    useEffect(() => {
      // Reset card state when profile changes
      setCurrentImageIndex(0);
      setSwipeDirection(null);
      setDragDistance({ x: 0, y: 0 });
      
      // CRITICAL FIX: Always start visible and positioned correctly
      controls.set({
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotate: 0
      });
    }, [profile._id || profile.id, controls]);

    useEffect(() => {
  if (forceDirection && isActive) {
    //(`Forcing swipe direction: ${forceDirection}`);
    
    let xDestination = 0;
    let yDestination = 0;
    
    if (forceDirection === 'right') {
      xDestination = 1000;
      setSwipeDirection('right');
    } else if (forceDirection === 'left') {
      xDestination = -1000;
      setSwipeDirection('left');
    } else if (forceDirection === 'up') {
      yDestination = -1000;
      setSwipeDirection('up');
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
    
    controls.start({
      x: xDestination,
      y: yDestination,
      opacity: forceDirection === 'up' ? 0 : 1,
      scale: forceDirection === 'up' ? 0.8 : 1,
      transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }
    }).then(() => {
      // Remove the onSwipe call here to prevent duplicate handling
    });
  }
}, [forceDirection, isActive, profile, controls]); // Remove onSwipe from dependencies
  
    // Provide haptic feedback if available
    const vibrate = () => {
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    };    // Enhanced error handling for image URLs
    const formatImageUrl = (url) => {      // Default fallback image from public directory
      const fallbackImage = getFallbackAvatarUrl();
      
      if (!url) {
        return fallbackImage;
      }
      
      try {
        if (url.startsWith('blob:')) {
          return url;
        } else if (url.startsWith('http')) {
          return url;
        } else {
          // For legacy local files, construct the full URL
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
        }
      } catch (error) {
        console.error('Error formatting image URL:', error);
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
        }        // Last resort fallback
        return getFallbackAvatarUrl();
      } catch (error) {
        console.error('Error getting current image:', error);
        return getFallbackAvatarUrl();
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
          // 🔴 Call swipe handler only if not triggered by forceDirection
          if (!forceDirection && onSwipe) {
            onSwipe(direction, profile._id || profile.id);
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
          // 🔴 Call swipe handler only if not triggered by forceDirection
          if (!forceDirection && onSwipe) {
            onSwipe('super', profile._id || profile.id);
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
    };    return (
      <motion.div
        className="w-full h-full flex items-center justify-center" // Center the card and take full container size
        style={{ 
          zIndex: isActive ? 30 : isBehindActive ? 20 : 10,
          pointerEvents: isActive ? 'auto' : 'none'
        }}
        animate={controls}
        initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        drag={isActive && !forceDirection}  // Disable drag during forced animation
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragStart={handleDragStart}
        onDrag={handleDragUpdate}
        onDragEnd={handleDragEnd}
      >        <div 
          className="relative rounded-xl overflow-hidden shadow-xl bg-white"
          style={{
            aspectRatio: "0.7", // 7:10 aspect ratio (7/10 = 0.7)
            width: "auto",
            height: "100%", // Take full height, let width be calculated by aspect ratio
            maxWidth: "100%", // Don't exceed container width
            maxHeight: "100%", // Don't exceed container height
            transform: isBehindActive ? 'scale(0.95) translateY(10px)' : 'scale(1)',
            opacity: isBehindActive ? 0.7 : 1,
            transition: 'transform 0.3s, opacity 0.3s'
          }}
        >
          {/* Drag overlay indicators */}
          <AnimatePresence>
            {swipeDirection === 'right' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-4 border-green-500 bg-green-500/10"
              >
                <div className="p-6 bg-white/80 rounded-full shadow-2xl overflow-visible">
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
          <div className="absolute inset-0">
            <img 
              src={currentImage}
              alt={profile.name} 
              className="w-full h-full object-cover"              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getFallbackAvatarUrl();
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
            
            {/* Gradient Border Button */}
            <div className="absolute top-3 right-3 p-[4px] rounded-full bg-gradient-to-br from-orange-500 via-amber-300 to-yellow-300 shadow-lg z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onInfoClick) onInfoClick(profile);
                }}
                className="p-5 rounded-full bg-gradient-to-br from-blue-500/90 via-blue-700 to-purple-600/90 backdrop-blur-[2px] hover:shadow-inner transition-all duration-300 group flex items-center justify-center relative"
              >
                <Plus 
                  size={28} 
                  className="text-orange-300 group-hover:rotate-90 group-hover:scale-110 transition-all duration-300 absolute" 
                  strokeWidth={3}
                />

                {/* Subtle glow effect */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10 transition-all duration-300" />
              </button>
            </div>
            
            {/* Profile Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
              {/* Show main info on first card */}
              {currentImageIndex === 0 && (
                <>
                  <div className="flex items-center mb-1">
                    <h2 className="text-2xl font-bold mr-2">{profile.name.split(' ')[0]|| 'Unknown'}</h2>
                    <h3 className="text-xl">{profile.age || '?'}</h3>
                    {profile.verified && (
                      <div className="ml-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs">✓</div>
                    )}
                  </div>
                  
                  {/* Active status */}
                  {profile.lastActive && (
                    <ActiveStatus lastActive={profile.lastActive} />
                  )}
                  
                  <div className="flex items-center mt-1">
                    <MapPin size={14} className="mr-1" />
                    <span className="text-sm">{(profile.location?.distance || 0)} {distanceUnit}</span>
                  </div>
                </>
              )}
              
              {/* Show bio on second card */}
              {currentImageIndex === 1 && (
                <div className="space-y-2">
                  <p className="text-base font-medium line-clamp-4">{profile.bio || "No bio available"}</p>
                </div>
              )}
              
              {/* Show workout info on subsequent cards */}
              {currentImageIndex > 1 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {profile.workoutTypes?.slice(0, 3).map(type => (
                      <span key={type} className="bg-white/20 px-2 py-0.5 rounded-full text-xs backdrop-blur-sm">
                        {type}
                      </span>
                    ))}
                    {profile.workoutTypes?.length > 3 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs backdrop-blur-sm">
                        +{profile.workoutTypes.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center">
                      <Award size={12} className="mr-1" />
                      <span>{profile.experienceLevel || 'Any level'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      <span>{profile.preferredTime || 'Flexible'}</span>
                    </div>
                  </div>
                  
                  {profile.goals && (
                    <div className="mt-1">
                      <h4 className="text-xs opacity-80">Goals:</h4>
                      <p className="text-xs line-clamp-2">{profile.goals}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Match score indicator */}
              {profile.matchScore && (
                <div className="mt-2 flex items-center">
                  <Dumbbell size={12} className="mr-1 text-blue-300" />
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-visible">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
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