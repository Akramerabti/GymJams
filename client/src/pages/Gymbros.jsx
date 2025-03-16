import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Heart, X, MessageCircle, Filter, Dumbbell, UserPlus, 
  Calendar, MapPin, Settings, ShoppingBag, User,
  ChevronLeft, ChevronRight, Edit, Sun, Moon
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../services/api';

import EnhancedProfileCard from '../components/gymBros/EnhancedProfileCard';
import GymBrosProfile from '../components/gymBros/GymBrosProfile';
import GymBrosSetup from '../components/gymBros/GymBrosSetup';
import GymBrosMatches from '../components/gymBros/GymBrosMatches';
import GymBrosFilters from '../components/gymBros/GymBrosFilters';
import GymBrosSettings from '../components/gymBros/GymBrosSettings';
import EnhancedGymBrosProfile  from '../components/gymBros/ProfileEditor';

import { useLocation } from 'react-router-dom';

// Tell Layout component to hide footer when on this route
const FooterHider = () => {
  const location = useLocation();
  
  useEffect(() => {
    // When component mounts, add class to hide footer
    document.body.classList.add('hide-footer');
    
    // When component unmounts, remove the class
    return () => {
      document.body.classList.remove('hide-footer');
    };
  }, [location.pathname]);
  
  return null;
};

