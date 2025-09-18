import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, TrendingUp, Package, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import productService from '../../services/product.service';
import { getFirstProductImageUrl } from '../../utils/imageUtils';

const ShopSection = ({ isActive, onNavigate, darkMode }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState({ clothes: [], accessories: [] });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('clothes');
const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getProducts();
        const allProducts = response.data || [];

        const clothesProducts = allProducts.filter(product => 
          product.category?.toLowerCase().includes('clothes') || 
          product.category?.toLowerCase().includes('apparel') ||
          product.name?.toLowerCase().includes('shirt') ||
          product.name?.toLowerCase().includes('shorts')
        ).slice(0, 8);
        
        const accessoriesProducts = allProducts.filter(product => 
          product.category?.toLowerCase().includes('accessories') ||
          product.category?.toLowerCase().includes('equipment') ||
          product.name?.toLowerCase().includes('bottle') ||
          product.name?.toLowerCase().includes('gloves')
        ).slice(0, 8);

        // Fallback if no specific categories found
        if (clothesProducts.length === 0 && accessoriesProducts.length === 0) {
          const half = Math.ceil(allProducts.length / 2);
          setProducts({
            clothes: allProducts.slice(0, half).slice(0, 8),
            accessories: allProducts.slice(half).slice(0, 8)
          });
        } else {
          setProducts({
            clothes: clothesProducts,
            accessories: accessoriesProducts
          });
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isActive) {
    fetchProducts();
    // Add a small delay to allow scroll animation to complete
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, 500); // Adjust this delay as needed
    
    return () => clearTimeout(timer);
  } else {
    setShouldAnimate(false);
  }
}, [isActive]);

  const categories = [
    { id: 'clothes', label: t('shopsection.gymClothes'), icon: Package },
    { id: 'accessories', label: t('shopsection.accessories'), icon: ShoppingBag }
  ];

  const renderProduct = (product) => {
    // Use the new helper function to get the first image URL
    const imageUrl = getFirstProductImageUrl(product, '/Picture2.png');

    const isDiscounted = product.discount?.percentage && 
      (!product.discount.startDate || new Date(product.discount.startDate) <= new Date()) &&
      (!product.discount.endDate || new Date(product.discount.endDate) >= new Date());

    return (
      <div
        key={product._id || product.id}
        onClick={() => onNavigate(`/product/${product._id || product.id}`)}
        className={`group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg hover:shadow-xl`}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.target.src = '/Picture2.png'; }}
          />
          
          {/* Color indicator */}
          {product.colors && product.colors.length > 0 && (
            <div className="absolute top-2 right-2 flex gap-1">
              {product.colors.slice(0, 3).map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border border-white/50 shadow-sm"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-xs text-white bg-black/50 rounded-full px-1">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.featured && (
              <span className="px-2 py-1 rounded-full bg-yellow-500 text-white text-xs font-bold">
                FEATURED
              </span>
            )}
            {isDiscounted && (
              <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                -{product.discount.percentage}%
              </span>
            )}
            {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
              <span className="px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold animate-pulse">
                {product.stockQuantity} left
              </span>
            )}
            {/* Gender indicator for clothes */}
            {product.category?.toLowerCase() === 'clothes' && product.gender && (
              <span className={`px-2 py-1 rounded-full text-white text-xs font-bold ${
                product.gender === 'Men' ? 'bg-blue-500' : 
                product.gender === 'Women' ? 'bg-pink-500' : 'bg-purple-500'
              }`}>
                {product.gender}
              </span>
            )}
          </div>

          {product.stockQuantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-sm font-bold">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {product.name}
          </h3>
          
          {/* Rating */}
          {product.averageRating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {product.averageRating.toFixed(1)}
              </span>
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDiscounted ? (
                <>
                  <span className="text-lg font-bold text-green-500">
                    ${product.discountedPrice?.toFixed(2) || product.price?.toFixed(2)}
                  </span>
                  <span className={`text-sm line-through ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    ${product.price?.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className={`text-lg font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  ${product.price?.toFixed(2) || '0.00'}
                </span>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Add to cart logic
              }}
              disabled={product.stockQuantity === 0}
              className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div >
      {/* Background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-900 via-indigo-900/30 to-purple-900/30' 
            : 'bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/50'
        }`}></div>
        
        {/* Animated shapes */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Content */}
      <div className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-40 transition-all duration-1000 ${
  shouldAnimate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              {t('shopsection.premiumStore')}
            </span>
          </div>
          
          <h2 className={`text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${shouldAnimate ? 'animate-fade-in' : ''}`}>
            {t('shopsection.premiumShop')}
          </h2>
          
          <p className={`text-md ${darkMode ? 'text-gray-300' : 'text-gray-700'} max-w-2xl mx-auto ${shouldAnimate ? 'animate-fade-in animation-delay-200' : ''}`}>
            {t('shopsection.discover')}
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                  : darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <category.icon className="w-5 h-5" />
              <span className="font-semibold">{category.label}</span>
            </button>
          ))}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products[activeCategory].map(renderProduct)}
          </div>
        )}

        {/* View all button */}
        <div className="text-center mt-8">
          <button
            onClick={() => onNavigate(`/shop?category=${activeCategory}`)}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span>{t('shopsection.viewAll')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
};

export default ShopSection;