import React, { useState, useEffect } from 'react';
import { ShoppingBag, Users, Gamepad2, Trophy, ChevronLeft, ChevronRight, MessageCircle, ArrowRight, XCircle, Info, UserPlus, Dumbbell, Target } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import productService from '../../services/product.service';
import gymBrosService from '../../services/gymbros.service';
import { formatImageUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';
import { getCloudinaryVideoUrl } from '../../utils/cloudinary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogTrigger } from '../../components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFirstProductImageUrl } from '../../utils/imageUtils';

const HeroSection = ({ onNavigate, isActive, goToSection }) => {
  const { darkMode } = useTheme();
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [gymBrosData, setGymBrosData] = useState(null);
  const [gymBrosLoading, setGymBrosLoading] = useState(true);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [hasAnimationStarted, setHasAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [backgroundVideoLoaded, setBackgroundVideoLoaded] = useState(false);
  const [backgroundVideoError, setBackgroundVideoError] = useState(false);
  const [mainVideoLoaded, setMainVideoLoaded] = useState(false);
  const [mainVideoError, setMainVideoError] = useState(false);
  const [backgroundVideoKey, setBackgroundVideoKey] = useState(0);
  const [mainVideoKey, setMainVideoKey] = useState(0);
  const [gymBrosCarouselRef, setGymBrosCarouselRef] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

    useEffect(() => {
    let timeouts = [];
    const initializeComponent = () => {
      setIsComponentReady(true);
      timeouts.push(setTimeout(() => setShowContent(true), 300));
      timeouts.push(setTimeout(() => { if (isActive) setHasAnimationStarted(true); }, 600));
    };
    initializeComponent();
    return () => timeouts.forEach(clearTimeout);
  }, [isActive]);

  useEffect(() => {
    if (isActive && isComponentReady && showContent) {
      const timer = setTimeout(() => setHasAnimationStarted(true), 100);
      return () => clearTimeout(timer);
    } else if (!isActive) {
      setHasAnimationStarted(false);
    }
  }, [isActive, isComponentReady, showContent]);
  
    // Replace the entire fetchFeaturedProducts useEffect with this corrected version:

useEffect(() => {
  const fetchFeaturedProducts = async () => {
    try {
      setProductsLoading(true);
      // Fetch only featured products
      const response = await productService.getProducts({ featured: true });
      console.log('Featured products data:', response.data);
      const data = response.data || [];
      
      // SIMPLIFIED MAPPING - Use utility function only
      const products = data.map(product => {
        return {
          id: product._id,
          name: product.name,
          image: getFirstProductImageUrl(product, '/Picture3.png'), // Use utility function
          price: `$${product.price?.toFixed(2) || '0.00'}`,
          discount: product.discount,
          originalPrice: product.price,
          stockQuantity: product.stockQuantity,
          preOrder: product.preOrder,
        };
      });
      
      console.log('Processed products:', products); // Add this to debug processed data
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching featured products:', error); // Add error logging
      setFeaturedProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };
  fetchFeaturedProducts();
}, []);

  useEffect(() => {
    const fetchGymBrosData = async () => {
      try {
        setGymBrosLoading(true);
        try {
          const profileResponse = await gymBrosService.getGymBrosProfile();
          if (profileResponse.hasProfile) {
            try {
              const matchesData = await gymBrosService.getMatches();
              setGymBrosData({
                hasProfile: true,
                matchesCount: matchesData.length || 0,
                recentMatches: matchesData.slice(0, 3)
              });
            } catch {
              setGymBrosData({ hasProfile: true, matchesCount: 0 });
            }
          } else {
            setGymBrosData({ hasProfile: false });
          }
        } catch {
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


  const navigateToSection = (sectionIndex) => {
    if (goToSection) {
      goToSection(sectionIndex);
    }
  };

  const nextProduct = () => {
    setCurrentProductIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const prevProduct = () => {
    setCurrentProductIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };

  // Helper for price display (discount)
  const getPriceDisplay = (product) => {
    if (
      product.discount &&
      product.discount.percentage &&
      (!product.discount.startDate || new Date(product.discount.startDate) <= new Date()) &&
      (!product.discount.endDate || new Date(product.discount.endDate) >= new Date())
    ) {
      const discounted = product.originalPrice * (1 - product.discount.percentage / 100);
      return {
        discounted: `$${discounted.toFixed(2)}`,
        original: `$${product.originalPrice.toFixed(2)}`,
        percentage: product.discount.percentage,
      };
    }
    return { original: product.price };
  };

  return (
  // The main container for the entire HeroSection
    <div className="absolute inset-0" style={{ marginTop: 'var(--navbar-height, 0px)' }}>
      {!isComponentReady && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {isComponentReady && !showContent && (
        <div className="absolute inset-0 z-40 bg-black transition-opacity duration-300"></div>
      )}

      {/* This container holds all visible content and uses flexbox to distribute space */}
      <div className={`w-full h-full flex flex-col transition-all duration-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>

      {/* Background Video for entire section - Bottom layer with reduced opacity */}
      {(!backgroundVideoError && !backgroundVideoLoaded) || (!backgroundVideoError && backgroundVideoLoaded) ? (
        <video
          key={backgroundVideoKey}
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          className="absolute inset-0 w-full h-full object-cover opacity-10 bg-video-hide-controls"
          style={{ display: backgroundVideoLoaded ? 'block' : 'none' }}
          onLoadedData={e => {
            setBackgroundVideoLoaded(true);
            setBackgroundVideoError(false);
            try { e.target.currentTime = 0; e.target.play(); } catch {}
          }}
          onError={() => {
            setBackgroundVideoError(true);
          }}
          onCanPlay={() => setBackgroundVideoLoaded(true)}
        >
          <source src={getCloudinaryVideoUrl('gymtonic', { 
            quality: 'auto:eco',
            format: 'auto'
          })} type="video/mp4" />
        </video>
      ) : null}
      <style>{`
        .bg-video-hide-controls::-webkit-media-controls-panel {
          display: none !important;
        }
        .bg-video-hide-controls::-webkit-media-controls-play-button {
          display: none !important;
        }
        .bg-video-hide-controls::-webkit-media-controls-start-playback-button {
          display: none !important;
        }
      `}</style>
      {/* Show fallback image only while video is loading or during retry */}
      {(!backgroundVideoLoaded || backgroundVideoError) && (
        <img
          src="/Picture3.png"
          alt="Gym background"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
      )}
      {/* Gradient overlay - On top of video */}
      <div className="absolute inset-0 transition-colors duration-500 bg-gray-900/60"></div>
      <div
        className={`w-full h-full transition-all duration-700 ${
          showContent
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Mobile Layout: Two Sections Stacked */}
        <div className="h-full flex flex-col pointer-events-auto">
          {/* Desktop Heading - Hidden on Mobile */}
          <div className="hidden lg:block text-center">
            <p className={`text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed transition-colors duration-500 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('herosection.ecosystem')}
            </p>
          </div>
 {/* Section 1: Video Background with GET STARTED text only */}
          <div className={`relative z-20 ${darkMode ? 'bg-gradient-to-b from-white/5 via-gray-900 to-gray-900' : 'bg-gradient-to-b from-black/5 via-white to-white'}`}>
            <div
              className="relative z-20 w-full flex items-center justify-center overflow-hidden"
              style={{
                paddingTop: 'var(--navbar-height)',
                height: 'clamp(150px, 50vh, 150px)', 
              }}
            >
              {/* Video Background - Full width */}
              {!mainVideoError || !mainVideoLoaded ? (
                <video
                  key={mainVideoKey}
                  autoPlay
                  muted
                  loop
                  playsInline
                  disablePictureInPicture
                  disableRemotePlayback
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ 
                    display: mainVideoLoaded ? 'block' : 'none',
                    WebkitPlaysinline: true
                  }}
                  onLoadedData={() => {
                    setMainVideoLoaded(true);
                    setMainVideoError(false);
                  }}
                  onError={() => {
                    setMainVideoError(true);
                  }}
                  onCanPlay={() => setMainVideoLoaded(true)}
                  onContextMenu={(e) => e.preventDefault()}
                  controlsList="nodownload nofullscreen noremoteplaybook"
                  webkit-playsinline="true"
                  x5-playsinline="true"
                  x5-video-player-type="h5"
                  x5-video-player-fullscreen="true"
                >
                  <source src={getCloudinaryVideoUrl('gymtonic', { 
                    quality: 'auto:good',
                    format: 'auto'
                  })} type="video/mp4" />
                </video>
              ) : null}
              {/* Show fallback image only while video is loading or during retry */}
              {(!mainVideoLoaded || mainVideoError) && (
                <img
                  src="/Picture3.png"
                  alt="Gym workout"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* GET STARTED Label with floating animation */}

              <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full pt-15 md:pt-5">
                <div className="w-full max-w-full flex flex-col items-center justify-center">
                  <h2 className={`
                    text-fluid-lg font-bold tracking-wider text-white drop-shadow-lg transition-all duration-1000
                    w-full max-w-full text-center
                    ${hasAnimationStarted ? 'animate-floatOnce' : 'opacity-0 translate-y-8'}
                  `}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {t('herosection.getStarted')}
                  </h2>
                  <p className={`
                    text-fluid-base font-medium text-white/90 drop-shadow-md transition-all duration-1000 delay-700
                    w-full max-w-full text-center
                    ${hasAnimationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}
                    style={{ wordBreak: 'break-word' }}
                  >
                    {t('herosection.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Circle Buttons - Below video, above GymBros */}
 <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-50">
           <div className={`py-6 px-4 relative z-5 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
    <div className="flex justify-center items-center gap-5 sm:gap-6 md:gap-8 lg:gap-6 flex-wrap max-w-lg mx-auto">
      <button
        onClick={() => navigateToSection(1)}
        className={`relative rounded-full transition-all duration-500 flex flex-col items-center justify-center group shadow-lg transform ${
          hasAnimationStarted
            ? 'animate-slideDownFromVideo'
            : 'opacity-0 invisible pointer-events-none'
        } ${
          darkMode
            ? 'bg-gray-800 text-white border border-white/30'
            : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900 border border-black/50 shadow-xl'
        }`}
        style={{
         width: 'clamp(0.75rem, 8vw, 3rem)',
          height: 'clamp(0.75rem, 8vw, 3rem)',
          animationDelay: hasAnimationStarted ? '0.2s' : '0s',
          animationFillMode: 'both'
        }}
      >
        <ShoppingBag style={{ width: 'clamp(0.4rem, 3vw, 1.5rem)', height: 'clamp(0.75rem, 3vw, 1.2rem)' }} />
        <span className={`absolute -bottom-5 text-xs font-medium transition-all duration-500 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{t('herosection.shop')}</span>
      </button>
      <button
        onClick={() => navigateToSection(2)}
        className={`relative rounded-full transition-all duration-500 flex flex-col items-center justify-center group shadow-lg transform ${
          hasAnimationStarted
            ? 'animate-slideDownFromVideo'
            : 'opacity-0 invisible pointer-events-none'
        } ${
          darkMode
            ? 'bg-gray-800 text-white border border-white/30'
            : 'bg-gradient-to-br from-yellow-50 via-white to-orange-50 text-gray-900 border border-black/50 shadow-xl'
        }`}
        style={{
           width: 'clamp(0.75rem, 8vw, 3rem)',
          height: 'clamp(0.75rem, 8vw, 3rem)',
          animationDelay: hasAnimationStarted ? '0.4s' : '0s',
          animationFillMode: 'both'
        }}
      >
        <Trophy style={{ width: 'clamp(0.4rem, 3vw, 1.5rem)', height: 'clamp(0.75rem, 3vw, 1.2rem)' }} />
        <span className={`absolute -bottom-5 text-xs font-medium transition-all duration-500 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{t('herosection.coaching')}</span>
      </button>
      <button
        onClick={() => navigateToSection(3)}
        className={`relative rounded-full transition-all duration-500 flex flex-col items-center justify-center group shadow-lg transform ${
          hasAnimationStarted
            ? 'animate-slideDownFromVideo'
            : 'opacity-0 invisible pointer-events-none'
        } ${
          darkMode
            ? 'bg-gray-800 text-white border border-white/30'
            : 'bg-gradient-to-br from-green-50 via-white to-emerald-50 text-gray-900 border border-black/50 shadow-xl'
        }`}
        style={{
         width: 'clamp(0.75rem, 8vw, 3rem)',
          height: 'clamp(0.75rem, 8vw, 3rem)',
          animationDelay: hasAnimationStarted ? '0.6s' : '0s',
          animationFillMode: 'both'
        }}
      >
        <Users style={{ width: 'clamp(0.4rem, 3vw, 1.5rem)', height: 'clamp(0.75rem, 3vw, 1.2rem)' }} />
        <span className={`absolute -bottom-5 text-xs font-medium transition-all duration-500 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{t('herosection.gains')}</span>
      </button>
      <button
        onClick={() => navigateToSection(4)}
        className={`relative rounded-full transition-all duration-500 flex flex-col items-center justify-center group shadow-lg transform ${
          hasAnimationStarted
            ? 'animate-slideDownFromVideo'
            : 'opacity-0 invisible pointer-events-none'
        } ${
          darkMode
            ? 'bg-gray-800 text-white border border-white/30'
            : 'bg-gradient-to-br from-purple-50 via-white to-pink-50 text-gray-900 border border-black/50 shadow-xl'
        }`}
        style={{
         width: 'clamp(0.75rem, 8vw, 3rem)',
          height: 'clamp(0.75rem, 8vw, 3rem)',
          animationDelay: hasAnimationStarted ? '0.8s' : '0s',
          animationFillMode: 'both'
        }}
      >
        <Gamepad2 style={{ width: 'clamp(0.4rem, 3vw, 1.5rem)', height: 'clamp(0.75rem, 3vw, 1.2rem)' }} />
        <span className={`absolute -bottom-5 text-xs font-medium transition-all duration-500 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{t('herosection.games')}</span>
      </button>
    </div>
 </div>
          
          {/* Section 2: Featured Products and GymBros - Reduced padding since buttons take space */}
 
<div
            className={`flex-1 flex flex-col items-center justify-start px-3 sm:px-4 lg:px-8 pt-6 sm:pt-8 lg:pt-6 pb-10 sm:pb-16 ${darkMode ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-white/5' : 'bg-gradient-to-b from-white via-white to-black/5'}`}
            style={{
              minHeight: 'clamp(400px, 55vh, 900px)',
              maxHeight: 'clamp(500px, 70vh, 1100px)',
              height: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden', // Changed from 'visible' to 'hidden'
              contain: 'layout size style' // Added containment
            }}
          >
            <div
              className="w-full max-w-4xl mx-auto h-full flex flex-col justify-start overflow-hidden" // Added overflow-hidden
              style={{
                minHeight: '0',
                maxHeight: '93%',
                height: '100%',
                contain: 'layout size' // Added containment
              }}
            >
              {/* GymBros header - label and match count */}
              <div className="w-full text-left mb-2 sm:mb-3 flex-shrink-0"> {/* Added flex-shrink-0 */}
                <div className="flex items-center justify-start gap-2">
                  <h3 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('herosection.gymbros')}
                  </h3>
                  {gymBrosData?.hasProfile && gymBrosData?.recentMatches?.length > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                      {gymBrosData.recentMatches.length}
                    </span>
                  )}
                </div>
              </div>
              {/* All screen sizes: Stacked vertically */}
              <div
                className="flex flex-col w-full sm:max-w-none flex-1 gap-4 min-h-0 overflow-hidden" // Added min-h-0 and overflow-hidden
                style={{
                  height: '100%',
                  minHeight: 0,
                  maxHeight: '100%',
                  contain: 'layout size'
                }}
              >
                {/* GymBros Section - Card Design - Increased size for PC */}
                <div
                  className={`flex flex-col min-h-0 transition-all duration-800 box-border px-2 overflow-hidden ${
                    hasAnimationStarted
                      ? 'animate-floatUpSection'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    animationDelay: hasAnimationStarted ? '0.3s' : '0s',
                    animationFillMode: 'both',
                    flexBasis: 'clamp(30%, 45%, 50%)', // Responsive from 30% mobile to 50% desktop
                    flexGrow: 0,
                    flexShrink: 1,
                    minHeight: 0,
                    maxHeight: 'clamp(30%, 45%, 50%)', // Responsive max height
                    position: 'relative',
                    contain: 'layout size'
                  }}
                >

                  {gymBrosLoading ? (
                    <div className={`flex-1 rounded-2xl p-4 pt-12 flex items-center justify-center shadow-xl border-2 relative overflow-hidden ${darkMode ? 'border-white/30' : 'border-black/30'}`}>
                      {/* Animated, vibrant gradient background for loading state */}
                      <div className={`absolute inset-0 w-full h-full animate-gradient-move opacity-80 blur-[2px] pointer-events-none z-0 ${darkMode
                        ? 'bg-[conic-gradient(at_top_left,_#7c3aed_0%,_#06b6d4_25%,_#f59e42_50%,_#f43f5e_75%,_#7c3aed_100%)]'
                        : 'bg-[conic-gradient(at_top_left,_#f472b6_0%,_#60a5fa_25%,_#34d399_50%,_#fbbf24_75%,_#f472b6_100%)]'}`}></div>
                      <div className={`animate-spin rounded-full h-6 w-6 border-b-2 relative z-10 ${darkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                      <style>{`
                        @keyframes gradient-move {
                          0% { background-position: 0% 50%; }
                          50% { background-position: 100% 50%; }
                          100% { background-position: 0% 50%; }
                        }
                        .animate-gradient-move {
                          background-size: 200% 200%;
                          animation: gradient-move 8s ease-in-out infinite;
                        }
                      `}</style>
                    </div>                  ) : gymBrosData?.hasProfile ? (
                    <div className={`flex-1 rounded-2xl px-2 ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} p-3 sm:p-4 mt-1 flex flex-col shadow-2xl border-2 ${darkMode ? 'border-blue-500/30 hover:border-purple-500/50' : 'border-blue-300/50 hover:border-purple-400/70'} relative overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-[1.01] lg:hover:scale-100 group`}>
                        {/* Subtle inner glow */}
                      <div className={`absolute inset-0 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10' : 'bg-gradient-to-br from-blue-400/15 via-purple-400/10 to-indigo-400/15'} opacity-60 group-hover:opacity-80 transition-all duration-500`}></div>
                      {gymBrosData.recentMatches && gymBrosData.recentMatches.length > 0 ? (
                        <div className="flex-1 flex flex-col h-full relative z-10">
                          {/* Card Carousel */}
                          <div className="relative overflow-visible z-50 flex-1 h-full">
                            <div
                              ref={setGymBrosCarouselRef}
                              className="overflow-x-auto overflow-y-visible flex flex-row gap-2 snap-x snap-mandatory scrollbar-hide relative z-50 h-full items-stretch touch-pan-x transition-all duration-300"
                              style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch',
                                scrollBehavior: 'smooth',
                                scrollSnapType: 'x mandatory'
                              }}
                            >
                              {gymBrosData.recentMatches.map((match, index) => (
                                <div
                                  key={match._id || index}
                                  className="flex-shrink-0 snap-start cursor-pointer group relative z-50 h-full flex items-center"
                                  onClick={() => window.location.href = '/gymbros'}
                                  style={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    aspectRatio: '7 / 10',
                                    minHeight: '80px',
                                    minWidth: '56px',
                                    maxHeight: '100%',
                                    maxWidth: 'calc(100% * 0.7)',
                                  }}
                                >
                                  <div
                                    className="relative overflow-visible rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/30 group-hover:brightness-125 group-hover:z-[9999] group-hover:scale-105"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      aspectRatio: '7 / 10',
                                      minWidth: '56px',
                                      minHeight: '80px',
                                      maxHeight: '100%',
                                      maxWidth: '100%',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'flex-end'
                                    }}
                                  >
                                    <div
                                      style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        aspectRatio: '7 / 10',
                                        minWidth: '56px',
                                        minHeight: '80px',
                                        maxHeight: '100%',
                                        maxWidth: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                      }}
                                    >
                                      <img
                                        src={formatImageUrl(match.profileImage, getFallbackAvatarUrl())}
                                        alt={match.name || 'Match'}
                                        className="w-full h-full object-cover transition-transform duration-300 rounded-lg"
                                        crossOrigin="anonymous"
                                        style={{
                                          aspectRatio: '7 / 10',
                                          width: '100%',
                                          height: '100%',
                                          minWidth: '56px',
                                          minHeight: '80px',
                                          maxHeight: '100%',
                                          maxWidth: '100%',
                                          objectFit: 'cover',
                                          display: 'block'
                                        }}
                                        onError={(e) => {
                                          console.error('❌ Image load error for match:', match.name, e.target.src);
                                          e.target.onerror = null;
                                          e.target.src = getFallbackAvatarUrl();
                                        }}
                                      />

                                      {/* Online status indicator */}
                                      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                                        darkMode ? 'bg-green-500' : 'bg-green-500'
                                      } shadow-lg pulse border border-white`}></div>

                                      {/* Name overlay at bottom */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 transition-all duration-300 group-hover:p-2 rounded-b-lg">
                                        <p className={`text-xs font-semibold text-white truncate transform transition-all duration-300 origin-bottom-left group-hover:scale-110 group-hover:text-blue-200`}>
                                          {(match.name || 'Unknown').split(' ')[0]}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Carousel Navigation Controls - Only show if more than 2 matches */}
                            {gymBrosData.recentMatches.length > 2 && (
                              <div className="flex justify-center gap-2 mt-1">
                                <button
                                  className={`p-1.5 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'} shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95`}
                                  onClick={scrollGymBrosLeft}
                                  aria-label="Scroll left"
                                >
                                  <ChevronLeft className="w-3 h-3 transition-transform duration-200" />
                                </button>
                                <button
                                  className={`p-1.5 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'} shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95`}
                                  onClick={scrollGymBrosRight}
                                  aria-label="Scroll right"
                                >
                                  <ChevronRight className="w-3 h-3 transition-transform duration-200" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-2 sm:py-3 relative z-10">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'} flex items-center justify-center mb-2 shadow-lg`}>
                            <UserPlus className={`w-5 h-5 sm:w-6 sm:h-6 text-white`} />
                          </div>
                          <p className={`text-xs sm:text-sm font-medium text-center mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            No connections yet
                          </p>
                          <button
                            onClick={() => window.location.href = '/gymbros'}
                            className={`text-sm py-2 px-4 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'}`}>
                            Find Partners
                          </button>
                        </div>
                      )}
                    </div>                  ) : (
  <div 
    className="flex-1 rounded-2xl p-3 sm:p-4 mt-1 flex flex-col shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.009] group cursor-pointer"
    style={{
      background: darkMode 
        ? 'linear-gradient(135deg, #1e293b 0%, #334155 20%, #475569 40%, #64748b 60%, #374151 80%, #1f2937 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 60%, #64748b 80%, #475569 100%)',
      borderColor: 'transparent'
    }}
    onClick={(e) => {
      // Don't redirect if clicking on the info button, dialog content, or any interactive elements
      if (!e.target.closest('[data-dialog-trigger]') && 
          !e.target.closest('[data-radix-dialog-content]') &&
          !e.target.closest('[data-radix-dialog-overlay]') &&
          !e.target.closest('button') &&
          !e.target.closest('[role="dialog"]')) {
        window.location.href = '/gymbros';
      }
    }}
  >
    
    {/* Subtle floating bubbles - reduced opacity and professional colors */}
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <div className="absolute opacity-8 animate-float-1 w-4 h-4 bg-slate-300/20 rounded-full blur-sm" style={{ top: '15%', left: '5%' }} />
      <div className="absolute opacity-6 animate-float-2 w-3 h-3 bg-slate-400/15 rounded-full blur-sm" style={{ top: '70%', left: '85%' }} />
      <div className="absolute opacity-10 animate-float-3 w-3.5 h-3.5 bg-slate-200/25 rounded-full blur-sm" style={{ top: '85%', left: '15%' }} />
      <div className="absolute opacity-8 animate-float-4 w-2.5 h-2.5 bg-slate-300/20 rounded-full blur-sm" style={{ top: '35%', left: '75%' }} />
      
      {/* Additional professional floating elements */}
      <div className="absolute opacity-12 animate-float-1 w-3 h-3 bg-blue-gray-400/25 rounded-full blur-sm" style={{ top: '25%', left: '90%', animationDelay: '0.5s' }} />
      <div className="absolute opacity-10 animate-float-2 w-2 h-2 bg-slate-500/20 rounded-full blur-sm" style={{ top: '60%', left: '10%', animationDelay: '1s' }} />
      <div className="absolute opacity-14 animate-float-3 w-4 h-4 bg-gray-400/30 rounded-full blur-sm" style={{ top: '5%', left: '60%', animationDelay: '1.5s' }} />
      <div className="absolute opacity-11 animate-float-4 w-2.5 h-2.5 bg-slate-400/25 rounded-full blur-sm" style={{ top: '95%', left: '70%', animationDelay: '2s' }} />
      
      <div className="absolute opacity-13 animate-float-1 w-3.5 h-3.5 bg-blue-gray-300/28 rounded-full blur-sm" style={{ top: '45%', left: '3%', animationDelay: '2.5s' }} />
      <div className="absolute opacity-9 animate-float-2 w-2 h-2 bg-slate-600/22 rounded-full blur-sm" style={{ top: '80%', left: '50%', animationDelay: '3s' }} />
      <div className="absolute opacity-11 animate-float-3 w-4.5 h-4.5 bg-gray-500/26 rounded-full blur-sm" style={{ top: '10%', left: '30%', animationDelay: '3.5s' }} />
      <div className="absolute opacity-7 animate-float-4 w-2.5 h-2.5 bg-slate-400/22 rounded-full blur-sm" style={{ top: '55%', left: '95%', animationDelay: '4s' }} />
    </div>

    {/* Info Button - Enhanced with professional styling */}
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className="absolute top-2 right-2 z-20 p-2 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm hover:shadow-xl transform hover:rotate-12 group-hover:animate-bounce-subtle"
          data-dialog-trigger="true"
          style={{
            background: darkMode 
              ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.8), rgba(100, 116, 139, 0.8), rgba(148, 163, 184, 0.6))'
              : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8), rgba(71, 85, 105, 0.6))',
            boxShadow: darkMode 
              ? '0 0 20px rgba(100, 116, 139, 0.5), 0 0 40px rgba(148, 163, 184, 0.3)'
              : '0 0 20px rgba(30, 41, 59, 0.5), 0 0 40px rgba(51, 65, 85, 0.3)'
          }}
          title="What is GymBros?"
        >
          <Info className="w-4 h-4 text-white drop-shadow-lg" />
        </button>
      </DialogTrigger>
      
      <DialogContent 
        className="max-w-lg shadow-2xl backdrop-blur-sm sm:top-1/2 top-[55%] sm:translate-y-[-50%] translate-y-[-50%] border-2"
        data-radix-dialog-content="true"
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 20%, #475569 40%, #64748b 60%, #374151 80%, #1f2937 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 60%, #64748b 80%, #475569 100%)',
          borderImage: darkMode 
            ? 'linear-gradient(135deg, #64748b, #94a3b8, #cbd5e1) 1'
            : 'linear-gradient(135deg, #475569, #64748b, #94a3b8) 1',
          borderColor: 'transparent'
        }}>
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold animate-shimmer"
                       style={{
                         background: darkMode 
                           ? 'linear-gradient(135deg, #e2e8f0, #cbd5e1, #94a3b8)'
                           : 'linear-gradient(135deg, #1e293b, #334155, #475569)',
                         backgroundClip: 'text',
                         WebkitBackgroundClip: 'text',
                         color: 'transparent'
                       }}>
            🏋️ GymBros Network
          </DialogTitle>
          <DialogDescription className={`text-base mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
            Your fitness community awaits! Connect, train, and grow together.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            <div className="p-4 rounded-xl backdrop-blur-sm border animate-glow-border"
                 style={{
                   background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2), rgba(249, 115, 22, 0.1))',
                   borderImage: 'linear-gradient(135deg, #60a5fa, #a855f7, #f97316) 1'
                 }}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg animate-pulse-ring"
                     style={{
                       background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #f97316)',
                       boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
                     }}>
                  <Dumbbell className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 animate-fade-in-up">
                  {t('gymBrosNetwork.findYourFitnessFamily')}
                </h3>
                <p className="text-sm text-gray-200">
                  {t('gymBrosNetwork.connectWithEnthusiasts')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 animate-slide-in-left">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse-glow"
                     style={{
                       background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                       boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                     }}>
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base text-white">
                    {t('gymBrosNetwork.buildYourNetwork')}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {t('gymBrosNetwork.discoverLikeMinded')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 animate-slide-in-right">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse-glow"
                     style={{
                       background: 'linear-gradient(135deg, #ea580c, #dc2626)',
                       boxShadow: '0 0 20px rgba(234, 88, 12, 0.4)'
                     }}>
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base text-white">
                    {t('gymBrosNetwork.achieveGoalsTogether')}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {t('gymBrosNetwork.partnerUpWithBuddies')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 animate-slide-in-left">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse-glow"
                     style={{
                       background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                       boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
                     }}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base text-white">
                    {t('gymBrosNetwork.shareAndSupport')}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {t('gymBrosNetwork.exchangeTipsCelebrateVictories')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl text-center animate-glow-border"
                 style={{
                   background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3), rgba(139, 92, 246, 0.3), rgba(249, 115, 22, 0.2))',
                   borderImage: 'linear-gradient(135deg, #4f46e5, #a855f7, #f97316) 1'
                 }}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center animate-spin-slow"
                     style={{
                       background: 'linear-gradient(135deg, #4f46e5, #8b5cf6, #f97316)'
                     }}>
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-orange-200 animate-pulse">
                  {t('gymBrosNetwork.readyToLevelUp')}
                </span>
              </div>
              <p className="text-sm text-blue-200 mb-4">
                {t('gymBrosNetwork.joinThousandsOfEnthusiasts')}
              </p>
              <button
                onClick={() => {
                  window.location.href = '/gymbros';
                }}
                className="w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 transform animate-rainbow-border hover:animate-bounce-subtle"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #8b5cf6, #f97316)',
                  boxShadow: '0 0 30px rgba(79, 70, 229, 0.5), 0 0 60px rgba(139, 92, 246, 0.3), 0 0 90px rgba(249, 115, 22, 0.2)'
                }}
              >
                {t('gymBrosNetwork.startYourJourney')} 🚀
              </button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>

    {/* Main Content - Enhanced Onboarding Experience */}
    <div className="flex flex-col h-full py-1 sm:py-2 relative z-10">
      {/* Title: Swipe and Thrive! */}
      <div className="text-center mb-2">
        <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-600'}`}
            style={{
              fontSize: 'clamp(10px, 2vw, 18px)'
            }}>
          ✨ Swipe and Thrive! ✨
        </h4>
      </div>
      
      {/* Middle: Mini swipeable cards preview (blurred for anonymity) */}
      <div className="flex-1 flex items-center justify-center mb-2">
        
        <div className="flex gap-1 items-center justify-center perspective-1000" style={{ height: '100%' }}>
          {/* Sample preview cards - blurred for anonymity - responsive sizing */}
          {[
            { name: 'Alex', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&crop=face' },
            { name: 'Sarah', image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=600&fit=crop&crop=face' },
            { name: 'Mike', image: 'https://images.unsplash.com/photo-1583341612074-ccea5cd64f6a?w=400&h=600&fit=crop&crop=face' },
            { name: 'Emma', image: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=400&h=600&fit=crop&crop=face' }
          ].map((user, index) => (
            <div
              key={index}
              className={`relative rounded-lg overflow-hidden transition-all duration-500 hover:scale-105 animate-slide-in-stagger group-hover:animate-subtle-sway`}
              style={{
                // Height-based responsive sizing optimized for high-resolution PC screens
                height: 'clamp(24px, 65%, 64px)',          // Increased from 60% to 65% and max from 48px to 64px
                width: 'auto',                             // Auto width based on aspect ratio
                aspectRatio: '3 / 4',                      // Maintain card aspect ratio (closer to original 24x32)
                minWidth: '18px',                          // Minimum width for very small containers
                maxWidth: 'clamp(36px, 10vw, 56px)',       // Increased max width for high-res screens: 36px->56px
                transform: `translateX(${index * -8}px) rotateY(${index * 5}deg) rotateZ(${(index % 2) * 3 - 1.5}deg)`,
                zIndex: 4 - index,
                animationDelay: `${index * 0.1}s`,
                filter: 'blur(2px)',                       // Anonymizing blur
                opacity: 0.9 - (index * 0.1)
              }}
            >
              <img
                src={user.image}
                alt="Preview"
                className="w-full h-full object-cover"
                style={{
                  filter: 'blur(1px) brightness(1.1)', // Additional blur for anonymity
                }}
              />
              {/* Subtle overlay to enhance anonymity */}
              <div className="absolute inset-0 bg-white/10"></div>
              
              {/* Online indicator - responsive sizing */}
              <div 
                className="absolute bg-green-400 rounded-full animate-pulse shadow-sm"
                style={{
                  top: 'clamp(1px, 2%, 3px)',
                  right: 'clamp(1px, 2%, 3px)',
                  width: 'clamp(4px, 15%, 10px)',           // Increased responsive indicator size
                  height: 'clamp(4px, 15%, 10px)'
                }}
              ></div>
            </div>
          ))}
          
          {/* Swipe indicator - responsive sizing */}
          <div className="ml-2 flex items-center">
            <div 
              className="bg-white/60 rounded-full animate-pulse"
              style={{
                width: 'clamp(12px, 25%, 28px)',          // Increased responsive swipe line width
                height: 'clamp(1.5px, 3%, 4px)'           // Increased responsive swipe line height
              }}
            ></div>
            <div 
              className="text-white/80 ml-1 animate-bounce-subtle"
              style={{
                fontSize: 'clamp(8px, 1.5vw, 18px)'       // Increased responsive arrow font size
              }}
            >→</div>
          </div>
        </div>
      </div>

      {/* Bottom: Animated CTA with countdown feel */}
      <div className="text-center">
        <button
          onClick={() => window.location.href = '/gymbros'}
          className="relative rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 transform animate-rainbow-border hover:animate-bounce-subtle overflow-hidden group-hover:shadow-2xl"
          style={{
            background: darkMode 
              ? 'linear-gradient(135deg, #475569, #64748b, #94a3b8)'
              : 'linear-gradient(135deg, #1e293b, #334155, #475569)',
            boxShadow: darkMode 
              ? '0 0 20px rgba(71, 85, 105, 0.5), 0 0 40px rgba(100, 116, 139, 0.3)'
              : '0 0 20px rgba(30, 41, 59, 0.5), 0 0 40px rgba(51, 65, 85, 0.3)',
            // Responsive padding and font size - smaller for low-resolution PCs
            padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)',
            fontSize: 'clamp(9px, 1.2vw, 12px)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative flex items-center justify-center gap-2"
                style={{
                  textShadow: darkMode 
                    ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                    : '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                }}>
            <span className="animate-pulse">⚡</span>
            Swipe Nearby Fit Fanatics
            <span className="animate-pulse">⚡</span>
          </span>
        </button>
        {/* Additional micro-copy */}
        <p className="mt-1 animate-fade-in-delayed"
           style={{
             fontSize: 'clamp(8px, 1vw, 11px)',           // Responsive micro-copy text size
             color: darkMode ? 'rgba(226, 232, 240, 0.7)' : 'rgba(30, 41, 59, 0.7)'
           }}>
          Join thousands finding their perfect workout partner
        </p>
      </div>
    </div>

    {/* CSS Animations */}
    <style jsx>{`
      @keyframes float-1 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        33% { transform: translateY(-8px) translateX(3px); }
        66% { transform: translateY(4px) translateX(-2px); }
      }
      
      @keyframes float-2 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        25% { transform: translateY(6px) translateX(-4px); }
        75% { transform: translateY(-4px) translateX(3px); }
      }
      
      @keyframes float-3 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        50% { transform: translateY(-8px) translateX(5px); }
      }
      
      @keyframes float-4 {
        0%, 100% { transform: translateY(0px) translateX(0px); }
        40% { transform: translateY(4px) translateX(-3px); }
        80% { transform: translateY(-6px) translateX(4px); }
      }
      
      @keyframes slide-in-stagger {
        0% { opacity: 0; transform: translateY(10px) scale(0.8); }
        100% { opacity: 0.9; transform: translateY(0) scale(1); }
      }
      
      @keyframes subtle-sway {
        0%, 100% { transform: translateX(0) rotateZ(0deg); }
        25% { transform: translateX(1px) rotateZ(1deg); }
        75% { transform: translateX(-1px) rotateZ(-1deg); }
      }
      
      @keyframes counter {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); color: #fbbf24; }
        100% { transform: scale(1); }
      }
      
      @keyframes fade-in-delayed {
        0% { opacity: 0; transform: translateY(5px); }
        100% { opacity: 0.7; transform: translateY(0); }
      }
      
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      
      @keyframes pulse-ring {
        0% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.6), 0 0 50px rgba(139, 92, 246, 0.4); }
        50% { box-shadow: 0 0 35px rgba(59, 130, 246, 0.8), 0 0 70px rgba(139, 92, 246, 0.6), 0 0 100px rgba(249, 115, 22, 0.3); }
        100% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.6), 0 0 50px rgba(139, 92, 246, 0.4); }
      }
      
      @keyframes glow-border {
        0%, 100% { border-color: rgba(59, 130, 246, 0.5); }
        33% { border-color: rgba(139, 92, 246, 0.7); }
        66% { border-color: rgba(249, 115, 22, 0.6); }
      }
      
      @keyframes rainbow-border {
        0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3); }
        50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.7), 0 0 60px rgba(249, 115, 22, 0.5); }
        100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.6), 0 0 40px rgba(59, 130, 246, 0.4); }
      }
      
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes bounce-subtle {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      
      @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slide-in-left {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes slide-in-right {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      .perspective-1000 { perspective: 1000px; }
      .animate-float-1 { animation: float-1 4s ease-in-out infinite; }
      .animate-float-2 { animation: float-2 5s ease-in-out infinite; }
      .animate-float-3 { animation: float-3 4.5s ease-in-out infinite; }
      .animate-float-4 { animation: float-4 3.5s ease-in-out infinite; }
      .animate-slide-in-stagger { animation: slide-in-stagger 0.6s ease-out forwards; }
      .animate-subtle-sway { animation: subtle-sway 3s ease-in-out infinite; }
      .animate-counter { animation: counter 2s ease-in-out infinite; }
      .animate-fade-in-delayed { 
        animation: fade-in-delayed 1s ease-out 0.5s forwards;
        opacity: 0;
      }
      .animate-shimmer { 
        background-size: 200% auto;
        animation: shimmer 3s linear infinite; 
      }
      .animate-pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
      .animate-glow-border { animation: glow-border 3s ease-in-out infinite; }
      .animate-rainbow-border { animation: rainbow-border 2s ease-in-out infinite; }
      .animate-spin-slow { animation: spin-slow 3s linear infinite; }
      .animate-bounce-subtle { animation: bounce-subtle 1s ease-in-out infinite; }
      .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
      .animate-slide-in-left { animation: slide-in-left 0.6s ease-out; }
      .animate-slide-in-right { animation: slide-in-right 0.6s ease-out; }
    `}</style>
  </div>
)}
                </div>
               
{/* Featured Products Section - Reduced to accommodate larger GymBros */}
<div
  className={`space-y-2 sm:space-y-3 flex flex-col min-h-0 transition-all duration-800 ${
    hasAnimationStarted
      ? 'animate-floatUpSection'
      : 'opacity-0 translate-y-8'
  }`}
  style={{
    animationDelay: hasAnimationStarted ? '0.5s' : '0s',
    animationFillMode: 'both',
    flexBasis: 'clamp(50%, 55%, 70%)', // Responsive from 50% mobile to 70% desktop
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    maxHeight: '100%',
    overflow: 'visible',
    zIndex: 1
  }}
>
  {/* Add margin-top for small screens */}
  <div className="flex items-center justify-start sm:gap-2 mb-1 sm:mb-2 mt-3 lg:mt-2 sm:mt-0">
    <h3 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {t('herosection.featuredProducts')}
    </h3>
    <button
      onClick={() => window.location.href = '/shop'}
      className={`p-1 rounded-full hover:scale-110 transition-all duration-300 ${
        darkMode
          ? 'text-blue-400 hover:text-blue-300'
          : 'text-blue-600 hover:text-blue-500'
      }`}
      title={t('herosection.goToShop')}
    >
      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
    </button>
  </div>
  {/* Featured products content fills the rest */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {productsLoading ? (
      <div className={`flex-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4 sm:p-6 flex items-center justify-center shadow-lg border-2 ${darkMode ? 'border-white/30' : 'border-black/30'} relative overflow-hidden`}>
        <div className={`absolute inset-0 rounded-xl ${darkMode ? 'bg-gradient-to-br from-green-500/5 to-blue-500/5' : 'bg-gradient-to-br from-green-500/10 to-blue-500/10'}`}></div>
        <div className={`animate-spin rounded-full h-6 w-6 border-b-2 relative z-10 ${
          darkMode ? 'border-blue-400' : 'border-blue-600'
        }`}></div>
      </div>
    ) : featuredProducts.length > 0 ? (
// Replace the featured products container section with this:

<div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0" style={{ contain: 'layout size' }}>
  <div 
    className="flex flex-row gap-4 h-full p-2 pt-0" 
    style={{ 
      height: 'calc(100% - 8px)',
      // Dynamic width calculation - let cards size themselves based on available height
      minWidth: '100%',
      width: 'max-content'               // Let content determine width
    }}
  >
{featuredProducts.map((product) => {
  const price = getPriceDisplay(product);
  const isOutOfStock = product.stockQuantity === 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  return (
    <div
      key={product.id}
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden`}
      onClick={() => navigate(`/product/${product.id}`)}
      style={{
        // Height-based responsive sizing
        flex: '0 0 auto',
        height: '100%',                    // Take full container height
        width: 'auto',                     // Auto width based on aspect ratio
        aspectRatio: '7 / 10',             // Maintain card aspect ratio
        minWidth: '100px',                 // Minimum width for very small containers
        maxWidth: '200px',                 // Maximum width for very large containers
        minHeight: '120px',                // Minimum height
        contain: 'layout size strict',
        position: 'relative',
        // iOS Safari specific
        WebkitFlexShrink: 0,
        WebkitFlexGrow: 0,
      }}
    >
      {/* Image container - Percentage-based height */}
      <div 
        className="relative overflow-hidden bg-gray-50 dark:bg-gray-800 flex-shrink-0 w-full rounded-t-xl"
        style={{ 
          height: '60%',                   // Use percentage of card height
          width: '100%',
          contain: 'layout size strict',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => { e.target.src = '/Picture3.png'; }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            // iOS specific fixes
            WebkitTransform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        />
        
        {/* Status badges - adjusted for smaller card */}
        <div className="absolute top-1 left-1 flex flex-col gap-1 z-10" style={{ maxWidth: '70%' }}>
          {isOutOfStock && (
            <span className="px-1 py-0.5 text-xs rounded-full bg-gray-800 text-white font-bold shadow text-center" style={{ fontSize: '9px' }}>
              {t('herosection.outOfStock')}
            </span>
          )}
          {product.preOrder && (
            <span className="px-1 py-0.5 text-xs rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-900 font-bold border border-amber-900 shadow text-center" style={{ fontSize: '9px' }}>
              {t('herosection.preOrder')}
            </span>
          )}
          {lowStock && (
            <button
              className="px-1 py-0.5 text-xs rounded-full bg-red-500 text-white font-bold shadow border border-red-700 animate-pulse text-center"
              style={{
                fontSize: '8px',
                animation: 'heartbeat 1.5s ease-in-out infinite',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                borderColor: '#991b1b',
              }}
              disabled
            >
              {product.stockQuantity} left
            </button>
          )}
        </div>
      </div>
      
      {/* Content container - Percentage-based height */}
      <div 
        className="flex flex-col p-2 overflow-hidden relative"
        style={{ 
          height: '40%',                   // Use percentage of card height (100% - 60% image)
          contain: 'layout size strict',
          position: 'relative'
        }}
      >
        {/* Product name - responsive font sizing */}
        <h4
          className={`font-semibold leading-tight ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            fontSize: 'clamp(10px, 1.2vw, 14px)',    // Responsive font size
            lineHeight: '1.1',
            maxHeight: '2.2em',                      // 2 lines max
            marginBottom: '4px',
            flex: '1 1 auto'
          }}
          title={product.name}
        >
          {product.name}
        </h4>
        
        {/* Price section - responsive positioning */}
        <div 
          className="flex items-center justify-end mt-auto"
          style={{ 
            height: 'auto',                          // Auto height
            minHeight: '16px',                       // Minimum height
            flexShrink: 0,
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            left: '6px'
          }}
        >
          {price.discounted ? (
            <div className="flex items-center gap-1 justify-end w-full">
              <span 
                className="font-bold text-red-600 dark:text-red-400"
                style={{ 
                  fontSize: 'clamp(10px, 1.1vw, 13px)',  // Responsive font
                  lineHeight: '1.1',
                  whiteSpace: 'nowrap'
                }}
              >
                {price.discounted}
              </span>
              <span 
                className="text-gray-400 dark:text-gray-500 line-through"
                style={{ 
                  fontSize: 'clamp(8px, 0.9vw, 11px)',   // Responsive font
                  lineHeight: '1.1',
                  whiteSpace: 'nowrap'
                }}
              >
                {price.original}
              </span>
            </div>
          ) : (
            <span 
              className="font-bold text-gray-900 dark:text-white w-full text-right"
              style={{ 
                fontSize: 'clamp(10px, 1.1vw, 13px)',    // Responsive font
                lineHeight: '1.1',
                whiteSpace: 'nowrap'
              }}
            >
              {price.original}
            </span>
          )}
        </div>
      </div>
    </div>
  );
})}
  </div>
</div>
    ) : (
      <div className={`flex-1 rounded-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} p-4 sm:p-6 text-center flex flex-col items-center justify-center shadow-2xl min-h-[190px] border-2 ${darkMode ? 'border-gray-600/30 hover:border-gray-500/50' : 'border-gray-300/50 hover:border-gray-400/70'} relative overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group`}>
        <div className={`absolute inset-0 rounded-xl ${darkMode ? 'bg-gradient-to-br from-gray-600/10 via-gray-500/5 to-gray-700/10' : 'bg-gradient-to-br from-gray-400/15 via-gray-300/10 to-gray-500/15'} opacity-60 group-hover:opacity-80 transition-all duration-500`}></div>
        <XCircle className={`w-12 h-12 mb-3 relative z-10 ${darkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-500'} transition-all duration-300`} />
        <p className={`text-sm sm:text-base relative z-10 ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} transition-all duration-300`}>
          {t('herosection.noFeatured')}
        </p>
      </div>
    )}
  </div>
</div>
            </div>
          </div>
         </div>
</div>
        </div>
        </div>
      </div>
      </div>
  );
};

export default HeroSection;