const GymBros = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showMatches, setShowMatches] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [matches, setMatches] = useState([]);
  const [viewStartTime, setViewStartTime] = useState(null);
  const [activeTab, setActiveTab] = useState('discover'); // discover, matches, shop, profile
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filters, setFilters] = useState({
    workoutTypes: [],
    experienceLevel: 'Any',
    preferredTime: 'Any',
    genderPreference: 'All',
    ageRange: { min: 18, max: 99 },
    maxDistance: 50
  });
  
  const swipeRef = useRef(null);
  const profileRef = useRef(null);

  const getUserId = (user) => {
    return user?.user?.id || user?.id || '';
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Update the global site theme
    if (window.toggleDarkMode) {
      window.toggleDarkMode(newDarkMode);
    } else {
      // Fallback if global function not available
      localStorage.setItem('siteTheme', newDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-mode', newDarkMode);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false); // Immediately stop loading if not authenticated
    }
    
    if (isAuthenticated) {
      console.log('[GymBros] Checking user profile for ID:', getUserId(user));
      checkUserProfile();
    }

  }, [isAuthenticated, user]);

  // Set view start time when profile changes
  useEffect(() => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      setViewStartTime(Date.now());
      console.log('[GymBros] Viewing profile:', profiles[currentIndex].name, 'at index:', currentIndex);
    }
  }, [currentIndex, profiles]);

  // Handle scroll for header visibility
  useEffect(() => {
    const controlHeader = () => {
      // Get main navbar height (assuming it's 64px or 4rem)
      const navbarHeight = 64;
      
      if (window.scrollY > navbarHeight + 10 && window.scrollY > lastScrollY) {
        // Scrolling down past navbar
        setHeaderVisible(false);
      } else {
        // Scrolling up or at top
        setHeaderVisible(true);
      }
      
      setLastScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', controlHeader);
    
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, [lastScrollY]);

  const checkUserProfile = async () => {
    try {
      setLoading(true);

      if (!isAuthenticated) return;

      const response = await api.get('/gym-bros/profile', {
        params: {
          userId: getUserId(user),
        },
      });
      
      console.log('[GymBros] Profile check response:', response.data);
  
      if (response.data.hasProfile) {
        setHasProfile(true);
        setUserProfile(response.data.profile);
        
        // Initialize filters based on user profile preferences if available
        if (response.data.profile) {
          console.log('[GymBros] Setting initial filters from user profile');
          
          const initialFilters = {
            workoutTypes: response.data.profile.workoutTypes || [],
            experienceLevel: response.data.profile.experienceLevel || 'Any',
            preferredTime: response.data.profile.preferredTime || 'Any',
            genderPreference: response.data.profile.genderPreference || 'All',
            ageRange: { 
              min: response.data.profile.ageRange?.min || 18, 
              max: response.data.profile.ageRange?.max || 99 
            },
            maxDistance: response.data.profile.maxDistance || 50
          };
          
          console.log('[GymBros] Initial filters:', initialFilters);
          setFilters(initialFilters);
        }
        
        fetchProfiles();
        fetchMatches();
      } else {
        console.log('[GymBros] No profile found, showing profile setup');
        setHasProfile(false);
        setUserProfile(null);
      }
     } catch (error) {
    console.error('[GymBros] Error checking gym profile:', error);
    setHasProfile(false);
    setUserProfile(null);
  } finally {
    setLoading(false);
  }
};

  const fetchProfiles = async () => {
    try {
      console.log('[GymBros] Fetching profiles with filters:', filters);
      setLoading(true);
      
      // Build query parameters from filters
      const queryParams = new URLSearchParams();
      
      if (filters.workoutTypes.length > 0) {
        queryParams.append('workoutTypes', filters.workoutTypes.join(','));
      }
      
      if (filters.experienceLevel && filters.experienceLevel !== 'Any') {
        queryParams.append('experienceLevel', filters.experienceLevel);
      }
      
      if (filters.preferredTime && filters.preferredTime !== 'Any') {
        queryParams.append('preferredTime', filters.preferredTime);
      }
      
      if (filters.genderPreference && filters.genderPreference !== 'All') {
        queryParams.append('gender', filters.genderPreference);
      }
      
      if (filters.ageRange) {
        queryParams.append('minAge', filters.ageRange.min || 18);
        queryParams.append('maxAge', filters.ageRange.max || 99);
      }
      
      queryParams.append('maxDistance', filters.maxDistance || 50);
      
      // Add timestamp to prevent caching
      queryParams.append('_t', Date.now());
      
      console.log('[GymBros] Query params:', queryParams.toString());
      
      const response = await api.get(`/gym-bros/profiles?${queryParams.toString()}`);
      console.log('[GymBros] Received profiles:', response.data.length);
      
      setProfiles(response.data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('[GymBros] Error fetching profiles:', error);
      toast.error('Failed to load gym profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      console.log('[GymBros] Fetching matches');
      const response = await api.get('/gym-bros/matches');
      console.log('[GymBros] Matches received:', response.data.length);
      setMatches(response.data);
    } catch (error) {
      console.error('[GymBros] Error fetching matches:', error);
      toast.error('Failed to load matches');
    }
  };

  const handleSwipe = (direction, profileId) => {
    // Calculate view duration
    const viewDuration = Date.now() - (viewStartTime || Date.now());
    console.log(`[GymBros] Swiped ${direction} on profile ${profileId} after ${viewDuration}ms`);
    
    if (direction === 'right') {
      handleLike(profileId, viewDuration);
    } else {
      handleDislike(profileId, viewDuration);
    }
    
    // Move to next profile with animation
    if (profileRef.current) {
      const moveAnimation = {
        x: direction === 'right' ? 1000 : -1000,
        opacity: 0,
        transition: { duration: 0.3 }
      };
      
      // Apply animation through ref
      profileRef.current.animate(moveAnimation, {
        onComplete: () => {
          if (currentIndex < profiles.length - 1) {
            console.log('[GymBros] Moving to next profile, index:', currentIndex + 1);
            setCurrentIndex(prevIndex => prevIndex + 1);
          } else {
            console.log('[GymBros] No more profiles to show');
            toast('You\'ve seen all profiles for now! Check back later.', {
              description: 'Pull to refresh for new profiles'
            });
          }
        }
      });
    } else {
      // Fallback if ref isn't available
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(prevIndex => prevIndex + 1);
      } else {
        toast('You\'ve seen all profiles for now! Check back later.', {
          description: 'Pull to refresh for new profiles'
        });
      }
    }
  };

  const handleLike = async (profileId, viewDuration) => {
    try {
      console.log(`[GymBros] Sending like for profile ${profileId} with view duration ${viewDuration}ms`);
      const response = await api.post(`/gym-bros/like/${profileId}`, { viewDuration });
      
      if (response.data.match) {
        console.log('[GymBros] Match created!', response.data);
        toast.success('It\'s a match! 🎉', {
          description: 'You can now message each other'
        });
        // Add to matches list
        fetchMatches();
      } else {
        console.log('[GymBros] Like sent, no match yet');
      }
    } catch (error) {
      console.error('[GymBros] Error liking profile:', error);
    }
  };

  const handleDislike = async (profileId, viewDuration) => {
    try {
      console.log(`[GymBros] Sending dislike for profile ${profileId} with view duration ${viewDuration}ms`);
      await api.post(`/gym-bros/dislike/${profileId}`, { viewDuration });
    } catch (error) {
      console.error('[GymBros] Error disliking profile:', error);
    }
  };

  const handleProfileCreated = (profile) => {
    console.log('[GymBros] New profile created:', profile);
    setUserProfile(profile);
    setHasProfile(true);
    
    // Initialize filters from newly created profile
    setFilters({
      workoutTypes: profile.workoutTypes || [],
      experienceLevel: profile.experienceLevel || 'Any',
      preferredTime: profile.preferredTime || 'Any',
      genderPreference: 'All',  // Default to all
      ageRange: { min: 18, max: 99 },  // Default age range
      maxDistance: 50  // Default distance
    });
    
    fetchProfiles();
  };

  const handleFilterChange = (newFilters) => {
    console.log('[GymBros] Filters updated:', newFilters);
    setFilters(newFilters);
    setShowFilters(false);
    
    // Also update user preferences in the database
    updateUserPreferences(newFilters);
    
    // Fetch new profiles with updated filters
    fetchProfiles();
  };
  
  const updateUserPreferences = async (newFilters) => {
    try {
      console.log('[GymBros] Updating user preferences with new filters:', newFilters);
      
      // Update profile preferences with new filter settings
      await api.put('/gym-bros/preferences', {
        workoutTypes: newFilters.workoutTypes,
        experienceLevel: newFilters.experienceLevel !== 'Any' ? newFilters.experienceLevel : undefined,
        preferredTime: newFilters.preferredTime !== 'Any' ? newFilters.preferredTime : undefined,
        genderPreference: newFilters.genderPreference !== 'All' ? newFilters.genderPreference : undefined,
        ageRange: newFilters.ageRange,
        maxDistance: newFilters.maxDistance
      });
      
      console.log('[GymBros] User preferences updated successfully');
    } catch (error) {
      console.error('[GymBros] Error updating user preferences:', error);
      toast.error('Failed to update preferences');
    }
  };
  
  const handleProfileUpdated = (updatedProfile) => {
    console.log('[GymBros] Profile updated:', updatedProfile);
    setUserProfile(updatedProfile);
    setShowSettings(false);
    
    // Refresh profiles with updated preferences
    fetchProfiles();
  };
  


const renderHeader = () => {
  // Common header title with logo
  const headerTitle = (
    <h1 className="text-xl font-bold flex items-center">
      <Dumbbell className="mr-2 text-blue-500" /> GymMatch
    </h1>
  );

  const headerContent = (() => {
    switch(activeTab) {
      case 'discover':
        return (
          <div className="bg-white shadow-md py-3 px-4 flex justify-between items-center">
            {headerTitle}
            <div className="flex space-x-2">
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-blue-800'
                }`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setShowFilters(true)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Filter size={20} />
              </button>
              <button
                onClick={() => {
                  fetchMatches();
                  setActiveTab('matches');
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 relative"
              >
                <MessageCircle size={20} />
                {matches.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {matches.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        );
      
      case 'matches':
        return (
          <div className="bg-white shadow-md py-3 px-4 flex justify-between items-center">
            {headerTitle}
            <div className="flex space-x-2">
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-blue-800'
                }`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        );
        
      case 'shop':
        return (
          <div className="bg-white shadow-md py-3 px-4 flex justify-between items-center">
            {headerTitle}
            <div className="flex space-x-2">
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-blue-800'
                }`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 relative"
              >
                <ShoppingBag size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        );
        
      case 'profile':
        return (
          <div className="bg-white shadow-md py-3 px-4 flex justify-between items-center">
            {headerTitle}
            <div className="flex space-x-2">
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-blue-800'
                }`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="bg-white shadow-md py-3 px-4 flex justify-between items-center">
            {headerTitle}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-blue-800'
              }`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        );
    }
  })();

  return (
    <div className={`transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      {headerContent}
    </div>
  );
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <Dumbbell size={48} className="text-blue-500 animate-bounce mb-4" />
          <p className="text-lg font-medium">Loading Gym Partners...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {

    return <GymBrosSetup onProfileCreated={handleProfileCreated} />;
  }

  if (!hasProfile) {
    console.log('[GymBros] User has no profile, showing setup form');
    return <GymBrosSetup onProfileCreated={handleProfileCreated} />;
  }

  // Different content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'discover':
        return (
          <div className="h-[calc(100vh-136px)] flex items-center justify-center pb-16">
            {profiles.length > 0 ? (
              <div className="relative w-full h-full">
                {profiles.map((profile, index) => (
                  <EnhancedProfileCard
                    key={profile._id}
                    profile={profile}
                    onLike={() => handleSwipe('right', profile._id)}
                    onDislike={() => handleSwipe('left', profile._id)}
                    isActive={index === currentIndex}
                    onNext={() => currentIndex < profiles.length - 1 && setCurrentIndex(currentIndex + 1)}
                    onPrevious={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Dumbbell size={48} className="text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No more profiles</h3>
                <p className="text-gray-500 mb-4">We couldn't find gym buddies matching your criteria.</p>
                <button 
                  onClick={fetchProfiles}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        );
      
      case 'matches':
        return (
          <div className="h-[calc(100vh-136px)] p-4 overflow-y-auto pb-16">
            <h2 className="text-xl font-bold mb-4">Your Matches</h2>
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map(match => (
                  <div key={match._id} className="bg-white rounded-lg shadow p-4 flex items-center">
                    <img 
                      src={match.profileImage || "/api/placeholder/50/50"} 
                      alt={match.name} 
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold">{match.name}, {match.age}</h3>
                      <p className="text-sm text-gray-500">{match.bio?.substring(0, 50)}...</p>
                    </div>
                    <button className="p-2 bg-blue-100 rounded-full text-blue-500">
                      <MessageCircle size={24} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Heart size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">No matches yet. Keep swiping!</p>
              </div>
            )}
          </div>
        );
      
      case 'shop':
        return (
          <div className="h-[calc(100vh-136px)] p-4 overflow-y-auto pb-16">
            <h2 className="text-xl font-bold mb-4">Fitness Shop</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 1, name: 'Premium Membership', price: 9.99, image: '/api/placeholder/150/150' },
                { id: 2, name: 'Workout Plan', price: 29.99, image: '/api/placeholder/150/150' },
                { id: 3, name: 'Nutrition Guide', price: 19.99, image: '/api/placeholder/150/150' },
                { id: 4, name: 'Personal Coach', price: 49.99, image: '/api/placeholder/150/150' }
              ].map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">${item.price}</span>
                      <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
        case 'profile':
  return (
    <div className="h-full mb-10 overflow-y-auto">
      {/* Import and use the TinderStyleGymBrosProfile component */}
      <EnhancedGymBrosProfile
        userProfile={userProfile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
      default:
        return null;
    }
  };

  return (
    <>
      <FooterHider />
      <div className="max-w-xl mx-auto flex flex-col ">
        {/* Dynamic Header Bar - Positioned right under the main navbar */}
        <div className="sticky top-16 left-0 right-0 z-10">
          <div className="max-w-xl mx-auto">
            {renderHeader()}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 relative bg-gray-50">
          {renderTabContent()}
        </div>
        
        {/* Fixed Navigation Tabs */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20">
          <div className="max-w-xl mx-auto px-6 py-3 flex justify-between items-center">
            <button 
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center p-2 ${
                activeTab === 'discover' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <Heart size={24} />
              <span className="text-xs mt-1">Discover</span>
            </button>
            
            <button 
              onClick={() => {
                fetchMatches();
                setActiveTab('matches');
              }}
              className={`flex flex-col items-center p-2 ${
                activeTab === 'matches' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <MessageCircle size={24} />
              <span className="text-xs mt-1">Matches</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('shop')}
              className={`flex flex-col items-center p-2 ${
                activeTab === 'shop' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <ShoppingBag size={24} />
              <span className="text-xs mt-1">Shop</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center p-2 ${
                activeTab === 'profile' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <User size={24} />
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <GymBrosFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleFilterChange}
      />
      
      <GymBrosSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userProfile={userProfile}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  );
};

export default GymBros;