import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  ArrowRight, 
  Users, 
  UserPlus, 
  Heart, 
  Zap,
  Star,
  Target,
  ChevronLeft,
  ChevronRight,
  Map,
  Sparkles,
  Trophy,
  MessageCircle
} from 'lucide-react';
import gymBrosService from '../../services/gymbros.service';
import { formatImageUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';
import NoMatchesShowcase from './NoMatchesShowcase';

const SocialMapSection = ({ onNavigate }) => {
  const [gymBrosData, setGymBrosData] = useState(null);
  const [gymBrosLoading, setGymBrosLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSwipeAnimating, setIsSwipeAnimating] = useState(false);
  const carouselRef = useRef(null);

  // Sample attraction cards for users without profile
  const attractionCards = [
    {
      id: 1,
      name: 'Alex M.',
      age: 24,
      distance: '0.3 mi',
      image: '/api/placeholder/400/500',
      interests: ['Powerlifting', 'CrossFit'],
      status: '🔥 Just finished leg day',
      gradient: 'from-orange-400 to-red-500'
    },
    {
      id: 2,
      name: 'Sarah K.',
      age: 28,
      distance: '0.8 mi', 
      image: '/api/placeholder/400/500',
      interests: ['Yoga', 'Running'],
      status: '💪 Looking for workout buddy',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      id: 3,
      name: 'Mike R.',
      age: 26,
      distance: '1.2 mi',
      image: '/api/placeholder/400/500', 
      interests: ['Bodybuilding', 'Nutrition'],
      status: '🎯 Training for competition',
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      id: 4,
      name: 'Emma L.',
      age: 23,
      distance: '1.5 mi',
      image: '/api/placeholder/400/500',
      interests: ['Pilates', 'Dance'],
      status: '✨ New to the gym scene',
      gradient: 'from-green-400 to-emerald-500'
    }
  ];

  useEffect(() => {
    const fetchGymBrosData = async () => {
      try {
        setGymBrosLoading(true);
        const profileResponse = await gymBrosService.getGymBrosProfile();
        
        if (profileResponse.hasProfile) {
          try {
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
      } catch {
        setGymBrosData({ hasProfile: false });
      } finally {
        setGymBrosLoading(false);
      }
    };

    fetchGymBrosData();
  }, []);

  const nextCard = () => {
    if (isSwipeAnimating) return;
    setIsSwipeAnimating(true);
    setCurrentCardIndex((prev) => (prev + 1) % attractionCards.length);
    setTimeout(() => setIsSwipeAnimating(false), 300);
  };

  const prevCard = () => {
    if (isSwipeAnimating) return;
    setIsSwipeAnimating(true);
    setCurrentCardIndex((prev) => (prev - 1 + attractionCards.length) % attractionCards.length);
    setTimeout(() => setIsSwipeAnimating(false), 300);
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (gymBrosLoading) {
    return (
      <motion.div
        className="glass-card rounded-3xl p-6 mb-8"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center justify-center h-40">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <MapPin className="w-6 h-6 text-purple-400 absolute top-3 left-3" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Case 1: User has GymBros profile - Show overview with matches
  if (gymBrosData?.hasProfile) {
    return (
      <motion.div
        className="glass-card rounded-3xl p-6 mb-8 overflow-hidden mt-0"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center">
            <MapPin className="w-7 h-7 mr-3 text-red-400" />
            GymBros Map
          </h2>
          <motion.button
            className="flex items-center text-orange-300 hover:text-orange-200 font-semibold text-sm md:text-base"
            whileHover={{ x: 5 }}
            onClick={() => onNavigate('/gymbros')}
          >
            Explore <ArrowRight className="w-4 h-4 ml-2" />
          </motion.button>
        </div>

        {gymBrosData.recentMatches && gymBrosData.recentMatches.length > 0 ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="glass-morphism p-3 rounded-xl text-center">
                <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">{gymBrosData.matchesCount}</p>
                <p className="text-gray-300 text-xs">Connections</p>
              </div>
              <div className="glass-morphism p-3 rounded-xl text-center">
                <Star className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">12</p>
                <p className="text-gray-300 text-xs">Active Now</p>
              </div>
              <div className="glass-morphism p-3 rounded-xl text-center">
                <MessageCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-white font-bold text-lg">3</p>
                <p className="text-gray-300 text-xs">New Messages</p>
              </div>
            </div>

            {/* Horizontal Scrolling Match Cards */}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Recent Connections</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCarousel('left')}
                    className="p-2 rounded-full glass-morphism hover:bg-white/20 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    className="p-2 rounded-full glass-morphism hover:bg-white/20 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {gymBrosData.recentMatches.map((match, index) => (
                  <motion.div
                    key={match._id || index}
                    className="flex-shrink-0 glass-morphism rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 snap-start"
                    style={{ width: '100px', scrollSnapAlign: 'start' }}
                    onClick={() => onNavigate('/gymbros')}
                    whileHover={{ y: -5 }}
                  >
                    <div className="relative h-24">
                      <img
                        src={formatImageUrl(match.profileImage, getFallbackAvatarUrl())}
                        alt={match.name || 'Match'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = getFallbackAvatarUrl();
                        }}
                      />
                      <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs font-semibold truncate">
                          {(match.name || 'Unknown').split(' ')[0]}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

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
          </>
        ) : (
           <NoMatchesShowcase
    userProfile={null} // or pass a mock user profile if you want
    onStartSwiping={() => onNavigate('/gymbros')}
  />
        )}
      </motion.div>
    );
  }

  // Case 2: User doesn't have GymBros profile - Show attraction cards
  return (
    <motion.div
      className="glass-card rounded-3xl p-6 mb-8 overflow-hidden relative mt-20"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 left-4 w-2 h-2 bg-pink-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-12 right-8 w-3 h-3 bg-blue-400 rounded-full animate-bounce opacity-60"></div>
        <div className="absolute bottom-8 left-12 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute bottom-4 right-4 w-1 h-1 bg-green-400 rounded-full animate-pulse opacity-60"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center">
            <Heart className="w-7 h-7 mr-3 text-pink-400" />
            Meet GymBros
          </h2>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-yellow-300 text-sm font-medium">New!</span>
          </div>
        </div>

        {/* Main attraction card display */}
        <div className="relative mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCardIndex}
              initial={{ opacity: 0, x: 100, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -100, rotateY: 15 }}
              transition={{ duration: 0.3 }}
              className={`bg-gradient-to-br ${attractionCards[currentCardIndex].gradient} p-1 rounded-3xl shadow-2xl`}
            >
              <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/50 shadow-lg">
                    <img
                      src={attractionCards[currentCardIndex].image}
                      alt={attractionCards[currentCardIndex].name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getFallbackAvatarUrl();
                      }}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                <h3 className="text-white font-bold text-2xl mb-1">
                  {attractionCards[currentCardIndex].name}
                </h3>
                <p className="text-white/80 mb-2">
                  {attractionCards[currentCardIndex].age} • {attractionCards[currentCardIndex].distance} away
                </p>
                
                <div className="flex justify-center gap-2 mb-4">
                  {attractionCards[currentCardIndex].interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>

                <p className="text-white/90 text-sm mb-4 font-medium">
                  {attractionCards[currentCardIndex].status}
                </p>

                {/* Swipe controls */}
                <div className="flex justify-center gap-4">
                  <motion.button
                    className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prevCard}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    className="w-14 h-14 bg-pink-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-pink-500/90 transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onNavigate('/gymbros')}
                  >
                    <Heart className="w-6 h-6 fill-current" />
                  </motion.button>
                  <motion.button
                    className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={nextCard}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Card indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {attractionCards.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentCardIndex
                    ? 'bg-white w-6'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                onClick={() => setCurrentCardIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 border-2 border-white`}></div>
              ))}
            </div>
            <span className="text-white font-medium">+1,247 members nearby</span>
          </div>

          <h3 className="text-white font-bold text-xl mb-2">Ready to Connect?</h3>
          <p className="text-gray-300 mb-6">Join thousands of fitness enthusiasts and find your perfect workout partner!</p>

          <motion.button
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('/gymbros')}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 animate-pulse"></div>
            <span className="relative flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              Start Your GymBros Journey
              <Zap className="w-5 h-5 animate-bounce" />
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default SocialMapSection;