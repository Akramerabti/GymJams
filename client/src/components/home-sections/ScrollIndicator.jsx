import React from 'react';

const ScrollIndicator = ({ currentSection, totalSections, darkMode }) => {
  const progress = ((currentSection + 1) / totalSections) * 100;
  
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className={`h-full ${
        darkMode ? 'bg-gray-800/30' : 'bg-gray-200/30'
      } backdrop-blur-sm`}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out shadow-lg"
          style={{ 
            width: `${progress}%`,
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
          }}
        >
          {/* Animated glow effect */}
          <div className="h-full w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ScrollIndicator;