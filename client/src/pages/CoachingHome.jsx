import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, Calendar, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../stores/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '../services/api';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import subscriptionService from '../services/subscription.service';

const CoachingHome = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user } = useAuth();
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [coaches, setCoaches] = useState([]);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (user) {
          if ( (user.role || user.user.role ) === 'coach') {
            console.log('User is a coach');
            navigate('/dashboard');
            return;
          }
          const response = await api.get('/subscription/current');
          if (response.data && response.data.status === 'active') {
            navigate('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCoaches = async () => {
      try {
        const response = await api.get('/auth/coach');
        setCoaches(response.data);
        console.log('Coaches:', response.data);
      } catch (error) {
        console.error('Error fetching coaches:', error);
      }
    };

    fetchCoaches();
    checkSubscription();
  }, [user, navigate]);


  const features = [
    {
      icon: <Calendar className="w-12 h-12 text-blue-600" />,
      title: 'Personalized Training',
      description: 'Get custom workout plans tailored to your goals and schedule',
    },
    {
      icon: <MessageCircle className="w-12 h-12 text-blue-600" />,
      title: 'Expert Guidance',
      description: 'Direct communication with certified fitness coaches',
    },
    {
      icon: <Award className="w-12 h-12 text-blue-600" />,
      title: 'Progress Tracking',
      description: 'Track your improvements with detailed analytics and feedback',
    },
  ];

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 39.99,
      pointsPerMonth: 100,
      features: [
        'Training/Nutrition plan',
        'Monthly plan updates',
        'Text support',
        '100 points monthly',
      ],
      color: 'bg-white',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 69.99,
      pointsPerMonth: 200,
      features: [
        'Advanced training plan',
        'Nutrition guidance',
        'Weekly plan updates',
        'Priority support',
        '200 points monthly',
      ],
      color: 'bg-blue-50',
      popular: true,
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 89.99,
      pointsPerMonth: 500,
      features: [
        'Custom training and nutrition plan',
        'Weekly video/call consultations',
        'Enhanced questionnaire',
        'Tailored coach',
        '500 points monthly',
      ],
      color: 'bg-white',
    },
  ];

  const handleSelectPlan = (plan) => {
    if (!user) {
      setSelectedPlan(plan);
      setIsModalOpen(true);
    } else {
      navigate('/subscription-checkout', {
        state: {
          plan,
          returnUrl: '/questionnaire',
        },
      });
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate('/subscription-checkout', {
      state: {
        plan: selectedPlan,
        returnUrl: '/questionnaire',
      },
    });
    setIsModalOpen(false);
  };

  const handleSubscriptionAccess = async (e) => {
    e.preventDefault();
    setAccessError('');

    try {
      await subscriptionService.verifyAccessToken(accessToken);
      navigate('/dashboard', { state: { accessToken } }); // Pass the access token in the state
      toast.success('Successfully accessed subscription!');
    } catch (error) {
      setAccessError('Invalid or expired access token');
      toast.error('Failed to access subscription');
    }
  };

  const handleLogin = () => {
    navigate('/login');
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Parallax Effect */}
      <motion.section
        className="relative bg-gradient-to-b from-blue-900 to-blue-700 text-white py-20 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-[url('/images/gym-hero.jpg')] bg-cover bg-center opacity-50"></div>
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transform Your Fitness Journey
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl mb-8 text-blue-100"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Get personalized coaching and achieve your fitness goals faster
            </motion.p>
            <motion.button
              onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-blue-900 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              View Plans
              <ArrowRight className="ml-2 w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Subscription Access Section */}
      <section className="bg-blue-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <button
              onClick={() => setShowAccessForm(!showAccessForm)}
              className="text-blue-600 hover:text-blue-700 underline mb-4"
            >
              Already have a subscription? Access it here
            </button>

            {showAccessForm && (
              <form onSubmit={handleSubscriptionAccess} className="space-y-4 text-white">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter your subscription access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className={accessError ? 'border-red-500' : ''}
                  />
                  {accessError && (
                    <p className="text-red-500 text-sm mt-1">{accessError}</p>
                  )}
                </div>
                <Button type="submit">Access Subscription</Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Features Section with Animated Icons */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6 hover:bg-white rounded-lg transition-colors duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaches Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Meet Our Expert Coaches
          </h2>
          {coaches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coaches.map((coach) => (
                <motion.div
                  key={coach._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="p-6 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <img
                        src={coach.profileImage}
                        alt={`${coach.firstName} ${coach.lastName}`}
                        className="rounded-full w-full h-full object-cover border-4 border-blue-500"
                        onError={(e) => {
                          e.target.onerror = null; // Prevent infinite loop
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {coach.firstName} {coach.lastName}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {coach.bio || 'Dedicated fitness professional helping clients achieve their goals'}
                    </p>
                    <div className="flex justify-center items-center mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-gray-900 mr-1">
                          {coach.rating || '0'}
                        </span>
                        <svg
                          className="w-5 h-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    {coach.socialLinks && (
                      <div className="flex justify-center space-x-4 mb-4">
                        {coach.socialLinks.instagram && (
                          <a href={coach.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}
                        {coach.socialLinks.twitter && (
                          <a href={coach.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                          </a>
                        )}
                        {coach.socialLinks.youtube && (
                          <a href={coach.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => handleSelectPlan(coach)}
                    >
                      Train with {coach.firstName}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-white rounded-lg shadow-md p-8">
                  <svg 
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">No Coaches Available</h3>
                  <p className="text-gray-600 mb-4">
                    We're currently expanding our team of expert coaches. Check back soon!
                  </p>
                  <p className="text-sm text-gray-500">
                    Interested in joining our coaching team?{' '}
                    <a href="/contact" className="text-blue-600 hover:text-blue-700">
                      Contact us
                    </a>
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section with Hover Effects */}
      <section id="plans" className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Choose Your Coaching Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan) => (
              <motion.div
                key={plan.id}
                className={`${plan.color} rounded-2xl shadow-lg overflow-hidden relative hover:shadow-xl transition-shadow duration-300 ${
                  plan.popular ? 'transform scale-105' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Popular
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    } transition-colors`}
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal for non-logged-in users */}
      {!user && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You're Not Logged In
            </h2>

            <p className="text-gray-600 mb-6">
              By logging in, you can earn <strong>Gymjammer points</strong>, which can get you discounts and make future purchases cheaper.
            </p>

            <a
              href="/about-gymjammer-points"
              className="text-blue-600 hover:text-blue-700 underline transition-colors mb-6 block"
            >
              Learn more about Gymjammer points
            </a>

            <div className="flex space-x-4">
              <button
                onClick={handleLogin}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <span>Log In</span>
              </button>
              <button
                onClick={handleContinueWithoutLogin}
                className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center"
              >
                <span>Continue Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachingHome;