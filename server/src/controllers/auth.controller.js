import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createCustomer } from '../config/stripe.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail  } from '../services/email.service.js';
import stripe from '../config/stripe.js'; 
import Subscription from '../models/Subscription.js';
import PhoneVerification from '../models/PhoneVerification.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { subscribe } from 'diagnostics_channel';

const __filename = fileURLToPath(import.meta.url); // Get the file path
const __dirname = path.dirname(__filename); // Get the directory name

export const logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        lastLogout: new Date()
      });

      // Optional: Invalidate any refresh tokens
      // await Token.deleteMany({ userId });
    }

    // Clear any server-side session data if using sessions
    if (req.session) {
      req.session.destroy();
    }

    res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if all required fields are provided
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: 'This email is already registered' });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: 'This phone number is already registered' });
      }
    }
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create Stripe customer
    const stripeCustomer = await createCustomer({
      email,
      name: `${firstName} ${lastName}`,
      metadata: { userId: email }
    });

    // Create user in the database
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      stripeCustomerId: stripeCustomer.id,
      verificationToken,
      verificationTokenExpires
    });

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Email and password validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    // Handle first login bonus and onboarding
    const isFirstLogin = !user.hasReceivedFirstLoginBonus;
    if (isFirstLogin) {
      user.points += 100;
      user.hasReceivedFirstLoginBonus = true;
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        points: user.points,
        isEmailVerified: user.isEmailVerified,
        hasReceivedFirstLoginBonus: user.hasReceivedFirstLoginBonus,
        role: user.role,
        subscription: user.subscription
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};


export const loginWithTokenFORPHONE = async (req, res) => {
  try {
    const { token } = req.body;

    // Decode the token to extract phone and verified fields
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { phone, verified } = decoded;

    // Check if the token is verified
    if (!verified) {
      return res.status(401).json({ message: 'Token is not verified' });
    }

    // Find the user by phone number
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new token (optional, for security)
    const newToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return the user and new token
    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        points: user.points,
        isEmailVerified: user.isEmailVerified,
        hasReceivedFirstLoginBonus: user.hasReceivedFirstLoginBonus,
        role: user.role,
        subscription: user.subscription,
      },
      token: newToken,
    });
  } catch (error) {
    console.error('Error in loginWithToken:', error);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    res.status(500).json({ message: 'Error logging in with token' });
  }
};

