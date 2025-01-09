// hooks/usePoints.js
import { create } from 'zustand';
import { useEffect } from 'react';
import api from '../services/api';

export const usePoints = create((set) => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
  addPoints: (points) => set((state) => ({ 
    balance: state.balance + points 
  })),
  subtractPoints: (points) => set((state) => ({ 
    balance: state.balance - points 
  })),
  fetchPoints: async () => {
    try {
      const response = await api.get('/user/points'); // Assuming you have an endpoint to fetch the user's points
      set({ balance: response.data.balance });
    } catch (error) {
      console.error('Failed to fetch points:', error);
    }
  }
}));