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
            onClick={() => setShowFilters(true)}
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
      {/* Main Profile Stack */}
      <div className="relative w-full h-full">
        <GymBrosMatches
          externalProfiles={visibleProfiles}
          externalLoading={loading}
          onSwipe={handleSwipeFromMatchComponent}
          onRefresh={fetchProfiles}
          filters={filters}
        />
      </div>
      
      {/* Boost and Super Like Buttons (Floating) */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
        {/* Boost Button */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBoostOptions(!showBoostOptions)}
          className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg"
        >
          <Zap size={24} />
        </motion.button>
        
        {/* Super Like Button */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSuperLikeOptions(!showSuperLikeOptions)}
          className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg"
        >
          <Star size={24} />
        </motion.button>
      </div>
      
      {/* Boost Options Modal */}
      <AnimatePresence>
        {showBoostOptions && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-0 right-0 mx-4 p-4 bg-white rounded-lg shadow-xl z-30"
          >
            <h4 className="text-lg font-bold mb-3 flex items-center">
              <Zap className="text-purple-500 mr-2" size={20} />
              Boost Your Profile
            </h4>
            <p className="text-gray-500 text-sm mb-4">Get more visibility in others' stacks</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleBoostProfile('basic')}
                className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <Zap size={16} className="text-purple-500" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium">Basic Boost</h5>
                    <p className="text-xs text-gray-500">30 mins of increased visibility</p>
                  </div>
                </div>
                <span className="font-bold text-purple-600">50 pts</span>
              </button>
              
              <button 
                onClick={() => handleBoostProfile('premium')}
                className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="bg-purple-200 p-2 rounded-full mr-3">
                    <Zap size={16} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium">Premium Boost</h5>
                    <p className="text-xs text-gray-500">1 hour of high visibility</p>
                  </div>
                </div>
                <span className="font-bold text-purple-600">100 pts</span>
              </button>
              
              <button 
                onClick={() => handleBoostProfile('ultra')}
                className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="bg-purple-300 p-2 rounded-full mr-3">
                    <Zap size={16} className="text-purple-700" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium">Ultra Boost</h5>
                    <p className="text-xs text-gray-500">3 hours of maximum visibility</p>
                  </div>
                </div>
                <span className="font-bold text-purple-600">200 pts</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowBoostOptions(false)} 
              className="w-full mt-4 text-gray-500 text-sm"
            >
              Cancel
            </button>
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
            <h4 className="text-lg font-bold mb-3 flex items-center">
              <Star className="text-blue-500 mr-2" size={20} />
              Super Like
            </h4>
            <p className="text-gray-500 text-sm mb-4">Stand out and get noticed</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleSuperLike('basic')}
                className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Star size={16} className="text-blue-500" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium">Super Like</h5>
                    <p className="text-xs text-gray-500">They'll know you liked them</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">20 pts</span>
              </button>
              
              <button 
                onClick={() => handleSuperLike('premium')}
                className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="bg-blue-200 p-2 rounded-full mr-3">
                    <Star size={16} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium">Premium Super Like</h5>
                    <p className="text-xs text-gray-500">Add a personalized message</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">50 pts</span>
              </button>
              
              <button 
                onClick={() => handleSuperLike('ultra')}
                className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="bg-blue-300 p-2 rounded-full mr-3">
                    <Medal size={16} className="text-blue-700" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-medium">Ultra Super Like</h5>
                    <p className="text-xs text-gray-500">Go to the top of their stack</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">100 pts</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowSuperLikeOptions(false)} 
              className="w-full mt-4 text-gray-500 text-sm"
            >
              Cancel
            </button>
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