import React, { useState, useEffect } from 'react';
import { useSprings, animated, to as interpolate } from '@react-spring/web';
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
import { motion, AnimatePresence } from 'framer-motion';

import styles from './styles.module.css';

const MatchesStackedDeck = ({ gymBrosData, userProfile, onNavigate, onOpenChat }) => {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [newMatches, setNewMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentUserId = user?.id || user?.user?.id;

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
      setNewMatches(newMatchesList.slice(0, 6)); // Show max 6 in stacked deck
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

  // React Spring Deck Component - Auto Left/Right Swiping
  const SpringStackedDeck = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1); // 1 for right, -1 for left
    
    // Auto-swipe cards left/right every 3 seconds
    useEffect(() => {
      if (newMatches.length === 0) return;
      
      // For single card, add subtle breathing animation
      if (newMatches.length === 1) {
        const interval = setInterval(() => {
          setDirection(prev => prev * -1);
        }, 2000);
        return () => clearInterval(interval);
      }
      
      // For multiple cards, auto-swipe
      const interval = setInterval(() => {
        // Alternate direction: right, left, right, left...
        setDirection(prev => prev * -1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % newMatches.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }, [newMatches.length]);
    
    if (newMatches.length === 0) {
      return (
        <div 
          className="relative h-60 flex items-center justify-center cursor-pointer hover:bg-white/5 rounded-2xl transition-colors"
          onClick={() => onNavigate('/gymbros')}
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-purple-400" />
            </div>
            <p className="text-white/80 font-medium">No new matches yet</p>
            <p className="text-white/60 text-sm">Tap to find connections!</p>
          </div>
        </div>
      );
    }

    // Helper functions for card positioning - simulate left/right swipe
    const to = (i, activeIndex, swipeDirection) => {
      // Single card case - subtle breathing animation
      if (newMatches.length === 1) {
        return {
          x: 0,
          y: 0,
          scale: swipeDirection > 0 ? 1.02 : 0.98,
          rot: swipeDirection > 0 ? 1 : -1,
          opacity: 1,
          zIndex: 100,
        };
      }
      
      // Multiple cards case - swipe animation
      const isActive = i === activeIndex;
      const isPrevious = i === (activeIndex - 1 + newMatches.length) % newMatches.length;
      const isNext = i === (activeIndex + 1) % newMatches.length;
      
      if (isActive) {
        return {
          x: 0,
          y: 0,
          scale: 1,
          rot: 0,
          opacity: 1,
          zIndex: 100,
        };
      } else if (isPrevious) {
        return {
          x: swipeDirection > 0 ? -400 : 400, // Slide off to opposite side
          y: 0,
          scale: 1,
          rot: swipeDirection > 0 ? -15 : 15,
          opacity: 0,
          zIndex: 50,
        };
      } else if (isNext) {
        return {
          x: swipeDirection > 0 ? 400 : -400, // Come in from opposite side
          y: 0,
          scale: 1,
          rot: swipeDirection > 0 ? 15 : -15,
          opacity: 0,
          zIndex: 50,
        };
      } else {
        return {
          x: 0,
          y: -20,
          scale: 0.9,
          rot: 0,
          opacity: 0,
          zIndex: 10,
        };
      }
    };
    
    const from = (_i) => ({ x: 0, rot: 0, scale: 1, y: 0, opacity: 1 });
    
    // Transform interpolation
    const trans = (r, s) =>
      `perspective(1500px) rotateX(15deg) rotateY(${r / 8}deg) rotateZ(${r}deg) scale(${s})`;

    const [props, api] = useSprings(newMatches.length, i => ({
      ...to(i, currentIndex, direction),
      from: from(i),
    }));

    // Update springs when currentIndex changes
    useEffect(() => {
      api.start(i => ({
        ...to(i, currentIndex, direction),
        config: newMatches.length === 1 
          ? { tension: 120, friction: 20 } // Smoother for single card breathing
          : { tension: 200, friction: 25 }  // Snappier for multiple card swipes
      }));
    }, [currentIndex, direction, api, newMatches.length]);

    return (
      <div 
        className={`${styles.container} cursor-pointer hover:bg-white/5 rounded-2xl transition-colors`}
        onClick={() => onNavigate('/gymbros')}
      >
        {props.map(({ x, y, rot, scale, opacity, zIndex }, i) => {
          const match = newMatches[i];
          if (!match) return null;

          return (
            <animated.div 
              className={styles.deck} 
              key={match._id || i} 
              style={{ x, y, zIndex }}
            >
              <animated.div
                style={{
                  transform: interpolate([rot, scale], trans),
                  backgroundImage: `url(${formatImageUrlHelper(match.profileImage || (match.images && match.images[0]))})`,
                  opacity,
                }}
              >
                {/* Active Status Indicator */}
                <div className={styles.activeStatus}></div>
                
                {/* Card Content Overlay */}
                <div className={styles.cardContent}>
                  <div className={styles.cardName}>
                    {match.name?.split(' ')[0]}
                  </div>
                  <div className={styles.cardAge}>
                    {match.age} years old
                  </div>
                  
                  <div className={styles.cardInfo}>
                    <span>
                      <MapPin size={12} />
                      {match.distance || '1.2'} mi away
                    </span>
                  </div>

                  {/* Workout Types */}
                  {match.workoutTypes && match.workoutTypes.length > 0 && (
                    <div className={styles.workoutTags}>
                      {match.workoutTypes.slice(0, 3).map((type, idx) => (
                        <span key={idx} className={styles.workoutTag}>
                          {type}
                        </span>
                      ))}
                      {match.workoutTypes.length > 3 && (
                        <span className={styles.workoutTag}>
                          +{match.workoutTypes.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </animated.div>
            </animated.div>
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
      {/* Spring Stacked Deck */}
      <SpringStackedDeck />

      {/* Messages Section */}
      <MessagesSection />
    </div>
  );
};

export default MatchesStackedDeck;