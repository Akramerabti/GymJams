import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { X, Heart, ChevronLeft, ChevronRight, Info, MapPin, Clock, Award } from 'lucide-react';

const MatchCard = ({ 
  profile, 
  onSwipe, 
  currentImageIndex = 0, 
  setCurrentImageIndex,
  onInfoClick
}) => {
  const cardControls = useAnimation();
  const [dragStartX, setDragStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  
  // Base URL for images
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Handle drag start
  const handleDragStart = (event, info) => {
    setDragStartX(info.point.x);
    setIsDragging(true);
  };

  // Handle drag end - detect if it's a swipe and call onSwipe
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    const swipeThreshold = 100; // How far they need to swipe
    const dragDistance = info.point.x - dragStartX;
    
    // If distance is greater than threshold, treat as swipe
    if (Math.abs(dragDistance) > swipeThreshold) {
      const direction = dragDistance > 0 ? 'right' : 'left';
      setSwipeDirection(direction);
      
      // Animate the card off screen
      cardControls.start({
        x: direction === 'right' ? 1000 : -1000,
        opacity: 0,
        transition: { duration: 0.3 }
      }).then(() => {
        onSwipe(direction, profile._id);
        // Reset animation state
        cardControls.set({ x: 0, opacity: 1 });
        setSwipeDirection(null);
      });
    } else {
      // If not a swipe, return card to center
      cardControls.start({
        x: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 500, damping: 30 }
      });
    }
  };

  // Handle navigation between profile images
  const handleNextImage = (e) => {
    e.stopPropagation();
    if (profile.images && currentImageIndex < profile.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Calculate active status
  const getActiveStatus = () => {
    if (!profile.lastActive) return null;
    
    const lastActive = new Date(profile.lastActive);
    const now = new Date();
    const hoursDiff = (now - lastActive) / (1000 * 60 * 60);
    
    if (hoursDiff <= 1) return 'Active now';
    if (hoursDiff <= 5) return 'Recently active';
    return null;
  };
  
  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return "/api/placeholder/400/600";
  
    // If the image URL is already a full URL (e.g., http://localhost:5000/uploads/filename.jpg),
    // return it as-is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
  
    // If the image URL is a relative path (e.g., /uploads/filename.jpg),
    // prepend the base URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${imageUrl}`;
  };

  // Render progress indicator for images
  const renderProgressDots = () => {
    if (!profile.images || profile.images.length <= 1) return null;
    
    return (
      <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 px-2">
        {profile.images.map((_, index) => (
          <div 
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentImageIndex 
                ? 'bg-white w-6' 
                : 'bg-white/40 w-2'
            }`}
          />
        ))}
      </div>
    );
  };

  console.log('MatchCard rendering with image:', profile.images[currentImageIndex]);

  // Get correct image source
  const currentImage = profile.images && profile.images.length > 0 
    ? formatImageUrl(profile.images[currentImageIndex])
    : formatImageUrl(profile.profileImage);

  // Log profile for debugging
  console.log('MatchCard rendering with profile:', profile);
  console.log('Current image being shown:', currentImage);

  return (
    <motion.div
      className="absolute inset-0 touch-none select-none"
      animate={cardControls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ zIndex: 10 }}
    >
      <div className="relative h-full rounded-xl overflow-hidden shadow-xl bg-white">
        {/* Card Overlay when dragging */}
        {isDragging && (
          <div 
            className={`absolute inset-0 z-10 flex items-center justify-center rounded-xl border-4 ${
              swipeDirection === 'right' 
                ? 'border-green-500 bg-green-500/10' 
                : swipeDirection === 'left' 
                  ? 'border-red-500 bg-red-500/10' 
                  : 'border-transparent'
            }`}
          >
            {swipeDirection === 'right' && (
              <div className="rounded-full bg-white/80 p-3">
                <Heart size={50} className="text-green-500" />
              </div>
            )}
            {swipeDirection === 'left' && (
              <div className="rounded-full bg-white/80 p-3">
                <X size={50} className="text-red-500" />
              </div>
            )}
          </div>
        )}

        {/* Main Image */}
        <div className="relative h-full">
          <img 
            src={currentImage}
            alt={profile.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image load error:', e.target.src);
              console.log
              e.target.onerror = null;
              e.target.src = "/api/placeholder/400/600";
            }}
          />
          
          {/* Photo Navigation */}
          {renderProgressDots()}
          
          {profile.images && profile.images.length > 1 && (
            <>
              <button 
                onClick={handlePrevImage}
                className={`absolute top-1/2 left-2 transform -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-sm text-white ${
                  currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                }`}
                disabled={currentImageIndex === 0}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={handleNextImage}
                className={`absolute top-1/2 right-2 transform -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-sm text-white ${
                  currentImageIndex === profile.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                }`}
                disabled={currentImageIndex === profile.images.length - 1}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          
          {/* Info button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 transition-colors"
          >
            <Info size={20} />
          </button>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
          
          {/* Profile Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center">
              <h2 className="text-3xl font-bold mr-2">{profile.name?.split(' ')[0] || 'User'}</h2>
              <h3 className="text-2xl">{profile.age}</h3>
              {profile.verified && <div className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs">✓</div>}
            </div>
            
            {/* Active status */}
            {getActiveStatus() && (
              <div className="flex items-center mt-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                <span className="text-green-300 text-sm">{getActiveStatus()}</span>
              </div>
            )}
            
            <div className="flex items-center mt-1 mb-3">
              <MapPin size={16} className="mr-1" />
              <span>{profile.location?.distance || 0} miles away</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.workoutTypes?.slice(0, 3).map(type => (
                <span key={type} className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                  {type}
                </span>
              ))}
              {profile.workoutTypes?.length > 3 && (
                <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                  +{profile.workoutTypes.length - 3}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3 text-sm mb-2">
              <div className="flex items-center">
                <Award size={14} className="mr-1" />
                <span>{profile.experienceLevel || 'Any level'}</span>
              </div>
              
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                <span>{profile.preferredTime || 'Flexible'}</span>
              </div>
            </div>
            
            <p className="text-white/90 line-clamp-2 text-sm">
              {profile.bio || profile.goals || 'Looking for a workout partner'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchCard;