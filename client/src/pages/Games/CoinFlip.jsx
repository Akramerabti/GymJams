import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';

const CoinFlip = ({ minBet, maxBet }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isFlipping, setIsFlipping] = useState(false);
  const [userChoice, setUserChoice] = useState(null); // 'heads' or 'tails'
  const [result, setResult] = useState(null); // 'heads' or 'tails'
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

  const handleFlip = async () => {
    if (!userChoice) {
      toast.error('Please choose Heads or Tails before flipping.');
      return;
    }

    if (betAmount > balance) {
      toast.error('Insufficient points');
      return;
    }

    if (betAmount < minBet || betAmount > maxBet) {
      toast.error(`Bet amount must be between ${minBet} and ${maxBet} points`);
      return;
    }

    setIsFlipping(true);
    subtractPoints(betAmount);

    // Simulate a coin flip
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    setResult(flipResult);

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate flipping animation

    if (flipResult === userChoice) {
      const winnings = betAmount * 2;
      addPoints(winnings);
      toast.success(`You won ${winnings} points!`);
    } else {
      toast.error(`You lost ${betAmount} points`);
    }

    // Update points in the backend
    await updatePointsInBackend(balance + (flipResult === userChoice ? winnings : -betAmount));

    setIsFlipping(false);
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Math.max(minBet, Math.min(maxBet, parseInt(e.target.value))))}
          className="w-full max-w-xs mx-auto block border border-gray-300 rounded-lg px-4 py-2"
          disabled={isFlipping}
        />
        <div className="text-sm text-gray-500 mt-2">
          Min: {minBet} points | Max: {maxBet} points
        </div>
      </div>

      {/* Heads or Tails Selection */}
      <div className="mb-8 flex justify-center space-x-4">
        <button
          onClick={() => setUserChoice('heads')}
          disabled={isFlipping}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            userChoice === 'heads'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Heads
        </button>
        <button
          onClick={() => setUserChoice('tails')}
          disabled={isFlipping}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            userChoice === 'tails'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tails
        </button>
      </div>

      {/* Coin Flip Animation */}
      <AnimatePresence>
        {isFlipping && (
          <motion.div
            initial={{ rotateX: 0 }}
            animate={{ rotateX: 1800 }}
            exit={{ rotateX: 0 }}
            transition={{ duration: 2 }}
            className="w-32 h-32 bg-yellow-400 rounded-full mx-auto mb-8 flex items-center justify-center text-4xl font-bold"
          >
            {result === 'heads' ? 'H' : 'T'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flip Button */}
      <button
        onClick={handleFlip}
        disabled={isFlipping || !userChoice}
        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isFlipping ? 'Flipping...' : 'Flip Coin'}
      </button>

      {/* Result Display */}
      {result && !isFlipping && (
        <div className="mt-8 text-xl font-semibold">
          {result === userChoice ? 'You won! 🎉' : 'You lost. 😢'}
        </div>
      )}
    </div>
  );
};

export default CoinFlip;