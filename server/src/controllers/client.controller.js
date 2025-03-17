// server/src/controllers/client.controller.js
import User from '../models/User.js';
import Session from '../models/Session.js'
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

export const getCoachClients = async (req, res) => {
  try {
    // Ensure the user is a coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can access client data' });
    }

    // Find all subscriptions where this coach is assigned
    const subscriptions = await Subscription.find({ 
      assignedCoach: req.user.id,
      status: 'active'
    }).populate('user', 'firstName lastName email profileImage');

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json([]);
    }

    // Get all sessions for this coach to find upcoming sessions for each client
    const sessions = await Session.find({ 
      coachId: req.user.id,
      date: { $gte: new Date().toISOString().split('T')[0] } // Only future sessions
    }).sort({ date: 1, time: 1 });

    // Group sessions by client (subscription) ID
    const clientSessions = {};
    sessions.forEach(session => {
      const subId = session.subscription.toString();
      if (!clientSessions[subId]) {
        clientSessions[subId] = [];
      }
      clientSessions[subId].push(session);
    });

    // Calculate current date for various time-based operations
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Format client data from subscriptions with enhanced calculations
    const clients = await Promise.all(subscriptions.map(async (subscription) => {
      // Get questionnaire data and transform it into useful information
      const questionnaire = subscription.questionnaireData ? 
        Object.fromEntries(subscription.questionnaireData) : 
        {};
      
      // Process questionnaire data
      const fitnessSummary = generateFitnessSummary(questionnaire);
      const fitnessLevel = determineFitnessLevel(questionnaire);
      const lifestyleScore = calculateLifestyleScore(questionnaire);
      const preferredSchedule = determinePreferredSchedule(questionnaire);
      const adherenceRisk = assessAdherenceRisk(questionnaire);
      const nutritionProfile = createNutritionProfile(questionnaire);
      const recommendedWorkoutTypes = getRecommendedWorkoutTypes(questionnaire);
      
      // Calculate monthly progress based on completed workouts relative to target
      const workoutsCompleted = subscription.stats?.workoutsCompleted || 0;
      
      // Use questionnaire frequency data to inform workout targets
      const userFrequency = questionnaire.frequency || 3;
      const weeklyTarget = subscription.stats?.weeklyTarget || userFrequency;
      const monthlyTarget = weeklyTarget * 4; // Approximate monthly target
      
      // Calculate days in current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysPassed = Math.min(now.getDate(), daysInMonth);
      const expectedProgress = (daysPassed / daysInMonth) * monthlyTarget;
      
      // Calculate monthly progress as percentage of expected progress
      let monthlyProgress = expectedProgress > 0 
        ? Math.min(100, Math.round((workoutsCompleted / expectedProgress) * 100)) 
        : 0;
      
      // If custom progress tracking exists in the subscription, use that instead
      if (typeof subscription.stats?.monthlyProgress === 'number') {
        monthlyProgress = subscription.stats.monthlyProgress;
      }

      // Find the next session for this client
      const nextSession = clientSessions[subscription._id.toString()]?.[0];
      const nextSessionDate = nextSession 
        ? `${nextSession.date} ${nextSession.time}` 
        : null;

      // Count unread messages for the coach
      const unreadMessages = subscription.messages?.filter(m => 
        !m.read && m.sender.toString() !== req.user.id
      ).length || 0;

      // Get the last active time (last login or last message, whichever is more recent)
      const lastMessageTime = subscription.lastMessageTime || null;
      const lastLogin = subscription.lastLogin || subscription.lastUpdated || subscription.updatedAt || null;
      
      let lastActive;
      if (lastMessageTime && lastLogin) {
        lastActive = new Date(lastMessageTime) > new Date(lastLogin) ? lastMessageTime : lastLogin;
      } else {
        lastActive = lastMessageTime || lastLogin || subscription.startDate;
      }

      // Format last active time in a user-friendly way
      const lastActiveDate = new Date(lastActive);
      const timeDiff = now - lastActiveDate;
      const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      
      let lastActiveFormatted;
      if (dayDiff === 0) {
        const hourDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        if (hourDiff === 0) {
          const minuteDiff = Math.floor(timeDiff / (1000 * 60));
          lastActiveFormatted = minuteDiff <= 1 ? 'Just now' : `${minuteDiff} min ago`;
        } else {
          lastActiveFormatted = `${hourDiff} hr ago`;
        }
      } else if (dayDiff === 1) {
        lastActiveFormatted = 'Yesterday';
      } else if (dayDiff < 7) {
        lastActiveFormatted = `${dayDiff} days ago`;
      } else {
        lastActiveFormatted = lastActiveDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }

      // Count completed workouts in the past week to determine activity level
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      
      // Check workouts array first
      const recentWorkouts = subscription.workouts?.filter(workout => {
        if (!workout.completed) return false;
        try {
          const completedDate = workout.completedDate || new Date(workout.date);
          return completedDate >= oneWeekAgo;
        } catch (e) {
          return false;
        }
      }).length || 0;

      // Determine client activity status
      let activityStatus = 'active';
      if (dayDiff > 14) {
        activityStatus = 'inactive';
      } else if (recentWorkouts === 0 && dayDiff > 7) {
        activityStatus = 'paused';
      }

      // Return enhanced client object
      return {
        id: subscription._id,
        userId: subscription.user?._id || null,
        firstName: subscription.user?.firstName || 'Guest',
        lastName: subscription.user?.lastName || '',
        email: subscription.user?.email || subscription.guestEmail || 'No email',
        profileImage: subscription.user?.profileImage || null,
        lastActive: lastActiveFormatted,
        lastActiveRaw: lastActive, // Raw timestamp for sorting
        joinDate: subscription.startDate,
        subscription: subscription.subscription,
        subscriptionType: subscription.subscription.charAt(0).toUpperCase() + subscription.subscription.slice(1),
        subscriptionEndDate: subscription.currentPeriodEnd,
        stats: {
          ...subscription.stats,
          monthlyProgress,
          workoutsCompleted: subscription.stats?.workoutsCompleted || 0,
          currentStreak: subscription.stats?.currentStreak || 0,
          goalsAchieved: subscription.stats?.goalsAchieved || 0,
          weeklyTarget: weeklyTarget,
          nutritionCompliance: subscription.stats?.nutritionCompliance || 0,
          recentWorkouts, // New field: workouts in past week
          lifestyleScore,
          fitnessLevel,
          adherenceRisk
        },
        fitnessProfile: {
          summary: fitnessSummary,
          level: fitnessLevel,
          goals: Array.isArray(questionnaire.goals) ? questionnaire.goals : [],
          experience: questionnaire.experience || 'beginner',
          frequency: questionnaire.frequency || 3,
          hasEquipment: questionnaire.equipment || false,
          preferredTimes: Array.isArray(questionnaire.timeOfDay) ? questionnaire.timeOfDay : [],
          energyLevel: questionnaire.energy || 5,
          sleepHours: questionnaire.sleep || 7,
          stressManagement: Array.isArray(questionnaire.stress) ? questionnaire.stress : [],
          nutritionHabits: questionnaire.nutrition || 'moderate',
          motivationFactors: Array.isArray(questionnaire.motivation) ? questionnaire.motivation : [],
          recommendedWorkouts: recommendedWorkoutTypes,
          preferredSchedule,
          nutritionProfile
        },
        notes: subscription.coachNotes || '',
        workouts: subscription.workouts || [],
        progress: subscription.progress || null,
        status: activityStatus, // Enhanced status based on activity
        nextSession: nextSessionDate,
        nextSessionDetails: nextSession ? {
          id: nextSession._id,
          date: nextSession.date,
          time: nextSession.time,
          type: nextSession.sessionType,
          duration: nextSession.duration || '60 minutes'
        } : null,
        unreadMessages,
        totalMessages: subscription.messages?.length || 0,
        hasQuestionnaireCompleted: subscription.hasCompletedQuestionnaire,
        questionnaireData: questionnaire,
      };
    }));

    // Sort clients by last active (most recent first)
    clients.sort((a, b) => new Date(b.lastActiveRaw) - new Date(a.lastActiveRaw));

    res.status(200).json(clients);
  } catch (error) {
    logger.error('Error fetching coach clients:', error);
    res.status(500).json({ error: 'Failed to fetch client data' });
  }
};

