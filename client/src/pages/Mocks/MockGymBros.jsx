import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Heart, X, MessageCircle, Filter, Dumbbell, UserPlus, 
  Calendar, MapPin, Settings, ShoppingBag, User,
  ChevronLeft, ChevronRight, Edit, LogIn
} from 'lucide-react';

import DiscoverTab from '../../components/gymBros/components/DiscoverTab';
import GymBrosSetup from '../../components/gymBros/GymBrosSetup';
import GymBrosFilters from '../../components/gymBros/GymBrosFilters';
import GymBrosSettings from '../../components/gymBros/GymBrosSettings';
import EnhancedGymBrosProfile from '../../components/gymBros/ProfileEditor';
import GymBrosShop from '../../components/gymBros/GymBrosShop';
import GymBrosMatchesList from '../../components/gymBros/GymbrosMatchesList';
import GymBrosMap from '../../components/gymBros/GymBrosMap';

// Mock Data
const MOCK_USER_PROFILE = {
  _id: 'mock-user-123',
  name: 'John Demo',
  age: 28,
  bio: 'Fitness enthusiast looking for workout partners! 💪',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JohnDemo',
  location: {
    type: 'Point',
    coordinates: [-73.935242, 40.730610], // NYC coordinates
    city: 'New York',
    state: 'NY'
  },
  workoutTypes: ['Weightlifting', 'CrossFit', 'Running'],
  experienceLevel: 'Intermediate',
  preferredTime: 'Morning',
  gender: 'Male',
  genderPreference: 'All',
  ageRange: { min: 21, max: 35 },
  maxDistance: 25,
  primaryGym: {
    place_id: 'mock-gym-1',
    name: 'Elite Fitness NYC',
    formatted_address: '123 Broadway, New York, NY 10001',
    geometry: {
      location: {
        lat: 40.730610,
        lng: -73.935242
      }
    }
  },
  gyms: [
    {
      place_id: 'mock-gym-1',
      name: 'Elite Fitness NYC',
      formatted_address: '123 Broadway, New York, NY 10001'
    },
    {
      place_id: 'mock-gym-2',
      name: 'Planet Fitness Manhattan',
      formatted_address: '456 5th Ave, New York, NY 10018'
    }
  ],
  achievements: ['100 Day Streak', 'Early Bird', 'Heavy Lifter'],
  isGuest: false,
  profileType: 'demo'
};

const MOCK_PROFILES = [
  {
    _id: 'mock-profile-1',
    user: {
      _id: 'mock-user-1',
      name: 'Sarah Miller',
      age: 26,
      bio: 'Yoga instructor and marathon runner. Always down for a morning workout! 🧘‍♀️🏃‍♀️',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahMiller&backgroundColor=b6e3f4',
      location: {
        type: 'Point',
        coordinates: [-73.945242, 40.735610],
        city: 'Brooklyn',
        state: 'NY'
      }
    },
    workoutTypes: ['Yoga', 'Running', 'Pilates'],
    experienceLevel: 'Advanced',
    preferredTime: 'Morning',
    primaryGym: {
      name: 'CorePower Yoga Brooklyn',
      formatted_address: '789 Atlantic Ave, Brooklyn, NY 11217'
    },
    distance: 2.5,
    mutualGyms: ['Planet Fitness Manhattan']
  },
  {
    _id: 'mock-profile-2',
    user: {
      _id: 'mock-user-2',
      name: 'Mike Johnson',
      age: 32,
      bio: 'Powerlifter and personal trainer. Let\'s crush some PRs together! 💯',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MikeJohnson&backgroundColor=ffd5dc',
      location: {
        type: 'Point',
        coordinates: [-73.925242, 40.740610],
        city: 'Manhattan',
        state: 'NY'
      }
    },
    workoutTypes: ['Weightlifting', 'Powerlifting', 'CrossFit'],
    experienceLevel: 'Expert',
    preferredTime: 'Evening',
    primaryGym: {
      name: 'Elite Fitness NYC',
      formatted_address: '123 Broadway, New York, NY 10001'
    },
    distance: 1.8,
    mutualGyms: ['Elite Fitness NYC']
  },
  {
    _id: 'mock-profile-3',
    user: {
      _id: 'mock-user-3',
      name: 'Emily Chen',
      age: 24,
      bio: 'New to lifting! Looking for patient workout buddies to learn with 🌟',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyChen&backgroundColor=c0aede',
      location: {
        type: 'Point',
        coordinates: [-73.955242, 40.725610],
        city: 'Queens',
        state: 'NY'
      }
    },
    workoutTypes: ['Weightlifting', 'Cardio', 'HIIT'],
    experienceLevel: 'Beginner',
    preferredTime: 'Flexible',
    primaryGym: {
      name: 'LA Fitness Queens',
      formatted_address: '321 Queens Blvd, Queens, NY 11375'
    },
    distance: 4.2,
    mutualGyms: []
  },
  {
    _id: 'mock-profile-4',
    user: {
      _id: 'mock-user-4',
      name: 'Alex Thompson',
      age: 29,
      bio: 'CrossFit coach and nutrition enthusiast. Always up for a WOD! 🏋️‍♂️',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexThompson&backgroundColor=ffdfba',
      location: {
        type: 'Point',
        coordinates: [-73.915242, 40.745610],
        city: 'Manhattan',
        state: 'NY'
      }
    },
    workoutTypes: ['CrossFit', 'Olympic Lifting', 'Functional Fitness'],
    experienceLevel: 'Expert',
    preferredTime: 'Morning',
    primaryGym: {
      name: 'CrossFit NYC',
      formatted_address: '555 W 42nd St, New York, NY 10036'
    },
    distance: 3.1,
    mutualGyms: []
  }
];

