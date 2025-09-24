import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Loader, RefreshCw, Star, X, Heart, 
  Info, Shield
} from 'lucide-react';
import SwipeableCard from '../components/gymBros/components/SwipeableCard';
import ProfileDetailModal from '../components/gymBros/components/ProfileDetailModal';
import MatchModal from '../components/gymBros/components/MatchModal';
import EmptyStateMessage from '../components/gymBros/components/EmptyStateMessage';
import ActiveBoostNotification from '../components/gymBros/components/ActiveBoostNotification';

// Mock profiles data - flattened structure
const MOCK_PROFILES = [
  {
    _id: 'mock-profile-1',
    userId: 'mock-user-1',
    name: 'Sarah Miller',
    age: 26,
    bio: 'Yoga instructor and marathon runner. Always down for a morning workout! 🧘‍♀️🏃‍♀️',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahMiller&backgroundColor=b6e3f4',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahMiller&backgroundColor=b6e3f4',
    location: {
      type: 'Point',
      coordinates: [-73.945242, 40.735610],
      city: 'Brooklyn',
      state: 'NY',
      distance: 2.5
    },
    images: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=600&fit=crop'
    ],
    workoutTypes: ['Yoga', 'Running', 'Pilates'],
    experienceLevel: 'Advanced',
    preferredTime: 'Morning',
    primaryGym: {
      name: 'CorePower Yoga Brooklyn',
      formatted_address: '789 Atlantic Ave, Brooklyn, NY 11217'
    },
    distance: 2.5,
    mutualGyms: ['Planet Fitness Manhattan'],
    matchScore: 85,
    lastActive: new Date(Date.now() - 300000) // 5 min ago
  },
  {
    _id: 'mock-profile-2',
    userId: 'mock-user-2',
    name: 'Mike Johnson',
    age: 32,
    bio: 'Powerlifter and personal trainer. Let\'s crush some PRs together! 💯',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MikeJohnson&backgroundColor=ffd5dc',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MikeJohnson&backgroundColor=ffd5dc',
    location: {
      type: 'Point',
      coordinates: [-73.925242, 40.740610],
      city: 'Manhattan',
      state: 'NY',
      distance: 1.8
    },
    images: [
      'https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=600&fit=crop'
    ],
    workoutTypes: ['Weightlifting', 'Powerlifting', 'CrossFit'],
    experienceLevel: 'Expert',
    preferredTime: 'Evening',
    primaryGym: {
      name: 'Elite Fitness NYC',
      formatted_address: '123 Broadway, New York, NY 10001'
    },
    distance: 1.8,
    mutualGyms: ['Elite Fitness NYC'],
    matchScore: 92,
    lastActive: new Date(Date.now() - 7200000) // 2 hours ago
  },
  {
    _id: 'mock-profile-3',
    userId: 'mock-user-3',
    name: 'Emily Chen',
    age: 24,
    bio: 'New to lifting! Looking for patient workout buddies to learn with 🌟',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyChen&backgroundColor=c0aede',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyChen&backgroundColor=c0aede',
    location: {
      type: 'Point',
      coordinates: [-73.955242, 40.725610],
      city: 'Queens',
      state: 'NY',
      distance: 4.2
    },
    images: [
      'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=600&fit=crop'
    ],
    workoutTypes: ['Weightlifting', 'Cardio', 'HIIT'],
    experienceLevel: 'Beginner',
    preferredTime: 'Flexible',
    primaryGym: {
      name: 'LA Fitness Queens',
      formatted_address: '321 Queens Blvd, Queens, NY 11375'
    },
    distance: 4.2,
    mutualGyms: [],
    matchScore: 73,
    lastActive: new Date(Date.now() - 3600000) // 1 hour ago
  },
  {
    _id: 'mock-profile-4',
    userId: 'mock-user-4',
    name: 'Alex Thompson',
    age: 29,
    bio: 'CrossFit coach and nutrition enthusiast. Always up for a WOD! 🏋️‍♂️',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexThompson&backgroundColor=ffdfba',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexThompson&backgroundColor=ffdfba',
    location: {
      type: 'Point',
      coordinates: [-73.915242, 40.745610],
      city: 'Manhattan',
      state: 'NY',
      distance: 3.1
    },
    images: [
      'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop'
    ],
    workoutTypes: ['CrossFit', 'Olympic Lifting', 'Functional Fitness'],
    experienceLevel: 'Expert',
    preferredTime: 'Morning',
    primaryGym: {
      name: 'CrossFit NYC',
      formatted_address: '555 W 42nd St, New York, NY 10036'
    },
    distance: 3.1,
    mutualGyms: [],
    matchScore: 88,
    lastActive: new Date(Date.now() - 10800000) // 3 hours ago
  },
  {
    _id: 'mock-profile-5',
    userId: 'mock-user-5',
    name: 'Jessica Rodriguez',
    age: 27,
    bio: 'Boxing and HIIT lover. Let\'s train like champions! 🥊',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JessicaRodriguez&backgroundColor=fbbf24',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JessicaRodriguez&backgroundColor=fbbf24',
    location: {
      type: 'Point',
      coordinates: [-73.965242, 40.715610],
      city: 'Brooklyn',
      state: 'NY',
      distance: 3.5
    },
    images: [
      'https://images.unsplash.com/photo-1549476464-37392f717541?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=400&h=600&fit=crop'
    ],
    workoutTypes: ['Boxing', 'HIIT', 'Strength Training'],
    experienceLevel: 'Intermediate',
    preferredTime: 'Evening',
    primaryGym: {
      name: 'Title Boxing Club',
      formatted_address: '234 Court St, Brooklyn, NY 11201'
    },
    distance: 3.5,
    mutualGyms: [],
    matchScore: 79,
    lastActive: new Date(Date.now() - 21600000) // 6 hours ago
  }
];

