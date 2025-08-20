// client/src/hooks/useGymBrosData.js - Updated version

import { create } from 'zustand';
import gymbrosService from '../services/gymbros.service';
import gymBrosLocationService from '../services/gymBrosLocation.service';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useGymBrosData = create((set, get) => ({
  // State
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
  
  // Helper to check if data is fresh
  isFresh: (type) => {
    const { lastFetch } = get();
    return lastFetch[type] && (Date.now() - lastFetch[type]) < CACHE_DURATION;
  },
  
  // UPDATED: Fetch users specifically for map (gym members + matches + recommendations)
  fetchUsers: async (filters = {}, force = false) => {
    const { users, loading, isFresh } = get();
    
    if (!force && users.length > 0 && isFresh('users')) {
      console.log('🗺️ Using cached map users');
      return users;
    }
    
    if (loading.users) return users;
    
    set(state => ({ loading: { ...state.loading, users: true } }));
    
    try {
      console.log('🗺️ Fetching map users with filters:', filters);
      
      // Use the new map users endpoint
      const fetchedUsers = await gymbrosService.getMapUsers(filters);
      
      console.log(`🗺️ Retrieved ${fetchedUsers.length} map users`);
      
      set(state => ({
        users: fetchedUsers,
        lastFetch: { ...state.lastFetch, users: Date.now() },
        loading: { ...state.loading, users: false }
      }));
      
      return fetchedUsers;
    } catch (error) {
      console.error('Error fetching map users:', error);
      set(state => ({ loading: { ...state.loading, users: false } }));
      return [];
    }
  },
  
  // Fetch gyms (unchanged)
  fetchGyms: async (force = false) => {
    const { gyms, loading, isFresh } = get();
    
    if (!force && gyms.length > 0 && isFresh('gyms')) {
      console.log('🏋️ Using cached gyms');
      return gyms;
    }
    
    if (loading.gyms) return gyms;
    
    set(state => ({ loading: { ...state.loading, gyms: true } }));
    
    try {
      const response = await gymBrosLocationService.getGymsForMap();
      const gymsArray = Array.isArray(response) ? response : response.gyms || [];

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
  
  // UPDATED: Fetch profiles for discovery tab (separate from map users)
  fetchProfiles: async (filters = {}, force = false) => {
    const { profiles, loading, isFresh } = get();
    
    if (!force && profiles.length > 0 && isFresh('profiles')) {
      console.log('💪 Using cached discovery profiles');
      return profiles;
    }
    
    if (loading.profiles) return profiles;
    
    set(state => ({ loading: { ...state.loading, profiles: true } }));
    
    try {
      console.log('💪 Fetching discovery profiles with filters:', filters);
      
      // Use the existing profiles endpoint for discovery
      const fetchedProfiles = await gymbrosService.getRecommendedProfiles(filters);
      
      console.log(`💪 Retrieved ${fetchedProfiles.length} discovery profiles`);
      
      set(state => ({
        profiles: fetchedProfiles,
        lastFetch: { ...state.lastFetch, profiles: Date.now() },
        loading: { ...state.loading, profiles: false }
      }));
      
      return fetchedProfiles;
    } catch (error) {
      console.error('Error fetching discovery profiles:', error);
      set(state => ({ loading: { ...state.loading, profiles: false } }));
      return [];
    }
  },
  
  // Fetch matches (unchanged)
  fetchMatches: async (force = false) => {
    const { matches, loading, isFresh } = get();
    
    if (!force && matches.length > 0 && isFresh('matches')) {
      console.log('❤️ Using cached matches');
      return matches;
    }
    
    if (loading.matches) return matches;
    
    set(state => ({ loading: { ...state.loading, matches: true } }));
    
    try {
      const fetchedMatches = await gymbrosService.getMatches();
      
      set(state => ({
        matches: fetchedMatches,
        lastFetch: { ...state.lastFetch, matches: Date.now() },
        loading: { ...state.loading, matches: false }
      }));
      
      return fetchedMatches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      set(state => ({ loading: { ...state.loading, matches: false } }));
      return [];
    }
  },
  
  // Invalidate cache for a specific type
  invalidate: (type) => {
    set(state => ({
      lastFetch: { ...state.lastFetch, [type]: null }
    }));
  },

  // Clear all cache
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