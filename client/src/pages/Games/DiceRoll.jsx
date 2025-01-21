import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const DiceRoll = ({ minBet, maxBet }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isRolling, setIsRolling] = useState(false);
  const [prediction, setPrediction] = useState(null); // User's prediction (1-6)
  const [result, setResult] = useState(null); // Result of the dice roll (1-6)
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

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

    // Simulate a dice roll
    const diceResult = Math.floor(Math.random() * 6) + 1;
    setResult(diceResult);

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate rolling animation

    let winnings = 0;
    if (diceResult === prediction) {
      winnings = betAmount * 5;
      addPoints(winnings);
      toast.success(`You won ${winnings} points!`);
    } else {
      toast.error(`You lost! The dice showed ${diceResult}`);
    }

    // Calculate the updated balance
    const updatedBalance = balance - betAmount + (diceResult === prediction ? winnings : 0);

    // Update points in the backend
    await updatePointsInBackend(updatedBalance);

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

      {/* Dice Selection */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {diceIcons.map((DiceIcon, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPrediction(index + 1)}
            className={`p-4 rounded-lg transition-all ${
              prediction === index + 1
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isRolling}
          >
            <DiceIcon className="w-8 h-8" />
          </motion.button>
        ))}
      </div>

      {/* Dice Roll Animation */}
      <AnimatePresence>
        {isRolling && (
          <motion.div
            initial={{ rotate: 0, scale: 1 }}
            animate={{ rotate: 360, scale: 1.2 }}
            exit={{ rotate: 0, scale: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-8 flex items-center justify-center"
          >
            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {React.createElement(diceIcons[result - 1], { className: "w-16 h-16" })}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roll Button */}
      <button
        onClick={handleRoll}
        disabled={isRolling || !prediction}
        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isRolling ? 'Rolling...' : 'Roll Dice'}
      </button>

      {/* Result Display */}
      {result && !isRolling && (
        <div className="mt-8 text-xl font-semibold">
          {result === prediction ? 'You won! 🎉' : 'You lost. 😢'}
        </div>
      )}
    </div>
  );
};

export default DiceRoll;