// client/src/components/gymBros/GuestFlowContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import gymbrosService from '../../../services/gymbros.service';
import useAuthStore from '../../../stores/authStore';
import { toast } from 'sonner';

// Create a context for the guest flow
const GuestFlowContext = createContext(null);

export const useGuestFlow = () => {
  const context = useContext(GuestFlowContext);
  if (!context) {
    throw new Error('useGuestFlow must be used within a GuestFlowProvider');
  }
  return context;
};

export const GuestFlowProvider = ({ children }) => {
  const { isAuthenticated, user, loginWithToken } = useAuthStore();
  const [isGuest, setIsGuest] = useState(false);
  const [guestProfile, setGuestProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifiedPhone, setVerifiedPhone] = useState(localStorage.getItem('verifiedPhone'));
  const [verificationToken, setVerificationToken] = useState(localStorage.getItem('verificationToken'));
  
  // Check if we have a guest token
  useEffect(() => {
    const guestToken = gymbrosService.getGuestToken();
    if (guestToken) {
      setIsGuest(true);
      
      // Try to load the guest profile
      fetchGuestProfile();
    } else {
      setLoading(false);
    }
  }, []);
  
  // Watch for verification token changes
  useEffect(() => {
    const storedToken = localStorage.getItem('verificationToken');
    const storedPhone = localStorage.getItem('verifiedPhone');
    
    if (storedToken !== verificationToken) {
      setVerificationToken(storedToken);
    }
    
    if (storedPhone !== verifiedPhone) {
      setVerifiedPhone(storedPhone);
    }
  }, [verificationToken, verifiedPhone]);
  
  // Fetch the guest profile
  const fetchGuestProfile = useCallback(async () => {
    if (isAuthenticated) {
      setIsGuest(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await gymbrosService.getGymBrosProfile();
      
      if (response.hasProfile && response.isGuest) {
        setGuestProfile(response.profile);
        setIsGuest(true);
      } else {
        setGuestProfile(null);
      }
    } catch (error) {
      console.error('Error fetching guest profile:', error);
      // Clear guest state if there was an error
      gymbrosService.clearGuestState();
      setIsGuest(false);
      setGuestProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  // Create a profile for a guest user with verified phone
  const createGuestProfile = useCallback(async (profileData) => {
    if (!verifiedPhone || !verificationToken) {
      toast.error('Phone verification required');
      return null;
    }
    
    setLoading(true);
    try {
      // Make sure the phone number is included
      const completeProfileData = {
        ...profileData,
        phone: verifiedPhone
      };
      
      const response = await gymbrosService.createOrUpdateProfile(completeProfileData);
      
      if (response.success && response.profile) {
        setGuestProfile(response.profile);
        setIsGuest(true);
        
        // If a guest token was returned, update it
        if (response.guestToken) {
          gymbrosService.setGuestToken(response.guestToken);
        }
        
        toast.success('Profile created successfully!');
        return response.profile;
      } else {
        toast.error(response.message || 'Failed to create profile');
        return null;
      }
    } catch (error) {
      console.error('Error creating guest profile:', error);
      toast.error('Failed to create profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [verifiedPhone, verificationToken]);
  
  // Convert a guest profile to a registered user account
  const convertGuestToUser = useCallback(async () => {
    if (!isGuest || !isAuthenticated) {
      return { success: false, message: 'Not a guest or not authenticated' };
    }
    
    setLoading(true);
    try {
      const response = await gymbrosService.convertGuestToUser();
      
      if (response.success) {
        // Update local state
        setIsGuest(false);
        setGuestProfile(null);
        
        // Clear guest-related state
        gymbrosService.clearGuestState();
        
        toast.success('Profile successfully linked to your account!');
      } else {
        toast.error(response.message || 'Failed to link guest profile');
      }
      
      return response;
    } catch (error) {
      console.error('Error converting guest to user:', error);
      toast.error('Failed to link guest profile');
      return { success: false, message: 'Error converting guest to user' };
    } finally {
      setLoading(false);
    }
  }, [isGuest, isAuthenticated]);
  
  // Clear guest state
  const clearGuestState = useCallback(() => {
    gymbrosService.clearGuestState();
    setIsGuest(false);
    setGuestProfile(null);
    setVerifiedPhone(null);
    setVerificationToken(null);
  }, []);
  
  // Verify a phone number for a guest user
  const verifyGuestPhone = useCallback(async (phone, code) => {
    try {
      const response = await gymbrosService.verifyCode(phone, code);
      
      if (response.success) {
        setVerifiedPhone(phone);
        setVerificationToken(response.token);
        return response;
      } else {
        toast.error(response.message || 'Verification failed');
        return response;
      }
    } catch (error) {
      console.error('Error verifying phone:', error);
      toast.error('Verification failed');
      return { success: false, message: 'Error verifying phone' };
    }
  }, []);
  
  // Context value
  const value = {
    isGuest,
    guestProfile,
    loading,
    verifiedPhone,
    verificationToken,
    fetchGuestProfile,
    createGuestProfile,
    convertGuestToUser,
    clearGuestState,
    verifyGuestPhone
  };
  
  return (
    <GuestFlowContext.Provider value={value}>
      {children}
    </GuestFlowContext.Provider>
  );
};

export default GuestFlowProvider;