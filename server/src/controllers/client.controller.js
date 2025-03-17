// server/src/controllers/client.controller.js
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Get all clients for a coach
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

    // Format client data from subscriptions
    const clients = subscriptions.map(subscription => ({
      id: subscription._id, // Use subscription ID as client ID for reference
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
    }));

    res.status(200).json(clients);
  } catch (error) {
    logger.error('Error fetching coach clients:', error);
    res.status(500).json({ error: 'Failed to fetch client data' });
  }
};

// Get a specific client by ID (subscription ID)
export const getClientById = async (req, res) => {
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