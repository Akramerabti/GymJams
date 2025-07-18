import React, { useState, useEffect } from 'react';
import { ShoppingBag, Users, Gamepad2, Trophy, ChevronLeft, ChevronRight, MessageCircle, ArrowRight, XCircle, Info, UserPlus, Dumbbell, Target } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import productService from '../../services/product.service';
import gymBrosService from '../../services/gymbros.service';
import { formatImageUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogTrigger } from '../ui/dialog';
import { useNavigate } from 'react-router-dom';

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

  const scrollGymBros = (direction) => {
    if (gymBrosCarouselRef) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      gymBrosCarouselRef.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
    useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setProductsLoading(true);
        // Fetch only featured products
        const response = await productService.getProducts({ featured: true });
        const data = response.data || [];
        const products = data.map(product => {
          let imageUrl = '/Picture3.png';
          if (product.imageUrls && product.imageUrls.length > 0) {
            const imagePath = product.imageUrls[0];
            if (imagePath.startsWith('http')) {
              imageUrl = imagePath;
            } else {
              const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              imageUrl = `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
            }
          }
          return {
            id: product._id,
            name: product.name,
            image: imageUrl,
            price: `$${product.price?.toFixed(2) || '0.00'}`,
            discount: product.discount,
            originalPrice: product.price,
            stockQuantity: product.stockQuantity,
            preOrder: product.preOrder,
          };
        });
        setFeaturedProducts(products);
      } catch (error) {
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
      {/* Loading Overlays */}
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
      {!backgroundVideoError || !backgroundVideoLoaded ? (
        <video
          key={backgroundVideoKey}
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          className="absolute inset-0 w-full h-full object-cover opacity-10"
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
          <source src="/GymTonic.mp4" type="video/mp4" />
        </video>
      ) : null}
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
              Your Complete Fitness Ecosystem - Shop, Train, Game, Compete
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
                  controls={false}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: mainVideoLoaded ? 'block' : 'none' }}
                  onLoadedData={() => {
                    setMainVideoLoaded(true);
                    setMainVideoError(false);
                  }}
                  onError={() => {
                    setMainVideoError(true);
                  }}
                  onCanPlay={() => setMainVideoLoaded(true)}
                >
                  <source src="/GymTonic.mp4" type="video/mp4" />
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
                    GET STARTED
                  </h2>
                  <p className={`
                    text-fluid-base font-medium text-white/90 drop-shadow-md transition-all duration-1000 delay-700
                    w-full max-w-full text-center
                    ${hasAnimationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  `}
                    style={{ wordBreak: 'break-word' }}
                  >
                    The Best Fitness Has to Offer at a Reach
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
            : 'bg-white text-gray-900 border border-black/30'
        }`}
        style={{
          width: 'clamp(3rem, 10vw, 4rem)',
          height: 'clamp(3rem, 10vw, 4rem)',
          animationDelay: hasAnimationStarted ? '0.2s' : '0s',
          animationFillMode: 'both'
        }}
      >
        <ShoppingBag style={{ width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' }} />
        <span className={`absolute -bottom-6 text-xs font-medium transition-all duration-500 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>Shop</span>
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
            : 'bg-white text-gray-900 border border-black/30'
        }`}
        style={{
          width: 'clamp(3rem, 10vw, 4rem)',
          height: 'clamp(3rem, 10vw, 4rem)',
          animationDelay: hasAnimationStarted ? '0.4s' : '0s',
          animationFillMode: 'both'
        }}
      >
        <Trophy style={{ width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' }} />
        <span className={`absolute -bottom-6 text-xs font-medium transition-all duration-500 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>Coaching</span>
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
            : 'bg-white text-gray-900 border border-black/30'
        }`}
        style={{
          width: 'clamp(3rem, 10vw, 4rem)',
           height: 'clamp(3rem, 10vw, 4rem)',
          animationDelay: hasAnimationStarted ? '0.6s' : '0s',
          animationFillMode: 'both'
        }}
      >
        <Users style={{ width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' }} />
        <span className={`absolute -bottom-6 text-xs font-medium transition-all duration-500 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>Gains</span>
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
            : 'bg-white text-gray-900 border border-black/30'
        }`}
        style={{
          width: 'clamp(3rem, 10vw, 4rem)',
          height: 'clamp(3rem, 10vw, 4rem)',
          animationDelay: hasAnimationStarted ? '0.8s' : '0s',
          animationFillMode: 'both'
        }}
      >
        <Gamepad2 style={{ width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' }} />
        <span className={`absolute -bottom-6 text-xs font-medium transition-all duration-500 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>Games</span>
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
              overflow: 'visible'
            }}
          >
            <div
              className="w-full max-w-4xl mx-auto h-full flex flex-col justify-start"
              style={{
                minHeight: '0',
                maxHeight: '100%',
                height: '100%',
                overflow: 'visible' // <-- Allow overflow for scaling cards
              }}
            >
              {/* GymBros header - label and match count */}
              <div className="w-full text-left mb-2 sm:mb-3">
                <div className="flex items-center justify-start gap-2">
                  <h3 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    GymBros
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
                className="grid grid-cols-1 sm:gap-12 md:gap-12 lg:gap-14 w-full sm:max-w-none flex-1"
                style={{
                  minHeight: '0',
                  maxHeight: '100%',
                  height: '100%',
                  overflow: 'hidden'
                }}
              >
                {/* GymBros Section - Card Design */}
                <div
                  className={`flex flex-col flex-1 min-h-0 max-h-[clamp(120px,30vh,260px)] transition-all duration-800 ${
                    hasAnimationStarted
                      ? 'animate-floatUpSection'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    animationDelay: hasAnimationStarted ? '0.3s' : '0s',
                    animationFillMode: 'both',
                    minHeight: 'clamp(80px,15vh,180px)',
                    maxHeight: 'clamp(120px,30vh,260px)',
                    overflow: 'hidden'
                  }}
                >
                  {gymBrosLoading ? (
                    <div className={`flex-1 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-white/5' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-black/5'} p-4 pt-12 flex items-center justify-center shadow-xl border-2 ${darkMode ? 'border-white/30' : 'border-black/30'} relative overflow-hidden`}>
                      <div className={`animate-spin rounded-full h-6 w-6 border-b-2 relative z-10 ${
                        darkMode ? 'border-blue-400' : 'border-blue-600'
                      }`}></div>
                    </div>                  ) : gymBrosData?.hasProfile ? (
                    <div className={`flex-1 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} p-3 sm:p-4 mt-1 flex flex-col shadow-2xl border-2 ${darkMode ? 'border-blue-500/30 hover:border-purple-500/50' : 'border-blue-300/50 hover:border-purple-400/70'} relative overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group`}>
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
                                    // The width is determined by the height and aspect ratio
                                    aspectRatio: '7 / 10',
                                    minHeight: '80px',
                                    minWidth: '56px',
                                    maxHeight: '100%',
                                    maxWidth: 'calc(100% * 0.7)', // never wider than 70% of container
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
                    <div className={`flex-1 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} p-3 sm:p-4 mt-1 flex flex-col shadow-2xl border-2 ${darkMode ? 'border-blue-500/30 hover:border-purple-500/50' : 'border-blue-300/50 hover:border-purple-400/70'} relative overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group`}>
                      {/* Info Button - positioned in top right */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className={`absolute top-2 right-6 sm:right-2 z-20 p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                            darkMode
                              ? 'bg-gradient-to-br from-blue-600/70 to-purple-600/70 hover:from-blue-500/80 hover:to-purple-500/80 text-white shadow-lg hover:shadow-blue-500/30'
                              : 'bg-gradient-to-br from-blue-500/70 to-purple-500/70 hover:from-blue-600/80 hover:to-purple-600/80 text-white shadow-lg hover:shadow-purple-500/30'
                          } backdrop-blur-sm hover:shadow-xl transform hover:rotate-12`}
                          title="What is GymBros?"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className={`max-w-lg ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white border-gray-600' : 'bg-gradient-to-br from-white to-gray-50 text-gray-900 border-gray-200'} shadow-2xl backdrop-blur-sm sm:top-1/2 top-[55%] sm:translate-y-[-50%] translate-y-[-50%]`}>
                          <DialogHeader className="text-center pb-4">
                            <DialogTitle className={`text-2xl font-bold bg-gradient-to-r ${darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'} bg-clip-text text-transparent`}>
                              🏋️ GymBros Network
                            </DialogTitle>
                            <DialogDescription className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                              Your fitness community awaits! Connect, train, and grow together.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogBody>
                            <div className="space-y-6">
                              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/30' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50'} backdrop-blur-sm`}>
                                <div className="text-center">
                                  <div className={`w-16 h-16 mx-auto mb-3 rounded-full ${darkMode ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gradient-to-br from-blue-600 to-purple-600'} flex items-center justify-center shadow-lg`}>
                                    <Dumbbell className="w-8 h-8 text-white" />
                                  </div>
                                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                    Find Your Fitness Family
                                  </h3>
                                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Connect with dedicated fitness enthusiasts who share your passion for health and wellness.
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                    <UserPlus className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      Build Your Network
                                    </h4>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Discover like-minded individuals and expand your fitness circle
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gradient-to-br from-orange-600 to-red-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                    <Target className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      Achieve Goals Together
                                    </h4>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Partner up with accountability buddies who keep you motivated
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-gradient-to-br from-violet-600 to-purple-600' : 'bg-gradient-to-br from-violet-500 to-purple-500'} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                    <MessageCircle className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      Share & Support
                                    </h4>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Exchange tips, celebrate victories, and support each other's journey
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700/30' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50'} text-center`}>
                                <div className="flex items-center justify-center gap-2 mb-3">
                                  <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} flex items-center justify-center`}>
                                    <Trophy className="w-4 h-4 text-white" />
                                  </div>
                                  <span className={`text-lg font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                    Ready to Level Up?
                                  </span>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-indigo-200' : 'text-indigo-600'} mb-4`}>
                                  Join thousands of fitness enthusiasts who've transformed their workouts through community support.
                                </p>
                                <button
                                  onClick={() => {
                                    window.location.href = '/gymbros';
                                  }}
                                  className={`w-full py-3 px-6 rounded-xl font-bold text-white ${darkMode ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'} transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transform`}
                                >
                                  Start Your Journey 🚀
                                </button>
                              </div>
                            </div>
                          </DialogBody>
                        </DialogContent>
                      </Dialog>
                      {/* Subtle inner glow */}
                      <div className={`absolute inset-0 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10' : 'bg-gradient-to-br from-blue-400/15 via-purple-400/10 to-indigo-400/15'} opacity-60 group-hover:opacity-80 transition-all duration-500`}></div>
                      <div className="flex flex-col items-center justify-center h-full py-1 sm:py-2 relative z-10"><div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'} flex items-center justify-center mb-1 shadow-lg`}>
                          <Users className={`w-4 h-4 sm:w-4 sm:h-4 text-white`} />
                        </div>
                        <p className={`text-xs font-medium text-center mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Connect with GymBros
                        </p>
                          <button
                          onClick={() => window.location.href = '/gymbros'}
                          className={`text-xs py-1 px-3 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'}`}>
                          Get Started
                        </button>
                      </div>
                    </div>)}
                </div>
                {/* Featured Products Section */}
                <div
                  className={`space-y-2 sm:space-y-3 sm:col-span-1 flex flex-col flex-1 min-h-0 transition-all duration-800 ${
                    hasAnimationStarted
                      ? 'animate-floatUpSection'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    animationDelay: hasAnimationStarted ? '0.5s' : '0s',
                    animationFillMode: 'both',
                    minHeight: 'clamp(200px,30vh,400px)',
                    maxHeight: 'clamp(350px,40vh,600px)',
                    height: '100%', // <-- Ensure it stretches to parent
                    overflow: 'visible',
                    zIndex: 1
                  }}
                >
                  {/* Add margin-top for small screens */}
                  <div className="flex items-center justify-start gap-2 sm:gap-2 lg:gap-2 mb-2 sm:mb-3 mt-10 sm:mt-0">
                    <h3 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Featured Products
                    </h3>
                    <button
                      onClick={() => window.location.href = '/shop'}
                      className={`p-1 rounded-full hover:scale-110 transition-all duration-300 ${
                        darkMode
                          ? 'text-blue-400 hover:text-blue-300'
                          : 'text-blue-600 hover:text-blue-500'
                      }`}
                      title="Go to Shop"
                    >
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  {/* Featured products content fills the rest */}
                  <div className="flex-1 min-h-0 flex flex-col" style={{height: '100%'}}>
                    {productsLoading ? (
                      <div className={`flex-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4 sm:p-6 flex items-center justify-center shadow-lg border-2 ${darkMode ? 'border-white/30' : 'border-black/30'} relative overflow-hidden`}>
                        <div className={`absolute inset-0 rounded-xl ${darkMode ? 'bg-gradient-to-br from-green-500/5 to-blue-500/5' : 'bg-gradient-to-br from-green-500/10 to-blue-500/10'}`}></div>
                        <div className={`animate-spin rounded-full h-6 w-6 border-b-2 relative z-10 ${
                          darkMode ? 'border-blue-400' : 'border-blue-600'
                        }`}></div>
                      </div>
                    ) : featuredProducts.length > 0 ? (
                   <div className="flex flex-row gap-4 overflow-x-auto scrollbar-hide p-8 -m-5 -mt-10 z-9999">
                        <div className="flex flex-row gap-4 h-full w-full">
                          {featuredProducts.map((product) => {
                            const price = getPriceDisplay(product);
                            const isOutOfStock = product.stockQuantity === 0;
                            const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
                            return (
                              <div
                                key={product.id}
                                className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg border-2 ${darkMode ? 'border-gray-950/60 hover:border-blue-500/100' : 'border-gray-950/60 hover:border-blue-400/70'} hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group relative group-hover:z-10 flex flex-col`}
                                onClick={() => navigate(`/product/${product.id}`)}
                                style={{
                                  flex: '0 0 auto',
                                  aspectRatio: '7 / 10',
                                  height: '100%',
                                  minWidth: 0,
                                  minHeight: 0,
                                  maxHeight: '100%',
                                }}
                              >
                                {/* Image stays square */}
                                <div className="flex flex-col h-full aspect-[7/10]">
                                <div className="relative h-1/2 overflow-hidden bg-gray-50 dark:bg-gray-800">
    <div className="relative aspect-square h-full w-full">
      <img
        src={product.image}
        alt={product.name}
        className="absolute h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={e => { e.target.src = '/Picture3.png'; }}
      />
      {/* Status badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
        {price.discounted && (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white font-bold shadow">
            {price.percentage}% OFF
          </span>
        )}
        {isOutOfStock && (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-800 text-white font-bold shadow">
            Out of Stock
          </span>
        )}
        {lowStock && (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-500 text-white font-bold shadow">
            Low Stock
          </span>
        )}
        {product.preOrder && (
          <span className="px-2 py-1 text-[10px] rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-900 font-bold border border-amber-900 shadow">
            Pre-order
          </span>
        )}
      </div>
    </div>
                                </div>
                                <div className="flex flex-col h-1/2 p-3 overflow-hidden">
      <h4
        className={`font-semibold text-sm mb-1 truncate ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        {product.name}
      </h4>
      <div className="flex items-baseline gap-2 -mb-1">
        {price.discounted ? (
          <>
            <span className="text-base font-bold text-red-600">
              {price.discounted}
            </span>
            <span className="text-xs text-gray-400 line-through">
              {price.original}
            </span>
          </>
        ) : (
          <span className="text-base font-bold text-gray-900 dark:text-white">
            {price.original}
          </span>
        )}
      </div>
      {lowStock && (
        <p className="text-xs text-amber-600 mt-auto">
          Only {product.stockQuantity} left
        </p>
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
                          Sorry, no featured products available right now.
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