const MockDiscoverTab = ({ 
  loading: externalLoading, 
  filters,
  setShowFilters,
  distanceUnit = 'miles',
  isPremium = false,
  userProfile = null,
  onNavigateToMatches
}) => {
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [lastSwiped, setLastSwiped] = useState(null);
  const [forceSwipeDirection, setForceSwipeDirection] = useState(null);
  const [processingSwipe, setProcessingSwipe] = useState(false);
  
  const swipeLockRef = useRef(false);
  
  // Simulate initial loading
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);
  
  const handleSwipe = async (direction, profileId) => {
    if (swipeLockRef.current || currentIndex >= profiles.length) {
      return;
    }
    
    swipeLockRef.current = true;
    const currentProfile = profiles[currentIndex];
    
    // Store last swiped for rekindle
    setLastSwiped({
      profile: currentProfile,
      direction,
      index: currentIndex
    });
    
    // Set force direction for animation
    setForceSwipeDirection(direction);
    
    // Simulate API delay
    setTimeout(() => {
      if (direction === 'right') {
        // 30% chance of match
        const isMatch = Math.random() < 0.3;
        
        if (isMatch) {
          setMatchedProfile(currentProfile);
          toast.success('It\'s a match! 🎉');
          
          setTimeout(() => {
            setShowMatchModal(true);
            swipeLockRef.current = false;
          }, 500);
          return;
        } else {
          toast('Liked!', { icon: '💚' });
        }
      } else if (direction === 'left') {
        toast('Passed', { icon: '👋' });
      } else if (direction === 'up') {
        toast.success('Super Like sent! ⭐');
        
        // 50% chance of instant match for super likes
        const isMatch = Math.random() < 0.5;
        if (isMatch) {
          setMatchedProfile(currentProfile);
          setTimeout(() => {
            setShowMatchModal(true);
            swipeLockRef.current = false;
          }, 500);
          return;
        }
      }
      
      // Move to next profile
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setProcessingSwipe(false);
        swipeLockRef.current = false;
        setForceSwipeDirection(null);
      }, 500);
    }, 300);
  };
  
  const handleButtonSwipe = (direction) => {
    if (!profiles.length || currentIndex >= profiles.length || processingSwipe) {
      return;
    }
    
    const currentProfile = profiles[currentIndex];
    const profileId = currentProfile._id || currentProfile.id;
    
    handleSwipe(direction, profileId);
  };
  
  const handleRekindle = () => {
    if (!lastSwiped) {
      toast.info('Nothing to undo');
      return;
    }
    
    toast('This is a demo - Rekindle is a premium feature', { icon: '💎' });
    
    // In demo, just show the toast
    // In real app, this would restore the last swiped profile
  };
  
  const handleSendMessage = () => {
    setShowMatchModal(false);
    
    if (onNavigateToMatches) {
      onNavigateToMatches(matchedProfile);
    }
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setProcessingSwipe(false);
      swipeLockRef.current = false;
    }, 500);
  };
  
  const handleKeepSwiping = () => {
    setShowMatchModal(false);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 100);
  };
  
  const handleRefresh = () => {
    toast.success('Profiles refreshed! (Demo mode)');
    setCurrentIndex(0);
    setProfiles([...MOCK_PROFILES].sort(() => Math.random() - 0.5));
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center px-4 md:px-6">
        <div className="relative h-16 w-16 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <Loader size={64} className="text-blue-500" />
          </motion.div>
        </div>
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg font-medium text-gray-700"
        >
          Finding your perfect gym partner...
        </motion.p>
        <p className="text-sm text-gray-500 mt-2">Demo Mode</p>
      </div>
    );
  }
  
  // End of profiles
  if (currentIndex >= profiles.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full p-4 md:p-6"
      >
        <EmptyStateMessage 
          message="You've seen all demo profiles"
          description="In the real app, you'd see many more!"
          icon={<RefreshCw size={48} className="text-gray-400" />}
          actionLabel="Refresh Demo"
          onRefresh={handleRefresh}
        />
      </motion.div>
    );
  }
  
  const currentProfile = profiles[currentIndex];
  
  return (
    <div className="h-full w-full relative overflow-hidden">
      <ActiveBoostNotification />
      
      {/* Profile cards stack */}
      <div className="absolute inset-4 md:inset-6 top-4 bottom-32 flex items-center justify-center">
        {profiles[currentIndex] && (
          <div 
            key={`card-container-${currentProfile._id}`}
            className="w-full h-full flex items-center justify-center"
          >
            <SwipeableCard
              key={`card-${currentProfile._id}`}
              profile={currentProfile}
              onSwipe={handleSwipe}
              onInfoClick={() => setShowProfileDetail(true)}
              onSuperLike={() => handleSwipe('up', currentProfile._id)}
              onRekindle={handleRekindle}
              distanceUnit={distanceUnit}
              isPremium={isPremium}
              isActive={true}
              forceDirection={forceSwipeDirection}
            />
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="absolute bottom-20 inset-x-4 md:inset-x-6 flex items-center justify-center space-x-3 md:space-x-5 z-30">
        {/* Rekindle Button */}
        <div className="p-[3px] rounded-full bg-gradient-to-br from-gray-400 to-gray-500">
          <button 
            onClick={handleRekindle}
            disabled={processingSwipe}
            className="p-2.5 md:p-3 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative"
          >
            <RefreshCw 
              size={16} 
              className="text-white group-hover:rotate-180 transition-transform duration-300" 
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* Dislike Button */}
        <div className="p-[3px] rounded-full bg-gradient-to-br from-rose-300 to-red-600">
          <button 
            onClick={() => handleButtonSwipe('left')}
            disabled={processingSwipe}
            className="p-3 md:p-4 rounded-full bg-gradient-to-br from-rose-600 to-red-700 hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative"
          >
            <X 
              size={28} 
              className="text-white group-hover:scale-110 transition-transform duration-300" 
              strokeWidth={3}
            />
          </button>
        </div>
        
        {/* Super Like Button */}
        <div className="p-[3px] rounded-full bg-gradient-to-br from-sky-400 to-blue-600">
          <button 
            onClick={() => handleButtonSwipe('up')}
            disabled={processingSwipe}
            className="p-2.5 md:p-3 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative"
          >
            <Star 
              size={26} 
              className="text-white group-hover:scale-110 transition-transform duration-300" 
              strokeWidth={2.8}
            />
          </button>
        </div>
        
        {/* Like Button */}
        <div className="p-[3px] rounded-full bg-gradient-to-br to-emerald-200 from-green-600">
          <button 
            onClick={() => handleButtonSwipe('right')}
            disabled={processingSwipe}
            className="p-3 md:p-4 rounded-full bg-gradient-to-br from-emerald-500 to-green-700 hover:shadow-lg transition-all duration-300 group flex items-center justify-center relative"
          >
            <Heart 
              size={28} 
              className="text-white group-hover:scale-110 transition-transform duration-300" 
              strokeWidth={3}
            />
          </button>
        </div>
      </div>
      
      {/* Profile Detail Modal */}
      <ProfileDetailModal
        isVisible={showProfileDetail}
        profile={currentProfile}
        userProfile={userProfile}
        onClose={() => setShowProfileDetail(false)}
        onLike={() => {
          setShowProfileDetail(false);
          handleButtonSwipe('right');
        }}
        onDislike={() => {
          setShowProfileDetail(false);
          handleButtonSwipe('left');
        }}
        onSuperLike={() => {
          setShowProfileDetail(false);
          handleButtonSwipe('up');
        }}
        isPremium={isPremium}
        distanceUnit={distanceUnit}
      />
      
      {/* Match Modal */}
      {matchedProfile && (
        <MatchModal
          isVisible={showMatchModal}
          onClose={() => {
            setShowMatchModal(false);
            setTimeout(() => {
              setCurrentIndex(prev => prev + 1);
              swipeLockRef.current = false;
            }, 300);
          }}
          onSendMessage={handleSendMessage}
          onKeepSwiping={handleKeepSwiping}
          currentUser={userProfile}
          matchedUser={matchedProfile}
        />
      )}
    </div>
  );
};

export default MockDiscoverTab;