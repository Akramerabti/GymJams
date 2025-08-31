import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  Star, 
  MessageCircle, 
  Clock, 
  Heart,
  Zap,
  ChevronRight,
  Award,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import gymBrosService from '../../services/gymbros.service';
import { formatImageUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';
import useAuthStore from '../../stores/authStore';
import ActiveStatus from '../gymBros/components/ActiveStatus';

const MatchesStackedDeck = ({ gymBrosData, userProfile, onNavigate, onOpenChat }) => {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [newMatches, setNewMatches] = useState([]);
  const [frontCardIndex, setFrontCardIndex] = useState(0);
  const [animatingCardIndex, setAnimatingCardIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentUserId = user?.id || user?.user?.id;

  // Auto-cycle cards with visible animation
  useEffect(() => {
    if (newMatches.length <= 1) return;
    
    const interval = setInterval(() => {
      // Start animation with the next card in the stack
      const nextCard = (frontCardIndex + 1) % newMatches.length;
      setAnimatingCardIndex(nextCard);
      
      // After animation completes, set it as the new front card
      setTimeout(() => {
        setFrontCardIndex(nextCard);
        setAnimatingCardIndex(null);
      }, 1800); // Slightly longer to account for the improved animation
      
    }, 3000); // Start new cycle every 3 seconds
    
    return () => clearInterval(interval);
  }, [newMatches.length, frontCardIndex]);

  useEffect(() => {
    if (gymBrosData?.recentMatches) {
      processMatches(gymBrosData.recentMatches);
    }
  }, [gymBrosData]);

  const processMatches = async (matchesData) => {
    setLoading(true);
    try {
      // Process matches and separate conversations from new matches
      const conversationsList = matchesData.filter(match => {
        return (
          match.hasConversation === true ||
          (match.messages && match.messages.length > 0) ||
          (match.lastMessage && match.lastMessage.content)
        );
      });

      const newMatchesList = matchesData.filter(match => !conversationsList.includes(match));

      // Sort conversations by most recent message
      conversationsList.sort((a, b) => {
        const getTimestamp = (match) => {
          if (match.lastMessage?.timestamp) {
            return new Date(match.lastMessage.timestamp);
          }
          if (match.messages?.length > 0) {
            const timestamps = match.messages.map(msg => new Date(msg.timestamp));
            return new Date(Math.max(...timestamps.map(date => date.getTime())));
          }
          return new Date(0);
        };
        return getTimestamp(b) - getTimestamp(a);
      });

      setMatches(matchesData);
      setConversations(conversationsList);
      setNewMatches(newMatchesList.slice(0, 5)); // Show max 5 in stacked deck
    } catch (error) {
      console.error('Error processing matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (match) => {
    if (onOpenChat) {
      onOpenChat(match);
    }
  };

  const formatImageUrlHelper = (url) => {
    if (!url) return getFallbackAvatarUrl();
    
    if (url.startsWith('blob:') || url.startsWith('http')) {
      return url;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const separator = baseUrl.endsWith('/') ? '' : '';
      return `${baseUrl}${separator}${url.startsWith('/') ? url : `/${url}`}`;
    }
  };

  // Tinder-style stacked deck component
  const StackedDeck = () => {
    if (newMatches.length === 0) {
      return (
        <div className="relative h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-purple-400" />
            </div>
            <p className="text-white/80 font-medium">No new matches yet</p>
            <p className="text-white/60 text-sm">Keep swiping to find connections!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-80 flex items-center justify-center">
        {newMatches.map((match, index) => {
          const isFrontCard = index === frontCardIndex;
          const isAnimatingCard = index === animatingCardIndex;
          
          // Calculate stack position (cards behind the front card)
          let stackPosition = 0;
          if (index !== frontCardIndex) {
            // Calculate how far back this card is in the stack
            if (index > frontCardIndex) {
              stackPosition = index - frontCardIndex;
            } else {
              stackPosition = (newMatches.length - frontCardIndex) + index;
            }
          }
          
          const baseOffset = stackPosition * 12;
          const rotationOffset = stackPosition * 2;
          
          // Calculate z-index - animating card should always be on top
          let zIndexValue = 50 - stackPosition;
          if (isFrontCard) zIndexValue = 100;
          if (isAnimatingCard) zIndexValue = 1000;
          
          return (
            <motion.div
              key={match._id || index}
              className="absolute cursor-pointer"
              style={{ 
                zIndex: zIndexValue // Use style prop for more reliable z-index control
              }}
              animate={{
                // Enhanced animation: lift high above, move forward, then settle
                y: isAnimatingCard 
                  ? [-baseOffset, -120, -80, 0]  // Go higher and with more steps
                  : isFrontCard ? 0 : -baseOffset,
                x: isAnimatingCard 
                  ? [baseOffset, baseOffset * 0.5, baseOffset * 0.2, 0] 
                  : isFrontCard ? 0 : baseOffset,
                rotate: isAnimatingCard 
                  ? [rotationOffset, rotationOffset * 0.3, 0, 0] 
                  : isFrontCard ? 0 : rotationOffset,
                scale: isAnimatingCard 
                  ? [0.9 - (stackPosition * 0.05), 1.15, 1.05, 1] 
                  : isFrontCard ? 1 : 0.9 - (stackPosition * 0.05),
              }}
              transition={{
                duration: isAnimatingCard ? 1.8 : 0.5,
                ease: isAnimatingCard ? "easeInOut" : "easeOut",
                times: isAnimatingCard ? [0, 0.4, 0.7, 1] : undefined
              }}
              onClick={() => handleCardClick(match)}
            >
              <div className="w-64 h-80 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Profile Image */}
                <div className="relative h-48 overflow-hidden">
                  <motion.img
                    src={formatImageUrlHelper(match.profileImage || (match.images && match.images[0]))}
                    alt={match.name}
                    className="w-full h-full object-cover"
                    animate={{
                      scale: (isFrontCard || isAnimatingCard) ? 1.1 : 1,
                      transition: { duration: 0.3 }
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getFallbackAvatarUrl();
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Active Status Indicator */}
                  <div className="absolute top-4 right-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  </div>

                  {/* Match Badge */}
                  <motion.div 
                    className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-blue-500 text-white px-3 py-1 rounded-full flex items-center"
                    animate={{
                      scale: (isFrontCard || isAnimatingCard) ? [1, 1.1, 1] : 1,
                      transition: { 
                        duration: 1, 
                        repeat: (isFrontCard || isAnimatingCard) ? Infinity : 0,
                        repeatType: "reverse"
                      }
                    }}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    <span className="text-xs font-bold">NEW</span>
                  </motion.div>
                </div>

                {/* Profile Info */}
                <div className="p-4 bg-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold text-lg truncate">
                      {match.name?.split(' ')[0]}, {match.age}
                    </h3>
                    <div className="flex items-center text-white/70">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{match.distance || '1.2'} mi</span>
                    </div>
                  </div>

                  {/* Workout Types */}
                  {match.workoutTypes && match.workoutTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {match.workoutTypes.slice(0, 2).map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-500/20 backdrop-blur-sm text-blue-300 rounded-full text-xs font-medium border border-blue-400/30"
                        >
                          {type}
                        </span>
                      ))}
                      {match.workoutTypes.length > 2 && (
                        <span className="px-2 py-1 bg-gray-500/20 backdrop-blur-sm text-gray-300 rounded-full text-xs font-medium border border-gray-400/30">
                          +{match.workoutTypes.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bio Preview */}
                  {match.bio && (
                    <p className="text-white/80 text-sm line-clamp-2 mb-3">
                      {match.bio}
                    </p>
                  )}

                  {/* Action Hint */}
                  <motion.div 
                    className="flex items-center justify-center text-white/60"
                    animate={{
                      opacity: (isFrontCard || isAnimatingCard) ? [0.6, 1, 0.6] : 0.6,
                      transition: { 
                        duration: 1.5, 
                        repeat: (isFrontCard || isAnimatingCard) ? Infinity : 0 
                      }
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    <span className="text-xs">Click to chat</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Messages Section
  const MessagesSection = () => {
    if (conversations.length === 0) {
      return (
        <div className="mt-6 bg-black/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
          <MessageCircle className="w-12 h-12 text-purple-400/60 mx-auto mb-3" />
          <p className="text-white/80 font-medium mb-1">No new messages</p>
          <p className="text-white/60 text-sm">Start conversations with your matches above!</p>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-purple-400" />
            Messages ({conversations.length})
          </h3>
          <motion.button
            className="text-purple-300 hover:text-purple-200 text-sm font-medium flex items-center"
            whileHover={{ x: 5 }}
            onClick={() => onNavigate('/gymbros')}
          >
            View all <ChevronRight className="w-4 h-4 ml-1" />
          </motion.button>
        </div>

        <div className="space-y-3">
          {conversations.slice(0, 3).map((match, index) => {
            const isLastMessageFromUser = match.lastMessage && (
              match.lastMessage.isYours === true || 
              (currentUserId && match.lastMessage.sender === currentUserId) ||
              (typeof match.lastMessage.sender === 'object' && match.lastMessage.sender?._id === currentUserId)
            );

            return (
              <motion.div
                key={match._id || index}
                className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 cursor-pointer hover:bg-black/30 transition-all duration-300"
                whileHover={{ scale: 1.02, x: 5 }}
                onClick={() => handleCardClick(match)}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20">
                      <img
                        src={formatImageUrlHelper(match.profileImage || (match.images && match.images[0]))}
                        alt={match.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getFallbackAvatarUrl();
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black"></div>
                  </div>
                  
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-white font-semibold truncate">{match.name}</h4>
                      <p className="text-white/60 text-xs">
                        {match.lastMessage?.timestamp 
                          ? formatDistanceToNow(new Date(match.lastMessage.timestamp), { addSuffix: true })
                          : 'New match'}
                      </p>
                    </div>
                    
                    <ActiveStatus lastActive={match.lastActive} />
                    
                    <p className={`text-sm truncate mt-1 ${
                      isLastMessageFromUser ? 'text-white/60' : 'text-white font-medium'
                    }`}>
                      {match.lastMessage 
                        ? `${isLastMessageFromUser ? 'You: ' : ''}${match.lastMessage.content || 'Sent an image'}`
                        : 'Start a conversation'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {conversations.length > 3 && (
          <motion.button
            className="w-full mt-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-3 rounded-xl transition-all duration-300 font-medium border border-purple-500/30"
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('/gymbros')}
          >
            View {conversations.length - 3} more conversations
          </motion.button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-morphism p-3 rounded-xl text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{gymBrosData.matchesCount || 0}</p>
          <p className="text-gray-300 text-xs">Connections</p>
        </div>
        <div className="glass-morphism p-3 rounded-xl text-center">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{newMatches.length}</p>
          <p className="text-gray-300 text-xs">New Matches</p>
        </div>
        <div className="glass-morphism p-3 rounded-xl text-center">
          <MessageCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{conversations.length}</p>
          <p className="text-gray-300 text-xs">Active Chats</p>
        </div>
      </div>

      {/* New Matches Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg flex items-center">
          <Zap className="w-5 h-5 mr-2 text-orange-400" />
          New Matches
        </h3>
        {newMatches.length > 0 && (
          <p className="text-white/60 text-sm">Hover to preview</p>
        )}
      </div>

      {/* Stacked Deck */}
      <StackedDeck />

      {/* Messages Section */}
      <MessagesSection />
    </div>
  );
};

export default MatchesStackedDeck;