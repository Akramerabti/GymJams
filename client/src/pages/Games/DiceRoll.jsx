import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const DiceRoll = ({ minBet, maxBet }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isRolling, setIsRolling] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const { balance, subtractPoints, addPoints } = usePoints();

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  const handleRoll = async () => {
    if (!prediction) {
      toast.error('Please select a number');
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

    setIsRolling(true);
    subtractPoints(betAmount);

    const result = Math.floor(Math.random() * 6) + 1;
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (result === prediction) {
      const winnings = betAmount * 5;
      addPoints(winnings);
      toast.success(`You won ${winnings} points!`);
    } else {
      toast.error(`You lost! The dice showed ${result}`);
    }

    setIsRolling(false);
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Math.max(minBet, Math.min(maxBet, parseInt(e.target.value))))}
          className="w-full max-w-xs mx-auto block border border-gray-300 rounded-lg px-4 py-2"
          disabled={isRolling}
        />
        <div className="text-sm text-gray-500 mt-2">
          Min: {minBet} points | Max: {maxBet} points
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 mb-8">
        {diceIcons.map((DiceIcon, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPrediction(index + 1)}
            className={`p-4 rounded-lg ${prediction === index + 1 ? 'bg-purple-100' : 'bg-gray-100'}`}
            disabled={isRolling}
          >
            <DiceIcon className="w-8 h-8" />
          </motion.button>
        ))}
      </div>

      <button
        onClick={handleRoll}
        disabled={isRolling || !prediction}
        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isRolling ? 'Rolling...' : 'Roll Dice'}
      </button>
    </div>
  );
};

export default DiceRoll;