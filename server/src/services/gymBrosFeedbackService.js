// server/src/services/gymBrosFeedbackService.js

/**
 * Process and apply feedback from user interactions
 * @param {String} userId - Current user ID
 * @param {String} targetId - Swiped profile ID
 * @param {String} interactionType - 'like' or 'dislike'
 * @param {Number} viewDuration - Time spent viewing profile (ms)
 */
export const processFeedback = async (userId, targetId, interactionType, viewDuration = 0) => {
    try {
      // 1. Update user preferences based on interaction
      await updateUserPreferences(userId, targetId, interactionType, viewDuration);
      
      // 2. Update profile popularity metrics
      await updateProfilePopularity(targetId, interactionType);
      
      // 3. If it's a match, create a match record
      if (interactionType === 'like') {
        await checkForMatch(userId, targetId);
      }
      
      // 4. Update activity timestamp for both users
      await updateActivityTimestamp(userId);
      await updateActivityTimestamp(targetId);
      
      return true;
    } catch (error) {
      console.error('Error processing feedback:', error);
      return false;
    }
  };
  
  /**
   * Update user preferences based on interactions
   */
  const updateUserPreferences = async (userId, targetId, interactionType, viewDuration) => {
    // Get user's current preferences
    const userPreferences = await GymBrosPreference.findOne({ userId }) || 
      new GymBrosPreference({ userId });
    
    // Get the target profile
    const targetProfile = await GymBrosProfile.findOne({ userId: targetId });
    if (!targetProfile) return;
    
    // Based on the interaction type, update preferences
    if (interactionType === 'like') {
      // Update preferred workout types
      targetProfile.workoutTypes.forEach(workoutType => {
        const existing = userPreferences.workoutTypePreferences.find(p => p.type === workoutType);
        if (existing) {
          existing.weight += 0.1; // Increase preference weight
        } else {
          userPreferences.workoutTypePreferences.push({
            type: workoutType,
            weight: 1.0
          });
        }
      });
      
      // Update experience level preference
      const expLevelPref = userPreferences.experienceLevelPreferences.find(
        p => p.level === targetProfile.experienceLevel
      );
      if (expLevelPref) {
        expLevelPref.weight += 0.1;
      } else {
        userPreferences.experienceLevelPreferences.push({
          level: targetProfile.experienceLevel,
          weight: 1.0
        });
      }
      
      // Add to liked profiles
      userPreferences.likedProfiles.push(targetId);
      
    } else if (interactionType === 'dislike') {
      // Slightly decrease weights for this profile's attributes
      targetProfile.workoutTypes.forEach(workoutType => {
        const existing = userPreferences.workoutTypePreferences.find(p => p.type === workoutType);
        if (existing) {
          existing.weight = Math.max(0.1, existing.weight - 0.05);
        }
      });
      
      // Add to disliked profiles
      userPreferences.dislikedProfiles.push(targetId);
    }
    
    // Use view duration as engagement signal
    if (viewDuration > 5000) { // User spent more than 5 seconds viewing
      userPreferences.engagementScore += 0.1;
    }
    
    // Normalize weights
    normalizePreferenceWeights(userPreferences.workoutTypePreferences);
    normalizePreferenceWeights(userPreferences.experienceLevelPreferences);
    
    // Save updated preferences
    await userPreferences.save();
  };
  
  /**
   * Update profile popularity metrics
   */
  const updateProfilePopularity = async (profileId, interactionType) => {
    const profile = await GymBrosProfile.findOne({ userId: profileId });
    if (!profile) return;
    
    // Initialize metrics if they don't exist
    if (!profile.metrics) {
      profile.metrics = {
        views: 0,
        likes: 0,
        dislikes: 0,
        matches: 0,
        popularityScore: 50 // Start at neutral score
      };
    }
    
    // Update metrics based on interaction
    if (interactionType === 'view') {
      profile.metrics.views += 1;
    } else if (interactionType === 'like') {
      profile.metrics.likes += 1;
      
      // Update popularity score using Elo-like system
      // Gain more points for likes
      profile.metrics.popularityScore += 2;
    } else if (interactionType === 'dislike') {
      profile.metrics.dislikes += 1;
      
      // Lose points for dislikes
      profile.metrics.popularityScore = Math.max(0, profile.metrics.popularityScore - 1);
    }
    
    // Cap popularity score at 100
    profile.metrics.popularityScore = Math.min(100, profile.metrics.popularityScore);
    
    await profile.save();
  };
  
  /**
   * Check if there's a match and create record if needed
   */
  const checkForMatch = async (userId, targetId) => {
    // Check if the target user has liked the current user
    const targetPreferences = await GymBrosPreference.findOne({ userId: targetId });
    
    if (targetPreferences && targetPreferences.likedProfiles.includes(userId)) {
      // It's a match! Create a match record
      const newMatch = new GymBrosMatch({
        users: [userId, targetId],
        createdAt: new Date(),
        active: true
      });
      
      await newMatch.save();
      
      // Update match count for both profiles
      await GymBrosProfile.updateOne(
        { userId },
        { $inc: { 'metrics.matches': 1 } }
      );
      
      await GymBrosProfile.updateOne(
        { userId: targetId },
        { $inc: { 'metrics.matches': 1 } }
      );
      
      // Return true to indicate a match was created
      return true;
    }
    
    return false;
  };
  
  /**
   * Update user's activity timestamp
   */
  const updateActivityTimestamp = async (userId) => {
    await GymBrosProfile.updateOne(
      { userId },
      { $set: { lastActive: new Date() } }
    );
  };
  
  /**
   * Normalize weights to ensure they sum to a consistent value
   */
  const normalizePreferenceWeights = (preferences) => {
    const sum = preferences.reduce((total, pref) => total + pref.weight, 0);
    
    if (sum > 0) {
      for (let pref of preferences) {
        pref.weight = pref.weight / sum;
      }
    }
  };