const MOCK_MATCHES = [
  {
    _id: 'mock-match-1',
    users: ['mock-user-123', 'mock-user-1'],
    profiles: [
      MOCK_USER_PROFILE,
      MOCK_PROFILES[0].user
    ],
    gymBrosProfiles: [
      {
        workoutTypes: MOCK_USER_PROFILE.workoutTypes,
        preferredTime: MOCK_USER_PROFILE.preferredTime,
        primaryGym: MOCK_USER_PROFILE.primaryGym
      },
      {
        workoutTypes: MOCK_PROFILES[0].workoutTypes,
        preferredTime: MOCK_PROFILES[0].preferredTime,
        primaryGym: MOCK_PROFILES[0].primaryGym
      }
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    lastMessage: {
      text: 'Hey! Want to do legs tomorrow at 7am?',
      sender: 'mock-user-1',
      timestamp: new Date(Date.now() - 1800000).toISOString() // 30 min ago
    },
    unreadCount: 1
  },
  {
    _id: 'mock-match-2',
    users: ['mock-user-123', 'mock-user-2'],
    profiles: [
      MOCK_USER_PROFILE,
      MOCK_PROFILES[1].user
    ],
    gymBrosProfiles: [
      {
        workoutTypes: MOCK_USER_PROFILE.workoutTypes,
        preferredTime: MOCK_USER_PROFILE.preferredTime,
        primaryGym: MOCK_USER_PROFILE.primaryGym
      },
      {
        workoutTypes: MOCK_PROFILES[1].workoutTypes,
        preferredTime: MOCK_PROFILES[1].preferredTime,
        primaryGym: MOCK_PROFILES[1].primaryGym
      }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    lastMessage: {
      text: 'Great workout today! Same time next week?',
      sender: 'mock-user-123',
      timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    },
    unreadCount: 0
  }
];

const FooterHider = () => {
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
  }, []);
  
  return null;
};

