import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';

// European roulette numbers in correct sequence
const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30,
  8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28,
  12, 35, 3, 26
];
const redNumbers = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

const Roulette = ({ minBet = 25, maxBet = 2500 }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const { balance, subtractPoints, addPoints } = usePoints();
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [betType, setBetType] = useState('number');

  // Prevent scrolling on this game
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  
  // Roulette configuration
  const colors = {
    0: 'green',
    ...Array.from({ length: 36 }, (_, i) => ({
      [i + 1]: (i < 18 ? (i % 2 === 0 ? 'red' : 'black') : (i % 2 === 1 ? 'red' : 'black'))
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
  };

  const payouts = {
    number: 35,
    color: 1,
    evenOdd: 1,
    dozen: 2,
    column: 2,
    half: 1
  };

  const spinWheel = async () => {
    if (betAmount < minBet || betAmount > maxBet) {
      toast.error(`Bet must be between ${minBet} and ${maxBet}`);
      return;
    }
    if (!selectedNumber && !selectedColor) {
      toast.error('Please place a bet first');
      return;
    }

    setIsSpinning(true);
    subtractPoints(betAmount);

    // Random spin parameters
    const rotations = 5 + Math.random() * 5;
    const targetRotation = rotation + (rotations * 360) + (Math.random() * 360);
    const resultNumber = Math.floor((targetRotation % 360) / (360 / 37));

    await new Promise(resolve => setTimeout(resolve, 100));
    
    setRotation(targetRotation);
    setTimeout(() => {
      setIsSpinning(false);
      setResult(resultNumber);
      checkWin(resultNumber);
    }, 5000);
  };

  const checkWin = (resultNumber) => {
    let win = false;
    let multiplier = 0;

    if (selectedNumber === resultNumber) {
      win = true;
      multiplier = payouts.number;
    } else if (selectedColor && colors[resultNumber] === selectedColor) {
      win = true;
      multiplier = payouts.color;
    }

    if (win) {
      const winnings = betAmount * multiplier;
      addPoints(winnings);
      toast.success(`Won ${winnings} points!`);
    } else {
      toast.error('Better luck next time!');
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen p-4">
      {/* Roulette Wheel */}
      <div className="relative w-64 h-64 mb-8 md:mb-0 md:mr-8">
        <motion.div
          className="relative w-full h-full rounded-full border-4 border-gray-800 overflow-hidden"
          animate={{ rotate: rotation }}
          transition={{ duration: 5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {numbers.map((number, index) => {
            const angle = (index * 360) / 37;
            return (
              <div
                key={number}
                className={`absolute w-full h-1/2 origin-bottom transform`}
                style={{
                  transform: `rotate(${angle}deg)`,
                  backgroundColor: colors[number]
                }}
              >
                <span
                  className="absolute left-1/2 -translate-x-1/2 top-2 text-white font-bold"
                  style={{ transform: `rotate(-${angle}deg)` }}
                >
                  {number}
                </span>
              </div>
            );
          })}
        </motion.div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-4 bg-yellow-400 z-10" />
      </div>

      {/* Betting Controls */}
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg">
        <div className="mb-4">
          <label className="text-white block mb-2">Bet Amount</label>
          <input
            type="number"
            min={minBet}
            max={maxBet}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(minBet, Math.min(maxBet, e.target.value)))}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {['red', 'black'].map(color => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(selectedColor === color ? null : color);
                setSelectedNumber(null);
              }}
              className={`p-2 rounded ${selectedColor === color ? 'opacity-100' : 'opacity-50'} ${color === 'red' ? 'bg-red-600' : 'bg-black'}`}
            >
              {color.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-6 gap-2 mb-4">
          {numbers.map(number => (
            <button
              key={number}
              onClick={() => {
                setSelectedNumber(selectedNumber === number ? null : number);
                setSelectedColor(null);
              }}
              className={`p-2 rounded text-xs ${selectedNumber === number ? 'border-4 border-yellow-400' : ''}`}
              style={{ backgroundColor: colors[number] }}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={spinWheel}
          disabled={isSpinning || balance < betAmount}
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold disabled:opacity-50"
        >
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>

        {result !== null && (
          <div className="mt-4 text-center text-white">
            Result: <span style={{ color: colors[result] }}>{result}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roulette;
