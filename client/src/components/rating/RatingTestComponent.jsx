import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Star, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import ratingService from '../../services/rating.service';

/**
 * Rating Test Component
 * 
 * This component helps test and demonstrate the rating system behavior
 * Shows how the ratedBy array prevents duplicate ratings per user
 */
const RatingTestComponent = ({ coachId, userId }) => {
  const [coachData, setCoachData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [testRating, setTestRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Load coach rating details
  const loadCoachData = async () => {
    if (!coachId) return;
    
    setLoading(true);
    try {
      const [details, userRatingStatus] = await Promise.all([
        ratingService.getCoachRatingDetails(coachId),
        ratingService.checkUserRating(coachId)
      ]);
      
      setCoachData(details);
      setHasRated(userRatingStatus.hasRated);
      
      console.log('Coach Data:', details);
      console.log('User has rated:', userRatingStatus.hasRated);
      console.log('RatedBy array:', details.recentRatings);
    } catch (error) {
      console.error('Error loading coach data:', error);
      toast.error('Failed to load coach data');
    } finally {
      setLoading(false);
    }
  };

  // Submit test rating
  const submitTestRating = async () => {
    if (testRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const result = await ratingService.rateCoach(coachId, testRating);
      toast.success('Rating submitted successfully!');
      console.log('Rating result:', result);
      
      // Reload data to see updated state
      await loadCoachData();
      setTestRating(0);
    } catch (error) {
      console.error('Error submitting rating:', error);
      
      if (error.response?.data?.error?.includes('already rated')) {
        toast.error('You have already rated this coach (as expected!)');
        setHasRated(true);
      } else {
        toast.error(error.response?.data?.error || 'Failed to submit rating');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadCoachData();
  }, [coachId]);

  if (!coachId) {
    return (
      <Card className="p-4">
        <CardContent>
          <p className="text-gray-500">Please provide a coach ID to test the rating system</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Rating System Test</span>
          <Button
            onClick={loadCoachData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {loading && !coachData ? (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading coach data...</p>
          </div>
        ) : coachData ? (
          <>
            {/* Coach Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Coach: {coachData.coachName}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Average Rating:</span> {coachData.averageRating}/5.0
                </div>
                <div>
                  <span className="font-medium">Total Ratings:</span> {coachData.totalRatings}
                </div>
              </div>
            </div>

            {/* User Rating Status */}
            <div className={`p-4 rounded-lg ${hasRated ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center space-x-2">
                <User className={`w-5 h-5 ${hasRated ? 'text-red-600' : 'text-green-600'}`} />
                <span className={`font-medium ${hasRated ? 'text-red-800' : 'text-green-800'}`}>
                  {hasRated ? '❌ You have already rated this coach' : '✅ You can rate this coach'}
                </span>
              </div>
              <p className={`text-sm mt-1 ${hasRated ? 'text-red-600' : 'text-green-600'}`}>
                {hasRated 
                  ? 'The system prevents duplicate ratings - your user ID is in the ratedBy array'
                  : 'You can submit a rating - your user ID is not in the ratedBy array'
                }
              </p>
            </div>

            {/* Rating Breakdown */}
            {coachData.totalRatings > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Rating Breakdown:</h4>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = coachData.ratingBreakdown[stars] || 0;
                    const percentage = coachData.totalRatings > 0 ? (count / coachData.totalRatings) * 100 : 0;
                    
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
              </div>
            )}

            {/* Test Rating Submission */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Test Rating Submission:</h4>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setTestRating(star)}
                      className="focus:outline-none"
                      disabled={submitting}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          testRating >= star 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Button
                  onClick={submitTestRating}
                  disabled={submitting || testRating === 0}
                  size="sm"
                >
                  {submitting ? 'Submitting...' : 'Test Submit'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {hasRated 
                  ? 'This should fail with "already rated" error' 
                  : 'This should succeed and add your rating to the ratedBy array'
                }
              </p>
            </div>

            {/* ratedBy Array Debug Info */}
            {coachData.recentRatings.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Recent Ratings (ratedBy array):</h4>
                <div className="space-y-2">
                  {coachData.recentRatings.map((rating, index) => (
                    <div key={index} className="text-sm flex items-center justify-between">
                      <div>
                        <span className="font-medium">{rating.userName}</span>
                        <span className="text-gray-500 ml-2">({rating.userId})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>{rating.rating}/5</span>
                        <span className="text-xs text-gray-500">
                          {new Date(rating.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No coach data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RatingTestComponent;
