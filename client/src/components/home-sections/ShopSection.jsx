import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Star, Zap, Shirt, Watch, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import productService from '../../services/product.service';
import { formatImageUrl } from '../../utils/imageUtils';
import { useTranslation } from 'react-i18next';

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
  // --- Clamp and Responsive Carousel Card Sizing ---
  const carouselCardStyle = {
    aspectRatio: '1 / 1',
    width: 'clamp(140px, 28vw, 220px)',
    height: 'clamp(140px, 28vw, 220px)',
    maxWidth: '100%',
    maxHeight: '100%',
    minWidth: '120px',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
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
    return (
      <div className="relative h-full flex items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
              darkMode ? 'border-blue-400' : 'border-blue-600'
            }`}></div>
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Product Display */}
            <div
              className="flex h-full items-center justify-center transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
                minHeight: '0',
                minWidth: '0'
              }}
            >
              {products.map((product, index) => {
                let imageUrl = '/Picture2.png';
                if (product.images && product.images.length > 0) {
                  const imagePath = product.images[0];
                  if (imagePath.startsWith('http')) {
                    imageUrl = imagePath;
                  } else {
                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    imageUrl = `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
                  }
                }

                return (
                  <div
                    key={product._id}
                    className="flex-shrink-0 flex flex-col items-center justify-center px-2"
                    style={carouselCardStyle}
                  >
                    <div
                      className="relative group bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 rounded-xl shadow-lg border border-blue-200 dark:border-blue-900/40 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
                      style={{
                        ...carouselCardStyle,
                        padding: 'clamp(0.5rem,2vw,1.2rem)'
                      }}
                      onClick={() => onProductClick(product._id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${product.name}`}
                    >
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg mb-2 transition-all duration-300"
                        style={{
                          aspectRatio: '1 / 1',
                          width: '100%',
                          height: '100%',
                          minWidth: '80px',
                          minHeight: '80px',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover'
                        }}
                        onError={e => {
                          e.target.src = '/Picture2.png';
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80 rounded-full px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-200 shadow">
                        {type === 'clothes' ? <Shirt className="inline w-3 h-3 mr-1" /> : <Watch className="inline w-3 h-3 mr-1" />}
                        {type === 'clothes' ? t('shopsection.clothes') : t('shopsection.accessory')}
                      </div>
                    </div>
                    <h4
                      className={`font-bold text-xs sm:text-sm lg:text-base mt-2 mb-1 text-center truncate max-w-[90%] ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      title={product.name}
                    >
                      {product.name}
                    </h4>
                    <p
                      className={`text-base sm:text-lg font-semibold mb-1 ${
                        type === 'clothes'
                          ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                          : (darkMode ? 'text-green-400' : 'text-green-600')
                      }`}
                    >
                      ${product.price?.toFixed(2) || '0.00'}
                    </p>
                    <div className="flex items-center justify-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Controls */}
            {products.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); onPrev(); }}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                    darkMode ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-white/90 hover:bg-gray-100 text-gray-900'
                  } shadow-lg transition-all duration-200 hover:scale-110 z-10`}
                  aria-label="Previous product"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onNext(); }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                    darkMode ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-white/90 hover:bg-gray-100 text-gray-900'
                  } shadow-lg transition-all duration-200 hover:scale-110 z-10`}
                  aria-label="Next product"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {products.map((_, index) => (
                    <button
                      key={index}
                      onClick={e => {
                        e.stopPropagation();
                        type === 'clothes' ? setClothesIndex(index) : setAccessoriesIndex(index);
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-200 border ${
                        index === currentIndex
                          ? (type === 'clothes'
                              ? 'bg-blue-500 border-blue-500 scale-125 shadow'
                              : 'bg-green-500 border-green-500 scale-125 shadow')
                          : (darkMode
                              ? 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                              : 'bg-gray-300 border-gray-300 hover:bg-gray-400')
                      }`}
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
    <div className={`absolute inset-0 transition-colors duration-500 ${
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
        <div className="h-full flex flex-col pointer-events-none">
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
            className="flex-1 flex flex-col md:flex-row relative z-10 pointer-events-none"
            style={{
              minHeight: '0',
              maxHeight: '100%',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Left Component - Clothes */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full p-2 sm:p-4 lg:p-6 flex items-center justify-center">
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
                {/* Features Footer */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Zap className={`w-3 h-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{t('shopsection.premiumQuality')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className={`w-3 h-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{t('shopsection.topRated')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Component - Accessories */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full p-2 sm:p-4 lg:p-6 flex items-center justify-center mb-14 md:mb-0">
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
                {/* Features Footer */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Zap className={`w-3 h-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{t('shopsection.durable')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className={`w-3 h-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{t('shopsection.proEquipment')}</span>
                    </div>
                  </div>
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
