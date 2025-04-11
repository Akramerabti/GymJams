import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, X, MapPin, Award, Clock, Target, Share2, Calendar, Info, Dumbbell } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

const EnhancedProfileCard = ({ profile, onLike, onDislike, onOpen, isActive, onNext, onPrevious }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [initialTouchY, setInitialTouchY] = useState(null);
  const [infoOffset, setInfoOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null);
  
  // Reset image index when profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setShowInfo(false);
    setIsExpanded(false);
  }, [profile]);

  // Handle when the user drags the profile card
  const handlers = useSwipeable({
    onSwiped: (eventData) => {
      if (eventData.dir === 'Left') {
        onDislike && onDislike();
      } else if (eventData.dir === 'Right') {
        onLike && onLike();
      } else if (eventData.dir === 'Up') {
        setShowInfo(true);
      } else if (eventData.dir === 'Down' && showInfo) {
        setShowInfo(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex < profile.images.length - 1) {
      setCurrentImageIndex(current => current + 1);
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(current => current - 1);
    }
  };

  const handleInfoTouch = (e) => {
    if (e.type === 'touchstart') {
      setInitialTouchY(e.touches[0].clientY);
    } else if (e.type === 'touchmove' && initialTouchY !== null) {
      const currentY = e.touches[0].clientY;
      const difference = currentY - initialTouchY;
      
      if (difference > 0) { // Dragging down
        setInfoOffset(difference > 200 ? 200 : difference);
      }
    } else if (e.type === 'touchend') {
      if (infoOffset > 100) {
        setShowInfo(false);
      }
      setInfoOffset(0);
      setInitialTouchY(null);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate progress dots for the image carousel
  const renderProgressDots = () => {
    return profile.images.map((_, index) => (
      <div 
        key={index}
        className={`h-1 rounded-full transition-all duration-300 ${
          index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-2'
        }`}
      />
    ));
  };

  return (
    <motion.div 
      className={`w-full max-w-md rounded-xl overflow-hidden shadow-xl ${isActive ? 'z-10' : 'z-0'}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: isActive ? 1 : 0.95, opacity: isActive ? 1 : 0 }}
      exit={{ x: Math.random() > 0.5 ? 500 : -500, opacity: 0 }}
      ref={cardRef}
      {...handlers}
      style={{ touchAction: 'none' }}
    >
      <div className="relative h-[70vh] bg-black">
        {/* Image Carousel */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black"
          >
            <img 
              src={profile.images[currentImageIndex] || profile.profileImage || "/api/placeholder/400/600"} 
              alt={profile.name} 
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Arrows */}
        {profile.images && profile.images.length > 1 && (
          <>
            <button 
              onClick={handlePrevImage}
              className={`absolute top-1/2 left-2 transform -translate-y-1/2 p-1 rounded-full bg-black/30 text-white ${
                currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
              }`}
              disabled={currentImageIndex === 0}
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={handleNextImage}
              className={`absolute top-1/2 right-2 transform -translate-y-1/2 p-1 rounded-full bg-black/30 text-white ${
                currentImageIndex === profile.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
              }`}
              disabled={currentImageIndex === profile.images.length - 1}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {/* Progress Dots */}
        <div className="absolute top-2 left-0 right-0 flex justify-center space-x-1">
          {profile.images && profile.images.length > 1 && renderProgressDots()}
        </div>
        
        {/* Swipe Instructions */}
        {isActive && (
          <div className="absolute top-4 right-4 bg-black/50 rounded-full p-2 text-white text-xs">
            <Info size={16} className="animate-pulse" />
          </div>
        )}
        
        {/* Basic Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 text-white">
          <h3 className="text-2xl font-bold flex items-center">
            {profile.name.split(' ')[0]}, {profile.age}
            {profile.verified && <span className="ml-2 text-blue-400">✓</span>}
          </h3>
          
          <div className="flex items-center mt-1">
            <MapPin size={16} className="mr-1" />
            <span className="text-sm">{profile.location.distance} miles away</span>
          </div>
          
          {/* Workout Types Tags */}
          <div className="mt-2 flex flex-wrap gap-2 mb-2">
            {profile.workoutTypes.slice(0, 3).map(type => (
              <span key={type} className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {type}
              </span>
            ))}
            {profile.workoutTypes.length > 3 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                +{profile.workoutTypes.length - 3}
              </span>
            )}
          </div>
          
          <p className="text-sm text-white/90 line-clamp-2 mt-1">{profile.bio}</p>
        </div>
      </div>
      
      {/* Detailed Info Panel (pulls up from bottom) */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            className="absolute inset-0 bg-white z-20 overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: infoOffset ? `${infoOffset}px` : 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onTouchStart={handleInfoTouch}
            onTouchMove={handleInfoTouch}
            onTouchEnd={handleInfoTouch}
          >
            <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">{profile.name}, {profile.age}</h3>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Image Thumbnails */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {profile.images?.map((image, index) => (
                  <div 
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setShowInfo(false);
                    }}
                  >
                    <img 
                      src={image} 
                      alt={`${profile.name} ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {/* Bio */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">About {profile.name}</h4>
                <p className={`text-gray-700 ${isExpanded ? '' : 'line-clamp-3'}`}>
                  {profile.bio}
                </p>
                {profile.bio?.length > 150 && (
                  <button 
                    onClick={toggleExpand}
                    className="text-blue-600 text-sm mt-1"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
              
              {/* Basic Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Basic Info</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <MapPin size={18} className="mr-2 text-gray-500" />
                    <p className="text-gray-700">
                      Lives in <span className="font-medium">{profile.location.address.split(',')[0]}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar size={18} className="mr-2 text-gray-500" />
                    <p className="text-gray-700">
                      <span className="font-medium">{profile.preferredTime}</span> workouts
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Workout Preferences */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Workout Preferences</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.workoutTypes.map(type => (
                    <span 
                      key={type} 
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Award size={18} className="mr-2 text-gray-500" />
                    <p className="text-gray-700">
                      <span className="font-medium">{profile.experienceLevel}</span> level
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <Target size={18} className="mr-2 text-gray-500" />
                    <p className="text-gray-700">
                      Goal: <span className="font-medium">{profile.goals || 'Not specified'}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(interest => (
                      <span 
                        key={interest} 
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-around">
              <button 
                onClick={() => { setShowInfo(false); onDislike && onDislike(); }}
                className="p-4 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100"
              >
                <X size={24} className="text-red-500" />
              </button>
              <button 
                onClick={() => { setShowInfo(false); onLike && onLike(); }}
                className="p-4 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100"
              >
                <Heart size={24} className="text-green-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Action buttons when not showing info */}
      {isActive && !showInfo && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center space-x-4">
          <button 
            onClick={onDislike}
            className="p-4 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100"
          >
            <X size={24} className="text-red-500" />
          </button>
          <button 
            onClick={onLike}
            className="p-4 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100"
          >
            <Heart size={24} className="text-green-500" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedProfileCard;