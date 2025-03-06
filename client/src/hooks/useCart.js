import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      // Add item to cart
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

      // Remove item from cart
      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter((item) => item.id !== productId) });
        toast.success('Item removed from cart.');
      },

      // Update item quantity
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;

        const { items } = get();
        const updatedItems = items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        );

        set({ items: updatedItems });
      },

      // Clear cart
      clearCart: () => {
        set({ items: [] });
        toast.success('Cart cleared.');
      },

      // Calculate total price
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      // Get item count
      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      // Check if an item exists in cart
      hasItem: (productId) => {
        const { items } = get();
        return items.some((item) => item.id === productId);
      },

      // Get item quantity
      getItemQuantity: (productId) => {
        const { items } = get();
        const item = items.find((item) => item.id === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'cart-storage', // Name for localStorage
      getStorage: () => localStorage, // Use localStorage for persistence
    }
  )
);

// Custom hook to expose cart state and actions
export const useCart = () => {
  const store = useCartStore();

  return {
    items: store.items,
    loading: store.loading,
    error: store.error,
    total: store.getTotal(),
    itemCount: store.getItemCount(),
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    hasItem: store.hasItem,
    getItemQuantity: store.getItemQuantity,
  };
};