// auth.controller.js
export const validateToken = async (req, res) => {
  try {
    console.log('Validating token...');
    console.log('req.user:', req.user);

    if (!req.user) {
      console.error('User not found in request');
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if the token is expired
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.error('Token has expired');
        return res.status(401).json({ message: 'Token has expired' });
      }
    }

    // Disable caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Token validation failed:', error);
    res.status(500).json({ message: 'Token validation failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Construct full URL for profile image
    if (user.profileImage) {
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000/api';
      // Remove /api if it's already in the image path
      const imagePath = user.profileImage.replace('/api', '');
      user.profileImage = `${baseUrl}${imagePath}`;
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, bio, rating, socialLinks, specialties } = req.body;

    
    // Find the user by ID
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields for all users
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;

    // Update profile image if a file was uploaded
    if (req.file) {
      // If the user already has a profile image, delete the old file
      if (user.profileImage) {
        const oldImageName = user.profileImage.replace('/uploads/', '');
        const oldImagePath = path.resolve(__dirname, '../..', 'uploads', oldImageName);

        // Check if the file exists before attempting to delete it
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error('Failed to delete old image:', err);
            } else {
              console.log('Old image deleted successfully:', oldImagePath);
            }
          });
        } else {
          console.warn('Old image does not exist:', oldImagePath);
        }
      }

      // Save the new file path
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    // Update coach-specific fields if the user is a coach
    if (user.role === 'coach') {
      user.bio = bio || user.bio;
      user.rating = rating || user.rating;
      user.socialLinks = {
        instagram: socialLinks?.instagram || user.socialLinks?.instagram,
        twitter: socialLinks?.twitter || user.socialLinks?.twitter,
        youtube: socialLinks?.youtube || user.socialLinks?.youtube,
      };

      console.log('Specialties:', specialties);
      // Update specialties if provided and valid
      if (Array.isArray(specialties)) {
        user.specialties = specialties;
      } else if (specialties === null || specialties === undefined) {
        // Retain the existing specialties if none are provided
        user.specialties = user.specialties || [];
      } else {
        // Handle invalid specialties input (e.g., log a warning)
        console.warn('Invalid specialties input:', specialties);
      }
    }

    // Save the updated user
    const updatedUser = await user.save();

    // Return the updated user without the password field
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update the user's verification token and expiration
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send the verification email
    await sendVerificationEmail(user, verificationToken);

    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (error) {
    logger.error('Resend verification email error:', error);
    res.status(500).json({ message: 'Error resending verification email' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('Verifying email...', token);

    // Find the user by verification token
    const user = await User.findOne({
         verificationToken: token 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    // Check if the email is already verified
    if (user.isEmailVerified) {
      return res.json({ message: 'Email is already verified' });
    }

    // Check if the verification token has expired
    if (user.verificationTokenExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification token has expired' });
    }

    // Mark the email as verified
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Generate a JWT token for the user
    const authToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return the user and token
    res.json({
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified
      },
      token: authToken
    });
  } catch (error) {
    logger.error('Verification error:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
};

export const validatePhone = async (req, res) => {
  try {
    const { phone } = req.body;
    
    const number = phone.phone;

    // Check if the phone number is provided
    if (!number) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if a user with the given phone number already exists
    const existingUser = await User.findOne({ number });

    // If no user exists with this phone number, it's valid
    res.json({ isValid: !existingUser });
  } catch (error) {
    console.error('Error validating phone number:', error);
    res.status(500).json({ message: 'Error validating phone number' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security reasons, still return success even if email doesn't exist
      return res.status(200).json({ 
        message: 'If your email exists in our system, you will receive a password reset link.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({ 
      message: 'If your email exists in our system, you will receive a password reset link.' 
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Password reset token is invalid or has expired' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // You might want to invalidate all existing sessions here
    // depending on your security requirements
    console.log('Password reset successfully', user);
    res.status(200).json({ 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

export const getCoach = async (req, res) => {
  try {
    const coaches = await User.find({ role: 'coach' })
      .select('firstName lastName profileImage bio rating socialLinks payoutSetupComplete specialties')
      .sort({ rating: -1 }); // Sort by rating in descending order

    if (!coaches.length) {
      return res.status(404).json({ message: 'No coaches found' });
    }

    // Construct full URL for profile images
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000/api';
    const updatedCoaches = coaches.map(coach => {
      if (coach.profileImage) {
        const imagePath = coach.profileImage.startsWith('/api') 
          ? coach.profileImage.replace('/api', '') 
          : coach.profileImage;
        coach.profileImage = `${baseUrl}${imagePath}`;
        console.log('Updated image path:', coach.profileImage);
      }
      return coach;
    });

    res.json(updatedCoaches);
  } catch (error) {
    logger.error('Error fetching coaches:', error);
    res.status(500).json({ message: 'Error fetching coaches' });
  }
};

export const getCoachById = async (req, res) => {
  try {
    const { coachId } = req.params;

    // Validate the coachId
    if (!coachId) {
      return res.status(400).json({ message: 'Coach ID is required' });
    }

    // Find the coach by ID
    const coach = await User.findOne({ _id: coachId, role: 'coach' })
      .select('firstName lastName profileImage bio rating socialLinks specialties payoutSetupComplete');

    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Construct full URL for profile image
    if (coach.profileImage) {
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000/api';
      const imagePath = coach.profileImage.startsWith('/api') 
        ? coach.profileImage.replace('/api', '') 
        : coach.profileImage;
      coach.profileImage = `${baseUrl}${imagePath}`;
    }

    res.json(coach);
  } catch (error) {
    logger.error('Error fetching coach by ID:', error);
    res.status(500).json({ message: 'Error fetching coach details' });
  }
};

export const deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is a coach and has pending payments
    if (user.role === 'coach' && user.stripeAccountId) {
      // Check for pending payments
      if (user.earnings?.pendingAmount > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          message: 'You have pending payments. Please resolve them before deleting your account.',
        });
      }

      // Delete the Stripe account
      try {
        await stripe.accounts.del(user.stripeAccountId);
        logger.info(`Stripe account deleted for coach: ${user.stripeAccountId}`);
      } catch (stripeError) {
        logger.error('Error deleting Stripe account:', stripeError);
        // Even if Stripe account deletion fails, proceed with user deletion
      }
    }

    // Delete any subscriptions associated with the user
    await Subscription.deleteMany({ user: userId }).session(session);

    // If the user is a coach, remove them from any client's assigned coach
    if (user.role === 'coach') {
      await Subscription.updateMany(
        { assignedCoach: userId },
        { $unset: { assignedCoach: 1 } }
      ).session(session);
    }

    // Finally, delete the user
    await User.findByIdAndDelete(userId).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error deleting account:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  } finally {
    session.endSession();
  }
};





export const loginWithPhone = async (req, res) => {
  try {
    const { phone, verificationToken } = req.body;
    
    if (!phone || !verificationToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and verification token are required' 
      });
    }
    
    // Verify the token is valid
    try {
      const decodedToken = jwt.verify(verificationToken, process.env.JWT_SECRET);
      
      // Check if the token was issued for this phone number and is marked as verified
      if (!decodedToken.phone || decodedToken.phone !== phone || !decodedToken.verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid verification token'
        });
      }
    } catch (tokenError) {
      logger.error('Token verification error:', tokenError);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Find user with this phone number
    const user = await User.findOne({ phone }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number'
      });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Generate authentication token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data and token
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    });
  } catch (error) {
    logger.error('Phone login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during phone login'
    });
  }
};

export const registerWithPhone = async (req, res) => {
  try {
    const { phone, verificationToken, userData } = req.body;
    
    if (!phone || !verificationToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and verification token are required' 
      });
    }
    
    // Verify the token is valid
    try {
      const decodedToken = jwt.verify(verificationToken, process.env.JWT_SECRET);
      
      // Check if the token was issued for this phone number and is marked as verified
      if (!decodedToken.phone || decodedToken.phone !== phone || !decodedToken.verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid verification token'
        });
      }
    } catch (tokenError) {
      logger.error('Token verification error:', tokenError);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Check if a user with this phone already exists
    const existingUser = await User.findOne({ phone });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this phone number already exists'
      });
    }
    
    // Create a temporary user record with the verified phone
    // We'll update this with more information later in the registration process
    const user = new User({
      phone,
      isPhoneVerified: true,
      // Add any additional user data provided
      ...userData
    });
    
    await user.save();
    
    // Generate authentication token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account created with verified phone',
      user: {
        id: user._id,
        phone: user.phone,
      },
      token
    });
  } catch (error) {
    logger.error('Phone registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during phone registration'
    });
  }
};

