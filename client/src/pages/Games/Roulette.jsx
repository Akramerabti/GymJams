import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';

const numbers = Array.from({ length: 37 }, (_, i) => i); // 0-36

const Roulette = ({ minBet, maxBet }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

  const getNumberColor = (number) => {
    if (number === 0) return 'green';
    return number % 2 === 0 ? 'black' : 'red';
  };

  const handleSpin = async () => {
    if (!selectedNumber && !selectedColor) {
      toast.error('Please place a bet');
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

    setIsSpinning(true);
    subtractPoints(betAmount);

    const result = Math.floor(Math.random() * 37);
    const resultColor = getNumberColor(result);

    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate spinning animation

    let winnings = 0;
    if (selectedNumber === result) {
      winnings = betAmount * 35;
      addPoints(winnings);
      toast.success(`You won ${winnings} points!`);
    } else if (selectedColor === resultColor) {
      winnings = betAmount * 2;
      addPoints(winnings);
      toast.success(`You won ${winnings} points!`);
    } else {
      toast.error(`Ball landed on ${result} ${resultColor}`);
    }

    // Update points in the backend
    await updatePointsInBackend(balance + (winnings > 0 ? winnings : -betAmount));

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

      <div className="mb-8">
        <div className="grid grid-cols-6 gap-2 mb-4">
          {numbers.map(number => (
            <motion.button
              key={number}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSelectedNumber(number);
                setSelectedColor(null);
              }}
              className={`p-2 rounded ${
                selectedNumber === number 
                  ? 'ring-2 ring-purple-500' 
                  : ''
              } ${
                getNumberColor(number) === 'red' 
                  ? 'bg-red-500 text-white' 
                  : getNumberColor(number) === 'black' 
                    ? 'bg-gray-900 text-white'
                    : 'bg-green-500 text-white'
              }`}
              disabled={isSpinning}
            >
              {number}
            </motion.button>
          ))}
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              setSelectedColor('red');
              setSelectedNumber(null);
            }}
            className={`px-6 py-2 bg-red-500 text-white rounded ${
              selectedColor === 'red' ? 'ring-2 ring-purple-500' : ''
            }`}
            disabled={isSpinning}
          >
            Red
          </button>
          <button
            onClick={() => {
              setSelectedColor('black');
              setSelectedNumber(null);
            }}
            className={`px-6 py-2 bg-gray-900 text-white rounded ${
              selectedColor === 'black' ? 'ring-2 ring-purple-500' : ''
            }`}
            disabled={isSpinning}
          >
            Black
          </button>
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning || (!selectedNumber && !selectedColor)}
        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {isSpinning ? 'Spinning...' : 'Spin'}
      </button>
    </div>
  );
};

export default Roulette;