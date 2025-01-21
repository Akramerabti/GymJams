import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';

const symbols = ['🍒', '🍊', '🍋', '💎', '7️⃣', '🎰'];

const SlotMachine = ({ minBet, maxBet }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState(['🎰', '🎰', '🎰']);
  const { balance, subtractPoints, addPoints } = usePoints();

  const spinReels = async () => {
    if (betAmount > balance) {
      toast.error('Insufficient points');
      return;
    }

    if (betAmount < minBet || betAmount > maxBet) {
      toast.error(`Bet amount must be between ${minBet} and ${maxBet} points`);
      return;
    }

    setIsSpinning(true);
    subtractPoints(betAmount);

    const newReels = reels.map(() => {
      const randomIndex = Math.floor(Math.random() * symbols.length);
      return symbols[randomIndex];
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    setReels(newReels);

    // Check for wins
    if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
      const multiplier = symbols.indexOf(newReels[0]) + 3;
      const winnings = betAmount * multiplier;
      addPoints(winnings);
      toast.success(`Jackpot! You won ${winnings} points!`);
    } else if (newReels[0] === newReels[1] || newReels[1] === newReels[2]) {
      const winnings = betAmount * 2;
      addPoints(winnings);

    toast.success(`You matched two symbols! Won ${winnings} points!`);
    } else {
      toast.error('Better luck next time!');
    }

    setIsSpinning(false);
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Math.max(minBet, Math.min(maxBet, parseInt(e.target.value))))}
          className="w-full max-w-xs mx-auto block border border-gray-300 rounded-lg px-4 py-2"
          disabled={isSpinning}
        />
        <div className="text-sm text-gray-500 mt-2">
          Min: {minBet} points | Max: {maxBet} points
        </div>
      </div>

      <div className="flex justify-center space-x-4 mb-8">
        {reels.map((symbol, index) => (
          <motion.div
            key={index}
            animate={isSpinning ? {
              y: [0, -1000, 1000, 0],
              transition: {
                duration: 2,
                times: [0, 0.25, 0.5, 1],
                ease: "easeInOut"
              }
            } : {}}
            className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-4xl"
          >
            {symbol}
          </motion.div>
        ))}
      </div>

      <button
        onClick={spinReels}
        disabled={isSpinning}
        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isSpinning ? 'Spinning...' : 'Spin'}
      </button>
    </div>
  );
};

export default SlotMachine;