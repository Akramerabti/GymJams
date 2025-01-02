import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createCustomer } from '../config/stripe.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/email.service.js';

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

export const validateToken = async (req, res) => {
  try {
    console.log('Validating token...');
    console.log('req.user:', req.user);

    if (!req.user) {
      console.error('User not found in request');
      return res.status(401).json({ message: 'User not found' });
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
    res.json(user);
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    console.log('Updating profile...');
    console.log('Request body:', req.body); // Log the request body
    console.log('User ID:', req.user.id); // Log the user ID from the request

    const { firstName, lastName, phone } = req.body;

    console.log('Updating user with data:', { firstName, lastName, phone }); // Log the update data

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone },
      { new: true }
    ).select('-password');

    console.log('Updated user:', user); // Log the updated user

    if (!user) {
      console.error('User not found'); // Log if user is not found
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile updated successfully'); // Log success
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error); // Log the error
    logger.error('Error updating profile:', error); // Log the error using the logger
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

    console.log('Validating phone:', phone);

    // Check if the phone number is provided
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if a user with the given phone number already exists
    const existingUser = await User.findOne({ phone });

    // If no user exists with this phone number, it's valid
    res.json({ isValid: !existingUser });
  } catch (error) {
    console.error('Error validating phone number:', error);
    res.status(500).json({ message: 'Error validating phone number' });
  }
};