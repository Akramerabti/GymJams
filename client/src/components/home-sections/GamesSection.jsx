import React from 'react';
import { ArrowRight, Gamepad2, Trophy, Coins, Zap, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GamesSection = ({ onNavigate, isActive }) => {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
      <div 
        className={`max-w-5xl mx-auto text-center transition-all duration-800 ${
          isActive 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        <div className="bg-black/40 backdrop-blur-md rounded-3xl p-10 border border-green-300/30 shadow-2xl pointer-events-auto relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute top-4 right-4 text-green-300/20 animate-bounce">
            <Star className="w-8 h-8" />
          </div>
          <div className="absolute bottom-4 left-4 text-green-300/20 animate-pulse">
            <Coins className="w-6 h-6" />
          </div>
          
          {/* Gaming Badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-200 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Gamepad2 className="w-4 h-4" />
            {t('gamessection.gamifiedFitness')}
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-green-200 to-white bg-clip-text text-transparent">
            {t('gamessection.fitnessGames')}
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('gamessection.intro')}
          </p>
          
          {/* Game Features */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="bg-green-500/10 rounded-lg px-4 py-3 border border-green-300/20 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-300" />
              <span className="text-green-200">{t('gamessection.earnRewards')}</span>
            </div>
            <div className="bg-green-500/10 rounded-lg px-4 py-3 border border-green-300/20 flex items-center gap-2">
              <Coins className="w-5 h-5 text-green-300" />
              <span className="text-green-200">{t('gamessection.collectPoints')}</span>
            </div>
            <div className="bg-green-500/10 rounded-lg px-4 py-3 border border-green-300/20 flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-300" />
              <span className="text-green-200">{t('gamessection.levelUp')}</span>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('/games')}
            className="group relative overflow-hidden px-12 py-5 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-full flex items-center gap-3 mx-auto hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
          >
            <Gamepad2 className="w-6 h-6 relative z-10" />
            <span className="relative z-10">{t('gamessection.playGames')}</span>
            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamesSection;
