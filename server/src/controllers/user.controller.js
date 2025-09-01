import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';
import Subscription from '../models/Subscription.js';
import supabaseStorageService from '../services/supabaseStorage.service.js';


export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const getPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('points');
    res.json({ balance: user.points });
  } catch (error) {
    console.error('Failed to fetch points:', error);
    res.status(500).json({ error: 'Failed to fetch points' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { lat, lng, city, address, source } = req.body;

    logger.info('📍 Location update request received:', {
      userId: req.user.id,
      requestBody: req.body,
      hasLat: !!lat,
      hasLng: !!lng,
      hasCity: !!city,
      source: source || 'unknown'
    });

    // Validate required fields
    if (!lat || !lng || !city) {
      logger.warn('❌ Location update validation failed:', {
        userId: req.user.id,
        missingFields: {
          lat: !lat,
          lng: !lng,
          city: !city
        }
      });
      return res.status(400).json({ 
        message: 'Latitude, longitude, and city are required' 
      });
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      logger.warn('❌ Invalid coordinates provided:', {
        userId: req.user.id,
        lat,
        lng
      });
      return res.status(400).json({ 
        message: 'Invalid coordinates provided' 
      });
    }

    const locationData = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      city: city.trim(),
      address: address ? address.trim() : '',
      isVisible: true, // Default to visible, user can change in settings
      updatedAt: new Date()
    };

    logger.info('💾 Saving location data:', {
      userId: req.user.id,
      locationData
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location: locationData },
      { new: true }
    ).select('-password');

    logger.info(`✅ User ${req.user.id} location updated successfully:`, {
      city: locationData.city,
      coordinates: `${locationData.lat}, ${locationData.lng}`,
      previousLocation: user.location ? 'had location' : 'new location'
    });
    
    res.json({ 
      message: 'Location updated successfully',
      location: user.location
    });
  } catch (error) {
    logger.error('❌ Error updating location:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

export const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('subscription');
    const subscription = user.subscription;

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const dashboardData = {
      subscription: {
        type: subscription.subscription,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
      stats: {
        workoutsCompleted: 12, // Mock data, replace with actual data
        currentStreak: 5,
        monthlyProgress: 68,
        goalsAchieved: 3,
      },
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user dashboard data', error: error.message });
  }
};

export const getCoachDashboardData = async (req, res) => {
  try {
    const coachId = req.user._id; // Assuming the coach is authenticated

    // Fetch all subscriptions where the coach is assigned
    const subscriptions = await Subscription.find({ assignedCoach: coachId })
      .populate('user', 'firstName lastName email') // Populate user details
      .populate('assignedCoach', 'firstName lastName'); // Populate coach details

    const currentTime = new Date();

    // Filter out subscriptions that are no longer active
    const activeSubscriptions = subscriptions.filter(sub => {
      const isCancelled = sub.status === 'cancelled';
      const isActive = sub.status === 'active' && sub.currentPeriodEnd > currentTime;
      const isCancelledButStillActive = sub.cancelAtPeriodEnd && sub.currentPeriodEnd > currentTime && isCancelled;
      return isActive || isCancelledButStillActive;
    });

    // Group active subscriptions by user (or guest email)
    const userMap = new Map(); // Use a Map to group by user ID or guest email

    activeSubscriptions.forEach(sub => {
      const userKey = sub.user?._id || sub.guestEmail; // Use user ID or guest email as a unique key
      if (!userMap.has(userKey)) {
        // If the user is not already in the map, add them
        userMap.set(userKey, {
          id: sub._id,
          userId: sub.user?._id,
          firstName: sub.user?.firstName || 'Guest',
          lastName: sub.user?.lastName || '',
          email: sub.user?.email || sub.guestEmail || 'No email',
          lastActive: sub.lastLogin || new Date().toLocaleDateString(), // Default to today if no lastActive
          stats: sub.stats || {
            workoutsCompleted: 0,
            currentStreak: 0,
            monthlyProgress: 0,
            goalsAchieved: 0,
          },
        });
      }
    });

    // Convert the Map values to an array of unique users
    const recentClients = Array.from(userMap.values());

    // Calculate stats
    const activeClients = recentClients.length; // Number of unique users
    const pendingRequests = subscriptions.filter(sub => sub.coachAssignmentStatus === 'pending').length;

    // Mock data for upcoming sessions (replace with actual logic)
    const upcomingSessions = activeSubscriptions.length; // Each active subscription corresponds to an upcoming session
    const messageThreads = 12; // Replace with actual logic to count active messages

    // Update the coach's coachingSubscriptions and availability.currentClients
    const coach = await User.findById(coachId);
    if (coach) {
      // Remove coachingSubscriptions that are no longer active
      const activeSubscriptionIds = activeSubscriptions.map(sub => sub._id.toString());
      coach.coachingSubscriptions = coach.coachingSubscriptions.filter(subId => 
        activeSubscriptionIds.includes(subId.toString())
      );

      // Update availability.currentClients
      coach.availability.currentClients = activeClients;

      // Save the updated coach data
      await coach.save();
    }

    res.json({
      stats: {
        activeClients,
        pendingRequests,
        upcomingSessions,
        messageThreads,
      },
      recentClients,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coach dashboard data', error: error.message });
  }
};


export const updateClientStats = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const updatedStats = req.body;

    // Find the subscription by ID
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update the stats in the subscription
    subscription.stats = {
      ...subscription.stats,
      ...updatedStats,
    };

    // Save the updated subscription
    await subscription.save();

    res.json({ message: 'Client stats updated successfully', subscription });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update client stats', error: error.message });
  }
};

export const updatePoints = async (req, res) => {
  const { points } = req.body;
  //('Updating points:', points);
  const userId = req.user.id; // Assuming you have user authentication middleware
  //('User ID:', userId);

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.error('User not found');
      return res.status(404).json({ message: 'User not found' });
    }


    if (user.hasReceivedFirstLoginBonus === false) {
      user.hasReceivedFirstLoginBonus = true;
      await user.save();
    }

    // Update the user's points
    await User.findByIdAndUpdate(userId, { points });

    res.status(200).json({ message: 'Points updated successfully' });
  } catch (error) {
    console.error('Failed to update points:', error);
    res.status(500).json({ message: 'Failed to update points' });
  }
};

export const checkDailyGames = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check daily games played
    const gamesPlayed = user.checkDailyGames();
    res.json({ gamesPlayed });
  } catch (error) {
    res.status(500).json({ message: 'Error checking games count' });
  }
};

