import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Zap, Star, Medal, Crown, Link, LogIn, Dumbbell, 
  Info, X, CreditCard, Sparkles, ArrowRight, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { usePoints } from '../../hooks/usePoints';
import { Link as RouterLink } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const GymBrosShop = () => {
  const { balance, subtractPoints, updatePointsInBackend } = usePoints();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [promptShown, setPromptShown] = useState(false);
  
  // Show login prompt once for logged-out users
  useEffect(() => {
    if (!isAuthenticated && !promptShown) {
      setShowLoginPrompt(true);
      setPromptShown(true);
    }
  }, [isAuthenticated, promptShown]);

  // Handle purchase with points
  const handlePurchaseWithPoints = (item) => {
    if (!isAuthenticated) {
      toast.error('Please log in to use points', {
        description: 'Sign in to earn and use GymPoints'
      });
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
    updatePointsInBackend(balance-item.cost); // Negative to subtract
    
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

  // Handle purchase with money
  const handlePurchaseWithMoney = (item) => {
    // This would typically integrate with a payment gateway like Stripe
    // For now, we'll just show a toast
    toast.success(`Processing payment for ${item.name}`, {
      description: `Redirecting to payment for ${item.price}`
    });
    
    // Simulating a payment success after 2 seconds
    setTimeout(() => {
      toast.success(`${item.name} purchased successfully!`, {
        description: `Your purchase has been activated.`
      });
      
      // Handle specific item effects
      if (item.category === 'boosts') {
        toast.info(`Your profile boost will activate the next time you open the Discover tab.`);
      } else if (item.category === 'superlikes') {
        toast.info(`Super Likes available in your Discover tab.`);
      } else if (item.category === 'membership') {
        toast.info(`Membership benefits activated for ${item.duration}.`);
      }
    }, 2000);
  };

  // Define item categories and products
  const categories = [
    { id: 'boosts', name: 'Boosts', icon: <Zap className="h-5 w-5" />, color: 'bg-purple-500', description: 'Get more visibility' },
    { id: 'superlikes', name: 'Super Likes', icon: <Star className="h-5 w-5" />, color: 'bg-blue-500', description: 'Stand out faster' },
    { id: 'membership', name: 'Membership', icon: <Crown className="h-5 w-5" />, color: 'bg-amber-500', description: 'Premium benefits' }
  ];
  
  // Products data with points prices
  const products = {
    boosts: [
      { 
        id: 'boost-basic', 
        name: 'Basic Boost', 
        description: '3x visibility for 30 minutes',
        cost: 50,
        price: '$0.50',
        duration: '30 minutes',
        category: 'boosts',
        icon: <Zap className="h-8 w-8 text-purple-500" />,
        popular: false,
        color: 'bg-purple-500',
        textColor: 'text-purple-500'
      },
      { 
        id: 'boost-premium', 
        name: 'Premium Boost', 
        description: '5x visibility for 1 hour',
        cost: 100,
        price: '$1.00',
        duration: '1 hour',
        category: 'boosts',
        icon: <Zap className="h-8 w-8 text-purple-600" />,
        popular: true,
        color: 'bg-purple-600',
        textColor: 'text-purple-600'
      },
      { 
        id: 'boost-ultra', 
        name: 'Ultra Boost', 
        description: '10x visibility for 3 hours',
        cost: 200,
        price: '$2.00',
        duration: '3 hours',
        category: 'boosts',
        icon: <Zap className="h-8 w-8 text-purple-700" />,
        popular: false,
        color: 'bg-purple-700',
        textColor: 'text-purple-700'
      }
    ],
    superlikes: [
      { 
        id: 'superlike-basic', 
        name: 'Super Like', 
        description: 'Get noticed instantly',
        cost: 20,
        price: '$0.20',
        quantity: 1,
        category: 'superlikes',
        icon: <Star className="h-8 w-8 text-blue-500" />,
        popular: false,
        color: 'bg-blue-500',
        textColor: 'text-blue-500'
      },
      { 
        id: 'superlike-pack', 
        name: 'Super Pack', 
        description: '5 Super Likes at a discount',
        cost: 75,
        price: '$0.75',
        quantity: 5,
        category: 'superlikes',
        icon: <Star className="h-8 w-8 text-blue-600" />,
        popular: true,
        color: 'bg-blue-600',
        textColor: 'text-blue-600'
      },
      { 
        id: 'superlike-premium', 
        name: 'Premium Like', 
        description: 'Add personalized message',
        cost: 50,
        price: '$0.50',
        quantity: 1,
        category: 'superlikes',
        icon: <Medal className="h-8 w-8 text-blue-600" />,
        popular: false,
        color: 'bg-blue-600',
        textColor: 'text-blue-600'
      }
    ],
    membership: [
      { 
        id: 'membership-week', 
        name: 'Weekly Gold', 
        description: 'Premium features for 7 days',
        cost: 500,
        price: '$4.99',
        duration: '7 days',
        category: 'membership',
        icon: <Crown className="h-8 w-8 text-amber-500" />,
        popular: false,
        color: 'bg-amber-500',
        textColor: 'text-amber-500'
      },
      { 
        id: 'membership-month', 
        name: 'Monthly Gold', 
        description: '30 days (Best Value)',
        cost: 1500,
        price: '$14.99',
        duration: '30 days',
        category: 'membership',
        icon: <Crown className="h-8 w-8 text-amber-500" />,
        popular: true,
        color: 'bg-amber-500',
        textColor: 'text-amber-500'
      },
      { 
        id: 'membership-platinum', 
        name: 'Platinum', 
        description: 'Gold + weekly boosts',
        cost: 2500,
        price: '$24.99',
        duration: '30 days',
        category: 'membership',
        icon: <Crown className="h-8 w-8 text-purple-600" />,
        popular: false,
        color: 'bg-amber-600',
        textColor: 'text-amber-600'
      }
    ]
  };
  
  // Info modal about points
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
          Continue Without Account
        </button>
      </motion.div>
    </motion.div>
  );

  // Render the category boxes when no category is selected
  const renderCategoryBoxes = () => {
    return (
      <div className="grid grid-cols-3 gap-4 mt-6">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            className={`${category.color} rounded-lg overflow-hidden shadow-lg cursor-pointer relative aspect-square`}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCategory(category.id)}
          >
            <div className="p-4 flex flex-col items-center justify-center h-full text-white text-center">
              <div className="bg-white/20 p-3 rounded-full mb-2">
                {React.cloneElement(category.icon, { className: "h-8 w-8 text-white" })}
              </div>
              <h3 className="text-lg font-bold">{category.name}</h3>
              <p className="text-xs text-white/80 mt-1">{category.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Render products for a selected category
  const renderProducts = () => {
    const selectedProducts = products[selectedCategory] || [];
    
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <div className="flex items-center mb-4">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="mr-2 bg-gray-100 hover:bg-gray-200 rounded-full p-2"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold">
              {categories.find(c => c.id === selectedCategory)?.name}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md overflow-hidden relative aspect-square"
              >
                {product.popular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-bl-lg z-10">
                    POPULAR
                  </div>
                )}
                <div className="p-3 flex flex-col h-full">
                  {/* Product Header */}
                  <div className="mb-2">
                    <div className={`${product.color} bg-opacity-10 p-2 rounded-lg inline-block mb-2`}>
                      {product.icon}
                    </div>
                    <h3 className="font-bold text-base">{product.name}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      {product.duration && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full inline-block mb-1">
                          {product.duration}
                        </span>
                      )}
                      {product.quantity && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full inline-block">
                          {product.quantity > 1 ? `${product.quantity} pack` : 'Single'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-center">
                        <Sparkles className="h-3 w-3 text-blue-500 mr-1" />
                        <span className="font-bold text-blue-600 text-sm">{product.cost}</span>
                      </div>
                      <span className="text-xs text-gray-500">{product.price}</span>
                    </div>
                  </div>
                  
                  {/* Purchase Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handlePurchaseWithPoints(product)}
                      className="bg-blue-100 text-blue-700 px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      Points
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handlePurchaseWithMoney(product)}
                      className="bg-gray-100 text-gray-700 px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Buy
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  // Render featured items section
  const renderFeaturedItems = () => {
    if (selectedCategory) return null;
    
    // Get one featured item from each category
    const featuredItems = [
      products.boosts.find(p => p.popular) || products.boosts[0],
      products.superlikes.find(p => p.popular) || products.superlikes[0],
      products.membership.find(p => p.popular) || products.membership[0]
    ];
    
    return (
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
          Featured Items
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredItems.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden relative"
            >
              {product.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded-bl-lg z-10">
                  POPULAR
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <div className={`${product.color} bg-opacity-10 p-2 rounded-lg mr-3`}>
                    {product.icon}
                  </div>
                  <div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-xs text-gray-600">{product.description}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center">
                    <Sparkles className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="font-bold text-blue-600">{product.cost}</span>
                    <span className="text-xs text-gray-500 ml-1">or {product.price}</span>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory(product.category);
                    }}
                    className="text-xs text-blue-600 font-medium flex items-center"
                  >
                    View
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-136px)] p-4 overflow-y-auto pb-16">
      {/* Shop Header with Points Balance for Authenticated Users */}
      <div className="flex justify-between items-center">
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

      {/* Main Content Area - Different based on if a category is selected */}
      {selectedCategory ? renderProducts() : (
        <>
          {renderCategoryBoxes()}
          {renderFeaturedItems()}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showInfoModal && <InfoModal />}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginPrompt && <LoginPrompt />}
      </AnimatePresence>
    </div>
  );
};

export default GymBrosShop;