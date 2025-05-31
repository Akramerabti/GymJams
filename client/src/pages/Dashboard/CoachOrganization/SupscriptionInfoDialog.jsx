import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, Crown, Zap, CheckCircle, X } from 'lucide-react';

const SubscriptionInfoDialog = ({ isOpen, onClose, subscriptionType }) => {
  const subscriptionInfo = {
    basic: {
      title: 'Basic Subscription',
      icon: <Award className="w-8 h-8 text-blue-500" />,
      description: 'The Basic plan offers essential coaching features with limited support options.',
      features: [
        'Monthly workout plan updates',
        'Basic progress tracking',
        'Text support (48hr response time)',
        '100 points monthly for client rewards',
        'Limited goal tracking'
      ],
      coachingTips: [
        'Schedule monthly check-ins to review progress',
        'Focus on fundamental movement patterns and techniques',
        'Provide simple, achievable fitness goals',
        'Recommend basic nutrition guidelines',
        'Keep communication clear and concise'
      ],
      color: 'border-blue-200 bg-blue-50'
    },
    premium: {
      title: 'Premium Subscription',
      icon: <Crown className="w-8 h-8 text-purple-500" />,
      description: 'The Premium plan offers advanced coaching features with priority support and more frequent interactions.',
      features: [
        'Weekly workout plan updates',
        'Comprehensive progress tracking',
        'Priority text support (24hr response time)',
        'Nutrition guidance and meal planning',
        '200 points monthly for client rewards',
        'Advanced goal tracking and metrics'
      ],
      coachingTips: [
        'Schedule weekly check-ins to review progress',
        'Provide more detailed feedback on form and technique',
        'Create periodized training programs',
        'Develop customized nutrition strategies',
        'Be more proactive with regular check-ins',
        'Offer video analysis for key exercises'
      ],
      color: 'border-purple-200 bg-purple-50'
    },
    elite: {
      title: 'Elite Subscription',
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      description: 'The Elite plan offers the most comprehensive coaching experience with personalized attention and premium features.',
      features: [
        'Fully customized training programs',
        'Daily workout adjustments as needed',
        'Same-day response to messages (24hr response time)',
        'Weekly video consultations',
        'Comprehensive nutrition planning',
        'Recovery monitoring and guidance',
        '500 points monthly for client rewards',
        'Advanced analytics and body composition tracking'
      ],
      coachingTips: [
        'Provide white-glove service with proactive support',
        'Schedule weekly video calls for in-depth reviews',
        'Create highly detailed and personalized programs',
        'Offer comprehensive nutrition and lifestyle coaching',
        'Be available for quick adjustments to training plans',
        'Provide detailed analytics and regular assessments',
        'Focus on holistic approach (training, nutrition, recovery, lifestyle)',
        'Send motivational messages and additional resources regularly'
      ],
      color: 'border-amber-200 bg-amber-50'
    }
  };

  const info = subscriptionInfo[subscriptionType] || subscriptionInfo.basic;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center">
            <div className={`p-2 rounded-full mr-3 ${
              subscriptionType === 'elite' ? 'bg-amber-100' : 
              subscriptionType === 'premium' ? 'bg-purple-100' : 
              'bg-blue-100'
            }`}>
              {info.icon}
            </div>
            <DialogTitle className="text-xl">{info.title}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          <p className="text-gray-700">{info.description}</p>
          
          <div className={`rounded-lg border p-4 ${info.color}`}>
            <h3 className="font-semibold mb-2 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Plan Features
            </h3>
            <ul className="space-y-2">
              {info.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-green-600">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <h3 className="font-semibold mb-2 text-indigo-800">Coaching Tips</h3>
            <p className="text-sm text-indigo-700 mb-2">How to best serve clients on this plan:</p>
            <ul className="space-y-2">
              {info.coachingTips.map((tip, index) => (
                <li key={index} className="flex items-start text-indigo-800">
                  <span className="mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionInfoDialog;