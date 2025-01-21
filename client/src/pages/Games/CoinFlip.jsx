// components/games/CoinFlip.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';

const CoinFlip = ({ minBet, maxBet }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isFlipping, setIsFlipping] = useState(false);
  const { balance, subtractPoints, addPoints } = usePoints();

  const handleFlip = async () => {
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

    const result = Math.random() < 0.5;
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (result) {
      addPoints(betAmount * 2);
      toast.success(`You won ${betAmount} points!`);
    } else {
      toast.error(`You lost ${betAmount} points`);
    }

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

      <AnimatePresence>
        {isFlipping && (
          <motion.div
            initial={{ rotateX: 0 }}
            animate={{ rotateX: 1800 }}
            exit={{ rotateX: 0 }}
            transition={{ duration: 2 }}
            className="w-32 h-32 bg-yellow-400 rounded-full mx-auto mb-8"
          />
        )}
      </AnimatePresence>

      <button
        onClick={handleFlip}
        disabled={isFlipping}
        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isFlipping ? 'Flipping...' : 'Flip Coin'}
      </button>
    </div>
  );
};

export default CoinFlip;