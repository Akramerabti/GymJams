import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import subscriptionService from '../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Dumbbell, Target, Clock, Settings, Heart, Brain, Battery, Moon, Sun } from 'lucide-react';

const questions = [
  {
    id: 'goals',
    title: "What are your primary fitness goals?",
    type: 'multiSelect',
    options: [
      { id: 'strength', label: 'Build Strength', icon: <Dumbbell /> },
      { id: 'weight', label: 'Weight Management', icon: <Target /> },
      { id: 'endurance', label: 'Improve Endurance', icon: <Heart /> },
      { id: 'flexibility', label: 'Increase Flexibility', icon: <Settings /> }
    ]
  },
  {
    id: 'experience',
    title: "What's your fitness journey so far?",
    type: 'select',
    options: [
      { value: 'beginner', label: 'Just Starting Out' },
      { value: 'intermediate', label: 'Regular Exerciser' },
      { value: 'advanced', label: 'Fitness Enthusiast' }
    ]
  },
  {
    id: 'frequency',
    title: "How many days per week can you commit to training?",
    type: 'slider',
    min: 1,
    max: 7,
    step: 1
  },
  {
    id: 'equipment',
    title: "Do you have access to gym equipment?",
    type: 'toggle'
  },
  {
    id: 'timeOfDay',
    title: "When do you prefer to work out?",
    type: 'multiSelect',
    options: [
      { id: 'morning', label: 'Morning', icon: <Sun /> },
      { id: 'afternoon', label: 'Afternoon', icon: <Battery /> },
      { id: 'evening', label: 'Evening', icon: <Moon /> }
    ]
  },
  {
    id: 'energy',
    title: "How would you rate your current energy levels?",
    type: 'slider',
    min: 1,
    max: 10,
    step: 1
  },
  {
    id: 'sleep',
    title: "How many hours of sleep do you get on average?",
    type: 'slider',
    min: 4,
    max: 12,
    step: 0.5
  },
  {
    id: 'stress',
    title: "How do you manage stress?",
    type: 'multiSelect',
    options: [
      { id: 'meditation', label: 'Meditation', icon: <Brain /> },
      { id: 'exercise', label: 'Exercise', icon: <Dumbbell /> },
      { id: 'rest', label: 'Rest & Recovery', icon: <Moon /> },
      { id: 'other', label: 'Other Activities', icon: <Sparkles /> }
    ]
  },
  {
    id: 'nutrition',
    title: "How would you describe your eating habits?",
    type: 'select',
    options: [
      { value: 'strict', label: 'Very Structured' },
      { value: 'moderate', label: 'Balanced' },
      { value: 'flexible', label: 'Flexible' },
      { value: 'improving', label: 'Working on It' }
    ]
  },
  {
    id: 'motivation',
    title: "What motivates you to exercise?",
    type: 'multiSelect',
    options: [
      { id: 'health', label: 'Health', icon: <Heart /> },
      { id: 'appearance', label: 'Appearance', icon: <Sparkles /> },
      { id: 'performance', label: 'Performance', icon: <Target /> },
      { id: 'mental', label: 'Mental Wellbeing', icon: <Brain /> }
    ]
  }
];

const QuestionCard = ({ question, value, onChange, isVisible }) => {
  const variants = {
    enter: { x: 1000, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -1000, opacity: 0 }
  };

  return (
    <motion.div
      variants={variants}
      initial="enter"
      animate={isVisible ? "center" : "exit"}
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full"
    >
      <Card className="bg-white/10 backdrop-blur-lg border-none shadow-xl">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {question.title}
          </h2>
          {renderQuestionInput(question, value, onChange)}
        </div>
      </Card>
    </motion.div>
  );
};

const renderQuestionInput = (question, value, onChange) => {
  switch (question.type) {
    case 'multiSelect':
      return (
        <div className="grid grid-cols-2 gap-4">
          {question.options.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const currentValue = value || [];
                const newValue = currentValue.includes(option.id)
                  ? currentValue.filter(v => v !== option.id)
                  : [...currentValue, option.id];
                onChange(newValue);
              }}
              className={`flex items-center p-4 rounded-lg ${
                (value || []).includes(option.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              } transition-colors duration-200`}
            >
              {option.icon && <span className="mr-3">{option.icon}</span>}
              {option.label}
            </motion.button>
          ))}
        </div>
      );

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 rounded-lg bg-gray-700 text-white border-none"
        >
          <option value="">Select an option</option>
          {question.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'slider':
      return (
        <div className="space-y-4">
          <input
            type="range"
            min={question.min}
            max={question.max}
            step={question.step}
            value={value || question.min}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-center text-white text-2xl font-bold">
            {value || question.min}
          </div>
        </div>
      );

    case 'toggle':
      return (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-12' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );

    default:
      return null;
  }
};

const Questionnaire = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  // Progress bar calculation
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentStep].id]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get access token if it exists (for guest users)
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken && !user) {
        toast.error('Access token not found');
        navigate('/coaching');
        return;
      }
  
      await subscriptionService.submitQuestionnaire(answers);
      
      toast.success('Questionnaire completed successfully!', {
        icon: '🎉',
        style: {
          background: '#4CAF50',
          color: 'white',
        },
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.error || 'Invalid request');
      } else {
        toast.error('Failed to submit questionnaire');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-700 rounded-full">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-white mt-2">
            Question {currentStep + 1} of {questions.length}
          </p>
        </div>

        {/* Question Cards */}
        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentStep}
            question={questions[currentStep]}
            value={answers[questions[currentStep].id]}
            onChange={handleAnswer}
            isVisible={true}
          />
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg"
          >
            Previous
          </Button>

          {currentStep === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              {loading ? 'Submitting...' : 'Complete'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;