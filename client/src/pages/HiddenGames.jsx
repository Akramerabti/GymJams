import React, { useState } from 'react';
import { usePoints } from '../hooks/usePoints';
import { useAuth } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Dice5, Coins, Joystick, PanelTopClose, SquareStack, Trophy, Gift, Shield, Clock, Star } from 'lucide-react';
import CoinFlip from './Games/CoinFlip';
import DiceRoll from './Games/DiceRoll';
import SlotMachine from './Games/SlotMachine';
import Roulette from './Games/Roulette';
import Blackjack from './Games/BlackJack';
import { toast } from 'sonner';

const HiddenGames = () => {
  const { user } = useAuth();
  const { balance } = usePoints();
  const [selectedGame, setSelectedGame] = useState(null);

  // Define the hidden games
  const hiddenGames = [
    {
      id: 'mysterybox',
      name: 'Mystery Box',
      description: 'Unlock a box for a chance to win big!',
      icon: Gift,
      component: CoinFlip, // Replace with MysteryBox component if available
      minBet: 100,
      maxBet: 5000,
    },
    {
      id: 'highroller',
      name: 'High Roller',
      description: 'Exclusive high-stakes game for VIPs',
      icon: Trophy,
      component: DiceRoll, // Replace with HighRoller component if available
      minBet: 500,
      maxBet: 10000,
    },
    {
      id: 'timedchallenge',
      name: 'Timed Challenge',
      description: 'Complete challenges within the time limit',
      icon: Clock,
      component: SlotMachine, // Replace with TimedChallenge component if available
      minBet: 200,
      maxBet: 7500,
    },
    {
      id: 'luckyspin',
      name: 'Lucky Spin',
      description: 'Spin the wheel for exclusive rewards',
      icon: Shield,
      component: Roulette, // Replace with LuckySpin component if available
      minBet: 300,
      maxBet: 8000,
    },
    {
      id: 'starshower',
      name: 'Star Shower',
      description: 'Catch falling stars for massive points',
      icon: Star,
      component: Blackjack, // Replace with StarShower component if available
      minBet: 400,
      maxBet: 9000,
    },
  ];

 const hasSubscription = !!user.user.subscription;

 if (!user) {
   return (
     <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
       >
         <h1 className="text-3xl font-bold mb-4">VIP Games Access</h1>
         <p className="text-gray-600 mb-6">
           Log in to access exclusive games and start winning points!
         </p>
         <a
           href="/login"
           className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
         >
           Log In to Play
         </a>
       </motion.div>
     </div>
   );
 }

 if (!hasSubscription) {
   return (
     <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center p-4">
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
       >
         <h1 className="text-3xl font-bold mb-4">Exclusive Games Access</h1>
         <p className="text-gray-600 mb-6">
           Subscribe to unlock exclusive hidden games and start winning big!
         </p>
         <a
           href="/subscription-checkout"
           className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
         >
           Subscribe Now
         </a>
       </motion.div>
     </div>
   );
 }

 const handleGameSelect = (game) => {
   if (balance < game.minBet) {
     toast.error(`Insufficient points. Minimum bet is ${game.minBet} points.`);
     return;
   }
   setSelectedGame(game);
 };

 return (
   <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-8">
     <div className="max-w-7xl mx-auto">
       {/* Header */}
       <div className="text-center mb-12">
         <h1 className="text-4xl font-bold text-white mb-4">VIP Hidden Games</h1>
         <div className="inline-flex items-center bg-white/10 px-6 py-3 rounded-full">
           <Coins className="w-6 h-6 text-yellow-400 mr-2" />
           <span className="text-white font-semibold">
             Balance: {balance} points
           </span>
         </div>
       </div>

       {selectedGame ? (
         <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           className="bg-white rounded-2xl shadow-2xl p-8"
         >
           <div className="flex justify-between items-center mb-8">
             <h2 className="text-2xl font-bold">{selectedGame.name}</h2>
             <button
               onClick={() => setSelectedGame(null)}
               className="text-gray-500 hover:text-gray-700"
             >
               Back to Games
             </button>
           </div>
           <selectedGame.component
             minBet={selectedGame.minBet}
             maxBet={selectedGame.maxBet}
           />
         </motion.div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {hiddenGames.map((game) => (
             <motion.div
               key={game.id}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
               onClick={() => handleGameSelect(game)}
             >
               <div className="p-6">
                 <game.icon className="w-12 h-12 text-purple-600 mb-4" />
                 <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                 <p className="text-gray-600 mb-4">{game.description}</p>
                 <div className="text-sm text-gray-500">
                   Min Bet: {game.minBet} points
                 </div>
               </div>
             </motion.div>
           ))}
         </div>
       )}
     </div>
   </div>
 );
};

export default HiddenGames;