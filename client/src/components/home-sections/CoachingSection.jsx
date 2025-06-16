import React from 'react';
import { ArrowRight, Users, MessageCircle, Calendar, CheckCircle, UserCheck } from 'lucide-react';

const CoachingSection = ({ onNavigate, isActive }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
      <div 
        className={`max-w-5xl mx-auto text-center transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-10 border border-red-300/30 shadow-2xl pointer-events-auto">
          {/* Coach Badge */}
          <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-200 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <UserCheck className="w-4 h-4" />
            Certified Trainers
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-red-200 to-white bg-clip-text text-transparent">
            Expert Coaching
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your fitness journey with guidance from certified trainers. Personalized plans, real-time feedback, and continuous support.
          </p>
          
          {/* Coaching Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto">
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-300/20 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-red-300 flex-shrink-0" />
              <div className="text-left">
                <div className="text-red-200 font-semibold">Personalized Plans</div>
                <div className="text-red-200/70 text-sm">Custom workout schedules</div>
              </div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-300/20 flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-red-300 flex-shrink-0" />
              <div className="text-left">
                <div className="text-red-200 font-semibold">Real-time Support</div>
                <div className="text-red-200/70 text-sm">24/7 coaching chat</div>
              </div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-300/20 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-red-300 flex-shrink-0" />
              <div className="text-left">
                <div className="text-red-200 font-semibold">Progress Tracking</div>
                <div className="text-red-200/70 text-sm">Monitor your journey</div>
              </div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-300/20 flex items-center gap-3">
              <Users className="w-6 h-6 text-red-300 flex-shrink-0" />
              <div className="text-left">
                <div className="text-red-200 font-semibold">Community</div>
                <div className="text-red-200/70 text-sm">Join fitness groups</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('/coaching')}
            className="group relative overflow-hidden px-12 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg rounded-full flex items-center gap-3 mx-auto hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
          >
            <Users className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Find a Coach</span>
            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachingSection;
