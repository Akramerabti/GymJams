// utils/subscriptionEnhancements.js
export const subscriptionEnhancements = {
    basic: {
      maxMetrics: 4,
      maxWorkouts: 3,
      features: ['Basic progress tracking', 'Weekly workout plans', 'Limited goal setting']
    },
    premium: {
      maxMetrics: 8,
      maxWorkouts: 5,
      features: [
        'Advanced progress tracking', 
        'Customized workout plans', 
        'Comprehensive goal setting',
        'Nutrition tracking',
        'Weekly check-ins'
      ],
      nutritionData: {
        macroTargets: {
          protein: { value: Math.floor(120 + Math.random() * 40), unit: 'g' },
          carbs: { value: Math.floor(180 + Math.random() * 60), unit: 'g' },
          fat: { value: Math.floor(50 + Math.random() * 30), unit: 'g' }
        },
        mealPlan: {
          customized: true,
          lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
          adherenceRate: Math.floor(65 + Math.random() * 25)
        },
        supplements: ['Protein powder', 'Creatine', 'BCAAs'].slice(0, Math.floor(Math.random() * 3) + 1)
      },
      advancedGoals: [
        {
          id: `goal-${Date.now()}-1`,
          type: 'strength',
          name: 'Strength goal',
          description: 'Increase bench press by 20kg',
          startValue: Math.floor(60 + Math.random() * 40),
          currentValue: Math.floor(70 + Math.random() * 40),
          targetValue: Math.floor(90 + Math.random() * 40),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          checkpoints: [
            { date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), value: Math.floor(75 + Math.random() * 5) },
            { date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), value: Math.floor(85 + Math.random() * 5) }
          ]
        },
        {
          id: `goal-${Date.now()}-2`,
          type: 'endurance',
          name: 'Cardio goal',
          description: 'Run 10km under 50 minutes',
          startValue: Math.floor(60 + Math.random() * 10),
          currentValue: Math.floor(50 + Math.random() * 5),
          targetValue: 45,
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          checkpoints: [
            { date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), value: 55 },
            { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), value: 50 }
          ]
        }
      ]
    },
    elite: {
      maxMetrics: 12,
      maxWorkouts: 7,
      features: [
        'Advanced progress tracking', 
        'Customized workout plans', 
        'Comprehensive goal setting',
        'Nutrition tracking',
        'Weekly check-ins',
        'Monthly physique analysis',
        'Blood work & hormone analysis',
        'Recovery tracking',
        'Sleep quality monitoring',
        'Unlimited coach messaging'
      ],
      nutritionData: {
        macroTargets: {
          protein: { value: Math.floor(150 + Math.random() * 50), unit: 'g' },
          carbs: { value: Math.floor(220 + Math.random() * 80), unit: 'g' },
          fat: { value: Math.floor(60 + Math.random() * 30), unit: 'g' }
        },
        mealPlan: {
          customized: true,
          lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)),
          adherenceRate: Math.floor(75 + Math.random() * 20)
        },
        supplements: ['Protein powder', 'Creatine', 'BCAAs', 'Pre-workout', 'Multivitamin', 'Fish oil'].slice(0, Math.floor(Math.random() * 5) + 2),
        calories: {
          target: Math.floor(2200 + Math.random() * 500),
          actual: Math.floor(2100 + Math.random() * 500)
        },
        waterIntake: {
          target: 3.5 + Math.random() * 0.5,
          actual: 3 + Math.random() * 1
        }
      },
      advancedGoals: [
        {
          id: `goal-${Date.now()}-1`,
          type: 'strength',
          name: 'Strength goal',
          description: 'Increase bench press by 25kg',
          startValue: Math.floor(70 + Math.random() * 40),
          currentValue: Math.floor(80 + Math.random() * 40),
          targetValue: Math.floor(100 + Math.random() * 40),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          checkpoints: [
            { date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), value: Math.floor(85 + Math.random() * 5) },
            { date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), value: Math.floor(95 + Math.random() * 5) }
          ]
        },
        {
          id: `goal-${Date.now()}-2`,
          type: 'endurance',
          name: 'Cardio goal',
          description: 'Run 10km under 45 minutes',
          startValue: Math.floor(55 + Math.random() * 10),
          currentValue: Math.floor(48 + Math.random() * 5),
          targetValue: 40,
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          checkpoints: [
            { date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), value: 50 },
            { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), value: 45 }
          ]
        },
        {
          id: `goal-${Date.now()}-3`,
          type: 'body_composition',
          name: 'Body composition goal',
          description: 'Reduce body fat percentage to 12%',
          startValue: Math.floor(18 + Math.random() * 5),
          currentValue: Math.floor(15 + Math.random() * 3),
          targetValue: 12,
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          checkpoints: [
            { date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), value: 16 },
            { date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), value: 14 }
          ]
        }
      ],
      recoveryMetrics: {
        sleepQuality: {
          average: Math.floor(70 + Math.random() * 20),
          trend: Math.random() > 0.5 ? 'improving' : 'stable',
          latestRecords: Array.from({ length: 7 }).map((_, i) => ({
            date: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000),
            hours: 6 + Math.random() * 2,
            quality: Math.floor(60 + Math.random() * 30)
          }))
        },
        soreness: {
          current: Math.floor(Math.random() * 8) + 1,
          affected_areas: ['Shoulders', 'Lower back', 'Quads'].slice(0, Math.floor(Math.random() * 3) + 1)
        },
        restDays: {
          recommended: Math.floor(Math.random() * 2) + 1,
          taken: Math.floor(Math.random() * 2)
        },
        hrv: {
          current: Math.floor(50 + Math.random() * 20),
          baseline: Math.floor(55 + Math.random() * 15),
          trend: Math.random() > 0.5 ? 'improving' : 'stable'
        }
      },
      physiqueAssessments: [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          weight: 75 + Math.random() * 10,
          bodyFat: 15 + Math.random() * 5,
          measurements: {
            chest: 100 + Math.random() * 10,
            waist: 80 + Math.random() * 10,
            hips: 95 + Math.random() * 10,
            thighs: 55 + Math.random() * 8,
            arms: 35 + Math.random() * 5
          },
          photos: ['front', 'side', 'back'],
          notes: 'Good progress overall, focus on lower body development'
        },
        {
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          weight: 78 + Math.random() * 10,
          bodyFat: 16 + Math.random() * 5,
          measurements: {
            chest: 98 + Math.random() * 10,
            waist: 82 + Math.random() * 10,
            hips: 96 + Math.random() * 10,
            thighs: 54 + Math.random() * 8,
            arms: 34 + Math.random() * 5
          },
          photos: ['front', 'side', 'back'],
          notes: 'Initial assessment, good starting point'
        }
      ]
    }
  };

