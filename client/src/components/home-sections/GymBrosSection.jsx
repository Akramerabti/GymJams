import React, { useState, useRef } from 'react';
import { ArrowRight, Users, MessageCircle, Target, Play, X, UserPlus, Dumbbell, MapPin, Calendar, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GymBrosSection = ({ onNavigate, isActive }) => {
  const { t } = useTranslation();
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
      title: t('gymbrossection.videoTitle'),
      description: t('gymbrossection.videoDescription')
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
  };  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
      <div 
        className={`w-full max-w-7xl mx-auto transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >        
        <div className="bg-gradient-to-br from-purple-900/50 via-blue-900/40 to-cyan-900/50 backdrop-blur-md rounded-2xl lg:rounded-3xl overflow-hidden border border-cyan-400/40 shadow-2xl pointer-events-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-2 items-center min-h-0">
            {/* Left Side - Content */}
            <div className="p-6 sm:p-8 lg:p-10 xl:p-12 w-full">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-200 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 lg:mb-6 border border-cyan-400/30">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                {t('gymbrossection.fitnessCommunity')}
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 lg:mb-6 bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                {t('gymbrossection.findYourGymBro')}
              </h2>
              
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-cyan-100/90 mb-6 lg:mb-8 max-w-2xl leading-relaxed">
                {t('gymbrossection.intro')}
              </p>

              {/* Mobile Video - Right below description */}
              <div className="lg:hidden mb-6">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-purple-800/60 to-cyan-800/60 border border-cyan-400/30 shadow-2xl backdrop-blur-sm">
                  {/* Mobile Video */}
                  <video
                    ref={mobileVideoRef}
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
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
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-cyan-900/40 cursor-pointer transition-all duration-300 hover:from-purple-800/30 hover:via-blue-800/20 hover:to-cyan-800/30"
                    onClick={handlePlayVideo}
                  >
                    <div className="bg-gradient-to-r from-cyan-400/30 to-purple-400/30 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform duration-300 border border-cyan-300/50">
                      <Play className="w-8 h-8 text-cyan-200 ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-3 lg:p-4 border border-cyan-300/30 flex items-center gap-2 lg:gap-3 hover:from-cyan-400/30 hover:to-blue-400/30 transition-all duration-300">
                  <UserPlus className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-cyan-200 font-semibold text-sm lg:text-base">{t('gymbrossection.smartMatching')}</div>
                    <div className="text-cyan-200/70 text-xs lg:text-sm">{t('gymbrossection.findPartners')}</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3 lg:p-4 border border-purple-300/30 flex items-center gap-2 lg:gap-3 hover:from-purple-400/30 hover:to-pink-400/30 transition-all duration-300">
                  <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 text-purple-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-purple-200 font-semibold text-sm lg:text-base">{t('gymbrossection.chatConnect')}</div>
                    <div className="text-purple-200/70 text-xs lg:text-sm">{t('gymbrossection.startConversations')}</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-lg p-3 lg:p-4 border border-pink-300/30 flex items-center gap-2 lg:gap-3 hover:from-pink-400/30 hover:to-rose-400/30 transition-all duration-300">
                  <Target className="w-5 h-5 lg:w-6 lg:h-6 text-pink-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-pink-200 font-semibold text-sm lg:text-base">{t('gymbrossection.goalAlignment')}</div>
                    <div className="text-pink-200/70 text-xs lg:text-sm">{t('gymbrossection.shareObjectives')}</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-3 lg:p-4 border border-blue-300/30 flex items-center gap-2 lg:gap-3 hover:from-blue-400/30 hover:to-cyan-400/30 transition-all duration-300">
                  <Dumbbell className="w-5 h-5 lg:w-6 lg:h-6 text-blue-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-blue-200 font-semibold text-sm lg:text-base">{t('gymbrossection.workoutTogether')}</div>
                    <div className="text-blue-200/70 text-xs lg:text-sm">{t('gymbrossection.trainTeam')}</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate('/gymbros')}
                className="group relative overflow-hidden px-6 py-3 lg:px-12 lg:py-5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold text-sm lg:text-lg rounded-full flex items-center gap-2 lg:gap-3 mx-auto lg:mx-0 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 border border-cyan-300/30"
              >
                <Users className="w-4 h-4 lg:w-6 lg:h-6 relative z-10" />
                <span className="relative z-10">{t('gymbrossection.findYourGymBro')}</span>
                <ArrowRight className="w-4 h-4 lg:w-6 lg:h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
            {/* Right Side - Desktop Video Only */}
            <div className="hidden lg:block p-6 sm:p-8 lg:p-10 xl:p-12 w-full">
              <div className="relative aspect-video rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-purple-800/60 to-cyan-800/60 border border-cyan-400/30 shadow-2xl backdrop-blur-sm">
                {/* Desktop Video */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                  muted
                  playsInline
                  preload="metadata"
                  onClick={handlePlayVideo}
                >
                  <source src="/GymTonic.mp4" type="video/mp4" />
                </video>
                
                {/* Play Button Overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-cyan-900/40 cursor-pointer transition-all duration-300 hover:from-purple-800/30 hover:via-blue-800/20 hover:to-cyan-800/30"
                  onClick={handlePlayVideo}
                >
                  <div className="bg-gradient-to-r from-cyan-400/30 to-purple-400/30 backdrop-blur-sm rounded-full p-4 lg:p-6 group-hover:scale-110 transition-transform duration-300 border border-cyan-300/50">
                    <Play className="w-8 h-8 lg:w-12 lg:h-12 text-cyan-200 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      {/* Video Modal */}
      {videoModalOpen && selectedVideo && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 z-[999999]"
            onClick={closeVideoModal}
          ></div>
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[999999] pointer-events-none">
            <div 
              className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with close button */}
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">{selectedVideo.title}</h3>
                <button
                  onClick={closeVideoModal}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Video */}
              <div className="aspect-video bg-black">
                <video 
                  className="w-full h-full"
                  controls
                  autoPlay
                  muted
                  playsInline
                >
                  <source src={selectedVideo.src} type="video/mp4" />
                </video>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-gray-800">
                <p className="text-gray-300 text-sm">{selectedVideo.description}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GymBrosSection;
