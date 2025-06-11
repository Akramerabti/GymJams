import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';
import { gsap } from 'gsap';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { 
  Cherry, 
  Banana, 
  Diamond, 
  Crown, 
  Star, 
  Coins
} from 'lucide-react';

// Using only available Lucide icons
const symbols = [
  { icon: <Cherry size={60} className="text-red-400" />, value: 'cherry' },
  { icon: <Banana size={60} className="text-yellow-400" />, value: 'banana' },
  { icon: <Diamond size={60} className="text-blue-400" />, value: 'diamond' },
  { icon: <Crown size={60} className="text-yellow-500" />, value: 'crown' },
  { icon: <Star size={60} className="text-yellow-400" />, value: 'star' },
  { icon: <Coins size={60} className="text-yellow-600" />, value: 'coins' },
];

const SlotMachine = ({ minBet, maxBet }) => {
  const { width, height } = useWindowSize();
  const [betAmount, setBetAmount] = useState(minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState(Array(3).fill(symbols[0]));
  const [showJackpot, setShowJackpot] = useState(false);
  const [winMultiplier, setWinMultiplier] = useState(1);
  const reelRefs = useRef([]);
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

  const spinReels = async () => {
    if (isSpinning) return;
    if (betAmount > balance) return toast.error('Insufficient points');
    if (betAmount < minBet || betAmount > maxBet) return toast.error(`Bet must be ${minBet}-${maxBet}`);

    setIsSpinning(true);
    subtractPoints(betAmount);

    // GSAP spinning animation
    const tl = gsap.timeline();
    reelRefs.current.forEach((reel, i) => {
      tl.to(reel, {
        duration: 2,
        y: '-=1000',
        ease: 'power4.inOut',
        modifiers: {
          y: gsap.utils.unitize(y => (parseFloat(y) % 600) + 600)
        }
      }, i * 0.1);
    });

    // Determine outcome
    const results = Array(3).fill().map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    const isJackpot = results.every(s => s.value === results[0].value);
    const isWin = isJackpot || new Set(results.map(s => s.value)).size < 3;

    // Animated reveal
    setTimeout(() => {
      setReels(results);
      setIsSpinning(false);
      
      if (isJackpot) {
        setShowJackpot(true);
        setTimeout(() => setShowJackpot(false), 5000);
      }

      if (isWin) {
        const multiplier = isJackpot ? 10 : 3;
        const winnings = betAmount * multiplier;
        addPoints(winnings);
        setWinMultiplier(multiplier);
        updatePointsInBackend(balance - betAmount + winnings);
      } else {
        updatePointsInBackend(balance - betAmount);
      }
    }, 3000);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
      {showJackpot && <Confetti width={width} height={height} recycle={false} />}
      
      <motion.div 
        className="relative bg-gray-800 p-8 rounded-2xl shadow-2xl border-4 border-yellow-400"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex flex-col items-center space-y-4">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.min(Math.max(minBet, Number(e.target.value)), maxBet))}
              className="w-48 text-center bg-gray-700 text-2xl text-yellow-400 py-3 rounded-lg border-2 border-yellow-400"
            />
            <div className="absolute -bottom-6 text-sm text-yellow-400/80">
              Min: {minBet} | Max: {maxBet}
            </div>
          </motion.div>
        </div>

        <div className="relative bg-black/30 p-6 rounded-xl mb-8 overflow-hidden">
          <div className="flex gap-4 mb-4">
            {reels.map((_, i) => (
              <div 
                key={i}
                ref={el => reelRefs.current[i] = el}
                className="w-32 h-48 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden relative"
              >
                {symbols.concat(symbols).map((symbol, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute w-full h-16 flex items-center justify-center"
                    style={{ y: idx * 96 }}
                  >
                    {symbol.icon}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex justify-between pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1 bg-yellow-400/30 h-full" />
            ))}
          </div>
        </div>

        <motion.button
          onClick={spinReels}
          disabled={isSpinning}
          className="w-full py-4 text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl 
                   shadow-lg hover:shadow-xl transition-shadow duration-200 relative overflow-hidden disabled:opacity-50"
          whileHover={!isSpinning ? { scale: 1.05 } : {}}
          whileTap={!isSpinning ? { scale: 0.95 } : {}}
        >
          {isSpinning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🎰
            </motion.div>
          ) : (
            'SPIN'
          )}
          <div className="absolute inset-0 rounded-xl shadow-lg animate-pulse" />
        </motion.button>

        <AnimatePresence>
          {winMultiplier > 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-6xl font-bold text-yellow-400 animate-bounce">
                x{winMultiplier}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showJackpot && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl font-bold text-yellow-400 animate-pulse">
            JACKPOT!
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotMachine;