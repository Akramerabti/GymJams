import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Heart, X, MessageCircle, Filter, Dumbbell, UserPlus, Calendar, MapPin } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../services/api';
import GymBrosProfile from '../components/gymBros/GymBrosProfile';
import GymBrosSetup from '../components/gymBros/GymBrosSetup';
import GymBrosMatches from '../components/gymBros/GymBrosMatches';
import GymBrosFilters from '../components/gymBros/GymBrosFilters';

const GymBros = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showMatches, setShowMatches] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [matches, setMatches] = useState([]);
  const [filters, setFilters] = useState({
    workoutTypes: [],
    experienceLevel: 'any',
    preferredTime: 'any',
    maxDistance: 50
  });
  
  const swipeRef = useRef(null);

  const getUserId = (user) => {
    return user?.user?.id|| user?.id || '';
  };
  
  
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Checking user profile...', user); // Debugging log
      checkUserProfile();
    }
  }, [isAuthenticated, user]);

  const checkUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gym-bros/profile', {
        params: {
          userId: getUserId(user), // Assuming `user.id` contains the authenticated user's ID
        },
      });
  
      if (response.data.hasProfile) {
        setHasProfile(true);
        setUserProfile(response.data.profile);
        fetchProfiles();
      } else {
        setHasProfile(false);
        setUserProfile(null); // Explicitly set userProfile to null
      }
    } catch (error) {
      console.error('Error checking gym profile:', error);
      setHasProfile(false);
      setUserProfile(null); // Explicitly set userProfile to null
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gym-bros/profiles', { 
        params: filters 
      });
      setProfiles(response.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load gym profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await api.get('/gym-bros/matches');
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    }
  };

  const handleSwipe = (direction, profileId) => {
    if (direction === 'right') {
      handleLike(profileId);
    } else {
      handleDislike(profileId);
    }
    
    // Move to next profile
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else {
      toast('You\'ve seen all profiles for now! Check back later.', {
        description: 'Pull to refresh for new profiles'
      });
    }
  };

  const handleLike = async (profileId) => {
    try {
      const response = await api.post(`/gym-bros/like/${profileId}`);
      if (response.data.match) {
        toast.success('It\'s a match! 🎉', {
          description: 'You can now message each other'
        });
        // Add to matches list
        fetchMatches();
      }
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  const handleDislike = async (profileId) => {
    try {
      await api.post(`/gym-bros/dislike/${profileId}`);
    } catch (error) {
      console.error('Error disliking profile:', error);
    }
  };

  const handleProfileCreated = (profile) => {
    setUserProfile(profile);
    setHasProfile(true);
    fetchProfiles();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    fetchProfiles();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <Dumbbell size={48} className="text-primary animate-bounce mb-4" />
          <p className="text-lg font-medium">Loading Gym Partners...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <Dumbbell size={48} className="text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-4">Find Your Perfect Gym Partner</h1>
        <p className="mb-6">Please log in to view and match with gym buddies.</p>
        <a href="/login" className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all">
          Log In to Continue
        </a>
      </div>
    );
  }

  if (!hasProfile) {
    return <GymBrosSetup onProfileCreated={handleProfileCreated} />;
  }

  return (
    <div className="max-w-xl mx-auto p-4 h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center">
          <Dumbbell className="mr-2 text-primary" /> GymMatch
        </h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setShowMatches(true);
              fetchMatches();
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <MessageCircle size={24} />
          </button>
          <button 
            onClick={() => setShowFilters(true)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <Filter size={24} />
          </button>
        </div>
      </div>
      
      {/* Card Stack */}
      {profiles.length > 0 ? (
        <div className="relative h-[70vh] w-full flex items-center justify-center">
          <AnimatePresence>
            {profiles.map((profile, index) => (
              index >= currentIndex && (
                <motion.div
                  key={profile._id}
                  ref={index === currentIndex ? swipeRef : null}
                  className="absolute w-full max-w-md rounded-xl overflow-hidden shadow-xl bg-white"
                  initial={{ scale: 0.95, opacity: index === currentIndex ? 1 : 0 }}
                  animate={{ 
                    scale: index === currentIndex ? 1 : 0.95,
                    opacity: index === currentIndex ? 1 : 0,
                    zIndex: profiles.length - index
                  }}
                  exit={{ 
                    x: Math.random() > 0.5 ? 1000 : -1000, 
                    opacity: 0,
                    transition: { duration: 0.3 }
                  }}
                  drag={index === currentIndex}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipeRef.current;
                    if (swipe) {
                      const swipeThreshold = swipe.offsetWidth * 0.4;
                      if (offset.x > swipeThreshold) {
                        handleSwipe('right', profile._id);
                      } else if (offset.x < -swipeThreshold) {
                        handleSwipe('left', profile._id);
                      }
                    }
                  }}
                >
                  <div className="h-full w-full">
                    {/* Profile content */}
                    <div className="relative h-[350px]">
                      <img 
                        src={profile.profileImage || "/api/placeholder/400/350"} 
                        alt={profile.name} 
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white">
                        <h3 className="text-xl font-bold">{profile.name}, {profile.age}</h3>
                        <div className="flex items-center mt-1">
                          <MapPin size={16} className="mr-1" />
                          <span className="text-sm">{profile.location.distance} miles away</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white">
                      {/* Workout preferences */}
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-500 mb-1">WORKOUT PREFERENCES</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.workoutTypes.map(type => (
                            <span key={type} className="bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full text-xs">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Experience level */}
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-500 mb-1">EXPERIENCE</h4>
                        <p className="text-sm">{profile.experienceLevel}</p>
                      </div>
                      
                      {/* Preferred schedule */}
                      <div className="mb-3 flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-500" />
                        <span className="text-sm">{profile.preferredTime}</span>
                      </div>
                      
                      {/* Bio */}
                      <p className="text-sm text-gray-700">{profile.bio}</p>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
          <Dumbbell size={48} className="text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No more profiles</h3>
          <p className="text-gray-500 mb-4">We couldn't find more gym buddies matching your criteria right now.</p>
          <button 
            onClick={fetchProfiles}
            className="bg-primary text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>
      )}
      
      {/* Bottom action buttons */}
      {profiles.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center space-x-4">
          <button 
            onClick={() => handleSwipe('left', profiles[currentIndex]._id)}
            className="p-4 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100"
          >
            <X size={28} className="text-red-500" />
          </button>
          <button 
            onClick={() => handleSwipe('right', profiles[currentIndex]._id)}
            className="p-4 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-100"
          >
            <Heart size={28} className="text-green-500" />
          </button>
        </div>
      )}
      
      {/* Matches Modal */}
      <GymBrosMatches 
        isOpen={showMatches} 
        onClose={() => setShowMatches(false)} 
        matches={matches}
      />
      
      {/* Filters Modal */}
      <GymBrosFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleFilterChange}
      />
    </div>
  );
};

export default GymBros;