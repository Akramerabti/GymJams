import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Users, MessageCircle, Calendar, UserCheck, Play, X, Target, Award } from 'lucide-react';
import subscriptionService from '../../services/subscription.service';
import { formatImageUrl } from '../../utils/imageUtils';

const CoachingSection = ({ onNavigate, isActive }) => {  const [coaches, setCoaches] = useState([]);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);
  const [isTouchScrolling, setIsTouchScrolling] = useState(false);
  
  const videoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  // Fetch coaches on component mount
  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        const coachData = await subscriptionService.getCoaches();
        setCoaches(coachData.slice(0, 8)); // Limit to 8 coaches for floating bubbles
      } catch (error) {
        console.error('Failed to fetch coaches:', error);
      }
    };

    if (isActive) {
      fetchCoachData();
    }
  }, [isActive]);

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
      title: 'Expert Coaching Experience',
      description: 'See how our certified trainers transform lives through personalized fitness coaching'
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
    if (touchStartTime === null || touchStartY === null) return;
    
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
    <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none overflow-hidden">      {/* Floating Coach Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {coaches.map((coach, index) => (
          <div
            key={coach._id || index}
            className="absolute rounded-full overflow-hidden border-2 border-purple-400/40 shadow-lg animate-float"
            style={{
              width: `${80 + (index % 3) * 20}px`,
              height: `${80 + (index % 3) * 20}px`,
              left: `${Math.max(5, Math.min(85, 10 + (index * 11) % 70))}%`,
              top: `${Math.max(10, Math.min(80, 15 + (index * 13) % 60))}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${4 + (index % 3)}s`,
            }}
          >
            <img
              src={formatImageUrl(coach.profileImage)}
              alt={coach.fullName || 'Coach'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/fallback-avatar.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-transparent"></div>
          </div>
        ))}
      </div>

      <div 
        className={`w-full max-w-7xl mx-auto transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >        <div className="bg-gradient-to-br from-gray-900/60 via-purple-900/50 to-blue-900/50 backdrop-blur-md rounded-2xl lg:rounded-3xl overflow-hidden border border-purple-400/40 shadow-2xl pointer-events-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-2 items-center min-h-0">
            {/* Left Side - Content */}
            <div className="p-6 sm:p-8 lg:p-10 xl:p-12 w-full">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-purple-200 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 lg:mb-6 border border-purple-400/30">
                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                Certified Trainers
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 lg:mb-6 bg-gradient-to-r from-purple-200 via-blue-200 to-orange-200 bg-clip-text text-transparent">
                Expert Coaching
              </h2>
              
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-100/90 mb-6 lg:mb-8 max-w-2xl leading-relaxed">
                Transform your fitness journey with certified trainers who deliver personalized plans and real-time support
              </p>

              {/* Mobile Video - Right below description */}
              <div className="lg:hidden mb-6">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/60 to-purple-800/60 border border-purple-400/30 shadow-2xl backdrop-blur-sm">
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
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/40 via-purple-900/30 to-blue-900/40 cursor-pointer transition-all duration-300 hover:from-gray-800/30 hover:via-purple-800/20 hover:to-blue-800/30"
                    onClick={handlePlayVideo}
                  >
                    <div className="bg-gradient-to-r from-purple-400/30 to-blue-400/30 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform duration-300 border border-purple-300/50">
                      <Play className="w-8 h-8 text-purple-200 ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 lg:p-4 border border-purple-300/30 flex items-center gap-2 lg:gap-3 hover:from-purple-400/30 hover:to-blue-400/30 transition-all duration-300">
                  <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-purple-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-purple-200 font-semibold text-sm lg:text-base">Custom Plans</div>
                    <div className="text-purple-200/70 text-xs lg:text-sm">Personalized workouts</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-orange-500/20 rounded-lg p-3 lg:p-4 border border-blue-300/30 flex items-center gap-2 lg:gap-3 hover:from-blue-400/30 hover:to-orange-400/30 transition-all duration-300">
                  <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 text-blue-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-blue-200 font-semibold text-sm lg:text-base">24/7 Support</div>
                    <div className="text-blue-200/70 text-xs lg:text-sm">Always available</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-lg p-3 lg:p-4 border border-orange-300/30 flex items-center gap-2 lg:gap-3 hover:from-orange-400/30 hover:to-purple-400/30 transition-all duration-300">
                  <Target className="w-5 h-5 lg:w-6 lg:h-6 text-orange-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-orange-200 font-semibold text-sm lg:text-base">Goal Tracking</div>
                    <div className="text-orange-200/70 text-xs lg:text-sm">Monitor progress</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-500/20 to-purple-500/20 rounded-lg p-3 lg:p-4 border border-gray-300/30 flex items-center gap-2 lg:gap-3 hover:from-gray-400/30 hover:to-purple-400/30 transition-all duration-300">
                  <Award className="w-5 h-5 lg:w-6 lg:h-6 text-gray-300 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-gray-200 font-semibold text-sm lg:text-base">Certified</div>
                    <div className="text-gray-200/70 text-xs lg:text-sm">Expert trainers</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate('/coaching')}
                className="group relative overflow-hidden px-6 py-3 lg:px-12 lg:py-5 bg-gradient-to-r from-purple-500 via-blue-500 to-orange-500 text-white font-bold text-sm lg:text-lg rounded-full flex items-center gap-2 lg:gap-3 mx-auto lg:mx-0 hover:from-purple-400 hover:via-blue-400 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 border border-purple-300/30"
              >
                <Users className="w-4 h-4 lg:w-6 lg:h-6 relative z-10" />
                <span className="relative z-10">Find Your Coach</span>
                <ArrowRight className="w-4 h-4 lg:w-6 lg:h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
            
            {/* Right Side - Desktop Video Only */}
            <div className="hidden lg:block p-6 sm:p-8 lg:p-10 xl:p-12 w-full">
              <div className="relative aspect-video rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800/60 to-purple-800/60 border border-purple-400/30 shadow-2xl backdrop-blur-sm">
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
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/40 via-purple-900/30 to-blue-900/40 cursor-pointer transition-all duration-300 hover:from-gray-800/30 hover:via-purple-800/20 hover:to-blue-800/30"
                  onClick={handlePlayVideo}
                >
                  <div className="bg-gradient-to-r from-purple-400/30 to-blue-400/30 backdrop-blur-sm rounded-full p-4 lg:p-6 group-hover:scale-110 transition-transform duration-300 border border-purple-300/50">
                    <Play className="w-8 h-8 lg:w-12 lg:h-12 text-purple-200 ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple, Working Video Modal */}
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

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) rotate(1deg);
          }
          50% {
            transform: translateY(-10px) rotate(-1deg);
          }
          75% {
            transform: translateY(-20px) rotate(0.5deg);
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CoachingSection;
