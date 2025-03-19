import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Loader, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import gymbrosService from '../../services/gymbros.service';

const GymBrosMatches = ({ isOpen, onClose }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageToken, setPageToken] = useState(null);
  const [prefetching, setPrefetching] = useState(false);
  
  // Batch size for loading profiles
  const BATCH_SIZE = 10;
  
  // Threshold for prefetching new profiles (when X profiles remain)
  const PREFETCH_THRESHOLD = 3;
  
  // Modal container ref for click outside detection
  const modalRef = useRef(null);
  
  // Cache of prefetched profiles (for smoother transitions)
  const profileCacheRef = useRef([]);
  
  // Load initial profiles when opened
  useEffect(() => {
    if (isOpen) {
      loadProfiles(true);
    } else {
      // Reset state when modal closes
      setCurrentIndex(0);
    }
  }, [isOpen]);
  
  // Prefetch more profiles when approaching the end of the current batch
  useEffect(() => {
    if (profiles.length === 0) return;
    
    const remainingProfiles = profiles.length - currentIndex;
    
    // If we're getting low on profiles and not already loading, prefetch more
    if (remainingProfiles <= PREFETCH_THRESHOLD && hasMore && !prefetching && !loading) {
      prefetchProfiles();
    }
  }, [currentIndex, profiles, hasMore, prefetching, loading]);
  
  // Load profiles - can be initial load or appending to existing
  const loadProfiles = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get profiles from cache or API
      let newProfiles;
      
      if (profileCacheRef.current.length > 0) {
        // Use prefetched profiles if available
        newProfiles = profileCacheRef.current;
        profileCacheRef.current = [];
      } else {
        // Otherwise fetch from API
        const response = await gymbrosService.getRecommendedProfiles({
          limit: BATCH_SIZE,
          pageToken: reset ? null : pageToken
        });
        
        newProfiles = response.profiles || [];
        setPageToken(response.nextPageToken || null);
        setHasMore(!!response.nextPageToken);
      }
      
      // Update profiles list
      setProfiles(prev => {
        if (reset) {
          return newProfiles;
        } else {
          return [...prev, ...newProfiles];
        }
      });
      
      // Reset index if requested
      if (reset) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pageToken, loading]);
  
  // Prefetch profiles to ensure smooth swiping experience
  const prefetchProfiles = useCallback(async () => {
    if (!hasMore || prefetching) return;
    
    setPrefetching(true);
    
    try {
      const response = await gymbrosService.getRecommendedProfiles({
        limit: BATCH_SIZE,
        pageToken
      });
      
      // Store in cache for later use
      profileCacheRef.current = response.profiles || [];
      
      // Update page token and hasMore flag
      setPageToken(response.nextPageToken || null);
      setHasMore(!!response.nextPageToken);
    } catch (err) {
      console.error('Error prefetching profiles:', err);
    } finally {
      setPrefetching(false);
    }
  }, [pageToken, hasMore, prefetching]);
  
  // Handle like action
  const handleLike = async (profileId) => {
    try {
      await gymbrosService.likeProfile(profileId);
      
      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (hasMore) {
        // Try to load more if needed
        await loadProfiles();
      }
    } catch (err) {
      console.error('Error liking profile:', err);
    }
  };
  
  // Handle dislike action
  const handleDislike = async (profileId) => {
    try {
      await gymbrosService.dislikeProfile(profileId);
      
      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (hasMore) {
        // Try to load more if needed
        await loadProfiles();
      }
    } catch (err) {
      console.error('Error disliking profile:', err);
    }
  };
  
  // Handle refreshing profiles
  const handleRefresh = () => {
    loadProfiles(true);
  };
  
  // Track swipe direction
  const handleSwipe = (direction, profileId) => {
    if (direction === 'right') {
      handleLike(profileId);
    } else if (direction === 'left') {
      handleDislike(profileId);
    }
  };
  
  // Handle click outside
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  // Handle key presses
  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;
    
    if (e.key === 'ArrowLeft') {
      handleDislike(currentProfile._id);
    } else if (e.key === 'ArrowRight') {
      handleLike(currentProfile._id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  
  // Add event listeners
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, profiles, currentIndex]);
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-lg h-[80vh] flex flex-col overflow-hidden"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Gym Partners</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-hidden relative">
          {loading && profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader size={32} className="animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">Loading potential gym partners...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                <RefreshCw size={16} className="mr-2" />
                Try Again
              </button>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <p className="text-gray-500 mb-4">No potential gym partners found.</p>
              <p className="text-sm text-gray-400 mb-4">
                Try adjusting your filters or check back later.
              </p>
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {profiles.map((profile, index) => (
                <motion.div
                  key={profile._id}
                  className="absolute inset-0"
                  style={{ zIndex: profiles.length - index }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ 
                    scale: index === currentIndex ? 1 : 0.9,
                    opacity: index === currentIndex ? 1 : 0,
                  }}
                  exit={{ x: profile.swipedDirection === 'left' ? -300 : 300, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  drag={index === currentIndex ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.9}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipeThreshold = 100;
                    if (offset.x > swipeThreshold) {
                      // Set temporarily to animate exit
                      profile.swipedDirection = 'right';
                      handleSwipe('right', profile._id);
                    } else if (offset.x < -swipeThreshold) {
                      // Set temporarily to animate exit
                      profile.swipedDirection = 'left';
                      handleSwipe('left', profile._id);
                    }
                  }}
                >
                  <div className="h-full p-2 flex flex-col">
                    {/* Card Content */}
                    <div className="flex-1 relative rounded-lg overflow-hidden shadow-lg">
                      {/* Profile Image */}
                      <img
                        src={profile.profileImage || "/api/placeholder/400/600"}
                        alt={profile.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                      
                      {/* Profile Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-2xl font-bold mb-1">
                          {profile.name}, {profile.age}
                        </h3>
                        
                        <div className="flex items-center mb-2">
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                            {profile.experienceLevel}
                          </span>
                          {profile.workoutTypes && profile.workoutTypes[0] && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              {profile.workoutTypes[0]}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-white/90 line-clamp-2">
                          {profile.bio}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-center mt-4 space-x-8">
                      <button
                        onClick={() => handleDislike(profile._id)}
                        className="w-14 h-14 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center"
                      >
                        <X size={28} className="text-red-500" />
                      </button>
                      
                      <button
                        onClick={() => handleLike(profile._id)}
                        className="w-14 h-14 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center"
                      >
                        <MessageCircle size={28} className="text-blue-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {/* Loading indicator for when prefetching */}
          {(prefetching || (loading && profiles.length > 0)) && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center shadow-md">
                <Loader size={16} className="animate-spin text-blue-500 mr-2" />
                <span className="text-xs text-gray-600">Loading more profiles...</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GymBrosMatches;