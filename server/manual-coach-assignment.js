import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    
    // Dynamic import to load ES modules
    const { default: Subscription } = await import('./src/models/Subscription.js');
    const { default: User } = await import('./src/models/User.js');
    
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
    
    // If there's an available coach and subscription needs assignment
    if (availableCoaches.length > 0 && subscription.coachAssignmentStatus === 'pending' && !subscription.assignedCoach) {
      console.log('Manually assigning coach...');
      
      const selectedCoach = availableCoaches[0];
      console.log('Selected coach:', selectedCoach.firstName, selectedCoach.lastName);
      
      // Update subscription with coach assignment
      subscription.assignedCoach = selectedCoach._id;
      subscription.coachAssignmentStatus = 'assigned';
      subscription.coachAssignmentDate = new Date();
      
      await subscription.save();
      
      // Update coach
      selectedCoach.coachingSubscriptions = selectedCoach.coachingSubscriptions || [];
      if (!selectedCoach.coachingSubscriptions.includes(subscription._id)) {
        selectedCoach.coachingSubscriptions.push(subscription._id);
      }
      
      selectedCoach.availability = selectedCoach.availability || {};
      selectedCoach.availability.currentClients = (selectedCoach.availability.currentClients || 0) + 1;
      
      await selectedCoach.save();
      
      console.log('Coach assignment completed successfully!');
      
      // Check updated subscription
      const updatedSubscription = await Subscription.findById(subscriptionId);
      console.log('Updated subscription:', {
        id: updatedSubscription._id,
        status: updatedSubscription.coachAssignmentStatus,
        assignedCoach: updatedSubscription.assignedCoach,
        assignmentDate: updatedSubscription.coachAssignmentDate
      });
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
