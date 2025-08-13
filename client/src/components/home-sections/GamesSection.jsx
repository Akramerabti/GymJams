import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Coins, Zap, Star, Target, Award, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GamesSection = ({ isActive, onNavigate, darkMode }) => {
  const { t } = useTranslation();
  const [activeGame, setActiveGame] = useState(0);
  const [score, setScore] = useState(0);

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

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
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
      <div className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-all duration-1000 ${
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm border border-green-500/20 mb-6">
            <Gamepad2 className="w-4 h-4 text-green-500" />
            <span className={`text-sm font-semibold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
              {t('gamessection.gamifiedFitness')}
            </span>
          </div>

          <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent ${
            isActive ? 'animate-fade-in' : ''
          }`}>
            {t('gamessection.fitnessGames')}
          </h2>

          <p className={`text-lg sm:text-xl max-w-3xl mx-auto ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          } ${
            isActive ? 'animate-fade-in animation-delay-200' : ''
          }`}>
            {t('gamessection.intro')}
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Games list */}
          <div className={`lg:col-span-2 ${isActive ? 'animate-fade-in animation-delay-300' : ''}`}>
            <div className="grid sm:grid-cols-2 gap-4">
              {games.map((game, index) => (
                <div
                  key={game.id}
                  onClick={() => setActiveGame(index)}
                  className={`relative rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                    activeGame === index
                      ? 'scale-105 shadow-2xl'
                      : 'hover:scale-102 shadow-lg'
                  } ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } overflow-hidden group`}
                >
                  {/* Active indicator */}
                  {activeGame === index && (
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${game.color}`}></div>
                  )}

                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <game.icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className={`text-xl font-bold mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {game.name}
                    </h3>

                    <p className={`text-sm mb-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {game.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className={`text-sm font-semibold ${
                          darkMode ? 'text-yellow-400' : 'text-yellow-600'
                        }`}>
                          +{game.points} pts
                        </span>
                      </div>
                      
                      {activeGame === index && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                        }`}>
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
            <div className={`rounded-xl p-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-xl`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Your Score
                </h3>
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              
              <div className="text-center py-4">
                <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                  {score.toLocaleString()}
                </div>
                <p className={`text-sm mt-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Points
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center">
                  <div className={`text-lg font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>12</div>
                  <div className={`text-xs ${
                    darkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}>Streak</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>5</div>
                  <div className={`text-xs ${
                    darkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}>Level</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>8</div>
                  <div className={`text-xs ${
                    darkMode ? 'text-gray-500' : 'text-gray-600'
                  }`}>Badges</div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className={`rounded-xl p-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-xl`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Achievements
              </h3>

              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {achievement.name}
                      </span>
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-600'
                      }`}>
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
        <div className="text-center mt-12">
          <button
            onClick={() => onNavigate('/games')}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white font-semibold hover:from-green-600 hover:via-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Gamepad2 className="w-5 h-5" />
            <span>{t('gamessection.playGames')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
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