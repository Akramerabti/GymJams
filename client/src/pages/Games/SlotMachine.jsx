import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';
import { gsap } from 'gsap';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { 
  Cherry, 
  Grape, 
  Diamond, 
  Crown, 
  Star, 
  Coins,
  Zap,
  Gem,
  Play,
  Minus,
  Plus,
  Sparkles,
  TrendingUp,
  Gift,
  Info,
  HelpCircle
} from 'lucide-react';

// Enhanced symbols with better visual hierarchy and rarity
const symbols = [
  { icon: <Cherry size={48} />, value: 'cherry', color: 'text-red-400', bg: 'from-red-500/20 to-red-600/20', multiplier: 2, rarity: 'common' },
  { icon: <Grape size={48} />, value: 'grape', color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/20', multiplier: 2, rarity: 'common' },
  { icon: <Zap size={48} />, value: 'lightning', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-600/20', multiplier: 3, rarity: 'uncommon' },
  { icon: <Gem size={48} />, value: 'gem', color: 'text-cyan-400', bg: 'from-cyan-500/20 to-cyan-600/20', multiplier: 4, rarity: 'uncommon' },
  { icon: <Diamond size={48} />, value: 'diamond', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/20', multiplier: 5, rarity: 'rare' },
  { icon: <Crown size={48} />, value: 'crown', color: 'text-yellow-500', bg: 'from-yellow-500/20 to-amber-600/20', multiplier: 7, rarity: 'rare' },
  { icon: <Star size={48} />, value: 'star', color: 'text-orange-400', bg: 'from-orange-500/20 to-red-600/20', multiplier: 8, rarity: 'epic' },
  { icon: <Coins size={48} />, value: 'jackpot', color: 'text-yellow-600', bg: 'from-yellow-500/30 to-yellow-600/30', multiplier: 15, rarity: 'legendary' },
];

// Rarity colors for enhanced UI feedback
const rarityColors = {
  common: 'border-gray-400/30 shadow-gray-400/20',
  uncommon: 'border-green-400/30 shadow-green-400/20',
  rare: 'border-blue-400/30 shadow-blue-400/20',
  epic: 'border-purple-400/30 shadow-purple-400/20',
  legendary: 'border-yellow-400/30 shadow-yellow-400/40'
};

const SlotMachine = ({ minBet = 50, maxBet = 5000 }) => {
  const { width, height } = useWindowSize();
  const [betAmount, setBetAmount] = useState(minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState(Array(3).fill(symbols[0]));
  const [showJackpot, setShowJackpot] = useState(false);
  const [winMultiplier, setWinMultiplier] = useState(0);  const [lastWin, setLastWin] = useState(null);
  const [spinCount, setSpinCount] = useState(0);
  const [streak, setStreak] = useState(0);const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [showPaytable, setShowPaytable] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const reelRefs = useRef([]);
  const machineRef = useRef(null);
  const celebrationRef = useRef(null);
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

  // Prevent scrolling on this game
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Enhanced animations
  const machineControls = useAnimation();
  const jackpotControls = useAnimation();

  // Responsive sizing with enhanced breakpoints
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Dynamic bet increments based on balance
  const getBetIncrement = useCallback(() => {
    if (balance < 1000) return minBet;
    if (balance < 10000) return minBet * 2;
    return minBet * 5;
  }, [balance, minBet]);

  // Streak bonus calculation
  const getStreakBonus = useCallback((currentStreak) => {
    if (currentStreak >= 5) return 0.5; // 50% bonus
    if (currentStreak >= 3) return 0.25; // 25% bonus
    return 0;
  }, []);  // Enhanced spin animation with better physics and anticipation
  const spinReels = async () => {
    if (isSpinning) return;
    if (betAmount > balance) return toast.error('Insufficient points');
    if (betAmount < minBet || betAmount > maxBet) return toast.error(`Bet must be ${minBet}-${maxBet}`);

    setIsSpinning(true);
    setWinMultiplier(0);
    setLastWin(null);
    subtractPoints(betAmount);
    setSpinCount(prev => prev + 1);    // Enhanced machine shake with anticipation build-up
    if (machineRef.current) {
      await machineControls.start({
        scale: [1, 1.02, 1],
        rotateZ: [0, -1, 1, 0],
        transition: { duration: 0.5, ease: "easeInOut" }
      });
    }

    // Progressive tension build-up
    const anticipationTl = gsap.timeline();
    anticipationTl
      .to(reelRefs.current, { duration: 0.3, scale: 0.95 })
      .to(reelRefs.current, { duration: 0.2, scale: 1.05 })
      .to(reelRefs.current, { duration: 0.2, scale: 1 });

    // Advanced GSAP spinning with realistic physics
    const tl = gsap.timeline();
    const spinDurations = [2.5, 2.8, 3.0]; // Reduced durations for faster reveal
    const rotations = [1080, 1260, 1440]; // Different rotation amounts
    
    reelRefs.current.forEach((reel, i) => {
      if (reel) {
        tl.to(reel, {
          duration: spinDurations[i],
          rotation: `+=${rotations[i]}`,
          y: '-=3000',
          ease: 'power4.out',
          modifiers: {
            y: gsap.utils.unitize(y => (parseFloat(y) % 1000) + 1000)
          }
        }, i * 0.2); // Reduced stagger delay from 0.3 to 0.2
      }
    });

    // Enhanced outcome determination with better probability distribution
    const getWeightedResult = () => {
      const rand = Math.random();
      // Apply streak bonus for better odds
      const streakMultiplier = streak >= 3 ? 0.1 : 0;
      
      if (rand < (0.015 + streakMultiplier)) return symbols[7]; // Jackpot - 1.5% + streak bonus
      if (rand < (0.03 + streakMultiplier)) return symbols[6]; // Star - 1.5%
      if (rand < (0.06 + streakMultiplier)) return symbols[5]; // Crown - 3%
      if (rand < (0.12 + streakMultiplier)) return symbols[4]; // Diamond - 6%
      if (rand < (0.25 + streakMultiplier)) return symbols[3]; // Gem - 13%
      if (rand < (0.45 + streakMultiplier)) return symbols[2]; // Lightning - 20%
      return Math.random() < 0.5 ? symbols[0] : symbols[1]; // Cherry/Grape - 55%
    };

    const results = Array(3).fill().map(() => getWeightedResult());
    
    // Enhanced win calculation with bonus features
    const uniqueValues = new Set(results.map(s => s.value));
    const isTriple = uniqueValues.size === 1;
    const isPair = uniqueValues.size === 2;
    const hasRareSymbol = results.some(s => ['epic', 'legendary'].includes(s.rarity));

    let multiplier = 0;
    let bonusMessage = '';

    if (isTriple) {
      multiplier = results[0].multiplier;
      const streakBonus = getStreakBonus(streak);
      if (streakBonus > 0) {
        multiplier = Math.floor(multiplier * (1 + streakBonus));
        bonusMessage = `Streak Bonus +${Math.floor(streakBonus * 100)}%!`;
      }
      
      if (results[0].value === 'jackpot') {
        setShowJackpot(true);
        setTimeout(() => setShowJackpot(false), 8000);
        // Trigger confetti burst
        if (celebrationRef.current) {
          gsap.fromTo(celebrationRef.current, 
            { scale: 0, rotation: -180 },
            { scale: 1.5, rotation: 360, duration: 2, ease: "elastic.out" }
          );
        }
      }
    } else if (isPair) {
      const pairSymbol = results.find(s => results.filter(r => r.value === s.value).length === 2);
      multiplier = Math.max(1, Math.floor(pairSymbol.multiplier / 2));
    }    // Bonus for rare symbols (even without wins)
    if (!isTriple && !isPair && hasRareSymbol) {
      multiplier = 1;
      bonusMessage = 'Rare Symbol Bonus!';
    }    // Animated reveal with enhanced timing and effects
    const staggerDelay = 0.2; // Stagger delay between reels
    const revealDelay = (Math.max(...spinDurations) + (staggerDelay * (spinDurations.length - 1))) * 1000; // Convert to milliseconds
    //('Spin durations:', spinDurations, 'Stagger delay:', staggerDelay, 'Reveal delay:', revealDelay); // Debug timing
    setTimeout(() => {
      setReels(results);
      setIsSpinning(false);
      
      if (multiplier > 0) {
        const winnings = betAmount * multiplier;
        addPoints(winnings);
        setWinMultiplier(multiplier);
        setLastWin(winnings);
        setTotalWinnings(prev => prev + winnings);
        setStreak(prev => prev + 1);
        updatePointsInBackend(balance - betAmount + winnings);
        
        // Enhanced celebration effects with particle systems
        const celebrationLevel = 
          multiplier >= 15 ? 'legendary' :
          multiplier >= 10 ? 'epic' :
          multiplier >= 5 ? 'rare' :
          multiplier >= 3 ? 'uncommon' : 'common';

        // Show streak bonus notification
        if (bonusMessage) {
          setTimeout(() => {
            setShowStreakBonus(true);
            setTimeout(() => setShowStreakBonus(false), 3000);
          }, 1000);
        }
        
        // Tiered celebration messages with enhanced effects
        switch (celebrationLevel) {
          case 'legendary':
            toast.success(`🏆 LEGENDARY WIN! ${winnings.toLocaleString()} points! ${bonusMessage}`, { 
              duration: 6000,
              style: { background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#000' }
            });
            // Trigger screen shake
            if (machineRef.current) {
              gsap.to(machineRef.current, {
                duration: 0.05,
                x: "+=10",
                yoyo: true,
                repeat: 20,
                ease: "power2.inOut"
              });
            }
            break;
          case 'epic':
            toast.success(`🎆 EPIC WIN! ${winnings.toLocaleString()} points! ${bonusMessage}`, { 
              duration: 5000,
              style: { background: 'linear-gradient(45deg, #9333EA, #C084FC)', color: '#FFF' }
            });
            break;
          case 'rare':
            toast.success(`🔥 BIG WIN! ${winnings.toLocaleString()} points! ${bonusMessage}`, { 
              duration: 4000,
              style: { background: 'linear-gradient(45deg, #3B82F6, #60A5FA)', color: '#FFF' }
            });
            break;
          case 'uncommon':
            toast.success(`✨ NICE WIN! ${winnings.toLocaleString()} points! ${bonusMessage}`, { 
              duration: 3000,
              style: { background: 'linear-gradient(45deg, #10B981, #34D399)', color: '#FFF' }
            });
            break;
          default:
            toast.success(`💰 Win! ${winnings.toLocaleString()} points! ${bonusMessage}`);
        }
      } else {
        setStreak(0); // Reset streak on loss
        updatePointsInBackend(balance - betAmount);
        
        // Encouraging messages for near-misses
        const nearMiss = results.filter((r, i, arr) => arr.filter(s => s.value === r.value).length > 1).length > 0;
        if (nearMiss) {          toast.info('🎯 So close! Try again!', { duration: 2000 });
        }
      }
    }, revealDelay);
  };
  const adjustBet = (amount) => {
    const increment = getBetIncrement();
    const newBet = Math.max(minBet, Math.min(maxBet, betAmount + (amount * increment)));
    setBetAmount(newBet);
  };

  const setMaxBet = () => setBetAmount(Math.min(maxBet, balance));
  const setHalfBet = () => setBetAmount(Math.max(minBet, Math.floor(betAmount / 2)));
  const setQuickBet = (percentage) => {
    const quickBet = Math.max(minBet, Math.min(maxBet, Math.floor(balance * percentage)));
    setBetAmount(quickBet);
  };

  // Auto-spin functionality
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const autoSpinRef = useRef(null);

  const startAutoSpin = (count) => {
    setAutoSpinCount(count);
    setIsAutoSpinning(true);
    autoSpinRef.current = setInterval(() => {
      if (!isSpinning && betAmount <= balance) {
        spinReels();
        setAutoSpinCount(prev => {
          if (prev <= 1) {
            setIsAutoSpinning(false);
            clearInterval(autoSpinRef.current);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 4000); // 4 second intervals
  };

  const stopAutoSpin = () => {
    setIsAutoSpinning(false);
    setAutoSpinCount(0);
    if (autoSpinRef.current) {
      clearInterval(autoSpinRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (autoSpinRef.current) {
        clearInterval(autoSpinRef.current);
      }
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-400/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-16 w-48 h-48 bg-purple-400/10 rounded-full animate-bounce"></div>
        <div className="absolute bottom-16 left-1/4 w-24 h-24 bg-pink-400/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-400/10 rounded-full animate-bounce"></div>
      </div>

      {/* Confetti for jackpots */}
      {showJackpot && (
        <Confetti 
          width={width} 
          height={height} 
          recycle={false} 
          numberOfPieces={300}
          gravity={0.3}
        />
      )}      {/* Main slot machine container */}
      <motion.div 
        ref={machineRef}
        className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-black 
          ${isMobile ? 'p-4 rounded-2xl w-full max-w-sm' : isTablet ? 'p-6 rounded-3xl w-full max-w-lg' : 'p-8 rounded-4xl w-full max-w-xl'} 
          shadow-2xl border-4 border-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600
          backdrop-blur-sm bg-opacity-95 mx-auto`}
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          boxShadow: '0 0 50px rgba(255, 215, 0, 0.3), inset 0 0 30px rgba(255, 215, 0, 0.1)'
        }}
      >{/* Enhanced slot machine header with statistics */}
        <motion.div 
          className="text-center mb-4 sm:mb-6 space-y-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className={`font-bold bg-gradient-to-r from-yellow-900 via-amber-500 to-yellow-900 bg-clip-text text-transparent
            ${isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl'}`}>
            🎰 SLOT MACHINE 🎰
          </h1>
          
          {/* Enhanced stats panel */}
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-3'} text-center`}>
            <div className="bg-black/30 rounded-lg p-2 border border-yellow-400/20">
              <div className="flex items-center justify-center gap-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className={`text-yellow-400 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {balance.toLocaleString()}
                </span>
              </div>
              <div className={`text-yellow-300/70 ${isMobile ? 'text-xs' : 'text-xs'}`}>Balance</div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-2 border border-purple-400/20">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className={`text-purple-400 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {streak}
                </span>
              </div>
              <div className={`text-purple-300/70 ${isMobile ? 'text-xs' : 'text-xs'}`}>Streak</div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-2 border border-green-400/20">
              <div className="flex items-center justify-center gap-1">
                <Gift className="w-4 h-4 text-green-400" />
                <span className={`text-green-400 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {totalWinnings.toLocaleString()}
                </span>
              </div>
              <div className={`text-green-300/70 ${isMobile ? 'text-xs' : 'text-xs'}`}>Total Won</div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-2 border border-blue-400/20">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className={`text-blue-400 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {spinCount}
                </span>
              </div>
              <div className={`text-blue-300/70 ${isMobile ? 'text-xs' : 'text-xs'}`}>Spins</div>
            </div>
          </div>

          {/* Streak bonus indicator */}
          {streak >= 3 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-2 border border-purple-400/30"
            >
              <div className={`text-purple-400 font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                🔥 Hot Streak! +{Math.floor(getStreakBonus(streak) * 100)}% Win Bonus
              </div>
            </motion.div>
          )}
        </motion.div>        {/* Enhanced betting controls */}
        <motion.div 
          className={`mb-4 sm:mb-6 ${isMobile ? 'space-y-3' : 'space-y-4'}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Bet amount display */}
          <div className="text-center">
            <div className={`text-white/80 ${isMobile ? 'text-xs' : 'text-sm'} mb-2`}>
              Bet Amount
            </div>
            <div className={`bg-black/50 rounded-xl p-3 border-2 border-yellow-400/30 ${isMobile ? 'mx-2' : 'mx-4'}`}>
              <div className={`text-yellow-400 font-bold ${isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'}`}>
                {betAmount.toLocaleString()}
              </div>
              {getBetIncrement() > minBet && (
                <div className={`text-yellow-300/60 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  +/- {getBetIncrement().toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Main bet controls */}
          <div className={`flex items-center justify-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
            <motion.button
              onClick={() => adjustBet(-1)}
              disabled={betAmount <= minBet}
              className={`bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg
                ${isMobile ? 'p-2' : 'p-3'} transition-all duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Minus className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            </motion.button>

            <motion.button
              onClick={setHalfBet}
              className={`bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-3
                ${isMobile ? 'py-2 text-xs' : 'py-3 text-sm'} font-medium transition-all duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              1/2
            </motion.button>

            <input
              type="number"
              value={betAmount}
              onChange={(e) => {
                const value = Math.min(Math.max(minBet, Number(e.target.value) || minBet), maxBet);
                setBetAmount(value);
              }}
              className={`bg-gray-800 text-yellow-400 text-center rounded-lg border-2 border-yellow-400/30 
                focus:border-yellow-400 focus:outline-none transition-all duration-200
                ${isMobile ? 'w-20 py-2 text-sm' : 'w-24 py-3'}`}
              min={minBet}
              max={maxBet}
            />

            <motion.button
              onClick={setMaxBet}
              className={`bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3
                ${isMobile ? 'py-2 text-xs' : 'py-3 text-sm'} font-medium transition-all duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              MAX
            </motion.button>

            <motion.button
              onClick={() => adjustBet(1)}
              disabled={betAmount >= maxBet}
              className={`bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg
                ${isMobile ? 'p-2' : 'p-3'} transition-all duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            </motion.button>
          </div>

          {/* Quick bet options */}
          <div className={`flex justify-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
            {[0.01, 0.05, 0.1, 0.25].map((percentage) => (
              <motion.button
                key={percentage}
                onClick={() => setQuickBet(percentage)}
                className={`bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 
                  text-white rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200
                  ${betAmount === Math.floor(balance * percentage) ? 'ring-2 ring-yellow-400' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {Math.floor(percentage * 100)}%
              </motion.button>
            ))}
          </div>

          {/* Auto-spin controls */}
          {!isMobile && (
            <div className="flex justify-center gap-2">
              {!isAutoSpinning ? (
                <>
                  {[10, 25, 50, 100].map((count) => (
                    <motion.button
                      key={count}
                      onClick={() => startAutoSpin(count)}
                      disabled={isSpinning || betAmount > balance}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 
                        disabled:opacity-50 text-white rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Auto {count}
                    </motion.button>
                  ))}
                </>
              ) : (
                <motion.button
                  onClick={stopAutoSpin}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 
                    text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Stop Auto ({autoSpinCount})
                </motion.button>
              )}
            </div>
          )}

          <div className={`text-center text-white/60 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Min: {minBet.toLocaleString()} | Max: {maxBet.toLocaleString()}
          </div>
        </motion.div>        {/* Slot machine reels */}
        <motion.div 
          className={`relative bg-gradient-to-b from-black via-gray-900 to-black rounded-xl overflow-visible
            ${isMobile ? 'p-4 mb-4' : isTablet ? 'p-6 mb-6' : 'p-8 mb-8'}
            border-4 border-yellow-400/50 shadow-inner min-w-fit`}
          initial={{ rotateX: -15, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)'
          }}
        >          {/* Enhanced reels container with better spacing */}
          <div className={`flex justify-center items-center ${isMobile ? 'gap-2 mb-3' : 'gap-4 mb-4'} min-h-fit overflow-visible w-full`}>
            {reels.map((symbol, i) => (
              <motion.div 
                key={i}
                ref={el => reelRefs.current[i] = el}
                className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 flex-shrink-0
                  ${isMobile ? 'w-20 h-24' : isTablet ? 'w-24 h-28' : 'w-28 h-32'}
                  bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg
                  ${rarityColors[symbol.rarity] || 'border-gray-400/30 shadow-gray-400/20'}`}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              >
                {/* Enhanced spinning overlay with rarity effects */}
                {isSpinning && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent z-10"
                      animate={{ 
                        backgroundPosition: ['0% 0%', '0% 100%'],
                        opacity: [0.3, 0.7, 0.3]
                      }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    {/* Spinning particles */}
                    <motion.div
                      className="absolute inset-0 z-20 pointer-events-none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      {[...Array(6)].map((_, idx) => (
                        <motion.div
                          key={idx}
                          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                          style={{
                            top: `${20 + (idx * 10)}%`,
                            left: `${10 + (idx * 15)}%`,
                          }}
                          animate={{
                            scale: [0.5, 1, 0.5],
                            opacity: [0.3, 1, 0.3]
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: idx * 0.1
                          }}
                        />
                      ))}
                    </motion.div>
                  </>
                )}

                {/* Enhanced symbol display with rarity effects */}
                <motion.div
                  className={`absolute inset-0 flex items-center justify-center ${symbol.color}
                    bg-gradient-to-br ${symbol.bg} backdrop-blur-sm relative`}
                  animate={winMultiplier > 0 && !isSpinning ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{ duration: 0.6, repeat: winMultiplier > 0 ? 3 : 0 }}
                >                  {React.cloneElement(symbol.icon, {
                    size: isMobile ? 32 : isTablet ? 40 : 48,
                    className: `${symbol.color} drop-shadow-lg filter ${
                      symbol.rarity === 'legendary' ? 'drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]' :
                      symbol.rarity === 'epic' ? 'drop-shadow-[0_0_8px_rgba(147,51,234,0.6)]' :
                      symbol.rarity === 'rare' ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]' :
                      'drop-shadow-lg'
                    }`
                  })}
                  
                  {/* Rarity indicator */}
                  {symbol.rarity === 'legendary' && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  {symbol.rarity === 'epic' && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Enhanced reel shine effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                             transform -skew-x-12 pointer-events-none" 
                  animate={{
                    x: [-100, 100],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 5
                  }}
                />

                {/* Win glow effect */}
                {winMultiplier > 0 && !isSpinning && (
                  <motion.div
                    className={`absolute inset-0 rounded-lg ${
                      symbol.rarity === 'legendary' ? 'shadow-[0_0_20px_rgba(255,215,0,0.8)]' :
                      symbol.rarity === 'epic' ? 'shadow-[0_0_15px_rgba(147,51,234,0.6)]' :
                      'shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                    }`}
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(34,197,94,0)',
                        '0 0 20px rgba(34,197,94,0.8)',
                        '0 0 0px rgba(34,197,94,0)'
                      ]
                    }}
                    transition={{ duration: 1, repeat: 3 }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Win line indicator */}
          {winMultiplier > 0 && (
            <motion.div
              className="absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          )}
        </motion.div>

        {/* Spin button */}
        <motion.button
          onClick={spinReels}
          disabled={isSpinning || betAmount > balance}
          className={`w-full font-bold rounded-xl shadow-lg relative overflow-hidden
            ${isMobile ? 'py-3 text-lg' : isTablet ? 'py-4 text-xl' : 'py-5 text-2xl'}
            ${isSpinning 
              ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-black hover:from-yellow-500 hover:to-amber-600'
            } transition-all duration-300 transform`}
          whileHover={!isSpinning && betAmount <= balance ? { scale: 1.02, y: -2 } : {}}
          whileTap={!isSpinning && betAmount <= balance ? { scale: 0.98 } : {}}
          style={{
            boxShadow: isSpinning 
              ? '0 4px 15px rgba(0, 0, 0, 0.3)' 
              : '0 8px 25px rgba(255, 215, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          <motion.div
            className="flex items-center justify-center gap-3"
            animate={isSpinning ? { rotate: 360 } : {}}
            transition={isSpinning ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            {isSpinning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                >
                  🎰
                </motion.div>
                <span>SPINNING...</span>
              </>
            ) : (
              <>
                <Play className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                <span>SPIN TO WIN</span>
              </>
            )}
          </motion.div>

          {/* Button shine effect */}
          {!isSpinning && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                         transform -skew-x-12"
              animate={{ x: [-200, 200] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          )}
        </motion.button>

        {/* Last win display */}
        <AnimatePresence>
          {lastWin && winMultiplier > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -20 }}
              className={`mt-4 text-center p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 
                         rounded-xl border border-green-400/30 backdrop-blur-sm`}
            >
              <div className={`text-green-400 font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>
                🎉 Last Win: {lastWin.toLocaleString()} points!
              </div>
              <div className={`text-green-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Multiplier: x{winMultiplier}
              </div>
            </motion.div>
          )}
        </AnimatePresence>        {/* Info button and paytable */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Rules/Info button */}
          <motion.button
            onClick={() => setShowRules(!showRules)}
            className={`p-2 rounded-full bg-black/30 text-white/70 
                       hover:text-white hover:bg-black/50 transition-all duration-200
                       ${showRules ? 'bg-blue-400/30 text-blue-400' : ''}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Info className="w-4 h-4" />
          </motion.button>
          
          {/* Paytable toggle (desktop only) */}
          {!isMobile && (
            <motion.button
              onClick={() => setShowPaytable(!showPaytable)}
              className={`p-2 rounded-full bg-black/30 text-white/70 
                         hover:text-white hover:bg-black/50 transition-all duration-200
                         ${showPaytable ? 'bg-yellow-400/30 text-yellow-400' : ''}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Gift className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Streak bonus celebration overlay */}
      <AnimatePresence>
        {showStreakBonus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-45"
          >
            <motion.div
              className={`text-center p-6 bg-gradient-to-br from-purple-500/90 to-pink-500/90 
                         rounded-2xl border-2 border-purple-300 backdrop-blur-sm shadow-2xl`}
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 1, -1, 0]
              }}
              transition={{ duration: 0.8, repeat: 2 }}
            >
              <motion.div
                className={`font-bold text-white ${isMobile ? 'text-2xl' : 'text-4xl'}`}
                animate={{ 
                  textShadow: [
                    '0 0 10px rgba(147, 51, 234, 0.8)',
                    '0 0 20px rgba(147, 51, 234, 1)',
                    '0 0 10px rgba(147, 51, 234, 0.8)'
                  ]
                }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                🔥 STREAK BONUS! 🔥
              </motion.div>
              <div className={`text-purple-100 font-semibold mt-2 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                +{Math.floor(getStreakBonus(streak) * 100)}% Win Multiplier!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jackpot celebration overlay */}
      <AnimatePresence>
        {showJackpot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <motion.div
              className={`text-center p-8 bg-gradient-to-br from-yellow-400/90 to-amber-600/90 
                         rounded-3xl border-4 border-yellow-300 backdrop-blur-sm`}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <motion.div
                className={`font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent
                           ${isMobile ? 'text-4xl' : isTablet ? 'text-6xl' : 'text-8xl'}`}
                animate={{ 
                  textShadow: [
                    '0 0 20px rgba(255, 255, 0, 0.8)',
                    '0 0 40px rgba(255, 255, 0, 1)',
                    '0 0 20px rgba(255, 255, 0, 0.8)'
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                💰 JACKPOT! 💰
              </motion.div>
              <div className={`text-black font-bold mt-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                MEGA WIN!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win multiplier overlay */}
      <AnimatePresence>
        {winMultiplier > 0 && !showJackpot && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <motion.div
              className={`font-bold text-yellow-400 ${isMobile ? 'text-6xl' : 'text-8xl'}`}
              animate={{ 
                scale: [1, 1.2, 1],
                textShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.8)',
                  '0 0 40px rgba(255, 215, 0, 1)',
                  '0 0 20px rgba(255, 215, 0, 0.8)'
                ]
              }}
              transition={{ duration: 0.6, repeat: 2 }}
            >
              ×{winMultiplier}
            </motion.div>          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules/Info overlay */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-6 max-w-lg mx-auto
                         border-2 border-blue-400/30 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <HelpCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-blue-400 mb-2">🎰 HOW TO WIN 🎰</h3>
                <p className="text-white/70 text-sm">Master the slots and win big!</p>
              </div>
              
              {/* Basic Rules */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-400/30">
                  <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Basic Rules
                  </h4>
                  <div className="space-y-2 text-sm text-white/90">
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">🎯</span>
                      <span><strong>Triple Match:</strong> Get 3 identical symbols in a row for the full multiplier</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">💫</span>
                      <span><strong>Pair Match:</strong> Get 2 identical symbols for half the multiplier</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">💎</span>
                      <span><strong>Rare Bonus:</strong> Epic/Legendary symbols give bonus points even without matches</span>
                    </div>
                  </div>
                </div>

                {/* Symbol Values */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-400/30">
                  <h4 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Symbol Values (Triple Match)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {symbols.map((symbol) => (
                      <div key={symbol.value} className="flex items-center gap-2 p-2 rounded bg-black/30">
                        <div className={`${symbol.color}`}>
                          {React.cloneElement(symbol.icon, { size: 16 })}
                        </div>
                        <span className={`capitalize ${
                          symbol.rarity === 'legendary' ? 'text-yellow-400' :
                          symbol.rarity === 'epic' ? 'text-purple-400' :
                          symbol.rarity === 'rare' ? 'text-blue-400' :
                          symbol.rarity === 'uncommon' ? 'text-green-400' :
                          'text-gray-400'
                        }`}>
                          {symbol.value}
                        </span>
                        <span className="text-yellow-400 font-bold ml-auto">×{symbol.multiplier}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonus Features */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
                  <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Bonus Features
                  </h4>
                  <div className="space-y-3 text-sm text-white/90">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-orange-400">🔥</span>
                        <strong className="text-orange-400">Hot Streak Bonus</strong>
                      </div>
                      <div className="text-xs text-white/70 ml-6">
                        • 3+ wins in a row: +25% bonus multiplier<br/>
                        • 5+ wins in a row: +50% bonus multiplier
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-400">💎</span>
                        <strong className="text-blue-400">Rare Symbol Bonus</strong>
                      </div>
                      <div className="text-xs text-white/70 ml-6">
                        Get Epic or Legendary symbols for bonus points even without perfect matches
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-400">💰</span>
                        <strong className="text-green-400">Auto-Spin</strong>
                      </div>
                      <div className="text-xs text-white/70 ml-6">
                        Use auto-spin for hands-free gameplay (Desktop only)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
                  <h4 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Pro Tips
                  </h4>
                  <div className="space-y-2 text-sm text-white/90">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-400">💡</span>
                      <span>Use quick bet percentages (1%, 5%, 10%, 25%) for smart bankroll management</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400">🎯</span>
                      <span>Build winning streaks to unlock powerful bonus multipliers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-400">🏆</span>
                      <span>Legendary symbols (💰) trigger massive jackpot celebrations</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <motion.button
                  onClick={() => setShowRules(false)}
                  className="flex-1 bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-bold py-3 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Got it!
                </motion.button>
                {!isMobile && (
                  <motion.button
                    onClick={() => {
                      setShowRules(false);
                      setShowPaytable(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold py-3 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Paytable
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paytable overlay */}
      <AnimatePresence>
        {showPaytable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaytable(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-6 max-w-md mx-auto
                         border-2 border-yellow-400/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-yellow-400 mb-2">💰 PAYTABLE 💰</h3>
                <p className="text-white/70 text-sm">Triple symbol payouts (x bet amount)</p>
              </div>
              
              <div className="space-y-2">
                {symbols.map((symbol) => (
                  <div key={symbol.value} className="flex items-center justify-between p-2 rounded bg-black/30">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1,2,3].map(i => (
                          <div key={i} className={`w-6 h-6 ${symbol.color} flex items-center justify-center`}>
                            {React.cloneElement(symbol.icon, { size: 16 })}
                          </div>
                        ))}
                      </div>
                      <span className={`text-xs capitalize ${
                        symbol.rarity === 'legendary' ? 'text-yellow-400' :
                        symbol.rarity === 'epic' ? 'text-purple-400' :
                        symbol.rarity === 'rare' ? 'text-blue-400' :
                        symbol.rarity === 'uncommon' ? 'text-green-400' :
                        'text-gray-400'
                      }`}>
                        {symbol.rarity}
                      </span>
                    </div>
                    <div className="text-yellow-400 font-bold">×{symbol.multiplier}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded border border-purple-400/30">
                <div className="text-center text-sm text-white/90">
                  <div className="font-semibold text-purple-400 mb-1">🔥 BONUS FEATURES</div>
                  <div>• Streak Bonus: +25% at 3 wins, +50% at 5 wins</div>
                  <div>• Rare Symbol Bonus: Win even with mixed rare symbols</div>
                  <div>• Pair Payouts: Half multiplier for 2 matching symbols</div>
                </div>
              </div>
              
              <motion.button
                onClick={() => setShowPaytable(false)}
                className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold py-2 rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Got it!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SlotMachine;