// Helper functions to process questionnaire data

// Generate a summary of fitness profile
function generateFitnessSummary(questionnaire) {
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

function determineFitnessLevel(questionnaire) {
  const experience = questionnaire.experience || '';
  
  if (experience === 'advanced') {
    return 'advanced';
  } else if (experience === 'intermediate') {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

function calculateLifestyleScore(questionnaire) {
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

function determinePreferredSchedule(questionnaire) {
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

function assessAdherenceRisk(questionnaire) {
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

function createNutritionProfile(questionnaire) {
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

function getRecommendedWorkoutTypes(questionnaire) {
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


export const getClientById = async (req, res) => {
  try {
    const { clientId } = req.params;

    console.log('Getting client by ID:', clientId);

    // Validate clientId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(clientId)
      .populate('user', 'firstName lastName email profileImage');
    
    if (!subscription) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Ensure the coach has access to this client
    if (subscription.assignedCoach.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    // Format client data
    const client = {
      id: subscription._id,
      userId: subscription.user?._id || null,
      firstName: subscription.user?.firstName || 'Guest',
      lastName: subscription.user?.lastName || '',
      email: subscription.user?.email || subscription.guestEmail || 'No email',
      profileImage: subscription.user?.profileImage || null,
      lastActive: subscription.lastLogin || new Date().toISOString(),
      joinDate: subscription.startDate,
      subscription: subscription.subscription, // subscription type
      stats: subscription.stats || {
        workoutsCompleted: 0,
        currentStreak: 0,
        monthlyProgress: 0,
        goalsAchieved: 0
      },
      notes: subscription.coachNotes || '',
      workouts: subscription.workouts || [],
      progress: subscription.progress || null,
      status: subscription.status
    };

    res.status(200).json(client);
  } catch (error) {
    logger.error('Error fetching client details:', error);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
};

// Update client progress data
export const updateClientProgress = async (req, res) => {
  try {
    const { clientId } = req.params;
    const progressData = req.body;

    // Validate clientId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(clientId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Ensure the coach has access to this client
    if (subscription.assignedCoach.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    // Update progress data
    subscription.progress = progressData;
    
    // Update last updated timestamp
    subscription.lastUpdated = new Date();
    
    await subscription.save();

    res.status(200).json({ 
      message: 'Client progress updated successfully',
      progress: subscription.progress
    });
  } catch (error) {
    logger.error('Error updating client progress:', error);
    res.status(500).json({ error: 'Failed to update client progress' });
  }
};

// Update client workout plan
export const updateClientWorkouts = async (req, res) => {
  try {
    const { clientId } = req.params;
    const workoutData = req.body;

    // Validate clientId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(clientId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Ensure the coach has access to this client
    if (subscription.assignedCoach.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    // Update workout data
    subscription.workouts = workoutData;
    
    // Update last updated timestamp
    subscription.lastUpdated = new Date();
    
    await subscription.save();

    res.status(200).json({ 
      message: 'Client workouts updated successfully',
      workouts: subscription.workouts
    });
  } catch (error) {
    logger.error('Error updating client workouts:', error);
    res.status(500).json({ error: 'Failed to update client workouts' });
  }
};

// Update client notes
export const updateClientNotes = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { notes } = req.body;

    // Validate clientId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(clientId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Ensure the coach has access to this client
    if (subscription.assignedCoach.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    // Update notes
    subscription.coachNotes = notes;
    
    // Update last updated timestamp
    subscription.lastUpdated = new Date();
    
    await subscription.save();

    res.status(200).json({ 
      message: 'Client notes updated successfully',
      notes: subscription.coachNotes
    });
  } catch (error) {
    logger.error('Error updating client notes:', error);
    res.status(500).json({ error: 'Failed to update client notes' });
  }
};

// Update client stats
export const updateClientStats = async (req, res) => {
  try {
    const { clientId } = req.params;
    const statsData = req.body;

    // Validate clientId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(clientId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Ensure the coach has access to this client
    if (subscription.assignedCoach.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    // Update stats by merging with existing stats
    subscription.stats = {
      ...(subscription.stats || {}),
      ...statsData
    };
    
    // Update last updated timestamp
    subscription.lastUpdated = new Date();
    
    await subscription.save();

    res.status(200).json({ 
      message: 'Client stats updated successfully',
      stats: subscription.stats
    });
  } catch (error) {
    logger.error('Error updating client stats:', error);
    res.status(500).json({ error: 'Failed to update client stats' });
  }
};

// Export client data
export const exportClientData = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Validate clientId
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(clientId)
      .populate('user', 'firstName lastName email profileImage');
    
    if (!subscription) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Ensure the coach has access to this client
    if (subscription.assignedCoach.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    // Format client data for export
    const exportData = {
      personalInfo: {
        id: subscription._id,
        name: subscription.user ? `${subscription.user.firstName} ${subscription.user.lastName}`.trim() : 'Guest',
        email: subscription.user?.email || subscription.guestEmail || 'No email',
        joinDate: subscription.startDate
      },
      stats: subscription.stats || {},
      progress: subscription.progress || {
        weightProgress: [],
        strengthProgress: [],
        cardioProgress: [],
        bodyFatProgress: [],
        customMetrics: []
      },
      workouts: subscription.workouts || [],
      notes: subscription.coachNotes || '',
      subscription: {
        type: subscription.subscription,
        status: subscription.status,
        startDate: subscription.startDate,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    };

    res.status(200).json(exportData);
  } catch (error) {
    logger.error('Error exporting client data:', error);
    res.status(500).json({ error: 'Failed to export client data' });
  }
};

// Get pending coaching requests
export const getPendingRequests = async (req, res) => {
  try {
    // Ensure the user is a coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can access pending requests' });
    }

    // Find all subscriptions with pending coach assignment
    const pendingRequests = await Subscription.find({
      coachAssignmentStatus: 'pending',
      // Either no coach assigned yet or this specific coach should see it
      $or: [
        { assignedCoach: { $exists: false } },
        { assignedCoach: null },
        { assignedCoach: req.user.id }
      ]
    })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 }); // Newest first

    if (!pendingRequests || pendingRequests.length === 0) {
      return res.status(200).json([]);
    }

    // Format pending requests
    const formattedRequests = pendingRequests.map(request => ({
      id: request._id,
      name: request.user ? `${request.user.firstName} ${request.user.lastName}`.trim() : 'Guest User',
      email: request.user?.email || request.guestEmail || 'No email',
      date: request.createdAt,
      subscriptionType: request.subscription,
      questionnaireData: request.questionnaireData || null
    }));

    res.status(200).json(formattedRequests);
  } catch (error) {
    logger.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
};

// Accept a coaching request
export const acceptCoachingRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { requestId } = req.params;
    
    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Ensure the user is a coach
    if (req.user.role !== 'coach') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ error: 'Only coaches can accept requests' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(requestId).session(session);
    
    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check if coach can accept more clients
    const coach = await User.findById(req.user.id).session(session);
    
    if (!coach) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Coach not found' });
    }

    if (coach.availability.currentClients >= coach.availability.maxClients) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'You have reached your maximum client capacity' });
    }

    // Update subscription with coach assignment
    subscription.assignedCoach = req.user.id;
    subscription.coachAssignmentStatus = 'assigned';
    subscription.coachAssignmentDate = new Date();
    
    await subscription.save({ session });

    // Update coach's client count and subscription list
    coach.availability.currentClients += 1;
    coach.coachingSubscriptions.push(subscription._id);
    
    // Update coach status if max clients reached
    if (coach.availability.currentClients >= coach.availability.maxClients) {
      coach.coachStatus = 'full';
    }
    
    await coach.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: 'Coaching request accepted successfully',
      client: {
        id: subscription._id,
        name: subscription.user ? `${subscription.user.firstName} ${subscription.user.lastName}`.trim() : 'Guest User',
        email: subscription.user?.email || subscription.guestEmail || 'No email',
        subscriptionType: subscription.subscription
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error accepting coaching request:', error);
    res.status(500).json({ error: 'Failed to accept coaching request' });
  }
};

// Decline a coaching request
export const declineCoachingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    
    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(requestId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update subscription status
    subscription.coachAssignmentStatus = 'declined';
    subscription.assignedCoach = null; // Remove coach assignment if was previously assigned
    subscription.coachDeclineReason = reason || 'No reason provided';
    subscription.coachDeclineDate = new Date();
    
    await subscription.save();

    res.status(200).json({ 
      message: 'Coaching request declined successfully'
    });
  } catch (error) {
    logger.error('Error declining coaching request:', error);
    res.status(500).json({ error: 'Failed to decline coaching request' });
  }
};


export const getCoachSessions = async (req, res) => {
  try {
    
    console.log(req.user.role);

    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can access session data' });
    }

    // Find all sessions where this coach is the owner
    const sessions = await Session.find({ coachId: req.user.id })
      .populate('subscription', 'user guestEmail')
      .populate({
        path: 'subscription',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ date: 1, time: 1 });

    // Format session data for the frontend
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      clientId: session.subscription._id, // Use subscription ID as client reference
      clientName: session.subscription.user 
        ? `${session.subscription.user.firstName} ${session.subscription.user.lastName || ''}`.trim() 
        : (session.subscription.guestEmail || 'Guest User'),
      date: session.date,
      time: session.time,
      type: session.sessionType,
      duration: session.duration,
      notes: session.notes || ''
    }));

    res.status(200).json(formattedSessions);
  } catch (error) {
    logger.error('Error fetching coach sessions:', error);
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
}

// Create a new session
export const createSession = async (req, res) => {
  try {
    // Ensure the user is a coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create sessions' });
    }

    const { clientId, date, time, type, duration, notes } = req.body;

    // Validate required fields
    if (!clientId || !date || !time || !type) {
      return res.status(400).json({ error: 'Missing required session fields' });
    }

    // Validate client ID (which is a subscription ID)
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID format' });
    }

    // Find the subscription to verify it exists and the coach has access
    const subscription = await Subscription.findById(clientId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Ensure the coach has access to this client
    if (subscription.assignedCoach.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    // Create new session
    const newSession = new Session({
      coachId: req.user.id,
      subscription: clientId,
      date,
      time,
      sessionType: type,
      duration: duration || '60 minutes',
      notes: notes || ''
    });

    await newSession.save();

    res.status(201).json({
      message: 'Session created successfully',
      session: {
        id: newSession._id,
        clientId,
        date,
        time,
        type,
        duration,
        notes: notes || ''
      }
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
}

// Update a session
export const updateSession = async (req, res) => {
  try {
    // Ensure the user is a coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update sessions' });
    }

    const { sessionId } = req.params;
    const { clientId, date, time, type, duration, notes } = req.body;

    // Validate required fields
    if (!clientId || !date || !time || !type) {
      return res.status(400).json({ error: 'Missing required session fields' });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Find the session
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Ensure the coach owns this session
    if (session.coachId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this session' });
    }

    // Find the subscription to verify it exists and the coach has access
    const subscription = await Subscription.findById(clientId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Ensure the coach has access to this client
    if (subscription.assignedCoach.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this client' });
    }

    // Update session
    session.subscription = clientId;
    session.date = date;
    session.time = time;
    session.sessionType = type;
    session.duration = duration || '60 minutes';
    session.notes = notes || '';
    
    await session.save();

    res.status(200).json({
      message: 'Session updated successfully',
      session: {
        id: session._id,
        clientId,
        date,
        time,
        type,
        duration,
        notes: notes || ''
      }
    });
  } catch (error) {
    logger.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
}

// Delete a session
export const deleteSession = async (req, res) => {
  try {
    // Ensure the user is a coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete sessions' });
    }

    const { sessionId } = req.params;

    // Validate session ID
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID format' });
    }

    // Find the session
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Ensure the coach owns this session
    if (session.coachId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this session' });
    }

    // Delete the session
    await Session.findByIdAndDelete(sessionId);

    res.status(200).json({
      message: 'Session deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};