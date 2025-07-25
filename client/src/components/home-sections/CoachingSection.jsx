import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Users, MessageCircle, Calendar, UserCheck, Play, X, Target, Award } from 'lucide-react';
import subscriptionService from '../../services/subscription.service';
import { formatImageUrl } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next';

const CoachingSection = ({ onNavigate, isActive }) => {
  const [coaches, setCoaches] = useState([]);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);
  const [isTouchScrolling, setIsTouchScrolling] = useState(false);
  
  const videoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  const { t } = useTranslation();

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
      title: t('coachingsection.videoTitle'),
      description: t('coachingsection.videoDescription')
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
    <div className="absolute inset-0 flex items-center justify-center p-[clamp(1rem,4vw,3rem)] pointer-events-none overflow-hidden">
      {/* Floating Coach Bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {coaches.map((coach, index) => (
          <div
            key={coach._id || index}
            className="absolute rounded-full overflow-hidden border-2 border-purple-400/40 shadow-lg animate-float"
            style={{
              width: `clamp(${60 + (index % 3) * 15}px, ${8 + (index % 3) * 2}vw, ${100 + (index % 3) * 25}px)`,
              height: `clamp(${60 + (index % 3) * 15}px, ${8 + (index % 3) * 2}vw, ${100 + (index % 3) * 25}px)`,
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
        className={`w-full max-w-[clamp(320px,95vw,1800px)] mx-auto transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        <div 
          className="bg-gradient-to-br from-gray-900/60 via-purple-900/50 to-blue-900/50 backdrop-blur-md overflow-hidden border border-purple-400/40 shadow-2xl pointer-events-auto"
          style={{
            borderRadius: 'clamp(1rem,3vw,2rem)',
            padding: 0
          }}
        >
          <div className="flex flex-col lg:grid lg:grid-cols-2 items-center min-h-0">
            {/* Left Side - Content */}
            <div 
              className="w-full"
              style={{
                padding: 'clamp(1.5rem,4vw,3rem)'
              }}
            >
              {/* Badge */}
              <div 
                className="inline-flex items-center bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-purple-200 font-semibold border border-purple-400/30"
                style={{
                  gap: 'clamp(0.5rem,1vw,0.75rem)',
                  padding: 'clamp(0.5rem,1.5vw,1rem) clamp(0.75rem,2vw,1.25rem)',
                  borderRadius: 'clamp(1rem,2vw,1.5rem)',
                  fontSize: 'clamp(0.75rem,1.5vw,1rem)',
                  marginBottom: 'clamp(1rem,3vw,2rem)'
                }}
              >
                <UserCheck style={{ width: 'clamp(0.75rem,1.5vw,1rem)', height: 'clamp(0.75rem,1.5vw,1rem)' }} />
                {t('coachingsection.certifiedTrainers')}
              </div>
              
              <h2 
                className="font-bold text-white bg-gradient-to-r from-purple-200 via-blue-200 to-orange-200 bg-clip-text text-transparent leading-[0.9]"
                style={{
                  fontSize: 'clamp(1.75rem,6vw,4rem)',
                  marginBottom: 'clamp(1rem,3vw,2rem)',
                  letterSpacing: 'clamp(-0.02em,0.1vw,0.02em)'
                }}
              >
                {t('coachingsection.expertCoaching')}
              </h2>
              
              <p 
                className="text-gray-100/90 max-w-2xl leading-relaxed"
                style={{
                  fontSize: 'clamp(1rem,2.5vw,1.5rem)',
                  marginBottom: 'clamp(1.5rem,4vw,2.5rem)',
                  lineHeight: 'clamp(1.4,1.6,1.7)'
                }}
              >
                {t('coachingsection.transform')}
              </p>

              {/* Mobile Video - Right below description */}
              <div 
                className="lg:hidden"
                style={{
                  marginBottom: 'clamp(1.5rem,4vw,2.5rem)'
                }}
              >
                <div 
                  className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-800/60 to-purple-800/60 border border-purple-400/30 shadow-2xl backdrop-blur-sm"
                  style={{
                    borderRadius: 'clamp(0.75rem,2vw,1.25rem)'
                  }}
                >
                  {/* Mobile Video */}
                  <video
                    ref={mobileVideoRef}
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    muted
                    playsInline
                    preload="metadata"
                    poster="/Picture3.png"
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
                    <div 
                      className="bg-gradient-to-r from-purple-400/30 to-blue-400/30 backdrop-blur-sm rounded-full group-hover:scale-110 transition-transform duration-300 border border-purple-300/50"
                      style={{
                        padding: 'clamp(0.75rem,2vw,1.25rem)'
                      }}
                    >
                      <Play 
                        className="text-purple-200 ml-1" 
                        fill="currentColor" 
                        style={{
                          width: 'clamp(1.5rem,4vw,2rem)',
                          height: 'clamp(1.5rem,4vw,2rem)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div 
                className="grid grid-cols-1 sm:grid-cols-2"
                style={{
                  gap: 'clamp(0.75rem,2vw,1.25rem)',
                  marginBottom: 'clamp(1.5rem,4vw,2.5rem)'
                }}
              >
                <div 
                  className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-300/30 flex items-center hover:from-purple-400/30 hover:to-blue-400/30 transition-all duration-300"
                  style={{
                    borderRadius: 'clamp(0.5rem,1.5vw,1rem)',
                    padding: 'clamp(0.75rem,2vw,1.25rem)',
                    gap: 'clamp(0.5rem,1.5vw,1rem)'
                  }}
                >
                  <Calendar 
                    className="text-purple-300 flex-shrink-0" 
                    style={{
                      width: 'clamp(1.25rem,3vw,1.5rem)',
                      height: 'clamp(1.25rem,3vw,1.5rem)'
                    }}
                  />
                  <div className="text-left min-w-0">
                    <div 
                      className="text-purple-200 font-semibold"
                      style={{
                        fontSize: 'clamp(0.875rem,2vw,1.125rem)'
                      }}
                    >
                      {t('coachingsection.customPlans')}
                    </div>
                    <div 
                      className="text-purple-200/70"
                      style={{
                        fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                      }}
                    >
                      {t('coachingsection.personalizedWorkouts')}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-blue-500/20 to-orange-500/20 border border-blue-300/30 flex items-center hover:from-blue-400/30 hover:to-orange-400/30 transition-all duration-300"
                  style={{
                    borderRadius: 'clamp(0.5rem,1.5vw,1rem)',
                    padding: 'clamp(0.75rem,2vw,1.25rem)',
                    gap: 'clamp(0.5rem,1.5vw,1rem)'
                  }}
                >
                  <MessageCircle 
                    className="text-blue-300 flex-shrink-0" 
                    style={{
                      width: 'clamp(1.25rem,3vw,1.5rem)',
                      height: 'clamp(1.25rem,3vw,1.5rem)'
                    }}
                  />
                  <div className="text-left min-w-0">
                    <div 
                      className="text-blue-200 font-semibold"
                      style={{
                        fontSize: 'clamp(0.875rem,2vw,1.125rem)'
                      }}
                    >
                      {t('coachingsection.support247')}
                    </div>
                    <div 
                      className="text-blue-200/70"
                      style={{
                        fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                      }}
                    >
                      {t('coachingsection.alwaysAvailable')}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-300/30 flex items-center hover:from-orange-400/30 hover:to-purple-400/30 transition-all duration-300"
                  style={{
                    borderRadius: 'clamp(0.5rem,1.5vw,1rem)',
                    padding: 'clamp(0.75rem,2vw,1.25rem)',
                    gap: 'clamp(0.5rem,1.5vw,1rem)'
                  }}
                >
                  <Target 
                    className="text-orange-300 flex-shrink-0" 
                    style={{
                      width: 'clamp(1.25rem,3vw,1.5rem)',
                      height: 'clamp(1.25rem,3vw,1.5rem)'
                    }}
                  />
                  <div className="text-left min-w-0">
                    <div 
                      className="text-orange-200 font-semibold"
                      style={{
                        fontSize: 'clamp(0.875rem,2vw,1.125rem)'
                      }}
                    >
                      {t('coachingsection.goalTracking')}
                    </div>
                    <div 
                      className="text-orange-200/70"
                      style={{
                        fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                      }}
                    >
                      {t('coachingsection.monitorProgress')}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-gray-500/20 to-purple-500/20 border border-gray-300/30 flex items-center hover:from-gray-400/30 hover:to-purple-400/30 transition-all duration-300"
                  style={{
                    borderRadius: 'clamp(0.5rem,1.5vw,1rem)',
                    padding: 'clamp(0.75rem,2vw,1.25rem)',
                    gap: 'clamp(0.5rem,1.5vw,1rem)'
                  }}
                >
                  <Award 
                    className="text-gray-300 flex-shrink-0" 
                    style={{
                      width: 'clamp(1.25rem,3vw,1.5rem)',
                      height: 'clamp(1.25rem,3vw,1.5rem)'
                    }}
                  />
                  <div className="text-left min-w-0">
                    <div 
                      className="text-gray-200 font-semibold"
                      style={{
                        fontSize: 'clamp(0.875rem,2vw,1.125rem)'
                      }}
                    >
                      {t('coachingsection.certified')}
                    </div>
                    <div 
                      className="text-gray-200/70"
                      style={{
                        fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                      }}
                    >
                      {t('coachingsection.expertTrainers')}
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate('/coaching')}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-500 via-blue-500 to-orange-500 text-white font-bold rounded-full flex items-center mx-auto lg:mx-0 hover:from-purple-400 hover:via-blue-400 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 border border-purple-300/30"
                style={{
                  padding: 'clamp(0.75rem,2vw,1.25rem) clamp(1.5rem,4vw,3rem)',
                  gap: 'clamp(0.5rem,1.5vw,1rem)',
                  fontSize: 'clamp(0.875rem,2vw,1.125rem)',
                  minHeight: 'clamp(3rem,6vw,4rem)'
                }}
              >
                <Users 
                  className="relative z-10" 
                  style={{
                    width: 'clamp(1rem,2.5vw,1.5rem)',
                    height: 'clamp(1rem,2.5vw,1.5rem)'
                  }}
                />
                <span className="relative z-10">{t('coachingsection.findCoach')}</span>
                <ArrowRight 
                  className="relative z-10 group-hover:translate-x-2 transition-transform duration-300" 
                  style={{
                    width: 'clamp(1rem,2.5vw,1.5rem)',
                    height: 'clamp(1rem,2.5vw,1.5rem)'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
            
            {/* Right Side - Desktop Video Only */}
            <div 
              className="hidden lg:block w-full"
              style={{
                padding: 'clamp(1.5rem,4vw,3rem)'
              }}
            >
              <div 
                className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-800/60 to-purple-800/60 border border-purple-400/30 shadow-2xl backdrop-blur-sm"
                style={{
                  borderRadius: 'clamp(0.75rem,2vw,1.5rem)'
                }}
              >
                {/* Desktop Video */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                  muted
                  playsInline
                  preload="metadata"
                  poster="/Picture3.png"
                  onClick={handlePlayVideo}
                >
                  <source src="/GymTonic.mp4" type="video/mp4" />
                </video>
                
                {/* Play Button Overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/40 via-purple-900/30 to-blue-900/40 cursor-pointer transition-all duration-300 hover:from-gray-800/30 hover:via-purple-800/20 hover:to-blue-800/30"
                  onClick={handlePlayVideo}
                >
                  <div 
                    className="bg-gradient-to-r from-purple-400/30 to-blue-400/30 backdrop-blur-sm rounded-full group-hover:scale-110 transition-transform duration-300 border border-purple-300/50"
                    style={{
                      padding: 'clamp(1rem,3vw,2rem)'
                    }}
                  >
                    <Play 
                      className="text-purple-200 ml-1" 
                      fill="currentColor" 
                      style={{
                        width: 'clamp(2rem,5vw,3rem)',
                        height: 'clamp(2rem,5vw,3rem)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
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
