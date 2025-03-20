import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { X, Heart, ChevronLeft, ChevronRight, Info, MapPin } from 'lucide-react';

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
        exit={{ opacity: 0, scale: 0.9 }}
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
              src={profile.images?.[currentImageIndex] || profile.profileImage || "/api/placeholder/400/600"} 
              alt={profile.name} 
              className="w-full h-full object-cover"
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
              <h2 className="text-3xl font-bold flex items-center">
                {profile.name}, {profile.age}
                {profile.verified && <div className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs">✓</div>}
              </h2>
              
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
              
              <p className="text-white/90 line-clamp-2 text-sm">
                {profile.bio || 'No bio provided'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

export default MatchCard;