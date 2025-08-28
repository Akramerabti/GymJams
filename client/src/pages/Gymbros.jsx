import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Heart, X, MessageCircle, Filter, Dumbbell, UserPlus, 
  Calendar, MapPin, Settings, ShoppingBag, User,
  ChevronLeft, ChevronRight, Edit, LogIn
} from 'lucide-react';

import useAuthStore from '../stores/authStore';
import { useGuestFlow } from '../components/gymBros/components/GuestFlowContext';
import gymbrosService from '../services/gymbros.service';
import useApiOptimization from '../hooks/useApiOptimization';
import gymBrosLocationService from '../services/gymBrosLocation.service';
import useGymBrosData from '../hooks/useGymBrosData';

import DiscoverTab from '../components/gymBros/components/DiscoverTab';
import GymBrosSetup from '../components/gymBros/GymBrosSetup';
import GymBrosFilters from '../components/gymBros/GymBrosFilters';
import GymBrosSettings from '../components/gymBros/GymBrosSettings';
import EnhancedGymBrosProfile from '../components/gymBros/ProfileEditor';
import GymBrosShop from '../components/gymBros/GymBrosShop';
import GymBrosMatchesList from '../components/gymBros/GymbrosMatchesList';
import GymBrosMap from '../components/gymBros/GymBrosMap';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const FooterHider = () => {
  const location = useLocation();
  
  useEffect(() => {
    document.body.classList.add('hide-footer');
    document.documentElement.classList.add('hide-footer');
    
    const footers = document.querySelectorAll('footer, [role="contentinfo"]');
    footers.forEach(footer => {
      footer.style.display = 'none';
      footer.style.visibility = 'hidden';
      footer.style.height = '0';
      footer.style.overflow = 'hidden';
      footer.style.opacity = '0';
      footer.style.pointerEvents = 'none';
    });
    
    const event = new CustomEvent('footerHidden', { detail: true });
    window.dispatchEvent(event);
    
    return () => {
      document.body.classList.remove('hide-footer');
      document.documentElement.classList.remove('hide-footer');
      
      const footers = document.querySelectorAll('footer, [role="contentinfo"]');
      footers.forEach(footer => {
        footer.style.display = '';
        footer.style.visibility = '';
        footer.style.height = '';
        footer.style.overflow = '';
        footer.style.opacity = '';
        footer.style.pointerEvents = '';
      });
      
      const event = new CustomEvent('footerShown', { detail: false });
      window.dispatchEvent(event);
    };
  }, [location.pathname]);
  
  return null;
};

const GymBros = () => {
  const { user, isAuthenticated } = useAuthStore();

  const [profiles, setProfiles] = useState([]);
const [currentIndex, setCurrentIndex] = useState(0);

   const { 
    profiles: sharedProfiles, 
    invalidate,
    clearCache 
  } = useGymBrosData();

  const { 
    isGuest, 
    guestProfile, 
    loading: guestLoading, 
    fetchGuestProfile,
    createGuestProfile,
    verifiedPhone,
    clearGuestState
  } = useGuestFlow();
  
  const { optimizedApiCall } = useApiOptimization();
  ;
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [matches, setMatches] = useState([]);
  const [viewStartTime, setViewStartTime] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [filters, setFilters] = useState({
    workoutTypes: [],
    experienceLevel: 'Any',
    preferredTime: 'Any',
    genderPreference: 'All',
    ageRange: { min: 18, max: 99 },
    maxDistance: 50
  });
  const [userModelProfile, setUserModelProfile] = useState(null); // User model data
  const [gymBrosProfile, setGymBrosProfile] = useState(null);

  const [userProfile, setUserProfile] = useState(null)

// Add these state variables at the top of your GymBros component
const [initializationComplete, setInitializationComplete] = useState(false);
const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    if (hasProfile) {
      setActiveTab('map');
    } else {
      setActiveTab('discover');
    }
  }, [hasProfile]);

