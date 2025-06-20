/**
 * Rating Service
 * 
 * Service for managing coach ratings on the frontend
 */

import api from './api.js';

class RatingService {
  // Submit a rating for a coach
  async rateCoach(coachId, rating) {
    try {
      const response = await api.post(`/user/${coachId}/rate`, { rating });
      return response.data;
    } catch (error) {
      console.error('Error rating coach:', error);
      throw error;
    }
  }

  // Check if current user has rated a coach
  async checkUserRating(coachId) {
    try {
      const response = await api.post(`/user/${coachId}/user-rating`);
      return response.data;
    } catch (error) {
      console.error('Error checking user rating:', error);
      throw error;
    }
  }

  // Get detailed rating information for a coach
  async getCoachRatingDetails(coachId) {
    try {
      const response = await api.get(`/user/${coachId}/rating-details`);
      return response.data;
    } catch (error) {
      console.error('Error getting coach rating details:', error);
      throw error;
    }
  }

  // Get all coach ratings (admin only)
  async getAllCoachRatings() {
    try {
      const response = await api.get('/user/coaches/ratings');
      return response.data;
    } catch (error) {
      console.error('Error getting all coach ratings:', error);
      throw error;
    }
  }

  // Recalculate a coach's rating (admin only)
  async recalculateCoachRating(coachId) {
    try {
      const response = await api.post(`/user/${coachId}/recalculate-rating`);
      return response.data;
    } catch (error) {
      console.error('Error recalculating coach rating:', error);
      throw error;
    }
  }

  // Remove a specific rating (admin only)
  async removeCoachRating(coachId, userId) {
    try {
      const response = await api.delete(`/user/${coachId}/rating/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing coach rating:', error);
      throw error;
    }
  }

  // Helper method to render star ratings
  renderStars(rating, maxStars = 5) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
    
    return {
      full: fullStars,
      half: hasHalfStar ? 1 : 0,
      empty: emptyStars,
      display: '⭐'.repeat(fullStars) + (hasHalfStar ? '✨' : '') + '☆'.repeat(emptyStars)
    };
  }

  // Helper method to format rating display text
  formatRatingText(rating, count) {
    if (count === 0) return 'No ratings yet';
    if (count === 1) return `${rating}/5.0 (1 rating)`;
    return `${rating}/5.0 (${count} ratings)`;
  }

  // Helper method to validate rating input
  validateRating(rating) {
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      throw new Error('Rating must be a number between 1 and 5');
    }
    return numRating;
  }
}

export default new RatingService();
