import React from 'react';
import { ArrowRight, ShoppingBag, Star, Zap, Shirt, Watch } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ShopSection = ({ onNavigate, isActive }) => {
  const { darkMode } = useTheme();

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
        <div className="h-full flex flex-col pointer-events-auto">
          
          {/* Video Section - 1/3 height */}
          <div className="h-1/3 relative">
            <div className="w-full h-full relative overflow-hidden">
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
              }`}></div>
              
              {/* Video Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-white px-3 py-1 rounded-full text-sm font-semibold mb-3">
                  <Star className="w-4 h-4" />
                  Premium Equipment Store
                </div>
                
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                  Premium Equipment Shop
                </h2>
                
                <p className="text-sm md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
                  Discover professional-grade fitness equipment for home and commercial gyms
                </p>
              </div>
            </div>
          </div>

          {/* Two Components Section - 2/3 height */}
          <div className="h-2/3 flex flex-row">
            
            {/* Left Component - Clothes */}
            <div className="w-1/2 h-full p-3 sm:p-4 lg:p-6">
              <div className={`h-full rounded-2xl ${
                darkMode 
                  ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-white/5' 
                  : 'bg-gradient-to-br from-gray-50 via-gray-100 to-black/5'
              } p-4 sm:p-6 flex flex-col items-center justify-center shadow-xl border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                
                {/* Clothes Icon */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full ${
                  darkMode ? 'bg-blue-900' : 'bg-blue-100'
                } flex items-center justify-center mb-4 sm:mb-6`}>
                  <Shirt className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                
                {/* Title */}
                <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-center ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Gym Clothes
                </h3>
                
                {/* Description */}
                <p className={`text-sm sm:text-base text-center mb-4 sm:mb-6 max-w-xs ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Premium athletic wear for maximum performance and comfort
                </p>
                
                {/* Features */}
                <div className="flex flex-col gap-2 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Zap className={`w-3 h-3 sm:w-4 sm:h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Moisture-wicking</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Star className={`w-3 h-3 sm:w-4 sm:h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Premium fabrics</span>
                  </div>
                </div>
                
                {/* Button */}
                <button
                  onClick={() => onNavigate('/shop?category=clothes')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-lg flex items-center gap-2 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white hover:shadow-blue-500/50' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-blue-500/50'
                  }`}
                >
                  <Shirt className="w-4 h-4" />
                  Shop Clothes
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Right Component - Accessories */}
            <div className="w-1/2 h-full p-3 sm:p-4 lg:p-6">
              <div className={`h-full rounded-2xl ${
                darkMode 
                  ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-white/5' 
                  : 'bg-gradient-to-br from-gray-50 via-gray-100 to-black/5'
              } p-4 sm:p-6 flex flex-col items-center justify-center shadow-xl border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                
                {/* Accessories Icon */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full ${
                  darkMode ? 'bg-green-900' : 'bg-green-100'
                } flex items-center justify-center mb-4 sm:mb-6`}>
                  <Watch className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                
                {/* Title */}
                <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-center ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Accessories
                </h3>
                
                {/* Description */}
                <p className={`text-sm sm:text-base text-center mb-4 sm:mb-6 max-w-xs ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Essential gym accessories to enhance your workout experience
                </p>
                
                {/* Features */}
                <div className="flex flex-col gap-2 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Zap className={`w-3 h-3 sm:w-4 sm:h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Durable materials</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Star className={`w-3 h-3 sm:w-4 sm:h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Pro equipment</span>
                  </div>
                </div>
                
                {/* Button */}
                <button
                  onClick={() => onNavigate('/shop?category=accessories')}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-lg flex items-center gap-2 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white hover:shadow-green-500/50' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-green-500/50'
                  }`}
                >
                  <Watch className="w-4 h-4" />
                  Shop Accessories
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopSection;
