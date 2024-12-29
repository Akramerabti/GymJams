import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { createCustomer } from '../config/stripe';
import logger from '../utils/logger';

class AuthService {
  async register(userData) {
    try {
      const { email, password, firstName, lastName, phone } = userData;

      // Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create Stripe customer
      const stripeCustomer = await createCustomer({
        email,
        name: `${firstName} ${lastName}`,
        metadata: { userId: email }
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        stripeCustomerId: stripeCustomer.id
      });

      return {
        user: this.sanitizeUser(user),
        token: this.generateToken(user._id)
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      return {
        user: this.sanitizeUser(user),
        token: this.generateToken(user._id)
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user.toObject();
    return sanitizedUser;
  }
}

export default new AuthService();