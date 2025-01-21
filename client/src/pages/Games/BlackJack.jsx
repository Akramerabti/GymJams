import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';
import { Coins, Plus, Minus, RefreshCw, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CARD_BACK = "linear-gradient(135deg, #1e3c72 0%, #1e3c72 1%, #2a5298 100%)";
const CASINO_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const PlayingCard = ({ card, index, isDealer, isHidden, delay = 0, initialPosition }) => {
  const getColor = (suit) => {
    return ['♥️', '♦️'].includes(suit) ? 'text-red-600' : 'text-gray-900';
  };

  return (
    <motion.div
      initial={{ 
        ...initialPosition,
        rotateY: 180,
        scale: 0.5,
      }}
      animate={{ 
        x: 0,
        y: 0,
        rotateY: isHidden ? 180 : 0,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: delay * 0.2,
      }}
      className={`absolute w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-lg shadow-xl transform 
        ${isHidden ? '' : 'bg-gradient-to-br from-gray-50 to-white'}
        border-2 border-gray-200 flex items-center justify-center
        hover:shadow-2xl transition-all duration-300`}
      style={{
        perspective: '1000px',
        backfaceVisibility: 'hidden',
        background: isHidden ? CARD_BACK : undefined,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        left: `${index * 40}px`, // Move cards slightly to the left
      }}
    >
      {!isHidden && (
        <div className={`flex flex-col items-center ${getColor(card.suit)}`}>
          <div className="absolute top-1 left-1 text-sm sm:text-base font-bold">
            {card.value}
          </div>
          <div className="text-2xl sm:text-3xl transform">
            {card.suit}
          </div>
          <div className="absolute bottom-1 right-1 text-sm sm:text-base font-bold rotate-180">
            {card.value}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Deck = () => {
  return (
    <div className="absolute right-4 sm:right-8 top-60 -translate-y-1/2 perspective-1000">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-lg shadow-md border-2 border-gray-200"
          style={{
            background: CARD_BACK,
            transform: `translateZ(${i * -2}px) translateX(${i * -1}px)`,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        />
      ))}
    </div>
  );
};

const Blackjack = ({ minBet = 100, maxBet = 10000 }) => {
  const [betAmount, setBetAmount] = useState(minBet);
  const [gameState, setGameState] = useState('betting');
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [deck, setDeck] = useState([]);
  const [isDealing, setIsDealing] = useState(false);
  const { balance, addPoints, subtractPoints, updatePointsInBackend } = usePoints();
  const [visibleHandValues, setVisibleHandValues] = useState({
    dealer: 0,
    player: 0
  });

  const calculateHand = (hand) => {
    let total = 0;
    let aces = 0;
    hand.forEach(card => {
      if (card.value === 'A') {
        aces++;
        total += 11;
      } else if (['K', 'Q', 'J'].includes(card.value)) {
        total += 10;
      } else {
        total += parseInt(card.value);
      }
    });
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  };

  const createShuffledDeck = () => {
    const suits = ['♠️', '♥️', '♣️', '♦️'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck = suits.flatMap(suit => 
      values.map(value => ({ suit, value }))
    );
    return newDeck.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    if (gameState === 'betting' || isDealing) {
      setVisibleHandValues({ dealer: 0, player: 0 });
      return;
    }

    if (gameState === 'playing') {
      // During play, only show dealer's first card value
      const dealerVisibleValue = dealerHand.length > 0 ? 
        calculateHand([dealerHand[0].card]) : 0;

      setVisibleHandValues({
        dealer: dealerVisibleValue,
        player: calculateHand(playerHand.map(c => c.card))
      });
    } else {
      // Show all cards when dealer plays or game is complete
      setVisibleHandValues({
        dealer: calculateHand(dealerHand.map(c => c.card)),
        player: calculateHand(playerHand.map(c => c.card))
      });
    }
  }, [gameState, playerHand, dealerHand, isDealing]);

  const dealInitialCards = async () => {
    if (betAmount > balance) {
      toast.error('Insufficient points');
      return;
    }
    
    setIsDealing(true);
    subtractPoints(betAmount);
    await updatePointsInBackend(balance - betAmount);

    const newDeck = createShuffledDeck();
    setDeck(newDeck);
    setGameState('dealing');
    setPlayerHand([]);
    setDealerHand([]);

    const initialDeal = [
      { card: newDeck[0], position: { x: 300, y: 200 } },
      { card: newDeck[1], position: { x: 300, y: -200 } },
      { card: newDeck[2], position: { x: 300, y: 200 } },
      { card: newDeck[3], position: { x: 300, y: -200 } },
    ];

    // Sequential dealing with proper timing
    await new Promise(resolve => setTimeout(resolve, 300));
    setPlayerHand([initialDeal[0]]);
    await new Promise(resolve => setTimeout(resolve, 500));
    setDealerHand([initialDeal[1]]);
    await new Promise(resolve => setTimeout(resolve, 500));
    setPlayerHand(prev => [...prev, initialDeal[2]]);
    await new Promise(resolve => setTimeout(resolve, 500));
    setDealerHand(prev => [...prev, initialDeal[3]]);

    setIsDealing(false);
    newDeck.splice(0, 4);
    setDeck(newDeck);

    // Check for Blackjack after all cards are dealt
    const playerValue = calculateHand([initialDeal[0].card, initialDeal[2].card]);
    if (playerValue === 21) {
      const winnings = betAmount * 2.5;
      addPoints(winnings);
      await updatePointsInBackend(balance + winnings);
      toast.success('Blackjack! You win!');
      setGameState('complete');
    } else {
      setGameState('playing');
    }
  };

  const isBlackjack = (hand) => {
    return hand.length === 2 && calculateHand(hand) === 21;
  };

  const hit = async () => {
    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newHand = [...playerHand, { card: newCard, position: { x: 300, y: 200 } }];
    
    setDeck(newDeck);
    setPlayerHand(newHand);
    
    if (calculateHand(newHand.map(c => c.card)) > 21) {
      toast.error('Bust! Better luck next time!');
      setGameState('complete');
    }
  };

  const stand = async () => {
    setGameState('dealer');
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];

    while (calculateHand(currentDealerHand.map(c => c.card)) < 17 && currentDeck.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newCard = currentDeck.pop();
      currentDealerHand = [...currentDealerHand, { card: newCard, position: { x: 300, y: -200 } }];
      setDealerHand(currentDealerHand);
      setDeck(currentDeck);
    }

    const playerTotal = calculateHand(playerHand.map(c => c.card));
    const dealerTotal = calculateHand(currentDealerHand.map(c => c.card));

    if (dealerTotal > 21 || playerTotal > dealerTotal) {
      const winnings = betAmount * 2;
      addPoints(winnings);
      await updatePointsInBackend(balance + winnings); // Update points in backend after win
      toast.success(`You won ${winnings} points!`, {
        icon: '🎉'
      });
    } else if (dealerTotal > playerTotal) {
      toast.error('Dealer wins! Try again!');
    } else {
      addPoints(betAmount);
      await updatePointsInBackend(balance + betAmount); // Update points in backend after push
      toast.info('Push! Bet returned.');
    }

    setGameState('complete');
  };

  const rebet = () => {
    setGameState('betting');
    dealInitialCards(); // Reuse the same bet amount
  };

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
         style={{ backgroundImage: CASINO_PATTERN }}>
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30">

        {/* Deck Visualization */}
        <Deck />

        {/* Betting UI */}
        <AnimatePresence>
          {gameState === 'betting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-[320px] shadow-xl border border-white/20"
              >
                <h3 className="text-2xl font-bold text-white text-center mb-6">Place Your Bet</h3>
                <div className="flex items-center justify-center space-x-6 mb-8">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 border-0"
                    onClick={() => setBetAmount(Math.max(minBet, betAmount - 100))}
                  >
                    <Minus className="w-6 h-6 text-white" />
                  </Button>
                  <span className="text-3xl font-bold text-white min-w-[120px] text-center">
                    {betAmount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 border-0"
                    onClick={() => setBetAmount(Math.min(maxBet, betAmount + 100))}
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </Button>
                </div>
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold text-lg"
                  onClick={dealInitialCards}
                >
                  Deal Cards
                </Button>
                <div className="text-white/70 text-sm text-center mt-4">
                  Min: {minBet} | Max: {maxBet}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Game Table */}
        {gameState !== 'betting' && (
          <>
            {/* Dealer's Hand */}
            <div className="absolute top-32 left-1/2 transform -translate-x-1/2">
              <div className="relative h-24 sm:h-28 md:h-36 w-[200px] sm:w-[300px] md:w-[400px]">
                {dealerHand.map((item, index) => (
                  <PlayingCard
                    key={index}
                    card={item.card}
                    index={index}
                    isDealer={true}
                    isHidden={index === 1 && gameState === 'playing'}
                    delay={index}
                    initialPosition={item.position}
                  />
                ))}
              </div>
            </div>

            {/* Player's Hand */}
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
              <div className="relative h-24 sm:h-28 md:h-36 w-[200px] sm:w-[300px] md:w-[400px]">
                {playerHand.map((item, index) => (
                  <PlayingCard
                    key={index}
                    card={item.card}
                    index={index}
                    isDealer={false}
                    delay={index}
                    initialPosition={item.position}
                  />
                ))}
              </div>
            </div>

             {/* Animated Hand Values Display */}
      <AnimatePresence>
        {gameState !== 'betting' && !isDealing && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.3 // Slight delay to let cards appear first
            }}
            className="absolute top-4 left-4 bg-white/90 p-4 rounded-lg shadow-lg backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-black font-bold"
            >
              Dealer: {visibleHandValues.dealer}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-black font-bold mt-2"
            >
              Player: {visibleHandValues.player}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


            {/* Game Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
              {gameState === 'playing' && (
                <>
                  <Button
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 flex items-center space-x-2"
                    onClick={hit}
                  >
                    <Hand className="w-5 h-5" />
                    <span>Hit</span>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3"
                    onClick={stand}
                  >
                    Stand
                  </Button>
                </>
              )}
              {gameState === 'complete' && (
                <div className="flex space-x-4">
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 flex items-center space-x-2"
                    onClick={rebet}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Rebet
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3"
                    onClick={() => setGameState('betting')}
                  >
                    Change Bet
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Card Shine Effect Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-transparent" />
      </div>
    </div>
  );
};

export default Blackjack;