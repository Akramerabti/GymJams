// hooks/useProducts.js
import { useEffect } from 'react';
import { create } from 'zustand';
import productService from '../services/product.service';

const useProductStore = create((set, get) => ({
  products: [],
  featuredProducts: [],
  categories: [],
  loading: false,
  error: null,
  filters: {
    category: null,
    priceRange: null,
    sortBy: 'featured',
    search: ''
  },

  // Fetch all products with optional filters
  fetchProducts: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await productService.getProducts(filters);
      set({ products: response.data });
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Fetch featured products
  fetchFeaturedProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await productService.getFeaturedProducts();
      set({ featuredProducts: response.data });
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Fetch product categories
  fetchCategories: async () => {
    try {
      const response = await productService.getCategories();
      set({ categories: response.data });
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get single product by ID
  getProduct: async (productId) => {
    set({ loading: true, error: null });
    try {
      const response = await productService.getProduct(productId);
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        category: null,
        priceRange: null,
        sortBy: 'featured',
        search: ''
      }
    });
  },

  // Clear state
  reset: () => {
    set({
      products: [],
      featuredProducts: [],
      categories: [],
      loading: false,
      error: null,
      filters: {
        category: null,
        priceRange: null,
        sortBy: 'featured',
        search: ''
      }
    });
  }
}));

export const useProducts = () => {
  const store = useProductStore();
  
  return {
    products: store.products,
    featuredProducts: store.featuredProducts,
    categories: store.categories,
    loading: store.loading,
    error: store.error,
    filters: store.filters,
    fetchProducts: store.fetchProducts,
    fetchFeaturedProducts: store.fetchFeaturedProducts,
    fetchCategories: store.fetchCategories,
    getProduct: store.getProduct,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
  };
};

// Custom hook to fetch a single product
export const useProduct = (productId) => {
  const { getProduct, loading, error } = useProductStore();

  useEffect(() => {
    if (productId) {
      getProduct(productId);
    }
  }, [productId, getProduct]);

  return { product: useProductStore((state) => state.products.find(p => p._id === productId)), loading, error };
};