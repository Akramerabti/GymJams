# Coach Rating System API

A comprehensive rating system for coaches in the GymJams application, allowing users to rate coaches and providing detailed analytics for monitoring and administration.

## 🚀 Features

- **User Rating Submission**: Users can rate coaches from 1-5 stars
- **Duplicate Prevention**: Users cannot rate the same coach twice
- **Real-time Calculation**: Automatic average rating calculation
- **Detailed Analytics**: Rating breakdowns and statistics
- **Admin Tools**: Rating management and recalculation tools
- **Historical Data**: Track rating history and user feedback

## 📋 API Endpoints

### User Rating Endpoints

#### Submit a Rating
```http
POST /api/user/:coachId/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5
}
```

**Response:**
```json
{
  "message": "Rating submitted successfully",
  "newRating": 4.5
}
```

#### Check if User Has Rated
```http
POST /api/user/:coachId/user-rating
Authorization: Bearer <token>
```

**Response:**
```json
{
  "hasRated": true
}
```

### Analytics Endpoints

#### Get Coach Rating Details
```http
GET /api/user/:coachId/rating-details
```

**Response:**
```json
{
  "coachId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "coachName": "John Smith",
  "averageRating": 4.5,
  "totalRatings": 12,
  "ratingBreakdown": {
    "5": 8,
    "4": 3,
    "3": 1,
    "2": 0,
    "1": 0
  },
  "recentRatings": [
    {
      "userId": "60f7b3b3b3b3b3b3b3b3b3b4",
      "userName": "Jane Doe",
      "userEmail": "jane@example.com",
      "rating": 5,
      "submittedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Get All Coach Ratings (Admin)
```http
GET /api/user/coaches/ratings
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "totalCoaches": 25,
  "ratedCoaches": 18,
  "unratedCoaches": 7,
  "coaches": [
    {
      "coachId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "name": "John Smith",
      "email": "john@example.com",
      "averageRating": 4.5,
      "totalRatings": 12,
      "hasRatings": true,
      "lastRatedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### Admin Management Endpoints

#### Recalculate Coach Rating
```http
POST /api/user/:coachId/recalculate-rating
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Rating recalculated successfully",
  "coachId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "oldRating": 4.2,
  "newRating": 4.5,
  "oldCount": 10,
  "newCount": 12
}
```

#### Remove Specific Rating
```http
DELETE /api/user/:coachId/rating/:userId
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Rating removed successfully",
  "removedRating": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b4",
    "rating": 3
  },
  "newRating": 4.6,
  "newCount": 11
}
```

## 🛠️ Database Schema

### User Model Rating Fields
```javascript
{
  rating: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  ratedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number
  }]
}
```

## 🎯 Usage Examples

### Frontend Service Usage

```javascript
import ratingService from '../services/rating.service';

// Submit a rating
try {
  const result = await ratingService.rateCoach('coachId', 5);
  console.log('Rating submitted:', result.newRating);
} catch (error) {
  console.error('Failed to submit rating:', error.message);
}

// Check if user has rated
const { hasRated } = await ratingService.checkUserRating('coachId');

// Get detailed rating info
const details = await ratingService.getCoachRatingDetails('coachId');
console.log(`Coach has ${details.totalRatings} ratings with average ${details.averageRating}`);
```

### React Component Usage

```jsx
import CoachRatingManager from '../components/rating/CoachRatingManager';

// Basic usage
<CoachRatingManager coachId="60f7b3b3b3b3b3b3b3b3b3b3" />

// Admin usage with tools
<CoachRatingManager 
  coachId="60f7b3b3b3b3b3b3b3b3b3b3" 
  isAdmin={true}
  showAdminTools={true}
/>
```

## 🧪 Testing with CLI Tool

Use the provided test script to interact with the rating API:

```bash
# Set your JWT token
export AUTH_TOKEN="your-jwt-token-here"

# Get all coach ratings
node test-ratings.js all-ratings

# Get specific coach details
node test-ratings.js coach-details 60f7b3b3b3b3b3b3b3b3b3b3

# Submit a rating
node test-ratings.js rate 60f7b3b3b3b3b3b3b3b3b3b3 5

# Check if you've rated a coach
node test-ratings.js check-rating 60f7b3b3b3b3b3b3b3b3b3b3

# Recalculate rating (admin)
node test-ratings.js recalculate 60f7b3b3b3b3b3b3b3b3b3b3

# Remove a rating (admin)
node test-ratings.js remove-rating 60f7b3b3b3b3b3b3b3b3b3b3 60f7b3b3b3b3b3b3b3b3b3b4
```

## 🔐 Authentication & Authorization

- **User Endpoints**: Require valid JWT token
- **Admin Endpoints**: Require admin role (not yet implemented - currently open)
- **Phone Verification**: All endpoints require verified phone number

## 📊 Rating Calculation Logic

1. **New Rating Submission**:
   - Validate rating (1-5 stars)
   - Check if user already rated
   - Calculate new average: `(currentRating * ratingCount + newRating) / (ratingCount + 1)`
   - Update coach record

2. **Rating Recalculation**:
   - Sum all individual ratings in `ratedBy` array
   - Divide by total count
   - Update both `rating` and `ratingCount` fields

## 🚨 Error Handling

- **400 Bad Request**: Invalid rating value or duplicate rating
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Coach not found
- **500 Internal Server Error**: Database or server errors

## 🔄 Migration & Maintenance

### Recalculate All Ratings
```javascript
// Run this script to recalculate all coach ratings
const coaches = await User.find({ role: 'coach' });

for (const coach of coaches) {
  if (coach.ratedBy && coach.ratedBy.length > 0) {
    const totalRating = coach.ratedBy.reduce((sum, rating) => sum + rating.rating, 0);
    coach.rating = parseFloat((totalRating / coach.ratedBy.length).toFixed(1));
    coach.ratingCount = coach.ratedBy.length;
    await coach.save();
  }
}
```

## 📈 Future Enhancements

- [ ] Rating comments/reviews
- [ ] Rating categories (communication, expertise, results)
- [ ] Rating history tracking
- [ ] Email notifications for new ratings
- [ ] Rating verification system
- [ ] Bulk rating operations
- [ ] Rating analytics dashboard
- [ ] Rating trends over time

## 🐛 Troubleshooting

### Common Issues

1. **"You have already rated this coach"**
   - Check `ratedBy` array in coach document
   - Use admin tools to remove duplicate if needed

2. **Rating not updating**
   - Use recalculate endpoint to fix calculation
   - Check database consistency

3. **403 Forbidden on admin endpoints**
   - Implement proper role-based authorization
   - Currently all authenticated users can access admin endpoints

### Debug Commands

```bash
# Check a coach's rating data directly
node -e "
const User = require('./src/models/User.js');
User.findById('coachId').then(coach => {
  console.log('Rating:', coach.rating);
  console.log('Count:', coach.ratingCount);
  console.log('RatedBy:', coach.ratedBy);
});
"
```
