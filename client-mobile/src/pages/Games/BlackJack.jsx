import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { toast } from 'sonner';
import { Coins, Plus, Minus, RefreshCw, Hand, Info, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CARD_BACK = "linear-gradient(135deg, #1e3c72 0%, #1e3c72 1%, #2a5298 100%)";

// Fallback image URL - now using public folder
const BACKGROUND_IMAGE = "/Blackjack.jpg";

const PlayingCard = ({ card, index, isDealer, isHidden, delay = 0, initialPosition }) => {
  const getColor = (suit) => {
    return ['♥️', '♦️'].includes(suit) ? 'text-red-600' : 'text-black';
  };
  // Safeguard against undefined card data
  const safeCard = card || { suit: '♠️', value: 'A' };

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
      }}      className={`absolute w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-lg shadow-xl transform 
        ${isHidden ? '' : 'bg-gradient-to-br from-gray-50 to-white'}
        border-2 border-gray-200 flex items-center justify-center
        hover:shadow-2xl transition-all duration-300`}      style={{
        perspective: '1000px',
        backfaceVisibility: 'hidden',
        background: isHidden ? CARD_BACK : undefined,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        left: `${index * 25}px`,
      }}
    >      {!isHidden && (
        <div className={`flex flex-col items-center ${getColor(safeCard.suit)}`} style={{ color: ['♥️', '♦️'].includes(safeCard.suit) ? '#dc2626' : '#000000' }}>
          <div className="absolute top-1 left-1 text-xs sm:text-sm md:text-base font-bold" style={{ color: ['♥️', '♦️'].includes(safeCard.suit) ? '#dc2626' : '#000000' }}>
            {safeCard.value}
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl transform" style={{ color: ['♥️', '♦️'].includes(safeCard.suit) ? '#dc2626' : '#000000' }}>
            {safeCard.suit}
          </div>
          <div className="absolute bottom-1 right-1 text-xs sm:text-sm md:text-base font-bold rotate-180" style={{ color: ['♥️', '♦️'].includes(safeCard.suit) ? '#dc2626' : '#000000' }}>
            {safeCard.value}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Deck = () => {
  return (
    <div className="absolute right-4 sm:right-8 top-60 -translate-y-1/2 perspective-1000">
      {/* Glowing base effect */}
      <div className="absolute inset-0 w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-lg 
                      bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 opacity-40 blur-md 
                      animate-pulse"></div>
      
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-lg shadow-lg 
                     border-2 border-blue-300/50 transition-all duration-300 hover:shadow-blue-500/50 hover:shadow-xl"
          style={{
            background: `linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)`,
            transform: `translateZ(${i * -2}px) translateX(${i * -1}px)`,
            boxShadow: `
              0 4px 8px rgba(59, 130, 246, 0.3), 
              0 2px 4px rgba(59, 130, 246, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 ${20 - i * 3}px rgba(59, 130, 246, ${0.4 - i * 0.05})
            `,
          }}
        >
          {/* Deck pattern */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-white/40 flex items-center justify-center">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-white/60"></div>
              </div>
            </div>
          </div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                          skew-x-12 animate-pulse opacity-50 rounded-lg"></div>
        </div>
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
  const [inputError, setInputError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const { balance, addPoints, subtractPoints, updatePointsInBackend } = usePoints();
  const [visibleHandValues, setVisibleHandValues] = useState({
    dealer: 0,
    player: 0
  });

  // Prevent scrolling on this game
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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

  const handleBetAmountChange = (e) => {
    const value = e.target.value;
    setBetAmount(value); // Allow the user to type freely
    setInputError(null); // Clear any previous errors
  };
  
  const handleBetAmountBlur = (e) => {
  
    const value = parseInt(e.target.value);
  
    if (isNaN(value) || value < minBet) {
      setInputError(`Minimum bet is ${minBet}`);
      setBetAmount(minBet); // Reset to minimum bet
    } else if (value > maxBet) {
      setInputError(`Maximum bet is ${maxBet}`);
      setBetAmount(maxBet); // Reset to maximum bet
    } else {
      setInputError(null); // Clear error if input is valid
    }
  };
  const createShuffledDeck = () => {
    const suits = ['♠️', '♥️', '♣️', '♦️'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const newDeck = suits.flatMap(suit => 
      values.map(value => ({ suit, value }))
    );
    // Ensure all cards have valid suit and value properties
    //('Created deck with', newDeck.length, 'cards');
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


  const hit = async () => {
    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newHand = [...playerHand, { card: newCard, position: { x: 300, y: 200 } }];
    
    setDeck(newDeck);
    setPlayerHand(newHand);
    
    const handValue = calculateHand(newHand.map(c => c.card));
    
    if (handValue > 21) {
      toast.error('Bust! Better luck next time!');
      setGameState('complete');
    } else if (handValue === 21) {
      toast.success('Perfect 21! Auto-standing...');
      // Auto-stand when player hits 21
      setTimeout(() => {
        stand();
      }, 1000); // Give a brief moment to show the message
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
  <div
    className="relative w-full h-[600px] rounded-xl overflow-hidden"
    style={{
      backgroundImage: `url(${BACKGROUND_IMAGE})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="absolute inset-0">
      {/* Deck Visualization */}
      <Deck />      {/* Betting UI */}
      <AnimatePresence>
        {gameState === 'betting' && (
          <motion.div
            key="betting-ui"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-xl p-8 w-[380px] shadow-xl border border-white/20 relative"
            >
              {/* Info Button */}
              <motion.button
                onClick={() => setShowInfo(true)}
                className="absolute top-4 right-4 p-2 rounded-full bg-blue-500/20 text-blue-400 
                          hover:bg-blue-500/30 hover:text-blue-300 transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Info className="w-5 h-5" />
              </motion.button>

              <h3 className="text-2xl font-bold text-white text-center mb-6">Place Your Bet</h3>
              
              {/* Current Balance Display */}
              <div className="text-center mb-6">
                <div className="text-white/70 text-sm mb-1">Your Balance</div>
                <div className="text-yellow-400 text-xl font-bold flex items-center justify-center gap-2">
                  <Coins className="w-5 h-5" />
                  {balance.toLocaleString()}
                </div>
              </div>              {/* Bet Amount Input with Integrated Controls */}
              <div className="flex flex-col items-center space-y-4 mb-6">
                <div className="relative w-full">
                  <div className="flex items-center">
                    {/* Minus Button */}
                    <motion.button
                      onClick={() => setBetAmount(Math.max(minBet, betAmount - minBet))}
                      disabled={betAmount <= minBet}
                      className="bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed
                                text-red-400 rounded-l-lg px-3 py-3 transition-all duration-200 border-r border-white/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    
                    {/* Input Field */}
                    <input
                      type="number"
                      value={betAmount}
                      onChange={handleBetAmountChange}
                      onBlur={handleBetAmountBlur}
                      placeholder={`${minBet}-${maxBet}`}
                      className={`flex-1 bg-white/5 border-t border-b ${
                        inputError ? 'border-red-500' : 'border-white/10'
                      } text-white text-center py-3 px-4 text-lg font-semibold 
                      focus:outline-none focus:ring-2 ${
                        inputError ? 'focus:ring-red-500' : 'focus:ring-yellow-500'
                      } transition-all duration-300`}
                    />
                    
                    {/* Plus Button */}
                    <motion.button
                      onClick={() => setBetAmount(Math.min(maxBet, betAmount + minBet))}
                      disabled={betAmount >= maxBet || betAmount + minBet > balance}
                      className="bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed
                                text-green-400 rounded-r-lg px-3 py-3 transition-all duration-200 border-l border-white/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  {inputError && (
                    <div className="absolute top-full mt-1 text-sm text-red-500 text-center w-full">
                      {inputError}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { label: 'Min', value: minBet },
                  { label: '25%', value: Math.floor(balance * 0.25) },
                  { label: '50%', value: Math.floor(balance * 0.5) },
                  { label: 'Max', value: Math.min(maxBet, balance) }
                ].map((quick) => (
                  <motion.button
                    key={quick.label}
                    onClick={() => setBetAmount(Math.max(minBet, Math.min(maxBet, quick.value)))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
                              ${betAmount === Math.max(minBet, Math.min(maxBet, quick.value))
                                ? 'bg-yellow-500/30 text-yellow-300 ring-2 ring-yellow-400/50'
                                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                              }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {quick.label}
                  </motion.button>
                ))}
              </div>

              {/* Deal Button */}
              <Button
                className="w-full h-14 bg-gradient-to-r from-yellow-400 to-yellow-600 
                          hover:from-yellow-500 hover:to-yellow-700 text-black font-bold text-xl
                          shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={dealInitialCards}
                disabled={betAmount > balance}
              >
                <motion.div
                  className="flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  Deal Cards
                </motion.div>
              </Button>
              
              {/* Bet Limits */}
              <div className="text-white/50 text-sm text-center mt-4 flex justify-between">
                <span>Min: {minBet.toLocaleString()}</span>
                <span>Max: {maxBet.toLocaleString()}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={() => setShowInfo(false)}
          >            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 w-[85%] max-w-[400px] 
                        shadow-xl border border-white/20 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-white">Blackjack Rules</h3>
                <motion.button
                  onClick={() => setShowInfo(false)}
                  className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 
                            hover:text-red-300 transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Rules Content */}
              <div className="space-y-3 text-white/90">
                <div>
                  <h4 className="text-base font-semibold text-yellow-400 mb-1">🎯 Objective</h4>
                  <p className="text-xs leading-relaxed">
                    Get cards totaling as close to 21 as possible without going over. Beat the dealer's hand to win!
                  </p>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-yellow-400 mb-1">🃏 Card Values</h4>
                  <ul className="text-xs space-y-0.5 ml-3">
                    <li>• <strong>Number cards:</strong> Face value (2-10)</li>
                    <li>• <strong>Face cards:</strong> 10 points (J, Q, K)</li>
                    <li>• <strong>Ace:</strong> 1 or 11 (whichever is better)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-yellow-400 mb-1">🎮 How to Play</h4>
                  <ul className="text-xs space-y-0.5 ml-3">
                    <li>• You and the dealer each get 2 cards initially</li>
                    <li>• One dealer card is face down (hidden)</li>
                    <li>• <strong>Hit:</strong> Take another card</li>
                    <li>• <strong>Stand:</strong> Keep your current total</li>
                    <li>• Dealer must hit on 16 or less, stand on 17+</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-yellow-400 mb-1">🏆 Winning</h4>
                  <ul className="text-xs space-y-0.5 ml-3">
                    <li>• <strong>Blackjack:</strong> 21 with first 2 cards (2.5x payout)</li>
                    <li>• <strong>Win:</strong> Beat dealer without busting (2x payout)</li>
                    <li>• <strong>Push:</strong> Tie with dealer (bet returned)</li>
                    <li>• <strong>Bust:</strong> Go over 21 (lose bet)</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-400/30">
                  <h4 className="text-base font-semibold text-yellow-400 mb-1">💡 Pro Tips</h4>
                  <ul className="text-xs space-y-0.5 ml-3">
                    <li>• Always assume the dealer's hidden card is worth 10</li>
                    <li>• Stand on 17 or higher</li>
                    <li>• Consider hitting on soft 17 (Ace + 6)</li>
                    <li>• Manage your bankroll wisely!</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Table */}
      {gameState !== 'betting' && (
        <>          {/* Dealer's Hand */}
          <div className="absolute top-36 sm:top-16 left-1/2 transform -translate-x-1/2">            {/* Dealer Label */}
            <div className="text-center mb-6">
              <span className="text-white font-bold text-lg sm:text-xl bg-gradient-to-r from-red-900/80 via-red-800/90 to-red-900/80 px-6 py-2 rounded-full backdrop-blur-md border-2 border-red-400/30 shadow-lg shadow-red-500/20 relative overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></span>
                <span className="relative z-10 tracking-wider">DEALER</span>
              </span>
            </div>
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
          </div>          {/* Player's Hand */}
          <div className="absolute bottom-32 sm:bottom-28 left-1/2 transform -translate-x-1/2">
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
            </div>            {/* Player Label */}
            <div className="text-center mt-6">
              <span className="text-white font-bold text-lg sm:text-xl bg-gradient-to-r from-green-900/80 via-green-800/90 to-green-900/80 px-6 py-2 rounded-full backdrop-blur-md border-2 border-green-400/30 shadow-lg shadow-green-500/20 relative overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></span>
                <span className="relative z-10 tracking-wider">PLAYER</span>
              </span>
            </div>
          </div>          {/* Animated Hand Values Display */}
          <AnimatePresence>
            {gameState !== 'betting' && !isDealing && (
              <motion.div
                key="hand-values"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: 0.3, // Slight delay to let cards appear first
                }}
                className="absolute top-4 left-4 bg-white/90 p-4 rounded-lg shadow-lg backdrop-blur-sm"              >
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
          </AnimatePresence>{/* Game Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
            {gameState === 'playing' && calculateHand(playerHand.map(c => c.card)) !== 21 && (
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
            {gameState === 'playing' && calculateHand(playerHand.map(c => c.card)) === 21 && (
              <div className="bg-yellow-500/20 backdrop-blur-lg rounded-lg px-6 py-3 border border-yellow-400/30">
                <span className="text-yellow-400 font-bold text-lg">Perfect 21! Auto-standing...</span>
              </div>
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