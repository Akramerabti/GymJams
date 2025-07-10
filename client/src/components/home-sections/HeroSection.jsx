import React, { useState, useEffect } from 'react';
import { ShoppingBag, Users, Gamepad2, Trophy, ChevronLeft, ChevronRight, MessageCircle, ArrowRight, XCircle, Info, UserPlus, Dumbbell, Target } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import productService from '../../services/product.service';
import gymBrosService from '../../services/gymbros.service';
import { formatImageUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogTrigger } from '../ui/dialog';

const HeroSection = ({ onNavigate, isActive, goToSection }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [gymBrosData, setGymBrosData] = useState(null);
  const [gymBrosLoading, setGymBrosLoading] = useState(true);
  const [showGymBrosInfo, setShowGymBrosInfo] = useState(false);
  
  // Loading and animation states for smooth UX
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [hasAnimationStarted, setHasAnimationStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
    // Video fallback states with retry mechanism
  const [backgroundVideoLoaded, setBackgroundVideoLoaded] = useState(false);
  const [backgroundVideoError, setBackgroundVideoError] = useState(false);
  const [backgroundRetryCount, setBackgroundRetryCount] = useState(0);
  const [mainVideoLoaded, setMainVideoLoaded] = useState(false);
  const [mainVideoError, setMainVideoError] = useState(false);
  const [mainRetryCount, setMainRetryCount] = useState(0);
  const [backgroundVideoKey, setBackgroundVideoKey] = useState(0);
  const [mainVideoKey, setMainVideoKey] = useState(0);
    const MAX_RETRY_ATTEMPTS = 10; // Keep trying
  const RETRY_DELAY = 3000; // 3 seconds between retries
  
  // Add carousel functionality for GymBros
  const [gymBrosCarouselRef, setGymBrosCarouselRef] = useState(null);

  // Component initialization and smooth loading effect
  useEffect(() => {
    let timeouts = [];
    
    // Initial setup - ensure component is ready before starting animations
    const initializeComponent = () => {
      // Phase 1: Component mounting and preparation (immediate)
      setIsComponentReady(true);
      
      // Phase 2: Start showing content with dark background (300ms delay)
      timeouts.push(setTimeout(() => {
        setShowContent(true);
      }, 300));
      
      // Phase 3: Enable animations when section becomes active (600ms delay total)
      timeouts.push(setTimeout(() => {
        if (isActive) {
          setHasAnimationStarted(true);
        }
      }, 600));
    };
    
    // Start initialization
    initializeComponent();
    
    // Cleanup timeouts on unmount
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []); // Run only once on mount

  // Handle isActive changes after initial mount
  useEffect(() => {
    if (isActive && isComponentReady && showContent) {
      // Small delay to ensure smooth transition when section becomes active
      const timer = setTimeout(() => {
        setHasAnimationStarted(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (!isActive) {
      // Reset animation state when section becomes inactive
      setHasAnimationStarted(false);
    }
  }, [isActive, isComponentReady, showContent]);
  // Carousel navigation for GymBros
  const scrollGymBrosLeft = () => {
    if (gymBrosCarouselRef) {
      const scrollAmount = 200; // Scroll by 200px (roughly 3-4 cards)
      gymBrosCarouselRef.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollGymBrosRight = () => {
    if (gymBrosCarouselRef) {
      const scrollAmount = 200; // Scroll by 200px (roughly 3-4 cards)
      gymBrosCarouselRef.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Fetch real products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        
        // Use the same product service as the shop page
        const response = await productService.getProducts();
        const data = response.data || [];
        
        // Take first 4 products or all if less than 4
        const products = data.slice(0, 4).map(product => {
          // Handle image URL properly like in ProductCard
          let imageUrl = '/Picture3.png'; // fallback
          if (product.images && product.images.length > 0) {
            const imagePath = product.images[0];
            if (imagePath.startsWith('http')) {
              imageUrl = imagePath;
            } else {
              const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              imageUrl = `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
            }
          } else if (product.image) {
            if (product.image.startsWith('http')) {
              imageUrl = product.image;
            } else {
              const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              imageUrl = `${baseUrl}${product.image.startsWith('/') ? product.image : `/${product.image}`}`;
            }
          }
          
          return {
            id: product._id,
            name: product.name,
            image: imageUrl,
            price: `$${product.price?.toFixed(2) || '0.00'}`
          };
        });
        
        setFeaturedProducts(products);
        //('Successfully loaded products from API:', products.length);
      } catch (error) {        //('Using fallback products data:', error.message);
        // Fallback to placeholder products - Multiple products for testing carousel
        setFeaturedProducts([
          { id: 1, name: "Premium Protein", image: "/Picture2.png", price: "$49.99" },
          { id: 2, name: "Resistance Bands", image: "/Picture2.png", price: "$29.99" },
          { id: 3, name: "Yoga Mat Pro", image: "/Picture2.png", price: "$39.99" },
          { id: 4, name: "Dumbbells Set", image: "/Picture2.png", price: "$199.99" },
          { id: 5, name: "Pre-Workout", image: "/Picture2.png", price: "$34.99" },
          { id: 6, name: "Gym Gloves", image: "/Picture2.png", price: "$24.99" },
          { id: 7, name: "Water Bottle", image: "/Picture2.png", price: "$19.99" },
          { id: 8, name: "Gym Towel", image: "/Picture2.png", price: "$14.99" },
          { id: 9, name: "Protein Shaker", image: "/Picture2.png", price: "$12.99" },
          { id: 10, name: "Creatine", image: "/Picture2.png", price: "$27.99" }
        ]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch GymBros data using service
  useEffect(() => {
    const fetchGymBrosData = async () => {
      try {
        setGymBrosLoading(true);
        
        // Check if user has profile using service
        try {
          const profileResponse = await gymBrosService.getGymBrosProfile();
          //('Profile response from service:', profileResponse);
          
          if (profileResponse.hasProfile) {
            // Fetch matches using service
            try {
              const matchesData = await gymBrosService.getMatches();
              //('Matches data from service:', matchesData);
              
              setGymBrosData({
                hasProfile: true,
                matchesCount: matchesData.length || 0,
                recentMatches: matchesData.slice(0, 3)
              });
            } catch (matchesError) {
              //('Error fetching matches:', matchesError.message);
              setGymBrosData({ hasProfile: true, matchesCount: 0 });
            }
          } else {
            setGymBrosData({ hasProfile: false });
          }
        } catch (profileError) {
          //('Error fetching profile:', profileError.message);
          setGymBrosData({ hasProfile: false });
        }
      } catch (error) {
        //('GymBros service error:', error.message);
        setGymBrosData({ hasProfile: false });
      } finally {
        setGymBrosLoading(false);
      }
    };

    fetchGymBrosData();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (featuredProducts.length > 1) {
      const interval = setInterval(() => {
        setCurrentProductIndex((prev) => (prev + 1) % featuredProducts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [featuredProducts.length]);
  // Navigate to specific sections
  const navigateToSection = (sectionIndex) => {
    //('Navigating to section:', sectionIndex);
    if (goToSection) {
      goToSection(sectionIndex);
    }
  };

  const nextProduct = () => {
    setCurrentProductIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const prevProduct = () => {
    setCurrentProductIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
  };  return (
    <div className="absolute inset-0">
      {/* Initial Loading Overlay - Dark background while component initializes */}
      {!isComponentReady && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Smooth Content Transition Overlay */}
      {isComponentReady && !showContent && (
        <div className="absolute inset-0 z-40 bg-black transition-opacity duration-300"></div>
      )}

      {/* Background Video for entire section - Bottom layer with reduced opacity */}
      {!backgroundVideoError || !backgroundVideoLoaded ? (
        <video
          key={backgroundVideoKey}
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover opacity-10"
          style={{ display: backgroundVideoLoaded ? 'block' : 'none' }}
          onLoadedData={() => {
            //('Background video loaded successfully');
            setBackgroundVideoLoaded(true);
            setBackgroundVideoError(false);
          }}
          onError={(e) => {
            //('Background video error:', e);
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
      )}{/* Gradient overlay - On top of video */}
      <div className="absolute inset-0 transition-colors duration-500 bg-gray-900/60"></div>      <div 
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
          <div className={`h-1/4 sm:h-1/3 lg:h-1/3 relative z-20 ${darkMode ? 'bg-gradient-to-b from-white/5 via-gray-900 to-gray-900' : 'bg-gradient-to-b from-black/5 via-white to-white'}`}>            {/* Video Background - Full width */}
            <div
              className={`
                relative z-20
                w-full
                pt-[var(--navbar-height,4rem)]
                aspect-video
                min-h-[100px]
                max-h-[20vh] sm:max-h-[20vh] md:max-h-[30vh] lg:max-h-[40vh]
                flex items-center justify-center
                overflow-hidden
              `}
              style={{
                // fallback for browsers that don't support aspect-ratio
                height: 'min(25vh, 56vw)',
              }}
            >
              {/* Video Background - Full width */}
              {!mainVideoError || !mainVideoLoaded ? (
                <video
                  key={mainVideoKey}
                  autoPlay
                  muted
                  loop
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: mainVideoLoaded ? 'block' : 'none' }}
                  onLoadedData={() => {
                    //('Main video loaded successfully');
                    setMainVideoLoaded(true);
                    setMainVideoError(false);
                  }}
                  onError={(e) => {
                    //('Main video error:', e);
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
                {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>

              {/* GET STARTED Label with floating animation */}
              <div className="absolute inset-0 flex flex-col items-center lg:justify-center justify-center pt-0 space-y-3">                {/* GET STARTED Label with one-time floating animation - Always white */}
                <div className="text-center">                  <h2 className={`text-2xl mt-10 sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wider text-white drop-shadow-lg transition-all duration-1000 ${
                    hasAnimationStarted 
                      ? 'animate-floatOnce' 
                      : 'opacity-0 translate-y-8'
                  }`}>
                    GET STARTED
                  </h2>
                  {/* Subheading */}
                  <p className={`text-sm sm:text-base lg:text-lg text-white/90 drop-shadow-md mt-2 font-medium transition-all duration-1000 delay-700 ${
                    hasAnimationStarted 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}>
                    The Best Fitness Has to Offer at a Reach
                  </p>
                </div>
              </div>
            </div>
          </div>          {/* Navigation Circle Buttons - Below video, above GymBros */}
          <div className={`py-6 px-4 relative z-5 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex justify-center items-center gap-5 sm:gap-6 md:gap-8 lg:gap-6 flex-wrap max-w-lg mx-auto">              <button
                onClick={() => navigateToSection(1)}                className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-14 lg:h-14 rounded-full hover:scale-110 transition-all duration-500 flex flex-col items-center justify-center group shadow-lg transform ${
                  hasAnimationStarted 
                    ? 'animate-slideDownFromVideo' 
                    : 'opacity-0 invisible pointer-events-none'
                } ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/30' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-black/30'
                }`}
                style={{ 
                  animationDelay: hasAnimationStarted ? '0.2s' : '0s',
                  animationFillMode: 'both'
                }}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5" />                <span className={`absolute -bottom-full text-xs font-medium transition-all duration-500 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                } group-hover:scale-110`}>Shop</span>
              </button>              <button
                onClick={() => navigateToSection(2)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-14 lg:h-14 rounded-full hover:scale-110 transition-all duration-500 flex flex-col items-center justify-center group shadow-lg transform ${
                  hasAnimationStarted 
                    ? 'animate-slideDownFromVideo' 
                    : 'opacity-0 invisible pointer-events-none'
                } ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/30' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-black/30'
                }`}
                style={{ 
                  animationDelay: hasAnimationStarted ? '0.4s' : '0s',
                  animationFillMode: 'both'
                }}
              >
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5" />                <span className={`absolute -bottom-full text-xs font-medium transition-all duration-500 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                } group-hover:scale-110`}>Coaching</span>
              </button>

              <button
                onClick={() => navigateToSection(3)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-14 lg:h-14 rounded-full hover:scale-110 transition-all duration-500 flex flex-col items-center justify-center group shadow-lg transform ${
                  hasAnimationStarted 
                    ? 'animate-slideDownFromVideo' 
                    : 'opacity-0 invisible pointer-events-none'
                } ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/30' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-black/30'
                }`}
                style={{ 
                  animationDelay: hasAnimationStarted ? '0.6s' : '0s',
                  animationFillMode: 'both'
                }}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5" />                <span className={`absolute -bottom-full text-xs font-medium transition-all duration-500 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                } group-hover:scale-110`}>Gains</span>
              </button>

              <button
                onClick={() => navigateToSection(4)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-14 lg:h-14 rounded-full hover:scale-110 transition-all duration-500 flex flex-col items-center justify-center group shadow-lg transform ${
                  hasAnimationStarted 
                    ? 'animate-slideDownFromVideo' 
                    : 'opacity-0 invisible pointer-events-none'
                } ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/30' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-black/30'
                }`}
                style={{ 
                  animationDelay: hasAnimationStarted ? '0.8s' : '0s',
                  animationFillMode: 'both'
                }}
              >
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5" />                <span className={`absolute -bottom-full text-xs font-medium transition-all duration-500 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                } group-hover:scale-110`}>Games</span>
              </button>
            </div>
          </div>          {/* Section 2: Featured Products and GymBros - Reduced padding since buttons take space */}
          <div className={`flex-1 flex flex-col items-center justify-start px-3 sm:px-4 lg:px-8 pt-6 sm:pt-8 lg:pt-6 pb-32 sm:pb-16 ${darkMode ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-white/5' : 'bg-gradient-to-b from-white via-white to-black/5'}`}>
            <div className="w-full max-w-4xl mx-auto h-full flex flex-col justify-start">              {/* GymBros header - label and match count */}
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
                </div>              </div>              {/* All screen sizes: Stacked vertically */}
              <div className="grid grid-cols-1 sm:gap-12 md:gap-12 lg:gap-14 w-full sm:max-w-none flex-1">                {/* GymBros Section - Card Design */}                <div className={`flex flex-col min-h-[80px] max-h-[120px] sm:min-h-[80px] sm:max-h-[120px] lg:min-h-[80px] lg:max-h-[120px] transition-all duration-800 ${
                  hasAnimationStarted 
                    ? 'animate-floatUpSection' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  animationDelay: hasAnimationStarted ? '0.3s' : '0s',
                  animationFillMode: 'both'
                }}>{gymBrosLoading ? (
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
                            {/* Card Carousel */}                          <div className="relative overflow-visible z-50 flex-1 h-full">                              <div 
                              ref={setGymBrosCarouselRef}
                              className="overflow-x-auto overflow-y-visible flex flex-row gap-2 snap-x snap-mandatory scrollbar-hide relative z-50 h-full items-stretch touch-pan-x transition-all duration-300" 
                              style={{ 
                                scrollbarWidth: 'none', 
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch',
                                scrollBehavior: 'smooth',
                                scrollSnapType: 'x mandatory'
                              }}>                              {gymBrosData.recentMatches.map((match, index) => (                                <div 
                                  key={match._id || index} 
                                  className="flex-shrink-0 snap-start cursor-pointer group relative z-50 h-full"
                                  onClick={() => window.location.href = '/gymbros'}
                                  style={{ 
                                    width: "56px", 
                                    minWidth: "56px" 
                                  }}
                                ><div 
                                    className="relative w-full h-full overflow-visible rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/30 group-hover:brightness-125 group-hover:z-[9999] group-hover:scale-105" 
                                    style={{ 
                                      width: "56px",
                                      height: "80px",
                                      aspectRatio: "7/10"
                                    }}
                                  >
                                    <img 
                                      src={formatImageUrl(match.profileImage, getFallbackAvatarUrl())} 
                                      alt={match.name || 'Match'}
                                      className="w-full h-full object-cover transition-transform duration-300 rounded-lg"
                                      crossOrigin="anonymous"
                                      onError={(e) => {
                                        console.error('❌ Image load error for match:', match.name, e.target.src);
                                        e.target.onerror = null;
                                        e.target.src = getFallbackAvatarUrl();
                                        
                                        if (e.target.src.includes('supabase.co')) {
                                          //('🧹 Broken Supabase URL for match:', match.name);
                                        }
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
                                    </div>                                  </div>
                                </div>
                              ))}
                            </div>                            {/* Carousel Navigation Controls - Only show if more than 2 matches */}
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
                      <Dialog>                        <DialogTrigger asChild>
                          <button className={`absolute top-2 right-6 sm:right-2 z-20 p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                            darkMode 
                              ? 'bg-gradient-to-br from-blue-600/70 to-purple-600/70 hover:from-blue-500/80 hover:to-purple-500/80 text-white shadow-lg hover:shadow-blue-500/30' 
                              : 'bg-gradient-to-br from-blue-500/70 to-purple-500/70 hover:from-blue-600/80 hover:to-purple-600/80 text-white shadow-lg hover:shadow-purple-500/30'
                          } backdrop-blur-sm hover:shadow-xl transform hover:rotate-12`}
                          title="What is GymBros?"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </DialogTrigger>                        <DialogContent className={`max-w-lg ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white border-gray-600' : 'bg-gradient-to-br from-white to-gray-50 text-gray-900 border-gray-200'} shadow-2xl backdrop-blur-sm sm:top-1/2 top-[55%] sm:translate-y-[-50%] translate-y-[-50%]`}>
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
                        </p>                          <button 
                          onClick={() => window.location.href = '/gymbros'}
                          className={`text-xs py-1 px-3 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'}`}>
                          Get Started
                        </button>
                      </div>
                    </div>)}
                </div>                {/* Featured Products Section */}                <div className={`space-y-2 sm:space-y-3 sm:col-span-1 flex flex-col h-full transition-all duration-800 ${
                  hasAnimationStarted 
                    ? 'animate-floatUpSection' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  animationDelay: hasAnimationStarted ? '0.5s' : '0s',
                  animationFillMode: 'both'
                }}>
                  {/* Featured Products with Shop Arrow */}
                  <div className="flex items-center justify-start gap-2 sm:gap-2 lg:gap-2 mb-2 sm:mb-3">
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
                    {productsLoading ? (
                    <div className={`flex-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4 sm:p-6 flex items-center justify-center shadow-lg border-2 ${darkMode ? 'border-white/30' : 'border-black/30'} relative overflow-hidden`}>
                      {/* Subtle inner glow */}
                      <div className={`absolute inset-0 rounded-xl ${darkMode ? 'bg-gradient-to-br from-green-500/5 to-blue-500/5' : 'bg-gradient-to-br from-green-500/10 to-blue-500/10'}`}></div>
                      <div className={`animate-spin rounded-full h-6 w-6 border-b-2 relative z-10 ${
                        darkMode ? 'border-blue-400' : 'border-blue-600'
                      }`}></div>
                    </div>                  ) : featuredProducts.length > 0 ? (
                    <div className="relative flex-1 flex flex-col">
                      <div className={`flex-1 relative overflow-hidden rounded-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} p-4 sm:p-6 min-h-[200px] shadow-2xl border-2 ${darkMode ? 'border-green-500/30 hover:border-blue-500/50' : 'border-green-300/50 hover:border-blue-400/70'} hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group`}>
                        {/* Subtle inner glow */}                        <div className={`absolute inset-0 rounded-xl ${darkMode ? 'bg-gradient-to-br from-green-500/10 via-blue-500/5 to-emerald-500/10' : 'bg-gradient-to-br from-green-400/15 via-blue-400/10 to-emerald-400/15'} opacity-60 group-hover:opacity-80 transition-all duration-500`}></div>
                        <div 
                          className="flex transition-transform duration-300 ease-in-out h-full relative z-10"
                          style={{ transform: `translateX(-${currentProductIndex * 100}%)` }}
                        >
                          {featuredProducts.map((product) => (
                            <div key={product.id} className="w-full flex-shrink-0 text-center flex flex-col items-center justify-center h-full">
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 rounded-lg object-cover shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                                onError={(e) => {
                                  e.target.src = '/Picture3.png';
                                }}
                              />
                              <h4 className={`font-semibold text-sm sm:text-base lg:text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {product.name}
                              </h4>
                              <p className={`text-sm sm:text-base font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                {product.price}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Carousel Controls */}
                      {featuredProducts.length > 1 && (
                        <>
                          <button
                            onClick={prevProduct}
                            className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                              darkMode ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-white/90 hover:bg-gray-100 text-gray-900'
                            } shadow-lg transition-all duration-200 hover:scale-110`}
                          >
                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          
                          <button
                            onClick={nextProduct}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                              darkMode ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-white/90 hover:bg-gray-100 text-gray-900'
                            } shadow-lg transition-all duration-200 hover:scale-110`}
                          >
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          
                          {/* Dots Indicator */}
                          <div className="flex justify-center mt-3 gap-2">
                            {featuredProducts.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentProductIndex(index)}
                                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 ${
                                  index === currentProductIndex
                                    ? 'bg-blue-500 scale-125'
                                    : darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}                    </div>                  ) : (
                    <div className={`flex-1 rounded-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} p-4 sm:p-6 text-center flex flex-col items-center justify-center shadow-2xl min-h-[190px] border-2 ${darkMode ? 'border-gray-600/30 hover:border-gray-500/50' : 'border-gray-300/50 hover:border-gray-400/70'} relative overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group`}>                      {/* Subtle inner glow */}
                      <div className={`absolute inset-0 rounded-xl ${darkMode ? 'bg-gradient-to-br from-gray-600/10 via-gray-500/5 to-gray-700/10' : 'bg-gradient-to-br from-gray-400/15 via-gray-300/10 to-gray-500/15'} opacity-60 group-hover:opacity-80 transition-all duration-500`}></div>
                      <XCircle className={`w-12 h-12 mb-3 relative z-10 ${darkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-500'} transition-all duration-300`} />
                      <p className={`text-sm sm:text-base relative z-10 ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} transition-all duration-300`}>
                        Sorry, no products available right now.
                      </p></div>
                  )}
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
