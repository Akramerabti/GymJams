import React, { useState,useEffect } from 'react';
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
          rotateY: isFlipping ? 3000 : 0, // Keep spinning while flipping, stop at 0 when done
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
  const [gameOver, setGameOver] = useState(false);
  const [delayedResult, setDelayedResult] = useState(false);
  const [inputError, setInputError] = useState(null);
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

  const handleReBet = () => {
    // Keep the same bet amount and result, but reset other game state
    setUserChoice(null); // Reset user choice
    setGameOver(false);  // Reset game over state
    setShowResult(false); // Hide the result display
  };

   useEffect(() => {
    if (showResult && result) {
      // Set a timeout to delay the display of the result
      const timer = setTimeout(() => {
        setDelayedResult(true);
      }, 1000); // 1 second delay

      // Clear the timeout if the component unmounts or showResult changes
      return () => clearTimeout(timer);
    } else {
      // Reset delayedResult if showResult is false
      setDelayedResult(false);
    }
  }, [showResult, result]);

  const handleBetAmountChange = (e) => {
    const value = e.target.value;
    setBetAmount(value); // Allow the user to type freely
    setInputError(null); // Clear any previous errors
  };
  
  const handleBetAmountBlur = (e) => {
    const value = parseInt(e.target.value);
  
    if (isNaN(value) || value < minBet) {
      setInputError(`Minimum bet is ${minBet}`);
      setBetAmount(minBet); // Reset to minimum bet
    } else if (value > maxBet) {
      setInputError(`Maximum bet is ${maxBet}`);
      setBetAmount(maxBet); // Reset to maximum bet
    } else {
      setInputError(null); // Clear error if input is valid
    }
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
            <div className="flex flex-col items-center space-y-2">
              <label htmlFor="betAmount" className="text-sm font-medium text-white">
                Bet Amount
              </label>
              <div className="relative">
                <Input
                  id="betAmount"
                  type="number"
                  value={betAmount}
                  onChange={handleBetAmountChange}
                  onBlur={handleBetAmountBlur}
                  placeholder={`Enter amount (${minBet}-${maxBet})`}
                  className={`w-48 bg-white/5 border ${
                    inputError ? 'border-red-500' : 'border-white/10'
                  } text-white text-center rounded-lg py-2 px-4 focus:outline-none focus:ring-2 ${
                    inputError ? 'focus:ring-red-500' : 'focus:ring-yellow-500'
                  } transition-all duration-300`}
                  disabled={isFlipping || gameOver} // Disable input when game is over
                />
                {inputError && (
                  <div className="absolute top-full mt-1 text-sm text-red-500 text-center w-full">
                    {inputError}
                  </div>
                )}
              </div>
            </div>

            {/* Coin Display */}
            <div className="h-64 relative mb-2 flex items-center justify-center">
              <Coin isFlipping={isFlipping} result={result} />
            </div>

            {/* Result Display */}
            {showResult && result && delayedResult && (
              <div className="text-center text-xl font-bold mb-4">
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