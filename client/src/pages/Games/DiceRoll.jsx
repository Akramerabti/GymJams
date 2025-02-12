import React, { useState } from 'react';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';

const DiceRoll = ({ minBet, maxBet }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isRolling, setIsRolling] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const { balance, subtractPoints, addPoints, updatePointsInBackend } = usePoints();

  const DiceFace = ({ number }) => {
    const dotPositions = {
      1: [{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }],
      2: [
        { top: '10%', right: '10%' },
        { bottom: '10%', left: '10%' },
      ],
      3: [
        { top: '10%', right: '10%' },
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { bottom: '10%', left: '10%' },
      ],
      4: [
        { top: '10%', left: '10%' },
        { top: '10%', right: '10%' },
        { bottom: '10%', left: '10%' },
        { bottom: '10%', right: '10%' },
      ],
      5: [
        { top: '10%', left: '10%' },
        { top: '10%', right: '10%' },
        { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        { bottom: '10%', left: '10%' },
        { bottom: '10%', right: '10%' },
      ],
      6: [
        { top: '10%', left: '10%' },
        { top: '10%', right: '10%' },
        { top: '50%', left: '10%', transform: 'translateY(-50%)' },
        { top: '50%', right: '10%', transform: 'translateY(-50%)' },
        { bottom: '10%', left: '10%' },
        { bottom: '10%', right: '10%' },
      ],
    };

    return (
      <div
        style={{
          position: 'relative',
          width: '96px',
          height: '96px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {dotPositions[number].map((position, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              backgroundColor: '#4C1D95',
              borderRadius: '50%',
              ...position,
            }}
          />
        ))}
      </div>
    );
  };

  const generateSpinSequence = (finalNumber) => {
    const sequence = [];
    const numSpins = 20; // Total number of faces to show during spin

    for (let i = 0; i < numSpins - 1; i++) {
      sequence.push(Math.floor(Math.random() * 6) + 1);
    }
    sequence.push(finalNumber); // Ensure we end on our actual result

    return sequence;
  };

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
    setShowResult(false);
    subtractPoints(betAmount);

    // Predetermine the result before animation
    const diceResult = Math.floor(Math.random() * 6) + 1;
    setResult(diceResult);

    // Start the spinning animation
    setIsSpinning(true);

    // Sequence of dice faces during spin
    const sequence = generateSpinSequence(diceResult);
    let currentIndex = 0;

    // Create a smooth spinning animation
    const spinInterval = setInterval(() => {
      if (currentIndex < sequence.length) {
        setResult(sequence[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(spinInterval);
        setIsSpinning(false);
        setShowResult(true);
        setIsRolling(false);

        // Handle win/lose logic after spin completes
        let winnings = 0;
        if (diceResult === prediction) {
          winnings = betAmount * 5;
          addPoints(winnings);
          toast.success(`You won ${winnings} points!`);
        } else {
          toast.error(`You lost! The dice showed ${diceResult}`);
        }

        const updatedBalance = balance - betAmount + winnings;
        updatePointsInBackend(updatedBalance);
      }
    }, 100); // Adjust speed of spin here
  };

  return (
    <div
      style={{
        maxWidth: '448px',
        margin: '0 auto',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#4C1D95',
          marginBottom: '24px',
        }}
      >
        Dice Roll Game
      </h2>

      <div style={{ marginBottom: '24px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px',
          }}
        >
          Your Bet
        </label>
        <input
          type="number"
          value={betAmount}
          onChange={(e) =>
            setBetAmount(Math.max(minBet, Math.min(maxBet, parseInt(e.target.value) || minBet)))
          }
          style={{
            width: '100%',
            padding: '8px 16px',
            border: '1px solid #D1D5DB',
            borderRadius: '12px',
            outline: 'none',
          }}
          disabled={isRolling}
        />
        <div
          style={{
            fontSize: '14px',
            color: '#6B7280',
            marginTop: '8px',
          }}
        >
          Min: {minBet} points | Max: {maxBet} points
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '12px',
          }}
        >
          Select Your Number
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => setPrediction(num)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: prediction === num ? '#4C1D95' : '#F3F4F6',
                color: prediction === num ? 'white' : '#374151',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s, color 0.2s',
              }}
              disabled={isRolling}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {result && (
          <div
            style={{
              transform: isSpinning ? 'rotate(360deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s linear',
            }}
          >
            <DiceFace number={result} />
          </div>
        )}
      </div>

      <button
        onClick={handleRoll}
        disabled={isRolling || !prediction}
        style={{
          width: '100%',
          padding: '12px 24px',
          borderRadius: '12px',
          backgroundColor: isRolling ? '#9CA3AF' : '#4C1D95',
          color: 'white',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {isRolling ? 'Rolling...' : 'Roll Dice'}
      </button>

      {showResult && !isRolling && (
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: result === prediction ? '#D1FAE5' : '#FEE2E2',
            color: result === prediction ? '#065F46' : '#991B1B',
            textAlign: 'center',
            fontWeight: '600',
          }}
        >
          {result === prediction ? 'You won! 🎉' : 'Better luck next time! 🎲'}
        </div>
      )}
    </div>
  );
};

export default DiceRoll;