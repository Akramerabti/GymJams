// components/games/FitnessScholar.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints'; // Import the usePoints hook
import { 
  Brain, Timer, Award, Book, 
  Dumbbell, Apple, Star,
  ChevronRight, ChevronLeft, Clock, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const KNOWLEDGE_CATEGORIES = {
  EXERCISE_FORM: 'Proper Exercise Form',
  NUTRITION: 'Nutrition Science',
  ANATOMY: 'Human Anatomy',
  RECOVERY: 'Rest & Recovery',
  TRAINING_PRINCIPLES: 'Training Principles'
};

const MemoryGame = () => {
  const [dailyContent, setDailyContent] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [hasCompletedDaily, setHasCompletedDaily] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [learningStreak, setLearningStreak] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const { balance, addPoints, updatePointsInBackend } = usePoints(); // Destructure addPoints and updatePointsInBackend from usePoints

  useEffect(() => {
    fetchDailyContent();
    checkDailyCompletion();
  }, []);

  const fetchDailyContent = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/user/daily-count');
      const { completed, streak, gamesPlayed } = response.data;
      console.log('Fetched daily status:', response.data);
      setHasCompletedDaily(completed);
      setLearningStreak(streak);
      setGamesPlayed(gamesPlayed);

      // Fetch or generate daily content
      const content = {
        date: new Date().toISOString(),
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
            explanation: "The bar should start over midfoot with shoulders slightly ahead of the bar to create the optimal pulling position and leverage.",
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
            }
          },
          {
            question: "What is the most common mistake during a squat?",
            answers: [
              "Knees caving inward",
              "Chest too upright",
              "Feet too close together",
              "All of the above"
            ],
            correctAnswer: 3,
            explanation: "Knees caving inward, chest too upright, and feet too close together are all common squat mistakes.",
            mainTopic: {
              category: KNOWLEDGE_CATEGORIES.EXERCISE_FORM,
              title: "Mastering the Squat",
              content: `
                The squat is a fundamental exercise for building lower body strength.
                Proper form is essential to avoid injury and maximize results.
                Key components include:
                
                1. Foot placement
                2. Knee alignment
                3. Hip mobility
                4. Core engagement
              `,
              keyPoints: [
                "Keep your chest up and back straight",
                "Push your knees out to align with your toes",
                "Lower your hips until your thighs are parallel to the ground",
                "Drive through your heels to stand back up"
              ],
              visualCues: [
                "Imagine sitting back into a chair",
                "Think about spreading the floor apart with your feet",
                "Pretend you're holding a ball between your knees"
              ]
            }
          },
          {
            question: "Which muscle group is primarily targeted during a bench press?",
            answers: [
              "Quadriceps",
              "Pectorals",
              "Hamstrings",
              "Calves"
            ],
            correctAnswer: 1,
            explanation: "The bench press primarily targets the pectorals (chest muscles).",
            mainTopic: {
              category: KNOWLEDGE_CATEGORIES.EXERCISE_FORM,
              title: "Perfecting the Bench Press",
              content: `
                The bench press is a key upper body exercise for building chest strength.
                Proper form ensures safety and effectiveness.
                Key components include:
                
                1. Grip width
                2. Bar path
                3. Shoulder positioning
                4. Leg drive
              `,
              keyPoints: [
                "Grip the bar slightly wider than shoulder-width",
                "Lower the bar to mid-chest level",
                "Keep your shoulders retracted and down",
                "Drive through your legs to stabilize your body"
              ],
              visualCues: [
                "Imagine bending the bar like a horseshoe",
                "Think about pushing yourself away from the bar",
                "Pretend you're squeezing a pencil between your shoulder blades"
              ]
            }
          },
          {
            question: "Which macronutrient is the primary energy source during high-intensity exercise?",
            answers: [
              "Protein",
              "Fat",
              "Carbohydrates",
              "Fiber"
            ],
            correctAnswer: 2,
            explanation: "Carbohydrates are the body's preferred energy source for high-intensity activities.",
            mainTopic: {
              category: KNOWLEDGE_CATEGORIES.NUTRITION,
              title: "Understanding Macronutrients",
              content: `
                Macronutrients are the primary sources of energy for the body.
                They include carbohydrates, proteins, and fats.
                Key points to remember:
                
                1. Carbohydrates provide quick energy
                2. Proteins support muscle repair
                3. Fats are essential for hormone production
              `,
              keyPoints: [
                "Carbs are stored as glycogen in muscles and liver",
                "Proteins are made up of amino acids",
                "Fats are essential for absorbing fat-soluble vitamins"
              ],
              visualCues: [
                "Imagine carbs as fuel for a car",
                "Think about proteins as building blocks",
                "Pretend fats are the oil that keeps the engine running smoothly"
              ]
            }
          },
          {
            question: "What is the recommended daily protein intake for an average adult (in grams per kilogram of body weight)?",
            answers: [
              "0.8 g/kg",
              "1.2 g/kg",
              "2.0 g/kg",
              "3.5 g/kg"
            ],
            correctAnswer: 0,
            explanation: "The recommended daily protein intake for an average adult is 0.8 grams per kilogram of body weight.",
            mainTopic: {
              category: KNOWLEDGE_CATEGORIES.NUTRITION,
              title: "Protein and Muscle Repair",
              content: `
                Protein is essential for muscle repair and growth.
                It is made up of amino acids, which are the building blocks of muscle tissue.
                Key points to remember:
                
                1. Complete proteins contain all essential amino acids
                2. Protein needs increase with physical activity
                3. Timing of protein intake can impact recovery
              `,
              keyPoints: [
                "Animal proteins are complete proteins",
                "Plant-based proteins may need to be combined for completeness",
                "Consume protein within 30 minutes post-workout for optimal recovery"
              ],
              visualCues: [
                "Imagine protein as bricks building a house",
                "Think about amino acids as the cement holding the bricks together",
                "Pretend your muscles are a construction site in need of materials"
              ]
            }
          },
      
          // Human Anatomy
          {
            question: "Which muscle is responsible for extending the elbow?",
            answers: [
              "Biceps",
              "Triceps",
              "Deltoids",
              "Pectorals"
            ],
            correctAnswer: 1,
            explanation: "The triceps are responsible for extending the elbow.",
            mainTopic: {
              category: KNOWLEDGE_CATEGORIES.ANATOMY,
              title: "Understanding the Triceps",
              content: `
                The triceps brachii is a three-headed muscle located at the back of the upper arm.
                It is responsible for extending the elbow and stabilizing the shoulder.
                Key points to remember:
                
                1. The triceps make up two-thirds of the upper arm
                2. They are activated during pushing movements
                3. Strong triceps improve overall arm strength
              `,
              keyPoints: [
                "The triceps have three heads: long, lateral, and medial",
                "They work in opposition to the biceps",
                "Exercises like push-ups and dips target the triceps"
              ],
              visualCues: [
                "Imagine the triceps as a horseshoe on the back of your arm",
                "Think about pushing a door open to engage the triceps",
                "Pretend you're squeezing a lemon with your elbow"
              ]
            }
          },
      
          // Rest & Recovery
          {
            question: "How many hours of sleep are recommended for optimal recovery?",
            answers: [
              "4-5 hours",
              "6-7 hours",
              "7-9 hours",
              "10+ hours"
            ],
            correctAnswer: 2,
            explanation: "7-9 hours of sleep are recommended for optimal recovery.",
            mainTopic: {
              category: KNOWLEDGE_CATEGORIES.RECOVERY,
              title: "The Importance of Sleep",
              content: `
                Sleep is crucial for muscle recovery, cognitive function, and overall health.
                During sleep, the body repairs tissues and consolidates memories.
                Key points to remember:
                
                1. Aim for 7-9 hours of sleep per night
                2. Sleep quality is as important as quantity
                3. Avoid screens and caffeine before bedtime
              `,
              keyPoints: [
                "Growth hormone is released during deep sleep",
                "Lack of sleep can impair muscle recovery",
                "A consistent sleep schedule improves sleep quality"
              ],
              visualCues: [
                "Imagine your body as a phone recharging overnight",
                "Think about sleep as a reset button for your brain",
                "Pretend your muscles are repairing like a car in a garage"
              ]
            }
          },
      
          // Training Principles
          {
            question: "What does the 'SAID' principle stand for?",
            answers: [
              "Specific Adaptation to Imposed Demands",
              "Strength and Intensity Development",
              "Speed and Agility Improvement Drills",
              "Stretching and Injury Prevention"
            ],
            correctAnswer: 0,
            explanation: "The SAID principle stands for Specific Adaptation to Imposed Demands.",
            mainTopic: {
              category: KNOWLEDGE_CATEGORIES.TRAINING_PRINCIPLES,
              title: "Understanding the SAID Principle",
              content: `
                The SAID principle states that the body adapts specifically to the demands placed on it.
                This means training should be tailored to your goals.
                Key points to remember:
                
                1. Specificity ensures targeted improvements
                2. Overload drives adaptation
                3. Recovery allows for adaptation to occur
              `,
              keyPoints: [
                "Train for the specific demands of your sport or activity",
                "Gradually increase intensity to avoid plateaus",
                "Allow adequate recovery for optimal adaptation"
              ],
              visualCues: [
                "Imagine your body as a machine adapting to its workload",
                "Think about training as sharpening a specific tool",
                "Pretend recovery is the oil that keeps the machine running smoothly"
              ]
            }
          },
      
            {
              question: "What is progressive overload and how should it be implemented?",
              answers: [
                "Gradually increasing training demands based on individual adaptation",
                "Maxing out every workout",
                "Changing exercises frequently",
                "Maintaining the same weight for consistency"
              ],
              correctAnswer: 0,
              explanation: "Progressive overload involves systematically increasing training demands as your body adapts.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.TRAINING_PRINCIPLES,
                title: "Understanding Progressive Overload",
                content: `
                  Progressive overload is the gradual increase of stress placed on the body during exercise.
                  Key components:
                  1. Volume (sets & reps)
                  2. Intensity (weight/resistance)
                  3. Frequency (sessions per week)
                  4. Time under tension
                  5. Rest periods
                `,
                keyPoints: [
                  "Increase demands gradually (2.5-5% per week)",
                  "Monitor recovery and adaptation",
                  "Adjust variables systematically",
                  "Track progress consistently",
                  "Listen to your body's signals"
                ],
                visualCues: [
                  "Think of building a house brick by brick",
                  "Imagine climbing a ladder one step at a time",
                  "Visualize a plant growing steadily with proper care"
                ]
              }
            },
            {
              question: "What occurs during the anaerobic energy system's dominant phase?",
              answers: [
                "Fat oxidation becomes primary fuel source",
                "Lactate accumulates as energy demands exceed aerobic capacity",
                "Protein becomes the main energy source",
                "Oxygen consumption reaches maximum"
              ],
              correctAnswer: 1,
              explanation: "During anaerobic exercise, energy demands exceed oxygen supply, leading to lactate accumulation.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.TRAINING_PRINCIPLES,
                title: "Understanding Energy Systems",
                content: `
                  The body uses three primary energy systems:
                  1. Phosphagen (immediate energy)
                  2. Glycolytic (short-term)
                  3. Oxidative (long-term)
                  
                  Each system dominates at different intensities and durations.
                `,
                keyPoints: [
                  "ATP-PC system lasts 10-15 seconds",
                  "Glycolytic system dominates 30-60 seconds",
                  "Aerobic system handles longer durations",
                  "Systems overlap and work together",
                  "Recovery needs vary by system used"
                ],
                visualCues: [
                  "Think of gears shifting in a car",
                  "Imagine different fuel tanks being used",
                  "Visualize a relay race handoff between systems"
                ]
              }
            },
            {
              question: "How should post-workout nutrition be timed for optimal recovery?",
              answers: [
                "Within 30 minutes post-workout",
                "At least 2 hours after workout",
                "Only before bed",
                "Timing doesn't matter"
              ],
              correctAnswer: 0,
              explanation: "The post-workout anabolic window is most effective within 30 minutes of exercise.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.NUTRITION,
                title: "Post-Workout Nutrition Timing",
                content: `
                  Post-workout nutrition timing affects:
                  1. Muscle protein synthesis
                  2. Glycogen replenishment
                  3. Recovery rate
                  4. Adaptation response
                  5. Next-day performance
                `,
                keyPoints: [
                  "Consume protein and carbs together",
                  "Aim for 20-40g protein post-workout",
                  "Include fast-digesting carbs",
                  "Consider workout intensity",
                  "Account for workout duration"
                ],
                visualCues: [
                  "Think of filling an empty gas tank",
                  "Imagine repairing a broken wall",
                  "Visualize restocking empty shelves"
                ]
              }
            },
            {
              question: "What role does fascia play in muscle function and movement?",
              answers: [
                "It's just padding between muscles",
                "Connects and integrates muscle groups, affects force transmission",
                "Only provides blood supply",
                "Has no significant role"
              ],
              correctAnswer: 1,
              explanation: "Fascia is crucial for force transmission and functional movement patterns.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.ANATOMY,
                title: "Understanding Fascia",
                content: `
                  Fascia is connective tissue that:
                  1. Surrounds muscles and organs
                  2. Creates myofascial chains
                  3. Assists in force transmission
                  4. Provides proprioceptive feedback
                  5. Influences movement patterns
                `,
                keyPoints: [
                  "Forms continuous body-wide network",
                  "Affects movement efficiency",
                  "Responds to mechanical stress",
                  "Requires proper hydration",
                  "Can be trained and conditioned"
                ],
                visualCues: [
                  "Think of a spider's web connecting points",
                  "Imagine a full-body suit under skin",
                  "Visualize elastic bands connecting muscles"
                ]
              }
            },
            {
              question: "What impact does sleep quality have on muscle recovery?",
              answers: [
                "Only duration matters, not quality",
                "Quality sleep increases growth hormone and protein synthesis",
                "Sleep has minimal impact on recovery",
                "Only affects mental recovery"
              ],
              correctAnswer: 1,
              explanation: "Quality sleep enhances hormone production and protein synthesis, crucial for recovery.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.RECOVERY,
                title: "Sleep Quality and Recovery",
                content: `
                  Sleep impacts recovery through:
                  1. Hormone regulation
                  2. Protein synthesis
                  3. Tissue repair
                  4. CNS recovery
                  5. Memory consolidation
                `,
                keyPoints: [
                  "Aim for consistent sleep schedule",
                  "Create optimal sleep environment",
                  "Monitor sleep quality indicators",
                  "Manage pre-sleep routine",
                  "Track recovery markers"
                ],
                visualCues: [
                  "Think of body as repair shop at night",
                  "Imagine muscles knitting back together",
                  "Visualize battery recharging fully"
                ]
              }
            },
            {
              question: "What is progressive overload and how should it be implemented?",
              answers: [
                "Gradually increasing training demands based on individual adaptation",
                "Maxing out every workout",
                "Changing exercises frequently",
                "Maintaining the same weight for consistency"
              ],
              correctAnswer: 0,
              explanation: "Progressive overload involves systematically increasing training demands as your body adapts.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.TRAINING_PRINCIPLES,
                title: "Understanding Progressive Overload",
                content: `
                  Progressive overload is the gradual increase of stress placed on the body during exercise.
                  Key components:
                  1. Volume (sets & reps)
                  2. Intensity (weight/resistance)
                  3. Frequency (sessions per week)
                  4. Time under tension
                  5. Rest periods
                `,
                keyPoints: [
                  "Increase demands gradually (2.5-5% per week)",
                  "Monitor recovery and adaptation",
                  "Adjust variables systematically",
                  "Track progress consistently",
                  "Listen to your body's signals"
                ],
                visualCues: [
                  "Think of building a house brick by brick",
                  "Imagine climbing a ladder one step at a time",
                  "Visualize a plant growing steadily with proper care"
                ]
              }
            },
            {
              question: "What occurs during the anaerobic energy system's dominant phase?",
              answers: [
                "Fat oxidation becomes primary fuel source",
                "Lactate accumulates as energy demands exceed aerobic capacity",
                "Protein becomes the main energy source",
                "Oxygen consumption reaches maximum"
              ],
              correctAnswer: 1,
              explanation: "During anaerobic exercise, energy demands exceed oxygen supply, leading to lactate accumulation.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.TRAINING_PRINCIPLES,
                title: "Understanding Energy Systems",
                content: `
                  The body uses three primary energy systems:
                  1. Phosphagen (immediate energy)
                  2. Glycolytic (short-term)
                  3. Oxidative (long-term)
                  
                  Each system dominates at different intensities and durations.
                `,
                keyPoints: [
                  "ATP-PC system lasts 10-15 seconds",
                  "Glycolytic system dominates 30-60 seconds",
                  "Aerobic system handles longer durations",
                  "Systems overlap and work together",
                  "Recovery needs vary by system used"
                ],
                visualCues: [
                  "Think of gears shifting in a car",
                  "Imagine different fuel tanks being used",
                  "Visualize a relay race handoff between systems"
                ]
              }
            },
            {
              question: "How should post-workout nutrition be timed for optimal recovery?",
              answers: [
                "Within 30 minutes post-workout",
                "At least 2 hours after workout",
                "Only before bed",
                "Timing doesn't matter"
              ],
              correctAnswer: 0,
              explanation: "The post-workout anabolic window is most effective within 30 minutes of exercise.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.NUTRITION,
                title: "Post-Workout Nutrition Timing",
                content: `
                  Post-workout nutrition timing affects:
                  1. Muscle protein synthesis
                  2. Glycogen replenishment
                  3. Recovery rate
                  4. Adaptation response
                  5. Next-day performance
                `,
                keyPoints: [
                  "Consume protein and carbs together",
                  "Aim for 20-40g protein post-workout",
                  "Include fast-digesting carbs",
                  "Consider workout intensity",
                  "Account for workout duration"
                ],
                visualCues: [
                  "Think of filling an empty gas tank",
                  "Imagine repairing a broken wall",
                  "Visualize restocking empty shelves"
                ]
              }
            },
            {
              question: "What role does fascia play in muscle function and movement?",
              answers: [
                "It's just padding between muscles",
                "Connects and integrates muscle groups, affects force transmission",
                "Only provides blood supply",
                "Has no significant role"
              ],
              correctAnswer: 1,
              explanation: "Fascia is crucial for force transmission and functional movement patterns.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.ANATOMY,
                title: "Understanding Fascia",
                content: `
                  Fascia is connective tissue that:
                  1. Surrounds muscles and organs
                  2. Creates myofascial chains
                  3. Assists in force transmission
                  4. Provides proprioceptive feedback
                  5. Influences movement patterns
                `,
                keyPoints: [
                  "Forms continuous body-wide network",
                  "Affects movement efficiency",
                  "Responds to mechanical stress",
                  "Requires proper hydration",
                  "Can be trained and conditioned"
                ],
                visualCues: [
                  "Think of a spider's web connecting points",
                  "Imagine a full-body suit under skin",
                  "Visualize elastic bands connecting muscles"
                ]
              }
            },
            {
              question: "What impact does sleep quality have on muscle recovery?",
              answers: [
                "Only duration matters, not quality",
                "Quality sleep increases growth hormone and protein synthesis",
                "Sleep has minimal impact on recovery",
                "Only affects mental recovery"
              ],
              correctAnswer: 1,
              explanation: "Quality sleep enhances hormone production and protein synthesis, crucial for recovery.",
              mainTopic: {
                category: KNOWLEDGE_CATEGORIES.RECOVERY,
                title: "Sleep Quality and Recovery",
                content: `
                  Sleep impacts recovery through:
                  1. Hormone regulation
                  2. Protein synthesis
                  3. Tissue repair
                  4. CNS recovery
                  5. Memory consolidation
                `,
                keyPoints: [
                  "Aim for consistent sleep schedule",
                  "Create optimal sleep environment",
                  "Monitor sleep quality indicators",
                  "Manage pre-sleep routine",
                  "Track recovery markers"
                ],
                visualCues: [
                  "Think of body as repair shop at night",
                  "Imagine muscles knitting back together",
                  "Visualize battery recharging fully"
                ]
              }
            },
            // Add more here
        ]
      };

      const randomQuestion = content.quiz[Math.floor(Math.random() * content.quiz.length)];
      setDailyContent(content);
      setSelectedQuestion(randomQuestion);
      setIsLoading(false);
      console.log('Fetched daily content:', randomQuestion);
      console.log('Daily content:', randomQuestion.mainTopic.title);
    } catch (error) {
      console.error('Error fetching daily content:', error);
      toast.error('Failed to load daily fitness knowledge');
      setIsLoading(false);
    }
  };

  const checkDailyCompletion = async () => {
    try {
      const response = await api.get('/user/daily-count');
      const { completed, streak, gamesPlayed } = response.data;
      setHasCompletedDaily(completed);
      setLearningStreak(streak);
      setGamesPlayed(gamesPlayed);
    } catch (error) {
      console.error('Error checking daily status:', error);
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

  const handleAnswerSelect = async (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const isCorrect = answerIndex === selectedQuestion.correctAnswer;
    
    if (isCorrect) {
      createParticleEffect();
      setScore(prev => prev + 1);

      // Add points to the user's balance
      const basePoints = 20;
      const streakBonus = Math.round(learningStreak * 1.1);
      const totalPoints = basePoints + streakBonus ;

      addPoints(totalPoints); // Update points in the frontend state
      console.log('Total points:', totalPoints);
      await updatePointsInBackend(balance + totalPoints); // Update points in the backend
    } else {
      // Increment games played if the answer is wrong
      setGamesPlayed(prev => prev + 1);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    handleQuizCompletion();
  };

  const handleQuizCompletion = async () => {
    try {
      const totalQuestions = 1; // Only 1 question per day
      const basePoints = 20;
      const streakBonus = Math.round(learningStreak * 1.1);
      const totalPoints = basePoints + streakBonus;
  
      if (score === totalQuestions) {
        // User answered correctly
        await api.post('/user/complete', {
          score,
          totalQuestions,
          points: totalPoints,
          streak: learningStreak + 1,
          gamesPlayed: gamesPlayed + 1,
        });
  
        setLearningStreak((prev) => prev + 1);
  
        // Success toast
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
      } else {
        // User failed the question
        await api.post('/user/complete', {
          score,
          totalQuestions,
          points: 0,
          streak: 0, // Reset the streak
          gamesPlayed: gamesPlayed + 1,
        });
  
        setLearningStreak(0); // Reset the streak in the frontend
  
        // Failure toast
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-xl shadow-xl"
          >
            <div className="flex items-center mb-4">
              <Brain className="w-8 h-8 mr-3 text-yellow-400" />
              <div>
                <h3 className="font-bold text-lg">Oops! Wrong Answer!</h3>
                <p className="text-sm opacity-90">
                  {`${score}/${totalQuestions} correct • Streak reset to 0`}
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">
              Better luck next time!
            </div>
            <div className="text-sm opacity-75">
              Keep learning and come back tomorrow!
            </div>
          </motion.div>
        ));
      }
  
      setHasCompletedDaily(true);
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
                {selectedQuestion.mainTopic.title}
              </h2>
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
              {selectedQuestion.mainTopic.category}
            </span>
          </div>

          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 leading-relaxed">
              {selectedQuestion.mainTopic.content}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg mb-4">Key Points to Remember</h3>
            <ul className="space-y-3">
              {selectedQuestion.mainTopic.keyPoints.map((point, index) => (
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
              {selectedQuestion.mainTopic.visualCues.map((cue, index) => (
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
                Question 1 of 1
              </h3>
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium">{score} correct</span>
              </div>
            </div>

            <p className="text-lg mb-6">
              {selectedQuestion.question}
            </p>

            <div className="space-y-4">
              {selectedQuestion.answers.map((answer, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedAnswer === null
                      ? 'hover:bg-blue-50 bg-gray-50'
                      : index === selectedQuestion.correctAnswer
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