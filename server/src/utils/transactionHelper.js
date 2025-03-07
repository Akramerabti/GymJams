// utils/transactionHelper.js
import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Execute a database operation within a transaction with automatic retry for transient errors
 * 
 * @param {Function} operation - Async function that performs database operations
 * @param {Object} options - Configuration options
 * @returns {Promise<*>} - Result of the operation
 */
export const withTransaction = async (operation, options = {}) => {
  const {
    maxRetries = 5,
    logPrefix = 'Transaction',
    initialDelayMs = 100,
  } = options;
  
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    const session = await mongoose.startSession();
    let result;
    
    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' }
      });
      
      if (retryCount > 0) {
        logger.info(`${logPrefix}: Retry attempt ${retryCount} of ${maxRetries}`);
      }
      
      // Execute the operation within the transaction
      result = await operation(session);
      
      // If we get here without error, commit the transaction
      await session.commitTransaction();
      logger.debug(`${logPrefix}: Transaction completed successfully`);
      
      return result;
    } catch (error) {
      // Always abort the transaction on error
      logger.debug(`${logPrefix}: Error encountered, aborting transaction: ${error.message}`);
      await session.abortTransaction();
      
      // Check if this is a retryable error
      const isTransient = isTransientError(error);
      
      if (isTransient && retryCount < maxRetries) {
        retryCount++;
        
        // Calculate backoff delay with exponential increase and jitter
        const backoffMs = calculateBackoff(retryCount, initialDelayMs);
        
        logger.debug(`${logPrefix}: Transient error encountered. Retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      } else {
        // This is either a non-transient error or we've exhausted retries
        logger.error(`${logPrefix}: Operation failed - ${retryCount > 0 ? `after ${retryCount} retries` : 'on first attempt'}: ${error}`);
        throw error;
      }
    } finally {
      session.endSession();
    }
  }
  
  // This should never be reached as the last iteration will either return or throw
  throw new Error(`${logPrefix}: Transaction failed after ${maxRetries} attempts`);
};

/**
 * Determine if an error is transient and can be retried
 */
const isTransientError = (error) => {
  // MongoDB error codes that indicate transient errors
  const transientErrorCodes = [
    112,  // WriteConflict
    251,  // TransactionAborted
  ];
  
  return (
    transientErrorCodes.includes(error.code) ||
    (error.errorLabels && (
      error.errorLabels.includes('TransientTransactionError') ||
      error.errorLabels.includes('RetryableWriteError')
    )) ||
    error.message?.includes('Write conflict') ||
    error.message?.includes('Transaction aborted') ||
    error.message?.includes('interrupted')
  );
};

/**
 * Calculate backoff time with exponential increase and jitter
 */
const calculateBackoff = (retryCount, initialDelayMs) => {
  // Exponential backoff: initialDelay * 2^retryCount
  const baseDelay = initialDelayMs * Math.pow(2, retryCount - 1);
  
  // Add jitter to avoid thundering herd problem (±30%)
  const jitterFactor = 0.7 + (Math.random() * 0.6); // Random between 0.7 and 1.3
  
  // Apply jitter and cap at 30 seconds
  return Math.min(baseDelay * jitterFactor, 30000);
};

/**
 * Execute a database operation with optimistic concurrency control
 * 
 * @param {Function} operation - Async function that performs database operations
 * @param {Object} options - Configuration options
 * @returns {Promise<*>} - Result of the operation
 */
export const withOptimisticConcurrency = async (operation, options = {}) => {
  const {
    maxRetries = 5,
    logPrefix = 'OptimisticConcurrency',
    initialDelayMs = 50,
  } = options;
  
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      if (retryCount > 0) {
        logger.info(`${logPrefix}: Retry attempt ${retryCount} of ${maxRetries}`);
      }
      
      // Execute the operation
      const result = await operation();
      return result;
    } catch (error) {
      // Check if this is a concurrent modification error
      const isConcurrencyConflict = 
        error.code === 11000 || // Duplicate key error (possible on upserts)
        error.message?.includes('No matching document found') ||
        error.message?.includes('The specified version is invalid');
      
      if (isConcurrencyConflict && retryCount < maxRetries) {
        retryCount++;
        
        // Calculate backoff delay
        const backoffMs = calculateBackoff(retryCount, initialDelayMs);
        
        logger.debug(`${logPrefix}: Concurrency conflict detected. Retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      } else {
        // Non-retryable error or exhausted retries
        logger.error(`${logPrefix}: Operation failed after ${retryCount} retries: ${error}`);
        throw error;
      }
    }
  }
  
  throw new Error(`${logPrefix}: Operation failed after ${maxRetries} attempts`);
};

/**
 * Execute a database update with built-in optimistic concurrency control using versioning
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} query - Query to find the document
 * @param {Object} update - Update to apply
 * @param {Object} options - Options for findOneAndUpdate
 * @returns {Promise<Document>} - Updated document
 */
export const updateWithVersioning = async (model, query, update, options = {}) => {
  const { maxRetries = 5 } = options;
  const updateOptions = { ...options, new: true };
  
  return withOptimisticConcurrency(async () => {
    // First fetch the document to get its current state
    const doc = await model.findOne(query);
    if (!doc) return null;
    
    // Add versioning to the query
    const versionedQuery = {
      ...query,
      __v: doc.__v // This ensures we only update if no one else has changed it
    };
    
    // Add version incrementing to the update
    const versionedUpdate = {
      ...update,
      $inc: { ...(update.$inc || {}), __v: 1 } // Increment the version
    };
    
    // Attempt the update with versioning
    const result = await model.findOneAndUpdate(
      versionedQuery,
      versionedUpdate,
      updateOptions
    );
    
    // If result is null, it means the document was modified by another process
    if (!result) {
      throw new Error('Concurrent modification detected');
    }
    
    return result;
  }, { maxRetries });
};