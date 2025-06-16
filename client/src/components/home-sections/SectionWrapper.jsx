import React from 'react';
import { 
  HeroSection, 
  ShopSection, 
  GymBrosSection, 
  GamesSection, 
  CoachingSection 
} from './index';

const SectionWrapper = ({ 
  section, 
  index, 
  currentSection, 
  videoRef, 
  onNavigate,
  goToSection 
}) => {
  const isActive = currentSection === index;
  
  // Map section IDs to their respective components
  const getSectionComponent = () => {
    switch (section.id) {
      case 'hero':
        return <HeroSection onNavigate={onNavigate} isActive={isActive} goToSection={goToSection} />;
      case 'shop':
        return <ShopSection onNavigate={onNavigate} isActive={isActive} />;
      case 'gymBros':
        return <GymBrosSection onNavigate={onNavigate} isActive={isActive} />;
      case 'games':
        return <GamesSection onNavigate={onNavigate} isActive={isActive} />;
      case 'coaching':
        return <CoachingSection onNavigate={onNavigate} isActive={isActive} />;
      default:
        // Fallback to original design if no specific component exists
        return (
          <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
            <div 
              className={`max-w-4xl mx-auto text-center transition-all duration-800 ${
                isActive 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-12 scale-95'
              }`}
            >
              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl pointer-events-auto">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  {section.title}
                </h2>
                
                <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                  {section.description}
                </p>
                
                <button
                  onClick={() => onNavigate(section.route)}
                  className="group relative overflow-hidden px-10 py-4 bg-white text-gray-900 font-bold text-lg rounded-full flex items-center gap-3 mx-auto hover:bg-opacity-95 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="relative z-10">{section.buttonText}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };
  return (
    <div
      key={section.id}
      className="relative w-screen flex-shrink-0"
      style={{ height: '100vh' }}
    >
      {/* Video background - Skip for hero section */}
      {section.id !== 'hero' && (
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            src={section.videoSrc}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
              isActive 
                ? 'opacity-100 scale-100' 
                : 'opacity-30 scale-105'
            }`}
            muted
            loop
            playsInline
            autoPlay={index === 0}
            preload="metadata"
          />
          
          {/* Color overlay */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${section.color} transition-opacity duration-1000 ${
              isActive ? 'opacity-70' : 'opacity-90'
            }`}
          />
        </div>
      )}
      
      {/* Section Content */}
      {getSectionComponent()}
    </div>
  );
};

export default SectionWrapper;
