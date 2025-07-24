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
  
  // Dynamic content wrapper with comprehensive clamping
  const contentWrapperClass = `
    max-w-[clamp(320px,90vw,1400px)] 
    mx-auto 
    px-[clamp(1rem,4vw,4rem)] 
    py-[clamp(1.5rem,5vh,4rem)]
    text-center
    transition-all duration-800
  `;

  // Dynamic container sizing for different sections
  const getSectionSpecificClass = (sectionId) => {
    switch (sectionId) {
      case 'hero':
        return `
          max-w-[clamp(320px,95vw,1600px)] 
          mx-auto 
          px-[clamp(1rem,3vw,3rem)] 
          py-[clamp(2rem,6vh,5rem)]
        `;
      case 'coaching':
        return `
          max-w-[clamp(320px,98vw,1800px)] 
          mx-auto 
          px-[clamp(0.5rem,2vw,2rem)] 
          py-[clamp(1rem,4vh,3rem)]
        `;
      case 'shop':
      case 'gymBros':
      case 'games':
        return `
          max-w-[clamp(320px,85vw,1200px)] 
          mx-auto 
          px-[clamp(1rem,4vw,3rem)] 
          py-[clamp(2rem,5vh,4rem)]
        `;
      default:
        return contentWrapperClass;
    }
  };

  const getSectionComponent = () => {
    switch (section.id) {
      case 'hero':
        return (
          <div className={`${getSectionSpecificClass('hero')} text-center transition-all duration-800`}>
            <HeroSection onNavigate={onNavigate} isActive={isActive} goToSection={goToSection} />
          </div>
        );
      case 'shop':
        return (
          <div className={`${getSectionSpecificClass('shop')} text-center transition-all duration-800`}>
            <ShopSection onNavigate={onNavigate} isActive={isActive} />
          </div>
        );
      case 'gymBros':
        return (
          <div className={`${getSectionSpecificClass('gymBros')} text-center transition-all duration-800`}>
            <GymBrosSection onNavigate={onNavigate} isActive={isActive} />
          </div>
        );
      case 'games':
        return (
          <div className={`${getSectionSpecificClass('games')} text-center transition-all duration-800`}>
            <GamesSection onNavigate={onNavigate} isActive={isActive} />
          </div>
        );
      case 'coaching':
        return (
          <div className={`${getSectionSpecificClass('coaching')} transition-all duration-800`}>
            <CoachingSection onNavigate={onNavigate} isActive={isActive} />
          </div>
        );
      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center p-[clamp(1rem,4vw,3rem)] pointer-events-none">
            <div 
              className={`max-w-[clamp(320px,85vw,1200px)] mx-auto text-center transition-all duration-800 ${
                isActive 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-12'
              }`}
            >
              <div className="bg-black/30 backdrop-blur-md rounded-[clamp(1rem,3vw,2rem)] p-[clamp(1.5rem,4vw,3rem)] border border-white/20 shadow-2xl pointer-events-auto">
                <h2 
                  className="font-bold text-white mb-[clamp(1.5rem,4vw,3rem)] leading-[1.1]"
                  style={{
                    fontSize: 'clamp(1.75rem,5vw,3.5rem)',
                    letterSpacing: 'clamp(-0.02em,0.5vw,0.02em)'
                  }}
                >
                  {section.title}
                </h2>
                <p 
                  className="mb-[clamp(2rem,5vw,3rem)] max-w-[clamp(280px,70vw,800px)] mx-auto leading-[clamp(1.4,1.6,1.7)] text-white/90"
                  style={{
                    fontSize: 'clamp(1rem,2.5vw,1.5rem)',
                    letterSpacing: 'clamp(-0.01em,0.1vw,0.01em)'
                  }}
                >
                  {section.description}
                </p>
                <button
                  onClick={() => onNavigate(section.route)}
                  className="group relative overflow-hidden px-[clamp(2rem,5vw,3rem)] py-[clamp(0.8rem,2vw,1.2rem)] bg-white text-gray-900 font-bold rounded-full flex items-center gap-[clamp(0.5rem,2vw,1rem)] mx-auto hover:bg-opacity-95 transition-all duration-300 transform hover:scale-105 shadow-[clamp(0.5rem,1vw,1rem)] hover:shadow-[clamp(0.75rem,1.5vw,1.5rem)]"
                  style={{
                    fontSize: 'clamp(0.9rem,2vw,1.25rem)',
                    minHeight: 'clamp(2.5rem,6vw,3.5rem)'
                  }}
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
      style={{ 
        height: '100vh',
        minHeight: 'clamp(500px,100vh,1200px)'
      }}
    >
      {/* Video background - Skip for hero section */}
      {section.id !== 'hero' && (
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            src={section.videoSrc}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay={index === 0}
            preload="metadata"
          />
          {/* Color overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-70`} />
        </div>
      )}
      
      {/* Section Content */}
      <div className="relative z-10 w-full h-full">
        {getSectionComponent()}
      </div>
    </div>
  );
};

export default SectionWrapper;