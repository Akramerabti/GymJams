import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Coins, Dumbbell, Award } from 'lucide-react';

const DRAG_THRESHOLD = 50; // Minimum drag distance to trigger slide

const OnboardingStep = ({ title, description, icon: Icon }) => (
  <div className="flex flex-col items-center text-center p-6">
    <Icon className="w-12 h-12 text-blue-500 mb-4" />
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Onboarding = ({ onClose, showPointsMessage = true }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    {
      title: "Welcome to GymTonic!",
      description: "Your all-in-one fitness platform. Let's get you started with the basics.",
      icon: Dumbbell
    },
    {
      title: "Points System",
      description: showPointsMessage 
        ? "You've earned 100 points! Earn more points through workouts and purchases. These will let you earn rewards, discounts and much more..."
        : "Earn points through workouts and purchases. These will let you earn rewards, discounts and much more...",
      icon: Coins
    },
    {
      title: "Personal Coaching",
      description: "Connect with expert coaches for personalized training plans.",
      icon: Award
    }
  ];

  const handleDragEnd = (event, info) => {
    const { offset } = info;
    
    if (Math.abs(offset.x) > DRAG_THRESHOLD) {
      if (offset.x > 0 && currentStep > 0) {
        // Dragged right - go to previous step
        setCurrentStep(prev => prev - 1);
      } else if (offset.x < 0 && currentStep < steps.length - 1) {
        // Dragged left - go to next step
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl max-w-md w-full shadow-xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="touch-pan-y"
            >
              <OnboardingStep {...steps[currentStep]} />
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            {currentStep === steps.length - 1 ? (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="p-2 text-blue-600 hover:text-blue-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-center pb-4 space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Onboarding;