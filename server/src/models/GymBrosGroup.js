import mongoose from 'mongoose';

const GymBrosGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500
  },
  // Group type
  groupType: {
    type: String,
    enum: ['gym', 'location', 'workout_style', 'goal'],
    required: true
  },
  // Associated gym (if gym type)
  gym: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: function() { return this.groupType === 'gym'; }
  },
  // Location for location-based groups
  location: {
    lat: { 
      type: Number,
      required: function() { return this.groupType === 'location'; }
    },
    lng: { 
      type: Number,
      required: function() { return this.groupType === 'location'; }
    },
    address: { 
      type: String,
      trim: true,
      required: function() { return this.groupType === 'location'; }
    },
    city: {
      type: String,
      trim: true,
      required: function() { return this.groupType === 'location'; }
    },
    radius: {
      type: Number,
      default: 10, // miles
      min: 1,
      max: 50
    }
  },
  // Group settings
  settings: {
    maxMembers: {
      type: Number,
      default: 100,
      min: 2,
      max: 1000
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    }
  },
  // Group admin and moderators
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GymBrosProfile'
  }],
  // Members
  members: [{
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GymBrosProfile',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Pending requests (if requiresApproval is true)
  pendingRequests: [{
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GymBrosProfile'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    message: {
      type: String,
      trim: true,
      maxLength: 200
    }
  }],
  // Group activity and scheduling
  upcomingWorkouts: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    location: {
      name: String,
      address: String,
      lat: Number,
      lng: Number
    },
    workoutType: {
      type: String,
      enum: ['Cardio', 'Weight Training', 'HIIT', 'Yoga', 'CrossFit', 'Swimming', 'Running', 'Cycling', 'Other']
    },
    maxParticipants: {
      type: Number,
      default: 10
    },
    participants: [{
      profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GymBrosProfile'
      },
      confirmedAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GymBrosProfile',
      required: true
    }
  }],
  // Group statistics
  stats: {
    totalWorkouts: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  },
  // Group image/avatar
  image: {
    type: String
  },
  // Tags for discovery
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
GymBrosGroupSchema.index({ groupType: 1 });
GymBrosGroupSchema.index({ gym: 1 });
GymBrosGroupSchema.index({ 'location.lat': 1, 'location.lng': 1 });
GymBrosGroupSchema.index({ 'location.city': 1 });
GymBrosGroupSchema.index({ admin: 1 });
GymBrosGroupSchema.index({ 'members.profile': 1 });
GymBrosGroupSchema.index({ isActive: 1 });
GymBrosGroupSchema.index({ tags: 1 });
GymBrosGroupSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
GymBrosGroupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.filter(m => m.isActive).length : 0;
});

// Virtual for pending request count
GymBrosGroupSchema.virtual('pendingRequestCount').get(function() {
  return this.pendingRequests ? this.pendingRequests.length : 0;
});

// Method to check if user is member
GymBrosGroupSchema.methods.isMember = function(profileId) {
  return this.members.some(m => 
    m.profile.toString() === profileId.toString() && m.isActive
  );
};

// Method to check if user is admin or moderator
GymBrosGroupSchema.methods.canModerate = function(profileId) {
  if (this.admin.toString() === profileId.toString()) return true;
  
  return this.members.some(m => 
    m.profile.toString() === profileId.toString() && 
    (m.role === 'moderator' || m.role === 'admin') &&
    m.isActive
  );
};

// Method to add member
GymBrosGroupSchema.methods.addMember = function(profileId, role = 'member') {
  // Check if already a member
  const existingMember = this.members.find(m => 
    m.profile.toString() === profileId.toString()
  );
  
  if (existingMember) {
    if (!existingMember.isActive) {
      existingMember.isActive = true;
      existingMember.joinedAt = new Date();
      existingMember.role = role;
    }
    return this;
  }
  
  // Add new member
  this.members.push({
    profile: profileId,
    role: role,
    joinedAt: new Date(),
    isActive: true
  });
  
  // Update stats
  this.stats.activeMembers = this.members.filter(m => m.isActive).length;
  
  return this;
};

// Method to remove member
GymBrosGroupSchema.methods.removeMember = function(profileId) {
  const memberIndex = this.members.findIndex(m => 
    m.profile.toString() === profileId.toString()
  );
  
  if (memberIndex !== -1) {
    this.members[memberIndex].isActive = false;
    this.stats.activeMembers = this.members.filter(m => m.isActive).length;
  }
  
  return this;
};

// Static method to find nearby location-based groups
GymBrosGroupSchema.statics.findNearbyLocationGroups = function(lat, lng, radiusMiles = 25) {
  return this.find({
    groupType: 'location',
    isActive: true,
    $and: [
      {
        'location.lat': {
          $gte: lat - (radiusMiles / 69), // Rough degree conversion
          $lte: lat + (radiusMiles / 69)
        }
      },
      {
        'location.lng': {
          $gte: lng - (radiusMiles / 69),
          $lte: lng + (radiusMiles / 69)
        }
      }
    ]
  }).populate('admin', 'name profileImage')
    .populate('members.profile', 'name profileImage')
    .sort({ memberCount: -1 });
};

// Pre-save middleware
GymBrosGroupSchema.pre('save', function(next) {
  // Update active member count
  this.stats.activeMembers = this.members ? this.members.filter(m => m.isActive).length : 0;
  
  // Ensure admin is also in members array
  if (this.admin && !this.isMember(this.admin)) {
    this.addMember(this.admin, 'admin');
  }
  
  next();
});

const GymBrosGroup = mongoose.model('GymBrosGroup', GymBrosGroupSchema);
export default GymBrosGroup;
