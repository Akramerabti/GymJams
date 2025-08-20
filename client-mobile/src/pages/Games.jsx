import React, { useState, useRef, useEffect } from 'react';
import { usePoints } from '../hooks/usePoints';
import { useAuth } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Dice5, Coins, Joystick, PanelTopClose, SquareStack, ArrowLeft, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import CoinFlip from './Games/CoinFlip';
import DiceRoll from './Games/DiceRoll';
import SlotMachine from './Games/SlotMachine';
import Roulette from './Games/Roulette';
import Blackjack from './Games/BlackJack';
import MemoryGame from './Games/MemoryGame';
import { toast } from 'sonner';

const GAME_IMAGES = {
  memory: "/memory-game.png",
  blackjack: "/black-jack.png",
  coinflip: "/coinflip.webp",
  diceroll: "/dice-roll.webp",
  slots: "/slot-machine.webp",
  roulette: "/roulette.webp",
};

const Games = () => {
  const { user } = useAuth();
  const { balance } = usePoints();
  const [selectedGame, setSelectedGame] = useState(null);

  // Hide footer on this page
  useEffect(() => {
    document.body.classList.add('hide-footer');
    
    return () => {
      document.body.classList.remove('hide-footer');
    };
  }, []);

  const dailyGames = [
    {
      id: 'memory',
      name: 'Fit Match',
      description: 'Test your memory skills to earn points! One try per day.',
      icon: Brain,
      image: GAME_IMAGES.memory,
      component: MemoryGame,
      minBet: 0,
      maxBet: 0,
      isSkill: true,
      bgColor: 'bg-gradient-to-br from-purple-600 to-indigo-600',
    },
  ];

  const casinoGames = [
    {
      id: 'blackjack',
      name: 'Blackjack',
      description: 'Beat the dealer to win',
      icon: PanelTopClose,
      image: GAME_IMAGES.blackjack,
      component: Blackjack,
      minBet: 100,
      maxBet: 10000,
      bgColor: 'bg-gradient-to-br from-green-600 to-teal-600',
    }, 
    {
      id: 'roulette',
      name: 'Roulette',
      description: 'Bet on numbers or colors',
      icon: Joystick,
      image: GAME_IMAGES.roulette,
      component: Roulette,
      minBet: 25,
      maxBet: 2500,
      bgColor: 'bg-gradient-to-br from-indigo-600 to-purple-600',
    },
    {
      id: 'slots',
      name: 'Slot Machine',
      description: 'Match symbols to win big',
      icon: SquareStack,
      image: GAME_IMAGES.slots,
      component: SlotMachine,
      minBet: 50,
      maxBet: 5000,
      bgColor: 'bg-gradient-to-br from-pink-600 to-red-600',
    },
    
    {
      id: 'coinflip',
      name: 'Coin Flip',
      description: 'Classic 50/50 chance to double your points',
      icon: Coins,
      image: GAME_IMAGES.coinflip,
      component: CoinFlip,
      minBet: 10,
      maxBet: 1000,
      bgColor: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    },
    {
      id: 'diceroll',
      name: 'Dice Roll',
      description: 'Roll the dice and multiply your points',
      icon: Dice5,
      image: GAME_IMAGES.diceroll,
      component: DiceRoll,
      minBet: 20,
      maxBet: 2000,
      bgColor: 'bg-gradient-to-br from-blue-600 to-cyan-600',
    },
   
  ];

  const dailyRef = useRef(null);
  const casinoRef = useRef(null);

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <h1 className="text-3xl font-bold mb-4 text-gray-900">VIP Games Access</h1>
          <p className="text-gray-600 mb-6">
            Log in to access exclusive games and start winning GymJams!
          </p>
          <a
            href="/login"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            Log In to Play
          </a>
        </motion.div>
      </div>
    );
  }

  const handleGameSelect = (game) => {
    if (balance < game.minBet) {
      toast.error(`Insufficient points. Minimum bet is ${game.minBet} points.`);
      return;
    }
    setSelectedGame(game);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br mt-15 from-purple-900 to-blue-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Only show when no game is selected */}
        {!selectedGame && (
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center bg-white/10 px-4 sm:px-6 py-2 sm:py-3 rounded-full">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mr-2" />
              <span className="text-white font-semibold text-sm sm:text-base">
                Balance: {balance} points
              </span>
            </div>
          </div>
        )}

        {selectedGame ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8"
          >
            {/* Game Header with Back Arrow, Game Name, and Balance Below */}
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              {/* Back Arrow and Game Name */}
              <div className="flex items-center justify-between w-full mb-4">
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-gray-900 hover:text-gray-700 flex items-center"
                >
                  <ArrowLeft className="w-6 h-6 mr-2" />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-center flex-grow mr-8">
                  {selectedGame.name}
                </h2>
              </div>

              {/* Balance Points (Centered Below) */}
              <div className="inline-flex items-center bg-purple-100 px-4 py-2 rounded-full">
                <Coins className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-purple-600 font-semibold text-sm sm:text-base">
                  Balance: {balance} points
                </span>
              </div>
            </div>

            {/* Render the Selected Game Component */}
            <selectedGame.component
              minBet={selectedGame.minBet}
              maxBet={selectedGame.maxBet}
            />
          </motion.div>
        ) : (
          <>
            {/* Daily Section */}
            <div className="mb-12 relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Daily Games</h2>
              <div className="relative">
                <button
                  onClick={() => scroll(dailyRef, 'left')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/10 p-2 rounded-full z-10 hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => scroll(dailyRef, 'right')}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/10 p-2 rounded-full z-10 hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
                <div
                  ref={dailyRef}
                  className="flex overflow-x-auto scrollbar-hide space-x-4 p-4"
                >
                  {dailyGames.map((game) => (
                    <motion.div
                      key={game.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative rounded-xl overflow-hidden cursor-pointer shadow-lg transition-transform duration-200 h-96 w-64 flex-shrink-0"
                      onClick={() => handleGameSelect(game)}
                    >
                      {/* Game Image */}
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                      {/* Game Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <div className="flex items-center space-x-3">
                          <game.icon className="w-8 h-8 text-white" />
                          <h3 className="text-xl font-bold text-white">{game.name}</h3>
                        </div>
                        <p className="text-sm text-white mt-2">{game.description}</p>
                        {game.minBet > 0 && (
                          <div className="text-xs text-white/80 mt-2">
                            Min Bet: {game.minBet} points
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Casino Section */}
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Casino Games</h2>
              <div className="relative">
                <button
                  onClick={() => scroll(casinoRef, 'left')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/10 p-2 rounded-full z-10 hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={() => scroll(casinoRef, 'right')}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/10 p-2 rounded-full z-10 hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
                <div
                  ref={casinoRef}
                  className="flex overflow-x-auto scrollbar-hide space-x-4 p-4"
                >
                  {casinoGames.map((game) => (
                    <motion.div
                      key={game.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative rounded-xl overflow-hidden cursor-pointer shadow-lg transition-transform duration-200 h-96 w-64 flex-shrink-0"
                      onClick={() => handleGameSelect(game)}
                    >
                      {/* Game Image */}
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                      {/* Game Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <div className="flex items-center space-x-3">
                          <game.icon className="w-8 h-8 text-white" />
                          <h3 className="text-xl font-bold text-white">{game.name}</h3>
                        </div>
                        <p className="text-sm text-white mt-2">{game.description}</p>
                        {game.minBet > 0 && (
                          <div className="text-xs text-white/80 mt-2">
                            Min Bet: {game.minBet} points
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Games;