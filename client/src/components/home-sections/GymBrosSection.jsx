import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Users, MessageCircle, Target, Play, X, UserPlus, Dumbbell, MapPin, Calendar, Zap } from 'lucide-react';
import { getCloudinaryVideoUrl, getCloudinaryVideoPoster, getCloudinaryThumbnail } from '../../utils/cloudinary';
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

  // Handle ESC key to close video modal
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && videoModalOpen) {
        closeVideoModal();
      }
    };

    if (videoModalOpen) {
      document.addEventListener('keydown', handleKeyPress);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [videoModalOpen]);

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
      src: getCloudinaryVideoUrl('gymtonic', { 
        quality: 'auto:good',
        format: 'auto'
      }),
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
  };

  return (
    <div className={`absolute inset-0 flex items-center justify-center p-[clamp(1rem,4vw,3rem)] overflow-hidden pointer-events-auto`}>
      <div 
        className={`w-full max-w-[clamp(320px,95vw,1800px)] mx-auto transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >        
        <div 
          className="bg-gradient-to-br from-gray-900/60 via-purple-900/50 to-blue-900/50 backdrop-blur-md overflow-hidden border border-cyan-400/40 shadow-2xl pointer-events-auto"
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
                className="inline-flex items-center bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-200 font-semibold border border-cyan-400/30"
                style={{
                  gap: 'clamp(0.5rem,1vw,0.75rem)',
                  padding: 'clamp(0.5rem,1.5vw,1rem) clamp(0.75rem,2vw,1.25rem)',
                  borderRadius: 'clamp(1rem,2vw,1.5rem)',
                  fontSize: 'clamp(0.75rem,1.5vw,1rem)',
                  marginBottom: 'clamp(1rem,3vw,2rem)'
                }}
              >
                <Users style={{ width: 'clamp(0.75rem,1.5vw,1rem)', height: 'clamp(0.75rem,1.5vw,1rem)' }} />
                {t('gymbrossection.fitnessCommunity')}
              </div>
              
              <h2 
                className="font-bold text-white bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent leading-[0.9]"
                style={{
                  fontSize: 'clamp(1.75rem,6vw,4rem)',
                  marginBottom: 'clamp(1rem,3vw,2rem)',
                  letterSpacing: 'clamp(-0.02em,0.1vw,0.02em)'
                }}
              >
                {t('gymbrossection.findYourGymBro')}
              </h2>
              
              <p 
                className="text-gray-100/90 max-w-2xl leading-relaxed"
                style={{
                  fontSize: 'clamp(1rem,2.5vw,1.5rem)',
                  marginBottom: 'clamp(1.5rem,4vw,2.5rem)',
                  lineHeight: 'clamp(1.4,1.6,1.7)'
                }}
              >
                {t('gymbrossection.intro')}
              </p>

              {/* Mobile Video - Right below description */}
              <div 
                className="lg:hidden"
                style={{
                  marginBottom: 'clamp(1.5rem,4vw,2.5rem)'
                }}
              >
                <div 
                  className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-800/60 to-cyan-800/60 border border-cyan-400/30 shadow-2xl backdrop-blur-sm"
                  style={{
                    borderRadius: 'clamp(0.75rem,2vw,1.5rem)'
                  }}
                >
                  {/* Mobile Video */}
                  <video
                    ref={mobileVideoRef}
                    className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    muted
                    playsInline
                    preload="metadata"
                    poster={getCloudinaryVideoPoster('gymtonic', { 
                      width: 800, 
                      height: 450 
                    })}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEndVideo}
                  >
                    <source src={getCloudinaryVideoUrl('gymtonic', { 
                      quality: 'auto:good',
                      format: 'auto'
                    })} type="video/mp4" />
                  </video>
                  
                  {/* Play Button Overlay */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/40 via-cyan-900/30 to-purple-900/40 cursor-pointer transition-all duration-300 hover:from-gray-800/30 hover:via-cyan-800/20 hover:to-purple-800/30"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlayVideo();
                    }}
                  >
                    <div 
                      className="bg-gradient-to-r from-cyan-400/30 to-purple-400/30 backdrop-blur-sm rounded-full group-hover:scale-110 transition-transform duration-300 border border-cyan-300/50"
                      style={{
                        padding: 'clamp(1rem,3vw,2rem)'
                      }}
                    >
                      <Play 
                        className="text-cyan-200 ml-1" 
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

              {/* Features */}
              <div 
                className="grid grid-cols-1 sm:grid-cols-2"
                style={{
                  gap: 'clamp(0.75rem,2vw,1.25rem)',
                  marginBottom: 'clamp(1.5rem,4vw,2.5rem)'
                }}
              >
                <div 
                  className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-300/30 flex items-center hover:from-cyan-400/30 hover:to-blue-400/30 transition-all duration-300"
                  style={{
                    borderRadius: 'clamp(0.5rem,1.5vw,1rem)',
                    padding: 'clamp(0.75rem,2vw,1.25rem)',
                    gap: 'clamp(0.5rem,1.5vw,1rem)'
                  }}
                >
                  <UserPlus 
                    className="text-cyan-300 flex-shrink-0" 
                    style={{
                      width: 'clamp(1.25rem,3vw,1.5rem)',
                      height: 'clamp(1.25rem,3vw,1.5rem)'
                    }}
                  />
                  <div className="text-left min-w-0">
                    <div 
                      className="text-cyan-200 font-semibold"
                      style={{
                        fontSize: 'clamp(0.875rem,2vw,1.125rem)'
                      }}
                    >
                      {t('gymbrossection.smartMatching')}
                    </div>
                    <div 
                      className="text-cyan-200/70"
                      style={{
                        fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                      }}
                    >
                      {t('gymbrossection.findPartners')}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300/30 flex items-center hover:from-purple-400/30 hover:to-pink-400/30 transition-all duration-300"
                  style={{
                    borderRadius: 'clamp(0.5rem,1.5vw,1rem)',
                    padding: 'clamp(0.75rem,2vw,1.25rem)',
                    gap: 'clamp(0.5rem,1.5vw,1rem)'
                  }}
                >
                  <MessageCircle 
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
                      {t('gymbrossection.chatConnect')}
                    </div>
                    <div 
                      className="text-purple-200/70"
                      style={{
                        fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                      }}
                    >
                      {t('gymbrossection.startConversations')}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-300/30 flex items-center hover:from-pink-400/30 hover:to-rose-400/30 transition-all duration-300"
                  style={{
                    borderRadius: 'clamp(0.5rem,1.5vw,1rem)',
                    padding: 'clamp(0.75rem,2vw,1.25rem)',
                    gap: 'clamp(0.5rem,1.5vw,1rem)'
                  }}
                >
                  <Target 
                    className="text-pink-300 flex-shrink-0" 
                    style={{
                      width: 'clamp(1.25rem,3vw,1.5rem)',
                      height: 'clamp(1.25rem,3vw,1.5rem)'
                    }}
                  />
                  <div className="text-left min-w-0">
                    <div 
                      className="text-pink-200 font-semibold"
                      style={{
                        fontSize: 'clamp(0.875rem,2vw,1.125rem)'
                      }}
                    >
                      {t('gymbrossection.goalAlignment')}
                    </div>
                    <div 
                      className="text-pink-200/70"
                      style={{
                        fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                      }}
                    >
                      {t('gymbrossection.shareObjectives')}
                    </div>
                  </div>
                </div>
                
                <div 
                  className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-300/30 flex items-center hover:from-blue-400/30 hover:to-cyan-400/30 transition-all duration-300"
                  style={{
                    borderRadius: 'clamp(0.5rem,1.5vw,1rem)',
                    padding: 'clamp(0.75rem,2vw,1.25rem)',
                    gap: 'clamp(0.5rem,1.5vw,1rem)'
                  }}
                >
                  <Dumbbell 
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
                      {t('gymbrossection.workoutTogether')}
                    </div>
                    <div 
                      className="text-blue-200/70"
                      style={{
                        fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                      }}
                    >
                      {t('gymbrossection.trainTeam')}
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate('/gymbros')}
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold rounded-full flex items-center mx-auto lg:mx-0 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 border border-cyan-300/30"
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
                <span className="relative z-10">{t('gymbrossection.findYourGymBro')}</span>
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
              className={`hidden lg:block w-full pointer-events-auto`}
              style={{
                padding: 'clamp(1.5rem,4vw,3rem)'
              }}
            >
              <div 
                className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-800/60 to-cyan-800/60 border border-cyan-400/30 shadow-2xl backdrop-blur-sm"
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
                  poster={getCloudinaryVideoPoster('gymtonic', { 
                    width: 800, 
                    height: 450 
                  })}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePlayVideo();
                  }}
                >
                  <source src={getCloudinaryVideoUrl('gymtonic', { 
                    quality: 'auto:good',
                    format: 'auto'
                  })} type="video/mp4" />
                </video>
                
                {/* Play Button Overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/40 via-cyan-900/30 to-purple-900/40 cursor-pointer transition-all duration-300 hover:from-gray-800/30 hover:via-cyan-800/20 hover:to-purple-800/30"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePlayVideo();
                  }}
                >
                  <div 
                    className="bg-gradient-to-r from-cyan-400/30 to-purple-400/30 backdrop-blur-sm rounded-full group-hover:scale-110 transition-transform duration-300 border border-cyan-300/50"
                    style={{
                      padding: 'clamp(1rem,3vw,2rem)'
                    }}
                  >
                    <Play 
                      className="text-cyan-200 ml-1" 
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
      </div>      {/* Video Modal */}
      {videoModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 backdrop-blur-md bg-black/80"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              closeVideoModal();
            }
          }}
          onTouchStart={(e) => {
            // Prevent touch events from bubbling to elements behind modal
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            // Prevent touch events from bubbling to elements behind modal
            e.stopPropagation();
            // Try to close on touch end if touching backdrop directly
            if (e.target === e.currentTarget) {
              closeVideoModal();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden relative border border-gray-200 dark:border-gray-700"
            style={{
              // Responsive sizing: larger on small screens, 50% on large screens
              width: 'clamp(320px, 90vw, 50vw)',
              height: 'clamp(240px, 60vh, 50vh)',
              maxWidth: '800px',
              maxHeight: '600px'
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeVideoModal();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                closeVideoModal();
              }}
              className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-gray-700/90 text-gray-300 hover:text-white hover:bg-gray-600 transition-all duration-200 backdrop-blur-sm border border-gray-600/50 shadow-lg"
              style={{ 
                minWidth: '40px', 
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <video 
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                  onLoadedData={(e) => {
                    // Unmute the video when it loads
                    e.target.muted = false;
                    e.target.volume = 0.7;
                  }}
                >
                  <source src={selectedVideo.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-2 text-black dark:text-white">
                  {selectedVideo.title}
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {selectedVideo.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymBrosSection;