useEffect(() => {
  console.log('🚀 GymBros initialization:', { 
    isAuthenticated, 
    isGuest, 
    verifiedPhone, 
    guestLoading,
    guestToken: !!localStorage.getItem('gymbros_guest_token'),
    verificationToken: !!localStorage.getItem('verificationToken')
  });

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Case 1: Authenticated user
      if (isAuthenticated) {
        console.log('👤 Authenticated user, clearing guest state');
        clearGuestState();
        await initializeWithSingleCall();
        setInitializationComplete(true); // ✅ ADD THIS
        return;
      }

      // Check what tokens we have immediately - don't wait for guest context
      const guestToken = localStorage.getItem('gymbros_guest_token');
      const verificationToken = localStorage.getItem('verificationToken');
      const verifiedPhoneLocal = localStorage.getItem('verifiedPhone');

      // Case 2: No tokens at all - show login immediately
      if (!guestToken && !verificationToken && !verifiedPhoneLocal) {
        console.log('❌ No authentication tokens found - show login immediately');
        setShowLoginPrompt(true);
        setLoading(false);
        setInitializationComplete(true); // ✅ ADD THIS
        return;
      }

      // Case 3: Has guest token - test it directly
      if (guestToken) {
        console.log('🎫 Found guest token, testing directly');
        gymbrosService.setGuestToken(guestToken);
        
        try {
          const response = await gymbrosService.getGymBrosProfile();
          
          if (response.hasProfile) {
            console.log('✅ Guest has profile');
            setHasProfile(true);
            setShowLoginPrompt(false);
          } else {
            console.log('📝 Guest token valid but no profile - show setup');
            setHasProfile(false);
            setShowLoginPrompt(false);
          }
        } catch (error) {
          console.error('❌ Guest token test failed:', error);
          
          // Clear invalid token
          if (error.response?.status === 401 || error.response?.status === 429) {
            localStorage.removeItem('gymbros_guest_token');
            gymbrosService.clearGuestState();
          }
          
          setShowLoginPrompt(true);
        }
        
        setLoading(false);
        setInitializationComplete(true); // ✅ ADD THIS
        return;
      }

      // Case 4: Has verification token but no guest token
      if (verificationToken && verifiedPhoneLocal) {
        console.log('📱 Found verification token, checking profile');
        
        try {
          const response = await gymbrosService.checkProfileWithVerifiedPhone(
            verifiedPhoneLocal,
            verificationToken
          );
          
          if (response.guestToken) {
            gymbrosService.setGuestToken(response.guestToken);
            localStorage.setItem('gymbros_guest_token', response.guestToken);
            
            if (response.profile) {
              setHasProfile(true);
              setShowLoginPrompt(false);
            } else {
              setHasProfile(false);
              setShowLoginPrompt(false);
            }
          } else {
            setShowLoginPrompt(true);
          }
        } catch (error) {
          console.error('❌ Verification token check failed:', error);
          setShowLoginPrompt(true);
        }
        
        setLoading(false);
        setInitializationComplete(true); // ✅ ADD THIS
        return;
      }

      // Fallback - show login
      setShowLoginPrompt(true);
      setLoading(false);
      setInitializationComplete(true); // ✅ ADD THIS

    } catch (error) {
      console.error('❌ Error during initialization:', error);
      setShowLoginPrompt(true);
      setLoading(false);
      setInitializationComplete(true); // ✅ ADD THIS
    }
  };

  // Only initialize if not already attempted
  if (!initializationAttempted) {
    setInitializationAttempted(true);
    initializeApp();
  }
}, [isAuthenticated, initializationAttempted]); 

