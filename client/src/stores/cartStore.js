// Enhanced cart store with debouncing and throttling for API calls
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';
import { toast } from 'sonner';
import inventoryService from '../services/inventory.service';
import { usePoints } from '../hooks/usePoints';

// Helper for debouncing functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Helper for throttling functions
const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

const calculateTotals = (items, pointsDiscount = 0) => {
  // Fixed calculation to properly account for item quantities
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Determine shipping cost based on subtotal
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax rate
  
  // Apply points discount to the total
  const discountedTotal = Math.max(0, subtotal + shipping + tax - pointsDiscount);
  
  return {
    subtotal,
    shipping,
    tax,
    pointsDiscount: pointsDiscount || 0,
    total: discountedTotal,
  };
};

/**
 * Exponential backoff with jitter for retrying API calls
 * @param {Function} apiCall - Async function to retry
 * @param {Object} options - Options for retry
 * @returns {Promise} - Result of the API call
 */
const retryWithBackoff = async (apiCall, options = {}) => {
  const { maxRetries = 3, baseDelay = 200, jitterRange = 100 } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's a 4xx client error (except 429 rate limit)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * jitterRange;
      console.log(`Attempt ${attempt + 1} failed. Retrying in ${Math.round(delay)}ms...`);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Keep track of validation requests to avoid duplicates
let stockValidationInProgress = false;
let lastValidationTime = 0;
const VALIDATION_THROTTLE = 2000; // 2 seconds

// Store the last validation result
let lastValidationResult = null;

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,
      stockWarnings: [],
      checkoutData: null,
      processingPayment: false,
      pointsDiscount: 0,
      pointsUsed: 0,
    
      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          const updatedItems = items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          set({ items: updatedItems });
        } else {
          set({ items: [...items, { ...product, quantity }] });
        }
        
        toast.success(`${product.name} has been added to your cart.`);
        
        // Trigger stock validation after a delay to avoid immediate API call
        get().debouncedValidateStock();
      },

      updatePointsDiscount: (points, discountAmount) => {
        set({ 
          pointsUsed: points,
          pointsDiscount: discountAmount 
        });
      },
      
      removePointsDiscount: () => {
        set({ 
          pointsUsed: 0,
          pointsDiscount: 0 
        });
      },

      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== productId) });
        toast.success('Item has been removed from your cart.');
      },

      /**
       * Update quantity of an item in the cart
       * @param {String} productId - ID of the product
       * @param {Number} quantity - New quantity
       * @returns {Boolean} - Success status
       */
      updateQuantity: async (productId, quantity) => {
        if (quantity < 1) return false;
        
        try {
          // Get current item quantity from state
          const { items } = get();
          const currentItem = items.find(item => item.id === productId);
          
          // Skip validation if we're reducing quantity
          if (currentItem && quantity < currentItem.quantity) {
            const updatedItems = items.map(item =>
              item.id === productId
                ? { ...item, quantity }
                : item
            );
            
            set({ items: updatedItems });
            return true;
          }
          
          // For quantity increases, check stock
          const stockCheck = await inventoryService.validateStock([{ 
            id: productId, 
            quantity 
          }]);
          
          if (!stockCheck.valid) {
            const item = stockCheck.outOfStockItems[0];
            toast.error(
              `Cannot update quantity: ${item.available === 0 
                ? 'Out of stock' 
                : `Only ${item.available} available`}`
            );
            return false;
          }
          
          const updatedItems = items.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          );
          
          set({ items: updatedItems });
          return true;
        } catch (error) {
          console.error('Error updating quantity:', error);
          toast.error('Could not update quantity');
          return false;
        }
      },

      /**
       * Clear the cart and reset checkout data
       */
      clearCart: () => set({ 
        items: [], 
        checkoutData: null, 
        stockWarnings: [],
        error: null 
      }),

      /**
       * Validate stock availability for all items in the cart
       * @returns {Boolean} - Whether all items are in stock
       */
      validateCartStock: async () => {
        const { items } = get();
        
        // If validation already in progress, don't start another
        if (stockValidationInProgress) {
          console.log('Stock validation already in progress, using last result');
          return lastValidationResult;
        }
        
        // If we validated recently, return the last result
        const now = Date.now();
        if (now - lastValidationTime < VALIDATION_THROTTLE && lastValidationResult !== null) {
          console.log('Using cached stock validation result');
          return lastValidationResult;
        }
        
        stockValidationInProgress = true;
        set({ loading: true, error: null });

        try {
          const response = await retryWithBackoff(() => 
            inventoryService.validateStock(
              items.map(({ id, quantity }) => ({ id, quantity }))
            )
          );

          if (!response.valid) {
            set({ 
              stockWarnings: response.outOfStockItems,
              error: 'Some items in your cart are out of stock or have insufficient quantity'
            });
            lastValidationResult = false;
            return false;
          }
          
          lastValidationResult = true;
          return true;
        } catch (error) {
          console.error('Stock validation error:', error);
          set({ 
            error: 'Failed to validate stock. Please try again.' 
          });
          lastValidationResult = false;
          return false;
        } finally {
          set({ loading: false });
          stockValidationInProgress = false;
          lastValidationTime = Date.now();
        }
      },
      
      // Debounced version of validateCartStock
      debouncedValidateStock: debounce(() => {
        const { validateCartStock } = get();
        validateCartStock();
      }, 500),
      
      // Create a throttled version of initiateCheckout
      throttledInitiateCheckout: throttle((checkoutData) => {
        const { initiateCheckout } = get();
        return initiateCheckout(checkoutData);
      }, 1000),

      initiateCheckout: async (checkoutData) => {
        const { items, validateCartStock, pointsUsed, pointsDiscount } = get();
        set({ loading: true, error: null });
      
        try {
          // First validate stock
          const isStockValid = await validateCartStock();
          if (!isStockValid) {
            throw new Error('Some items in your cart are unavailable');
          }
      
          // Check if we already have an orderId stored in state
          const existingOrderId = get().checkoutData?.order?._id;
      
          // Add points discount information to the request
          const requestData = {
            items: items.map(({ id, quantity }) => ({ id, quantity })),
            shippingAddress: checkoutData.shippingAddress || {},
            billingAddress: checkoutData.billingAddress || {},
            shippingMethod: checkoutData.shippingMethod || 'standard',
            userId: checkoutData.userId || null,
            isGuest: !checkoutData.userId,
            pointsUsed: pointsUsed || 0,
            pointsDiscount: pointsDiscount || 0,
          };
      
          let response;
      
          // If we have an existing orderId, try to update the order
          if (existingOrderId) {
            response = await retryWithBackoff(() =>
              api({
                method: 'put',
                url: `/orders/${existingOrderId}`,
                data: requestData,
              })
            );
            console.log('Order updated successfully:', response.data);
          } else {
            // If there's no existing orderId, create a new order
            response = await retryWithBackoff(() =>
              api({
                method: 'post',
                url: '/orders',
                data: requestData,
              })
            );
            console.log('New order created successfully:', response.data);
          }
      
          // Update the state with the new checkout data
          set({ checkoutData: response.data });
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Checkout failed';
          console.error('Checkout error:', message);
          set({ error: message });
          toast.error(message);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      processPayment: async (paymentIntentId) => {
        // Prevent concurrent payment processing
        if (get().processingPayment) {
          throw new Error('Payment already in progress');
        }

        set({ loading: true, error: null, processingPayment: true });

        try {
          const { pointsUsed } = get();

          // Use retry pattern with exponential backoff
          const response = await retryWithBackoff(
            () => api.post('/orders/payment', { 
              paymentIntentId,
              pointsUsed: pointsUsed || 0
            }),
            { maxRetries: 5, baseDelay: 300 } // Increase retries and delay for payment processing
          );

          // If points were used, deduct them from the user's balance
          if (pointsUsed > 0) {
            try {
              // Fetch the current points balance
              const currentBalance = usePoints.getState().balance;

              console.log('Current points balance:', currentBalance);
               
              const newBalance = currentBalance - pointsUsed;

              // Update points in the backend
              await usePoints.getState().updatePointsInBackend(newBalance);

              // Update local points state
              usePoints.getState().subtractPoints(pointsUsed);
            } catch (pointsError) {
              console.error('Error updating points:', pointsError);
              // Don't fail the payment if points update fails
            }
          }

          // Success! Clear cart
          get().clearCart();

          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Payment processing failed';
          set({ error: message });
          toast.error(message);
          throw error;
        } finally {
          set({ loading: false, processingPayment: false });
        }
      },

      updateGuestEmail: async (email) => {
        const { checkoutData } = get();
        set({ loading: true, error: null });
      
        try {
          if (!checkoutData?.order?._id) {
            throw new Error('No order found to update');
          }
      
          // Update the order with the guest's email
          const response = await api.put(`/orders/${checkoutData.order._id}`, {
            shippingAddress: { email },
          });
      
          console.log('Guest email updated successfully:', response.data);
          set({ checkoutData: response.data });
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Failed to update guest email';
          console.error('Update guest email error:', message);
          set({ error: message });
          toast.error(message);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      /**
       * Cancel an existing order
       * @param {String} orderId - ID of the order to cancel
       * @returns {Object} - The cancelled order data
       */
      cancelOrder: async (orderId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await retryWithBackoff(() => 
            api.post(`/orders/${orderId}/cancel`)
          );
          
          toast.success('Order cancelled successfully');
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Order cancellation failed';
          set({ error: message });
          toast.error(message);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      getCartTotals: () => {
        const { items, pointsDiscount } = get();
        return calculateTotals(items, pointsDiscount);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      hasItem: (productId) => {
        const { items } = get();
        return items.some(item => item.id === productId);
      },

      getItemQuantity: (productId) => {
        const { items } = get();
        const item = items.find(item => item.id === productId);
        return item ? item.quantity : 0;
      },

      // Get shipping methods and calculate costs - with caching
      getShippingMethods: (() => {
        let cachedMethods = null;
        let lastFetchTime = 0;
        const SHIPPING_CACHE_TTL = 60 * 60 * 1000; // 1 hour
        
        return async () => {
          const { items } = get();
          const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          
          // Use cached data if available and fresh
          if (cachedMethods && Date.now() - lastFetchTime < SHIPPING_CACHE_TTL) {
            console.log('Using cached shipping methods');
            return cachedMethods;
          }
          
          try {
            const response = await api.post('/shipping/calculate', {
              items: items.map(({ id, quantity }) => ({ id, quantity }))
            });
            
            // Cache the response
            cachedMethods = response.data;
            lastFetchTime = Date.now();
            
            return response.data;
          } catch (error) {
            console.error('Error fetching shipping methods:', error);
            
            // Fallback to default methods
            const fallbackMethods = [
              { id: 'standard', name: 'Standard Shipping', price: subtotal >= 100 ? 0 : 10 },
              { id: 'express', name: 'Express Shipping', price: 25 }
            ];
            
            // Still cache the fallback for a shorter time
            cachedMethods = fallbackMethods;
            lastFetchTime = Date.now() - (SHIPPING_CACHE_TTL / 2); // Cache for half the normal time
            
            return fallbackMethods;
          }
        };
      })(),

      // Utility Functions
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
      reset: () => set({ 
        items: [], 
        loading: false, 
        error: null, 
        stockWarnings: [], 
        checkoutData: null,
        processingPayment: false,
        pointsDiscount: 0,
        pointsUsed: 0
      })
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        pointsDiscount: state.pointsDiscount,
        pointsUsed: state.pointsUsed,
      }),
    }
  )
);

export default useCartStore;

export const useCart = () => {
  const {
    items,
    loading,
    error,
    stockWarnings,
    pointsDiscount,
    pointsUsed,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartTotals,
    getItemCount,
    hasItem,
    getItemQuantity,
    validateCartStock,
    throttledInitiateCheckout,
    processPayment,
    cancelOrder,
    updatePointsDiscount,
    removePointsDiscount
  } = useCartStore();

  const totals = getCartTotals();
  
  return {
    items,
    loading,
    error,
    stockWarnings,
    pointsDiscount,
    pointsUsed,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total: totals.total,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    tax: totals.tax,
    itemCount: getItemCount(),
    hasItem,
    getItemQuantity,
    validateCartStock,
    // Use throttled version instead
    initiateCheckout: throttledInitiateCheckout,
    processPayment,
    cancelOrder,
    updatePointsDiscount,
    removePointsDiscount
  };
};