export const generateFitnessSummary= (questionnaire) => {
    let summary = '';
  
    // Experience level
    if (questionnaire.experience === 'beginner') {
      summary += 'New to fitness. ';
    } else if (questionnaire.experience === 'intermediate') {
      summary += 'Moderately experienced. ';
    } else if (questionnaire.experience === 'advanced') {
      summary += 'Experienced fitness enthusiast. ';
    }
  
    // Equipment access
    if (questionnaire.equipment) {
      summary += 'Has access to equipment. ';
    } else {
      summary += 'Limited/no equipment. ';
    }
  
    // Time commitment
    const frequency = questionnaire.frequency || 0;
    if (frequency <= 2) {
      summary += 'Limited time availability. ';
    } else if (frequency >= 5) {
      summary += 'High time commitment. ';
    } else {
      summary += 'Moderate time commitment. ';
    }
  
    // Sleep habits
    const sleep = questionnaire.sleep || 0;
    if (sleep < 6) {
      summary += 'Sleep-deprived. ';
    } else if (sleep >= 8) {
      summary += 'Well-rested. ';
    }
  
    // Energy level
    const energy = questionnaire.energy || 0;
    if (energy <= 3) {
      summary += 'Low energy. ';
    } else if (energy >= 8) {
      summary += 'High energy. ';
    }
  
    return summary.trim();
  }

  export const determineFitnessLevel=(questionnaire)=> {
    const experience = questionnaire.experience || '';
    
    if (experience === 'advanced') {
      return 'advanced';
    } else if (experience === 'intermediate') {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }
  
  export const calculateLifestyleScore=(questionnaire)=> {
    let score = 0;
    
    // Sleep quality (0-25 points)
    const sleep = questionnaire.sleep || 0;
    score += Math.min(25, (sleep / 9) * 25);
    
    // Energy level (0-20 points)
    const energy = questionnaire.energy || 0;
    score += Math.min(20, (energy / 10) * 20);
    
    // Nutrition (0-20 points)
    const nutrition = questionnaire.nutrition || '';
    if (nutrition === 'strict') {
      score += 20;
    } else if (nutrition === 'moderate') {
      score += 15;
    } else if (nutrition === 'flexible') {
      score += 10;
    } else if (nutrition === 'improving') {
      score += 5;
    }
    
    // Stress management (0-20 points)
    const stressManagement = questionnaire.stress || [];
    score += Math.min(20, stressManagement.length * 5);
    
    // Workout frequency (0-15 points)
    const frequency = questionnaire.frequency || 0;
    score += Math.min(15, frequency * 3);
    
    return Math.round(score);
  }
  
  export const determinePreferredSchedule=(questionnaire)=> {
    const preferredTimes = questionnaire.timeOfDay || [];
    const frequency = questionnaire.frequency || 3;
    
    // Default schedule
    let schedule = {
      daysPerWeek: frequency,
      timeOfDay: preferredTimes.length > 0 ? preferredTimes : ['morning'],
      duration: '45-60 min'
    };
    
    // Adjust duration based on experience
    if (questionnaire.experience === 'advanced') {
      schedule.duration = '60-90 min';
    } else if (questionnaire.experience === 'beginner') {
      schedule.duration = '30-45 min';
    }
    
    return schedule;
  }
  
  export const assessAdherenceRisk=(questionnaire)=> {
    let riskFactors = 0;
    
    // Low frequency commitment
    if ((questionnaire.frequency || 0) <= 2) riskFactors++;
    
    // Low energy
    if ((questionnaire.energy || 0) <= 4) riskFactors++;
    
    // Poor sleep
    if ((questionnaire.sleep || 0) < 6) riskFactors++;
    
    // Few stress management techniques
    if (!(questionnaire.stress || []).length) riskFactors++;
    
    // Low motivation factors
    if (!(questionnaire.motivation || []).length) riskFactors++;
    
    if (riskFactors >= 4) return 'high';
    if (riskFactors >= 2) return 'medium';
    return 'low';
  }
  
  export const createNutritionProfile=(questionnaire)=>{
    const nutrition = questionnaire.nutrition || '';
    
    let profile = {
      type: nutrition || 'moderate',
      needsGuidance: nutrition === 'improving' || !nutrition,
      recommendations: []
    };
    
    // Add recommendations based on questionnaire data
    if (nutrition === 'improving' || !nutrition) {
      profile.recommendations.push('Basic nutrition education');
      profile.recommendations.push('Meal planning assistance');
    }
    
    if ((questionnaire.energy || 0) <= 5) {
      profile.recommendations.push('Focus on energy-boosting nutrients');
    }
    
    if ((questionnaire.sleep || 0) < 7) {
      profile.recommendations.push('Sleep-supporting nutrition strategies');
    }
    
    return profile;
  }
  
  export const getRecommendedWorkoutTypes=(questionnaire)=> {
    const recommendations = [];
    const goals = questionnaire.goals || [];
    const experience = questionnaire.experience || 'beginner';
    const hasEquipment = questionnaire.equipment || false;
    const energy = questionnaire.energy || 5;
    
    // Base recommendations on goals
    if (goals.includes('strength')) {
      recommendations.push('Strength Training');
    }
    
    if (goals.includes('weight')) {
      recommendations.push('HIIT');
      recommendations.push('Cardio');
    }
    
    if (goals.includes('endurance')) {
      recommendations.push('Cardio');
      recommendations.push('Circuit Training');
    }
    
    if (goals.includes('flexibility')) {
      recommendations.push('Yoga');
      recommendations.push('Mobility Work');
    }
    
    // Adjust for equipment availability
    if (!hasEquipment) {
      recommendations.push('Bodyweight Exercises');
    }
    
    // Adjust for energy levels
    if (energy <= 4) {
      recommendations.push('Low-Impact Workouts');
    }
    
    // Adjust for experience
    if (experience === 'beginner') {
      recommendations.push('Fundamental Movement Patterns');
    }
    
    // Return unique recommendations
    return [...new Set(recommendations)];
  }