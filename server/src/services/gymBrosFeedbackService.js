// server/src/services/gymBrosFeedbackService.js

/**
 * Process and apply feedback from user interactions
 * @param {String} userId - Current user ID
 * @param {String} targetId - Swiped profile ID
 * @param {String} interactionType - 'like' or 'dislike'
 * @param {Number} viewDuration - Time spent viewing profile (ms)
 */
export const processFeedback = async (userId, targetId, feedbackType, viewDuration = 0) => {
  try {
    logger.info(`Processing ${feedbackType} from ${userId} to ${targetId} (duration: ${viewDuration}ms)`);
    
    // Record the interaction for analytics and learning
    const interaction = new GymBrosInteraction({
      userId,
      targetId,
      type: feedbackType,
      viewDuration,
      timestamp: new Date()
    });
    
    await interaction.save();
    
    // Find or create user preferences
    let preferences = await GymBrosPreference.findOne({ userId });
    
    if (!preferences) {
      preferences = new GymBrosPreference({ userId });
    }
    
    // Update appropriate array based on feedback type
    if (feedbackType === 'like') {
      // Add to liked profiles if not already there
      if (!preferences.likedProfiles.includes(targetId)) {
        preferences.likedProfiles.push(targetId);
      }
      
      // Remove from disliked if it's there (in case user changed their mind)
      preferences.dislikedProfiles = preferences.dislikedProfiles.filter(id => id !== targetId);
      
      // Update metrics for the target profile
      await GymBrosProfile.updateOne(
        { userId: targetId },
        { $inc: { 'metrics.likes': 1, 'metrics.views': 1 } }
      );
    } else if (feedbackType === 'dislike') {
      // Add to disliked profiles if not already there
      if (!preferences.dislikedProfiles.includes(targetId)) {
        preferences.dislikedProfiles.push(targetId);
      }
      
      // Remove from liked if it's there (in case user changed their mind)
      preferences.likedProfiles = preferences.likedProfiles.filter(id => id !== targetId);
      
      // Update metrics for the target profile
      await GymBrosProfile.updateOne(
        { userId: targetId },
        { $inc: { 'metrics.dislikes': 1, 'metrics.views': 1 } }
      );
    } else if (feedbackType === 'view') {
      // Just update view count
      await GymBrosProfile.updateOne(
        { userId: targetId },
        { $inc: { 'metrics.views': 1 } }
      );
    }
    
    // Calculate popularity score for target profile
    await updatePopularityScore(targetId);
    
    // Save updated preferences
    await preferences.save();
    
    // Learn from this interaction to improve future recommendations
    await learnFromInteraction(userId, targetId, feedbackType, viewDuration);
    
    return true;
  } catch (error) {
    logger.error(`Error processing ${feedbackType} feedback:`, error);
    return false;
  }
};
  
  const normalizePreferenceWeights = (preferences) => {
    const sum = preferences.reduce((total, pref) => total + pref.weight, 0);
    
    if (sum > 0) {
      for (let pref of preferences) {
        pref.weight = pref.weight / sum;
      }
    }
  };
  

  const updatePopularityScore = async (profileId) => {
    try {
      const profile = await GymBrosProfile.findOne({ userId: profileId });
      if (!profile || !profile.metrics) return;
      
      const { likes, dislikes, views } = profile.metrics;
      
      // Calculate ratio of likes to total interactions (default to 0.5 if no interactions)
      const totalInteractions = likes + dislikes;
      let likeRatio = totalInteractions > 0 ? likes / totalInteractions : 0.5;
      
      // Adjust for total views (more views = more reliable ratio)
      // This prevents profiles with just 1-2 likes from getting artificially high scores
      const viewFactor = Math.min(views / 10, 1); // Caps at 10+ views
      likeRatio = likeRatio * viewFactor + 0.5 * (1 - viewFactor);
      
      // Calculate popularity score (50-100 scale)
      const popularityScore = 50 + (likeRatio * 50);
      
      // Update popularity score
      await GymBrosProfile.updateOne(
        { userId: profileId },
        { $set: { 'metrics.popularityScore': popularityScore } }
      );
      
      logger.debug(`Updated popularity score for ${profileId}: ${popularityScore.toFixed(1)}`);
    } catch (error) {
      logger.error(`Error updating popularity score for ${profileId}:`, error);
    }
  };
  
  /**
   * Learn from user interactions to improve future recommendations
   * @param {String} userId - ID of the user giving feedback
   * @param {String} targetId - ID of the profile receiving feedback
   * @param {String} feedbackType - Type of feedback
   * @param {Number} viewDuration - How long the user viewed the profile
   */
  const learnFromInteraction = async (userId, targetId, feedbackType, viewDuration) => {
    try {
      // Get the user and target profiles
      const [userProfile, targetProfile] = await Promise.all([
        GymBrosProfile.findOne({ userId }),
        GymBrosProfile.findOne({ userId: targetId })
      ]);
      
      if (!userProfile || !targetProfile) return;
      
      // Get or create user preferences
      let preferences = await GymBrosPreference.findOne({ userId });
      if (!preferences) {
        preferences = new GymBrosPreference({ userId });
      }
      
      // If this was a "like", learn from it to adjust preferences
      if (feedbackType === 'like') {
        // Learn workout preferences - add any new types to preferences
        const targetWorkoutTypes = targetProfile.workoutTypes || [];
        
        // Only update if target has workout types to learn from
        if (targetWorkoutTypes.length > 0) {
          // Merge existing and new workout types (without duplicates)
          preferences.workoutTypes = Array.from(
            new Set([...(preferences.workoutTypes || []), ...targetWorkoutTypes])
          );
        }
        
        // Learn experience level preferences if not already set
        if (!preferences.experienceLevel || preferences.experienceLevel === 'any') {
          preferences.experienceLevel = targetProfile.experienceLevel;
        }
        
        // Update preferred time if not already set
        if (!preferences.preferredTime || preferences.preferredTime.length === 0) {
          preferences.preferredTime = [targetProfile.preferredTime];
        } else if (!preferences.preferredTime.includes(targetProfile.preferredTime)) {
          preferences.preferredTime.push(targetProfile.preferredTime);
        }
        
        // Save updated preferences
        await preferences.save();
      }
      
      // Additional learning logic could be implemented here
      // For example, analyzing patterns in likes/dislikes to identify preferences
    } catch (error) {
      logger.error('Error learning from interaction:', error);
    }
  };
  
  /**
   * Get a report of user interaction patterns
   * @param {String} userId - ID of the user
   * @returns {Object} - Interaction statistics
   */
  export const getUserInteractionStats = async (userId) => {
    try {
      // Get counts of interactions
      const interactionCounts = await GymBrosInteraction.aggregate([
        { $match: { userId } },
        { $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgDuration: { $avg: '$viewDuration' }
          }
        }
      ]);
      
      // Format the results
      const stats = {
        totalInteractions: 0,
        likes: 0,
        dislikes: 0,
        views: 0,
        averageViewDuration: 0,
        matchRate: 0
      };
      
      interactionCounts.forEach(item => {
        stats[item._id + 's'] = item.count;
        stats.totalInteractions += item.count;
        
        if (item._id === 'view') {
          stats.averageViewDuration = Math.round(item.avgDuration);
        }
      });
      
      // Calculate match rate (likes divided by total decisions)
      const decisions = stats.likes + stats.dislikes;
      stats.matchRate = decisions > 0 ? Math.round((stats.likes / decisions) * 100) : 0;
      
      return stats;
    } catch (error) {
      logger.error('Error getting user interaction stats:', error);
      return null;
    }
  };