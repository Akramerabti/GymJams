// stores/cartStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../lib/axios';

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
      loading: false,
      error: null,
      checkoutData: null,
      
      // Cart Actions
      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingItem = items.find(item => item.id === product.id);

        if (existingItem) {
          const updatedItems = items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          set({ items: updatedItems });
        } else {
          set({ items: [...items, { ...product, quantity }] });
        }
      },

      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;
        
        const { items } = get();
        const updatedItems = items.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        );
        
        set({ items: updatedItems });
      },

      clearCart: () => set({ items: [], checkoutData: null }),

      // Checkout Actions
      initiateCheckout: async (checkoutData) => {
        const { items } = get();
        set({ loading: true, error: null });

        try {
          // Validate stock availability
          const stockResponse = await api.post('/cart/validate', {
            items: items.map(({ id, quantity }) => ({ id, quantity }))
          });

          if (!stockResponse.data.valid) {
            throw new Error('Some items are out of stock');
          }

          // Create checkout session
          const response = await api.post('/checkout/create-session', {
            items,
            checkoutData
          });

          set({ checkoutData: response.data });
          return response.data;
        } catch (error) {
          set({ error: error.message });
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
      reset: () => set({ items: [], loading: false, error: null, checkoutData: null })
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