export const completeOAuthProfile = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;

    // Validate phone number
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if phone is already in use by another account
    const existingUserWithPhone = await User.findOne({ 
      phone, 
      _id: { $ne: userId } 
    });

    if (existingUserWithPhone) {
      return res.status(400).json({ message: 'This phone number is already in use' });
    }

    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      { phone },
      { new: true }
    ).select('-password');

    // Return updated user
    res.json({
      message: 'Profile completed successfully',
      user
    });
  } catch (error) {
    logger.error('Complete OAuth Profile error:', error);
    res.status(500).json({ message: 'Error completing profile' });
  }
};

// Check if OAuth account exists
export const checkOAuthAccount = async (req, res) => {
  try {
    const { provider, providerId } = req.body;
    
    if (!provider || !providerId) {
      return res.status(400).json({ message: 'Provider and providerId are required' });
    }
    
    // Determine query based on provider
    const query = {};
    if (provider === 'google') {
      query['oauth.googleId'] = providerId;
    } else if (provider === 'facebook') {
      query['oauth.facebookId'] = providerId;
    } else {
      return res.status(400).json({ message: 'Invalid provider' });
    }
    
    // Check if account exists
    const user = await User.findOne(query).select('_id');
    
    res.json({
      exists: !!user,
      userId: user ? user._id : null
    });
  } catch (error) {
    logger.error('Check OAuth account error:', error);
    res.status(500).json({ message: 'Error checking account status' });
  }
};
