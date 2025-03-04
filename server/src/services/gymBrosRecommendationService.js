import { calculateDistance } from './gymBrosMatchingService.js';

/**
 * Get recommended profiles for a user
 * @param {Object} userProfile - Current user's profile
 * @param {Array} candidateProfiles - All potential matches
 * @param {Object} options - Recommendation options 
 * @returns {Array} - Sorted list of recommended profiles
 */
export const getRecommendedProfiles = async (userProfile, candidateProfiles, options = {}) => {
  // Set default options
  const defaultOptions = {
    limit: 20,                  // Number of recommendations to return
    diversityFactor: 0.2,       // How much to emphasize diversity (0-1)
    activityWeight: 0.15,       // Weight for user activity
    profileQualityWeight: 0.15, // Weight for profile completeness
    compatibilityWeight: 0.7,   // Weight for compatibility score
    maxDistance: options.maxDistance || 50, // Max distance in miles
  };
  
  const settings = { ...defaultOptions, ...options };
  
  // Filter candidates by basic compatibility criteria
  const filteredCandidates = candidateProfiles.filter(profile => {
    // Filter by max distance
    const distance = calculateDistance(
      userProfile.location.lat, userProfile.location.lng,
      profile.location.lat, profile.location.lng
    );
    return distance <= settings.maxDistance;
  });
  
  // Calculate scores for each candidate
  const scoredCandidates = filteredCandidates.map(profile => {
    // Calculate base compatibility score
    const compatibilityScore = calculateMatchScore(userProfile, profile);
    
    // Calculate profile quality score (0-1)
    const profileQualityScore = calculateProfileQualityScore(profile);
    
    // Calculate activity score (0-1)
    const activityScore = calculateActivityScore(profile);
    
    // Calculate final score with weights
    const finalScore = (
      compatibilityScore * settings.compatibilityWeight +
      profileQualityScore * settings.profileQualityWeight +
      activityScore * settings.activityWeight
    );
    
    return {
      profile,
      scores: {
        compatibility: compatibilityScore,
        profileQuality: profileQualityScore,
        activity: activityScore
      },
      finalScore
    };
  });
  
  // Sort candidates by score
  const sortedCandidates = scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
  
  // Apply diversity to avoid showing only the top profiles
  // This ensures users see a mix of profile types
  let recommendations = [];
  
  if (settings.diversityFactor > 0) {
    recommendations = applyDiversity(sortedCandidates, settings.diversityFactor);
  } else {
    recommendations = sortedCandidates;
  }
  
  // Limit number of recommendations
  return recommendations.slice(0, settings.limit).map(rec => ({
    ...rec.profile.toObject(),
    matchScore: Math.round(rec.scores.compatibility),
    distance: calculateDistance(
      userProfile.location.lat, userProfile.location.lng,
      rec.profile.location.lat, rec.profile.location.lng
    ).toFixed(1)
  }));
};

/**
 * Calculate profile quality score
 * @returns {Number} - Score between 0-1
 */
const calculateProfileQualityScore = (profile) => {
  let score = 0;
  let factors = 0;
  
  // Has profile image(s)
  if (profile.images && profile.images.length > 0) {
    score += profile.images.length / 6; // Score higher for more images (up to 6)
    factors++;
  }
  
  // Has bio with reasonable length
  if (profile.bio && profile.bio.length >= 20) {
    score += Math.min(1, profile.bio.length / 200); // Score for bio up to 200 chars
    factors++;
  }
  
  // Has workout types selected
  if (profile.workoutTypes && profile.workoutTypes.length > 0) {
    score += Math.min(1, profile.workoutTypes.length / 4); // Score for workout types
    factors++;
  }
  
  // Has location set
  if (profile.location && profile.location.lat && profile.location.lng) {
    score += 1;
    factors++;
  }
  
  // Normalize score
  return factors > 0 ? score / factors : 0;
};

/**
 * Calculate user activity score
 * @returns {Number} - Score between 0-1
 */
const calculateActivityScore = (profile) => {
  // Get user's last activity timestamp
  const lastActive = profile.lastActive || profile.updatedAt || profile.createdAt;
  
  if (!lastActive) return 0.5; // Default score if no activity data
  
  // Calculate days since last activity
  const now = new Date();
  const daysSinceActive = (now - new Date(lastActive)) / (1000 * 60 * 60 * 24);
  
  // Score decreases as inactivity increases
  // 0 days = score 1, 30+ days = score 0
  return Math.max(0, 1 - (daysSinceActive / 30));
};

/**
 * Apply diversity to recommendations to avoid only showing top matches
 * @returns {Array} - Diversified recommendations
 */
const applyDiversity = (sortedCandidates, diversityFactor) => {
  if (sortedCandidates.length <= 10) return sortedCandidates;
  
  const diversifiedResults = [];
  
  // Add a portion of top results (e.g., top 70%)
  const topCount = Math.floor(sortedCandidates.length * (1 - diversityFactor));
  const topResults = sortedCandidates.slice(0, topCount);
  diversifiedResults.push(...topResults);
  
  // Add random selection from remaining results
  const remainingCandidates = sortedCandidates.slice(topCount);
  const randomCount = Math.min(
    remainingCandidates.length,
    Math.ceil(sortedCandidates.length * diversityFactor)
  );
  
  // Shuffle remaining candidates
  const shuffled = remainingCandidates.sort(() => Math.random() - 0.5);
  diversifiedResults.push(...shuffled.slice(0, randomCount));
  
  return diversifiedResults;
};