useEffect(() => {
  // Only process if initialization is not yet complete
  if (initializationComplete || !initializationAttempted) return;
  
  // If guest profile becomes available after initial load
  if (isGuest && guestProfile && !hasProfile) {
    console.log('✅ Guest profile became available after initialization');
    setUserProfile(guestProfile);
    setHasProfile(true);
    setLoading(false);
    setInitializationComplete(true);
  }
  
  // If guest loses profile
  if (isGuest && !guestProfile && !guestLoading && hasProfile) {
    console.log('📝 Guest profile was removed');
    setHasProfile(false);
    setUserProfile(null);
    setInitializationComplete(true);
  }
}, [isGuest, guestProfile, guestLoading, hasProfile, initializationComplete, initializationAttempted]);


   const combineProfiles = (userModel, gymBrosModel) => {

    ;
    if (!userModel && !gymBrosModel) return null;
    
    // For authenticated users: merge User + GymBrosProfile
    if (userModel && gymBrosModel) {
      return {
        ...userModel,           // User model data (location, avatar, etc.)
        ...gymBrosModel,        // GymBros data (gyms, workout preferences)
        isGuest: false,
        profileType: 'authenticated'
      };
    }
    
    // For guest users: only GymBrosProfile
    if (!userModel && gymBrosModel) {
      return {
        ...gymBrosModel,
        isGuest: true,
        profileType: 'guest'
      };
    }
    
    // Fallback: only User model
    return {
      ...userModel,
      gyms: [],
      primaryGym: null,
      isGuest: false,
      profileType: 'user-only'
    };
  };


  useEffect(() => {
    if (activeTab === 'discover' && hasProfile) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [activeTab, hasProfile]);

  useEffect(() => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      setViewStartTime(Date.now());
    }
  }, [currentIndex, profiles]);

  useEffect(() => {
    const handleNavigateToMatches = (event) => {
      setActiveTab('matches');
      clearCache('matches-with-preview');
      
      const matchedProfileId = event.detail?.matchedProfile?._id;
      if (matchedProfileId) {
        setTimeout(() => {
          const matchElement = document.getElementById(`match-${matchedProfileId}`);
          if (matchElement) {
            matchElement.scrollIntoView({ behavior: 'smooth' });
            matchElement.classList.add('highlight-match');
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
  }, [clearCache]);

   const initializeWithSingleCall = async () => {
  try {
    setLoading(true);
    
    console.log('🚀 === DUAL PROFILE INITIALIZATION ===');
    
    // Set guest token first
    const guestToken = localStorage.getItem('gymbros_guest_token');
    if (guestToken) {
      console.log('🎫 Setting guest token before API call');
      gymbrosService.setGuestToken(guestToken);
    }
    
    // STEP 1: Get initialization data (this gives us userModelProfile)
    console.log('📡 Fetching initialization data...');
    
    let initData;
    try {
      initData = await optimizedApiCall(
        'gymbros-init',
        () => gymbrosService.initializeGymBros(),
        {
          cacheTime: 10 * 60 * 1000,
          minInterval: 60 * 1000,
        }
      );
      console.log('📡 Init data received:', initData);
    } catch (initError) {
      console.error('❌ Error during initialization:', initError);
      
      // Handle different error cases
      if (initError.response?.status === 404) {
        console.log('🚨 Initialization returned 404 - user/guest has no profile');
        
        // If we have a guest token but got 404, they need to complete setup
        if (guestToken) {
          console.log('👤 Guest token exists but no profile, redirecting to setup');
          setHasProfile(false);
          setShowLoginPrompt(false);
          setLoading(false);
          return;
        }
        
        // No token and no profile - show login prompt
        setShowLoginPrompt(true);
        setLoading(false);
        return;
      }
      
      if (initError.response?.status === 401) {
        console.log('🔑 Unauthorized - clearing invalid tokens');
        gymbrosService.clearGuestState();
        localStorage.removeItem('gymbros_guest_token');
        setShowLoginPrompt(true);
        setLoading(false);
        return;
      }
      
      // Other errors
      console.error('❌ Unexpected initialization error:', initError);
      setShowLoginPrompt(true);
      setLoading(false);
      return;
    }
    
    // STEP 2: Store the user model profile
    let userModel = null;
    if (initData.hasProfile && initData.profile) {
      console.log('👤 Setting user model profile:', initData.profile);
      userModel = initData.profile;
      setUserModelProfile(initData.profile);
      setHasProfile(true);
    }
    
    // STEP 3: Fetch GymBrosProfile separately for gym associations
    console.log('🏋️ Fetching GymBrosProfile for gym data...');
    let gymBrosModel = null;
    
    try {
      const gymBrosResponse = await gymbrosService.getGymBrosProfile();
      console.log('🏋️ GymBros response:', gymBrosResponse);
      
      if (gymBrosResponse && gymBrosResponse.profile) {
        console.log('🏋️ Setting GymBros profile:', gymBrosResponse.profile);
        gymBrosModel = gymBrosResponse.profile;
        setGymBrosProfile(gymBrosResponse.profile);
      } else {
        console.log('🏋️ No GymBros profile found in response');
        setGymBrosProfile(null);
      }
    } catch (gymBrosError) {
      console.error('🏋️ Error fetching GymBros profile:', gymBrosError);
      
      if (gymBrosError.response?.status === 404) {
        console.log('🏋️ No GymBros profile exists yet (404) - normal for new users');
        
        // If we have a guest token but no profile, they need to complete setup
        if (guestToken && !userModel) {
          console.log('🚨 Guest token but no profiles found - redirect to setup');
          setHasProfile(false);
          setShowLoginPrompt(false);
          setLoading(false);
          return;
        }
      }
      
      setGymBrosProfile(null);
    }
    
    // STEP 4: Combine profiles for backwards compatibility
    const combinedProfile = combineProfiles(userModel, gymBrosModel);
    
    console.log('🔗 Combined profile:', combinedProfile);
    setUserProfile(combinedProfile);
    
    // STEP 5: Handle initialization results
    if (initData.hasProfile || gymBrosModel) {
      setHasProfile(true);
      
      if (initData.profiles?.length > 0) {
        setProfiles(initData.profiles);
        setCurrentIndex(0);
      }
      
      if (initData.matches?.length > 0) {
        setMatches(initData.matches);
      }
      
      console.log('✅ Profile initialization complete');
    } else {
      console.log('🚨 No profiles found - checking authentication state');
      setHasProfile(false);
      setUserModelProfile(null);
      
      // If we have guest token but no profile, show setup (not login prompt)
      if (guestToken) {
        console.log('👤 Guest token exists but no profile - show setup');
        setShowLoginPrompt(false);
      } else if (!isAuthenticated && !isGuest && !verifiedPhone) {
        console.log('❌ No authentication at all - show login prompt');
        setShowLoginPrompt(true);
      } else {
        console.log('🤔 Unclear state - show setup');
        setShowLoginPrompt(false);
      }
    }
    
  } catch (error) {
    console.error('❌ Error initializing profiles:', error);
    setHasProfile(false);
    setUserModelProfile(null);
    setGymBrosProfile(null);
    setUserProfile(null);
    
    // Check if we have a guest token - if so, show setup, not login
    const guestToken = localStorage.getItem('gymbros_guest_token');
    if (guestToken) {
      console.log('👤 Error but guest token exists - show setup');
      setShowLoginPrompt(false);
    } else if (!isAuthenticated && !isGuest && !verifiedPhone) {
      setShowLoginPrompt(true);
    }
  } finally {
    setLoading(false);
  }
};

  const refreshProfiles = async () => {
  console.log('🔄 Refreshing both profiles...');
  
  try {
    let userModel = null;
    let gymBrosModel = null;
    
    // Refresh User model profile
    try {
      const initData = await gymbrosService.initializeGymBros();
      if (initData.hasProfile && initData.profile) {
        userModel = initData.profile;
        setUserModelProfile(initData.profile);
      }
    } catch (error) {
      console.error('Error refreshing user model:', error);
    }
    
    // Refresh GymBros profile
    try {
      const gymBrosResponse = await gymbrosService.getGymBrosProfile();
      if (gymBrosResponse && gymBrosResponse.profile) {
        gymBrosModel = gymBrosResponse.profile;
        setGymBrosProfile(gymBrosResponse.profile);
      }
    } catch (error) {
      console.error('Error refreshing GymBros profile:', error);
      // 404 is normal if no GymBros profile exists
      if (error.response?.status !== 404) {
        console.error('Unexpected error refreshing GymBros profile:', error);
      }
    }
    
    // Recombine profiles
    const combinedProfile = combineProfiles(userModel, gymBrosModel);
    setUserProfile(combinedProfile);
    
    console.log('✅ Profiles refreshed successfully');
    console.log('🔗 New combined profile:', combinedProfile);
    
  } catch (error) {
    console.error('❌ Error refreshing profiles:', error);
  }
};

  const checkUserProfile = async () => {
    await initializeWithSingleCall();
  };

  function debugGuestToken() {
    const guestToken = localStorage.getItem('gymbros_guest_token');
    
    if (guestToken) {
      try {
        const base64Url = guestToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
      } catch (error) {}
    }
  }

  const fetchProfiles = async () => {
  try {
    setLoading(true);
    
    const fetchedProfiles = await optimizedApiCall(
      'recommended-profiles',
      () => gymbrosService.getRecommendedProfiles(filters),
      {
        cacheTime: 5 * 60 * 1000,
        minInterval: 30 * 1000,
      }
    );
    
    if (Array.isArray(fetchedProfiles) && fetchedProfiles.length > 0) {
      setProfiles(fetchedProfiles);
      setCurrentIndex(0);
    } else {
      setProfiles([]);
    }
  } catch (error) {
    console.error('Error fetching profiles:', error);
    
    // CRITICAL FIX: Handle 404 for guests - means they have token but no profile
    if (error.response?.status === 404) {
      console.log('🚨 404 error - Guest has token but no profile, redirecting to setup');
      
      // If user is a guest and gets 404, they need to complete setup
      if (isGuest || gymbrosService.getGuestToken()) {
        console.log('👤 Guest user without profile detected, clearing hasProfile flag');
        setHasProfile(false); // This will trigger the setup flow
        setShowLoginPrompt(false);
        return; // Exit early to show setup
      }
      
      // For authenticated users, this is unexpected
      if (isAuthenticated) {
        console.error('⚠️ Authenticated user got 404 - this is unexpected');
        toast.error('Profile not found. Please contact support.');
        return;
      }
      
      // For unauthenticated users without guest token, show login
      setShowLoginPrompt(true);
      return;
    }
    
    // Handle 401 errors (token expired/invalid)
    if (error.response?.status === 401 && gymbrosService.getGuestToken()) {
      console.log('🔑 Guest token expired, attempting refresh');
      try {
        await fetchGuestProfile();
        
        clearCache('recommended-profiles');
        const retryProfiles = await optimizedApiCall(
          'recommended-profiles',
          () => gymbrosService.getRecommendedProfiles(filters),
          {
            bypassCache: true,
            minInterval: 0,
          }
        );
        
        if (Array.isArray(retryProfiles) && retryProfiles.length > 0) {
          setProfiles(retryProfiles);
          setCurrentIndex(0);
        } else {
          setProfiles([]);
        }
      } catch (retryError) {
        console.error('Error on retry fetch profiles:', retryError);
        
        // If retry also fails with 404, redirect to setup
        if (retryError.response?.status === 404) {
          console.log('🚨 Retry also returned 404, guest needs setup');
          setHasProfile(false);
          setShowLoginPrompt(false);
        } else {
          toast.error('Failed to load gym profiles');
          setProfiles([]);
        }
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
      const matchesData = await gymbrosService.getMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
      
      if (error.response?.status === 401 && gymbrosService.getGuestToken()) {
        try {
          await fetchGuestProfile();
          const retryMatches = await gymbrosService.getMatches();
          setMatches(retryMatches);
        } catch (retryError) {
          console.error('Error on retry fetch matches:', retryError);
          toast.error('Failed to load matches');
        }
      } else {
        toast.error('Failed to load matches');
      }
    }
  };

   const handleProfileCreated = async (profile) => {
    console.log('🎉 Profile created:', profile);
    
    // This creates a GymBrosProfile, so store it appropriately
    setGymBrosProfile(profile);
    setHasProfile(true);
    
    // If authenticated user, try to get their User model data
    if (isAuthenticated) {
      try {
        const initData = await gymbrosService.initializeGymBros();
        if (initData.hasProfile && initData.profile) {
          setUserModelProfile(initData.profile);
        }
      } catch (error) {
        console.error('Error fetching user model after profile creation:', error);
      }
    }
    
    // Combine profiles
    const combinedProfile = combineProfiles(userModelProfile, profile);
    setUserProfile(combinedProfile);
    
    // Set filters and fetch profiles
    setFilters({
      workoutTypes: [],
      experienceLevel: 'Any',
      preferredTime: 'Any',
      genderPreference: 'All',
      ageRange: { min: 18, max: 99 },
      maxDistance: 50
    });
    
    if (profile.guestToken) {
      gymbrosService.setGuestToken(profile.guestToken);
    }
    
    setTimeout(() => {
      fetchProfiles();
    }, 500);
  };

  const fetchProfilesWithFilters = async (filterValues) => {
    try {
      setLoading(true);
      
      clearCache('recommended-profiles');
      
      const cacheKey = `recommended-profiles-${JSON.stringify(filterValues)}`;
      const fetchedProfiles = await optimizedApiCall(
        cacheKey,
        () => gymbrosService.getRecommendedProfiles(filterValues),
        {
          cacheTime: 5 * 60 * 1000,
          minInterval: 30 * 1000,
        }
      );
      
      if (Array.isArray(fetchedProfiles) && fetchedProfiles.length > 0) {
        setProfiles(fetchedProfiles);
        setCurrentIndex(0);
      } else {
        setProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      
      if (error.response?.status === 401 && gymbrosService.getGuestToken()) {
        try {
          await fetchGuestProfile();
          
          const retryProfiles = await gymbrosService.getRecommendedProfiles(filterValues);
          
          if (Array.isArray(retryProfiles) && retryProfiles.length > 0) {
            setProfiles(retryProfiles);
            setCurrentIndex(0);
          } else {
            setProfiles([]);
          }
        } catch (retryError) {
          console.error('Error on retry fetch profiles:', retryError);
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
    setFilters(newFilters);
    setShowFilters(false);
    
    updateUserPreferences(newFilters);
    
    clearCache('recommended-profiles');
    
    fetchProfilesWithFilters(newFilters);
  };

  const updateUserPreferences = async (newFilters) => {
    try {
      await optimizedApiCall(
        `update-preferences-${JSON.stringify(newFilters)}`,
        () => gymbrosService.updateUserPreferences({
          workoutTypes: newFilters.workoutTypes,
          experienceLevel: newFilters.experienceLevel !== 'Any' ? newFilters.experienceLevel : undefined,
          preferredTime: newFilters.preferredTime !== 'Any' ? newFilters.preferredTime : undefined,
          genderPreference: newFilters.genderPreference !== 'All' ? newFilters.genderPreference : undefined,
          ageRange: newFilters.ageRange,
          maxDistance: newFilters.maxDistance
        }),
        {
          cacheTime: 0,
          minInterval: 10 * 1000,
        }
      );
    } catch (error) {
      console.error('Error updating user preferences:', error);
      toast.error('Failed to update preferences');
    }
  };
  
  const handleProfileUpdated = async (updatedData) => {
    console.log('🔄 Profile updated:', updatedData);
    
    if (updatedData) {
      // Update the appropriate profile
      if (updatedData.location || updatedData.avatar) {
        // This looks like User model data
        setUserModelProfile(prev => ({ ...prev, ...updatedData }));
      } else {
        // This looks like GymBros data
        setGymBrosProfile(prev => ({ ...prev, ...updatedData }));
      }
      
      // Recombine profiles
      const combinedProfile = combineProfiles(userModelProfile, gymBrosProfile);
      setUserProfile(combinedProfile);
    }
    
    setShowSettings(false);
    
    // Refresh profiles to ensure we have latest data
    await refreshProfiles();
    fetchProfiles();
  };

const renderHeader = () => {
  // Don't show header for matches and map sections
  if (activeTab === 'matches' || activeTab === 'map') {
    return null;
  }

  const headerTitle = (
    <h1 className="text-xl font-bold flex items-center">
      <Dumbbell className="mr-2 text-blue-500" />
      GymBros
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

      case 'shop':
        return (
          <div className="bg-white shadow-md py-3 px-4 flex justify-between items-center">
            {headerTitle}
            <button
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 relative"
            >
              <ShoppingBag size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        );

      case 'profile':
        return (
          <div className="bg-white shadow-md py-3 px-4 flex justify-between items-center">
            {headerTitle}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <Settings size={20} />
            </button>
          </div>
        );

      default:
        return (
          <div className="bg-white shadow-md py-3 px-4 flex justify-between items-center">
            {headerTitle}
          </div>
        );
    }
  })();

  return (
    <div className="w-full">
      {headerContent}
    </div>
  );
};

  const renderTabContent = () => {
    if (!hasProfile && activeTab === 'discover') {
      return <GymBrosSetup onProfileCreated={handleProfileCreated} />;
    }
    
    switch (activeTab) {
      case 'discover':
        if (!hasProfile) {
          return <GymBrosSetup onProfileCreated={handleProfileCreated} />;
        }
        return (
          <div className="h-full overflow-hidden relative">
            <DiscoverTab
               loading={loading}
               filters={filters}
               setShowFilters={setShowFilters}
               distanceUnit="miles"
               isPremium={false}
               initialProfiles={sharedProfiles} 
               initialIndex={currentIndex}
               userProfile={userProfile}
               onNavigateToMatches={(matchedProfile) => {
                 setActiveTab('matches');
                 invalidate('matches');
               }}
             />
          </div>
        );

      case 'map':
  return (
    <div className="h-full w-full">
      {!hasProfile ? (
        <div className="relative h-full">
          <GymBrosMap 
            userProfile={null}
            initialUsers={[]}
            filters={{ maxDistance: 25, showUsers: true, showGyms: true }}
          />
          <div className="absolute top-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-30">
            <p className="text-sm text-gray-600 mb-2">
              Create a profile to see gym partners and join the community!
            </p>
            <button
              onClick={() => setActiveTab('discover')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600"
            >
              Create Profile
            </button>
          </div>
        </div>
      ) : (
        <GymBrosMap 
          userProfile={userProfile} 
          initialUsers={profiles} 
          filters={{
            maxDistance: filters.maxDistance,
            showUsers: true,
            showGyms: true,
            workoutTypes: filters.workoutTypes
          }}
        />
      )}
    </div>
  );

      case 'matches':
        if (!hasProfile) {
          return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle size={64} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
              <p className="text-gray-600 mb-4">Create a profile to start matching with gym partners!</p>
              <button
                onClick={() => setActiveTab('discover')}
                className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600"
              >
                Create Profile
              </button>
            </div>
          );
        }
        return <GymBrosMatchesList />;
        
      case 'shop':
        return (
          <div className="h-full overflow-y-auto pb-16">
            <GymBrosShop />
          </div>
        );
      
      case 'profile':
        if (!hasProfile) {
          return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <User size={64} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Profile Yet</h3>
              <p className="text-gray-600 mb-4">Create your GymBros profile to get started!</p>
              <button
                onClick={() => setActiveTab('discover')}
                className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600"
              >
                Create Profile
              </button>
            </div>
          );
        }
        return (
          <div className="h-full overflow-y-auto pb-16">
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

 if ((loading || guestLoading) && !initializationComplete) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <Dumbbell size={48} className="text-blue-500 animate-bounce mb-4" />
          <p className="text-lg font-medium">Loading Gym Partners...</p>
        </div>
      </div>
    );
  }


  if (!hasProfile) {
    return <GymBrosSetup onProfileCreated={handleProfileCreated} />;
  }

  return (
  <>
    <FooterHider />
    <div className="gymbros-main-container fixed inset-0 top-16 flex flex-col max-w-2xl mx-auto bg-white overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 z-30 sticky top-0">
        {renderHeader()}
      </div>
      
      {/* Main Content - Account for bottom nav height and safe areas */}
      <div className={`flex-1 relative bg-gray-50 overflow-hidden pb-[80px] sm:pb-[90px] ${
        activeTab === 'discover' ? 'no-scroll' : ''
      }`} style={{
        paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))'
      }}>
        {renderTabContent()}
      </div>
      
      {/* Bottom Navigation with Full Safe Area Support */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20 safe-bottom">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center">
          
          <button 
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center p-2 min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200 rounded-lg ${
              activeTab === 'discover' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Discover gym partners"
            aria-current={activeTab === 'discover' ? 'page' : undefined}
          >
            <Dumbbell size={20} className="sm:h-6 sm:w-6" />
            <span className="text-xs mt-1 hidden sm:block">Discover</span>
            <span className="text-xs mt-1 block sm:hidden">Swipe</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center p-2 min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200 rounded-lg ${
              activeTab === 'map' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Map view"
            aria-current={activeTab === 'map' ? 'page' : undefined}
          >
            <MapPin size={20} className="sm:h-6 sm:w-6" />
            <span className="text-xs mt-1">Map</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('matches');
            }}
            className={`flex flex-col items-center p-2 min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200 rounded-lg relative ${
              activeTab === 'matches' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            aria-label={`Matches${matches.length > 0 ? ` (${matches.length})` : ''}`}
            aria-current={activeTab === 'matches' ? 'page' : undefined}
          >
            <MessageCircle size={20} className="sm:h-6 sm:w-6" />
            <span className="text-xs mt-1">Matches</span>
            {matches.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-sm">
                {matches.length > 9 ? '9+' : matches.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('shop')}
            className={`flex flex-col items-center p-2 min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200 rounded-lg ${
              activeTab === 'shop' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Shop"
            aria-current={activeTab === 'shop' ? 'page' : undefined}
          >
            <ShoppingBag size={20} className="sm:h-6 sm:w-6" />
            <span className="text-xs mt-1">Shop</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center p-2 min-h-[44px] min-w-[44px] touch-manipulation transition-all duration-200 rounded-lg ${
              activeTab === 'profile' 
                ? 'text-blue-500 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Profile"
            aria-current={activeTab === 'profile' ? 'page' : undefined}
          >
            <User size={20} className="sm:h-6 sm:w-6" />
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