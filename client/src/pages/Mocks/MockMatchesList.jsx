import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, MessageCircle, ChevronRight, 
  ChevronLeft, Sparkles, Zap, Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import EmptyStateMessage from '../components/gymBros/components/EmptyStateMessage';
import ProfileDetailModal from '../components/gymBros/components/ProfileDetailModal';

// Mock data for matches with conversations
const MOCK_CONVERSATIONS = [
  {
    _id: 'mock-match-1',
    userId: 'mock-user-1',
    name: 'Sarah Miller',
    age: 26,
    profileImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop'],
    workoutTypes: ['Yoga', 'Running'],
    preferredTime: 'Morning',
    primaryGym: { name: 'CorePower Yoga' },
    lastActive: new Date(Date.now() - 300000), // 5 min ago
    lastMessage: {
      content: 'Yes! I love that gym too. Want to meet for legs day tomorrow at 7am?',
      timestamp: new Date(Date.now() - 1800000), // 30 min ago
      sender: 'mock-user-1',
      isYours: false
    },
    hasConversation: true
  },
  {
    _id: 'mock-match-2',
    userId: 'mock-user-2',
    name: 'Mike Johnson',
    age: 32,
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MikeJohnson&backgroundColor=ffd5dc',
    images: ['https://images.unsplash.com/photo-1583500178450-e59e4309b57d?w=400&h=600&fit=crop'],
    workoutTypes: ['Weightlifting', 'CrossFit'],
    preferredTime: 'Evening',
    primaryGym: { name: 'Elite Fitness' },
    lastActive: new Date(Date.now() - 7200000), // 2 hours ago
    lastMessage: {
      content: 'Great workout today! Same time next week?',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      sender: 'current-user',
      isYours: true
    },
    hasConversation: true
  },
  {
    _id: 'mock-match-3',
    userId: 'mock-user-4',
    name: 'Alex Thompson',
    age: 29,
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexThompson&backgroundColor=ffdfba',
    images: ['https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=400&h=600&fit=crop'],
    workoutTypes: ['CrossFit', 'Olympic Lifting'],
    preferredTime: 'Morning',
    primaryGym: { name: 'CrossFit NYC' },
    lastActive: new Date(Date.now() - 86400000), // 1 day ago
    lastMessage: {
      content: 'That WOD was intense! 💪',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      sender: 'mock-user-4',
      isYours: false
    },
    hasConversation: true
  }
];

const MOCK_NEW_MATCHES = [
  {
    _id: 'mock-new-match-1',
    userId: 'mock-user-3',
    name: 'Emily Chen',
    age: 24,
    profileImage: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=600&fit=crop'],
    workoutTypes: ['Weightlifting', 'HIIT'],
    preferredTime: 'Flexible',
    primaryGym: { name: 'LA Fitness' },
    lastActive: new Date(Date.now() - 3600000), // 1 hour ago
    hasConversation: false
  },
  {
    _id: 'mock-new-match-2',
    userId: 'mock-user-5',
    name: 'Jessica Rodriguez',
    age: 27,
    profileImage: 'https://images.unsplash.com/photo-1549476464-37392f717541?w=400&h=600&fit=crop',
    images: ['https://images.unsplash.com/photo-1549476464-37392f717541?w=400&h=600&fit=crop'],
    workoutTypes: ['Boxing', 'HIIT'],
    preferredTime: 'Evening',
    primaryGym: { name: 'Title Boxing' },
    lastActive: new Date(Date.now() - 10800000), // 3 hours ago
    hasConversation: false
  }
];

const MockMatchesList = () => {
  const [conversations] = useState(MOCK_CONVERSATIONS);
  const [newMatches] = useState(MOCK_NEW_MATCHES);
  const [likedMeCount] = useState(17); // Mock number
  const [isHovering, setIsHovering] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const matchesCarouselRef = useRef(null);
  
  const handleHorizontalScroll = (direction) => {
    if (matchesCarouselRef.current) {
      const scrollAmount = 120;
      if (direction === 'left') {
        matchesCarouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        matchesCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };
  
  const handleOpenChat = (user) => {
    toast('Chat feature coming soon! (Demo mode)', { icon: '💬' });
  };
  
  const handleUnlockWhoLikedMe = () => {
    toast('Premium feature - available in the full app!', { icon: '💎' });
  };
  
  const handleOpenProfileModal = (profileData) => {
    setSelectedProfile(profileData);
    setShowProfileModal(true);
  };
  
  const renderUnlockCard = () => (
    <motion.div
      className="w-28 snap-start"
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      onClick={handleUnlockWhoLikedMe}
    >
      <div className="relative w-28 aspect-[7/10] rounded-lg overflow-hidden shadow-lg cursor-pointer">
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
          >
            <div className="flex items-center justify-center">
              <Sparkles size={12} className="text-yellow-200 mr-1" />
              <span className="text-xs font-medium text-white">Unlock</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
  
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
        {/* Who Liked You card */}
        {renderUnlockCard()}
        
        {/* New Matches */}
        {newMatches.map(match => (
          <motion.div
            key={match._id}
            className="w-28 snap-start"
            whileHover={{ scale: 1.03 }}
            onClick={() => handleOpenChat(match)}
          >
            <div className="relative w-28 aspect-[7/10] rounded-lg overflow-hidden shadow-md bg-gray-100 cursor-pointer">
              <img
                src={match.profileImage}
                alt={match.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-sm font-semibold truncate">{match.name}</p>
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
        ))}
      </div>
    </div>
  );
  
  const renderConversations = () => (
    <div className="flex-1 overflow-y-auto pb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <MessageCircle size={18} className="text-blue-600 mr-2" />
          <h3 className="font-bold text-lg">Messages</h3>
        </div>
      </div>
      
      <div className="space-y-3">
        {conversations.map(match => {
          const isLastMessageFromUser = match.lastMessage?.isYours === true;
          
          return (
            <motion.div
              key={match._id}
              whileHover={{ 
                scale: 1.02, 
                backgroundColor: "rgba(249, 250, 251, 1)"
              }}
              className="bg-white hover:bg-gray-50 rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all"
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
                      src={match.profileImage}
                      alt={match.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Active indicator */}
                  {match.lastActive && (new Date() - match.lastActive) < 300000 && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
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
                  
                  <p className="text-xs text-gray-500">
                    {match.lastActive && (new Date() - match.lastActive) < 300000
                      ? 'Active now'
                      : `Active ${formatDistanceToNow(match.lastActive, { addSuffix: true })}`}
                  </p>
                  
                  <p className={`text-sm truncate ${isLastMessageFromUser ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                    {match.lastMessage 
                      ? `${isLastMessageFromUser ? 'You: ' : ''}${match.lastMessage.content}`
                      : 'Start a conversation'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
  
  return (
    <div className="h-full flex flex-col p-4 overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderNewMatches()}
        {renderConversations()}
      </div>
      
      {/* Profile Detail Modal */}
      <ProfileDetailModal 
        profile={selectedProfile}
        isVisible={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfile(null);
        }}
        isMatch={true}
        fullScreen={true}
      />
    </div>
  );
};

export default MockMatchesList;