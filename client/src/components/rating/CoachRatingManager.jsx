import React, { useState, useEffect } from 'react';
import { Star, RefreshCw, Trash2, Users, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { toast } from 'sonner';
import ratingService from '../../services/rating.service';

/**
 * CoachRatingManager Component
 * 
 * A comprehensive component for managing and displaying coach ratings
 * Includes rating submission, viewing details, and admin functions
 */
const CoachRatingManager = ({ coachId, isAdmin = false, showAdminTools = false }) => {
  const [coachData, setCoachData] = useState(null);
  const [allRatings, setAllRatings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load coach rating details
  const loadCoachDetails = async () => {
    if (!coachId) return;
    
    setLoading(true);
    try {
      const [details, userRatingCheck] = await Promise.all([
        ratingService.getCoachRatingDetails(coachId),
        ratingService.checkUserRating(coachId)
      ]);
      
      setCoachData(details);
      setHasRated(userRatingCheck.hasRated);
    } catch (error) {
      console.error('Error loading coach details:', error);
      toast.error('Failed to load coach rating details');
    } finally {
      setLoading(false);
    }
  };

  // Load all coach ratings (admin only)
  const loadAllRatings = async () => {
    if (!showAdminTools) return;
    
    setLoading(true);
    try {
      const data = await ratingService.getAllCoachRatings();
      setAllRatings(data);
    } catch (error) {
      console.error('Error loading all ratings:', error);
      toast.error('Failed to load all coach ratings');
    } finally {
      setLoading(false);
    }
  };

  // Submit a rating
  const submitRating = async () => {
    if (userRating < 1 || userRating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }

    setSubmitting(true);
    try {
      await ratingService.rateCoach(coachId, userRating);
      toast.success('Rating submitted successfully!');
      setHasRated(true);
      setUserRating(0);
      await loadCoachDetails(); // Refresh data
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  // Recalculate rating (admin only)
  const recalculateRating = async (targetCoachId) => {
    try {
      const result = await ratingService.recalculateCoachRating(targetCoachId);
      toast.success(`Rating recalculated: ${result.oldRating} → ${result.newRating}`);
      await loadCoachDetails();
      if (showAdminTools) await loadAllRatings();
    } catch (error) {
      console.error('Error recalculating rating:', error);
      toast.error('Failed to recalculate rating');
    }
  };

  // Remove rating (admin only)
  const removeRating = async (targetCoachId, userId) => {
    if (!confirm('Are you sure you want to remove this rating?')) return;
    
    try {
      await ratingService.removeCoachRating(targetCoachId, userId);
      toast.success('Rating removed successfully');
      await loadCoachDetails();
      if (showAdminTools) await loadAllRatings();
    } catch (error) {
      console.error('Error removing rating:', error);
      toast.error('Failed to remove rating');
    }
  };

  // Star rating component
  const StarRating = ({ rating, onRatingChange, readonly = false, size = 'w-6 h-6' }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} cursor-pointer transition-colors ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300 hover:text-yellow-200'
            } ${readonly ? 'cursor-default' : ''}`}
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  // Rating breakdown chart
  const RatingBreakdown = ({ breakdown, totalRatings }) => {
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = breakdown[stars] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
          
          return (
            <div key={stars} className="flex items-center space-x-2">
              <span className="text-sm w-6">{stars}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    loadCoachDetails();
    if (showAdminTools) loadAllRatings();
  }, [coachId, showAdminTools]);

  if (loading && !coachData) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading rating data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Individual Coach Rating Details */}
      {coachData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>Rating for {coachData.coachName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Rating Display */}
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-yellow-600">
                {coachData.averageRating.toFixed(1)}
              </div>
              <div>
                <StarRating rating={coachData.averageRating} readonly />
                <p className="text-sm text-gray-600">
                  {ratingService.formatRatingText(coachData.averageRating, coachData.totalRatings)}
                </p>
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => recalculateRating(coachId)} 
                  variant="outline" 
                  size="sm"
                  className="ml-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Recalculate
                </Button>
              )}
            </div>

            {/* Rating Breakdown */}
            {coachData.totalRatings > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Rating Breakdown</h4>
                <RatingBreakdown 
                  breakdown={coachData.ratingBreakdown} 
                  totalRatings={coachData.totalRatings} 
                />
              </div>
            )}

            {/* Submit Rating Section */}
            {!hasRated && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Rate this coach</h4>
                <div className="flex items-center space-x-4">
                  <StarRating 
                    rating={userRating} 
                    onRatingChange={setUserRating} 
                  />
                  <Button 
                    onClick={submitRating} 
                    disabled={submitting || userRating === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                  </Button>
                </div>
              </div>
            )}

            {hasRated && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ You have already rated this coach
                </p>
              </div>
            )}

            {/* Recent Ratings */}
            {coachData.recentRatings.length > 0 && isAdmin && (
              <div>
                <h4 className="font-semibold mb-2">Recent Ratings</h4>
                <div className="space-y-2">
                  {coachData.recentRatings.map((rating, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <StarRating rating={rating.rating} readonly size="w-4 h-4" />
                        <span className="font-medium">{rating.userName}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(rating.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {isAdmin && (
                        <Button
                          onClick={() => removeRating(coachId, rating.userId)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin: All Coaches Overview */}
      {showAdminTools && allRatings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>All Coach Ratings Overview</span>
              <Button 
                onClick={loadAllRatings} 
                variant="outline" 
                size="sm"
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{allRatings.totalCoaches}</div>
                <div className="text-sm text-blue-800">Total Coaches</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{allRatings.ratedCoaches}</div>
                <div className="text-sm text-green-800">Have Ratings</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{allRatings.unratedCoaches}</div>
                <div className="text-sm text-yellow-800">No Ratings Yet</div>
              </div>
            </div>

            <div className="space-y-2">
              {allRatings.coaches.map((coach) => (
                <div key={coach.coachId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium">{coach.name}</div>
                      <div className="text-sm text-gray-600">{coach.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {coach.hasRatings ? (
                      <>
                        <StarRating rating={coach.averageRating} readonly size="w-4 h-4" />
                        <div className="text-sm">
                          {coach.averageRating.toFixed(1)}/5.0 ({coach.totalRatings})
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">No ratings</div>
                    )}
                    
                    <Button
                      onClick={() => recalculateRating(coach.coachId)}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoachRatingManager;
