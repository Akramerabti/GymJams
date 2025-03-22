import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, RefreshCw, Filter, Zap, Medal, Star, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import GymBrosMatches from '../GymBrosMatches';
import { usePoints } from '../../../hooks/usePoints';
import useAuthStore from '../../../stores/authStore';

const DiscoverTab = ({ 
  profiles, 
  currentIndex, 
  setCurrentIndex, 
  handleSwipe, 
  fetchProfiles, 
  loading, 
  filters,
  setShowFilters
}) => {
  // At the top of component - Add detailed logging
  console.log("DiscoverTab: Received profiles:", 
    profiles?.length,
    "First profile:", profiles[0]?._id,
    "Current index:", currentIndex);

  const { balance: pointsBalance, subtractPoints, updatePointsInBackend } = usePoints();
  const { isAuthenticated } = useAuthStore();
  const [showBoostOptions, setShowBoostOptions] = useState(false);
  const [showSuperLikeOptions, setShowSuperLikeOptions] = useState(false);
  const [refreshAnimation, setRefreshAnimation] = useState(false);
  const [loadingText, setLoadingText] = useState('Finding your perfect gym partner');

  // Animation for loading text
  useEffect(() => {
    if (loading) {
      const texts = [
        'Finding your perfect gym partner',
        'Matching workout preferences',
        'Calculating compatibility',
        'Analyzing fitness goals'
      ];
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % texts.length;
        setLoadingText(texts[index]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Handle swipe from the GymBrosMatches component
  const handleSwipeFromMatchComponent = (direction, profileId, viewDuration) => {
    console.log(`DiscoverTab: Swipe ${direction} received for profile ${profileId}`);
    handleSwipe(direction, profileId);
  };

  // Handle refresh animation
  const handleRefreshWithAnimation = () => {
    setRefreshAnimation(true);
    setTimeout(() => {
      fetchProfiles();
      setRefreshAnimation(false);
    }, 600);
  };

  // Handle boost profile
  const handleBoostProfile = (boostType) => {
    let cost = 0;
    let duration = '';
    
    switch(boostType) {
      case 'basic':
        cost = 50;
        duration = '30 minutes';
        break;
      case 'premium':
        cost = 100;
        duration = '1 hour';
        break;
      case 'ultra':
        cost = 200;
        duration = '3 hours';
        break;
      default:
        return;
    }
    
    if (!isAuthenticated) {
      toast.error('Please log in to use boosts');
      return;
    }
    
    if (pointsBalance < cost) {
      toast.error('Not enough points!', {
        description: `You need ${cost} points for this boost. You have ${pointsBalance} points.`
      });
      return;
    }
    
    // Success case
    subtractPoints(cost);
    updatePointsInBackend(-cost); // Negative to subtract
    
    toast.success(`Profile boosted for ${duration}!`, {
      description: `Your profile will be shown to more users. ${cost} points deducted.`
    });
    
    setShowBoostOptions(false);
  };

  // Handle super like
  const handleSuperLike = (superLikeType) => {
    let cost = 0;
    let description = '';
    
    switch(superLikeType) {
      case 'basic':
        cost = 20;
        description = 'They\'ll be notified of your interest';
        break;
      case 'premium':
        cost = 50;
        description = 'Adds a personalized message';
        break;
      case 'ultra':
        cost = 100;
        description = 'Guarantees you\'ll be seen at the top of their stack';
        break;
      default:
        return;
    }
    
    if (!isAuthenticated) {
      toast.error('Please log in to use Super Likes');
      return;
    }
    
    if (pointsBalance < cost) {
      toast.error('Not enough points!', {
        description: `You need ${cost} points for this Super Like. You have ${pointsBalance} points.`
      });
      return;
    }
    
    // Check if we have a current profile
    if (profiles.length === 0 || currentIndex >= profiles.length) {
      toast.error('No profile to Super Like!');
      return;
    }
    
    // Success case
    subtractPoints(cost);
    updatePointsInBackend(-cost); // Negative to subtract
    
    // Get the current profile
    const currentProfile = profiles[currentIndex];
    
    // Super Like the profile
    handleSwipe('right', currentProfile._id);
    
    toast.success(`Super Like sent!`, {
      description: `${description}. ${cost} points deducted.`
    });
    
    setShowSuperLikeOptions(false);
  };
  
  // Only pass profiles up to the current index + a few more for performance
  const visibleProfiles = profiles?.slice(0, currentIndex + 5) || [];
  
  // Before returning JSX - Add more detailed logging
  console.log("DiscoverTab: Passing to GymBrosMatches:", 
    visibleProfiles.length, 
    "First visible profile:", visibleProfiles[0]?._id);

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
          <div className="absolute inset-0 flex items-center justify-center">
            <Dumbbell size={24} className="text-blue-700" />
          </div>
        </div>
        <motion.p 
          key={loadingText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-lg font-medium text-gray-700"
        >
          {loadingText}...
        </motion.p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
      </div>
    );
  }

  // Render empty state
  if (profiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="bg-gray-100 rounded-full p-6 mb-6">
          <Dumbbell size={64} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">No more profiles</h3>
        <p className="text-gray-500 mb-8">We couldn't find gym buddies matching your criteria.</p>
        <div className="space-y-4 w-full max-w-xs">
          <button 
            onClick={handleRefreshWithAnimation}
            className="w-full flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <motion.div
              animate={refreshAnimation ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6 }}
              className="mr-2"
            >
              <RefreshCw size={20} />
            </motion.div>
            Refresh Profiles
          </button>
          
          <button 
            onClick={() => setShowFilters && setShowFilters(true)}
            className="w-full flex items-center justify-center bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <Filter size={20} className="mr-2" />
            Adjust Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Debug container */}
      <div className="absolute top-0 left-0 z-50 bg-red-100 p-2 text-xs">
        Visible profiles: {visibleProfiles.length}
        {visibleProfiles.length > 0 && ` - First ID: ${visibleProfiles[0]._id}`}
      </div>
      
      {/* Main Profile Stack - Added border for debugging */}
      <div className="relative w-full h-full border-2 border-blue-500" style={{ zIndex: 30 }}>
        <GymBrosMatches
          externalProfiles={visibleProfiles}
          externalLoading={loading}
          onSwipe={handleSwipeFromMatchComponent}
          onRefresh={fetchProfiles}
          filters={filters}
        />
      </div>
      
      {/* Temporarily disable Boost and Super Like Buttons for debugging */}
      {/*
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBoostOptions(!showBoostOptions)}
          className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg"
        >
          <Zap size={24} />
        </motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSuperLikeOptions(!showSuperLikeOptions)}
          className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg"
        >
          <Star size={24} />
        </motion.button>
      </div>
      */}
      
      {/* Boost Options Modal */}
      <AnimatePresence>
        {showBoostOptions && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-0 right-0 mx-4 p-4 bg-white rounded-lg shadow-xl z-30"
          >
            {/* Boost options content */}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Super Like Options Modal */}
      <AnimatePresence>
        {showSuperLikeOptions && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-0 right-0 mx-4 p-4 bg-white rounded-lg shadow-xl z-30"
          >
            {/* Super like options content */}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Loading Indicator (when fetching more) */}
      {loading && profiles.length > 0 && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center shadow-md">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <Loader size={16} className="text-blue-500" />
            </motion.div>
            <span className="text-sm text-gray-600">Finding more matches...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverTab;