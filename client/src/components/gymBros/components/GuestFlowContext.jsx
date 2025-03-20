// client/src/components/gymBros/components/GuestFlowContext.jsx
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
  const [initAttempted, setInitAttempted] = useState(false);
  const fetchGuestProfile = useCallback(async () => {
    if (isAuthenticated) {
      console.log('[GuestFlow] User is authenticated, not using guest flow');
      setIsGuest(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('[GuestFlow] Fetching guest profile');
      const response = await gymbrosService.getGymBrosProfile();
      
      if (response.hasProfile && (response.isGuest || !response.userId)) {
        console.log('[GuestFlow] Found guest profile:', response.profile);
        setGuestProfile(response.profile);
        setIsGuest(true);
        
        // Make sure guest token is set
        if (response.guestToken) {
          gymbrosService.setGuestToken(response.guestToken);
        }
      } else if (response.guestToken) {
        // We have a guest token but no profile yet
        console.log('[GuestFlow] Have guest token but no profile yet');
        gymbrosService.setGuestToken(response.guestToken);
        setIsGuest(true);
        setGuestProfile(null);
      } else {
        console.log('[GuestFlow] No guest profile found');
        setGuestProfile(null);
        
        // Only reset isGuest if we don't have a token
        if (!gymbrosService.getGuestToken()) {
          setIsGuest(false);
        }
      }
    } catch (error) {
      console.error('[GuestFlow] Error fetching guest profile:', error);
      
      // Check if error is unauthorized
      if (error.response && error.response.status === 401) {
        // Clear guest state if unauthorized
        gymbrosService.clearGuestState();
        setIsGuest(false);
        setGuestProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    if (initAttempted) return;
    
    const initGuestFlow = async () => {
      setLoading(true);
      const guestToken = gymbrosService.getGuestToken();
      
      console.log('[GuestFlow] Initializing guest flow');
      
      if (guestToken) {
        console.log('[GuestFlow] Found existing guest token:', guestToken.substring(0, 15) + '...');
        
        // Make sure the token is set in the api headers
        gymbrosService.setGuestToken(guestToken);
        
        setIsGuest(true);
        
        try {
          // Try to load the guest profile
          await fetchGuestProfile();
        } catch (error) {
          console.error('[GuestFlow] Error loading guest profile on init:', error);
          
          // Check if the error is due to an invalid token
          if (error.response && error.response.status === 401) {
            console.log('[GuestFlow] Invalid guest token, clearing...');
            // Clear guest token if it's invalid
            gymbrosService.clearGuestState();
            setIsGuest(false);
            setGuestProfile(null);
          }
        }
      } else {
        // Check if we have a verified phone
        const verifiedPhone = localStorage.getItem('verifiedPhone');
        const verificationToken = localStorage.getItem('verificationToken');
        
        if (verifiedPhone && verificationToken) {
          console.log('[GuestFlow] Found verified phone but no guest token, creating one...');
          
          // Create a guest token for the verified phone
          try {
            const response = await gymbrosService.checkProfileWithVerifiedPhone(
              verifiedPhone,
              verificationToken
            );
            
            if (response.guestToken) {
              console.log('[GuestFlow] Created guest token from verified phone');
              gymbrosService.setGuestToken(response.guestToken);
              setIsGuest(true);
              
              if (response.profile) {
                setGuestProfile(response.profile);
              }
            }
          } catch (error) {
            console.error('[GuestFlow] Error creating guest token:', error);
          }
        } else {
          console.log('[GuestFlow] No guest token or verified phone found');
        }
        
        setLoading(false);
      }
      
      setInitAttempted(true);
    };
    
    // Don't run if user is already authenticated
    if (!isAuthenticated) {
      initGuestFlow();
    } else {
      console.log('[GuestFlow] User is authenticated, skipping guest initialization');
      setInitAttempted(true);
      setLoading(false);
    }
  }, [isAuthenticated, fetchGuestProfile]);
  
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
        phone: verifiedPhone,
        verificationToken: verificationToken
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
      console.error('[GuestFlow] Error creating guest profile:', error);
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
      console.error('[GuestFlow] Error converting guest to user:', error);
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
      console.error('[GuestFlow] Error verifying phone:', error);
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