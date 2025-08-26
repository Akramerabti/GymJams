import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Lock, MessageCircle, Star, Shield, ChevronRight, 
  ChevronLeft, Sparkles, Zap, Users, Info,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useTheme } from '../../contexts/ThemeContext';
import gymbrosService from '../../services/gymbros.service';
import { usePoints } from '../../hooks/usePoints';
import useAuthStore from '../../stores/authStore';
import useApiOptimization from '../../hooks/useApiOptimization';
import useRealtimeUpdates from '../../hooks/useRealtimeUpdates';
import GymBrosMatchChat from './components/GymBrosMatchChat';
import ActiveStatus from './components/ActiveStatus';
import EmptyStateMessage from './components/EmptyStateMessage';
import ProfileDetailModal from './components/ProfileDetailModal';
import { getPlaceholderUrl } from '../../utils/imageUtils';

// Premium feature unlock cost
const PREMIUM_FEATURES = {
  WHO_LIKED_ME: 100
};

const GymbrosMatchesList = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { balance: pointsBalance, subtractPoints, updatePointsInBackend } = usePoints();
  const { optimizedApiCall, clearCache } = useApiOptimization();
  const { subscribeToMatches, subscribeToNewMatches, subscribeToMessages } = useRealtimeUpdates();
  const { darkMode } = useTheme();
  
  // State
  const [matches, setMatches] = useState([]);
  const [newMatches, setNewMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [likedMeCount, setLikedMeCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isShowingChat, setIsShowingChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Animation state for the unlock card
  const [isHovering, setIsHovering] = useState(false);
  
  // Refs
  const matchesCarouselRef = useRef(null);
  const userIdRef = useRef(null);
  const lastLikesCountFetchRef = useRef(0);
  const navigate = useNavigate();
  
  // Get user ID for real-time updates
  const userId = user?.id || user?.user?.id;
    // Optimized fetch function with caching and rate limiting
  const fetchMatchesAndLikes = async (bypassCache = false) => {
    setLoading(true);
    try {
      // Fetch matches with optimization
      const matchesData = await optimizedApiCall(
        'matches-with-preview',
        () => gymbrosService.getMatchesWithPreview(),
        {
          cacheTime: 2 * 60 * 1000, // Cache for 2 minutes
          minInterval: 10 * 1000,   // Minimum 10 seconds between requests
          bypassCache
        }
      );
      
      // Process and sort matches
      const sortedMatches = Array.isArray(matchesData) ? matchesData : [];
      setMatches(sortedMatches);
      
      // Optimized likes count fetch with longer intervals
      try {
        const likedCount = await optimizedApiCall(
          'who-liked-me-count',
          () => gymbrosService.getWhoLikedMeCount(),
          {
            cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
            minInterval: 60 * 1000,   // Minimum 1 minute between requests
            bypassCache
          }
        );
        setLikedMeCount(likedCount);
      } catch (likeError) {
        // Handle rate limiting gracefully
        if (likeError.response?.status === 429) {
          //('Rate limited on likes count, using cached value');
        } else {
          console.error('Error fetching who liked me count:', likeError);
        }
      }
      
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch and real-time subscription setup
  useEffect(() => {
    fetchMatchesAndLikes();
    
    let unsubscribeMatches, unsubscribeNewMatches;
    
    if (userId) {
      // Subscribe to match updates (like new messages, match status changes)
      unsubscribeMatches = subscribeToMatches(userId, (matchUpdate) => {
        //('Match update received:', matchUpdate);
        
        setMatches(prevMatches => {
          const updatedMatches = [...prevMatches];
          const matchIndex = updatedMatches.findIndex(m => 
            m._id === matchUpdate.matchId || m.matchId === matchUpdate.matchId
          );
          
          if (matchIndex !== -1) {
            // Update existing match
            if (matchUpdate.type === 'new_message') {
              updatedMatches[matchIndex] = {
                ...updatedMatches[matchIndex],
                lastMessage: matchUpdate.message,
                hasConversation: true
              };
            } else if (matchUpdate.type === 'match_removed') {
              // Remove the match
              updatedMatches.splice(matchIndex, 1);
            }
          }
          
          return updatedMatches;
        });
      });
      
      // Subscribe to completely new matches
      unsubscribeNewMatches = subscribeToNewMatches(userId, (newMatchData) => {
        //('New match received:', newMatchData);
        
        setMatches(prevMatches => {
          // Check if match already exists
          const existingMatch = prevMatches.find(m => 
            m._id === newMatchData.matchId || 
            m.userId === newMatchData.matchedProfile?.userId
          );
          
          if (!existingMatch) {
            return [newMatchData.matchedProfile, ...prevMatches];
          }
          
          return prevMatches;
        });
        
        // Clear cache to ensure fresh data on next fetch
        clearCache('matches-with-preview');
      });
    }
    
    return () => {
      if (unsubscribeMatches) unsubscribeMatches();
      if (unsubscribeNewMatches) unsubscribeNewMatches();
    };
  }, [userId]);
  // Store user ID in ref for guest users
  useEffect(() => {
    // For authenticated users, store the user ID in the ref
    if (user?.id) {
      userIdRef.current = user.id;
    } else if (user?.user?.id) {
      userIdRef.current = user.user.id;
    } else {
      // For guest users, try to get the ID from localStorage
      const guestToken = localStorage.getItem('gymbros_guest_token');
      
      if (guestToken) {
        try {
          // Try to decode the JWT token to get the user ID
          // This is a simple decoder, not a validator
          const base64Url = guestToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          // Guest tokens could have profileId or guestId
          userIdRef.current = payload.profileId || payload.guestId;
          
          //('Found guest user ID from token:', userIdRef.current);
        } catch (e) {
          console.error('Error decoding guest token:', e);
        }
      }
    }
  }, [user]);

  // Handle match highlight events with real-time integration
  useEffect(() => {
    const handleHighlightMatch = (event) => {
      const matchedProfile = event.detail?.matchedProfile;
      if (matchedProfile) {
        // Clear cache and refresh to ensure we get the latest data
        clearCache('matches-with-preview');
        fetchMatchesAndLikes(true); // Force bypass cache
        
        // Find the match in the list and potentially open the chat
        setTimeout(() => {
          const match = matches.find(m => 
            m._id === matchedProfile._id || 
            m.name === matchedProfile.name
          );
          
          if (match) {
            // Automatically open chat with this match
            handleOpenChat(match);
          }
        }, 1000); // Wait for matches to be updated
      }
    };
    
    window.addEventListener('highlightMatch', handleHighlightMatch);
    
    return () => {
      window.removeEventListener('highlightMatch', handleHighlightMatch);
    };
  }, [matches, clearCache]);

useEffect(() => {
  if (matches.length > 0) {
    //('Processing matches:', matches);
    
    // More robust filtering based on whether the match has messages
    const conversationsList = matches.filter(match => {
      // Check if match has a conversation based on our enhanced data
      if (match.hasConversation === true) {
        return true;
      }

      if (match.messages && match.messages.length > 0) {
        return true;
      }

      if (match.lastMessage && match.lastMessage.content) {
        return true;
      }
      
      return false;
    });
    

    const newMatchesList = matches.filter(match => !conversationsList.includes(match));
    conversationsList.sort((a, b) => {
      const getTimestamp = (match) => {
        if (match.lastMessage && match.lastMessage.timestamp) {
          return new Date(match.lastMessage.timestamp);
        }
        
        if (match.messages && match.messages.length > 0) {
          const timestamps = match.messages.map(msg => new Date(msg.timestamp));
          return new Date(Math.max(...timestamps.map(date => date.getTime())));
        }
        
        return new Date(0);
      };
      
      return getTimestamp(b) - getTimestamp(a);
    });
    
    //(`Sorted into ${conversationsList.length} conversations and ${newMatchesList.length} new matches`);
    setNewMatches(newMatchesList);
    setConversations(conversationsList);
  } else {
    setNewMatches([]);
    setConversations([]);  }
}, [matches]);
  
  // Optimized refresh handler with cache bypass
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      clearCache('matches-with-preview');
      clearCache('who-liked-me-count');
      
      await fetchMatchesAndLikes(true); // Force bypass cache
      toast.success('Matches refreshed');
    } catch (error) {
      console.error('Error refreshing matches:', error);
      toast.error('Failed to refresh matches');
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleOpenChat = async (user) => {
    try {
      const targetIdentifier = user.userId || user._id;
      const matchData = await gymbrosService.findMatch(targetIdentifier);
      
      // Handle different response cases
      if (matchData === 'auth-required') {
        return navigate('/login');
      }
        if (!matchData?.matchId) {
        // Create new match if one doesn't exist
        const newMatch = await gymbrosService.createMatch(targetIdentifier);
        if (!newMatch?.matchId) {
          return toast.error('Could not start conversation');
        }
        setSelectedChat({
          userInfo: user,
          matchId: newMatch.matchId
        });
        setIsShowingChat(true);
        return;
      }
  
      // Open existing chat
      setSelectedChat({
        userInfo: user,
        matchId: matchData.matchId
      });
      setIsShowingChat(true);
  
    } catch (error) {
      console.error('Chat open error:', error);
      toast.error(error.response?.data?.message || 'Failed to open chat');
    }
  };
  
  // Handle opening profile modal
  const handleOpenProfileModal = (profileData) => {
    setSelectedProfile(profileData);
    setShowProfileModal(true);
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
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }  };
  
  // Format image URL helper
  const formatImageUrl = (url) => {
    if (!url) return getPlaceholderUrl(400, 400);
    
    if (url.startsWith('blob:') || url.startsWith('http')) {
      return url;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const separator = baseUrl.endsWith('/') ? '' : '';
      return `${baseUrl}${separator}${url.startsWith('/') ? url : `/${url}`}`;
    }
  };
  
  // Placeholder component for loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Dumbbell size={32} className="text-blue-500" />
        </motion.div>
        <p className="ml-4 text-gray-600">Loading your matches...</p>
      </div>
    );
  }
  
  // Render enhanced unlock card for "Who Liked You"
  const renderUnlockCard = () => (
    <motion.div
      className="w-28 snap-start"
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onClick={handleUnlockWhoLikedMe}
    >
      <div className="relative w-28 aspect-[7/10] rounded-lg overflow-hidden shadow-lg cursor-pointer">
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700"
          animate={{ 
            background: isHovering 
              ? [
                  "linear-gradient(to bottom right, #ec4899, #8b5cf6, #3b82f6)", 
                  "linear-gradient(to bottom right, #8b5cf6, #3b82f6, #ec4899)", 
                  "linear-gradient(to bottom right, #3b82f6, #ec4899, #8b5cf6)"
                ]
              : "linear-gradient(to bottom right, #ec4899, #8b5cf6, #3b82f6)"
          }}
          transition={{ 
            duration: isHovering ? 3 : 0,
            repeat: isHovering ? Infinity : 0,
            repeatType: "reverse" 
          }}
        />
        
        {/* Animated border */}
        <motion.div 
          className="absolute inset-0 rounded-lg"
          style={{ 
            background: "conic-gradient(from 0deg, #f9a8d4, #c084fc, #93c5fd, #f9a8d4)",
            backgroundSize: "400% 400%",
            padding: "2px"
          }}
          animate={{ 
            backgroundPosition: isHovering 
              ? ["0% 0%", "100% 100%"] 
              : "0% 0%" 
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: "mirror" 
          }}
        />
        
        {/* Content */}
        <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-pink-500/80 via-purple-600/80 to-indigo-700/80 backdrop-blur-sm">
          <div className="absolute inset-0 flex flex-col items-center justify-between py-4 px-2">
            <motion.div
              animate={{ y: isHovering ? [0, -5, 0] : 0 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror" }}
              className="flex flex-col items-center"
            >
              <Zap className="text-rose-300 h-6 w-6 mb-1" />
              <motion.div
                animate={{ 
                  scale: isHovering ? [1, 1.1, 1] : 1,
                  color: isHovering 
                    ? ["rgba(255,255,255,0.9)", "rgba(255,255,255,1)", "rgba(255,255,255,0.9)"] 
                    : "rgba(255,255,255,0.9)"
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xl font-bold text-white"
              >
                {likedMeCount}
              </motion.div>
              <p className="text-xs text-white/90 text-center">people like you</p>
            </motion.div>
            
            <motion.div
              className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mt-2"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
              animate={{
                boxShadow: isHovering 
                  ? [
                      "0 0 0 rgba(255,255,255,0.4)",
                      "0 0 20px rgba(255,255,255,0.4)",
                      "0 0 0 rgba(255,255,255,0.4)"
                    ]
                  : "0 0 0 rgba(255,255,255,0.4)"
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ 
                    rotate: isHovering ? [0, 15, 0, -15, 0] : 0 
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: isHovering ? Infinity : 0, 
                    repeatDelay: 1
                  }}
                >
                  <Sparkles size={12} className="text-yellow-200 mr-1" />
                </motion.div>
                <span className="text-xs font-medium text-white">Unlock</span>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Pulsing effect */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{ 
            boxShadow: isHovering 
              ? [
                  "0 0 0 rgba(219,39,119,0)", 
                  "0 0 25px rgba(219,39,119,0.5)", 
                  "0 0 0 rgba(219,39,119,0)"
                ] 
              : "0 0 0 rgba(219,39,119,0)" 
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity
          }}
        />
      </div>
    </motion.div>
  );
  
  // Render new matches carousel
  const renderNewMatches = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <Users size={18} className="text-blue-600 mr-2" />
          <h3 className="font-bold text-lg">New Matches</h3>
        </div>
        
        <div className="flex">
          <button
            onClick={() => handleHorizontalScroll('left')}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 mr-1 flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => handleHorizontalScroll('right')}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      <div
        ref={matchesCarouselRef}
        className="flex overflow-x-auto gap-4 pb-3 scrollbar-hide snap-x snap-mandatory"
      >
        {/* Who Liked You card (first position) */}
        {renderUnlockCard()}          {/* New Matches */}
        {newMatches.length > 0 ? (
          newMatches.map(match => (
            <motion.div
              key={match._id}
              className="w-28 snap-start"
              whileHover={{ scale: 1.03 }}
              onClick={() => handleOpenChat(match)}
            >
              <div className="relative w-28 aspect-[7/10] rounded-lg overflow-hidden shadow-md bg-gray-100 cursor-pointer">
                <img
                  src={formatImageUrl(match.profileImage || (match.images && match.images[0]))}
                  alt={match.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/400/400";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-sm font-semibold truncate">{match.name.split(' ')[0]}</p>
                  <div className="flex items-center mt-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Zap size={12} className="text-blue-300 mr-1" />
                    </motion.div>
                    <p className="text-white/90 text-xs">New Match</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`empty-${index}`} className="w-28 snap-start">
              <div className="w-28 aspect-[7/10] rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                <p className="text-gray-400 text-xs text-center px-2">No more matches</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
 
const renderConversations = () => {
  const currentUserId = user?.id || (user?.user && user?.user.id) || userIdRef.current;
  
  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <MessageCircle size={18} className="text-blue-600 mr-2" />
          <h3 className="font-bold text-lg">Messages</h3>
        </div>
        
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
          >
            <ChevronRight size={18} className="rotate-90" />
          </motion.div>
        </button>
      </div>
      
      {conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map(match => {
            const isLastMessageFromUser = match.lastMessage && (
              match.lastMessage.isYours === true || 
              (currentUserId && match.lastMessage.sender === currentUserId) ||
              (typeof match.lastMessage.sender === 'object' && match.lastMessage.sender?._id === currentUserId) ||
              (typeof match.lastMessage.sender === 'object' && match.lastMessage.sender?.id === currentUserId)
            );
            
            const displayUnreadCount = false;            return (
              <motion.div
                key={match._id}
                whileHover={{ 
                  scale: 1.02, 
                  backgroundColor: darkMode ? "rgba(31, 41, 55, 0.8)" : "rgba(249, 250, 251, 1)" 
                }}
                className={`${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-750' 
                    : 'bg-white hover:bg-gray-50'
                } rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all`}
                onClick={() => handleOpenChat(match)}
              >
                <div className="p-3 flex items-center">
                  <div className="relative">
                    <div 
                      className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfileModal(match);
                      }}
                    >
                      <img
                        src={formatImageUrl(match.profileImage || (match.images && match.images[0]))}
                        alt={match.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/api/placeholder/400/400";
                        }}
                      />
                    </div>
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
                    
                    {/* Make text bold ONLY when it's not from the current user */}
                    <p className={`text-sm truncate ${isLastMessageFromUser ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                      {match.lastMessage 
                        ? `${isLastMessageFromUser ? 'You: ' : ''}${match.lastMessage.content || 'Sent an image'}`
                        : 'Start a conversation'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 mt-2 text-center">
          <motion.div
            className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <MessageCircle size={28} className="text-blue-500" />
          </motion.div>
          <h4 className="text-lg font-medium text-gray-800 mb-1">No messages yet</h4>
          <p className="text-gray-500 text-sm mb-4">Start a conversation with your new matches</p>
          
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="text-xs text-blue-600 flex items-center justify-center"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronLeft className="h-4 w-4 rotate-90" />
              <span>Check out your matches above</span>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
  
  return (
    <div className="h-[calc(100vh-136px)] flex flex-col p-4 overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-hidden flex flex-col">
        {matches.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col">
            {renderNewMatches()}
            
            <div className="flex-1 flex items-center justify-center">
              <EmptyStateMessage
                type="noMatches"
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        ) : (
          <>
            {renderNewMatches()}
            
            {renderConversations()}
          </>
        )}
      </div>
      
      <AnimatePresence>
        {isShowingChat && selectedChat && (
          <GymBrosMatchChat
            key={selectedChat.matchId}
            otherUserInfo={selectedChat.userInfo}
            matchId={selectedChat.matchId}
            onClose={() => {
              setIsShowingChat(false);
              setSelectedChat(null);
              fetchMatchesAndLikes();
            }}
          />        )}
      </AnimatePresence>      {/* Profile Detail Modal */}
      <ProfileDetailModal 
        profile={selectedProfile}
        isVisible={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfile(null);
        }}
        isMatch={true}
        userProfile={user}
        fullScreen={true}
        onLike={() => {}}
        onDislike={() => {}}
        onSuperLike={() => {}}
      />
    </div>
  );
};

export default GymbrosMatchesList;