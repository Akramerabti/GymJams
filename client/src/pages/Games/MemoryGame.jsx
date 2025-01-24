// components/games/FitnessScholar.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints';
import { 
  Brain, Timer, Award, Book, 
  Dumbbell, Apple, Star,
  ChevronRight, ChevronLeft, Clock, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

// Define our knowledge categories
const KNOWLEDGE_CATEGORIES = {
  EXERCISE_FORM: 'Proper Exercise Form',
  NUTRITION: 'Nutrition Science',
  ANATOMY: 'Human Anatomy',
  RECOVERY: 'Rest & Recovery',
  TRAINING_PRINCIPLES: 'Training Principles'
};

const MemoryGame = () => {
  const [dailyContent, setDailyContent] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [hasCompletedDaily, setHasCompletedDaily] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [learningStreak, setLearningStreak] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const { addPoints } = usePoints();

  // Fetch daily content on component mount
  useEffect(() => {
    fetchDailyContent();
    checkDailyCompletion();
  }, []);

  const fetchDailyContent = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/user/daily-count');
      const content = {
        date: new Date().toISOString(),
        mainTopic: {
          category: KNOWLEDGE_CATEGORIES.EXERCISE_FORM,
          title: "Understanding the Perfect Deadlift",
          content: `
            The deadlift is one of the most effective compound exercises,
            but proper form is crucial for both safety and results.
            Let's break down the key components:
            
            1. Foot Position
            2. Hip Hinge Mechanics
            3. Back Position
            4. Grip Types
            5. Common Mistakes
          `,
          keyPoints: [
            "Keep the bar close to your shins",
            "Maintain neutral spine throughout",
            "Drive through your heels",
            "Engage your lats before lifting",
            "Think of the movement as a push, not a pull"
          ],
          visualCues: [
            "Imagine squeezing oranges in your armpits",
            "Think about pushing the ground away",
            "Pretend you're protecting your armpits"
          ]
        },
        quiz: [
          {
            question: "What is the correct starting position for a deadlift?",
            answers: [
              "Bar over midfoot, shoulders slightly ahead of bar",
              "Bar over toes, shoulders behind bar",
              "Bar touching shins, shoulders directly over bar",
              "Bar against shins, shoulders far ahead of bar"
            ],
            correctAnswer: 0,
            explanation: "The bar should start over midfoot with shoulders slightly ahead of the bar to create the optimal pulling position and leverage."
          },
          // More questions...
        ]
      };

      setDailyContent(content);
      setQuizQuestions(content.quiz);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching daily content:', error);
      toast.error('Failed to load daily fitness knowledge');
      setIsLoading(false);
    }
  };

  const checkDailyCompletion = async () => {
    try {
      const response = await api.get('/user/daily-count');
      setHasCompletedDaily(response.data.completed);
      setLearningStreak(response.data.streak);
    } catch (error) {
      console.error('Error checking daily status:', error);
    }
  };

  const handleAnswerSelect = async (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const isCorrect = answerIndex === quizQuestions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      createParticleEffect();
      setScore(prev => prev + 1);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleQuizCompletion();
    }
  };

  const createParticleEffect = () => {
    const particleContainer = document.createElement('div');
    particleContainer.style.position = 'fixed';
    particleContainer.style.inset = '0';
    particleContainer.style.pointerEvents = 'none';
    document.body.appendChild(particleContainer);

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 bg-yellow-400 rounded-full';
      particle.style.left = '50%';
      particle.style.top = '50%';
      particleContainer.appendChild(particle);

      const angle = (i / 30) * Math.PI * 2;
      const velocity = 10;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity;

      particle.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          {
            transform: `translate(${x * 50}px, ${y * 50}px) scale(0)`,
            opacity: 0,
          },
        ],
        {
          duration: 1000,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }
      );
    }

    setTimeout(() => {
      particleContainer.remove();
    }, 1000);
  };

  const handleQuizCompletion = async () => {
    try {
      const totalQuestions = quizQuestions.length;
      const percentageCorrect = (score / totalQuestions) * 100;
      
      const basePoints = 20;
      const streakBonus = learningStreak * 2;
      const performanceBonus = Math.floor(percentageCorrect / 10);
      const totalPoints = basePoints + streakBonus + performanceBonus;

      await api.post('/fitness-scholar/complete', {
        score,
        totalQuestions,
        points: totalPoints,
        streak: learningStreak + 1
      });

      addPoints(totalPoints);
      setHasCompletedDaily(true);
      setLearningStreak(prev => prev + 1);

      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl shadow-xl"
        >
          <div className="flex items-center mb-4">
            <Award className="w-8 h-8 mr-3 text-yellow-400" />
            <div>
              <h3 className="font-bold text-lg">Knowledge Champion!</h3>
              <p className="text-sm opacity-90">
                {`${score}/${totalQuestions} correct • ${learningStreak + 1} day streak`}
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold mb-2">
            +{totalPoints} Points Earned!
          </div>
          <div className="text-sm opacity-75">
            Come back tomorrow for new fitness knowledge!
          </div>
        </motion.div>
      ));

    } catch (error) {
      console.error('Error completing quiz:', error);
      toast.error('Failed to save your progress');
    }
  };

  const timeUntilReset = () => {
    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setHours(24, 0, 0, 0); // Set to next midnight
    const diff = resetTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (hasCompletedDaily) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Award className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Daily Learning Complete!</h2>
        <p className="text-gray-600 mb-6">
          You're on a {learningStreak} day learning streak! 🔥
        </p>
        <div className="bg-blue-50 p-4 rounded-lg inline-block">
          <Clock className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <p className="text-sm text-blue-800">
            New knowledge available in {timeUntilReset()}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {!showQuiz ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Book className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">
                {dailyContent.mainTopic.title}
              </h2>
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
              {dailyContent.mainTopic.category}
            </span>
          </div>

          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 leading-relaxed">
              {dailyContent.mainTopic.content}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg mb-4">Key Points to Remember</h3>
            <ul className="space-y-3">
              {dailyContent.mainTopic.keyPoints.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{point}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Visual Cues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyContent.mainTopic.visualCues.map((cue, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-4 rounded-lg shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700">{cue}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuiz(true)}
            className="mt-8 w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Test Your Knowledge
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl p-8"
        >
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                Question {currentQuestion + 1} of {quizQuestions.length}
              </h3>
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium">{score} correct</span>
              </div>
            </div>

            <p className="text-lg mb-6">
              {quizQuestions[currentQuestion].question}
            </p>

            <div className="space-y-4">
              {quizQuestions[currentQuestion].answers.map((answer, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedAnswer === null
                      ? 'hover:bg-blue-50 bg-gray-50'
                      : index === quizQuestions[currentQuestion].correctAnswer
                      ? 'bg-green-100 border-green-500'
                      : selectedAnswer === index
                      ? 'bg-red-100 border-red-500'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-gray-300">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{answer}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MemoryGame;