import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Zap, Star, Medal, Crown, Link, LogIn, Dumbbell, Info } from 'lucide-react';
import { toast } from 'sonner';
import { usePoints } from '../../hooks/usePoints';
import { Link as RouterLink } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const GymBrosShop = () => {
  const { balance, subtractPoints, updatePointsInBackend } = usePoints();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('boosts');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Check authentication status when the component mounts
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    }
  }, [isAuthenticated]);

  // Handle purchase with points
  const handlePurchase = (item) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (balance < item.cost) {
      toast.error('Not enough points!', {
        description: `You need ${item.cost} points for this item. You have ${balance} points.`
      });
      return;
    }
    
    // Deduct points and update backend
    subtractPoints(item.cost);
    updatePointsInBackend(-item.cost); // Negative to subtract
    
    toast.success(`${item.name} purchased!`, {
      description: `${item.cost} points deducted from your balance.`
    });
    
    // Handle specific item effects
    if (item.category === 'boosts') {
      toast.info(`Your profile boost will activate the next time you open the Discover tab.`);
    } else if (item.category === 'superlikes') {
      toast.info(`Super Likes available in your Discover tab.`);
    } else if (item.category === 'membership') {
      toast.info(`Membership benefits activated for ${item.duration}.`);
    }
  };

  // Define item categories and products
  const categories = [
    { id: 'boosts', name: 'Boosts', icon: <Zap className="h-5 w-5" /> },
    { id: 'superlikes', name: 'Super Likes', icon: <Star className="h-5 w-5" /> },
    { id: 'membership', name: 'Membership', icon: <Crown className="h-5 w-5" /> }
  ];
  
  // Products data with points prices
  const products = {
    boosts: [
      { 
        id: 'boost-basic', 
        name: 'Basic Boost', 
        description: 'Get 3x more visibility for 30 minutes',
        cost: 50,
        duration: '30 minutes',
        category: 'boosts',
        icon: <Zap className="h-8 w-8 text-purple-500" />
      },
      { 
        id: 'boost-premium', 
        name: 'Premium Boost', 
        description: 'Get 5x more visibility for 1 hour',
        cost: 100,
        duration: '1 hour',
        category: 'boosts',
        icon: <Zap className="h-8 w-8 text-purple-600" />
      },
      { 
        id: 'boost-ultra', 
        name: 'Ultra Boost', 
        description: 'Get 10x more visibility for 3 hours',
        cost: 200,
        duration: '3 hours',
        category: 'boosts',
        icon: <Zap className="h-8 w-8 text-purple-700" />
      }
    ],
    superlikes: [
      { 
        id: 'superlike-basic', 
        name: 'Super Like', 
        description: 'They\'ll be notified of your interest',
        cost: 20,
        quantity: 1,
        category: 'superlikes',
        icon: <Star className="h-8 w-8 text-blue-500" />
      },
      { 
        id: 'superlike-pack', 
        name: 'Super Like Pack', 
        description: 'Get 5 Super Likes at a discount',
        cost: 75,
        quantity: 5,
        category: 'superlikes',
        icon: <Star className="h-8 w-8 text-blue-600" />
      },
      { 
        id: 'superlike-premium', 
        name: 'Premium Super Like', 
        description: 'Add a personalized message to your Super Like',
        cost: 50,
        quantity: 1,
        category: 'superlikes',
        icon: <Medal className="h-8 w-8 text-blue-600" />
      }
    ],
    membership: [
      { 
        id: 'membership-week', 
        name: 'Weekly Gold', 
        description: 'See who likes you & unlimited likes for 7 days',
        cost: 500,
        duration: '7 days',
        category: 'membership',
        icon: <Crown className="h-8 w-8 text-amber-500" />
      },
      { 
        id: 'membership-month', 
        name: 'Monthly Gold', 
        description: 'All Gold benefits for 30 days (Best Value)',
        cost: 1500,
        duration: '30 days',
        category: 'membership',
        icon: <Crown className="h-8 w-8 text-amber-500" />
      },
      { 
        id: 'membership-platinum', 
        name: 'Platinum', 
        description: 'All Gold benefits plus 1 free boost per week for 30 days',
        cost: 2500,
        duration: '30 days',
        category: 'membership',
        icon: <Crown className="h-8 w-8 text-purple-600" />
      }
    ]
  };
  
  // Currency conversion for non-authenticated users
  const pointsToDollars = (points) => {
    return (points / 100).toFixed(2);
  };

  // Show info modal about points
  const InfoModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setShowInfoModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Dumbbell className="mr-2 text-blue-600" /> About GymPoints
        </h3>
        <p className="text-gray-700 mb-4">
          GymPoints are earned through activities on our platform:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-700">
          <li>Complete your profile (+100 points)</li>
          <li>Daily login streak (+10 points per day)</li>
          <li>Match with other users (+20 points)</li>
          <li>Complete fitness quizzes (+50 points)</li>
          <li>Participate in challenges (+100 points)</li>
        </ul>
        <p className="text-gray-700 mb-4">
          Use your points to boost your profile, send super likes, and unlock premium features.
        </p>
        <button
          onClick={() => setShowInfoModal(false)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Got it
        </button>
      </motion.div>
    </motion.div>
  );

  // Login prompt for non-authenticated users
  const LoginPrompt = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setShowLoginPrompt(false)}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4">Get More With an Account</h3>
        <p className="text-gray-700 mb-6">
          Sign in or create an account to earn and use GymPoints for exclusive features and discounts.
        </p>
        <div className="space-y-3">
          <RouterLink 
            to="/login" 
            className="block w-full bg-blue-600 text-white py-3 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
          >
            <LogIn className="inline-block mr-2 h-5 w-5" />
            Log In
          </RouterLink>
          <RouterLink 
            to="/register" 
            className="block w-full bg-gray-100 text-gray-800 py-3 rounded-lg text-center font-medium hover:bg-gray-200 transition-colors"
          >
            <Link className="inline-block mr-2 h-5 w-5" />
            Create Account
          </RouterLink>
        </div>
        <button
          onClick={() => setShowLoginPrompt(false)}
          className="w-full text-gray-500 text-sm mt-4"
        >
          Maybe Later
        </button>
      </motion.div>
    </motion.div>
  );

  // Render the appropriate product list based on selected category
  const renderProducts = () => {
    const selectedProducts = products[selectedCategory] || [];
    
    return (
      <div className="grid grid-cols-1 gap-4 mt-4">
        {selectedProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="p-4 flex items-center">
              <div className="bg-blue-50 p-3 rounded-lg mr-4">
                {product.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.description}</p>
                <div className="flex items-center mt-2">
                  {isAuthenticated ? (
                    <span className="text-blue-600 font-bold">{product.cost} points</span>
                  ) : (
                    <span className="text-blue-600 font-bold">${pointsToDollars(product.cost)}</span>
                  )}
                  
                  {product.duration && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">
                      {product.duration}
                    </span>
                  )}
                  
                  {product.quantity && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">
                      {product.quantity > 1 ? `${product.quantity} pack` : 'Single'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handlePurchase(product)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isAuthenticated ? 'Buy' : 'Purchase'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-136px)] p-4 overflow-y-auto pb-16">
      {/* Shop Header with Points Balance for Authenticated Users */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <ShoppingBag className="mr-2 text-blue-600" /> Fitness Shop
        </h2>
        
        {isAuthenticated ? (
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-lg">
            <span className="font-bold text-blue-700">{balance}</span>
            <span className="text-blue-600 ml-1">points</span>
            <button 
              onClick={() => setShowInfoModal(true)}
              className="ml-1 text-blue-500 p-1 rounded-full hover:bg-blue-100"
            >
              <Info size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginPrompt(true)}
            className="text-blue-600 font-medium flex items-center"
          >
            <LogIn size={16} className="mr-1" />
            Sign in
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Products List */}
      {renderProducts()}

      {/* Show info modal about points */}
      <AnimatePresence>
        {showInfoModal && <InfoModal />}
      </AnimatePresence>

      {/* Login prompt for non-authenticated users */}
      <AnimatePresence>
        {showLoginPrompt && <LoginPrompt />}
      </AnimatePresence>
    </div>
  );
}

export default GymBrosShop;