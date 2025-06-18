import React from 'react';
import { ArrowRight, Heart, Users, MessageCircle, Dumbbell, MapPin, Calendar, Zap, UserPlus, Target } from 'lucide-react';

const GymBrosSection = ({ onNavigate, isActive }) => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
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
        className={`relative z-10 h-full w-full transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Large Screen Layout */}
        <div className="hidden lg:flex h-full">
          {/* Left Side - Header + Video */}
          <div className="w-1/2 flex flex-col justify-center items-center px-8 py-6">            {/* Header Section */}
            <div className={`text-center mb-8 transition-all duration-1000 ${
              isActive 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: isActive ? '200ms' : '0ms' }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-blue-400/30">
                <Users className="w-4 h-4" />
                Fitness Community
              </div>
              
              {/* Title */}
              <h2 className="text-5xl xl:text-6xl font-bold text-white mb-3">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  GymBros
                </span>
              </h2>
              <h3 className="text-2xl xl:text-3xl font-bold text-white mb-4">
                Find Your Perfect Workout Partner
              </h3>
              
              {/* Subtitle */}
              <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                Connect with like-minded fitness enthusiasts through our intelligent matching system
              </p>
            </div>            {/* Video Section - Right below headline */}
            <div className={`w-full max-w-md transition-all duration-1000 ${
              isActive 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-8 scale-95'
            }`} style={{ transitionDelay: isActive ? '400ms' : '0ms' }}>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/20 shadow-2xl backdrop-blur-sm">
                {/* Video placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-white/80 text-base font-semibold">GymBros Matching Demo</p>
                    <p className="text-white/50 text-sm mt-1">See how it works</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="w-1/2 flex items-center px-8 py-6">
            <div className="w-full max-w-xl">
              <div className="grid grid-cols-1 gap-8">
                  {/* Benefits Section */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-8'
                }`} style={{ transitionDelay: isActive ? '600ms' : '0ms' }}>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    Why GymBros?
                  </h3>
                  
                  <div className="space-y-4">
                    <div className={`flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '800ms' : '0ms' }}>
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">Smart Matching</h4>
                        <p className="text-white/70 text-sm">Algorithm matches based on goals and preferences</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '900ms' : '0ms' }}>
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">Accountability</h4>
                        <p className="text-white/70 text-sm">Stay motivated with workout partners</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '1000ms' : '0ms' }}>
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">Community</h4>
                        <p className="text-white/70 text-sm">Share progress and celebrate together</p>
                      </div>
                    </div>
                  </div>
                </div>                {/* How It Works Section */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-8'
                }`} style={{ transitionDelay: isActive ? '1100ms' : '0ms' }}>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    How It Works
                  </h3>
                  
                  <div className="space-y-3">
                    <div className={`flex items-start gap-3 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1200ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Create Profile</h4>
                        <p className="text-white/70 text-xs">Set your fitness goals and workout preferences</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-3 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1300ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Discover Matches</h4>
                        <p className="text-white/70 text-xs">Browse compatible workout partners near you</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-3 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1400ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Connect & Plan</h4>
                        <p className="text-white/70 text-xs">Start conversations and schedule workout sessions</p>
                      </div>                    </div>
                    
                    <div className={`flex items-start gap-3 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1500ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Workout Together</h4>
                        <p className="text-white/70 text-xs">Train together and build lasting fitness friendships</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95'
                }`} style={{ transitionDelay: isActive ? '1600ms' : '0ms' }}>
                  <button
                    onClick={() => onNavigate('/gymbros')}
                    className="group w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    <Users className="w-6 h-6" />
                    <span>Find Your GymBro</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden h-full flex flex-col">          {/* Header Section - Reduced height */}
          <div className="flex-none h-[20vh] min-h-[140px] max-h-[180px] flex items-center justify-center px-4 py-2">
            <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
              isActive 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: isActive ? '200ms' : '0ms' }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2 border border-blue-400/30">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Fitness Community
              </div>
              
              {/* Title - Reduced font sizes */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  GymBros
                </span>
              </h2>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">
                Find Your Perfect Workout Partner
              </h3>
              
              {/* Subtitle - Reduced */}
              <p className="text-xs sm:text-sm text-white/80 max-w-lg mx-auto leading-relaxed">
                Connect with like-minded fitness enthusiasts
              </p>
            </div>
          </div>          {/* Video Section - Much smaller and responsive like HeroSection */}
          <div className="flex-none h-[12vh] min-h-[80px] max-h-[100px] flex items-center justify-center px-4 py-10 mb-3">
            <div className={`w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] mx-auto transition-all duration-1000 ${
              isActive 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-8 scale-95'
            }`} style={{ transitionDelay: isActive ? '400ms' : '0ms' }}>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/20 shadow-lg backdrop-blur-sm">
                {/* Video placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-1 mx-auto">
                      <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-white" />
                    </div>
                    <p className="text-white/80 text-xs font-semibold">GymBros Demo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>          {/* Content Section - More height and better scrolling */}
          <div className="flex-1 min-h-0 overflow-hidden px-4 py-2 pb-6">
            <div className="h-full max-w-6xl mx-auto overflow-y-auto">
              <div className="flex flex-col gap-6">
                  {/* Benefits Section */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: isActive ? '600ms' : '0ms' }}>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2 flex-shrink-0">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                    Why GymBros?
                  </h3>
                  
                  <div className="space-y-3">
                    <div className={`flex items-start gap-3 p-3 rounded-lg bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '800ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm">Smart Matching</h4>
                        <p className="text-white/70 text-xs">Algorithm matches based on goals and preferences</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-3 p-3 rounded-lg bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '900ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm">Accountability</h4>
                        <p className="text-white/70 text-xs">Stay motivated with workout partners</p>
                      </div>
                    </div>
                      <div className={`flex items-start gap-3 p-3 rounded-lg bg-white/10 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm ${
                      isActive ? 'animate-fade-in-up' : ''
                    }`} style={{ animationDelay: isActive ? '1000ms' : '0ms' }}>
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm">Community</h4>
                        <p className="text-white/70 text-xs">Share progress and celebrate together</p>
                      </div>
                    </div>
                  </div>
                </div>                {/* How It Works Section */}
                <div className={`transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: isActive ? '1100ms' : '0ms' }}>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2 flex-shrink-0">
                    <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-3 h-3 text-white" />
                    </div>
                    How It Works
                  </h3>
                  
                  <div className="space-y-3">
                    <div className={`flex items-start gap-2 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1200ms' : '0ms' }}>
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                        1
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm">Create Profile</h4>
                        <p className="text-white/70 text-xs">Set your goals and preferences</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-2 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1300ms' : '0ms' }}>
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                        2
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm">Discover Matches</h4>
                        <p className="text-white/70 text-xs">Browse compatible workout partners</p>
                      </div>
                    </div>
                      <div className={`flex items-start gap-2 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1400ms' : '0ms' }}>
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                        3
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm">Connect & Chat</h4>
                        <p className="text-white/70 text-xs">Start conversations and plan sessions</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start gap-2 transition-all duration-500 ${
                      isActive 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-4'
                    }`} style={{ transitionDelay: isActive ? '1500ms' : '0ms' }}>
                      <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                        4
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm">Workout Together</h4>
                        <p className="text-white/70 text-xs">Train and build lasting friendships</p>
                      </div>
                    </div>
                  </div>
                </div>                {/* CTA Button with proper margin from bottom */}
                <div className={`pt-4 pb-4 transition-all duration-1000 ${
                  isActive 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95'
                }`} style={{ transitionDelay: isActive ? '1600ms' : '0ms' }}>
                  <button
                    onClick={() => onNavigate('/gymbros')}
                    className="group w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
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
