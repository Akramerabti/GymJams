// server/src/middleware/requirePhone.middleware.js
/**
 * Middleware to ensure authenticated users have a phone number
 * Prevents incomplete OAuth users from accessing protected routes
 */
export const requirePhone = (req, res, next) => {
  try {
    // If user is not authenticated, let auth middleware handle it
    if (!req.user) {
      return next();
    }

    // Check if user has a phone number
    if (!req.user.phone || req.user.phone.trim() === '') {
      return res.status(403).json({ 
        error: 'Phone number required',
        message: 'You must add a phone number to your account to access this feature.',
        requiresPhoneNumber: true
      });
    }

    next();
  } catch (error) {
    console.error('RequirePhone middleware error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Middleware to ensure authenticated users have complete profiles
 * Prevents incomplete OAuth users from accessing protected routes
 */
export const requireCompleteProfile = (req, res, next) => {
  try {
    // If user is not authenticated, let auth middleware handle it
    if (!req.user) {
      return next();
    }

    const missingFields = [];

    // Check required fields
    if (!req.user.phone || req.user.phone.trim() === '') {
      missingFields.push('phone');
    }
    
    if (!req.user.lastName || req.user.lastName.trim() === '') {
      missingFields.push('lastName');
    }

    if (missingFields.length > 0) {
      return res.status(403).json({ 
        error: 'Incomplete profile',
        message: 'You must complete your profile to access this feature.',
        missingFields,
        requiresCompletion: true
      });
    }

    next();
  } catch (error) {
    console.error('RequireCompleteProfile middleware error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
