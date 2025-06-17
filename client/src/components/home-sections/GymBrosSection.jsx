import React from 'react';
import { ArrowRight, Heart, Users, MessageCircle, Dumbbell, MapPin, Calendar, Zap, UserPlus, Target } from 'lucide-react';

const GymBrosSection = ({ onNavigate, isActive }) => {
  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/GymTonic.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70"></div>
      
      <div 
        className={`relative z-10 h-full w-full flex flex-col transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Header Section - Top Third */}
        <div className="flex-none h-1/3 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="text-center max-w-6xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-blue-400/30">
              <Users className="w-4 h-4" />
              Fitness Community
            </div>
            
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                GymBros
              </span>
            </h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Find Your Perfect Workout Partner
            </h3>
            
            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-white/80 max-w-4xl mx-auto leading-relaxed">
              Connect with like-minded fitness enthusiasts through our intelligent matching system
            </p>
          </div>
        </div>

        {/* Video Section - Middle Third */}
        <div className="flex-none h-1/3 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/20 shadow-2xl backdrop-blur-sm">
              {/* Video placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white/80 text-lg font-semibold">GymBros Matching Demo</p>
                  <p className="text-white/50 text-sm mt-1">See how it works</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - Bottom Third */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8">
          <div className="h-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
              
              {/* Benefits Column */}
              <div className="flex flex-col">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  Why GymBros?
                </h3>
                
                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Smart Matching</h4>
                      <p className="text-white/70 text-xs">Algorithm matches based on goals and preferences</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Accountability</h4>
                      <p className="text-white/70 text-xs">Stay motivated with workout partners</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Community</h4>
                      <p className="text-white/70 text-xs">Share progress and celebrate together</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Column */}
              <div className="flex flex-col">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-white" />
                  </div>
                  How It Works
                </h3>
                
                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Create Profile</h4>
                      <p className="text-white/70 text-xs">Set your goals and preferences</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Discover Matches</h4>
                      <p className="text-white/70 text-xs">Browse compatible workout partners</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Connect & Chat</h4>
                      <p className="text-white/70 text-xs">Start conversations and plan sessions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Workout Together</h4>
                      <p className="text-white/70 text-xs">Train and build lasting friendships</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-4">
                  <button
                    onClick={() => onNavigate('/gymbros')}
                    className="group w-full sm:w-auto mx-auto flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-full hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    <Users className="w-5 h-5" />
                    <span>Find Your GymBro</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymBrosSection;
