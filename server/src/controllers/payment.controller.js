import User from '../models/User.js';
import logger from '../utils/logger.js';

export const addPaymentMethod = async (req, res) => {
    try {
      const { type, cardNumber, expirationDate, paypalEmail, bankAccount, isDefault } = req.body;
      const userId = req.user._id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // If the new payment method is set as default, remove the default flag from all other methods
      if (isDefault) {
        user.paymentMethods.forEach((method) => {
          method.isDefault = false;
        });
      }
  
      const newPaymentMethod = {
        type,
        cardNumber,
        expirationDate,
        paypalEmail,
        bankAccount,
        isDefault,
      };
  
      user.paymentMethods.push(newPaymentMethod);
      await user.save();
  
      res.status(201).json({ message: 'Payment method added successfully', paymentMethods: user.paymentMethods });
    } catch (error) {
      logger.error('Error adding payment method:', error);
      res.status(500).json({ message: 'Error adding payment method' });
    }
  };

export const getPaymentMethods = async (req, res) => {
    try {
      const userId = req.user._id; // Use the authenticated user's ID
      const user = await User.findById(userId).select('paymentMethods');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(user.paymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ message: 'Error fetching payment methods' });
    }
  };
export const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, cardNumber, expirationDate, paypalEmail, bankAccount, isDefault } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paymentMethod = user.paymentMethods.id(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    paymentMethod.type = type || paymentMethod.type;
    paymentMethod.cardNumber = cardNumber || paymentMethod.cardNumber;
    paymentMethod.expirationDate = expirationDate || paymentMethod.expirationDate;
    paymentMethod.paypalEmail = paypalEmail || paymentMethod.paypalEmail;
    paymentMethod.bankAccount = bankAccount || paymentMethod.bankAccount;
    paymentMethod.isDefault = isDefault || paymentMethod.isDefault;

    await user.save();

    res.status(200).json({ message: 'Payment method updated successfully', paymentMethods: user.paymentMethods });
  } catch (error) {
    logger.error('Error updating payment method:', error);
    res.status(500).json({ message: 'Error updating payment method' });
  }
};

export const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params; // Payment method ID
    const userId = req.user._id; // Authenticated user ID

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and remove the payment method
    const paymentMethod = user.paymentMethods.id(id);
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    user.paymentMethods.pull(id); // Remove the payment method
    await user.save();

    res.status(200).json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    logger.error('Error deleting payment method:', error);
    res.status(500).json({ message: 'Error deleting payment method' });
  }
};