export const completeGame = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if daily limit reached (e.g., 1 game per day)
    if (user.gamesPlayed >= 1) {
      return res.status(400).json({ message: 'Daily game limit reached' });
    }

    // Update user stats
    user.gamesPlayed += 1;

    // Check if the user won or lost the game
    const { win } = req.body; // Expecting `win` to be a boolean (true/false)
    //('Game result:', win ? 'Win' : 'Lose');

    const now = new Date();
    const lastReset = new Date(user.lastGameReset);

    
    // Reset the learning streak if the user lost the game
    if (!win) {
      user.learningStreak = 0;
    } else {
        user.learningStreak += 1;
    }

    // Update the last game reset date
    user.lastGameReset = now;

    // Save the updated user document
    await user.save();

    // Send response
    res.json({
      success: true,
      points: req.body.points,
      gamesRemaining: 1 - user.gamesPlayed,
      streak: user.learningStreak,
    });
  } catch (error) {
    console.error('Error completing game:', error);
    res.status(500).json({ message: 'Error completing game' });
  }
};

export const dailyCount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has already completed the daily content
    const now = new Date();
    const lastReset = new Date(user.lastGameReset);

    // Reset gamesPlayed if it's a new day
    if (now.getDate() !== lastReset.getDate()) {
      user.gamesPlayed = 0;
      user.lastGameReset = now;
      await user.save();
    }

    res.json({ 
      completed: user.gamesPlayed >= 1, // Daily limit is 3 games
      streak: user.learningStreak || 0,
      gamesPlayed: user.gamesPlayed || 0
    });
  } catch (error) {
    console.error('Error fetching daily count:', error);
    res.status(500).json({ message: 'Error fetching daily count' });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    console.log('Files received:', req.files.map(f => ({ 
      originalname: f.originalname, 
      mimetype: f.mimetype, 
      size: f.size 
    })));
    
    // Upload files to Supabase
    const uploadResults = await supabaseStorageService.uploadMultipleFiles(
      req.files.map(file => ({
        buffer: file.buffer,
        originalname: file.originalname // ✅ CRITICAL: Pass original name to Supabase
      })),
      'user-uploads'
    );

    // Map results to expected format with original filename preserved
    const files = uploadResults.map((result, index) => {
      const originalFile = req.files[index];
      
      // Determine file type more accurately
      let fileType;
      if (originalFile.mimetype) {
        if (originalFile.mimetype.startsWith('image/')) {
          fileType = 'image';
        } else if (originalFile.mimetype.startsWith('video/')) {
          fileType = 'video';
        } else if (originalFile.mimetype === 'application/pdf') {
          fileType = 'application/pdf';
        } else {
          fileType = originalFile.mimetype;
        }
      } else {
        // Fallback to extension-based detection
        const extension = originalFile.originalname.toLowerCase().split('.').pop();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
          fileType = 'image';
        } else if (['mp4', 'webm', 'avi', 'mov'].includes(extension)) {
          fileType = 'video';
        } else if (extension === 'pdf') {
          fileType = 'application/pdf';
        } else {
          fileType = 'file';
        }
      }

      const fileResult = {
        path: result.url, // Use Supabase URL
        type: fileType, // More accurate file type
        originalName: originalFile.originalname, // ✅ CRITICAL: Preserve original filename
        size: originalFile.size,
        mimetype: originalFile.mimetype
      };
      
      // DEBUG: Log the file result
      console.log('File upload result:', fileResult);
      
      return fileResult;
    });
    
    console.log('Final files response:', files);
    res.status(200).json({ files });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
};

