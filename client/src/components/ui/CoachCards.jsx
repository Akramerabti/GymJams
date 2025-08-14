import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Star, Instagram, Twitter, Youtube, ChevronLeft, ChevronRight, X, Mail, Award, Clock
} from 'lucide-react';
import { getFallbackAvatarUrl } from '../../utils/imageUtils';

const CoachCards = ({ 
  coaches = [], 
  isDarkMode = false, 
  formatImageUrl = (url) => url || getFallbackAvatarUrl(), 
  t = (key) => key,
  // New props for debugging and configuration
  debug = false,
  containerWidth = null, // Allow parent to specify container width
  maxCardsPerView = 6,
  minCardWidth = 240,
  cardGap = 16
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dimensions, setDimensions] = useState({ cardsPerView: 4, cardWidth: 280 });

  // Simplified responsive calculation
  const getCardDimensions = () => {
    if (typeof window === 'undefined') return { cardsPerView: 4, cardWidth: 280 };
    
    // Use provided container width or calculate from viewport
    const viewportWidth = containerWidth || window.innerWidth;
    
    // Simple breakpoint logic
    let cardsPerView;
    if (viewportWidth < 640) cardsPerView = 1;
    else if (viewportWidth < 768) cardsPerView = 2;
    else if (viewportWidth < 1024) cardsPerView = 3;
    else if (viewportWidth < 1280) cardsPerView = 4;
    else if (viewportWidth < 1536) cardsPerView = 5;
    else cardsPerView = Math.min(maxCardsPerView, 6);
    
    // Reserve space for arrows (when needed)
    const arrowSpace = coaches.length > cardsPerView ? 128 : 0; // 64px each side
    const containerPadding = 64; // Account for container padding
    
    // Calculate available width
    const availableWidth = viewportWidth - containerPadding - arrowSpace;
    const totalGapWidth = (cardsPerView - 1) * cardGap;
    let cardWidth = Math.floor((availableWidth - totalGapWidth) / cardsPerView);
    
    // Ensure minimum card width
    cardWidth = Math.max(cardWidth, minCardWidth);
    
    // If cards are too wide, reduce cards per view
    const totalCardWidth = (cardWidth * cardsPerView) + totalGapWidth;
    if (totalCardWidth > availableWidth) {
      cardsPerView = Math.max(1, cardsPerView - 1);
      cardWidth = Math.floor((availableWidth - ((cardsPerView - 1) * cardGap)) / cardsPerView);
    }
    
    return { cardsPerView, cardWidth };
  };

  const safeCoaches = Array.isArray(coaches) ? coaches : [];
  const needsArrows = safeCoaches.length > dimensions.cardsPerView;
  
  // Simplified slide calculations
  const maxSlide = Math.max(0, safeCoaches.length - dimensions.cardsPerView);
  const canGoNext = currentSlide < maxSlide;
  const canGoPrev = currentSlide > 0;

  // Debug logging
  useEffect(() => {
    if (debug) {
      console.log('🔍 Coach Cards Debug Info:', {
        totalCoaches: safeCoaches.length,
        cardsPerView: dimensions.cardsPerView,
        currentSlide,
        maxSlide,
        canGoNext,
        canGoPrev,
        needsArrows,
        cardWidth: dimensions.cardWidth
      });
    }
  }, [debug, safeCoaches.length, dimensions, currentSlide, maxSlide, canGoNext, canGoPrev, needsArrows]);

  useEffect(() => {
    const handleResize = () => {
      const newDimensions = getCardDimensions();
      setDimensions(newDimensions);
      
      // Reset slide if it's now invalid
      const newMaxSlide = Math.max(0, safeCoaches.length - newDimensions.cardsPerView);
      if (currentSlide > newMaxSlide) {
        setCurrentSlide(newMaxSlide);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [safeCoaches.length, currentSlide, containerWidth]);

  // Simplified navigation functions
  const nextSlide = () => {
    if (canGoNext) {
      const newSlide = currentSlide + 1;
      setCurrentSlide(newSlide);
      if (debug) console.log('📈 Next slide:', newSlide);
    } else {
      if (debug) console.log('⚠️ Cannot go next - at max slide');
    }
  };

  const prevSlide = () => {
    if (canGoPrev) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);
      if (debug) console.log('📉 Prev slide:', newSlide);
    } else {
      if (debug) console.log('⚠️ Cannot go prev - at min slide');
    }
  };

  const goToSlide = (slideIndex) => {
    if (slideIndex >= 0 && slideIndex <= maxSlide) {
      setCurrentSlide(slideIndex);
      if (debug) console.log('🎯 Go to slide:', slideIndex);
    }
  };

  // Simplified transform calculation
  const getTransform = () => {
    if (!needsArrows) return 'translateX(0)';
    
    const moveDistance = currentSlide * (dimensions.cardWidth + cardGap);
    const transform = `translateX(-${moveDistance}px)`;
    
    if (debug) {
      console.log('🔄 Transform calculation:', {
        currentSlide,
        cardWidth: dimensions.cardWidth,
        gap: cardGap,
        moveDistance,
        transform
      });
    }
    
    return transform;
  };

  const handleCoachClick = (coach) => {
    setSelectedCoach(coach);
    setShowModal(true);
    if (debug) console.log('👆 Coach clicked:', coach.firstName, coach.lastName);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCoach(null);
  };

  // Early return for empty coaches
  if (safeCoaches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className={`max-w-md mx-auto p-8 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <User className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No Coaches Available
          </h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            We are expanding our team of coaches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Debug Panel */}
      {debug && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-sm">
          <strong>Debug Info:</strong>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>Total Coaches: {safeCoaches.length}</div>
            <div>Cards Per View: {dimensions.cardsPerView}</div>
            <div>Current Slide: {currentSlide}</div>
            <div>Max Slide: {maxSlide}</div>
            <div>Can Go Next: {canGoNext ? '✅' : '❌'}</div>
            <div>Can Go Prev: {canGoPrev ? '✅' : '❌'}</div>
            <div>Card Width: {dimensions.cardWidth}px</div>
            <div>Needs Arrows: {needsArrows ? '✅' : '❌'}</div>
          </div>
        </div>
      )}

      <div className={`relative w-full ${!needsArrows ? 'flex justify-center' : ''}`}>
        
        {/* Navigation Arrows */}
        {needsArrows && (
          <>
            <button
              onClick={prevSlide}
              disabled={!canGoPrev}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110
                ${!canGoPrev
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'opacity-90 hover:opacity-100 hover:shadow-2xl active:scale-95'
                }
                ${isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400'
                } 
                p-3 w-12 h-12`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={nextSlide}
              disabled={!canGoNext}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110
                ${!canGoNext
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'opacity-90 hover:opacity-100 hover:shadow-2xl active:scale-95'
                }
                ${isDarkMode 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400'
                } 
                p-3 w-12 h-12`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Cards Container */}
        <div 
          className="overflow-hidden"
          style={{ 
            maxWidth: needsArrows ? '100%' : 'fit-content',
            marginLeft: needsArrows ? '64px' : '0',
            marginRight: needsArrows ? '64px' : '0'
          }}
        >
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: getTransform(),
              gap: `${cardGap}px`,
              width: needsArrows 
                ? `${safeCoaches.length * (dimensions.cardWidth + cardGap) - cardGap}px` 
                : 'auto'
            }}
          >
            {safeCoaches.map((coach, index) => (
              <div
                key={coach._id || index}
                className="flex-shrink-0"
                style={{ width: `${dimensions.cardWidth}px` }}
              >
                <motion.div
                  onClick={() => handleCoachClick(coach)}
                  className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl h-full
                    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                    border group shadow-lg hover:shadow-2xl`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    y: -8,
                    transition: { duration: 0.2 }
                  }}
                >
                  {/* Coach Image */}
                  <div className="relative w-full pb-[100%] overflow-hidden">
                    {coach.profileImage ? (
                      <img 
                        src={formatImageUrl(coach.profileImage)} 
                        alt={`Coach ${coach.firstName}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = getFallbackAvatarUrl();
                        }}
                      />
                    ) : (
                      <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <h3 className="text-white font-bold truncate text-sm">
                        {coach.firstName} {coach.lastName}
                      </h3>
                    </div>

                    {/* Click Indicator */}
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <svg className="text-white w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1">
                      {coach.specialties?.slice(0, 2).map((specialty, idx) => (
                        <span key={idx} className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                          {specialty}
                        </span>
                      ))}
                      {coach.specialties?.length > 2 && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          +{coach.specialties.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    {coach.rating && (
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < Math.floor(coach.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {coach.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Bio */}
                    {coach.bio && (
                      <p className={`text-xs line-clamp-3 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {coach.bio.length > 100 ? `${coach.bio.substring(0, 100)}...` : coach.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    {coach.socialLinks && Object.values(coach.socialLinks).some(link => link) && (
                      <div className="flex gap-1 pt-1">
                        {coach.socialLinks.instagram && (
                          <a href={coach.socialLinks.instagram} target="_blank" rel="noopener noreferrer" 
                             className={`p-1 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                             onClick={(e) => e.stopPropagation()}>
                            <Instagram className="w-3 h-3 text-pink-500" />
                          </a>
                        )}
                        {coach.socialLinks.twitter && (
                          <a href={coach.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                             className={`p-1 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                             onClick={(e) => e.stopPropagation()}>
                            <Twitter className="w-3 h-3 text-blue-400" />
                          </a>
                        )}
                        {coach.socialLinks.youtube && (
                          <a href={coach.socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                             className={`p-1 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                             onClick={(e) => e.stopPropagation()}>
                            <Youtube className="w-3 h-3 text-red-500" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Navigation */}
        {needsArrows && maxSlide > 0 && (
          <div className="flex justify-center mt-6 gap-2">
            {[...Array(maxSlide + 1)].map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                  index === currentSlide 
                    ? (isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-500 to-purple-500') 
                    : (isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400')
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Coach Detail Modal */}
      <AnimatePresence>
        {showModal && selectedCoach && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl
                ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors
                  ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="relative h-48">
                {selectedCoach.profileImage ? (
                  <img src={formatImageUrl(selectedCoach.profileImage)} alt={selectedCoach.firstName} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <User className="w-24 h-24 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <h2 className="text-2xl font-bold">{selectedCoach.firstName} {selectedCoach.lastName}</h2>
                  {selectedCoach.rating && (
                    <div className="flex items-center mt-1">
                      <div className="flex mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedCoach.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm">{selectedCoach.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Specialties */}
                {selectedCoach.specialties?.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Award className="w-5 h-5 mr-2 text-blue-500" />
                      Specialties
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCoach.specialties.map((specialty, idx) => (
                        <span key={idx} className={`px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {selectedCoach.bio && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <User className="w-5 h-5 mr-2 text-blue-500" />
                      About Me
                    </h3>
                    <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedCoach.bio}
                    </p>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <h3 className={`text-lg font-semibold mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    Experience
                  </h3>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Professional fitness coach specializing in {selectedCoach.specialties?.join(', ') || 'fitness training'}.
                      Dedicated to helping clients achieve their health and fitness goals.
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className={`text-lg font-semibold mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Mail className="w-5 h-5 mr-2 text-blue-500" />
                    Connect
                  </h3>
                  {selectedCoach.socialLinks && Object.values(selectedCoach.socialLinks).some(link => link) ? (
                    <div className="flex gap-4">
                      {selectedCoach.socialLinks.instagram && (
                        <a href={selectedCoach.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                           className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          <Instagram className="w-5 h-5 text-pink-500" />
                          <span>Instagram</span>
                        </a>
                      )}
                      {selectedCoach.socialLinks.twitter && (
                        <a href={selectedCoach.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                           className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          <Twitter className="w-5 h-5 text-blue-400" />
                          <span>Twitter</span>
                        </a>
                      )}
                      {selectedCoach.socialLinks.youtube && (
                        <a href={selectedCoach.socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                           className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          <Youtube className="w-5 h-5 text-red-500" />
                          <span>YouTube</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
                      Contact information available after subscribing to a coaching plan.
                    </p>
                  )}
                </div>

                {/* CTA */}
                <div className="border-t pt-6">
                  <button
                    onClick={closeModal}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Choose This Coach
                  </button>
                  <p className={`text-center text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Subscribe to a coaching plan to work with {selectedCoach.firstName}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CoachCards;