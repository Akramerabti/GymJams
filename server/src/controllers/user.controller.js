import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';
import stripe from '../config/stripe.js';


export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const getPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('points');
    res.json({ balance: user.points });
  } catch (error) {
    console.error('Failed to fetch points:', error);
    res.status(500).json({ error: 'Failed to fetch points' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

export const getCoach = async (req, res) => {
  try {
    const coaches = await User.find({ role: 'coach' })
      .select('firstName lastName profileImage bio rating socialLinks')
      .sort({ rating: -1 }); // Sort by rating in descending order

      console.log('Coaches:', coaches);
    if (!coaches.length) {
      return res.status(404).json({ message: 'No coaches found' });
    }

    res.json(coaches);
  } catch (error) {
    logger.error('Error fetching coaches:', error);
    res.status(500).json({ message: 'Error fetching coaches' });
  }
};

export const createCoachAccount = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // Create a Stripe Connected Account for the coach
    const account = await stripe.accounts.create({
      type: 'express', // Use 'express' for simpler onboarding
      email,
      business_type: 'individual',
      individual: {
        first_name: firstName,
        last_name: lastName,
      },
      capabilities: {
        transfers: { requested: true }, // Enable transfers for payouts
      },
    });

    // Save the Stripe account ID to the coach's profile in your database
    const coach = await User.findByIdAndUpdate(req.user.id, {
      stripeAccountId: account.id,
    });

    res.json({
      message: 'Stripe account created successfully',
      accountId: account.id,
    });
  } catch (error) {
    console.error('Error creating Stripe account:', error);
    res.status(500).json({ error: 'Failed to create Stripe account' });
  }
};