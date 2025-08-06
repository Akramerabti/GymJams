import { body, validationResult } from 'express-validator';
import { isValidPassword } from '../utils/validators.js';

// Validation middleware factory
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};

// Registration validation
export const validateRegistration = validate([
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .custom(isValidPassword),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Please enter a valid phone number')
]);

// Login validation
export const validateLogin = validate([
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]);

// Product validation
export const validateProduct = validate([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .withMessage('Product name must be less than 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn(['Clothes', 'Machines', 'Accessories', 'CardioEquipment'])
    .withMessage('Invalid category'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a positive number')
]);

// Order validation
export const validateOrder = validate([
  body('items')
    .isArray()
    .notEmpty()
    .withMessage('Order must contain items'),
  body('items.*.id')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('billingAddress')
    .notEmpty()
    .withMessage('Billing address is required')
]);

// Profile update validation
export const validateProfileUpdate = validate([
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Please enter a valid phone number')
]);

export const validatePasswordReset = validate([
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character (!@#$%^&*)')
]);

