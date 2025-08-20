import React from 'react';

const NavigationDots = ({ sections, currentSection, onNavigate, darkMode }) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-4">
        {sections.map((section, index) => (
          <div key={section.id} className="relative group">
            {/* Tooltip */}
            <div className={`absolute right-10 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } shadow-lg`}>
              <span className="text-sm font-medium">{section.name}</span>
              <div className={`absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}></div>
            </div>
            
            {/* Dot button */}
            <button
              onClick={() => onNavigate(index)}
              className={`relative w-3 h-3 rounded-full transition-all duration-500 ${
                currentSection === index
                  ? 'scale-150 bg-gradient-to-r from-blue-500 to-purple-500'
                  : darkMode ? 'bg-gray-600 hover:bg-gray-400' : 'bg-gray-400 hover:bg-gray-600'
              }`}
              aria-label={`Go to ${section.name}`}
            >
              {/* Active indicator ring */}
              {currentSection === index && (
                <>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-20"></span>
                  <span className="absolute inset-[-4px] rounded-full border-2 border-blue-500/50"></span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NavigationDots;