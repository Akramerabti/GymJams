// server/src/services/goal.service.js
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

class GoalService {
  // Generate initial goals based on questionnaire
  async generateInitialGoals(subscriptionId, questionnaireData) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get existing goals or initialize
      const existingGoals = subscription.goals || [];

      // Only generate if no goals exist yet
      if (existingGoals.length === 0) {
        const goals = [];
        
        // Generate goals based on questionnaire data
        if (questionnaireData.goals) {
          const userGoals = Array.isArray(questionnaireData.goals) 
            ? questionnaireData.goals 
            : [];

          if (userGoals.includes('strength')) {
            goals.push({
              id: `strength-${Date.now()}`,
              title: 'Strength Improvement',
              type: 'strength',
              target: 'Increase bench press by 10%',
              difficulty: 'medium',
              dueDate: this._getFutureDate(28), // 4 weeks
              due: this._formatDate(this._getFutureDate(28)),
              addedAt: new Date().toISOString(),
              createdBy: 'system',
              status: 'active', // active, submitted, approved, rejected
              progress: 0,
              completed: false
            });
          }

          if (userGoals.includes('endurance')) {
            goals.push({
              id: `endurance-${Date.now()}`,
              title: 'Endurance Improvement',
              type: 'cardio',
              target: 'Increase cardio capacity by 15%',
              difficulty: 'medium',
              dueDate: this._getFutureDate(42), // 6 weeks
              due: this._formatDate(this._getFutureDate(42)),
              addedAt: new Date().toISOString(),
              createdBy: 'system',
              status: 'active',
              progress: 0,
              completed: false
            });
          }

          if (userGoals.includes('weight')) {
            goals.push({
              id: `weight-${Date.now()}`,
              title: 'Weight Management',
              type: 'weight',
              target: 'Lose 5% body fat',
              difficulty: 'hard',
              dueDate: this._getFutureDate(56), // 8 weeks
              due: this._formatDate(this._getFutureDate(56)),
              addedAt: new Date().toISOString(),
              createdBy: 'system',
              status: 'active',
              progress: 0,
              completed: false
            });
          }
        }

        // Add default consistency goal regardless of questionnaire
        goals.push({
          id: `consistency-${Date.now()}`,
          title: 'Workout Consistency',
          type: 'consistency',
          target: `${questionnaireData.frequency || 3} workouts per week`,
          difficulty: 'easy',
          dueDate: this._getFutureDate(14), // 2 weeks
          due: this._formatDate(this._getFutureDate(14)),
          addedAt: new Date().toISOString(),
          createdBy: 'system',
          status: 'active',
          progress: 0,
          completed: false
        });

        // Update subscription with generated goals
        subscription.goals = goals;
        await subscription.save();
        
        return goals;
      }
      
