// hooks/useGymBrosData.js
import { create } from 'zustand';
import gymbrosService from '../services/gymbros.service';
import gymBrosLocationService from '../services/gymBrosLocation.service';

const useGymBrosData = create((set, get) => ({
  // Data state
  users: [],
  gyms: [],
  profiles: [],
  matches: [],
  
  // Loading states
  loading: {
    users: false,
    gyms: false,
    profiles: false,
    matches: false
  },
  
  // Cache timestamps
  lastFetch: {
    users: null,
    gyms: null,
    profiles: null,
    matches: null
  },
  

  CACHE_DURATION: 5 * 60 * 1000,

  isFresh: (type) => {
    const { lastFetch, CACHE_DURATION } = get();
    if (!lastFetch[type]) return false;
    return Date.now() - lastFetch[type] < CACHE_DURATION;
  },

  fetchUsers: async (force = false) => {
    const { users, loading, isFresh } = get();
    
    if (!force && users.length > 0 && isFresh('users')) {
      console.log('📍 Using cached users');
      return users;
    }
    
    if (loading.users) {
      console.log('📍 Users already loading');
      return users;
    }
    
    set(state => ({ loading: { ...state.loading, users: true } }));
    
    try {
      const response = await gymbrosService.getGymBrosProfiles();
      const usersArray = response?.recommendations || [];

      const processedUsers = usersArray
        .filter(user => user.location?.coordinates)
        .map(user => {
          const [lng, lat] = user.location.coordinates;
          return { ...user, lat, lng, id: user._id || user.id };
        });
      
      set(state => ({
        users: processedUsers,
        lastFetch: { ...state.lastFetch, users: Date.now() },
        loading: { ...state.loading, users: false }
      }));
      
      return processedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      set(state => ({ loading: { ...state.loading, users: false } }));
      return [];
    }
  },

  fetchGyms: async (force = false) => {
    const { gyms, loading, isFresh } = get();
    
    if (!force && gyms.length > 0 && isFresh('gyms')) {
      console.log('🏋️ Using cached gyms');
      return gyms;
    }
    
    if (loading.gyms) return gyms;
    
    set(state => ({ loading: { ...state.loading, gyms: true } }));
    
    try {
      const data = await gymBrosLocationService.getGymsForMap();
      const gymsArray = Array.isArray(data) ? data : data.gyms || [];

      const processedGyms = gymsArray
        .filter(gym => gym.location?.coordinates)
        .map(gym => {
          const [lng, lat] = gym.location.coordinates;
          return { ...gym, lat, lng, id: gym._id || gym.id };
        });
      
      set(state => ({
        gyms: processedGyms,
        lastFetch: { ...state.lastFetch, gyms: Date.now() },
        loading: { ...state.loading, gyms: false }
      }));
      
      return processedGyms;
    } catch (error) {
      console.error('Error fetching gyms:', error);
      set(state => ({ loading: { ...state.loading, gyms: false } }));
      return [];
    }
  },
  
  fetchProfiles: async (filters, force = false) => {
    const { profiles, loading, isFresh } = get();
    const cacheKey = JSON.stringify(filters);
    
    if (!force && profiles.length > 0 && isFresh('profiles')) {
      console.log('💪 Using cached profiles');
      return profiles;
    }
    
    if (loading.profiles) return profiles;
    
    set(state => ({ loading: { ...state.loading, profiles: true } }));
    
    try {
      const fetchedProfiles = await gymbrosService.getRecommendedProfiles(filters);
      
      set(state => ({
        profiles: fetchedProfiles,
        lastFetch: { ...state.lastFetch, profiles: Date.now() },
        loading: { ...state.loading, profiles: false }
      }));
      
      return fetchedProfiles;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      set(state => ({ loading: { ...state.loading, profiles: false } }));
      return [];
    }
  },
  
  invalidate: (type) => {
    set(state => ({
      lastFetch: { ...state.lastFetch, [type]: null }
    }));
  },

  clearCache: () => {
    set({
      lastFetch: {
        users: null,
        gyms: null,
        profiles: null,
        matches: null
      }
    });
  }
}));

export default useGymBrosData;