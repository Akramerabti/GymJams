// stores/cartStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';
import { toast } from 'sonner';
import inventoryService from '../services/inventory.service';

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

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
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
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== productId) });
      },

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

      clearCart: () => set({ 
        items: [], 
        checkoutData: null, 
        stockWarnings: [],
        error: null 
      }),

      validateCartStock: async () => {
        const { items } = get();
        set({ loading: true, error: null, stockWarnings: [] });

        try {
          const response = await inventoryService.validateStock(
            items.map(({ id, quantity }) => ({ id, quantity }))
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

      // Checkout Actions
      initiateCheckout: async (checkoutData) => {
        const { items, validateCartStock } = get();
        set({ loading: true, error: null });

        try {
          // First validate stock
          const isStockValid = await validateCartStock();
          if (!isStockValid) {
            throw new Error('Some items in your cart are unavailable');
          }

          // Create order
          const response = await api.post('/orders', {
            items: items.map(({ id, quantity }) => ({ id, quantity })),
            shippingAddress: checkoutData.shippingAddress || {},
            billingAddress: checkoutData.billingAddress || {},
            shippingMethod: checkoutData.shippingMethod || 'standard',
            userId: checkoutData.userId || null
          });

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

      processPayment: async (paymentIntentId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await api.post('/orders/payment', {
            paymentIntentId
          });
          
          set({ loading: false });
          // Clear cart after successful payment
          get().clearCart();
          
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Payment processing failed';
          set({ loading: false, error: message });
          throw error;
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

      // Shipping Methods
      getShippingMethods: async () => {
        const { items } = get();
        set({ loading: true });

        try {
          const response = await api.post('/shipping/calculate', {
            items: items.map(({ id, quantity }) => ({ id, quantity }))
          });
          return response.data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      // Cart Sync & Recovery
      syncWithServer: async () => {
        const { items, setError } = get();
        try {
          const response = await api.post('/cart/sync', { items });
          set({ items: response.data.items });
        } catch (error) {
          setError('Failed to sync cart with server');
        }
      },

      // Utility Functions
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
      reset: () => set({ items: [], loading: false, error: null, stockWarnings: [], checkoutData: null })
    }),
    {
      name: 'cart-storage',
      getStorage: () => localStorage,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

export default useCartStore;