import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Share2, ChevronLeft, ChevronRight, MapPin, Award, 
  Calendar, Clock, Target, Activity, Heart, X, MessageCircle,
  Users, Dumbbell, Camera, Info, Briefcase, GraduationCap,
  Coffee, Star, Lock, Check, Music, Film
} from 'lucide-react';
import ActiveStatus from './ActiveStatus';
import { toast } from 'sonner';
import { calculateCompatibility } from '../../../utils/calculateTrend';

const ProfileDetailModal = ({ 
  profile, 
  isVisible, 
  onClose, 
  onLike, 
  onDislike, 
  onSuperLike,
  isMatch = false,
  isPremium = false,
  distanceUnit = 'miles',
  userProfile,
  fullScreen = false // New prop to control full screen vs overlay
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const [animateDirection, setAnimateDirection] = useState('right');
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
    // Reset image index when profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setActiveTab('about');
  }, [profile?._id]);

  const compatibilityScores = useMemo(() => {
    if (!userProfile || !profile) return {};
    return calculateCompatibility(userProfile, profile);
  }, [userProfile, profile]);

  if (!profile) return null;
    // Format image URL
  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return "/fallback.svg";
    
    if (imageUrl.startsWith('blob:')) {
      return imageUrl;
    } else if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
    }
  };
  
  // Get current image
  const currentImage = profile.images && profile.images.length > 0 
    ? formatImageUrl(profile.images[currentImageIndex])
    : formatImageUrl(profile.profileImage);
  
  // Handle sharing profile
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/gymbros/profile/${profile._id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Check out ${profile.name}'s GymBros profile`,
        text: `Connect with ${profile.name} on GymBros!`,
        url: shareUrl,
      })
      .catch(() => {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(shareUrl)
          .then(() => toast.success('Profile link copied to clipboard'))
          .catch(() => toast.error('Failed to copy link'));
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => toast.success('Profile link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };
  
  // Handle tab change with animation direction
  const changeTab = (newTab) => {
    // Set animation direction based on tab order
    const tabOrder = ['about', 'compatibility'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab);
    
    setAnimateDirection(newIndex > currentIndex ? 'right' : 'left');
    setActiveTab(newTab);
  };
  
  // Tab content animations
  const tabVariants = {
    enter: (direction) => ({
      x: direction === 'right' ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction === 'right' ? -300 : 300,
      opacity: 0
    })
  };
  
  // Tab Buttons
  const TabButton = ({ tab, label, icon, current }) => (
    <button
      onClick={() => changeTab(tab)}
      className={`flex flex-col items-center py-2 px-3 ${
        current === tab 
          ? 'text-blue-600 border-b-2 border-blue-600' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
  
  // About Tab Content
  const AboutTabContent = () => (
    <div className="p-5">
      <h3 className="text-lg font-semibold mb-3">About {profile.name}</h3>
      <p className="text-gray-700 mb-6">
        {profile.bio || "No bio provided"}
      </p>
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
          <Info size={16} className="mr-1 text-blue-500" />
          Basic Info
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <MapPin size={18} className="mr-2 text-blue-500" />
            <span className="text-gray-700">
              {profile.location?.address?.split(',')[1] || 'Location not specified'}
            </span>
          </div>
          <div className="flex items-center">
            <Users size={18} className="mr-2 text-blue-500" />
            <span className="text-gray-700">{profile.gender || 'Gender not specified'}</span>
          </div>
          <div className="flex items-center">
            <Activity size={18} className="mr-2 text-blue-500" />
            <span className="text-gray-700">
              {profile.height ? `${profile.height} ${profile.heightUnit || 'cm'}` : 'Height not specified'}
            </span>
          </div>
          
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
          <Dumbbell size={16} className="mr-1 text-blue-500" />
          Workout Preferences
        </h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.workoutTypes && profile.workoutTypes.length > 0 ? (
            profile.workoutTypes.map((type, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {type}
              </span>
            ))
          ) : (
            <span className="text-gray-500">No workout preferences specified</span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Award size={18} className="mr-2 text-blue-500" />
            <span className="text-gray-700">
              {profile.experienceLevel || 'Experience not specified'}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar size={18} className="mr-2 text-blue-500" />
            <span className="text-gray-700">
              {profile.preferredTime || 'Schedule not specified'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
          <Target size={16} className="mr-1 text-blue-500" />
          Goals
        </h4>
        <p className="text-gray-700">
          {profile.goals || 'No goals specified'}
        </p>
      </div>
      
      {/* Additional personal info */}
      {(profile.work || profile.studies) && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center">
            <Briefcase size={16} className="mr-1 text-blue-500" />
            Work & Education
          </h4>
          {profile.work && (
            <div className="flex items-center mb-2">
              <Briefcase size={16} className="mr-2 text-blue-500" />
              <span className="text-gray-700">{profile.work}</span>
            </div>
          )}
          {profile.studies && (
            <div className="flex items-center">
              <GraduationCap size={16} className="mr-2 text-blue-500" />
              <span className="text-gray-700">{profile.studies}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Religious/political views */}
      {(profile.religion || profile.politicalStance || profile.sexualOrientation) && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">Personal</h4>
          {profile.religion && (
            <div className="flex items-start mb-2">
              <span className="font-medium text-gray-600 mr-2">Religion:</span>
              <span className="text-gray-700">{profile.religion}</span>
            </div>
          )}
          {profile.politicalStance && (
            <div className="flex items-start mb-2">
              <span className="font-medium text-gray-600 mr-2">Political Views:</span>
              <span className="text-gray-700">{profile.politicalStance}</span>
            </div>
          )}
          {profile.sexualOrientation && (
            <div className="flex items-start">
              <span className="font-medium text-gray-600 mr-2">Sexual Orientation:</span>
              <span className="text-gray-700">{profile.sexualOrientation}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Interests section */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center">
            <Activity size={16} className="mr-1 text-blue-500" />
            Interests
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  // Photos Tab Content  
const CompatibilityTabContent = () => (
  <div className="p-5">
    <h3 className="text-lg font-semibold mb-3">Match Compatibility</h3>
    
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-700">Overall Match Score</span>
        <span className="font-semibold text-blue-700">
          {compatibilityScores.overallScore || 0}%
        </span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${compatibilityScores.overallScore || 0}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600">
        Based on workout preferences, schedule, and experience level
      </p>
    </div>
    
    <div className="space-y-5">
      {/* Workout Compatibility */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-700 flex items-center">
            <Dumbbell size={16} className="mr-1 text-blue-500" />
            Workout Compatibility
          </h4>
          <span className="text-sm font-semibold text-blue-600">
            {compatibilityScores.workoutCompatibility || 'N/A'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          You share {compatibilityScores.commonWorkouts || 0} workout types
        </p>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full" 
            style={{ width: `${compatibilityScores.workoutCompatibilityScore || 0}%` }}
          ></div>
        </div>
      </div>
      
      {/* Schedule Compatibility */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-700 flex items-center">
            <Calendar size={16} className="mr-1 text-blue-500" />
            Schedule Compatibility
          </h4>
          <span className="text-sm font-semibold text-blue-600">
            {compatibilityScores.scheduleCompatibility || 'N/A'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {profile.preferredTime === 'Flexible' ? 
            'Their flexible schedule matches your availability' : 
            `They prefer to workout in the ${profile.preferredTime.toLowerCase()}`
          }
        </p>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full" 
            style={{ width: `${compatibilityScores.scheduleCompatibilityScore || 0}%` }}
          ></div>
        </div>
      </div>
      
      {/* Experience Compatibility */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-700 flex items-center">
            <Award size={16} className="mr-1 text-blue-500" />
            Experience Compatibility
          </h4>
          <span className="text-sm font-semibold text-blue-600">
            {compatibilityScores.experienceCompatibility || 'N/A'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {profile.experienceLevel === 'Any' ? 
            'Compatible with any experience level' : 
            `${profile.experienceLevel} level ${userProfile?.experienceLevel ? 'matches' : 'may match'} your preference`
          }
        </p>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full" 
            style={{ width: `${compatibilityScores.experienceCompatibilityScore || 0}%` }}
          ></div>
        </div>
      </div>
      
      {/* Location */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-700 flex items-center">
            <MapPin size={16} className="mr-1 text-blue-500" />
            Location
          </h4>
          <span className="text-sm font-semibold text-blue-600">
            {compatibilityScores.locationCompatibility || 'N/A'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {profile.location?.distance || 0} {distanceUnit} away from you
        </p>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full" 
            style={{ width: `${compatibilityScores.locationScore || 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  </div>
);

  // Fullscreen Image Modal
  const ImageFullscreenModal = () => (
    <AnimatePresence>
      {isImageFullscreen && (        <motion.div 
          className="fixed inset-0 z-[10001] bg-black flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsImageFullscreen(false)}
        >
          <div className="absolute top-4 left-4 p-[3px] rounded-full bg-gradient-to-br from-gray-400 via-gray-300 to-gray-100 shadow-lg z-20">
            <button 
              onClick={() => setIsImageFullscreen(false)}
              className="p-3 rounded-full bg-gradient-to-br from-gray-700/90 via-gray-800 to-gray-900/90 backdrop-blur-[2px] hover:shadow-inner transition-all duration-300 group flex items-center justify-center relative"
            >
              <ArrowLeft 
                size={24} 
                className="text-gray-100  group-hover:scale-110 transition-all duration-300 absolute" 
                strokeWidth={2.5}
              />
              
              {/* Subtle glow effect */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10 transition-all duration-300" />
            </button>
          </div>
          
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              className="p-2 rounded-full bg-black/50 text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
            >
              <Share2 size={20} />
            </button>
          </div>
          
          <div className="w-full h-full relative">
            <img 
              src={currentImage}
              alt={`${profile.name}'s photo`}
              className="w-full h-full object-contain"
            />
            
            {/* Image navigation */}
            {profile.images && profile.images.length > 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentImageIndex > 0) {
                      setCurrentImageIndex(currentImageIndex - 1);
                    }
                  }}
                  className={`absolute top-1/2 left-4 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white ${
                    currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                  }`}
                  disabled={currentImageIndex === 0}
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentImageIndex < profile.images.length - 1) {
                      setCurrentImageIndex(currentImageIndex + 1);
                    }
                  }}
                  className={`absolute top-1/2 right-4 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white ${
                    currentImageIndex === profile.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                  }`}
                  disabled={currentImageIndex === profile.images.length - 1}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {profile.images?.length || 1}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={fullScreen ? "fixed inset-0 z-[10000] bg-white" : "fixed inset-0 z-50 w-full h-full max-w-xl mx-auto"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={fullScreen ? undefined : onClose}
        >
          <motion.div
            className={fullScreen 
              ? "bg-white w-full h-full overflow-y-auto flex flex-col modal-scrollable" 
              : "bg-white w-full h-[calc(100vh-136px)] overflow-y-auto flex flex-col modal-scrollable"
            }
            initial={{ y: fullScreen ? "100%" : 20, opacity: fullScreen ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: fullScreen ? "100%" : 20, opacity: fullScreen ? 1 : 0 }}
            transition={{ type: fullScreen ? 'tween' : 'spring', ease: 'easeInOut', duration: fullScreen ? 0.3 : 0.2 }}
            onClick={e => e.stopPropagation()}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >            <style>{`
              .modal-scrollable::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            
            {/* Top navigation bar for fullScreen mode */}
            {fullScreen && (
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
                <button 
                  onClick={onClose}
                  className="flex items-center justify-center p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">{profile.name?.split(' ')[0]}</h1>
                <div className="w-10"></div> {/* Spacer for centering */}
              </div>
            )}

            {/* Header with image */}            <div className="relative bg-white flex justify-center items-center" style={{ height: '400px' }}>
              <div className="relative w-64 h-full">
                <img
                  src={currentImage}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-lg cursor-pointer shadow-lg"
                  style={{ aspectRatio: '7/10' }}
                  onClick={() => setIsImageFullscreen(true)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/400/300";
                  }}
                />
                
                {/* Enhanced Image navigation */}
                {profile.images && profile.images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentImageIndex > 0) {
                          setCurrentImageIndex(currentImageIndex - 1);
                        }
                      }}                      className={`absolute top-1/2 -left-12 transform -translate-y-1/2 p-2 rounded-full bg-gray-600/80 backdrop-blur-sm text-white hover:bg-gray-500/80 transition-all ${
                        currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                      }`}
                      disabled={currentImageIndex === 0}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentImageIndex < profile.images.length - 1) {
                          setCurrentImageIndex(currentImageIndex + 1);
                        }
                      }}                      className={`absolute top-1/2 -right-12 transform -translate-y-1/2 p-2 rounded-full bg-gray-600/80 backdrop-blur-sm text-white hover:bg-gray-500/80 transition-all ${
                        currentImageIndex === profile.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                      }`}
                      disabled={currentImageIndex === profile.images.length - 1}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                  {/* Image dots indicator - positioned at bottom center of image */}
                {profile.images && profile.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center gap-2">
                    {profile.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                          index === currentImageIndex 
                            ? 'bg-gray-800 scale-110' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>              
              {/* Header controls */}
              <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center">
                {/* Back Button */}
                <div className="p-[2px] rounded-full bg-gradient-to-br from-gray-400 via-gray-300 to-gray-100 shadow-md">
                  <button 
                    onClick={onClose}
                    className="p-2 rounded-full bg-gradient-to-br from-gray-700/90 via-gray-800 to-gray-900/90 backdrop-blur-[2px] hover:shadow-inner transition-all duration-300 group flex items-center justify-center relative"
                  >
                    <ArrowLeft 
                      size={20} 
                      className="text-gray-100 group-hover:-translate-x-0.5 group-hover:scale-105 transition-all duration-300" 
                      strokeWidth={2.3}
                    />
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10 transition-all duration-300" />
                  </button>
                </div>

                {/* Share Button */}
                <div className="p-[2px] rounded-full bg-gradient-to-br from-blue-400 via-blue-300 to-cyan-200 shadow-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                    className="p-2 rounded-full bg-gradient-to-br from-blue-600/90 via-blue-700 to-blue-800/90 backdrop-blur-[2px] hover:shadow-inner transition-all duration-300 group flex items-center justify-center relative"
                  >
                    <Share2 
                      size={20} 
                      className="text-blue-100 group-hover:rotate-12 group-hover:scale-105 transition-all duration-300" 
                      strokeWidth={2.3}
                    />
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10 transition-all duration-300" />
                  </button>
                </div>
              </div>
            </div>            {/* Profile Info Section */}
            <div className="px-6 py-4 bg-white border-b border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name?.split(' ')[0]}</h2>
                  {/* Green dot for active users - positioned right after first name */}
                  {profile.lastActive && new Date() - new Date(profile.lastActive) < 15 * 60 * 1000 && (
                    <div className="ml-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  )}
                  <span className="text-xl text-gray-600 ml-2">{profile.age}</span>
                  {profile.verified && (
                    <div className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">✓</div>
                  )}
                </div>
                  <div className="flex items-center justify-center text-gray-600 mb-2">
                  <MapPin size={16} className="mr-1" />
                  <span>{profile.location?.distance || 0} {distanceUnit} away</span>
                </div>
              </div>
            </div>
              {/* Tab navigation */}
            <div className="flex border-b overflow-x-auto">
              <TabButton 
                tab="about" 
                label="About" 
                icon={<Info size={18} />} 
                current={activeTab} 
              />
              <TabButton 
                tab="compatibility" 
                label="Compatibility" 
                icon={<Activity size={18} />} 
                current={activeTab} 
              />
            </div>            {/* Tab content */}
            <div className="pb-4">
              <AnimatePresence custom={animateDirection} mode="wait">
                <motion.div
                  key={activeTab}
                  custom={animateDirection}
                  variants={tabVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'about' && <AboutTabContent />}
                  {activeTab === 'compatibility' && <CompatibilityTabContent />}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Action buttons */}
            {!isMatch && (
              <div className="p-4 border-t flex items-center justify-between">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    if (onDislike) onDislike();
                  }}
                  className="flex-1 flex items-center justify-center rounded-full bg-gray-100 text-red-500 py-2 mr-2"
                >
                  <X size={24} className="mr-2" />
                  <span>Pass</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    if (onSuperLike && isPremium) {
                      onSuperLike();
                    } else if (onSuperLike && !isPremium) {
                      toast('Premium Feature', {
                        description: 'Upgrade to premium to use Superstar likes',
                        icon: <Star className="text-yellow-500" />
                      });
                    }
                  }}
                  className={`flex-1 flex items-center justify-center rounded-full py-2 mx-2 ${
                    isPremium 
                      ? 'bg-amber-500 text-white hover:bg-amber-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isPremium ? (
                    <>
                      <Star size={24} className="mr-2" />
                      <span>Superstar</span>
                    </>
                  ) : (
                    <>
                      <Lock size={20} className="mr-2" />
                      <span>Superstar</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    if (onLike) onLike();
                  }}
                  className="flex-1 flex items-center justify-center rounded-full bg-blue-500 text-white py-2 ml-2"
                >
                  <Heart size={24} className="mr-2" />
                  <span>Like</span>
                </button>
              </div>            )}
          </motion.div>
          
          {/* Fullscreen image viewer */}
          <ImageFullscreenModal />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileDetailModal;