import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createCustomer } from '../config/stripe.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail  } from '../services/email.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // Get the file path
const __dirname = path.dirname(__filename); // Get the directory name



export const logout = async (req, res) => {
  try {
    // Get the user from the request (added by authenticate middleware)
    const userId = req.user?.id;

    if (userId) {
      // Optional: Update last logout timestamp
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

    // Ensure email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        points: user.points,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
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

export const getCoach = async (req, res) => {
  try {
    const coaches = await User.find({ role: 'coach' })
      .select('firstName lastName profileImage bio rating socialLinks payoutSetupComplete')
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

    // Find the user by verification token
    const user = await User.findOne({
      $or: [
        { verificationToken: token },
        { isEmailVerified: true }
      ]
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

    res.status(200).json({ 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

