import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';
import { Play, Square, Settings, RotateCw } from 'lucide-react';

const EnhancedDiceGame = ({ minBet = 10, maxBet = 1000 }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [prediction, setPrediction] = useState(null);
  const [result, setResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(1);
  const [remainingAutoPlays, setRemainingAutoPlays] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
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
    subtractPoints(betAmount);

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
            addPoints(winnings);
            toast.success(`Won ${winnings} points!`);
          }

          const updatedBalance = balanceRef.current - betAmount + (win ? betAmount * 5 : 0);
          updatePointsInBackend(updatedBalance);
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
      <div className="relative w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 p-1 rounded-xl shadow-lg transform transition-transform hover:scale-105">
        <div className="absolute inset-0 bg-white rounded-lg">
          <div className={`absolute inset-0 ${isRolling ? 'animate-spin' : ''}`}>
            {dotPositions[number]?.map((position, index) => (
              <div
                key={index}
                className="absolute w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                style={position}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const GameControls = () => (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-4">
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Math.max(minBet, Math.min(maxBet, parseInt(e.target.value) || minBet)))}
          className="flex-1 p-3 border rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isRolling || autoPlayActive}
        />
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 transition-colors"
        >
          <Settings className="w-6 h-6 text-purple-600" />
        </button>
      </div>
  
      {showSettings && (
        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-purple-700">Auto-play Rolls</label>
              <input
                type="number"
                value={autoPlayCount}
                onChange={(e) => setAutoPlayCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-full p-2 border rounded-lg"
                min="1"
                max="50"
                disabled={autoPlayActive}
              />
            </div>
            <button
              onClick={handleAutoPlay}
              className={`p-3 rounded-lg transition-all ${
                autoPlayActive 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              } text-white`}
              disabled={isRolling && !autoPlayActive}
            >
              {autoPlayActive ? (
                <Square className="w-5 h-5" />
              ) : (
                <div className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5" />
                  <span>Auto</span>
                </div>
              )}
            </button>
          </div>
          {autoPlayActive && remainingAutoPlays > 0 && (
            <div className="text-center text-sm text-purple-600">
              Remaining rolls: {remainingAutoPlays}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const NumberSelector = () => (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((num) => (
        <button
          key={num}
          onClick={() => setPrediction(num)}
          className={`p-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
            prediction === num
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 hover:from-pink-200 hover:to-purple-200'
          }`}
          disabled={isRolling || autoPlayActive}
        >
          {num}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-white to-pink-50 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-6">
        Dice Casino
      </h2>
      
      <div className="space-y-6">
        <GameControls />
        <NumberSelector />
        
        <div className="flex justify-center">
          {result && <DiceFace number={result} />}
        </div>

        <button
          onClick={handleSingleRoll}
          disabled={isRolling || !prediction || autoPlayActive}
          className={`w-full p-4 rounded-xl font-semibold text-white transition-all transform hover:scale-105 ${
            isRolling || !prediction || autoPlayActive
              ? 'bg-gray-400' 
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
          }`}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>

        {showResult && !isRolling && (
          <div
            className={`p-4 rounded-xl text-center font-semibold ${
              isWin
                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
            }`}
          >
            {isWin ? 'You won! 🎉' : 'Better luck next time! 🎲'}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDiceGame;