import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Share2, ChevronLeft, ChevronRight, MapPin, Award, 
  Calendar, Clock, Target, Activity, Heart, X, MessageCircle,
  Users, Dumbbell, Camera, Info, Mail, Briefcase, GraduationCap,
  Coffee
} from 'lucide-react';
import { toast } from 'sonner';
import ActiveStatus from './ActiveStatus';

const ProfileDetailsModal = ({ profile, isVisible, onClose, onLike, onDislike, onSuperLike, isMatch }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const [animateDirection, setAnimateDirection] = useState('right');
  
  // Reset image index when profile changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile]);

  if (!profile) return null;
  
  // Format image URL
  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return "/api/placeholder/400/600";
    
    if (imageUrl.startsWith('blob:')) {
      return imageUrl;
    } else if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}${imageUrl}`;
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
    const tabOrder = ['about', 'photos', 'interests'];
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
      className={`flex flex-col items-center py-2 px-4 ${
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
        <h4 className="font-medium text-gray-700 mb-2">Basic Info</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <MapPin size={18} className="mr-2 text-blue-500" />
            <span className="text-gray-700">
              {profile.location?.address?.split(',')[0] || 'Location not specified'}
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
          <div className="flex items-center">
            <Clock size={18} className="mr-2 text-blue-500" />
            <ActiveStatus lastActive={profile.lastActive} textColorClass="text-gray-700" showDot={false} />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Workout Preferences</h4>
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
        <h4 className="font-medium text-gray-700 mb-2">Goals</h4>
        <p className="text-gray-700">
          {profile.goals || 'No goals specified'}
        </p>
      </div>
      
      {/* Additional personal info */}
      {(profile.work || profile.studies) && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">Work & Education</h4>
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
    </div>
  );
  
  // Photos Tab Content
  const PhotosTabContent = () => (
    <div className="p-5">
      <h3 className="text-lg font-semibold mb-3">Photos</h3>
      <div className="grid grid-cols-3 gap-2">
        {profile.images && profile.images.length > 0 ? (
          profile.images.map((image, index) => (
            <div 
              key={index} 
              className="aspect-square rounded-lg overflow-hidden cursor-pointer relative"
              onClick={() => {
                setCurrentImageIndex(index);
                setActiveTab('about');
              }}
            >
              <img 
                src={formatImageUrl(image)} 
                alt={`${profile.name} ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/api/placeholder/400/400";
                }}
              />
              {/* Primary photo indicator */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Primary
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-10 text-gray-500">
            No photos available
          </div>
        )}
      </div>
    </div>
  );
  
  // Interests Tab Content
  const InterestsTabContent = () => (
    <div className="p-5">
      <h3 className="text-lg font-semibold mb-3">Interests</h3>
      {profile.interests && profile.interests.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {profile.interests.map((interest, index) => (
            <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
              {interest}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No interests specified</p>
      )}
      
      <h3 className="text-lg font-semibold mb-3 mt-6">Match Stats</h3>
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700">Match Score</span>
          <span className="font-semibold text-blue-700">{profile.matchScore || 85}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${profile.matchScore || 85}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Based on workout preferences, schedule, and experience level
        </p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-0 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-lg rounded-lg overflow-hidden flex flex-col"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header with image */}
            <div className="relative h-72 bg-gray-200">
              <img
                src={currentImage}
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/api/placeholder/400/300";
                }}
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
                    className={`absolute top-1/2 left-2 transform -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-sm text-white ${
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
                    className={`absolute top-1/2 right-2 transform -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-sm text-white ${
                      currentImageIndex === profile.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                    }`}
                    disabled={currentImageIndex === profile.images.length - 1}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              
              {/* Image indicators */}
              {profile.images && profile.images.length > 1 && (
                <div className="absolute top-2 left-0 right-0 flex justify-center gap-1">
                  {profile.images.map((_, index) => (
                    <div 
                      key={index}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-2'
                      }`}
                    />
                  ))}
                </div>
              )}
              
              {/* Header controls */}
              <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center">
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
                >
                  <Share2 size={20} />
                </button>
              </div>
              
              {/* User info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white">
                <div className="flex items-center">
                  <h2 className="text-2xl font-bold mr-2">{profile.name}</h2>
                  <span className="text-xl">{profile.age}</span>
                  {profile.verified && (
                    <div className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs">✓</div>
                  )}
                </div>
                
                <ActiveStatus 
                  lastActive={profile.lastActive} 
                  textColorClass="text-green-300" 
                  dotColorClass="bg-green-500"
                  showDot={true} 
                />
                
                <div className="flex items-center mt-1">
                  <MapPin size={16} className="mr-1" />
                  <span>{profile.location?.distance || 0} miles away</span>
                </div>
              </div>
            </div>
            
            {/* Tab navigation */}
            <div className="flex border-b">
              <TabButton 
                tab="about" 
                label="About" 
                icon={<Dumbbell size={18} />} 
                current={activeTab} 
              />
              <TabButton 
                tab="photos" 
                label="Photos" 
                icon={<Camera size={18} />} 
                current={activeTab} 
              />
              <TabButton 
                tab="interests" 
                label="Interests" 
                icon={<Activity size={18} />} 
                current={activeTab} 
              />
            </div>
            
            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
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
                  {activeTab === 'photos' && <PhotosTabContent />}
                  {activeTab === 'interests' && <InterestsTabContent />}
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
                    if (onLike) onLike();
                  }}
                  className="flex-1 flex items-center justify-center rounded-full bg-blue-500 text-white py-2 ml-2"
                >
                  <Heart size={24} className="mr-2" />
                  <span>Like</span>
                </button>
              </div>
            )}
            
            {/* Message button for matched profiles */}
            {isMatch && (
              <div className="p-4 pt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    // Navigate to messages with this match
                    toast.success(`Starting conversation with ${profile.name}`);
                  }}
                  className="w-full flex items-center justify-center rounded-full bg-green-500 text-white py-3"
                >
                  <MessageCircle size={20} className="mr-2" />
                  <span>Send Message</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileDetailsModal;