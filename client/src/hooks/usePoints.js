// hooks/usePoints.js
import { create } from 'zustand';

export const usePoints = create((set) => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
  addPoints: (points) => set((state) => ({ 
    balance: state.balance + points 
  })),
  subtractPoints: (points) => set((state) => ({ 
    balance: state.balance - points 
  }))
}));