// components/games/FitnessScholar.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoints } from '../../hooks/usePoints'; // Import the usePoints hook
import { 
  Brain, Timer, Award, Book, 
  Dumbbell, Apple, Star, Sparkles,
  ChevronRight, ChevronLeft, Clock, CheckCircle,
  Trophy, Target, Zap, Flame, Heart
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

const containerVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.8,
      when: "beforeChildren",
      staggerChildren: 0.15,
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.9,
    transition: { duration: 0.5 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -30, y: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    y: 0,
    transition: { 
      duration: 0.6,
      type: "spring",
      stiffness: 120,
      damping: 12
    }
  }
};

const floatingVariants = {
  initial: { y: 0, rotate: 0 },
  animate: {
    y: [-10, 10, -10],
    rotate: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const sparkleVariants = {
  initial: { opacity: 0, scale: 0, rotate: 0 },
  animate: {
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    rotate: [0, 180, 360],
    transition: {
      duration: 2,
      repeat: Infinity,
      delay: Math.random() * 2
    }
  }
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
  const { balance, addPoints, updatePointsInBackend } = usePoints();

  // Prevent scrolling on this game
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);// Destructure addPoints and updatePointsInBackend from usePoints

  // Floating Background Elements Component
  const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large floating icons */}
      {[...Array(8)].map((_, i) => {
        const icons = [Dumbbell, Apple, Trophy, Target, Zap, Flame, Heart, Star];
        const Icon = icons[i];
        return (
          <motion.div
            key={i}
            variants={floatingVariants}
            initial="initial"
            animate="animate"
            className="absolute opacity-10"
            style={{
              left: `${15 + (i * 12)}%`,
              top: `${10 + (i * 8)}%`,
              animationDelay: `${i * 0.5}s`
            }}
          >
            <Icon className="w-16 h-16 text-white" />
          </motion.div>
        );
      })}
      
      {/* Small sparkles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          variants={sparkleVariants}
          initial="initial"
          animate="animate"
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`
          }}
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </motion.div>
      ))}
      
      {/* Gradient orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5
          }}
          className="absolute rounded-full blur-xl"
          style={{
            left: `${Math.random() * 80}%`,
            top: `${Math.random() * 80}%`,
            width: `${60 + i * 20}px`,
            height: `${60 + i * 20}px`,
            background: `linear-gradient(45deg, 
              ${['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'][i]} 0%, 
              transparent 70%)`
          }}
        />
      ))}
    </div>
  );

  useEffect(() => {
    fetchDailyContent();
    checkDailyCompletion();
  }, []);

  const fetchDailyContent = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/user/daily-count');
      const { completed, streak, gamesPlayed } = response.data;
      
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
  };  const createParticleEffect = () => {
    const particleContainer = document.createElement('div');
    particleContainer.style.position = 'fixed';
    particleContainer.style.inset = '0';
    particleContainer.style.pointerEvents = 'none';
    particleContainer.style.zIndex = '9999';
    document.body.appendChild(particleContainer);

    // Create fewer particles to reduce glitchiness
    const particleTypes = [
      { color: '#FFD700', size: '6px', shape: 'circle' },
      { color: '#4ECDC4', size: '8px', shape: 'circle' },
      { color: '#45B7D1', size: '4px', shape: 'circle' },
    ];

    // Create bursting particles (reduced from 50 to 20)
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
      
      particle.style.position = 'absolute';
      particle.style.width = type.size;
      particle.style.height = type.size;
      particle.style.backgroundColor = type.color;
      particle.style.borderRadius = '50%';
      particle.style.boxShadow = `0 0 6px ${type.color}`;
      particle.style.left = '50%';
      particle.style.top = '50%';
      particleContainer.appendChild(particle);

      const angle = (i / 20) * Math.PI * 2;
      const velocity = 10 + Math.random() * 5; // Reduced velocity
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity;

      particle.animate(
        [
          { 
            transform: 'translate(-50%, -50%) scale(1)', 
            opacity: 1,
            filter: 'blur(0px)'
          },
          {
            transform: `translate(${x * 40}px, ${y * 40}px) scale(0.5)`, // Simplified animation
            opacity: 0,
            filter: 'blur(1px)'
          },
        ],
        {
          duration: 1000, // Shorter duration
          easing: 'ease-out',
        }
      );
    }

    // Create floating text effects (removed "Outstanding!")
    const successTexts = ['Brilliant!', 'Excellent!', 'Amazing!', 'Perfect!'];
    const randomText = successTexts[Math.floor(Math.random() * successTexts.length)];
    
    const textElement = document.createElement('div');
    textElement.textContent = randomText;
    textElement.style.position = 'absolute';
    textElement.style.left = '50%';
    textElement.style.top = '50%';
    textElement.style.transform = 'translate(-50%, -50%)';
    textElement.style.fontSize = '1.5rem'; // Smaller text
    textElement.style.fontWeight = 'bold';
    textElement.style.color = '#FFD700';
    textElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    textElement.style.pointerEvents = 'none';
    particleContainer.appendChild(textElement);

    textElement.animate(
      [
        { 
          opacity: 0, 
          transform: 'translate(-50%, -50%) scale(0.8)', 
        },
        { 
          opacity: 1, 
          transform: 'translate(-50%, -60%) scale(1.1)', 
        },
        { 
          opacity: 0, 
          transform: 'translate(-50%, -70%) scale(0.9)', 
        }
      ],
      {
        duration: 1500, // Shorter duration
        easing: 'ease-out',
      }
    );

    setTimeout(() => {
      particleContainer.remove();
    }, 1800); // Shorter cleanup time
  };

  const handleAnswerSelect = async (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
  
    const isCorrect = answerIndex === selectedQuestion.correctAnswer;
  
    if (isCorrect) {
      createParticleEffect();
  
      // Update score synchronously using a callback
      setScore((prev) => {
        const newScore = prev + 1;
        handleQuizCompletion(newScore, true); // Pass the new score and win status
        return newScore;
      });
  
      const basePoints = 20;
      const streakBonus = Math.round(learningStreak * 1.1);
      const totalPoints = basePoints + streakBonus;
  
      addPoints(totalPoints);
      await updatePointsInBackend(balance + totalPoints);
    } else {
      setGamesPlayed((prev) => prev + 1);
      handleQuizCompletion(0, false); // Pass 0 as the score and win status as false
    }
  
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleQuizCompletion = async (score, win) => {
    try {
      const totalQuestions = 1; // Only 1 question per day
      const basePoints = 20;
      const streakBonus = Math.round(learningStreak * 1.1);
      const totalPoints = basePoints + streakBonus;
  
      // Send data to the backend
      const response = await api.post('/user/complete', {
        score,
        totalQuestions,
        points: win ? totalPoints : 0, // Only award points if the user won
        streak: win ? learningStreak + 1 : 0, // Reset streak if the user lost
        gamesPlayed: gamesPlayed + 1,
        win, // Pass the win status to the backend
      });
  
      // Update the frontend state based on the response
      setLearningStreak(response.data.streak); // Use the updated streak from the backend
      setHasCompletedDaily(true);
  
      // Show the appropriate toast
      if (win) {
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
                  {`${score}/${totalQuestions} correct • ${response.data.streak} day streak`}
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
    } catch (error) {
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

  const gradientBg = "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500";
  const cardBg = "bg-white bg-opacity-95 backdrop-blur-lg";
    if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden rounded-2xl">
        <FloatingElements />
        
        {/* Main loading animation */}
        <motion.div className="relative z-10">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.3, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 border-4 border-purple-400 border-t-transparent rounded-full shadow-2xl mb-6"
          />
          
          {/* Pulsing brain icon */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-purple-300" />
          </motion.div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-20 text-center"
        >
          <motion.p 
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-white text-xl font-medium"
          >
            Loading your fitness knowledge...
          </motion.p>
        </motion.div>

        {/* Orbiting dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.1
            }}
            className="absolute"
            style={{
              width: `${120 + i * 20}px`,
              height: `${120 + i * 20}px`,
              border: '2px solid transparent',
              borderTop: `2px solid rgba(168, 85, 247, ${0.8 - i * 0.1})`,
              borderRadius: '50%',
            }}
          />
        ))}
      </div>
    );
  }
  if (hasCompletedDaily) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`text-center py-16 ${gradientBg} min-h-[600px] rounded-2xl text-white relative overflow-hidden`}
      >
        <FloatingElements />
        
        {/* Success animation with multiple elements */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2
          }}
          className="relative z-10"
        >
          <motion.div
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            className="relative"
          >
            <Award className="w-28 h-28 mx-auto text-yellow-300 mb-6 drop-shadow-2xl" />
            
            {/* Rotating glow effect */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-32 h-32 mx-auto"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-r from-yellow-300 via-transparent to-yellow-300 opacity-30 blur-md" />
            </motion.div>
            
            {/* Sparkle effects around the award */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: "easeInOut"
                }}
                className="absolute"
                style={{
                  left: `${50 + 25 * Math.cos(i * Math.PI / 4)}%`,
                  top: `${50 + 25 * Math.sin(i * Math.PI / 4)}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <Star className="w-4 h-4 text-yellow-200" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        
        <motion.h2 
          variants={itemVariants}
          className="text-5xl font-bold mb-6 relative z-10"
        >
          <motion.span
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent"
            style={{
              backgroundSize: '200% 100%'
            }}
          >
            Daily Learning Complete!
          </motion.span>
        </motion.h2>
        
        <motion.div
          variants={itemVariants}
          className="relative z-10"
        >
          <motion.p 
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-2xl text-purple-200 mb-8 flex items-center justify-center gap-3"
          >
            You're on a 
            <motion.span
              animate={{
                color: ['#FCD34D', '#F97316', '#EF4444', '#F97316', '#FCD34D']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="font-bold text-3xl"
            >
              {learningStreak}
            </motion.span>
            day learning streak! 
            <motion.span
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 15, -15, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🔥
            </motion.span>
          </motion.p>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }}
          className="bg-white bg-opacity-15 p-8 rounded-3xl inline-block backdrop-blur-lg border border-white border-opacity-20 relative z-10"
        >
          <motion.div
            animate={{
              rotate: [0, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Clock className="w-12 h-12 mx-auto text-purple-300 mb-4" />
          </motion.div>
          <p className="text-xl text-purple-200">
            New knowledge available in 
            <motion.span
              animate={{
                color: ['#DDD6FE', '#C4B5FD', '#A78BFA', '#C4B5FD', '#DDD6FE']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="font-bold"
            >
              {timeUntilReset()}
            </motion.span>
          </p>
        </motion.div>

        {/* Floating achievement badges */}
        <div className="absolute inset-0 pointer-events-none">
          {[Trophy, Target, Flame].map((Icon, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5
              }}
              className="absolute"
              style={{
                left: `${20 + i * 30}%`,
                top: `${20 + i * 10}%`
              }}
            >
              <Icon className="w-8 h-8 text-yellow-300 opacity-40" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }
  return (
    <div className={`max-w-4xl mx-auto p-4 ${gradientBg} rounded-2xl min-h-[600px] relative overflow-hidden`}>
      <FloatingElements />
      
      <AnimatePresence mode="wait">
        {!showQuiz ? (
          <motion.div
            key="learning"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`${cardBg} rounded-2xl shadow-2xl p-8 mb-8 relative z-10 border border-white border-opacity-20`}
          >
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Book className="w-10 h-10 text-indigo-600" />
                </motion.div>
                <motion.h2 
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                  style={{ backgroundSize: '200% 100%' }}
                >
                  {selectedQuestion.mainTopic.title}
                </motion.h2>
              </div>
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-medium shadow-lg border border-indigo-200"
              >
                {selectedQuestion.mainTopic.category}
              </motion.span>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="prose max-w-none mb-8"
            >
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-lg text-gray-700 leading-relaxed"
              >
                {selectedQuestion.mainTopic.content}
              </motion.p>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 mb-8 shadow-inner border border-indigo-100"
            >
              <h3 className="font-bold text-xl mb-6 text-indigo-900 flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Target className="w-6 h-6" />
                </motion.div>
                Key Points to Remember
              </h3>
              <ul className="space-y-4">
                {selectedQuestion.mainTopic.keyPoints.map((point, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 + 0.5 }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 8px 25px -8px rgba(0,0,0,0.1)"
                    }}
                    className="flex items-center space-x-4 bg-white bg-opacity-70 p-5 rounded-lg shadow-sm border border-white"
                  >                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.3
                      }}
                    >
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    </motion.div>
                    <span className="text-gray-800">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 shadow-inner border border-purple-100"
            >
              <h3 className="font-bold text-xl mb-6 text-purple-900 flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="w-6 h-6" />
                </motion.div>
                Visual Cues
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedQuestion.mainTopic.visualCues.map((cue, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 + 0.7 }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 15px 35px -10px rgba(0,0,0,0.1)",
                      y: -5
                    }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-white relative overflow-hidden"
                  >
                    {/* Animated background effect */}
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.1, 0.2, 0.1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5
                      }}
                      className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl"
                    />
                    <div className="flex items-center space-x-4 relative z-10">
                      <motion.div
                        animate={{
                          rotate: [0, 15, -15, 0]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.2
                        }}
                      >
                        <Clock className="w-6 h-6 text-purple-500" />
                      </motion.div>
                      <span className="text-gray-700 font-medium">{cue}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.button
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 20px 40px -10px rgba(99, 102, 241, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-xl font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 relative overflow-hidden"
              onClick={() => setShowQuiz(true)}
            >
              {/* Animated background shimmer */}
              <motion.div
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-transparent opacity-20"
                style={{ skewX: '-20deg' }}
              />
              <span className="relative z-10 flex items-center justify-center gap-3">
                Test Your Knowledge
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </span>
            </motion.button>
          </motion.div>
        ) : (          <motion.div
            key="quiz"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`${cardBg} rounded-2xl shadow-2xl p-8 relative z-10 border border-white border-opacity-20`}
          >
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center justify-between mb-8">
                <motion.h3 
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                  style={{ backgroundSize: '200% 100%' }}
                >
                  Question 1 of 1
                </motion.h3>
                <motion.div 
                  variants={pulseVariants}
                  initial="initial"
                  animate="animate"
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center space-x-3 bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-3 rounded-full shadow-lg border border-indigo-200 relative overflow-hidden"
                >
                  {/* Animated background */}
                  <motion.div
                    animate={{
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-indigo-200 via-transparent to-purple-200 opacity-30"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 15, -15, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Brain className="w-6 h-6 text-indigo-600 relative z-10" />
                  </motion.div>
                  <span className="font-medium text-indigo-900 relative z-10">{score} correct</span>
                </motion.div>
              </div>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl mb-8 text-gray-800 font-medium leading-relaxed"
              >
                {selectedQuestion.question}
              </motion.p>

              <div className="space-y-4">
                {selectedQuestion.answers.map((answer, index) => (
                  <motion.button
                    key={index}
                    variants={itemVariants}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    whileHover={{ 
                      scale: selectedAnswer === null ? 1.02 : 1,
                      boxShadow: selectedAnswer === null ? "0 10px 30px -10px rgba(0,0,0,0.1)" : "none"
                    }}
                    whileTap={{ scale: selectedAnswer === null ? 0.98 : 1 }}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-6 rounded-xl text-left transition-all duration-500 relative overflow-hidden ${
                      selectedAnswer === null
                        ? 'hover:bg-indigo-50 bg-gray-50 cursor-pointer'
                        : index === selectedQuestion.correctAnswer
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500'
                        : selectedAnswer === index
                        ? 'bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-500'
                        : 'bg-gray-50'
                    }`}
                  >
                    {/* Animated background shimmer for correct answers */}
                    {selectedAnswer !== null && index === selectedQuestion.correctAnswer && (
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-green-300 via-transparent opacity-30"
                      />
                    )}
                    
                    <div className="flex items-center space-x-4 relative z-10">
                      <motion.div 
                        animate={selectedAnswer !== null && index === selectedQuestion.correctAnswer ? {
                          scale: [1, 1.3, 1],
                          rotate: [0, 360, 720]
                        } : {}}
                        transition={{
                          duration: 1,
                          ease: "easeInOut"
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md ${
                          selectedAnswer === null
                            ? 'bg-indigo-100 text-indigo-600'
                            : index === selectedQuestion.correctAnswer
                            ? 'bg-green-200 text-green-700'
                            : selectedAnswer === index
                            ? 'bg-red-200 text-red-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {selectedAnswer !== null && index === selectedQuestion.correctAnswer ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <CheckCircle className="w-6 h-6" />
                          </motion.div>
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </motion.div>
                      <span className="text-lg">{answer}</span>
                      
                      {/* Success particle effect for correct answer */}
                      {selectedAnswer !== null && index === selectedQuestion.correctAnswer && (
                        <div className="absolute right-4">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ 
                                scale: [0, 1, 0],
                                opacity: [0, 1, 0],
                                x: [0, 20 * Math.cos(i * 72 * Math.PI / 180)],
                                y: [0, 20 * Math.sin(i * 72 * Math.PI / 180)]
                              }}
                              transition={{
                                duration: 1,
                                delay: i * 0.1 + 0.3,
                                ease: "easeOut"
                              }}
                              className="absolute"
                            >
                              <Star className="w-4 h-4 text-yellow-400" />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
            
            {/* Floating quiz icons */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[Brain, Target, Zap].map((Icon, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.7
                  }}
                  className="absolute"
                  style={{
                    right: `${10 + i * 15}%`,
                    top: `${15 + i * 20}%`
                  }}
                >
                  <Icon className="w-6 h-6 text-purple-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryGame;