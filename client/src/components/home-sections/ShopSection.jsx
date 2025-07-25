import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Star, Zap, Shirt, Watch, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import productService from '../../services/product.service';
import { formatImageUrl } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next';
import '../../global.css';

const ShopSection = ({ onNavigate, isActive }) => {
  const { darkMode } = useTheme();
  const { t } = useTranslation();
  const [clothesProducts, setClothesProducts] = useState([]);
  const [accessoriesProducts, setAccessoriesProducts] = useState([]);
  const [clothesLoading, setClothesLoading] = useState(true);
  const [accessoriesLoading, setAccessoriesLoading] = useState(true);
  const [clothesIndex, setClothesIndex] = useState(0);
  const [accessoriesIndex, setAccessoriesIndex] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getProducts();
        const allProducts = response.data || [];

        const clothes = allProducts.filter(product => 
          product.category?.toLowerCase().includes('clothes') || 
          product.category?.toLowerCase().includes('apparel') ||
          product.name?.toLowerCase().includes('shirt') ||
          product.name?.toLowerCase().includes('shorts')
        ).slice(0, 6); // Limit to 6 items for carousel
        
        const accessories = allProducts.filter(product => 
          product.category?.toLowerCase().includes('accessories') ||
          product.category?.toLowerCase().includes('equipment') ||
          product.name?.toLowerCase().includes('bottle') ||
          product.name?.toLowerCase().includes('gloves')
        ).slice(0, 6); // Limit to 6 items for carousel

        // If no specific categories found, split products evenly
        if (clothes.length === 0 && accessories.length === 0) {
          const half = Math.ceil(allProducts.length / 2);
          setClothesProducts(allProducts.slice(0, half).slice(0, 6));
          setAccessoriesProducts(allProducts.slice(half).slice(0, 6));
        } else {
          setClothesProducts(clothes);
          setAccessoriesProducts(accessories);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback products
        setClothesProducts([
          { _id: '1', name: 'Premium Gym Shirt', price: 29.99, images: ['/Picture2.png'] },
          { _id: '2', name: 'Athletic Shorts', price: 34.99, images: ['/Picture2.png'] },
          { _id: '3', name: 'Sports Hoodie', price: 49.99, images: ['/Picture2.png'] }
        ]);
        setAccessoriesProducts([
          { _id: '4', name: 'Water Bottle', price: 19.99, images: ['/Picture2.png'] },
          { _id: '5', name: 'Gym Gloves', price: 24.99, images: ['/Picture2.png'] },
          { _id: '6', name: 'Resistance Bands', price: 29.99, images: ['/Picture2.png'] }
        ]);
      } finally {
        setClothesLoading(false);
        setAccessoriesLoading(false);
      }
    };

    if (isActive) {
      fetchProducts();
    }
  }, [isActive]);

  // Auto-rotate carousels
  useEffect(() => {
    if (clothesProducts.length > 1) {
      const interval = setInterval(() => {
        setClothesIndex(prev => (prev + 1) % clothesProducts.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [clothesProducts.length]);

  useEffect(() => {
    if (accessoriesProducts.length > 1) {
      const interval = setInterval(() => {
        setAccessoriesIndex(prev => (prev + 1) % accessoriesProducts.length);
      }, 4500);
      return () => clearInterval(interval);
    }
  }, [accessoriesProducts.length]);

  const handleProductClick = (productId) => {
    if (onNavigate) {
      onNavigate(`/product/${productId}`);
    }
  };

  const nextClothes = () => {
    setClothesIndex(prev => (prev + 1) % clothesProducts.length);
  };

  const prevClothes = () => {
    setClothesIndex(prev => (prev - 1 + clothesProducts.length) % clothesProducts.length);
  };

  const nextAccessories = () => {
    setAccessoriesIndex(prev => (prev + 1) % accessoriesProducts.length);
  };

  const prevAccessories = () => {
    setAccessoriesIndex(prev => (prev - 1 + accessoriesProducts.length) % accessoriesProducts.length);
  };


const ProductCarousel = ({
  products,
  currentIndex,
  onNext,
  onPrev,
  loading,
  type,
  onProductClick
}) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-3 h-3">
            <Star className="w-3 h-3 text-gray-300 absolute" />
            <div className="overflow-hidden w-1.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 absolute" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="relative h-full flex items-center justify-center w-full px-4">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
            darkMode ? 'border-blue-400' : 'border-blue-600'
          }`}></div>
        </div>
      ) : products.length > 0 ? (
        <>
          {/* Product Display */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out h-full"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
                width: `${products.length * 100}%`
              }}
            >
              {products.map((product, index) => {
                // Image URL logic
                let imageUrl = '/Picture2.png';
                if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
                  imageUrl = product.imageUrls[0];
                } else if (Array.isArray(product.images) && product.images.length > 0) {
                  const imagePath = product.images[0];
                  if (imagePath.startsWith('http')) {
                    imageUrl = imagePath;
                  } else {
                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    imageUrl = `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
                  }
                }

                const isDiscounted = product.discount?.percentage && 
                  (!product.discount.startDate || new Date(product.discount.startDate) <= new Date()) &&
                  (!product.discount.endDate || new Date(product.discount.endDate) >= new Date());

                const displayPrice = isDiscounted ? product.discountedPrice : product.price;
                const originalPrice = product.price;

                return (
                  <div
                    key={product._id || product.id}
                    className="flex-shrink-0 h-full px-2"
                    style={{ width: `${100 / products.length}%` }}
                  >
                    <div
                      className={`relative group h-full w-full rounded-xl shadow-lg border cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                        type === 'clothes'
                          ? (darkMode 
                              ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-blue-900/30 border-blue-900/40 hover:border-blue-500/60' 
                              : 'bg-gradient-to-br from-white via-blue-50/50 to-blue-100/80 border-blue-200 hover:border-blue-400')
                          : (darkMode 
                              ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-green-900/30 border-green-900/40 hover:border-green-500/60' 
                              : 'bg-gradient-to-br from-white via-green-50/50 to-green-100/80 border-green-200 hover:border-green-400')
                      }`}
                      onClick={() => onProductClick(product._id || product.id)}
                    >
                      {/* Image Section - Takes up 60% of height */}
                      <div className="relative h-[60%] w-full overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={e => {
                            e.target.src = '/Picture2.png';
                          }}
                        />
                        
                        {/* Badges Overlay */}
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                          <div className="flex flex-col gap-2">
                            {product.featured && (
                              <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse hover:animate-none hover:scale-110 transition-all duration-300 border border-yellow-300">
                                <Star className="w-3 h-3 fill-current animate-spin" style={{animationDuration: '3s'}} />
                                <span className="tracking-wide">FEATURED</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-yellow-600/20 rounded-full animate-ping"></div>
                              </div>
                            )}
                            {product.preOrder && (
                              <div className={`text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg hover:scale-110 transition-all duration-300 border relative overflow-hidden ${
                                type === 'clothes' 
                                  ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 border-blue-400' 
                                  : 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 border-green-400'
                              }`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer"></div>
                                <Zap className="w-3 h-3 animate-bounce" />
                                <span className="tracking-wide">PRE-ORDER</span>
                              </div>
                            )}
                            {isDiscounted && (
                              <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hover:scale-110 transition-all duration-300 border border-red-400 animate-bounce">
                                <span className="tracking-wide">-{product.discount.percentage}% OFF</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stock Status */}
                        {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse border border-orange-300">
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                              Only {product.stockQuantity} left!
                            </span>
                          </div>
                        )}
                        {product.stockQuantity === 0 && (
                          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-red-600 to-red-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-red-400 animate-bounce">
                            Out of Stock
                          </div>
                        )}
                      </div>

                      {/* Content Section - Takes up 40% of height */}
                      <div className="h-[40%] p-3 flex flex-col justify-between">
                        {/* Product Name */}
                        <h4 className={`font-bold text-sm leading-tight mb-2 line-clamp-2 transition-colors duration-300 group-hover:scale-105 ${
                          darkMode ? 'text-white group-hover:text-blue-200' : 'text-gray-900 group-hover:text-blue-700'
                        }`} title={product.name}>
                          {product.name}
                        </h4>

                        {/* Rating and Reviews */}
                        <div className="mb-2">
                          {product.averageRating > 0 ? (
                            <div className="flex items-center gap-2 mb-1 group-hover:scale-105 transition-transform duration-300">
                              <div className="flex animate-fadeIn">
                                {renderStars(product.averageRating)}
                              </div>
                              <span className={`text-xs font-semibold ${
                                darkMode ? 'text-yellow-400' : 'text-yellow-600'
                              }`}>
                                {product.averageRating.toFixed(1)}
                              </span>
                              {product.ratings?.length > 0 && (
                                <span className={`text-xs ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  ({product.ratings.length})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mb-1 opacity-60">
                              <span className={`text-xs ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                No reviews yet
                              </span>
                            </div>
                          )}
                          
                          {/* Important Product Info */}
                          <div className="flex flex-wrap gap-1">
                            {product.stockQuantity > 5 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 animate-fadeIn">
                                In Stock
                              </span>
                            )}
                            {product.specs?.warranty && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 animate-slideIn">
                                {product.specs.warranty} Warranty
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price Section */}
                        <div className="flex items-center justify-between animate-slideUp">
                          <div className="flex items-center gap-2">
                            {isDiscounted ? (
                              <>
                                <span className={`font-bold text-lg transition-all duration-300 group-hover:scale-110 ${
                                  type === 'clothes'
                                    ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                                    : (darkMode ? 'text-green-400' : 'text-green-600')
                                }`}>
                                  ${typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
                                </span>
                                <span className={`text-sm line-through opacity-75 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  ${typeof originalPrice === 'number' ? originalPrice.toFixed(2) : originalPrice}
                                </span>
                              </>
                            ) : (
                              <span className={`font-bold text-lg transition-all duration-300 group-hover:scale-110 ${
                                type === 'clothes'
                                  ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                                  : (darkMode ? 'text-green-400' : 'text-green-600')
                              }`}>
                                ${typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
                              </span>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add your cart logic here
                              console.log('Add to cart:', product._id);
                            }}
                            disabled={product.stockQuantity === 0}
                            className={`p-2.5 rounded-full transition-all duration-300 hover:scale-125 hover:rotate-12 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden ${
                              type === 'clothes'
                                ? (darkMode 
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white' 
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white')
                                : (darkMode 
                                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white' 
                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white')
                            } shadow-lg hover:shadow-xl`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                            <ShoppingBag className="w-4 h-4 relative z-10 group-hover/btn:animate-bounce" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          {products.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onPrev(); }}
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full ${
                  darkMode ? 'bg-gray-800/90 hover:bg-gray-700 text-white' : 'bg-white/90 hover:bg-gray-100 text-gray-900'
                } shadow-xl transition-all duration-200 hover:scale-110 z-20 backdrop-blur-sm`}
                aria-label="Previous product"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onNext(); }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full ${
                  darkMode ? 'bg-gray-800/90 hover:bg-gray-700 text-white' : 'bg-white/90 hover:bg-gray-100 text-gray-900'
                } shadow-xl transition-all duration-200 hover:scale-110 z-20 backdrop-blur-sm`}
                aria-label="Next product"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={e => {
                      e.stopPropagation();
                      type === 'clothes' ? setClothesIndex(index) : setAccessoriesIndex(index);
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-200 border-2 ${
                      index === currentIndex
                        ? (type === 'clothes'
                            ? 'bg-blue-500 border-blue-500 scale-125 shadow-lg'
                            : 'bg-green-500 border-green-500 scale-125 shadow-lg')
                        : (darkMode
                            ? 'bg-gray-600/50 border-gray-500 hover:bg-gray-500'
                            : 'bg-white/50 border-gray-300 hover:bg-gray-200')
                    } backdrop-blur-sm`}
                    aria-label={`Go to product ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('shopsection.noProducts')}
          </p>
        </div>
      )}
    </div>
  );
};

  return (
    <div className={`absolute inset-0 transition-colors duration-500 mb-20 ${
      darkMode
        ? 'bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-900/90'
        : 'bg-gradient-to-b from-white via-white/95 to-white/90'
    }`}>
      <div
        className={`w-full h-full transition-all duration-700 ${
          isActive
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Layout: Video top 1/4, Two components bottom 3/4 */}
        <div className="h-full flex flex-col">
          {/* Video Section */}
          <div className={`h-[clamp(100px,20vh,160px)] relative z-20 ${
            isActive
              ? 'animate-floatOnce'
              : 'opacity-0 translate-y-8'
          }`}>
            <div className="w-full h-full relative overflow-hidden">
              <video
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                onCanPlay={e => {
                  if (e.target.paused) {
                    try { e.target.play(); } catch {}
                  }
                }}
              >
                <source src="/GymTonic.mp4" type="video/mp4" />
              </video>
              {/* Video Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 lg:pt-20 xl:pt-32 lg:justify-end lg:pb-10 text-center px-4 z-30">
                <div
                  className={`inline-flex items-center gap-2 px-3 rounded-full mb-3 font-semibold transition-all duration-1000 delay-300
                  ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  bg-blue-500/20 text-white
                  text-xs sm:text-sm md:text-base lg:text-sm xl:text-xs
                `}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '0 0 2px #000, 0 0 8px #000'
                }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t('shopsection.premiumStore')}
                </div>
                <h2
                  className={`font-bold mb-3 transition-all duration-1000 delay-500
                  ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  text-white
                  text-xl sm:text-2xl md:text-4xl lg:text-3xl xl:text-2xl
                `}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '0 0 2px #000, 0 0 8px #000'
                }}
                >
                  {t('shopsection.premiumShop')}
                </h2>
                <p
                  className={`max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-700
                  ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                  text-white
                  text-xs sm:text-sm md:text-base lg:text-sm xl:text-xs
                `}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '0 0 2px #000, 0 0 8px #000'
                }}
                >
                  {t('shopsection.discover')}
                </p>
              </div>
            </div>
          </div>
          {/* Two Components Section - Clothes & Accessories */}
          <div
            className="flex-1 flex flex-col md:flex-row relative z-10"
            style={{
              minHeight: 0,
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Left Component - Clothes */}
            <div className="w-full md:w-1/2 flex-1 p-2 sm:p-4 lg:p-6 flex items-center justify-center">
              <div className={`h-full w-full rounded-2xl group relative overflow-hidden transition-all duration-800 ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-blue-900/20'
                  : 'bg-gradient-to-br from-gray-50 via-gray-100 to-blue-50'
              } shadow-xl border ${
                isActive
                  ? (darkMode ? 'hover:shadow-2xl hover:scale-[1.02] hover:border-blue-500/50' : 'hover:shadow-2xl hover:scale-[1.02] hover:border-blue-300')
                  : ''
              } ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              } ${
                isActive
                  ? 'animate-slideDownFromVideo'
                  : 'opacity-0 invisible'
              }`}
              style={{
                animationDelay: isActive ? '0.3s' : '0s',
                animationFillMode: 'both',
                minHeight: 'clamp(220px,32vh,400px)',
                maxHeight: '100%',
                minWidth: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      darkMode ? 'bg-blue-900/80 text-blue-200' : 'bg-blue-100 text-blue-800'
                    }`}>
                      <Shirt className="w-3 h-3" />
                      {t('shopsection.gymClothes')}
                    </div>
                    <button
                      onClick={() => onNavigate('/shop?category=clothes')}
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                        darkMode
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Product Carousel */}
                <div className="flex-1 flex items-center justify-center pt-16 pb-4">
                  <ProductCarousel
                    products={clothesProducts}
                    currentIndex={clothesIndex}
                    onNext={nextClothes}
                    onPrev={prevClothes}
                    loading={clothesLoading}
                    type="clothes"
                    onProductClick={handleProductClick}
                  />
                </div>
              </div>
            </div>
            {/* Right Component - Accessories */}
            <div className="w-full md:w-1/2 flex-1 p-2 sm:p-4 lg:p-6 flex items-center justify-center mb-14 md:mb-0">
              <div className={`h-full w-full rounded-2xl group relative overflow-hidden transition-all duration-800 ${
                darkMode
                  ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-green-900/20'
                  : 'bg-gradient-to-br from-gray-50 via-gray-100 to-green-50'
              } shadow-xl border ${
                isActive
                  ? (darkMode ? 'hover:shadow-2xl hover:scale-[1.02] hover:border-green-500/50' : 'hover:shadow-2xl hover:scale-[1.02] hover:border-green-300')
                  : ''
              } ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              } ${
                isActive
                  ? 'animate-slideDownFromVideo'
                  : 'opacity-0 invisible'
              }`}
              style={{
                animationDelay: isActive ? '0.6s' : '0s',
                animationFillMode: 'both',
                minHeight: 'clamp(220px,32vh,400px)',
                maxHeight: '100%',
                minWidth: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      darkMode ? 'bg-green-900/80 text-green-200' : 'bg-green-100 text-green-800'
                    }`}>
                      <Watch className="w-3 h-3" />
                      {t('shopsection.accessories')}
                    </div>
                    <button
                      onClick={() => onNavigate('/shop?category=accessories')}
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                        darkMode
                          ? 'bg-green-600 hover:bg-green-500 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Product Carousel */}
                <div className="flex-1 flex items-center justify-center pt-16 pb-4">
                  <ProductCarousel
                    products={accessoriesProducts}
                    currentIndex={accessoriesIndex}
                    onNext={nextAccessories}
                    onPrev={prevAccessories}
                    loading={accessoriesLoading}
                    type="accessories"
                    onProductClick={handleProductClick}
                  />
                </div>
              </div>
            </div>
            {/* End Two Components */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopSection;
