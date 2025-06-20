import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Heart, Users, MessageCircle, Dumbbell, MapPin, Calendar, Zap, UserPlus, Target, Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';

const GymBrosSection = ({ onNavigate, isActive }) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isDragDisabled, setIsDragDisabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);  const [isTouchScrolling, setIsTouchScrolling] = useState(false);
  const videoRef = useRef(null);
  const mobileVideoRef = useRef(null);

  // Format time display (mm:ss)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  // Handle video events
  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
    setIsDragDisabled(true);
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
    setIsDragDisabled(false);
  };
  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    setIsDragDisabled(false);
  };

  // Handle video metadata loaded
  const handleLoadedMetadata = (video) => {
    if (video && video.duration) {
      setVideoDuration(video.duration);
    }
  };// Handle time update
  const handleTimeUpdate = (video) => {
    if (video) {
      setCurrentTime(video.currentTime);
    }
  };
  // Toggle sound
  const handleToggleSound = (e) => {
    e.stopPropagation();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
  };// Handle fullscreen - mobile gets custom overlay, desktop gets native fullscreen
  const handleFullscreen = async (e, isMobile = false) => {
    e.stopPropagation();
    const targetVideo = isMobile ? mobileVideoRef.current : videoRef.current;
    
    if (targetVideo) {
      if (isMobile) {
        // Always use custom overlay for mobile to avoid taking over PC monitor
        createMobileFullscreenOverlay(targetVideo);
      } else {
        // Desktop can use native fullscreen
        try {
          if (targetVideo.requestFullscreen) {
            await targetVideo.requestFullscreen();
          } else if (targetVideo.webkitRequestFullscreen) {
            await targetVideo.webkitRequestFullscreen();
          } else if (targetVideo.msRequestFullscreen) {
            await targetVideo.msRequestFullscreen();
          }
        } catch (error) {
          console.error('Desktop fullscreen request failed:', error);
        }
      }
    }
  };  // Custom mobile fullscreen overlay (viewport only, no native fullscreen)
  const createMobileFullscreenOverlay = (video) => {
    // Create overlay that only covers the viewport
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 w-screen h-screen bg-black z-[9999] flex flex-col items-center justify-center touch-none p-4 md:p-5 lg:p-6';
    
    // Create video container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'flex-1 w-full flex items-center justify-center relative';
    
    // Clone the video element
    const videoClone = video.cloneNode(true);
    videoClone.className = 'w-full h-full object-contain max-w-full max-h-[70vh]';
    
    // Sync video state
    videoClone.currentTime = video.currentTime;
    videoClone.muted = video.muted;
    if (isVideoPlaying) {
      videoClone.play();
    }

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    closeButton.className = 'absolute top-4 right-4 md:top-5 md:right-5 lg:top-6 lg:right-6 bg-black/80 text-white border-2 border-white/30 w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer z-[10000] flex items-center justify-center opacity-100 transition-all duration-300 backdrop-blur-sm hover:bg-white/20 hover:border-white/50';

    // Create video controls bar - positioned below video
    const controlsBar = document.createElement('div');
    controlsBar.className = 'w-full max-w-md md:max-w-lg lg:max-w-xl bg-black/80 p-4 md:p-5 flex items-center justify-between z-[10001] opacity-100 transition-opacity duration-300 rounded-xl mt-4 md:mt-5 backdrop-blur-sm border border-white/10';
    
    // Controls visibility state
    let controlsVisible = true;
    let hideControlsTimeout;
      // Function to show controls
    const showControls = () => {
      controlsVisible = true;
      controlsBar.style.opacity = '1';
      closeButton.style.opacity = '1';
      
      // Clear existing timeout
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
      
      // Auto-hide after 5 seconds (increased from 3 for mobile)
      if (!videoClone.paused) {
        hideControlsTimeout = setTimeout(() => {
          if (controlsVisible && !videoClone.paused) {
            controlsVisible = false;
            controlsBar.style.opacity = '0';
            closeButton.style.opacity = '0.5'; // Keep close button slightly visible
          }
        }, 5000); // Increased timeout for mobile
      }
    };
      // Function to toggle controls
    const toggleControls = () => {
      if (controlsVisible) {
        controlsVisible = false;
        controlsBar.style.opacity = '0';
        closeButton.style.opacity = '0.5'; // Keep close button slightly visible
        if (hideControlsTimeout) {
          clearTimeout(hideControlsTimeout);
        }
      } else {
        showControls();
      }
    };
    
    // Add both touch and click events for better mobile support
    videoClone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleControls();
    });
    
    videoClone.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleControls();
    });
    
    // Add overlay touch event to show controls
    overlay.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showControls();
    });
    
    // Show controls when video is paused
    videoClone.addEventListener('pause', showControls);
    videoClone.addEventListener('play', showControls);    
    // Time display
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'text-white text-sm font-medium';
    
    // Controls container - all buttons in one row
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'flex items-center gap-3 md:gap-4 flex-wrap justify-center';

    // Sound toggle button
    const soundButton = document.createElement('button');    soundButton.className = 'bg-black/80 text-white border-2 border-white/20 w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-white/20 hover:border-white/40 active:scale-95 touch-manipulation backdrop-blur-sm';

    // Play/Pause button
    const playPauseButton = document.createElement('button');
    playPauseButton.className = 'bg-black/80 text-white border-2 border-white/20 w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-white/20 hover:border-white/40 active:scale-95 touch-manipulation backdrop-blur-sm';    // Minimize button (same as close)
    const minimizeButton = document.createElement('button');
    minimizeButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
    minimizeButton.className = 'bg-black/80 text-white border-2 border-white/20 w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-white/20 hover:border-white/40 active:scale-95 touch-manipulation backdrop-blur-sm';
    
    // Update functions
    const updateTimeDisplay = () => {
      const current = Math.floor(videoClone.currentTime);
      const duration = Math.floor(videoClone.duration) || 0;
      timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    };const updateSoundButton = () => {
      if (videoClone.muted) {
        soundButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 17 9 17 15 11 19 11 5"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>`;
        soundButton.title = 'Unmute';
      } else {
        soundButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 17 9 17 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
        soundButton.title = 'Mute';
      }
    };
    
    const updatePlayPauseButton = () => {
      if (videoClone.paused) {
        playPauseButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        playPauseButton.title = 'Play';
      } else {
        playPauseButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        playPauseButton.title = 'Pause';
      }
    };
    
    // Event listeners
    videoClone.addEventListener('timeupdate', updateTimeDisplay);
    videoClone.addEventListener('loadedmetadata', updateTimeDisplay);
    videoClone.addEventListener('play', updatePlayPauseButton);
    videoClone.addEventListener('pause', updatePlayPauseButton);
    
    soundButton.onclick = () => {
      videoClone.muted = !videoClone.muted;
      updateSoundButton();
    };
    
    playPauseButton.onclick = () => {
      if (videoClone.paused) {
        videoClone.play();
      } else {
        videoClone.pause();
      }
      updatePlayPauseButton();
    };
    
    // Handle close
    const closeOverlay = () => {
      // Sync video state back
      video.currentTime = videoClone.currentTime;
      video.muted = videoClone.muted;
      if (!videoClone.paused) {
        video.play();
      } else {
        video.pause();
      }
      
      // Remove overlay
      document.body.removeChild(overlay);
      
      // Unlock orientation if possible
      if (screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
        } catch (e) {
          // Orientation unlock failed, ignore
        }
      }
    };
    
    closeButton.onclick = closeOverlay;
    minimizeButton.onclick = closeOverlay;
    
    // Handle escape key
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        closeOverlay();
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
    document.addEventListener('keydown', handleKeyPress);
      // Initialize displays
    updateTimeDisplay();
    updateSoundButton();
    updatePlayPauseButton();
      // Assemble controls - all buttons in one container
    controlsContainer.appendChild(playPauseButton);
    controlsContainer.appendChild(soundButton);    controlsContainer.appendChild(minimizeButton);
    
    // Create a main controls section with time and buttons
    const mainControls = document.createElement('div');
    mainControls.className = 'flex flex-col items-center gap-3 w-full';
    
    mainControls.appendChild(timeDisplay);
    mainControls.appendChild(controlsContainer);
    controlsBar.appendChild(mainControls);
    
    // Add video to its container
    videoContainer.appendChild(videoClone);
    
    // Add elements to overlay in column layout
    overlay.appendChild(closeButton);
    overlay.appendChild(videoContainer);
    overlay.appendChild(controlsBar);
    
    // Add to body (this stays within viewport, not native fullscreen)
    document.body.appendChild(overlay);
    
    // Try to lock orientation to landscape for mobile
    if (screen.orientation && screen.orientation.lock) {
      try {
        screen.orientation.lock('landscape');
      } catch (orientationError) {
        console.log('Orientation lock not supported or failed:', orientationError);
      }    }
  };
  // Sync video playback
  useEffect(() => {
    const syncVideos = () => {
      if (videoRef.current) {
        // Sync muted state
        videoRef.current.muted = isMuted;
        
        if (isVideoPlaying) {
          videoRef.current.play().catch(console.error);
        } else {
          videoRef.current.pause();
        }
      }
    };

    syncVideos();
  }, [isVideoPlaying, isMuted]);
  // Reset video state when component becomes inactive
  useEffect(() => {
    if (!isActive && isVideoPlaying) {
      setIsVideoPlaying(false);
      setIsDragDisabled(false);
      setCurrentTime(0);
    }
  }, [isActive, isVideoPlaying]);  const handlePlayVideo = (isMobile = false) => {
    const targetVideo = isMobile ? mobileVideoRef.current : videoRef.current;
    
    console.log('handlePlayVideo called - isMobile:', isMobile, 'targetVideo:', targetVideo, 'isVideoPlaying:', isVideoPlaying);
    
    if (targetVideo) {
      if (isVideoPlaying) {
        // Pause the video
        console.log('Pausing video');
        targetVideo.pause();
        setIsVideoPlaying(false);
        setIsDragDisabled(false);
      } else {
        // Play the video
        console.log('Playing video');
        targetVideo.play().then(() => {
          console.log('Video play successful');
          setIsVideoPlaying(true);
          setIsDragDisabled(true);
        }).catch((error) => {
          console.error('Error playing video:', error);
        });
      }
    } else {
      console.error('No target video found');
    }
  };
  // Enhanced touch handling for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartTime(Date.now());
    setIsTouchScrolling(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStartY || !touchStartTime) return;
    
    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartY);
    const deltaTime = Date.now() - touchStartTime;
    
    // If user is scrolling (significant Y movement), mark as scrolling
    if (deltaY > 10 && deltaTime > 50) {
      setIsTouchScrolling(true);
    }
  };

  const handleTouchEnd = (e) => {
    const deltaTime = Date.now() - (touchStartTime || 0);
    
    // Only trigger video action if it's a quick tap (not a scroll gesture)
    if (!isTouchScrolling && deltaTime < 300) {
      e.preventDefault();
      e.stopPropagation();
      handlePlayVideo(true);
    }
    
    // Reset touch tracking
    setTouchStartY(null);
    setTouchStartTime(null);
    setIsTouchScrolling(false);
  };
  const handleVideoClick = (e, isMobile = false) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Video clicked - isMobile:', isMobile, 'isVideoPlaying:', isVideoPlaying);
    
    // For desktop, always handle click
    if (!isMobile) {
      handlePlayVideo(false);
    }
    // For mobile, touch events are handled separately
  };
  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden" 
      style={{ 
        pointerEvents: 'auto', // Always allow pointer events
        touchAction: 'pan-y', // Allow vertical scrolling but prevent other gestures
      }}
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/GymTonic.mp4" type="video/mp4" />
      </video>        {/* Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 transition-all duration-300 ${
        isDragDisabled ? 'bg-black/80' : ''
      }`}></div>
        <div 
        className={`relative z-10 h-full w-full transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
        style={{ 
          pointerEvents: 'auto',
          touchAction: 'pan-y' // Allow vertical scrolling
        }}
      >{/* Large Screen Layout */}
        <div className="hidden lg:flex h-full pt-16 relative">
          {/* Left Side - Header + Video */}
          <div className="w-1/2 flex flex-col justify-center items-center px-8 py-6 pt-8 pb-24">{/* Header Section */}
            <div className={`text-center mb-8 pt-8 transition-all duration-1000 ${
              isActive 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: isActive ? '200ms' : '0ms' }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-blue-400/30">
                <Users className="w-4 h-4" />
                Fitness Community
              </div>
              
              {/* Title */}
              <h2 className="text-5xl xl:text-6xl font-bold text-white mb-3">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  GymBros
                </span>
              </h2>
              <h3 className="text-2xl xl:text-3xl font-bold text-white mb-4">
                Find Your Perfect Workout Partner
              </h3>
              
              {/* Subtitle */}
              <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                Connect with like-minded fitness enthusiasts through our intelligent matching system
              </p>
            </div>            {/* Video Section - Right below headline */}
            <div className={`w-full max-w-md transition-all duration-1000 ${
              isActive 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-8 scale-95'
            }`} style={{ transitionDelay: isActive ? '400ms' : '0ms' }}>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/20 shadow-2xl backdrop-blur-sm">
                {/* Video Element */}                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                  muted={isMuted}
                  onClick={(e) => handleVideoClick(e, false)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                  onLoadedMetadata={(e) => handleLoadedMetadata(e.target)}
                  onTimeUpdate={(e) => handleTimeUpdate(e.target)}
                  style={{ touchAction: 'manipulation', pointerEvents: 'auto' }}
                  playsInline
                  preload="metadata"
                >
                  <source src="/GymTonic.mp4" type="video/mp4" />
                </video>
                
                {/* Play Button Overlay */}
                {!isVideoPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-all duration-300 hover:bg-black/30"
                    onClick={(e) => handleVideoClick(e, false)}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 hover:bg-white">
                      <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
                    </div>
                  </div>                )}
              </div>
            </div>
          </div>{/* Right Side - Content */}
          <div className="w-1/2 flex items-center px-8 py-6 pt-8 pb-24">
            <div className="w-full max-w-xl">
              <div className="grid grid-cols-1 gap-8">
                  {/* Benefits Section */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-8'
                }`} style={{ transitionDelay: isActive ? '600ms' : '0ms' }}>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    Why GymBros?
                  </h3>
                  
                  <div className="space-y-4">
                    <div className={`flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '800ms' : '0ms' }}>
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">Smart Matching</h4>
                        <p className="text-white/70 text-sm">Algorithm matches based on goals and preferences</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '900ms' : '0ms' }}>
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">Accountability</h4>
                        <p className="text-white/70 text-sm">Stay motivated with workout partners</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '1000ms' : '0ms' }}>
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">Community</h4>
                        <p className="text-white/70 text-sm">Share progress and celebrate together</p>
                      </div>
                    </div>
                  </div>
                </div>                {/* How It Works Section */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-8'
                }`} style={{ transitionDelay: isActive ? '1100ms' : '0ms' }}>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    How It Works
                  </h3>
                  
                  <div className="space-y-3">
                    <div className={`flex items-start gap-3 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1200ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Create Profile</h4>
                        <p className="text-white/70 text-xs">Set your fitness goals and workout preferences</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-3 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1300ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Discover Matches</h4>
                        <p className="text-white/70 text-xs">Browse compatible workout partners near you</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-3 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1400ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Connect & Plan</h4>
                        <p className="text-white/70 text-xs">Start conversations and schedule workout sessions</p>
                      </div>                    </div>
                    
                    <div className={`flex items-start gap-3 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1500ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Workout Together</h4>
                        <p className="text-white/70 text-xs">Train together and build lasting fitness friendships</p>
                      </div>
                    </div>
                  </div>
                </div>                {/* CTA Button */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95'
                }`} style={{ transitionDelay: isActive ? '1600ms' : '0ms' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('/gymbros');
                    }}
                    className="group w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Users className="w-6 h-6" />
                    <span>Find Your GymBro</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden h-full flex flex-col pt-16">          {/* Header Section - Reduced height */}
          <div className="flex-none h-[20vh] min-h-[140px] max-h-[180px] flex items-center justify-center px-4 py-2 pt-4">            <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 pt-4 ${
              isActive 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: isActive ? '200ms' : '0ms' }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2 border border-blue-400/30">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Fitness Community
              </div>
              
              {/* Title - Reduced font sizes */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  GymBros
                </span>
              </h2>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">
                Find Your Perfect Workout Partner
              </h3>
              
              {/* Subtitle - Reduced */}
              <p className="text-xs sm:text-sm text-white/80 max-w-lg mx-auto leading-relaxed">
                Connect with like-minded fitness enthusiasts
              </p>
            </div>
          </div>          {/* Video Section - Much smaller and responsive like HeroSection */}
          <div className="flex-none h-[12vh] min-h-[80px] max-h-[100px] flex items-center justify-center px-4 py-2 mb-3">
            <div className={`w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] mx-auto transition-all duration-1000 ${
              isActive 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-8 scale-95'
            }`} style={{ transitionDelay: isActive ? '400ms' : '0ms' }}>              <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/20 shadow-lg backdrop-blur-sm">
                {/* Video Element */}                <video
                  ref={mobileVideoRef}
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                  muted={isMuted}
                  onClick={(e) => handleVideoClick(e, true)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                  onLoadedMetadata={(e) => handleLoadedMetadata(e.target)}
                  onTimeUpdate={(e) => handleTimeUpdate(e.target)}
                  style={{ touchAction: 'manipulation', pointerEvents: 'auto' }}
                  playsInline
                  webkit-playsinline="true"
                  x5-playsinline="true"
                  preload="metadata"
                >
                  <source src="/GymTonic.mp4" type="video/mp4" />
                </video>
                
                {/* Play Button Overlay */}
                {!isVideoPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-all duration-300 hover:bg-black/30"
                    onClick={(e) => handleVideoClick(e, true)}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 hover:bg-white">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                )}
                
                {/* Video Controls Overlay (when playing) */}
                {isVideoPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-transparent cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-300"
                    onClick={(e) => handleVideoClick(e, true)}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black/60 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 hover:bg-black/70">
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" />
                    </div>
                  </div>                )}
              </div>
            </div>
          </div>{/* Content Section - More height and better scrolling */}
          <div className="flex-1 min-h-0 overflow-hidden px-4 py-2 pb-6 pt-2">
            <div className="h-full max-w-6xl mx-auto overflow-y-auto">
              <div className="flex flex-col gap-4">                  {/* Benefits Section - Condensed for mobile */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: isActive ? '600ms' : '0ms' }}>
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 flex-shrink-0">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-2.5 h-2.5 text-white" />
                    </div>
                    Why GymBros?
                  </h3>
                  
                  <div className="space-y-2">
                    <div className={`flex items-start gap-2 p-2 rounded-lg bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '800ms' : '0ms' }}>
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-3 h-3 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs">Smart Matching</h4>
                        <p className="text-white/70 text-xs">Algorithm matches based on goals</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-2 p-2 rounded-lg bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '900ms' : '0ms' }}>
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-3 h-3 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs">Accountability</h4>
                        <p className="text-white/70 text-xs">Stay motivated with partners</p>
                      </div>
                    </div>
                      <div className={`flex items-start gap-2 p-2 rounded-lg bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '1000ms' : '0ms' }}>                      <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-3 h-3 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs">Community</h4>
                        <p className="text-white/70 text-xs">Share progress together</p>
                      </div>
                    </div>
                  </div>
                </div>                {/* How It Works Section - Condensed for mobile */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: isActive ? '1100ms' : '0ms' }}>
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2 flex-shrink-0">
                    <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-2.5 h-2.5 text-white" />
                    </div>
                    How It Works
                  </h3>                  
                  <div className="space-y-2">
                    <div className={`flex items-start gap-2 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1200ms' : '0ms' }}>
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                        1
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs">Create Profile</h4>
                        <p className="text-white/70 text-xs">Set goals and preferences</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-2 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1300ms' : '0ms' }}>
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                        2
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs">Discover Matches</h4>
                        <p className="text-white/70 text-xs">Browse compatible partners</p>
                      </div>
                    </div>
                      <div className={`flex items-start gap-2 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1400ms' : '0ms' }}>
                      <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                        3
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs">Connect & Chat</h4>
                        <p className="text-white/70 text-xs">Start conversations</p>
                      </div>                    </div>
                    
                    <div className={`flex items-start gap-2 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1500ms' : '0ms' }}>
                      <div className="w-5 h-5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                        4
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs">Workout Together</h4>
                        <p className="text-white/70 text-xs">Train and build friendships</p>
                      </div>
                    </div>
                  </div>
                </div>{/* CTA Button with proper margin from bottom */}
                <div className={`pt-4 pb-4 transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95'
                }`} style={{ transitionDelay: isActive ? '1600ms' : '0ms' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('/gymbros');
                    }}
                    className="group w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Users className="w-5 h-5" />
                    <span>Find Your GymBro</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal - EXACT copy from CoachingHome.jsx */}
      {isVideoPlaying && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/70"
          onClick={() => {
            setIsVideoPlaying(false);
            setIsDragDisabled(false);
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsVideoPlaying(false);
                setIsDragDisabled(false);
                if (videoRef.current) {
                  videoRef.current.pause();
                  videoRef.current.currentTime = 0;
                }
              }}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full">
              <video 
                className="w-full h-full"
                controls
                autoPlay
                muted
              >
                <source src="/GymTonic.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-white">
                GymBros Video
              </h3>
              <p className="text-gray-300">
                Connect with like-minded fitness enthusiasts through our intelligent matching system
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GymBrosSection;
