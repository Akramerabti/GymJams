import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePoints } from '../../hooks/usePoints';
import { Sparkles, Coins } from 'lucide-react';

const Coin = ({ isFlipping, result }) => {
  return (
    <div className="relative perspective-1000 w-48 h-48 mx-auto">
      <motion.div
        className="w-full h-full absolute rounded-full preserve-3d"
        initial={false}
        animate={{
          rotateY: isFlipping ? 1800 : 0, // Keep spinning while flipping, stop at 0 when done
        }}
        transition={{
          duration: isFlipping ? 1.5 : 0.5, // Faster flip animation (1.5 seconds)
          ease: isFlipping ? [0.17, 0.67, 0.83, 0.67] : "easeOut", // Custom easing for flip
        }}
      >
        {/* Dynamic Coin Content Based on Result */}
        {result === 'heads' ? (
          // Heads Side
          <div className="w-full h-full absolute backface-hidden rounded-full bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 flex items-center justify-center transform-style-3d border-8 border-yellow-500/30 shadow-xl">
            <svg
              viewBox="0 0 200 200"
              className="w-40 h-40 drop-shadow-lg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Heads Side Design */}
              <circle cx="100" cy="100" r="98" stroke="#B7791F" strokeWidth="4" />
              <path
                d="M100 40 L120 70 L140 50 L100 90 L60 50 L80 70 L100 40"
                fill="#B7791F"
                stroke="#92400E"
                strokeWidth="2"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#92400E"
                strokeWidth="2"
                strokeDasharray="8 4"
              />
              <path
                d="M60 100 Q40 70 60 40"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M60 100 Q40 130 60 160"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M140 100 Q160 70 140 40"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M140 100 Q160 130 140 160"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
              />
              <text
                x="100"
                y="110"
                fontSize="24"
                fontWeight="bold"
                fill="#92400E"
                textAnchor="middle"
                style={{ fontFamily: 'serif' }}
              >
                HEADS
              </text>
            </svg>
          </div>
        ) : (
          // Tails Side
          <div className="w-full h-full absolute backface-hidden rounded-full bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center transform rotateY-180 border-8 border-yellow-600/30 shadow-xl">
            <svg
              viewBox="0 0 200 200"
              className="w-40 h-40 drop-shadow-lg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Tails Side Design */}
              <circle cx="100" cy="100" r="98" stroke="#B7791F" strokeWidth="4" />
              <path
                d="M100 40 L120 70 L140 50 L100 90 L60 50 L80 70 L100 40"
                fill="#B7791F"
                stroke="#92400E"
                strokeWidth="2"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#92400E"
                strokeWidth="2"
                strokeDasharray="8 4"
              />
              <path
                d="M60 100 Q40 70 60 40"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M60 100 Q40 130 60 160"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M140 100 Q160 70 140 40"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M140 100 Q160 130 140 160"
                stroke="#92400E"
                strokeWidth="3"
                fill="none"
              />
              <text
                x="100"
                y="110"
                fontSize="24"
                fontWeight="bold"
                fill="#92400E"
                textAnchor="middle"
                style={{ fontFamily: 'serif' }}
              >
                TAILS
              </text>
            </svg>
          </div>
        )}
      </motion.div>

      {/* Coin Edge Effect */}
      <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none border border-yellow-600/20" />
    </div>
  );
};
const CoinFlip = ({ minBet = 100, maxBet = 10000 }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isFlipping, setIsFlipping] = useState(false);
  const [userChoice, setUserChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false); // New state for game over
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

  const betPresets = [
    { label: 'Min', amount: minBet },
    { label: '1000', amount: 1000 },
    { label: '5000', amount: 5000 },
    { label: 'Max', amount: maxBet }
  ];

  const handleReBet = () => {
    // Keep the same bet amount and result, but reset other game state
    setUserChoice(null); // Reset user choice
    setGameOver(false);  // Reset game over state
    setShowResult(false); // Hide the result display
  };

  const flipCoin = async () => {
  if (!userChoice) {
    alert('Please choose Heads or Tails first!');
    return;
  }

  if (betAmount > balance) {
    alert('Insufficient points for this bet!');
    return;
  }

  setIsFlipping(true);
  setResult(null);
  setGameOver(false);
  setShowResult(false); // Hide the result display during flipping

  // Deduct points and update backend
  subtractPoints(betAmount);
  await updatePointsInBackend(balance - betAmount);

  // Calculate result using 50/50 chance
  const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';

  // Wait for flip animation
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Stop flipping and show result simultaneously
  setIsFlipping(false);
  setResult(flipResult);
  setGameOver(true);
  setShowResult(true); // Show the result display

  if (flipResult === userChoice) {
    const winnings = betAmount * 2;
    addPoints(winnings);
    await updatePointsInBackend(balance - betAmount + winnings);
  }
};

  return (
    <div className="flex items-center bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-repeat opacity-10" 
             style={{
               backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239C92AC" fill-opacity="0.4" fill-rule="evenodd"%3E%3Cpath d="M0 40L40 0H20L0 20M40 40V20L20 40"/%3E%3C/g%3E%3C/svg%3E")'
             }} />
      </div>
      
      <div className="absolute inset-0 bg-black bg-opacity-50" />
             
      <div className="w-full max-w-2xl mx-auto px-4 py-12 relative z-10 flex items-center justify-center">
        <div className="w-full max-w-xs">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            {/* Betting Controls */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-center">Bet Amount</label>
              <div className="flex justify-center space-x-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(minBet, Math.min(maxBet, parseInt(e.target.value) || 0)))}
                  className="w-32 bg-white/5 border-white/10 text-white text-center"
                  disabled={isFlipping || gameOver} // Disable input when game is over
                />
              </div>
            </div>

            {/* Coin Display */}
            <div className="h-64 relative mb-6 flex items-center justify-center">
              <Coin isFlipping={isFlipping} result={result} />
            </div>

            {/* Result Display */}
            {showResult && result && (
              <div className="text-center text-xl font-bold mb-6">
                {result === userChoice ? (
                  <span className="text-green-400">You won! 🎉</span>
                ) : (
                  <span className="text-red-400">You lost! 😢</span>
                )}
              </div>
            )}

            {/* Choice Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                onClick={() => setUserChoice('heads')}
                disabled={isFlipping || gameOver} // Disable buttons when game is over
                className={`h-16 text-lg transition-all duration-300 ${
                  userChoice === 'heads' 
                    ? 'bg-yellow-500 hover:bg-yellow-600 ring-2 ring-yellow-300 ring-opacity-50' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {userChoice === 'heads' && '✓ '}Heads
              </Button>
              <Button
                onClick={() => setUserChoice('tails')}
                disabled={isFlipping || gameOver} // Disable buttons when game is over
                className={`h-16 text-lg transition-all duration-300 ${
                  userChoice === 'tails' 
                    ? 'bg-yellow-500 hover:bg-yellow-600 ring-2 ring-yellow-300 ring-opacity-50' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {userChoice === 'tails' && '✓ '}Tails
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {gameOver ? (
                <div className="flex items-center ">
                  <Button
                    onClick={handleReBet}
                    className=" w-full h-16 text-xl bg-gray-500 hover:bg-gray-600"
                  >
                    New Bet
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={flipCoin}
                  disabled={isFlipping || !userChoice}
                  className={`w-full h-16 text-xl transition-all duration-300 ${
                    userChoice 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 transform hover:scale-105'
                      : 'bg-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isFlipping ? 'Flipping...' : 'Flip Coin!'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;