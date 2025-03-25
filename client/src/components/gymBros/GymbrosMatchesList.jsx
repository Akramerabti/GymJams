import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, MessageCircle, Star, Shield, ChevronRight, Filter, Zap } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import gymbrosService from '../../services/gymbros.service';
import { usePoints } from '../../hooks/usePoints';
import useAuthStore from '../../stores/authStore';
import GymBrosMatchChat from './GymBrosMatchChat';
import ActiveStatus from './components/ActiveStatus';
import EmptyStateMessage from './components/EmptyStateMessage';

// Premium feature unlock cost
const PREMIUM_FEATURES = {
  WHO_LIKED_ME: 100
};

const GymBrosMatchesList = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { balance: pointsBalance, subtractPoints, updatePointsInBackend } = usePoints();
  
  // State
  const [matches, setMatches] = useState([]);
  const [likedMeCount, setLikedMeCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isShowingChat, setIsShowingChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs
  const matchesCarouselRef = useRef(null);
  
  // Fetch matches and liked count on component mount
  useEffect(() => {
    fetchMatchesAndLikes();
  }, []);
  
  // Fetch matches and who liked me count
  const fetchMatchesAndLikes = async () => {
    setLoading(true);
    try {
      // Fetch matches with message preview
      const matchesData = await gymbrosService.getMatchesWithPreview();
      
      // Process and sort matches by latest message
      const sortedMatches = matchesData.sort((a, b) => {
        const aLastMsg = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(0);
        const bLastMsg = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(0);
        return bLastMsg - aLastMsg; // Sort newest to oldest
      });
      
      setMatches(sortedMatches);
      
      // Fetch who liked me count
      const likedCount = await gymbrosService.getWhoLikedMeCount();
      setLikedMeCount(likedCount);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };
  
  // Pull-to-refresh handler
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await fetchMatchesAndLikes();
      toast.success('Matches refreshed');
    } catch (error) {
      console.error('Error refreshing matches:', error);
      toast.error('Failed to refresh matches');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle opening chat with a match
  const handleOpenChat = (match) => {
    setSelectedMatch(match);
    setIsShowingChat(true);
  };
  
  // Handle horizontal scroll on matches carousel
  const handleHorizontalScroll = (direction) => {
    if (!matchesCarouselRef.current) return;
    
    const scrollAmount = 200; // px
    const currentScroll = matchesCarouselRef.current.scrollLeft;
    
    matchesCarouselRef.current.scrollTo({
      left: direction === 'right' ? currentScroll + scrollAmount : currentScroll - scrollAmount,
      behavior: 'smooth'
    });
  };
  
  // Handle unlocking who liked me
  const handleUnlockWhoLikedMe = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to use premium features');
      return;
    }
    
    if (pointsBalance < PREMIUM_FEATURES.WHO_LIKED_ME) {
      toast.error(`Not enough points! You need ${PREMIUM_FEATURES.WHO_LIKED_ME} points to unlock.`);
      return;
    }
    
    // Deduct points
    subtractPoints(PREMIUM_FEATURES.WHO_LIKED_ME);
    updatePointsInBackend(-PREMIUM_FEATURES.WHO_LIKED_ME);
    
    // Set premium status
    setIsPremium(true);
    
    toast.success('Premium feature unlocked!');
  };
  
  // Placeholder component for empty state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Heart size={32} className="text-red-500" />
        </motion.div>
        <p className="ml-4 text-gray-600">Loading your matches...</p>
      </div>
    );
  }
  
  // Render who liked me section (premium or blurred)
  const renderWhoLikedMe = () => (
    <div className="relative mb-6 overflow-hidden rounded-xl shadow-md">
      <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg flex items-center">
              <Heart className="mr-2" /> Who Liked You
            </h3>
            <p className="text-sm text-white/80">
              {isPremium 
                ? `${likedMeCount} people have liked your profile` 
                : "See who liked your profile"}
            </p>
          </div>
          
          <div className={`text-4xl font-bold ${isPremium ? '' : 'blur-sm'}`}>
            {likedMeCount}
          </div>
        </div>
        
        {!isPremium && (
          <button
            onClick={handleUnlockWhoLikedMe}
            className="mt-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white py-2 px-4 rounded-lg flex items-center justify-center w-full transition-colors"
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Unlock for {PREMIUM_FEATURES.WHO_LIKED_ME} points</span>
          </button>
        )}
      </div>
      
      {!isPremium && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <Lock className="h-12 w-12 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  );
  
  // Render matches carousel
  const renderMatchesCarousel = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">New Matches</h3>
        <div className="flex">
          <button
            onClick={() => handleHorizontalScroll('left')}
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 mr-1"
          >
            <ChevronRight className="h-5 w-5 transform rotate-180" />
          </button>
          <button
            onClick={() => handleHorizontalScroll('right')}
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div
        ref={matchesCarouselRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
      >
        {matches.length > 0 ? (
          matches.map(match => (
            <div
              key={match._id}
              className="flex-shrink-0 w-20 snap-start mr-3"
              onClick={() => handleOpenChat(match)}
            >
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md">
                <img
                  src={formatImageUrl(match.profileImage || (match.images && match.images[0]))}
                  alt={match.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/400/400";
                  }}
                />
                
                {match.unreadCount > 0 && (
                  <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                    {match.unreadCount}
                  </div>
                )}
              </div>
              <p className="text-center text-xs mt-1 truncate">{match.name}</p>
            </div>
          ))
        ) : (
          <div className="w-full py-4 text-center text-gray-500">
            <p>No matches yet. Keep swiping!</p>
          </div>
        )}
      </div>
    </div>
  );
  
  // Render recent conversations
  const renderConversations = () => (
    <div className="flex-1 overflow-y-auto">
      <h3 className="font-bold text-lg mb-2">Messages</h3>
      
      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map(match => (
            <div
              key={match._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleOpenChat(match)}
            >
              <div className="p-3 flex items-center">
                <div className="relative">
                  <img
                    src={formatImageUrl(match.profileImage || (match.images && match.images[0]))}
                    alt={match.name}
                    className="w-14 h-14 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/api/placeholder/400/400";
                    }}
                  />
                  
                  {match.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      {match.unreadCount}
                    </div>
                  )}
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold truncate">{match.name}</h4>
                    <p className="text-xs text-gray-500">
                      {match.lastMessage?.timestamp 
                        ? formatDistanceToNow(new Date(match.lastMessage.timestamp), { addSuffix: true })
                        : 'New match'}
                    </p>
                  </div>
                  
                  <ActiveStatus lastActive={match.lastActive} />
                  
                  <p className={`text-sm truncate ${match.unreadCount ? 'font-medium' : 'text-gray-500'}`}>
                    {match.lastMessage 
                      ? `${match.lastMessage.isYours ? 'You: ' : ''}${match.lastMessage.content || 'Sent an image'}`
                      : 'Start a conversation'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateMessage
          type="noMatches"
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
  
  // Format image URL helper
  const formatImageUrl = (url) => {
    if (!url) return "/api/placeholder/400/400";
    
    if (url.startsWith('blob:')) {
      return url;
    } else if (url.startsWith('http')) {
      return url;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
  };
  
  return (
    <div className="h-[calc(100vh-136px)] flex flex-col p-4 overflow-hidden">
      {/* Who liked me section (premium feature) */}
      {renderWhoLikedMe()}
      
      {/* Matches carousel */}
      {renderMatchesCarousel()}
      
      {/* Conversations list */}
      {renderConversations()}
      
      {/* Chat overlay when a match is selected */}
      <AnimatePresence>
        {isShowingChat && selectedMatch && (
          <GymBrosMatchChat
            match={selectedMatch}
            onClose={() => {
              setIsShowingChat(false);
              setSelectedMatch(null);
              // Refresh matches to update unread counts
              fetchMatchesAndLikes();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GymBrosMatchesList;