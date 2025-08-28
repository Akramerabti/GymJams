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
import path from 'path';
import { fileURLToPath } from 'url';
import { subscribe } from 'diagnostics_channel';
import supabaseStorageService from '../services/supabaseStorage.service.js';

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

    // Format phone to international format if needed
    let formattedPhone = phone;
    if (typeof phone === 'string') {
      let cleanPhone = phone.trim();
      if (!cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
          formattedPhone = `+1${cleanPhone}`;
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
          formattedPhone = `+${cleanPhone}`;
        } else {
          formattedPhone = `+1${cleanPhone}`;
        }
      }
    }
    
    console.log('📝 REGISTRATION ATTEMPT:', {
      email: email ? email.toLowerCase() : 'NO EMAIL PROVIDED',
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
      firstName,
      lastName,
      phone,
      timestamp: new Date().toISOString()
    });


    // Check if all required fields are provided
    if (!email || !password || !firstName || !lastName || !formattedPhone) {
      console.log('❌ REGISTRATION FAILED: Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists

    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: formattedPhone }
      ]
    });


    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        console.log('❌ REGISTRATION FAILED: Email already exists:', email.toLowerCase());
        return res.status(400).json({ message: 'This email is already registered' });
      }
      if (existingUser.phone === formattedPhone) {
        console.log('❌ REGISTRATION FAILED: Phone already exists:', formattedPhone);
        return res.status(400).json({ message: 'This phone number is already registered' });
      }
    }
    
    console.log('🔐 Hashing password for registration...');
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('🔑 Registration password hash details:', {
      originalPassword: password,
      salt: salt,
      hashedPassword: hashedPassword,
      hashLength: hashedPassword.length
    });
    
    // Test the hash immediately to verify it works
    const testMatch = await bcrypt.compare(password, hashedPassword);
    console.log('🧪 Registration hash verification test:', testMatch);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log('💳 Creating Stripe customer...');
    // Create Stripe customer
    const stripeCustomer = await createCustomer({
      email,
      name: `${firstName} ${lastName}`,
      metadata: { userId: email }
    });

    console.log('👤 Creating user in database...');
    // Create user in the database

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone: formattedPhone,
      stripeCustomerId: stripeCustomer.id,
      verificationToken,
      verificationTokenExpires
    });
    
    console.log('✅ User created successfully:', {
      userId: user._id,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    console.log('📧 Sending verification email...');
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
    
    console.log('🔐 LOGIN ATTEMPT:', {
      email: email ? email.toLowerCase() : 'NO EMAIL PROVIDED',
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    });
    
    // Email and password validation
    if (!email || !password) {
      console.log('❌ LOGIN FAILED: Missing email or password', { email: !!email, password: !!password });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('🔍 Searching for user with email:', email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ LOGIN FAILED: User not found for email:', email.toLowerCase());
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('✅ User found with email:', user.email);

    console.log('👤 User found:', {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      hasStoredPassword: !!user.password,
      storedPasswordLength: user.password ? user.password.length : 0,
      lastLogin: user.lastLogin
    });

    console.log('🔑 Comparing passwords...');
    console.log('  - Provided password:', password);
    console.log('  - Stored password hash:', user.password);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 Password comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ LOGIN FAILED: Password mismatch for user:', user.email);
      
      // Additional debugging - let's test the hash
      console.log('🧪 Testing password hash generation:');
      const testHash = await bcrypt.hash(password, 10);
      console.log('  - Test hash for provided password:', testHash);
      const testMatch = await bcrypt.compare(password, testHash);
      console.log('  - Test hash matches provided password:', testMatch);
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      console.log('❌ LOGIN FAILED: Email not verified for user:', user.email);
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    console.log('✅ Password verified successfully for user:', user.email);

    // Handle first login bonus and onboarding
    const isFirstLogin = !user.hasReceivedFirstLoginBonus;
    console.log('🎁 First login bonus check:', { isFirstLogin, currentPoints: user.points });
    
    if (isFirstLogin) {
      user.points += 100;
      user.hasReceivedFirstLoginBonus = true;
      console.log('🎁 First login bonus awarded! New points:', user.points);
      await user.save();
    }

    // Check if user has complete location data (especially for coaches)
    const hasCompleteLocation = !!(user.location?.lat && user.location?.lng && user.location?.city);
    const needsLocationUpdate = (user.role === 'coach' || user.role === 'taskforce') && !hasCompleteLocation;
    
    console.log('🗺️ Location check:', {
      role: user.role,
      hasCompleteLocation,
      needsLocationUpdate,
      location: user.location
    });

    // Update last login
    user.lastLogin = new Date();
    
    // Initialize empty location object for coaches/taskforce without location
    if (needsLocationUpdate && !user.location) {
      console.log('🗺️ Initializing empty location for coach/taskforce');
      user.location = {
        isVisible: true,
        updatedAt: new Date()
      };
    }
    
    console.log('💾 Saving user updates...');
    await user.save();
    console.log('✅ User saved successfully');

    logger.info(`User ${user.firstName} ${user.lastName} (${user.role}) logged in`, {
      userId: user._id,
      hasCompleteLocation,
      needsLocationUpdate,
      locationData: user.location ? {
        hasCoordinates: !!(user.location.lat && user.location.lng),
        hasCity: !!user.location.city,
        isVisible: user.location.isVisible
      } : null
    });

    console.log('🔐 Generating JWT token...');
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('✅ JWT token generated successfully');

    console.log('📤 Sending successful login response...');
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
        subscription: user.subscription,
        location: user.location,
        hasCompleteLocation,
        needsLocationUpdate
      }
    });
  } catch (error) {
    console.log('💥 LOGIN ERROR:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
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
    //('Validating token...');
    //('req.user:', req.user);

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
    }    // Profile image is already a full URL from Supabase, no need to modify
    // (Legacy code that was adding base URL to relative paths has been removed)

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
    user.phone = phone || user.phone;    // Update profile image if a file was uploaded
    if (req.file) {
      try {
        // Delete old image from Supabase if it exists
        if (user.profileImage) {
          const oldFilePath = supabaseStorageService.extractFilePathFromUrl(user.profileImage);
          if (oldFilePath) {
            try {
              await supabaseStorageService.deleteFile(oldFilePath);
              //('Old image deleted successfully from Supabase:', oldFilePath);
            } catch (deleteError) {
              console.error('Failed to delete old image from Supabase:', deleteError);
              // Continue with upload even if delete fails
            }
          }
        }

        // Upload new image to Supabase
        const uploadResult = await supabaseStorageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          'profile-images' // folder name
        );

        // Save the Supabase URL
        user.profileImage = uploadResult.url;
        //('New image uploaded to Supabase:', uploadResult.url);
      } catch (uploadError) {
        console.error('Error uploading profile image to Supabase:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload profile image',
          error: uploadError.message 
        });
      }
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

      //('Specialties:', specialties);
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

    //('Verifying email...', token);

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
    
    console.log('🔑 PASSWORD RESET ATTEMPT:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
      timestamp: new Date().toISOString()
    });

    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('❌ PASSWORD RESET FAILED: Invalid or expired token');
      return res.status(400).json({ 
        message: 'Password reset token is invalid or has expired' 
      });
    }
    
    console.log('👤 User found for password reset:', {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });

    console.log('🔐 Hashing new password...');
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('🔑 Password hash details:', {
      originalPassword: password,
      salt: salt,
      hashedPassword: hashedPassword,
      hashLength: hashedPassword.length
    });

    // Test the hash immediately to verify it works
    const testMatch = await bcrypt.compare(password, hashedPassword);
    console.log('🧪 Hash verification test:', testMatch);

    // Update user's password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    console.log('💾 Saving user with new password...');
    await user.save();
    console.log('✅ Password reset completed successfully');

    // You might want to invalidate all existing sessions here
    // depending on your security requirements
    //('Password reset successfully', user);
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
    const { userLat, userLng, maxDistance = 50 } = req.query;
    
    logger.info('Coach fetch request:', { userLat, userLng, maxDistance });
    
    // Build query for coaches - include all active coaches
    const query = { 
      role: 'coach',
      isEmailVerified: true,
      coachStatus: 'available'
    };

    const coaches = await User.find(query)
      .select('firstName lastName profileImage bio rating socialLinks payoutSetupComplete specialties location')
      .sort({ rating: -1 }); // Sort by rating in descending order

    logger.info(`Found ${coaches.length} total coaches`);
    
    if (!coaches.length) {
      return res.status(404).json({ message: 'No coaches found' });
    }

    // Debug: Log coach location data
    coaches.forEach(coach => {
      logger.info(`Coach ${coach._id} (${coach.firstName} ${coach.lastName}) location:`, {
        hasLocation: !!coach.location,
        locationData: coach.location,
        hasCoordinates: !!(coach.location?.lat && coach.location?.lng),
        hasCity: !!coach.location?.city
      });
    });

    // ONLY include coaches with complete location data (lat, lng, city)
    const coachesWithLocation = coaches.filter(coach => 
      coach.location && 
      coach.location.lat && 
      coach.location.lng && 
      coach.location.city
    );
    
    const coachesWithoutLocation = coaches.filter(coach => 
      !coach.location || 
      !coach.location.lat || 
      !coach.location.lng || 
      !coach.location.city
    );

    logger.info(`Coaches with complete location: ${coachesWithLocation.length}`);
    logger.info(`Coaches without complete location: ${coachesWithoutLocation.length} (EXCLUDED)`);

    // Only return coaches with complete location data
    if (coachesWithLocation.length === 0) {
      logger.warn('No coaches with complete location data found');
      return res.status(404).json({ message: 'No coaches with valid location data available' });
    }

    let processedCoaches = [];

    // If user provided location, filter coaches by distance
    if (userLat && userLng) {
      const userLocation = {
        lat: parseFloat(userLat),
        lng: parseFloat(userLng)
      };
      
      // Import location service
      const { getCoachesWithinRadius, formatLocationForDisplay } = await import('../services/location.service.js');
      
      // Convert coaches to plain objects before processing with location service
      const coachPlainObjects = coachesWithLocation.map(coach => coach.toObject());
      
      // Try 50 miles first, then expand to 100 miles if needed
      let nearbyCoaches = getCoachesWithinRadius(userLocation, coachPlainObjects, 50);
      let searchRadius = 50;
      
      if (nearbyCoaches.length === 0) {
        nearbyCoaches = getCoachesWithinRadius(userLocation, coachPlainObjects, 100);
        searchRadius = 100;
        logger.info(`No coaches within 50 miles, expanded to 100 miles: found ${nearbyCoaches.length} coaches`);
      } else {
        logger.info(`Found ${nearbyCoaches.length} coaches within 50 miles`);
      }
      
      if (nearbyCoaches.length > 0) {
        // Sort by distance (closest first), then by rating
        nearbyCoaches.sort((a, b) => {
          if (a.distance !== b.distance) {
            return a.distance - b.distance; // Closest first
          }
          return (b.rating || 0) - (a.rating || 0); // Higher rating if same distance
        });
        
        // Format location for display with distance
        processedCoaches = nearbyCoaches.map(coach => ({
          ...coach, // coach is already a plain object from location service
          locationDisplay: formatLocationForDisplay(coach.location, coach.distance),
          distance: Math.round(coach.distance * 10) / 10, // Round to 1 decimal place
          hasLocation: true,
          searchRadius: searchRadius
        }));
        
        logger.info(`Returning ${processedCoaches.length} processed coaches`);
        logger.info('Sample coach data:', {
          hasLocation: processedCoaches[0]?.hasLocation,
          locationDisplay: processedCoaches[0]?.locationDisplay,
          name: `${processedCoaches[0]?.firstName} ${processedCoaches[0]?.lastName}`,
          distance: processedCoaches[0]?.distance
        });
      } else {
        // No coaches within 100 miles - show all coaches without distance info
        logger.info('No coaches within 100 miles, showing all available coaches');
        processedCoaches = coachesWithLocation.map(coach => ({
          ...coach.toObject(),
          locationDisplay: coach.location.city,
          distance: null,
          hasLocation: true,
          searchRadius: null
        }));
      }
    } else {
      // No user location provided - show all coaches with location data
      processedCoaches = coachesWithLocation.map(coach => ({
        ...coach.toObject(),
        locationDisplay: coach.location.city,
        distance: null,
        hasLocation: true
      }));
    }

    // Remove sensitive location data before sending to client
    processedCoaches = processedCoaches.map(coach => {
      const coachData = { ...coach };
      if (coachData.location) {
        // Only keep city and isVisible flag, remove exact coordinates
        coachData.location = {
          city: coachData.location.city || null,
          isVisible: coachData.location.isVisible || false
        };
      }
      return coachData;
    });

    logger.info(`Returning ${processedCoaches.length} processed coaches`);
    logger.info('Sample coach data:', processedCoaches[0] ? {
      id: processedCoaches[0]._id,
      name: `${processedCoaches[0].firstName} ${processedCoaches[0].lastName}`,
      locationDisplay: processedCoaches[0].locationDisplay,
      hasLocation: processedCoaches[0].hasLocation,
      location: processedCoaches[0].location
    } : 'No coaches to sample');

    res.json(processedCoaches);
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
      .select('firstName lastName profileImage bio rating socialLinks specialties payoutSetupComplete location');

    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Remove sensitive location data before sending to client
    const coachData = coach.toObject();
    if (coachData.location) {
      // Only keep city and isVisible flag, remove exact coordinates
      coachData.location = {
        city: coachData.location.city || null,
        isVisible: coachData.location.isVisible || false
      };
    }

    // Profile image is already a full URL from Supabase, no need to modify
    // (Legacy code that was adding base URL to relative paths has been removed)

    res.json(coachData);
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

    // Delete GymBros profile and related data with comprehensive cleanup
    try {
      // Import GymBros models
      const { default: GymBrosProfile } = await import('../models/GymBrosProfile.js');
      const { default: GymBrosPreference } = await import('../models/GymBrosPreference.js');
      const { default: GymBrosMatch } = await import('../models/GymBrosMatch.js');
      const { default: GymBrosGroup } = await import('../models/GymBrosGroup.js');
      const { default: Gym } = await import('../models/Gym.js');

      // Find the user's GymBros profile
      const gymBrosProfile = await GymBrosProfile.findOne({ userId }).session(session);
      
      if (gymBrosProfile) {
        logger.info(`Found GymBros profile for user deletion: ${gymBrosProfile._id}`);
        
        // STEP 1: Clean up gym memberships and update gym member counts
        if (gymBrosProfile.gyms && gymBrosProfile.gyms.length > 0) {
          const gymIds = gymBrosProfile.gyms.map(g => g.gym);
          
          // Update member counts for all gyms the user was a member of
          await Gym.updateMany(
            { _id: { $in: gymIds } },
            { $inc: { memberCount: -1 } },
            { session }
          );
          
          logger.info(`Updated member counts for ${gymIds.length} gyms`);
        }

        // STEP 2: Handle group memberships and ownership
        const profileId = gymBrosProfile._id;
        
        // Find all groups where the user is a member
        const memberGroups = await GymBrosGroup.find({
          'members.profile': profileId,
          'members.isActive': true
        }).session(session);

        // Find all groups where the user is the admin
        const adminGroups = await GymBrosGroup.find({
          admin: profileId,
          isActive: true
        }).session(session);

        // Remove user from groups where they're a member (but not admin)
        for (const group of memberGroups) {
          if (!group.admin.equals(profileId)) {
            // Remove from members array
            group.members = group.members.filter(m => 
              !m.profile.equals(profileId)
            );
            
            // Update member count
            group.stats.activeMembers = group.members.filter(m => m.isActive).length;
            
            await group.save({ session });
            logger.info(`Removed user from group: ${group.name}`);
          }
        }

        // Handle groups where user is admin
        for (const group of adminGroups) {
          const activeMembers = group.members.filter(m => 
            m.isActive && !m.profile.equals(profileId)
          );

          if (activeMembers.length > 0) {
            // Transfer ownership to the longest-standing moderator or member
            const newAdmin = activeMembers
              .filter(m => m.role === 'moderator')
              .sort((a, b) => a.joinedAt - b.joinedAt)[0] || 
              activeMembers.sort((a, b) => a.joinedAt - b.joinedAt)[0];

            if (newAdmin) {
              // Transfer admin rights
              group.admin = newAdmin.profile;
              newAdmin.role = 'admin';
              
              // Remove the deleted user from members
              group.members = group.members.filter(m => 
                !m.profile.equals(profileId)
              );
              
              // Update stats
              group.stats.activeMembers = group.members.filter(m => m.isActive).length;
              
              await group.save({ session });
              logger.info(`Transferred group ownership of "${group.name}" to user: ${newAdmin.profile}`);
            } else {
              // No members left, deactivate the group
              group.isActive = false;
              await group.save({ session });
              logger.info(`Deactivated empty group: ${group.name}`);
            }
          } else {
            // No other members, deactivate the group
            group.isActive = false;
            await group.save({ session });
            logger.info(`Deactivated empty group: ${group.name}`);
          }
        }

        // STEP 3: Clean up matches
        await GymBrosMatch.updateMany(
          { 
            $or: [
              { users: userId },
              { users: profileId }
            ]
          },
          { $set: { active: false } },
          { session }
        );
        logger.info(`Deactivated matches for profile: ${profileId}`);

        // STEP 4: Delete preferences and profile
        await GymBrosPreference.findOneAndDelete({ userId }, { session });
        await GymBrosProfile.findByIdAndDelete(profileId, { session });
        
        logger.info(`Deleted GymBros profile and completed cleanup for user: ${userId}`);
      } else {
        logger.info(`No GymBros profile found for user: ${userId}`);
      }
    } catch (gymBrosError) {
      logger.error('Error during GymBros profile cleanup in account deletion:', gymBrosError);
      // Don't abort transaction for GymBros deletion errors
      // Log error but continue with main user account deletion
    }

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
    const { phone, lastName, tempToken } = req.body;
    
    //('Complete OAuth Profile - Request:', { phone, lastName, tempToken: !!tempToken, hasUser: !!req.user });

    // Handle temporary token case (new user creation from OAuth profile)
    if (tempToken) {
      let decoded;
      let oauthProfile;
      
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        
        if (!decoded.isTemporary || !decoded.requiresCompletion || !decoded.oauthProfile) {
          return res.status(400).json({ message: 'Invalid temporary token' });
        }

        oauthProfile = decoded.oauthProfile;
        //('Creating new user from OAuth profile:', oauthProfile);
      } catch (tokenError) {
        console.error('Temporary token verification error:', tokenError);
        return res.status(400).json({ 
          message: 'Invalid or expired temporary token. Please restart the OAuth process.',
          requiresReauth: true
        });
      }

      // Validate required fields are provided
      if (!phone || !lastName) {
        // Generate a new temporary token with the same OAuth profile to allow retry
        const newTempToken = jwt.sign({
          oauthProfile: oauthProfile,
          isTemporary: true,
          requiresCompletion: true
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(400).json({ 
          message: 'Phone number and last name are required to complete registration',
          tempToken: newTempToken // Provide new token for retry
        });
      }

      // Format the phone number
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        const cleanPhone = formattedPhone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
          formattedPhone = `+1${cleanPhone}`;
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
          formattedPhone = `+${cleanPhone}`;
        } else {
          formattedPhone = `+1${cleanPhone}`;
        }
      }

      // Validate phone format
      const phoneRegex = /^\+\d{10,15}$/;
      if (!phoneRegex.test(formattedPhone)) {
        // Generate a new temporary token to allow retry
        const newTempToken = jwt.sign({
          oauthProfile: oauthProfile,
          isTemporary: true,
          requiresCompletion: true
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(400).json({ 
          message: 'Please enter a valid phone number. Format: +15149127545',
          tempToken: newTempToken // Provide new token for retry
        });
      }

      // Check if phone or email is already in use
      const existingUser = await User.findOne({
        $or: [
          { email: oauthProfile.email.toLowerCase() },
          { phone: formattedPhone }
        ]
      });

      if (existingUser) {
        // Generate a new temporary token to allow retry with different phone
        const newTempToken = jwt.sign({
          oauthProfile: oauthProfile,
          isTemporary: true,
          requiresCompletion: true
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        if (existingUser.email === oauthProfile.email.toLowerCase()) {
          return res.status(400).json({ 
            message: 'This email is already registered',
            tempToken: newTempToken
          });
        }
        if (existingUser.phone === formattedPhone) {
          return res.status(400).json({ 
            message: 'This phone number is already registered. Please use a different phone number.',
            tempToken: newTempToken,
            field: 'phone'
          });
        }
      }      // Create Stripe customer
      const stripeCustomer = await createCustomer({
        email: oauthProfile.email,
        name: `${oauthProfile.firstName} ${lastName.trim()}`,
        metadata: { 
          userId: oauthProfile.email,
          provider: oauthProfile.provider
        }
      });

      // Create the new user with complete profile
      const newUser = await User.create({
        email: oauthProfile.email.toLowerCase(),
        firstName: oauthProfile.firstName,
        lastName: lastName.trim(),
        phone: formattedPhone,
        profileImage: oauthProfile.profileImage || '',
        stripeCustomerId: stripeCustomer.id,
        isEmailVerified: true, // Trust OAuth provider email verification
        oauth: {
          googleId: oauthProfile.providerId, // Use providerId from the JWT token
          lastProvider: oauthProfile.provider,
          isIncomplete: false,
          needsPhoneNumber: false,
          needsLastName: false
        },
        points: 100, // First time registration bonus
        hasReceivedFirstLoginBonus: true
      });


      // Generate authentication token
      const token = jwt.sign(
        { id: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        message: 'Profile completed successfully! You received 100 bonus points!',
        user: {
          id: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          points: newUser.points,
          isEmailVerified: newUser.isEmailVerified,
          hasReceivedFirstLoginBonus: newUser.hasReceivedFirstLoginBonus,
          role: newUser.role
        },
        token,
        isComplete: true,
        bonusAwarded: true
      });
    }

    // Handle existing user profile completion
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id;
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateFields = {};
    const oauthUpdateFields = {};

    // Validate and update phone if provided
    if (phone) {
      if (phone.trim() === '') {
        return res.status(400).json({ message: 'Phone number cannot be empty' });
      }

      // Format the phone number
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        const cleanPhone = formattedPhone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
          formattedPhone = `+1${cleanPhone}`;
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
          formattedPhone = `+${cleanPhone}`;
        } else {
          formattedPhone = `+1${cleanPhone}`;
        }
      }
      
      // Validate final format
      const phoneRegex = /^\+\d{10,15}$/;
      if (!phoneRegex.test(formattedPhone)) {
        return res.status(400).json({ 
          message: 'Please enter a valid phone number. Format: +15149127545' 
        });
      }

      // Check if phone is already in use by another account
      const existingUserWithPhone = await User.findOne({ 
        phone: formattedPhone, 
        _id: { $ne: userId } 
      });

      if (existingUserWithPhone) {
        return res.status(400).json({ message: 'This phone number is already in use' });
      }

      updateFields.phone = formattedPhone;
      oauthUpdateFields['oauth.needsPhoneNumber'] = false;
    }

    // Validate and update lastName if provided
    if (lastName !== undefined) {
      if (lastName.trim() === '') {
        return res.status(400).json({ message: 'Last name cannot be empty' });
      }
      updateFields.lastName = lastName.trim();
      oauthUpdateFields['oauth.needsLastName'] = false;
    }

    // Check if profile will be complete after this update
    const stillNeedsPhone = currentUser.oauth?.needsPhoneNumber && !phone;
    const stillNeedsLastName = currentUser.oauth?.needsLastName && lastName === undefined;
    const isStillIncomplete = stillNeedsPhone || stillNeedsLastName;

    oauthUpdateFields['oauth.isIncomplete'] = isStillIncomplete;

    // If profile is now complete and user hasn't received first login bonus, give it
    let bonusAwarded = false;
    if (!isStillIncomplete && !currentUser.hasReceivedFirstLoginBonus) {
      updateFields.points = (currentUser.points || 0) + 100;
      updateFields.hasReceivedFirstLoginBonus = true;
      bonusAwarded = true;
    }

    // Combine all update fields
    const allUpdateFields = { ...updateFields, ...oauthUpdateFields };

    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      allUpdateFields,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return updated user with success message
    const responseMessage = bonusAwarded
      ? 'Profile completed successfully! You received 100 bonus points!'
      : 'Profile updated successfully';    res.json({
      message: responseMessage,
      user,
      isComplete: !isStillIncomplete,
      bonusAwarded
    });
  } catch (error) {
    console.error('Complete OAuth Profile error:', error);
    
    // Provide detailed error information for debugging
    let errorMessage = 'Error completing profile';
    let errorDetails = {};
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      errorMessage = 'Validation failed';
      errorDetails = {
        type: 'validation',
        fields: Object.keys(error.errors),
        details: error.errors
      };
    } else if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      errorMessage = `This ${field} is already registered`;
      errorDetails = {
        type: 'duplicate',
        field: field,
        value: error.keyValue[field]
      };
    } else if (error.name === 'JsonWebTokenError') {
      // JWT token error
      errorMessage = 'Invalid authentication token';
      errorDetails = {
        type: 'token',
        details: error.message
      };
    } else if (error.name === 'TokenExpiredError') {
      // JWT token expired
      errorMessage = 'Authentication token has expired';
      errorDetails = {
        type: 'token_expired',
        expiredAt: error.expiredAt
      };
    } else if (error.message) {
      // Use the original error message if available
      errorMessage = error.message;
      errorDetails = {
        type: 'general',
        originalError: error.name || 'Unknown'
      };
    }
    
    // Log full error for server debugging
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    res.status(500).json({ 
      message: errorMessage,
      error: errorDetails,
      debug: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code,
        originalMessage: error.message
      } : undefined
    });
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

// Cleanup broken profile image URLs
export const cleanupProfileImage = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Clear the broken profile image URL from database
    await User.findByIdAndUpdate(userId, {
      $unset: { profileImage: 1 }
    });

    logger.info(`Cleaned up broken profile image for user ${userId}`);
    
    res.json({ 
      message: 'Profile image URL cleaned up successfully',
      profileImage: null 
    });
  } catch (error) {
    logger.error('Cleanup profile image error:', error);
    res.status(500).json({ message: 'Error cleaning up profile image' });
  }
};

