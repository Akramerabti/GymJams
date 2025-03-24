import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Heart, X, MessageCircle, Filter, Dumbbell, UserPlus, 
  Calendar, MapPin, Settings, ShoppingBag, User,
  ChevronLeft, ChevronRight, Edit, Sun, Moon, LogIn
} from 'lucide-react';

// Import auth and GymBros context
import useAuthStore from '../stores/authStore';
import { useGuestFlow } from '../components/gymBros/components/GuestFlowContext';
import gymbrosService from '../services/gymbros.service';

// Import components
import DiscoverTab from '../components/gymBros/components/DiscoverTab';
import GymBrosSetup from '../components/gymBros/GymBrosSetup';
import GymBrosFilters from '../components/gymBros/GymBrosFilters';
import GymBrosSettings from '../components/gymBros/GymBrosSettings';
import EnhancedGymBrosProfile from '../components/gymBros/ProfileEditor';
import GymBrosShop from '../components/gymBros/GymBrosShop';
import { Link } from 'react-router-dom';

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
  // Auth and guest flow state
  const { user, isAuthenticated } = useAuthStore();
  const { 
    isGuest, 
    guestProfile, 
    loading: guestLoading, 
    fetchGuestProfile,
    createGuestProfile,
    verifiedPhone,
    clearGuestState
  } = useGuestFlow();
  
  // Component state
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
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

  // Initialize dark mode from localStorage or system preference
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

  // Check for user profile when the component loads
  useEffect(() => {
    if (isAuthenticated || isGuest || verifiedPhone) {
      checkUserProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, isGuest, verifiedPhone, guestProfile]);

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
      // Get main navbar height (assuming it's a fixed size)
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

  useEffect(() => {
    const handleNavigateToMatches = (event) => {
      // Switch to the matches tab
      setActiveTab('matches');
      
      // Refresh matches to ensure the new match is included
      fetchMatches();
      
      // Optionally scroll to or highlight the new match
      const matchedProfileId = event.detail?.matchedProfile?._id;
      if (matchedProfileId) {
        // You could set a state to indicate which match to highlight
        // Or use DOM methods to scroll to the match element
        setTimeout(() => {
          const matchElement = document.getElementById(`match-${matchedProfileId}`);
          if (matchElement) {
            matchElement.scrollIntoView({ behavior: 'smooth' });
            matchElement.classList.add('highlight-match'); // Add a CSS class for highlighting
            setTimeout(() => {
              matchElement.classList.remove('highlight-match');
            }, 3000);
          }
        }, 300);
      }
    };
    
    window.addEventListener('navigateToMatches', handleNavigateToMatches);
    
    return () => {
      window.removeEventListener('navigateToMatches', handleNavigateToMatches);
    };
  }, []);

  
  const checkUserProfile = async () => {
    try {
      setLoading(true);
  
      debugGuestToken();
      
      // If user is authenticated, check via regular API
      if (isAuthenticated) {
        console.log('[GymBros] Checking profile for authenticated user');
        const response = await gymbrosService.getGymBrosProfile();
        
        if (response.hasProfile) {
          setHasProfile(true);
          setUserProfile(response.profile);
          
          // Initialize filters from profile preferences
          const initialFilters = {
            workoutTypes: [],
            experienceLevel:  'Any',
            preferredTime: 'Any',
            genderPreference: 'All',
            ageRange: { 
              min: 18, 
              max: 99 
            },
            maxDistance: 50
          };
          
          // Set filters state for UI
          console.log('[GymBros] Setting initial filters from profile:', initialFilters);
          setFilters(initialFilters);
          
          // IMPORTANT: Use filters directly rather than relying on state to update
          await fetchProfilesWithFilters(initialFilters);
          fetchMatches();
        } else {
          console.log('[GymBros] No profile found for authenticated user, showing setup');
          setHasProfile(false);
          setUserProfile(null);
        }
      } 
      // If user is a guest, use the guest profile
      else if (isGuest) {
        console.log('[GymBros] Checking profile for guest user');
        
        try {
          const response = await gymbrosService.getGymBrosProfile();
          
          if (response.hasProfile) {
            console.log('[GymBros] Found profile for guest');
            setHasProfile(true);
            setUserProfile(response.profile);
            
            // Initialize filters from guest profile 
            const initialFilters = {
              workoutTypes: [],
              experienceLevel:'Any',
              preferredTime: 'Any',
              genderPreference: 'All',
              ageRange: { 
                min: 18, 
                max: 99 
              },
              maxDistance: 50
            };
            
            // Set filters state for UI
            console.log('[GymBros] Setting initial filters from profile:', initialFilters);
            setFilters(initialFilters);
            
            // Fetch profiles and matches - Use direct values
            await fetchProfilesWithFilters(initialFilters);
            fetchMatches();
          } else {
            console.log('[GymBros] No profile found for guest, showing setup');
            setHasProfile(false);
            setUserProfile(null);
          }
        } catch (guestError) {
          console.error('[GymBros] Error checking guest profile:', guestError);
          
          // If there was an authentication error, check if we need to fetch the guest profile
          if (guestError.response?.status === 401) {
            // Try to refetch the guest profile in case the token wasn't properly applied
            await fetchGuestProfile();
            
            // Check if we now have a guest profile
            if (guestProfile) {
              setHasProfile(true);
              setUserProfile(guestProfile);
              
              // Initialize filters from guest profile
              const initialFilters = {
                workoutTypes: guestProfile.workoutTypes || [],
                experienceLevel: guestProfile.experienceLevel || 'Any',
                preferredTime: guestProfile.preferredTime || 'Any',
                genderPreference: guestProfile.genderPreference || 'All',
                ageRange: { 
                  min: guestProfile.ageRange?.min || 18, 
                  max: guestProfile.ageRange?.max || 99 
                },
                maxDistance: guestProfile.maxDistance || 50
              };
              
              // Set filters for UI updates
              console.log('[GymBros] Setting initial filters from profile:', initialFilters);
              setFilters(initialFilters);
              
              // Fetch profiles and matches - Use direct values
              await fetchProfilesWithFilters(initialFilters);
              fetchMatches();
            } else {
              setHasProfile(false);
              setUserProfile(null);
            }
          } else {
            setHasProfile(false);
            setUserProfile(null);
          }
        }
      }
      // If user has a verified phone but no profile yet
      else if (verifiedPhone) {
        console.log('[GymBros] User has verified phone but no profile yet');
        setHasProfile(false);
        setUserProfile(null);
      }
      // Check for a guest token in localStorage that might not be loaded into context yet
      else {
        const guestToken = localStorage.getItem('gymbros_guest_token');
        if (guestToken) {
          console.log('[GymBros] Found guest token in storage, loading guest profile');
          
          // Set the token explicitly
          gymbrosService.setGuestToken(guestToken);
          
          try {
            // Try to fetch the guest profile using the token
            await fetchGuestProfile();
            
            // Check if we got a profile
            if (guestProfile) {
              setHasProfile(true);
              setUserProfile(guestProfile);
              
              // Initialize filters from guest profile
              const initialFilters = {
                workoutTypes: guestProfile.workoutTypes || [],
                experienceLevel: guestProfile.experienceLevel || 'Any',
                preferredTime: guestProfile.preferredTime || 'Any',
                genderPreference: guestProfile.genderPreference || 'All',
                ageRange: { 
                  min: guestProfile.ageRange?.min || 18, 
                  max: guestProfile.ageRange?.max || 99 
                },
                maxDistance: guestProfile.maxDistance || 50
              };
              
              // Set filters for UI
              console.log('[GymBros] Setting initial filters from profile:', initialFilters);
              setFilters(initialFilters);
              
              // Fetch profiles and matches - Use direct values
              await fetchProfilesWithFilters(initialFilters);
              fetchMatches();
            } else {
              console.log('[GymBros] Guest token exists but no profile found');
              setHasProfile(false);
              setUserProfile(null);
              setShowLoginPrompt(true);
            }
          } catch (tokenError) {
            console.error('[GymBros] Error using stored guest token:', tokenError);
            
            // Check if token is invalid
            if (tokenError.response?.status === 401) {
              console.log('[GymBros] Guest token is invalid, clearing');
              gymbrosService.clearGuestState();
            }
            
            setHasProfile(false);
            setUserProfile(null);
            setShowLoginPrompt(true);
          }
        } else {
          // No user context at all
          console.log('[GymBros] No user context, showing login prompt');
          setHasProfile(false);
          setUserProfile(null);
          setShowLoginPrompt(true);
        }
      }
    } catch (error) {
      console.error('[GymBros] Error checking profile:', error);
      setHasProfile(false);
      setUserProfile(null);
      
      // Show login prompt if completely unauthenticated
      if (!isAuthenticated && !isGuest && !verifiedPhone) {
        setShowLoginPrompt(true);
      }
    } finally {
      setLoading(false);
    }
  };  
  
  // Initialize filters from profile
  const initializeFiltersFromProfile = (profile) => {
    if (profile) {
      console.log('[GymBros] Setting initial filters from profile');
      
      const initialFilters = {
        workoutTypes: profile.workoutTypes || [],
        experienceLevel: profile.experienceLevel || 'Any',
        preferredTime: profile.preferredTime || 'Any',
        genderPreference: profile.genderPreference || 'All',
        ageRange: { 
          min: profile.ageRange?.min || 18, 
          max: profile.ageRange?.max || 99 
        },
        maxDistance: profile.maxDistance || 50
      };
      
      console.log('[GymBros] Initial filters:', initialFilters);
      setFilters(initialFilters);
    }
  };

  function debugGuestToken() {
    const guestToken = localStorage.getItem('gymbros_guest_token');
    console.log('Current guest token:', guestToken ? guestToken.substring(0, 15) + '...' : 'none');
    
    if (guestToken) {
      // Try to decode the token (not secure, just for debugging)
      try {
        const base64Url = guestToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    
        console.log('Decoded token payload:', JSON.parse(jsonPayload));
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    // Check other related storage
    console.log('Verified phone:', localStorage.getItem('verifiedPhone'));
    console.log('Verification token:', localStorage.getItem('verificationToken')?.substring(0, 15) + '...');
    console.log('Auth token:', localStorage.getItem('token')?.substring(0, 15) + '...');
  }
  
  const fetchProfiles = async () => {
    try {
      console.log('[GymBros] Fetching profiles with filters:', filters);
      setLoading(true);
      
      // Use the service function to get recommended profiles
      const fetchedProfiles = await gymbrosService.getRecommendedProfiles(filters);
      
      // Add detailed logging
      console.log('[GymBros] Received profiles:', fetchedProfiles.length, 
        fetchedProfiles.map(p => ({id: p._id || p.id, name: p.name})));
      
      if (Array.isArray(fetchedProfiles) && fetchedProfiles.length > 0) {
        setProfiles(fetchedProfiles);
        setCurrentIndex(0);
      } else {
        console.warn('[GymBros] Received empty profiles array or invalid data:', fetchedProfiles);
        setProfiles([]);
      }
    } catch (error) {
      console.error('[GymBros] Error fetching profiles:', error);
      
      // If 401 error and we have a guest token, try refreshing the guest state
      if (error.response?.status === 401 && gymbrosService.getGuestToken()) {
        console.log('[GymBros] Authentication error, attempting to refresh guest state');
        
        try {
          // Try to refresh the guest profile
          await fetchGuestProfile();
          
          // Try fetching profiles again
          const retryProfiles = await gymbrosService.getRecommendedProfiles(filters);
          
          if (Array.isArray(retryProfiles) && retryProfiles.length > 0) {
            console.log('[GymBros] Retry successful, got', retryProfiles.length, 'profiles');
            setProfiles(retryProfiles);
            setCurrentIndex(0);
          } else {
            console.warn('[GymBros] Retry returned empty or invalid profiles');
            setProfiles([]);
          }
        } catch (retryError) {
          console.error('[GymBros] Error on retry fetch profiles:', retryError);
          toast.error('Failed to load gym profiles');
          setProfiles([]);
        }
      } else {
        toast.error('Failed to load gym profiles');
        setProfiles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      console.log('[GymBros] Fetching matches');
      // Use the service function to get matches
      const matchesData = await gymbrosService.getMatches();
      
      console.log('[GymBros] Matches received:', matchesData.length);
      setMatches(matchesData);
    } catch (error) {
      console.error('[GymBros] Error fetching matches:', error);
      
      // If 401 error and we have a guest token, try refreshing the guest state
      if (error.response?.status === 401 && gymbrosService.getGuestToken()) {
        console.log('[GymBros] Authentication error, attempting to refresh guest state');
        
        try {
          // Try to refresh the guest profile
          await fetchGuestProfile();
          
          // Try fetching matches again
          const retryMatches = await gymbrosService.getMatches();
          setMatches(retryMatches);
        } catch (retryError) {
          console.error('[GymBros] Error on retry fetch matches:', retryError);
          toast.error('Failed to load matches');
        }
      } else {
        toast.error('Failed to load matches');
      }
    }
  };


  const handleProfileCreated = (profile) => {
    console.log('[GymBros] New profile created:', profile);
    setUserProfile(profile);
    setHasProfile(true);
    
    // Initialize filters from newly created profile
    setFilters({
      workoutTypes:  [],
      experienceLevel: 'Any',
      preferredTime:  'Any',
      genderPreference: 'All',  
      ageRange: { min: 18, max: 99 },  
      maxDistance: 50  
    });
    
    // IMPORTANT: Ensure guest token is saved if included in response
    if (profile.guestToken) {
      gymbrosService.setGuestToken(profile.guestToken);
      console.log('[GymBros] Saved guest token from profile creation:', profile.guestToken);
    }
    
    // Slight delay to ensure token is properly set in headers before making new requests
    setTimeout(() => {
      fetchProfiles();
    }, 500);
  };

  const fetchProfilesWithFilters = async (filterValues) => {
    try {
      console.log('[GymBros] Fetching profiles with filters:', filterValues);
      setLoading(true);
      
      // Use the provided filter values directly 
      const fetchedProfiles = await gymbrosService.getRecommendedProfiles(filterValues);
      
      console.log('[GymBros] Received profiles:', fetchedProfiles.length, 
        fetchedProfiles.map(p => ({id: p._id || p.id, name: p.name})));
      
      if (Array.isArray(fetchedProfiles) && fetchedProfiles.length > 0) {
        setProfiles(fetchedProfiles);
        setCurrentIndex(0);
      } else {
        console.warn('[GymBros] Received empty profiles array or invalid data:', fetchedProfiles);
        setProfiles([]);
      }
    } catch (error) {
      console.error('[GymBros] Error fetching profiles:', error);
      
      // If 401 error and we have a guest token, try refreshing the guest state
      if (error.response?.status === 401 && gymbrosService.getGuestToken()) {
        console.log('[GymBros] Authentication error, attempting to refresh guest state');
        
        try {
          // Try to refresh the guest profile
          await fetchGuestProfile();
          
          // Try fetching profiles again
          const retryProfiles = await gymbrosService.getRecommendedProfiles(filterValues);
          
          if (Array.isArray(retryProfiles) && retryProfiles.length > 0) {
            console.log('[GymBros] Retry successful, got', retryProfiles.length, 'profiles');
            setProfiles(retryProfiles);
            setCurrentIndex(0);
          } else {
            console.warn('[GymBros] Retry returned empty or invalid profiles');
            setProfiles([]);
          }
        } catch (retryError) {
          console.error('[GymBros] Error on retry fetch profiles:', retryError);
          toast.error('Failed to load gym profiles');
          setProfiles([]);
        }
      } else {
        toast.error('Failed to load gym profiles');
        setProfiles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    console.log('[GymBros] Filters updated:', newFilters);
    setFilters(newFilters);
    setShowFilters(false);
    
    // Also update user preferences in the database
    updateUserPreferences(newFilters);
    
    // Use helper function with the new filters directly
    fetchProfilesWithFilters(newFilters);
  };
  
  const updateUserPreferences = async (newFilters) => {
    try {
      console.log('[GymBros] Updating user preferences with new filters:', newFilters);
      
      // Use the service function to update preferences
      await gymbrosService.updateUserPreferences({
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
  
  const handleProfileUpdated = async (updatedData) => {
    console.log('[GymBros] Data updated:', updatedData);
    
    // Don't directly set userProfile to the settings data
    // Instead, merge it with the existing profile or fetch the complete profile
    
    if (updatedData) {
      // Option 1: Merge with existing profile (preserves all fields)
      setUserProfile(prevProfile => ({
        ...prevProfile,  // Keep all existing profile data
        ...updatedData   // Update with new settings data
      }));
      
      // Option 2 (more reliable): Refetch the complete profile
      // This ensures we have the latest data from the server
      try {
        // Fetch the full profile again
        await checkUserProfile();
        console.log('[GymBros] Profile refreshed after update');
      } catch (error) {
        console.error('[GymBros] Error refreshing profile:', error);
        toast.error('Profile updated but display may be incomplete');
      }
    }
    
    setShowSettings(false);
    
    // Refresh profiles with updated preferences
    fetchProfiles();
  };

  // Handle logging in as a guest (phone verification path)
  const handleGuestStart = () => {
    // Reset any existing guest state
    clearGuestState();
    setShowLoginPrompt(false);
    setActiveTab('discover');
  };

  // Login prompt for unauthenticated users
  const renderLoginPrompt = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <Dumbbell size={64} className="text-blue-500 mb-6" />
      <h2 className="text-2xl font-bold mb-4">Find Your Perfect Gym Partner</h2>
      <p className="mb-8 text-gray-600">
        Connect with people who share your fitness goals and schedule. Get started by creating a profile or logging in.
      </p>
      
      <div className="space-y-4 w-full max-w-xs">
        <Link to="/login" className="w-full block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          <LogIn className="inline-block mr-2 h-5 w-5" />
          Log In
        </Link>
        
        <Link to="/register" className="w-full block bg-gray-100 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors">
          <UserPlus className="inline-block mr-2 h-5 w-5" />
          Create Account
        </Link>
        
        <button
          onClick={handleGuestStart}
          className="w-full block bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Continue with Phone Number
        </button>
      </div>
      
      <p className="mt-6 text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );

  // Render the GymBros header with tab navigation and action buttons
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

  // Render different content based on the user's state and active tab
  if (loading || guestLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <Dumbbell size={48} className="text-blue-500 animate-bounce mb-4" />
          <p className="text-lg font-medium">Loading Gym Partners...</p>
        </div>
      </div>
    );
  }

  // If no user context (authenticated, guest or verified phone), show login prompt
  if (showLoginPrompt && !isAuthenticated && !isGuest && !verifiedPhone) {
    return renderLoginPrompt();
  }

  // For authenticated/verified/guest users without a profile, show the profile setup form
  if (!hasProfile) {
    console.log('[GymBros] User has no profile, showing setup form');
    return <GymBrosSetup onProfileCreated={handleProfileCreated} />;
  }

  // Different content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'discover':
      console.log('[GymBros] Rendering DiscoverTab with', profiles.length, 'profiles, currentIndex:', currentIndex);
      return (
        <div className="h-[calc(100vh-136px)] overflow-hidden relative">
        <DiscoverTab
          fetchProfiles={fetchProfiles}
          loading={loading}
          filters={filters}
          setShowFilters={setShowFilters}
          distanceUnit="miles"
          isPremium={false}
          initialProfiles={profiles}
          initialIndex={currentIndex}
          userProfile={userProfile}
          onNavigateToMatches={(matchedProfile) => {
            // Switch to matches tab
            setActiveTab('matches');
            
            // Refresh matches
            fetchMatches();
          }}
        />
      </div>
    
      );

      case 'matches':
        return (
          <div className="h-[calc(100vh-136px)] overflow-y-auto pb-16">
            <h2 className="text-xl font-bold mb-4 p-4">Your Matches</h2>
            {matches.length > 0 ? (
              <div className="space-y-4 px-4">
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
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Heart size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">No matches yet. Keep swiping!</p>
              </div>
            )}
          </div>
        );
      
      case 'shop':
        return (
          <div className="h-[calc(100vh-136px)] overflow-y-auto pb-16">
            <GymBrosShop />
          </div>
        );
      
      case 'profile':
        return (
          <div className="h-[calc(100vh-136px)] overflow-y-auto pb-16">
            <EnhancedGymBrosProfile
              userProfile={userProfile}
              onProfileUpdated={handleProfileUpdated}
              isGuest={isGuest}
            />
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // The main return part of the GymBros component, focused on the layout structure
  return (
    <>
      <FooterHider />
      <div className="max-w-xl mx-auto flex flex-col h-full">
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
        filters={filters}
        isGuest={isGuest}
      />
    </>
  );
 
};

export default GymBros;