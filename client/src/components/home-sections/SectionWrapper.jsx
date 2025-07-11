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
  const contentWrapperClass = `
    max-w-[clamp(320px,80vw,1200px)] 
    mx-auto 
    px-[clamp(1rem,4vw,3rem)] 
    py-[clamp(2rem,6vw,5rem)]
    text-center
    transition-all duration-800
  `;

  const getSectionComponent = () => {
    switch (section.id) {
      case 'hero':
        return (
          <div className={contentWrapperClass}>
            <HeroSection onNavigate={onNavigate} isActive={isActive} goToSection={goToSection} />
          </div>
        );
      case 'shop':
        return (
          <div className={contentWrapperClass}>
            <ShopSection onNavigate={onNavigate} isActive={isActive} />
          </div>
        );
      case 'gymBros':
        return (
          <div className={contentWrapperClass}>
            <GymBrosSection onNavigate={onNavigate} isActive={isActive} />
          </div>
        );
      case 'games':
        return (
          <div className={contentWrapperClass}>
            <GamesSection onNavigate={onNavigate} isActive={isActive} />
          </div>
        );
      case 'coaching':
        return (
          <div className={contentWrapperClass}>
            <CoachingSection onNavigate={onNavigate} isActive={isActive} />
          </div>
        );
      default:
        // Fallback to original design if no specific component exists
        return (
          <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 pointer-events-none">
            <div 
              className={`max-w-[clamp(320px,80vw,900px)] mx-auto text-center transition-all duration-800 ${
                isActive 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-12 scale-95'
              }`}
            >
              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-[clamp(1.5rem,4vw,3rem)] border border-white/20 shadow-2xl pointer-events-auto">
                <h2 className="font-bold text-white mb-6"
                  style={{
                    fontSize: 'clamp(2rem,5vw,3.5rem)',
                    lineHeight: '1.1'
                  }}
                >
                  {section.title}
                </h2>
                <p 
                  className="mb-8 max-w-3xl mx-auto leading-relaxed text-white/90"
                  style={{
                    fontSize: 'clamp(1.1rem,2.5vw,2rem)'
                  }}
                >
                  {section.description}
                </p>
                <button
                  onClick={() => onNavigate(section.route)}
                  className="group relative overflow-hidden px-[clamp(2rem,5vw,3rem)] py-[clamp(0.8rem,2vw,1.2rem)] bg-white text-gray-900 font-bold rounded-full flex items-center gap-3 mx-auto hover:bg-opacity-95 transition-all duration-300 transform hover:scale-105 text-[clamp(1rem,2vw,1.25rem)]"
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
