import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star } from 'lucide-react';

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
    ]
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
    ]
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
    ]
  }
];

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSubscribe = () => {
    if (selectedPlan) {
      navigate('/questionnaire', { state: { plan: selectedPlan } });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {subscriptionPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all ${
              selectedPlan?.id === plan.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                {plan.name === 'Elite' && (
                  <Star className="w-6 h-6 text-yellow-500" />
                )}
              </div>
              <p className="text-3xl font-bold">${plan.price}
                <span className="text-base font-normal">/month</span>
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={selectedPlan?.id === plan.id ? 'default' : 'outline'}
                onClick={() => setSelectedPlan(plan)}
              >
                {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button
          size="lg"
          disabled={!selectedPlan}
          onClick={handleSubscribe}
        >
          Continue to Questionnaire
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;