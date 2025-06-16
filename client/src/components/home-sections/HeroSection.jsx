import React, { useState, useEffect } from 'react';
import { ShoppingBag, Users, Gamepad2, Trophy, ChevronLeft, ChevronRight, Heart, MessageCircle, ArrowRight, XCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import productService from '../../services/product.service';
import gymBrosService from '../../services/gymbros.service';
import { formatImageUrl, getFallbackAvatarUrl } from '../../utils/imageUtils';

const HeroSection = ({ onNavigate, isActive, goToSection }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [gymBrosData, setGymBrosData] = useState(null);
  const [gymBrosLoading, setGymBrosLoading] = useState(true);

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
          let imageUrl = '/Picture2.png'; // fallback
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
        console.log('Successfully loaded products from API:', products.length);
      } catch (error) {
        console.log('Using fallback products data:', error.message);
        // Fallback to placeholder products
        setFeaturedProducts([
          { id: 1, name: "Premium Protein", image: "/Picture2.png", price: "$49.99" },
          { id: 2, name: "Resistance Bands", image: "/Picture2.png", price: "$29.99" },
          { id: 3, name: "Yoga Mat Pro", image: "/Picture2.png", price: "$39.99" },
          { id: 4, name: "Dumbbells Set", image: "/Picture2.png", price: "$199.99" }
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
          console.log('Profile response from service:', profileResponse);
          
          if (profileResponse.hasProfile) {
            // Fetch matches using service
            try {
              const matchesData = await gymBrosService.getMatches();
              console.log('Matches data from service:', matchesData);
              
              setGymBrosData({
                hasProfile: true,
                matchesCount: matchesData.length || 0,
                recentMatches: matchesData.slice(0, 3)
              });
            } catch (matchesError) {
              console.log('Error fetching matches:', matchesError.message);
              setGymBrosData({ hasProfile: true, matchesCount: 0 });
            }
          } else {
            setGymBrosData({ hasProfile: false });
          }
        } catch (profileError) {
          console.log('Error fetching profile:', profileError.message);
          setGymBrosData({ hasProfile: false });
        }
      } catch (error) {
        console.log('GymBros service error:', error.message);
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
    console.log('Navigating to section:', sectionIndex);
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

  return (
    <div className={`absolute inset-0 transition-colors duration-500 ${
      darkMode 
        ? 'bg-gray-900' 
        : 'bg-white'
    }`}>

      <div 
        className={`w-full h-full transition-all duration-700 ${
          isActive 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Mobile Layout: Two Sections Stacked */}
        <div className="h-full flex flex-col pointer-events-auto">
            {/* Desktop Heading - Hidden on Mobile */}
          <div className="hidden lg:block text-center pb-4">
            <p className={`text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed transition-colors duration-500 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Your Complete Fitness Ecosystem - Shop, Train, Game, Compete
            </p>
          </div>

          {/* Section 1: Video Background with Navigation Buttons */}
          <div className="h-1/4 sm:h-1/3 relative">
            {/* Video Background - Smaller on PC */}
            <div className="w-full h-full lg:w-3/4 lg:mx-auto lg:rounded-lg lg:overflow-hidden relative">
              <video
                autoPlay
                muted
                loop
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src="/GymTonic.mp4" type="video/mp4" />
              </video>
              
              {/* Overlay */}
              <div className={`absolute inset-0 ${
                darkMode 
                  ? 'bg-black bg-opacity-50' 
                  : 'bg-white bg-opacity-30'
              }`}></div>                {/* GET STARTED Label and Navigation Circle Buttons - Mobile: Top position, PC: Center */}
              <div className="absolute inset-0 flex flex-col items-center lg:justify-center justify-center pt-0  space-y-3">
                {/* GET STARTED Label - Always white */}
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wider text-white drop-shadow-lg">
                  GET STARTED
                </h2>
                
                {/* Navigation Circle Buttons - Smaller on PC */}
                <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 lg:gap-4 flex-wrap max-w-xs sm:max-w-sm lg:max-w-md mx-auto">
                  <button
                    onClick={() => navigateToSection(1)}
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-14 lg:h-14 rounded-full hover:scale-110 transition-all duration-300 flex flex-col items-center justify-center group ${
                      darkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' 
                        : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                    } shadow-lg`}
                  >
                    <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-5 lg:h-5" />
                    <span className={`absolute -bottom-5 sm:-bottom-6 md:-bottom-8 lg:-bottom-6 text-xs font-medium transition-colors duration-500 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    } drop-shadow-lg`}>Shop</span>
                  </button>
                  
                  <button
                    onClick={() => navigateToSection(2)}
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-14 lg:h-14 rounded-full hover:scale-110 transition-all duration-300 flex flex-col items-center justify-center group ${
                      darkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' 
                        : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                    } shadow-lg`}
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-5 lg:h-5" />
                    <span className={`absolute -bottom-5 sm:-bottom-6 md:-bottom-8 lg:-bottom-6 text-xs font-medium transition-colors duration-500 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    } drop-shadow-lg`}>Gym Bros</span>
                  </button>
                  
                  <button
                    onClick={() => navigateToSection(3)}
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-14 lg:h-14 rounded-full hover:scale-110 transition-all duration-300 flex flex-col items-center justify-center group ${
                      darkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' 
                        : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                    } shadow-lg`}
                  >
                    <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-5 lg:h-5" />
                    <span className={`absolute -bottom-5 sm:-bottom-6 md:-bottom-8 lg:-bottom-6 text-xs font-medium transition-colors duration-500 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    } drop-shadow-lg`}>Games</span>
                  </button>
                  
                  <button
                    onClick={() => navigateToSection(4)}
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-14 lg:h-14 rounded-full hover:scale-110 transition-all duration-300 flex flex-col items-center justify-center group ${
                      darkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' 
                        : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                    } shadow-lg`}
                  >
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 lg:w-5 lg:h-5" />
                    <span className={`absolute -bottom-5 sm:-bottom-6 md:-bottom-8 lg:-bottom-6 text-xs font-medium transition-colors duration-500 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    } drop-shadow-lg`}>Coaching</span>
                  </button>
                </div>
              </div>
            </div>
          </div>          {/* Section 2: Featured Products and GymBros - Better proportions and spacing */}
          <div className="flex-1 flex flex-col items-center justify-start px-3 sm:px-4 lg:px-8 pt-6 lg:pt-12 pb-6">
            <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
              {/* Featured Products with Shop Arrow */}
              <div className="w-full text-left mb-4">
                <div className="flex items-center justify-start gap-2">
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
              </div>              {/* Mobile: Stacked vertically, Desktop: Side by side - NO CENTERING ON MOBILE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 lg:gap-6 w-full sm:max-w-none flex-1">
                
                {/* Product Carousel */}
                <div className="space-y-2 sm:space-y-3 sm:col-span-1 flex flex-col h-full">
                  {productsLoading ? (
                    <div className={`flex-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4 sm:p-6 flex items-center justify-center shadow-lg`}>
                      <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
                        darkMode ? 'border-blue-400' : 'border-blue-600'
                      }`}></div>
                    </div>
                  ) : featuredProducts.length > 0 ? (
                    <div className="relative flex-1 flex flex-col">
                      <div className={`flex-1 relative overflow-hidden rounded-xl ${darkMode ? 'bg-gray-800/80' : 'bg-white'} p-4 sm:p-6 min-h-[180px] shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div 
                          className="flex transition-transform duration-300 ease-in-out h-full"
                          style={{ transform: `translateX(-${currentProductIndex * 100}%)` }}
                        >
                          {featuredProducts.map((product) => (
                            <div key={product.id} className="w-full flex-shrink-0 text-center flex flex-col items-center justify-center h-full">
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 rounded-lg object-cover shadow-md"
                                onError={(e) => {
                                  e.target.src = '/Picture2.png';
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
                      )}
                    </div>
                  ) : (
                    <div className={`flex-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4 sm:p-6 text-center flex flex-col items-center justify-center shadow-lg`}>
                      <XCircle className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Sorry, no products available right now.
                      </p>
                    </div>
                  )}
                </div>                {/* GymBros Section - Enhanced UI */}
                <div className="flex flex-col" style={{ minHeight: '140px', maxHeight: '180px' }}>
                  {/* GymBros header - label and message button on the left */}
                  <div className="flex items-center justify-start gap-2 mb-3">
                    <h3 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      GymBros
                    </h3>
                    {gymBrosData?.hasProfile && gymBrosData?.recentMatches?.length > 0 && (
                      <button
                        onClick={() => window.location.href = '/gymbros'}
                        className={`p-1.5 rounded-full hover:scale-110 transition-all duration-300 ${
                          darkMode 
                            ? 'text-blue-400 hover:text-blue-300' 
                            : 'text-blue-600 hover:text-blue-500'
                        }`}
                        title="Go to Messages"
                      >
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                  
                  {gymBrosLoading ? (
                    <div className={`flex-1 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} p-4 flex items-center justify-center shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
                        darkMode ? 'border-blue-400' : 'border-blue-600'
                      }`}></div>
                    </div>
                  ) : gymBrosData?.hasProfile ? (
                    <div className={`flex-1 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} p-4 flex flex-col shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {gymBrosData.recentMatches && gymBrosData.recentMatches.length > 0 ? (
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Recent matches
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                              {gymBrosData.recentMatches.length}
                            </span>
                          </div>
                          <div className="flex gap-3 overflow-x-auto pb-2 flex-1 items-center scrollbar-hide">                            {gymBrosData.recentMatches.map((match, index) => (
                              <div 
                                key={match._id || index} 
                                className="flex-shrink-0 text-center cursor-pointer group"
                                onClick={() => window.location.href = '/gymbros'}
                              >                                <div className="relative mb-2">
                                  <img 
                                    src={formatImageUrl(match.profileImage, getFallbackAvatarUrl())} 
                                    alt={match.name || 'Match'}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover mx-auto border-3 border-transparent group-hover:border-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                      console.error('❌ Image load error for match:', match.name, e.target.src);
                                      e.target.onerror = null; // Prevent infinite loop
                                      e.target.src = getFallbackAvatarUrl();
                                      
                                      // If this is a Supabase URL that failed, log it
                                      if (e.target.src.includes('supabase.co')) {
                                        console.log('🧹 Broken Supabase URL for match:', match.name);
                                      }
                                    }}
                                  />
                                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                                    darkMode ? 'border-gray-800 bg-green-500' : 'border-white bg-green-500'
                                  } shadow-lg pulse`}></div>
                                </div>
                                <p className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate max-w-[60px] group-hover:text-blue-500 transition-colors duration-300`}>
                                  {match.name || 'Unknown'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-3">
                          <div className={`w-12 h-12 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center mb-3`}>
                            <Heart className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <p className={`text-sm font-medium text-center mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            No matches yet
                          </p>                          <button 
                            onClick={() => window.location.href = '/gymbros'}
                            className={`text-sm py-2 px-4 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}>
                            Start Swiping
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`flex-1 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} p-4 text-center flex flex-col items-center justify-center shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className={`w-14 h-14 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center mb-3`}>
                        <Users className={`w-7 h-7 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <h4 className={`font-bold text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Connect with GymBros
                      </h4>
                      <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Find your perfect workout partner!
                      </p>                      <button 
                        onClick={() => window.location.href = '/gymbros'}
                        className={`text-sm py-2 px-4 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`}>
                        Get Started
                      </button>
                    </div>
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
