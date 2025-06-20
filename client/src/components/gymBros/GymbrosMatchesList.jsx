import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Lock, MessageCircle, Star, Shield, ChevronRight, 
  ChevronLeft, Sparkles, Zap, Users, Info,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import gymbrosService from '../../services/gymbros.service';
import { usePoints } from '../../hooks/usePoints';
import useAuthStore from '../../stores/authStore';
import GymBrosMatchChat from './components/GymBrosMatchChat';
import ActiveStatus from './components/ActiveStatus';
import EmptyStateMessage from './components/EmptyStateMessage';
import { getPlaceholderUrl } from '../../utils/imageUtils';

// Premium feature unlock cost
const PREMIUM_FEATURES = {
  WHO_LIKED_ME: 100
};

const GymbrosMatchesList = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { balance: pointsBalance, subtractPoints, updatePointsInBackend } = usePoints();
  
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
  
  // Animation state for the unlock card
  const [isHovering, setIsHovering] = useState(false);
  
  // Refs
  const matchesCarouselRef = useRef(null);
  const userIdRef = useRef(null);
const lastLikesCountFetchRef = useRef(0);
  
  // Fetch matches and liked count on component mount
  useEffect(() => {
    fetchMatchesAndLikes();
  }, []);

  useEffect(() => {
    // Listen for match highlight events
    const handleHighlightMatch = (event) => {
      const matchedProfile = event.detail?.matchedProfile;
      if (matchedProfile) {
        // Refresh matches to show the new match
        fetchMatchesAndLikes();
        
        // Find the match in the list and potentially open the chat
        const match = matches.find(m => 
          m._id === matchedProfile._id || 
          m.name === matchedProfile.name
        );
        
        if (match) {
          // Automatically open chat with this match
          handleOpenChat(match);
        }
      }
    };
    
    window.addEventListener('highlightMatch', handleHighlightMatch);
    
    return () => {
      window.removeEventListener('highlightMatch', handleHighlightMatch);
    };
  }, [matches]);
  
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
          
          console.log('Found guest user ID from token:', userIdRef.current);
        } catch (e) {
          console.error('Error decoding guest token:', e);
        }
      }
    }
  }, [user]);

useEffect(() => {
  if (matches.length > 0) {
    console.log('Processing matches:', matches);
    
    // More robust filtering based on whether the match has messages
    const conversationsList = matches.filter(match => {
      // Check if match has a conversation based on our enhanced data
      if (match.hasConversation === true) {
        return true;
      }
      
      // Check if match has messages array with content
      if (match.messages && match.messages.length > 0) {
        return true;
      }
      
      // Check if match has lastMessage object with content
      if (match.lastMessage && match.lastMessage.content) {
        return true;
      }
      
      // No messages found
      return false;
    });
    
    // All other matches are considered new
    const newMatchesList = matches.filter(match => !conversationsList.includes(match));
    
    // Sort conversations by most recent message time
    conversationsList.sort((a, b) => {
      // Get timestamp from whatever form lastMessage takes
      const getTimestamp = (match) => {
        if (match.lastMessage && match.lastMessage.timestamp) {
          return new Date(match.lastMessage.timestamp);
        }
        
        if (match.messages && match.messages.length > 0) {
          // Get the latest message timestamp
          const timestamps = match.messages.map(msg => new Date(msg.timestamp));
          return new Date(Math.max(...timestamps.map(date => date.getTime())));
        }
        
        return new Date(0);
      };
      
      return getTimestamp(b) - getTimestamp(a);
    });
    
    console.log(`Sorted into ${conversationsList.length} conversations and ${newMatchesList.length} new matches`);
    setNewMatches(newMatchesList);
    setConversations(conversationsList);
  } else {
    setNewMatches([]);
    setConversations([]);
  }
}, [matches]);
  
const fetchMatchesAndLikes = async () => {
  setLoading(true);
  try {
    // Fetch matches with message preview
    const matchesData = await gymbrosService.getMatchesWithPreview();
    
    // Process and sort matches
    const sortedMatches = Array.isArray(matchesData) ? matchesData : [];
    setMatches(sortedMatches);
    
    // Check if we should fetch the likes count based on time
    const now = Date.now();
    const timeSinceLastFetch = now - lastLikesCountFetchRef.current;
    const MIN_FETCH_INTERVAL = 60000; // 1 minute minimum between fetches
    
    if (timeSinceLastFetch > MIN_FETCH_INTERVAL) {
      try {
        // Fetch who liked me count
        const likedCount = await gymbrosService.getWhoLikedMeCount();
        setLikedMeCount(likedCount);
        
        // Update the last fetch timestamp
        lastLikesCountFetchRef.current = now;
      } catch (likeError) {
        // Handle rate limiting for likes count specifically
        if (likeError.response?.status === 429) {
          console.log('Rate limited on likes count, using previous value');
          // Don't show toast for this specific error to avoid spamming the user
        } else {
          console.error('Error fetching who liked me count:', likeError);
          // Only show toast for non-rate-limit errors
          toast.error('Could not update likes count');
        }
        // Keep the previous likes count value
      }
    } else {
      console.log('Skipping likes count fetch due to rate limiting', {
        timeSince: timeSinceLastFetch,
        minInterval: MIN_FETCH_INTERVAL
      });
    }
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
  
  const handleOpenChat = async (user) => {
    try {
      console.log('Opening chat with:', user);
      
      // Determine the correct identifier based on user type
      const targetIdentifier = user.userId || user._id;
      
      console.log('Target identifier:', targetIdentifier);
      // Get actual match ID between current user and target user
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
        return setSelectedChat({
          userInfo: user,
          matchId: newMatch.matchId
        });
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
        {renderUnlockCard()}
        
        {/* New Matches */}
        {newMatches.length > 0 ? (
          newMatches.map(match => (
            <motion.div
              key={match._id}
              className="w-28 snap-start"
              whileHover={{ scale: 1.03 }}
              onClick={() => handleOpenChat(match)}
            >
              <div className="relative w-28 aspect-[7/10] rounded-lg overflow-hidden shadow-md bg-gray-100">
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
                  <p className="text-white text-sm font-semibold truncate">{match.name}, {match.age}</p>
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
          // Show empty placeholders if no new matches
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
 
// Updated renderConversations with bold text for messages from others
const renderConversations = () => {
  // Get userId from the authentication store or from ref for guest users
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
            // More thorough check if last message is from current user with fallback checks
            const isLastMessageFromUser = match.lastMessage && (
              match.lastMessage.isYours === true || 
              (currentUserId && match.lastMessage.sender === currentUserId) ||
              (typeof match.lastMessage.sender === 'object' && match.lastMessage.sender?._id === currentUserId) ||
              (typeof match.lastMessage.sender === 'object' && match.lastMessage.sender?.id === currentUserId)
            );
            
            // IMPORTANT: Never show unread count notification badge
            const displayUnreadCount = false;
            
            return (
              <motion.div
                key={match._id}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(249, 250, 251, 1)" }}
                className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all"
                onClick={() => handleOpenChat(match)}
              >
                <div className="p-3 flex items-center">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100">
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
                    
                    {/* Notification badge removed */}
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
      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* If no matches at all, show empty state with unlock card */}
        {matches.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col">
            {/* Always show new matches section with unlock card */}
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
            {/* New Matches */}
            {renderNewMatches()}
            
            {/* Messages - always show the section even if empty */}
            {renderConversations()}
          </>
        )}
      </div>
      
      {/* Chat overlay when a match is selected */}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GymbrosMatchesList;