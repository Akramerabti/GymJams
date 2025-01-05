import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, Calendar, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const CoachingHome = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const features = [
    {
      icon: <Calendar className="w-12 h-12 text-blue-600" />,
      title: "Personalized Training",
      description: "Get custom workout plans tailored to your goals and schedule"
    },
    {
      icon: <MessageCircle className="w-12 h-12 text-blue-600" />,
      title: "Expert Guidance",
      description: "Direct communication with certified fitness coaches"
    },
    {
      icon: <Award className="w-12 h-12 text-blue-600" />,
      title: "Progress Tracking",
      description: "Track your improvements with detailed analytics and feedback"
    }
  ];

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29.99,
      pointsPerMonth: 100,
      features: [
        'Basic training plan',
        'Monthly plan updates',
        'Email support',
        '100 points monthly'
      ],
      color: 'bg-white'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 49.99,
      pointsPerMonth: 200,
      features: [
        'Advanced training plan',
        'Nutrition guidance',
        'Weekly plan updates',
        'Priority support',
        '200 points monthly'
      ],
      color: 'bg-blue-50',
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 99.99,
      pointsPerMonth: 500,
      features: [
        'Custom training plan',
        'Personalized nutrition plan',
        'Weekly video consultations',
        '24/7 support',
        '500 points monthly'
      ],
      color: 'bg-white'
    }
  ];

  const handleSelectPlan = (plan) => {
    const isLoggedIn = false; // Replace with actual authentication check
    if (!isLoggedIn) {
      setSelectedPlan(plan);
      setIsModalOpen(true);
    } else {
      navigate('/subscription-checkout', { 
        state: { 
          plan,
          returnUrl: '/questionnaire' // This will be used after successful payment
        }
      });
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate('/subscription-checkout', { 
      state: { 
        plan: selectedPlan,
        returnUrl: '/questionnaire' // This will be used after successful payment
      }
    });
    setIsModalOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your Fitness Journey
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Get personalized coaching and achieve your fitness goals faster
            </p>
            <button
              onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-blue-900 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              View Plans
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Choose Your Coaching Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`${plan.color} rounded-2xl shadow-lg overflow-hidden relative ${
                  plan.popular ? 'transform scale-105' : ''
                }`}
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Modal for Unauthenticated Users */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4">
              You're Not Logged In
            </h2>
            <p className="text-gray-600 mb-4">
              By logging in, you can earn Gymjammer points, which can get you discounts and make future purchases cheaper.
            </p>
            <a
              href="/about-gymjammer-points"
              className="text-blue-600 hover:underline mb-4 block"
            >
              Learn more about Gymjammer points
            </a>
            <div className="flex space-x-4">
              <button
                onClick={handleLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Log In
              </button>
              <button
                onClick={handleContinueWithoutLogin}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachingHome;