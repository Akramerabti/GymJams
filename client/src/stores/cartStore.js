// stores/cartStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';
import { toast } from 'sonner';
import inventoryService from '../services/inventory.service';

/**
 * Calculate cart totals including subtotal, shipping, tax and grand total
 * @param {Array} items - The cart items with price and quantity
 * @returns {Object} - Calculated cart totals
 */
const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
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

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,
      stockWarnings: [],
      checkoutData: null,
      processingPayment: false,
      
      /**
       * Add an item to the cart
       * @param {Object} product - The product to add
       * @param {Number} quantity - Quantity to add
       */
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
      },

      /**
       * Remove an item from the cart
       * @param {String} productId - ID of the product to remove
       */
      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== productId) });
        toast({ 
          title: "Item Removed",
          description: "Item has been removed from your cart."
        });
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
          // Validate stock before updating quantity
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
          
          const { items } = get();
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
        set({ loading: true, error: null, stockWarnings: [] });

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
            return false;
          }
          
          return true;
        } catch (error) {
          console.error('Stock validation error:', error);
          set({ 
            error: 'Failed to validate stock. Please try again.' 
          });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      /**
       * Initiate checkout process
       * @param {Object} checkoutData - Checkout data including addresses
       * @returns {Object} - The order and payment info
       */
      initiateCheckout: async (checkoutData) => {
        const { items, validateCartStock } = get();
        set({ loading: true, error: null });

        try {
          // First validate stock
          const isStockValid = await validateCartStock();
          if (!isStockValid) {
            throw new Error('Some items in your cart are unavailable');
          }

          // Create order with retry logic
          const response = await retryWithBackoff(() => 
            api.post('/orders', {
              items: items.map(({ id, quantity }) => ({ id, quantity })),
              shippingAddress: checkoutData.shippingAddress || {},
              billingAddress: checkoutData.billingAddress || {},
              shippingMethod: checkoutData.shippingMethod || 'standard',
              userId: checkoutData.userId || null
            })
          );

          set({ checkoutData: response.data });
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Checkout failed';
          set({ error: message });
          toast.error(message);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      /**
       * Process payment for an order
       * @param {String} paymentIntentId - Stripe payment intent ID
       * @returns {Object} - The processed order data
       */
      processPayment: async (paymentIntentId) => {
        // Prevent concurrent payment processing
        if (get().processingPayment) {
          throw new Error('Payment already in progress');
        }
        
        set({ loading: true, error: null, processingPayment: true });
        
        try {
          // Use retry pattern with exponential backoff
          const response = await retryWithBackoff(
            () => api.post('/orders/payment', { paymentIntentId }),
            { maxRetries: 5, baseDelay: 300 } // Increase retries and delay for payment processing
          );
          
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

      // Cart Getters
      getCartTotals: () => {
        const { items } = get();
        return calculateTotals(items);
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

      // Get shipping methods and calculate costs
      getShippingMethods: async () => {
        const { items } = get();
        
        try {
          const response = await api.post('/shipping/calculate', {
            items: items.map(({ id, quantity }) => ({ id, quantity }))
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching shipping methods:', error);
          return [
            { id: 'standard', name: 'Standard Shipping', price: items.reduce((sum, item) => sum + item.price * item.quantity, 0) >= 100 ? 0 : 10 },
            { id: 'express', name: 'Express Shipping', price: 25 }
          ];
        }
      },

      // Utility Functions
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
      reset: () => set({ 
        items: [], 
        loading: false, 
        error: null, 
        stockWarnings: [], 
        checkoutData: null,
        processingPayment: false
      })
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

export default useCartStore;

// Hook for using cart functionality in components
export const useCart = () => {
  const {
    items,
    loading,
    error,
    stockWarnings,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartTotals,
    getItemCount,
    hasItem,
    getItemQuantity,
    validateCartStock,
    initiateCheckout,
    processPayment,
    cancelOrder
  } = useCartStore();

  return {
    items,
    loading,
    error,
    stockWarnings,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totals: getCartTotals(),
    itemCount: getItemCount(),
    hasItem,
    getItemQuantity,
    validateCartStock,
    initiateCheckout,
    processPayment,
    cancelOrder
  };
};