const GymBrosMock = () => {
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(true); // Always true for demo
  const [showMatches, setShowMatches] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [matches, setMatches] = useState(MOCK_MATCHES);
  const [viewStartTime, setViewStartTime] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');
  const [filters, setFilters] = useState({
    workoutTypes: [],
    experienceLevel: 'Any',
    preferredTime: 'Any',
    genderPreference: 'All',
    ageRange: { min: 18, max: 99 },
    maxDistance: 50
  });
  const [userProfile, setUserProfile] = useState(MOCK_USER_PROFILE);

  useEffect(() => {
    if (hasProfile) {
      setActiveTab('discover');
    }
  }, [hasProfile]);

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
  }, []);

  const handleProfileCreated = (profile) => {
    toast.success('This is a demo - profile creation is disabled');
  };

  const fetchProfilesWithFilters = (filterValues) => {
    // Simulate filtering
    let filtered = [...MOCK_PROFILES];
    
    if (filterValues.workoutTypes.length > 0) {
      filtered = filtered.filter(profile => 
        profile.workoutTypes.some(type => filterValues.workoutTypes.includes(type))
      );
    }
    
    if (filterValues.experienceLevel !== 'Any') {
      filtered = filtered.filter(profile => 
        profile.experienceLevel === filterValues.experienceLevel
      );
    }
    
    if (filterValues.preferredTime !== 'Any') {
      filtered = filtered.filter(profile => 
        profile.preferredTime === filterValues.preferredTime
      );
    }
    
    if (filterValues.maxDistance) {
      filtered = filtered.filter(profile => 
        profile.distance <= filterValues.maxDistance
      );
    }
    
    setProfiles(filtered.length > 0 ? filtered : MOCK_PROFILES);
    setCurrentIndex(0);
    toast.success(`Found ${filtered.length} matching profiles!`);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    fetchProfilesWithFilters(newFilters);
  };

  const handleProfileUpdated = (updatedData) => {
    setUserProfile(prev => ({ ...prev, ...updatedData }));
    setShowSettings(false);
    toast.success('This is a demo - profile updates are disabled');
  };

  const renderHeader = () => {
    if (activeTab === 'matches' || activeTab === 'map') {
      return null;
    }

    const headerTitle = (
      <h1 className="text-xl font-bold flex items-center">
        <Dumbbell className="mr-2 text-blue-500" />
        GymBros Demo
      </h1>
    );

    const headerContent = (() => {
      switch(activeTab) {
        case 'discover':
          return (
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
              {headerTitle}
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowFilters(true)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <Filter size={20} />
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
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
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
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
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
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
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
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
    switch (activeTab) {
      case 'discover':
        return (
          <div className="h-full overflow-hidden relative">
            <DiscoverTab
              loading={loading}
              filters={filters}
              setShowFilters={setShowFilters}
              distanceUnit="miles"
              isPremium={false}
              initialProfiles={profiles} 
              initialIndex={currentIndex}
              userProfile={userProfile}
              onNavigateToMatches={(matchedProfile) => {
                setActiveTab('matches');
                toast.success('Match created! Check your matches tab.');
              }}
            />
          </div>
        );

      case 'map':
        return (
          <div className="h-full w-full">
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
          </div>
        );

      case 'matches':
        return <GymBrosMatchesList />;
        
      case 'shop':
        return (
          <div className="h-full overflow-y-auto pb-20">
            <GymBrosShop />
          </div>
        );
      
      case 'profile':
        return (
          <div className="h-full overflow-y-auto pb-20">
            <EnhancedGymBrosProfile
              userProfile={userProfile}
              onProfileUpdated={handleProfileUpdated}
              isGuest={false}
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
      {/* Main container with dvh for mobile-safe height */}
      <div className="gymbros-main-container fixed inset-0 top-16 flex flex-col max-w-2xl mx-auto bg-white overflow-hidden" 
        style={{ height: 'calc(100dvh - 64px)', minHeight: 'calc(100vh - 64px)' }}>
        
        {/* Demo Banner */}
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm flex-shrink-0">
          <span className="font-medium">Demo Mode</span> - Explore GymBros with sample data
        </div>
        
        {/* Header */}
        <div className="flex-shrink-0 z-30 sticky top-0">
          {renderHeader()}
        </div>
        
        {/* Main Content with proper viewport padding */}
        <div className={`flex-1 relative bg-gray-50 overflow-hidden ${
          activeTab === 'discover' ? 'no-scroll' : ''
        }`} style={{
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
          height: '100%'
        }}>
          <div className="h-full p-4 md:p-6" style={{ maxHeight: '100%' }}>
            {renderTabContent()}
          </div>
        </div>
        
        {/* Bottom Navigation with full safe area support */}
        <div 
          className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
            
            <button 
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center p-2 min-h-[48px] min-w-[48px] touch-manipulation transition-all duration-200 rounded-lg ${
                activeTab === 'discover' 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Discover gym partners"
            >
              <Dumbbell size={22} />
              <span className="text-xs mt-1">Discover</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center p-2 min-h-[48px] min-w-[48px] touch-manipulation transition-all duration-200 rounded-lg ${
                activeTab === 'map' 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Map view"
            >
              <MapPin size={22} />
              <span className="text-xs mt-1">Map</span>
            </button>

            <button 
              onClick={() => setActiveTab('matches')}
              className={`flex flex-col items-center p-2 min-h-[48px] min-w-[48px] touch-manipulation transition-all duration-200 rounded-lg relative ${
                activeTab === 'matches' 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Matches"
            >
              <MessageCircle size={22} />
              <span className="text-xs mt-1">Matches</span>
              {matches.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {matches.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('shop')}
              className={`flex flex-col items-center p-2 min-h-[48px] min-w-[48px] touch-manipulation transition-all duration-200 rounded-lg ${
                activeTab === 'shop' 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Shop"
            >
              <ShoppingBag size={22} />
              <span className="text-xs mt-1">Shop</span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center p-2 min-h-[48px] min-w-[48px] touch-manipulation transition-all duration-200 rounded-lg ${
                activeTab === 'profile' 
                  ? 'text-blue-500 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Profile"
            >
              <User size={22} />
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
        isGuest={false}
      />
    </>
  );
};

export default GymBrosMock;