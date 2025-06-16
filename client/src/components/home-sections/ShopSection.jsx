import React from 'react';
import { ArrowRight, ShoppingBag, Star, Zap } from 'lucide-react';

const ShopSection = ({ onNavigate, isActive }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
      <div 
        className={`max-w-5xl mx-auto text-center transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-10 border border-indigo-300/30 shadow-2xl pointer-events-auto">
          {/* Premium Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star className="w-4 h-4" />
            Premium Equipment Store
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-indigo-200 to-white bg-clip-text text-transparent">
            Premium Equipment Shop
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover professional-grade fitness equipment for home and commercial gyms. Quality gear that lasts, designed for optimal performance.
          </p>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-indigo-200">
              <Zap className="w-5 h-5" />
              <span>Professional Grade</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <Star className="w-5 h-5" />
              <span>Premium Quality</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <ShoppingBag className="w-5 h-5" />
              <span>Fast Shipping</span>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('/shop')}
            className="group relative overflow-hidden px-12 py-5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold text-lg rounded-full flex items-center gap-3 mx-auto hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25"
          >
            <ShoppingBag className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Shop Now</span>
            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopSection;