export const rateCoach = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;
    
    // Validate rating input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating. Must be between 1 and 5.' });
    }
    
    // Find the coach
    const coach = await User.findById(coachId);
    
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ error: 'Coach not found' });
    }
    
    // Check if user has already rated this coach
    const hasRated = coach.ratedBy && coach.ratedBy.some(item => item.userId.toString() === userId);
    
    if (hasRated) {
      return res.status(400).json({ error: 'You have already rated this coach' });
    }
    
    // Calculate new average rating
    const currentRating = coach.rating || 0;
    const ratingCount = coach.ratingCount || 0;
    
    // Calculate new average
    const totalRatingPoints = currentRating * ratingCount;
    const newTotalPoints = totalRatingPoints + rating;
    const newRatingCount = ratingCount + 1;
    const newAverageRating = parseFloat((newTotalPoints / newRatingCount).toFixed(1)); // One decimal plac

    // Update coach rating data
    coach.rating = newAverageRating;
    coach.ratingCount = newRatingCount;
    
    // Add user to the list of users who have rated this coach
    if (!coach.ratedBy) {
      coach.ratedBy = [];
    }
    
    coach.ratedBy.push({
      userId: userId,
      rating: rating
    });
    
    logger.info(`Coach ${coachId} received new rating: ${rating}/5 from user ${userId}. New average: ${coach.rating}/5 (${newRatingCount} ratings)`);
    
    await coach.save();
    
    res.status(200).json({
      message: 'Rating submitted successfully',
      newRating: coach.rating
    });
  } catch (error) {
    logger.error('Error submitting coach rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};


export const checkUserRating = async (req, res) => {
  try {
    const { coachId } = req.params;
    const userId = req.user.id;
    
    // Find the coach
    const coach = await User.findById(coachId);
    
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ error: 'Coach not found' });
    }
    
    // Check if user has already rated this coach
    const hasRated = coach.ratedBy && coach.ratedBy.some(item => item.userId.toString() === userId);
    
    res.json({ hasRated });
  } catch (error) {
    logger.error('Error checking user rating:', error);
    res.status(500).json({ error: 'Failed to check user rating' });
  }
};

export const getAmbassadors = async (req, res) => {
  try {
    const ambassadors = await User.find({ 
      role: 'affiliate' 
    }).select('firstName lastName email _id').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: ambassadors
    });
  } catch (error) {
    console.error('Error fetching ambassadors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambassadors',
      error: error.message
    });
  }
};
