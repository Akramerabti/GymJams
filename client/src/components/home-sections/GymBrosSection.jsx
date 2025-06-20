import React, { useState, useRef } from 'react';
import { ArrowRight, Users, MessageCircle, Target, Play, X, UserPlus, Dumbbell, MapPin, Calendar, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const GymBrosSection = ({ onNavigate, isActive }) => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);
  const [isTouchScrolling, setIsTouchScrolling] = useState(false);
  
  const videoRef = useRef(null);
  const mobileVideoRef = useRef(null);

  // Handle video click/tap to open modal
  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedVideo(null);
  };
  // Handle play video (for both desktop and mobile)
  const handlePlayVideo = () => {
    const video = {
      src: '/GymTonic.mp4',
      title: 'GymBros Community',
      description: 'Connect with like-minded fitness enthusiasts through our intelligent matching system'
    };
    handleVideoClick(video);
  };

  // Touch handling for mobile to distinguish between tap and scroll
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartTime(Date.now());
    setIsTouchScrolling(false);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    
    const touchEndY = e.touches[0].clientY;
    const deltaY = Math.abs(touchEndY - touchStartY);
    
    if (deltaY > 10) {
      setIsTouchScrolling(true);
    }
  };

  const handleTouchEndVideo = (e) => {
    if (touchStartTime === null) return;
    
    const touchDuration = Date.now() - touchStartTime;
    
    if (!isTouchScrolling && touchDuration < 300) {
      e.preventDefault();
      e.stopPropagation();
      handlePlayVideo();
    }
    
    setTouchStartY(null);
    setTouchStartTime(null);
    setIsTouchScrolling(false);
  };
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
      <div 
        className={`w-full max-w-7xl mx-auto transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        <div className="bg-black/40 backdrop-blur-md rounded-2xl lg:rounded-3xl overflow-hidden border border-blue-300/30 shadow-2xl pointer-events-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-2 items-center min-h-0">
            {/* Left Side - Content */}
            <div className="p-6 sm:p-8 lg:p-10 xl:p-12 w-full">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 lg:mb-6">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Fitness Community
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 lg:mb-6 bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                Find Your GymBro
              </h2>
              
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-white/90 mb-6 lg:mb-8 max-w-2xl leading-relaxed">
                Connect with like-minded fitness enthusiasts through our intelligent matching system
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
                <div className="bg-blue-500/10 rounded-lg p-3 lg:p-4 border border-blue-300/20 flex items-center gap-2 lg:gap-3">
                  <UserPlus className="w-5 h-5 lg:w-6 lg:h-6 text-blue-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-blue-200 font-semibold text-sm lg:text-base">Smart Matching</div>
                    <div className="text-blue-200/70 text-xs lg:text-sm">Find compatible partners</div>
                  </div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 lg:p-4 border border-blue-300/20 flex items-center gap-2 lg:gap-3">
                  <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 text-blue-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-blue-200 font-semibold text-sm lg:text-base">Chat & Connect</div>
                    <div className="text-blue-200/70 text-xs lg:text-sm">Start conversations</div>
                  </div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 lg:p-4 border border-blue-300/20 flex items-center gap-2 lg:gap-3">
                  <Target className="w-5 h-5 lg:w-6 lg:h-6 text-blue-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-blue-200 font-semibold text-sm lg:text-base">Goal Alignment</div>
                    <div className="text-blue-200/70 text-xs lg:text-sm">Share similar objectives</div>
                  </div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 lg:p-4 border border-blue-300/20 flex items-center gap-2 lg:gap-3">
                  <Dumbbell className="w-5 h-5 lg:w-6 lg:h-6 text-blue-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-blue-200 font-semibold text-sm lg:text-base">Workout Together</div>
                    <div className="text-blue-200/70 text-xs lg:text-sm">Train as a team</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate('/gymbros')}
                className="group relative overflow-hidden px-6 py-3 lg:px-12 lg:py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm lg:text-lg rounded-full flex items-center gap-2 lg:gap-3 mx-auto lg:mx-0 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                <Users className="w-4 h-4 lg:w-6 lg:h-6 relative z-10" />
                <span className="relative z-10">Find Your GymBro</span>
                <ArrowRight className="w-4 h-4 lg:w-6 lg:h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
            
            {/* Right Side - Video */}
            <div className="p-6 sm:p-8 lg:p-10 xl:p-12 w-full">
              <div className="relative aspect-video rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/20 shadow-2xl backdrop-blur-sm">
                {/* Desktop Video */}
                <video
                  ref={videoRef}
                  className="hidden md:block absolute inset-0 w-full h-full object-cover cursor-pointer"
                  muted
                  playsInline
                  preload="metadata"
                  onClick={handlePlayVideo}
                >
                  <source src="/GymTonic.mp4" type="video/mp4" />
                </video>
                
                {/* Mobile Video */}
                <video
                  ref={mobileVideoRef}
                  className="md:hidden absolute inset-0 w-full h-full object-cover cursor-pointer"
                  muted
                  playsInline
                  preload="metadata"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEndVideo}
                >
                  <source src="/GymTonic.mp4" type="video/mp4" />
                </video>
                
                {/* Play Button Overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-all duration-300 hover:bg-black/30"
                  onClick={handlePlayVideo}
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 lg:p-6 group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 lg:w-12 lg:h-12 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal - Same as CoachingHome.jsx */}
      <AnimatePresence>
        {videoModalOpen && selectedVideo && (          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeVideoModal}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                type: "spring", 
                duration: 0.4,
                bounce: 0.2
              }}
              className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] overflow-hidden relative border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeVideoModal}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="aspect-video w-full">
                <video 
                  className="w-full h-full"
                  controls
                  autoPlay
                  muted
                  playsInline
                >
                  <source src={selectedVideo.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="p-3 sm:p-4 lg:p-6">
                <h3 className="text-lg sm:text-xl lg:text-xl font-bold mb-1 sm:mb-2 text-gray-900 dark:text-white">
                  {selectedVideo.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  {selectedVideo.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GymBrosSection;
