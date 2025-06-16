import React from 'react';
import { ArrowRight, TrendingUp, Target, Award, BarChart3 } from 'lucide-react';

const GymBrosSection = ({ onNavigate, isActive }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
      <div 
        className={`max-w-5xl mx-auto text-center transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-10 border border-purple-300/30 shadow-2xl pointer-events-auto">
          {/* Tracking Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <TrendingUp className="w-4 h-4" />
            Progress Tracking
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent">
            Track Your Gains
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Monitor your progress, set new records, and celebrate achievements. Our intelligent tracking helps you visualize your journey and stay motivated.
          </p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-300/20">
              <BarChart3 className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <div className="text-purple-200 text-sm">Workout Analytics</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-300/20">
              <Target className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <div className="text-purple-200 text-sm">Goal Setting</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-300/20">
              <Award className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <div className="text-purple-200 text-sm">Achievements</div>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('/gymbros')}
            className="group relative overflow-hidden px-12 py-5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg rounded-full flex items-center gap-3 mx-auto hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            <TrendingUp className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Track Gains</span>
            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GymBrosSection;