      return existingGoals;
    } catch (error) {
      logger.error('Error generating initial goals:', error);
      throw error;
    }
  }

  // Add a new goal to a subscription
  async addGoal(subscriptionId, goalData, coachId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Check weekly limit (2 goals per week)
      const currentWeekGoals = (subscription.goals || []).filter(g => {
        if (g.completed) return false;
        
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
        endOfWeek.setHours(23, 59, 59, 999);
        
        const goalDate = new Date(g.addedAt || new Date());
        return goalDate >= startOfWeek && goalDate <= endOfWeek;
      });
      
      if (currentWeekGoals.length >= 2) {
        throw new Error('Weekly limit of 2 goals reached');
      }

      // Prepare the new goal
      const newGoal = {
        ...goalData,
        addedAt: new Date().toISOString(),
        createdBy: coachId,
        status: 'active',
        progress: 0,
        completed: false
      };
      
      // Add the goal to subscription
      subscription.goals = [...(subscription.goals || []), newGoal];
      await subscription.save();
      
      return newGoal;
    } catch (error) {
      logger.error('Error adding goal:', error);
      throw error;
    }
  }

  // Update an existing goal
  async updateGoal(subscriptionId, goalId, updatedData) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Find the goal index
      const goalIndex = subscription.goals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) {
        throw new Error('Goal not found');
      }
      
      // Update the goal
      subscription.goals[goalIndex] = {
        ...subscription.goals[goalIndex],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      
      // Save changes
      await subscription.save();
      
      return subscription.goals[goalIndex];
    } catch (error) {
      logger.error('Error updating goal:', error);
      throw error;
    }
  }

  // Delete a goal
  async deleteGoal(subscriptionId, goalId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Remove the goal
      subscription.goals = subscription.goals.filter(g => g.id !== goalId);
      
      // Save changes
      await subscription.save();
      
      return { success: true };
    } catch (error) {
      logger.error('Error deleting goal:', error);
      throw error;
    }
  }

  // Client submits goal for review
  async submitGoalForReview(subscriptionId, goalId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Find the goal
      const goalIndex = subscription.goals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) {
        throw new Error('Goal not found');
      }
      
      const goal = subscription.goals[goalIndex];
      
      // Check if goal is already completed or submitted
      if (goal.completed) {
        throw new Error('Goal is already completed');
      }
      
      if (goal.status === 'submitted') {
        throw new Error('Goal is already submitted for review');
      }
      
      // Update goal status
      subscription.goals[goalIndex] = {
        ...goal,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        progress: 100 // Set progress to 100%
      };
      
      // Save changes
      await subscription.save();
      
      return subscription.goals[goalIndex];
    } catch (error) {
      logger.error('Error submitting goal for review:', error);
      throw error;
    }
  }

  // Coach approves goal completion
  async approveGoal(subscriptionId, goalId, coachId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Find the goal
      const goalIndex = subscription.goals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) {
        throw new Error('Goal not found');
      }
      
      const goal = subscription.goals[goalIndex];
      
      // Check if goal is already completed
      if (goal.completed) {
        throw new Error('Goal is already completed');
      }
      
      // Check if goal is submitted for review
      if (goal.status !== 'submitted') {
        throw new Error('Goal must be submitted for review before approval');
      }
      
      // Get the difficulty and corresponding points
      const difficulty = goal.difficulty || 'medium';
      const pointsToAward = {
        easy: 50,
        medium: 100,
        hard: 200
      }[difficulty] || 100;
      
      // Update goal status
      subscription.goals[goalIndex] = {
        ...goal,
        status: 'approved',
        completed: true,
        completedDate: new Date().toISOString(),
        approvedBy: coachId,
        progress: 100
      };
      
      // Update stats
      subscription.stats = {
        ...subscription.stats,
        goalsAchieved: (subscription.stats?.goalsAchieved || 0) + 1
      };
      
      // Save changes
      await subscription.save();
      
      // Award points to the user if available
      if (subscription.user) {
        try {
          const user = await User.findById(subscription.user);
          if (user) {
            user.points = (user.points || 0) + pointsToAward;
            await user.save();
          }
        } catch (pointsError) {
          logger.error('Error awarding points to user:', pointsError);
          // Continue even if points award fails
        }
      }
      
      return {
        goal: subscription.goals[goalIndex],
        pointsAwarded: pointsToAward
      };
    } catch (error) {
      logger.error('Error approving goal:', error);
      throw error;
    }
  }

  // Coach rejects goal completion
  async rejectGoal(subscriptionId, goalId, reason) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      // Find the goal
      const goalIndex = subscription.goals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) {
        throw new Error('Goal not found');
      }
      
      const goal = subscription.goals[goalIndex];
      
      // Check if goal is already completed
      if (goal.completed) {
        throw new Error('Goal is already completed');
      }
      
      // Check if goal is submitted for review
      if (goal.status !== 'submitted') {
        throw new Error('Goal must be submitted for review before rejection');
      }
      
      // Update goal status
      subscription.goals[goalIndex] = {
        ...goal,
        status: 'rejected',
        progress: Math.max(0, Math.min(90, goal.progress)), // Cap at 90% if rejected
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || 'Goal requirements not met'
      };
      
      // Save changes
      await subscription.save();
      
      return subscription.goals[goalIndex];
    } catch (error) {
      logger.error('Error rejecting goal:', error);
      throw error;
    }
  }

  // Get all goals for a subscription
  async getGoals(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
      
      return subscription.goals || [];
    } catch (error) {
      logger.error('Error getting goals:', error);
      throw error;
    }
  }

  // Helper methods
  _getFutureDate(daysToAdd) {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString();
  }

  _formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

export default new GoalService();