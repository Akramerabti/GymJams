import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Star, Zap, Shirt, Watch, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import productService from '../../services/product.service';
import { formatImageUrl } from '../../utils/imageUtils';

const ShopSection = ({ onNavigate, isActive }) => {
  const { darkMode } = useTheme();
  const [clothesProducts, setClothesProducts] = useState([]);
  const [accessoriesProducts, setAccessoriesProducts] = useState([]);
  const [clothesLoading, setClothesLoading] = useState(true);
  const [accessoriesLoading, setAccessoriesLoading] = useState(true);
  const [clothesIndex, setClothesIndex] = useState(0);
  const [accessoriesIndex, setAccessoriesIndex] = useState(0);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        // Filter products by category (assuming we have category field)
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

  const ProductCarousel = ({ products, currentIndex, onNext, onPrev, loading, type, onProductClick }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);

    const handleTouchStart = (e) => {
      e.stopPropagation(); // Prevent interfering with main page navigation
      setIsDragging(true);
      setDragStart(e.touches[0].clientX);
      setDragOffset(0);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.stopPropagation(); // Prevent interfering with main page navigation
      const currentX = e.touches[0].clientX;
      const diff = dragStart - currentX;
      setDragOffset(diff);
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      e.stopPropagation(); // Prevent interfering with main page navigation
      setIsDragging(false);
      
      const threshold = 50; // Minimum drag distance to trigger navigation
      
      if (Math.abs(dragOffset) > threshold) {
        if (dragOffset > 0) {
          // Dragged left, go to next
          onNext();
        } else {
          // Dragged right, go to previous
          onPrev();
        }
      }
      
      setDragOffset(0);
    };

    const handleMouseDown = (e) => {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart(e.clientX);
      setDragOffset(0);
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.stopPropagation();
      const currentX = e.clientX;
      const diff = dragStart - currentX;
      setDragOffset(diff);
    };

    const handleMouseUp = (e) => {
      if (!isDragging) return;
      e.stopPropagation();
      setIsDragging(false);
      
      const threshold = 50;
      
      if (Math.abs(dragOffset) > threshold) {
        if (dragOffset > 0) {
          onNext();
        } else {
          onPrev();
        }
      }
      
      setDragOffset(0);
    };

    // Add mouse event listeners to document when dragging
    useEffect(() => {
      if (isDragging) {
        const handleMouseMoveGlobal = (e) => handleMouseMove(e);
        const handleMouseUpGlobal = (e) => handleMouseUp(e);
        
        document.addEventListener('mousemove', handleMouseMoveGlobal);
        document.addEventListener('mouseup', handleMouseUpGlobal);
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMoveGlobal);
          document.removeEventListener('mouseup', handleMouseUpGlobal);
        };
      }
    }, [isDragging]);

    return (
      <div className="relative h-full">
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
              className="flex h-full cursor-grab active:cursor-grabbing select-none touch-pan-x"
              style={{ 
                transform: `translateX(-${currentIndex * 100}%) translateX(-${dragOffset * 0.5}px)`,
                transition: isDragging ? 'none' : 'transform 0.5s ease-in-out'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
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
                  <div key={product._id} className="w-full flex-shrink-0 flex flex-col items-center justify-center h-full px-4">
                    <div className="text-center pointer-events-auto cursor-pointer" onClick={() => onProductClick(product._id)}>
                      <img 
                        src={imageUrl}
                        alt={product.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto mb-4 rounded-lg object-cover shadow-md hover:shadow-lg transition-shadow duration-300"
                        onError={(e) => {
                          e.target.src = '/Picture2.png';
                        }}
                      />
                      <h4 className={`font-bold text-sm sm:text-base lg:text-lg mb-2 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {product.name}
                      </h4>
                      <p className={`text-lg sm:text-xl font-semibold mb-3 ${
                        type === 'clothes' 
                          ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                          : (darkMode ? 'text-green-400' : 'text-green-600')
                      }`}>
                        ${product.price?.toFixed(2) || '0.00'}
                      </p>
                      <div className="flex items-center justify-center gap-1 mb-4">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} className={`w-3 h-3 fill-yellow-400 text-yellow-400`} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Controls */}
            {products.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onPrev(); }}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                    darkMode ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-white/90 hover:bg-gray-100 text-gray-900'
                  } shadow-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 pointer-events-auto z-10`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); onNext(); }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                    darkMode ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-white/90 hover:bg-gray-100 text-gray-900'
                  } shadow-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 pointer-events-auto z-10`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto z-10">
                  {products.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        type === 'clothes' ? setClothesIndex(index) : setAccessoriesIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentIndex
                          ? (type === 'clothes' 
                              ? 'bg-blue-500 scale-125' 
                              : 'bg-green-500 scale-125')
                          : (darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400')
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No products available
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
        {/* Layout: Video top 1/3, Two components bottom 2/3 */}
        <div className="h-full flex flex-col pointer-events-none">
          
          {/* Video Section - 1/3 height */}
          <div className={`h-1/3 relative z-20 ${
            isActive 
              ? 'animate-floatOnce' 
              : 'opacity-0 translate-y-8'
          }`}>
            <div className="w-full h-full relative overflow-hidden">
              <video
                autoPlay
                muted
                loop
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              >
                <source src="/GymTonic.mp4" type="video/mp4" />
              </video>
              
              {/* Overlay */}
              <div className={`absolute inset-0 ${
                darkMode 
                  ? 'bg-black bg-opacity-60' 
                  : 'bg-white bg-opacity-60'
              }`}></div>
              
              {/* Video Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-3 transition-all duration-1000 delay-300 ${
                  isActive 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                } ${
                  darkMode 
                    ? 'bg-blue-500/20 text-blue-200' 
                    : 'bg-blue-500/20 text-blue-800'
                }`}>
                  <ShoppingBag className="w-4 h-4" />
                  Premium Equipment Store
                </div>
                
                <h2 className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-3 transition-all duration-1000 delay-500 ${
                  isActive 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                } ${
                  darkMode 
                    ? 'text-white bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent' 
                    : 'text-gray-900 bg-gradient-to-r from-blue-600 to-gray-900 bg-clip-text text-transparent'
                }`}>
                  Premium Equipment Shop
                </h2>
                
                <p className={`text-sm md:text-lg max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-700 ${
                  isActive 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                } ${
                  darkMode ? 'text-white/90' : 'text-gray-700'
                }`}>
                  Discover professional-grade fitness equipment and apparel
                </p>
              </div>
            </div>
          </div>

          {/* Two Components Section - 2/3 height - Mobile: Stack vertically */}
          <div className="h-2/3 flex flex-col md:flex-row relative z-10 pointer-events-none">
            
            {/* Left Component - Clothes */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full p-3 sm:p-4 lg:p-6 pointer-events-auto">
              <div className={`h-full rounded-2xl group relative overflow-hidden transition-all duration-800 ${
                darkMode 
                  ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-blue-900/20' 
                  : 'bg-gradient-to-br from-gray-50 via-gray-100 to-blue-50'
              } shadow-xl border hover:shadow-2xl hover:scale-[1.02] ${
                darkMode ? 'border-gray-700 hover:border-blue-500/50' : 'border-gray-200 hover:border-blue-300'
              } ${
                isActive 
                  ? 'animate-slideDownFromVideo' 
                  : 'opacity-0 invisible pointer-events-none'
              }`}
              style={{ 
                animationDelay: isActive ? '0.3s' : '0s',
                animationFillMode: 'both'
              }}>
                
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      darkMode ? 'bg-blue-900/80 text-blue-200' : 'bg-blue-100 text-blue-800'
                    }`}>
                      <Shirt className="w-3 h-3" />
                      Gym Clothes
                    </div>

                    <button
                      onClick={() => onNavigate('/shop?category=clothes')}
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 pointer-events-auto ${
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
                <div className="h-full pt-16 pb-4">
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
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Premium Quality</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className={`w-3 h-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Top Rated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Component - Accessories */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full p-3 sm:p-4 lg:p-6 pointer-events-auto">
              <div className={`h-full rounded-2xl group relative overflow-hidden transition-all duration-800 ${
                darkMode 
                  ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-green-900/20' 
                  : 'bg-gradient-to-br from-gray-50 via-gray-100 to-green-50'
              } shadow-xl border hover:shadow-2xl hover:scale-[1.02] ${
                darkMode ? 'border-gray-700 hover:border-green-500/50' : 'border-gray-200 hover:border-green-300'
              } ${
                isActive 
                  ? 'animate-slideDownFromVideo' 
                  : 'opacity-0 invisible pointer-events-none'
              }`}
              style={{ 
                animationDelay: isActive ? '0.6s' : '0s',
                animationFillMode: 'both'
              }}>
                
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      darkMode ? 'bg-green-900/80 text-green-200' : 'bg-green-100 text-green-800'
                    }`}>
                      <Watch className="w-3 h-3" />
                      Accessories
                    </div>

                    <button
                      onClick={() => onNavigate('/shop?category=accessories')}
                      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 pointer-events-auto ${
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
                <div className="h-full pt-16 pb-4">
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
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Durable</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className={`w-3 h-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Pro Equipment</span>
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

export default ShopSection;
