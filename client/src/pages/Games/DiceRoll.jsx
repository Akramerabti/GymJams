import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';
import { Play, Square, RotateCw, ChevronUp, ChevronDown } from 'lucide-react';

const EnhancedDiceGame = ({ minBet = 10, maxBet = 1000 }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [prediction, setPrediction] = useState(null);
  const [result, setResult] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(1);
  const [remainingAutoPlays, setRemainingAutoPlays] = useState(0);
  const [isWin, setIsWin] = useState(false);
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

  // Use refs to track latest values in async operations
  const autoPlayActiveRef = useRef(autoPlayActive);
  const isRollingRef = useRef(isRolling);
  const balanceRef = useRef(balance);

  useEffect(() => {
    autoPlayActiveRef.current = autoPlayActive;
    isRollingRef.current = isRolling;
    balanceRef.current = balance;
  }, [autoPlayActive, isRolling, balance]);

  // Clean up autoplay on unmount
  useEffect(() => {
    return () => {
      setAutoPlayActive(false);
      setRemainingAutoPlays(0);
    };
  }, []);

  const generateSpinSequence = useCallback((finalNumber) => {
    const sequence = [];
    const numSpins = 15;
    for (let i = 0; i < numSpins - 1; i++) {
      sequence.push(Math.floor(Math.random() * 6) + 1);
    }
    sequence.push(finalNumber);
    return sequence;
  }, []);

  const handleSingleRoll = useCallback(async () => {
    if (!prediction) {
      toast.error('Please select a number');
      return false;
    }

    if (betAmount > balanceRef.current) {
      toast.error('Insufficient points');
      setAutoPlayActive(false);
      return false;
    }

    setIsRolling(true);
    isRollingRef.current = true;
    setShowResult(false);

    // Deduct points immediately and update backend
    const newBalance = balanceRef.current - betAmount;
    subtractPoints(betAmount);
    await updatePointsInBackend(newBalance);

    const diceResult = Math.floor(Math.random() * 6) + 1;
    const sequence = generateSpinSequence(diceResult);
    let currentIndex = 0;

    return new Promise((resolve) => {
      const spinInterval = setInterval(() => {
        if (currentIndex < sequence.length) {
          setResult(sequence[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(spinInterval);
          setIsRolling(false);
          isRollingRef.current = false;
          setShowResult(true);

          const win = diceResult === prediction;
          setIsWin(win);

          if (win) {
            const winnings = betAmount * 5;
            const updatedBalance = newBalance + winnings;
            addPoints(winnings);
            toast.success(`Won ${winnings} points!`);
            updatePointsInBackend(updatedBalance);
          }

          resolve(true);
        }
      }, 100);
    });
  }, [prediction, betAmount, addPoints, subtractPoints, updatePointsInBackend]);

  const stopAutoPlay = useCallback(() => {
    setAutoPlayActive(false);
    autoPlayActiveRef.current = false;
    setRemainingAutoPlays(0);
  }, []);

  const handleAutoPlay = useCallback(async () => {
    if (autoPlayActive) {
      stopAutoPlay();
      return;
    }

    if (!prediction) {
      toast.error('Please select a number');
      return;
    }

    setAutoPlayActive(true);
    autoPlayActiveRef.current = true;
    setRemainingAutoPlays(autoPlayCount);

    const runAutoPlay = async () => {
      for (let i = 0; i < autoPlayCount; i++) {
        if (!autoPlayActiveRef.current) break;

        const rollResult = await handleSingleRoll();
        if (!rollResult) {
          stopAutoPlay();
          break;
        }

        setRemainingAutoPlays(autoPlayCount - (i + 1));

        if (i < autoPlayCount - 1 && autoPlayActiveRef.current) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      stopAutoPlay();
    };

    runAutoPlay();
  }, [autoPlayActive, autoPlayCount, handleSingleRoll, prediction, stopAutoPlay]);

  const DiceFace = ({ number }) => {
    const dotPositions = {
      1: [{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }],
      2: [
        { top: '25%', right: '25%' },
        { bottom: '25%', left: '25%' },
      ],
      3: [
        { top: '25%', right: '25%' },
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { bottom: '25%', left: '25%' },
      ],
      4: [
        { top: '25%', left: '25%' },
        { top: '25%', right: '25%' },
        { bottom: '25%', left: '25%' },
        { bottom: '25%', right: '25%' },
      ],
      5: [
        { top: '25%', left: '25%' },
        { top: '25%', right: '25%' },
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { bottom: '25%', left: '25%' },
        { bottom: '25%', right: '25%' },
      ],
      6: [
        { top: '25%', left: '25%' },
        { top: '25%', right: '25%' },
        { top: '50%', left: '25%' },
        { top: '50%', right: '25%' },
        { bottom: '25%', left: '25%' },
        { bottom: '25%', right: '25%' },
      ],
    };

    return (
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-600 to-pink-600 p-1.5 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-white rounded-xl">
          <div className={`absolute inset-0 ${isRolling ? 'animate-spin' : ''}`}>
            {dotPositions[number]?.map((position, index) => (
              <div
                key={index}
                className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                style={position}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const BetControls = () => (
    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3 rounded-xl">
      <button
        onClick={() => setBetAmount(prev => Math.min(maxBet, prev + 10))}
        className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-white"
        disabled={isRolling || autoPlayActive}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
      <input
        type="number"
        value={betAmount}
        onChange={(e) => setBetAmount(Math.max(minBet, Math.min(maxBet, parseInt(e.target.value) || minBet)))}
        className="w-20 sm:w-24 p-2 text-center bg-purple-800/30 text-white border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        disabled={isRolling || autoPlayActive}
      />
      <button
        onClick={() => setBetAmount(prev => Math.max(minBet, prev - 10))}
        className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-white"
        disabled={isRolling || autoPlayActive}
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );

  const AutoPlayControls = () => (
    <div className="flex items-center gap-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3 rounded-xl">
      <input
        type="number"
        value={autoPlayCount}
        onChange={(e) => setAutoPlayCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
        className="w-16 sm:w-20 p-2 text-center bg-purple-800/30 text-white border border-purple-500/30 rounded-lg"
        min="1"
        max="50"
        disabled={autoPlayActive}
      />
      <button
        onClick={handleAutoPlay}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          autoPlayActive 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
        } text-white font-medium`}
        disabled={isRolling && !autoPlayActive}
      >
        {autoPlayActive ? (
          <Square className="w-5 h-5" />
        ) : (
          <>
            <RotateCw className="w-5 h-5" />
            <span>Auto Play</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className=" bg-gradient-to-b from-purple-900 via-purple-800 to-pink-900 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-gradient-to-br from-purple-950/80 to-pink-950/80 rounded-3xl shadow-2xl backdrop-blur-sm p-6 sm:p-8 border border-white/10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div className="relative">
              <DiceFace number={result || 1} />
            </div>
            {/* Result Message Below Dice */}
            {showResult && !isRolling && (
              <div className={`px-4 py-2 rounded-xl text-white font-medium ${
                isWin 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}>
                {isWin ? '🎉 Winner!' : 'Try Again!'}
              </div>
            )}
            
            <div className="flex flex-col gap-4 w-full">
              <BetControls />
              <AutoPlayControls />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="text-white/80 text-center text-lg font-medium">Select Your Number</div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setPrediction(num)}
                  className={`w-full h-16 sm:h-20 rounded-xl font-bold text-xl transition-all transform hover:scale-105 ${
                    prediction === num
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-white/70 hover:text-white border border-white/10'
                  }`}
                  disabled={isRolling || autoPlayActive}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              onClick={handleSingleRoll}
              disabled={isRolling || !prediction || autoPlayActive}
              className={`mt-4 p-3 sm:p-4 rounded-xl font-bold text-lg text-white transition-all transform hover:scale-105 ${
                isRolling || !prediction || autoPlayActive
                  ? 'bg-gray-700/50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25'
              }`}
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDiceGame;