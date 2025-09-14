import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  ArrowRight,
  Map,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import gymBrosService from '../../services/gymbros.service';
import { formatImageUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';
import NoMatchesShowcase from './NoMatchesShowcase';
import MatchesStackedDeck from './MatchesStackedDeck';
import SocialMapShowcase from './SocialMapShowcase';

const SocialMapSection = ({ onNavigate, onLoad, isVisible = true }) => {
  const [gymBrosData, setGymBrosData] = useState(null);
  const [gymBrosLoading, setGymBrosLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchGymBrosData = async () => {
      try {
        setGymBrosLoading(true);
        
        // Fetch GymBros profile
        const profileResponse = await gymBrosService.getGymBrosProfile();
        
        if (profileResponse.hasProfile) {
          try {
            // Fetch matches
            const matchesData = await gymBrosService.getMatches();
            setGymBrosData({
              hasProfile: true,
              matchesCount: matchesData.length || 0,
              recentMatches: matchesData.slice(0, 6) // Get up to 6 matches for mobile swiping
            });
          } catch {
            setGymBrosData({ hasProfile: true, matchesCount: 0, recentMatches: [] });
          }
        } else {
          setGymBrosData({ hasProfile: false });
        }

        // Fetch user profile data
        try {
          const initData = await gymBrosService.initializeGymBros();
          if (initData.hasProfile && initData.profile) {
            setUserProfile(initData.profile);
          } else {
            // Try to get guest profile if authenticated user doesn't have profile
            const guestToken = localStorage.getItem('gymbros_guest_token');
            if (guestToken) {
              gymBrosService.setGuestToken(guestToken);
              const gymBrosResponse = await gymBrosService.getGymBrosProfile();
              if (gymBrosResponse && gymBrosResponse.profile) {
                setUserProfile(gymBrosResponse.profile);
              }
            }
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          setUserProfile(null);
        }
        
      } catch {
        setGymBrosData({ hasProfile: false });
        setUserProfile(null);
      } finally {
        setGymBrosLoading(false);
         if (onLoad && typeof onLoad === 'function') {
    onLoad();
  }
      }
    };

    fetchGymBrosData();
  }, []);

  // Handle opening chat with a match
  const handleOpenChat = async (match) => {
    try {
      const targetIdentifier = match.userId || match._id;
      const matchData = await gymBrosService.findMatch(targetIdentifier);
      
      // Handle different response cases
      if (matchData === 'auth-required') {
        toast.error('Please log in to start conversations');
        return onNavigate('/login');
      }
      
      if (!matchData?.matchId) {
        // Create new match if one doesn't exist
        const newMatch = await gymBrosService.createMatch(targetIdentifier);
        if (!newMatch?.matchId) {
          return toast.error('Could not start conversation');
        }
      }
      
      // Navigate to full GymBros page where chat can be opened
      onNavigate('/gymbros');
      
      // Emit an event to highlight this specific match
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('highlightMatch', {
          detail: { matchedProfile: match }
        }));
      }, 500);

    } catch (error) {
      console.error('Chat open error:', error);
      toast.error(error.response?.data?.message || 'Failed to open chat');
    }
  };

  // Don't render loading state, just render the component
  if (!isVisible) {
    return null;
  }

  if (gymBrosLoading) {
    return null; // Return null during loading, parent handles loading state
  }

  // Case 1: User has GymBros profile - Show stacked deck with matches
  if (gymBrosData?.hasProfile) {
    return (
      <motion.div
        className="glass-card rounded-3xl p-6 mb-8 overflow-hidden mt-30"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-3xl font-bold text-white flex items-center">
            <MapPin className="w-7 h-7 mr-3 text-red-400" />
            Social Map
            {gymBrosData.recentMatches && gymBrosData.recentMatches.length > 0 && (
              <span className="text-lg md:text-2xl ml-2 text-white/80">
                ({gymBrosData.recentMatches.length})
              </span>
            )}
          </h2>
          <motion.button
            className="flex items-center text-orange-300 hover:text-orange-200 font-semibold text-sm md:text-base"
            whileHover={{ x: 5 }}
            onClick={() => onNavigate('/gymbros')}
          >
            {gymBrosData.recentMatches && gymBrosData.recentMatches.length > 0 ? 'Tap to explore' : 'Explore'}
            <ArrowRight className="w-7 h-4 ml-2" />
          </motion.button>
        </div>

        {gymBrosData.recentMatches && gymBrosData.recentMatches.length > 0 ? (
          <MatchesStackedDeck
            gymBrosData={gymBrosData}
            userProfile={userProfile}
            onNavigate={onNavigate}
            onOpenChat={handleOpenChat}
          />
        ) : (
          <NoMatchesShowcase
            userProfile={userProfile}
            onStartSwiping={() => onNavigate('/gymbros')}
          />
        )}

        {/* Action Button */}
        <motion.button
          className="w-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/30 text-red-300 py-4 rounded-2xl hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 font-bold text-lg mt-6"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('/gymbros')}
        >
          <Map className="w-6 h-6 inline mr-3" />
          Open Full Map
        </motion.button>
      </motion.div>
    );
  }

  // Case 2: User doesn't have GymBros profile - Show attraction cards
  return (
    <motion.div
      className="glass-card rounded-3xl p-6 mb-8 overflow-hidden relative mt-30"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-white flex items-center">
          <MapPin className="w-7 h-7 mr-3 text-pink-400" />
          Social Map
        </h2>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
        </div>
      </div>

      <SocialMapShowcase onNavigate={onNavigate} />
    </motion.div>
  );
};

export default SocialMapSection;