import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Coins, Zap, Star, Target, Award, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GamesSection = ({ isActive, onNavigate, darkMode, backgroundColor, textColor, navbarHeight = 0 }) => {
  const { t } = useTranslation();
  const [activeGame, setActiveGame] = useState(0);
  const [score, setScore] = useState(0);

  // Determine if this is ConversionLanding (no navbar) or Home (with navbar)
  const isConversionLanding = navbarHeight === 0;

  // Calculate appropriate spacing based on context
  const getContainerPadding = () => {
    if (isConversionLanding) {
      return 'pt-[clamp(2rem,4vh,3rem)] p-[clamp(1rem,3vw,2rem)]';
    } else {
      return 'pt-[clamp(4rem,8vh,6rem)] p-[clamp(3rem,6vw,3rem)] sm:p-[clamp(3rem,5vw,3rem)] md:p-[clamp(2rem,4vw,3rem)]';
    }
  };

  const getInnerPadding = () => {
    if (isConversionLanding) {
      return 'clamp(1rem,3vw,2rem)';
    } else {
      return 'clamp(1.5rem,4vw,3rem)';
    }
  };

  const getSpacing = () => {
    if (isConversionLanding) {
      return {
        headerMargin: 'clamp(0.75rem,2vw,1.5rem)',
        sectionMargin: 'clamp(1rem,3vw,2rem)',
        gridGap: 'clamp(0.5rem,1.5vw,1rem)'
      };
    } else {
      return {
        headerMargin: 'clamp(1rem,3vw,2rem)',
        sectionMargin: 'clamp(1.5rem,4vw,3rem)',
        gridGap: 'clamp(0.75rem,2vw,1.5rem)'
      };
    }
  };

  // Mock games data
  const games = [
    {
      id: 1,
      name: 'Fitness Challenge',
      description: 'Complete daily workouts to earn points',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      points: 500
    },
    {
      id: 2,
      name: 'Step Counter',
      description: 'Track your steps and compete with friends',
      icon: Target,
      color: 'from-green-500 to-teal-500',
      points: 300
    },
    {
      id: 3,
      name: 'Nutrition Quest',
      description: 'Log meals and unlock achievements',
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      points: 400
    },
    {
      id: 4,
      name: 'Workout Warriors',
      description: 'Join team challenges and win prizes',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      points: 600
    }
  ];

  // Animate score counter
  useEffect(() => {
    if (isActive) {
      const targetScore = 2847;
      const increment = Math.ceil(targetScore / 50);
      const timer = setInterval(() => {
        setScore(prev => {
          if (prev >= targetScore) {
            clearInterval(timer);
            return targetScore;
          }
          return Math.min(prev + increment, targetScore);
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [isActive]);

  // Auto-rotate games
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setActiveGame((prev) => (prev + 1) % games.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isActive, games.length]);

  const achievements = [
    { name: 'Early Bird', description: '5 morning workouts', progress: 80 },
    { name: 'Consistency King', description: '30-day streak', progress: 60 },
    { name: 'Social Butterfly', description: 'Connect with 10 friends', progress: 40 },
    { name: 'Challenge Master', description: 'Complete 5 challenges', progress: 100 }
  ];

  const spacing = getSpacing();

  return (
    <div className={`absolute inset-0 flex ${isConversionLanding ? 'items-start' : 'items-center'} justify-center ${getContainerPadding()} overflow-hidden pointer-events-auto`}
         style={{ backgroundColor: backgroundColor || (darkMode ? '#1a1a1a' : '#ffffff'), color: textColor || (darkMode ? '#ffffff' : '#000000') }}>
      
      {/* Background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-900 via-green-900/30 to-blue-900/30' 
            : 'bg-gradient-to-br from-green-50 via-blue-50/50 to-purple-50/50'
        }`}></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-green-500/30 rounded-full animate-float-random"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div 
        className={`relative z-10 w-full max-w-[clamp(320px,95vw,1800px)] max-h-[100vh] mx-auto transition-all duration-800 ${
          isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
        }`}
        style={{
          padding: isConversionLanding ? 'clamp(1rem,3vw,2rem)' : 'clamp(2rem,4vw,3rem)'
        }}
      >
        <div 
          className="bg-gradient-to-br from-gray-900/60 via-green-900/50 to-blue-900/50 backdrop-blur-md overflow-hidden border border-green-400/40 shadow-2xl pointer-events-auto"
          style={{
            borderRadius: 'clamp(1rem,3vw,2rem)',
            padding: getInnerPadding()
          }}
        >
          {/* Header */}
          <div className="text-center" style={{ marginBottom: spacing.sectionMargin }}>
            <div 
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm border border-green-500/20"
              style={{
                padding: isConversionLanding 
                  ? 'clamp(0.5rem,1.5vw,1rem) clamp(0.75rem,2vw,1.25rem)'
                  : 'clamp(0.75rem,2vw,1.25rem) clamp(1rem,3vw,1.5rem)',
                marginBottom: spacing.headerMargin,
                fontSize: 'clamp(0.75rem,1.5vw,1rem)'
              }}
            >
              <Gamepad2 
                className="text-green-500" 
                style={{
                  width: 'clamp(0.75rem,1.5vw,1rem)',
                  height: 'clamp(0.75rem,1.5vw,1rem)'
                }}
              />
              <span className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                {t('gamessection.gamifiedFitness')}
              </span>
            </div>

            <h2 
              className={`font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-[0.9] ${
                isActive ? 'animate-fade-in' : ''
              }`}
              style={{
                fontSize: isConversionLanding ? 'clamp(1.5rem,5vw,3rem)' : 'clamp(2rem,6vw,4rem)',
                marginBottom: spacing.headerMargin,
                letterSpacing: 'clamp(-0.02em,0.1vw,0.02em)'
              }}
            >
              {t('gamessection.fitnessGames')}
            </h2>

            <p 
              className={`max-w-3xl mx-auto leading-relaxed ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } ${
                isActive ? 'animate-fade-in animation-delay-200' : ''
              }`}
              style={{
                fontSize: 'clamp(0.875rem,2.5vw,1.25rem)',
                marginBottom: spacing.sectionMargin,
                lineHeight: 'clamp(1.4,1.6,1.7)'
              }}
            >
              {t('gamessection.intro')}
            </p>
          </div>

          {/* Main content grid */}
          <div 
            className="grid lg:grid-cols-3"
            style={{ gap: spacing.gridGap }}
          >
            {/* Left - Games list */}
            <div className={`lg:col-span-2 ${isActive ? 'animate-fade-in animation-delay-300' : ''}`}>
              <div 
                className="grid sm:grid-cols-2"
                style={{ gap: 'clamp(0.5rem,1.5vw,1rem)' }}
              >
                {games.map((game, index) => (
                  <div
                    key={game.id}
                    onClick={() => setActiveGame(index)}
                    className={`relative rounded-xl cursor-pointer transition-all duration-300 ${
                      activeGame === index
                        ? 'scale-105 shadow-2xl'
                        : 'hover:scale-102 shadow-lg'
                    } ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    } overflow-hidden group`}
                    style={{
                      padding: isConversionLanding 
                        ? 'clamp(0.75rem,2vw,1.25rem)'
                        : 'clamp(1rem,3vw,1.5rem)'
                    }}
                  >
                    {/* Active indicator */}
                    {activeGame === index && (
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${game.color}`}></div>
                    )}

                    <div className="relative z-10">
                      <div 
                        className={`rounded-lg bg-gradient-to-r ${game.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                        style={{
                          width: isConversionLanding ? 'clamp(2rem,6vw,3rem)' : 'clamp(2.5rem,8vw,3.5rem)',
                          height: isConversionLanding ? 'clamp(2rem,6vw,3rem)' : 'clamp(2.5rem,8vw,3.5rem)',
                          marginBottom: 'clamp(0.5rem,1.5vw,1rem)'
                        }}
                      >
                        <game.icon 
                          className="text-white" 
                          style={{
                            width: isConversionLanding ? 'clamp(1rem,3vw,1.5rem)' : 'clamp(1.25rem,4vw,2rem)',
                            height: isConversionLanding ? 'clamp(1rem,3vw,1.5rem)' : 'clamp(1.25rem,4vw,2rem)'
                          }}
                        />
                      </div>

                      <h3 
                        className={`font-bold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}
                        style={{
                          fontSize: isConversionLanding ? 'clamp(0.875rem,2.5vw,1.25rem)' : 'clamp(1rem,3vw,1.5rem)',
                          marginBottom: 'clamp(0.25rem,1vw,0.5rem)'
                        }}
                      >
                        {game.name}
                      </h3>

                      <p 
                        className={`${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                        style={{
                          fontSize: 'clamp(0.75rem,1.5vw,0.875rem)',
                          marginBottom: 'clamp(0.5rem,1.5vw,1rem)'
                        }}
                      >
                        {game.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Coins 
                            className="text-yellow-500" 
                            style={{
                              width: 'clamp(0.75rem,1.5vw,1rem)',
                              height: 'clamp(0.75rem,1.5vw,1rem)'
                            }}
                          />
                          <span 
                            className={`font-semibold ${
                              darkMode ? 'text-yellow-400' : 'text-yellow-600'
                            }`}
                            style={{
                              fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                            }}
                          >
                            +{game.points} pts
                          </span>
                        </div>
                        
                        {activeGame === index && (
                          <span 
                            className={`rounded-full font-semibold ${
                              darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                            }`}
                            style={{
                              padding: 'clamp(0.25rem,1vw,0.5rem) clamp(0.5rem,1.5vw,0.75rem)',
                              fontSize: 'clamp(0.625rem,1.25vw,0.75rem)'
                            }}
                          >
                            PLAYING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Background decoration */}
                    <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-r ${game.color} opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Stats and achievements */}
            <div className={`space-y-6 ${isActive ? 'animate-fade-in animation-delay-400' : ''}`}>
              {/* Score card */}
              <div 
                className={`rounded-xl shadow-xl ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                style={{
                  padding: isConversionLanding ? 'clamp(1rem,3vw,1.5rem)' : 'clamp(1.25rem,4vw,2rem)'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(0.5rem,1.5vw,1rem)' }}>
                  <h3 
                    className={`font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    style={{
                      fontSize: 'clamp(0.875rem,2.5vw,1.125rem)'
                    }}
                  >
                    Your Score
                  </h3>
                  <Trophy 
                    className="text-yellow-500" 
                    style={{
                      width: 'clamp(1rem,2.5vw,1.25rem)',
                      height: 'clamp(1rem,2.5vw,1.25rem)'
                    }}
                  />
                </div>
                
                <div 
                  className="text-center"
                  style={{
                    padding: isConversionLanding ? 'clamp(0.75rem,2vw,1.25rem)' : 'clamp(1rem,3vw,1.5rem)'
                  }}
                >
                  <div 
                    className="font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent"
                    style={{
                      fontSize: isConversionLanding ? 'clamp(1.5rem,6vw,2.5rem)' : 'clamp(2rem,8vw,3rem)'
                    }}
                  >
                    {score.toLocaleString()}
                  </div>
                  <p 
                    className={`mt-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    style={{
                      fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                    }}
                  >
                    Total Points
                  </p>
                </div>

                <div 
                  className="grid grid-cols-3 mt-4"
                  style={{ gap: 'clamp(0.25rem,1vw,0.5rem)' }}
                >
                  <div className="text-center">
                    <div 
                      className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      style={{
                        fontSize: 'clamp(0.875rem,2.5vw,1.125rem)'
                      }}
                    >12</div>
                    <div 
                      className={`${
                        darkMode ? 'text-gray-500' : 'text-gray-600'
                      }`}
                      style={{
                        fontSize: 'clamp(0.625rem,1.25vw,0.75rem)'
                      }}
                    >Streak</div>
                  </div>
                  <div className="text-center">
                    <div 
                      className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      style={{
                        fontSize: 'clamp(0.875rem,2.5vw,1.125rem)'
                      }}
                    >5</div>
                    <div 
                      className={`${
                        darkMode ? 'text-gray-500' : 'text-gray-600'
                      }`}
                      style={{
                        fontSize: 'clamp(0.625rem,1.25vw,0.75rem)'
                      }}
                    >Level</div>
                  </div>
                  <div className="text-center">
                    <div 
                      className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      style={{
                        fontSize: 'clamp(0.875rem,2.5vw,1.125rem)'
                      }}
                    >8</div>
                    <div 
                      className={`${
                        darkMode ? 'text-gray-500' : 'text-gray-600'
                      }`}
                      style={{
                        fontSize: 'clamp(0.625rem,1.25vw,0.75rem)'
                      }}
                    >Badges</div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div 
                className={`rounded-xl shadow-xl ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                style={{
                  padding: isConversionLanding ? 'clamp(1rem,3vw,1.5rem)' : 'clamp(1.25rem,4vw,2rem)'
                }}
              >
                <h3 
                  className={`font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{
                    fontSize: 'clamp(0.875rem,2.5vw,1.125rem)',
                    marginBottom: 'clamp(0.75rem,2vw,1rem)'
                  }}
                >
                  Achievements
                </h3>

                <div 
                  className="space-y-3"
                  style={{ gap: 'clamp(0.5rem,1.5vw,0.75rem)' }}
                >
                  {achievements.map((achievement, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className={`font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}
                          style={{
                            fontSize: 'clamp(0.75rem,1.5vw,0.875rem)'
                          }}
                        >
                          {achievement.name}
                        </span>
                        <span 
                          className={`${
                            darkMode ? 'text-gray-500' : 'text-gray-600'
                          }`}
                          style={{
                            fontSize: 'clamp(0.625rem,1.25vw,0.75rem)'
                          }}
                        >
                          {achievement.progress}%
                        </span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div
                          className={`h-full bg-gradient-to-r ${
                            achievement.progress === 100
                              ? 'from-green-500 to-teal-500'
                              : 'from-blue-500 to-purple-500'
                          } transition-all duration-1000`}
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div 
            className="text-center"
            style={{ marginTop: spacing.sectionMargin }}
          >
            <button
              onClick={() => onNavigate('/games')}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white font-semibold hover:from-green-600 hover:via-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{
                gap: 'clamp(0.5rem,1.5vw,0.75rem)',
                padding: isConversionLanding 
                  ? 'clamp(0.75rem,2vw,1.25rem) clamp(1.5rem,4vw,2rem)'
                  : 'clamp(1rem,3vw,1.5rem) clamp(2rem,5vw,2.5rem)',
                fontSize: 'clamp(0.875rem,2vw,1.125rem)'
              }}
            >
              <Gamepad2 
                style={{
                  width: 'clamp(1rem,2.5vw,1.25rem)',
                  height: 'clamp(1rem,2.5vw,1.25rem)'
                }}
              />
              <span>{t('gamessection.playGames')}</span>
              <ArrowRight 
                style={{
                  width: 'clamp(1rem,2.5vw,1.25rem)',
                  height: 'clamp(1rem,2.5vw,1.25rem)'
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float-random {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-30px) translateX(10px);
          }
          66% {
            transform: translateY(20px) translateX(-10px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float-random {
          animation: float-random linear infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
};

export default GamesSection;