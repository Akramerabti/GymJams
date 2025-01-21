import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';

const suits = ['♠️', '♥️', '♣️', '♦️'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const Blackjack = ({ minBet, maxBet }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting'); // betting, playing, dealer, complete
  const { balance, subtractPoints, addPoints } = usePoints();

  const createDeck = () => {
    const deck = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const calculateHand = (hand) => {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
      if (card.value === 'A') {
        aces += 1;
        total += 11;
      } else if (['K', 'Q', 'J'].includes(card.value)) {
        total += 10;
      } else {
        total += parseInt(card.value);
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  };

  const dealInitialCards = () => {
    if (betAmount > balance) {
      toast.error('Insufficient points');
      return;
    }

    if (betAmount < minBet || betAmount > maxBet) {
      toast.error(`Bet amount must be between ${minBet} and ${maxBet} points`);
      return;
    }

    subtractPoints(betAmount);
    const deck = createDeck();
    const newPlayerHand = [deck.pop(), deck.pop()];
    const newDealerHand = [deck.pop(), deck.pop()];

    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setIsPlaying(true);
    setGameState('playing');
  };

  const hit = () => {
    const deck = createDeck();
    const newHand = [...playerHand, deck.pop()];
    setPlayerHand(newHand);

    if (calculateHand(newHand) > 21) {
      setGameState('complete');
      toast.error('Bust! You lost.');
    }
  };

  const stand = async () => {
    setGameState('dealer');
    let currentDealerHand = [...dealerHand];
    const deck = createDeck();

    while (calculateHand(currentDealerHand) < 17) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentDealerHand = [...currentDealerHand, deck.pop()];
      setDealerHand(currentDealerHand);
    }

    const playerTotal = calculateHand(playerHand);
    const dealerTotal = calculateHand(currentDealerHand);

    if (dealerTotal > 21 || playerTotal > dealerTotal) {
      const winnings = betAmount * 2;
      addPoints(winnings);
      toast.success(`You won ${winnings} points!`);
    } else if (dealerTotal > playerTotal) {
      toast.error('Dealer wins!');
    } else {
      addPoints(betAmount);
      toast.info('Push! Bet returned.');
    }

    setGameState('complete');
  };

  const reset = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setIsPlaying(false);
    setGameState('betting');
  };

  return (
    <div className="text-center">
      {gameState === 'betting' ? (
        <div className="mb-8">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(minBet, Math.min(maxBet, parseInt(e.target.value))))}
            className="w-full max-w-xs mx-auto block border border-gray-300 rounded-lg px-4 py-2"
          />
          <div className="text-sm text-gray-500 mt-2">
            Min: {minBet} points | Max: {maxBet} points
          </div>
          <button
            onClick={dealInitialCards}
            className="mt-4 bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Deal
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Dealer's Hand ({calculateHand(dealerHand)})</h3>
            <div className="flex justify-center space-x-2">
              {dealerHand.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  className="w-16 h-24 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-2xl"
                >
                  {card.value}{card.suit}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Your Hand ({calculateHand(playerHand)})</h3>
            <div className="flex justify-center space-x-2">
              {playerHand.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  className="w-16 h-24 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-2xl"
                >
                  {card.value}{card.suit}
                </motion.div>
              ))}
            </div>
          </div>

          {gameState === 'playing' && (
            <div className="flex justify-center space-x-4">
              <button
                onClick={hit}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold"
              >
                Hit
              </button>
              <button
                onClick={stand}
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold"
              >
                Stand
              </button>
            </div>
          )}

          {gameState === 'complete' && (
            <button
              onClick={reset}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold"
            >
              Play Again
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Blackjack;