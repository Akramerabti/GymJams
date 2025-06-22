const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    
    const Subscription = require('./src/models/Subscription');
    const User = require('./src/models/User');
    
    // Find the subscription with pending coach assignment
    const subscriptionId = '6858255ec446f67872578c7c';
    const subscription = await Subscription.findById(subscriptionId).populate('user');
    
    if (!subscription) {
      console.log('Subscription not found');
      process.exit(1);
    }
    
    console.log('Subscription found:', {
      id: subscription._id,
      status: subscription.coachAssignmentStatus,
      hasCompletedQuestionnaire: subscription.hasCompletedQuestionnaire,
      assignedCoach: subscription.assignedCoach,
      subscription: subscription.subscription
    });
    
    // Find available coaches
    const availableCoaches = await User.find({
      role: 'coach',
      isEmailVerified: true,
      coachStatus: 'available',
      payoutSetupComplete: true
    });
    
    console.log('Available coaches found:', availableCoaches.length);
    availableCoaches.forEach(coach => {
      console.log('Coach:', {
        id: coach._id,
        name: coach.firstName + ' ' + coach.lastName,
        status: coach.coachStatus,
        payoutSetup: coach.payoutSetupComplete,
        currentClients: coach.availability?.currentClients || 0,
        maxClients: coach.availability?.maxClients || 10
      });
    });
    
    // If there are available coaches and subscription needs assignment, do it
    if (availableCoaches.length > 0 && subscription.coachAssignmentStatus === 'pending' && !subscription.assignedCoach) {
      console.log('Attempting to assign coach...');
      
      // Import the controller function
      const { automaticCoachAssignment } = require('./src/controllers/subscription.Controller');
      
      try {
        await automaticCoachAssignment(subscription);
        console.log('Coach assignment completed successfully');
        
        // Refresh subscription to see the update
        const updatedSubscription = await Subscription.findById(subscriptionId);
        console.log('Updated subscription:', {
          id: updatedSubscription._id,
          status: updatedSubscription.coachAssignmentStatus,
          assignedCoach: updatedSubscription.assignedCoach,
          assignmentDate: updatedSubscription.coachAssignmentDate
        });
      } catch (error) {
        console.error('Error during coach assignment:', error);
      }
    } else {
      console.log('Conditions not met for coach assignment:', {
        availableCoaches: availableCoaches.length,
        assignmentStatus: subscription.coachAssignmentStatus,
        hasAssignedCoach: !!subscription.assignedCoach
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();
