// src/contexts/PermissionsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { toast } from 'sonner';
import locationService from '../services/location.service';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({
    location: {
      status: 'unknown', // 'granted', 'denied', 'prompt', 'unknown'
      requested: false,
      supported: true
    },
    camera: {
      status: 'unknown',
      requested: false,
      supported: true
    },
    fileSystem: {
      status: 'unknown',
      requested: false,
      supported: true
    }
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const isNative = Capacitor.isNativePlatform();

  // Check if permissions are supported on current platform
  const checkPlatformSupport = useCallback(() => {
    const platform = Capacitor.getPlatform();
    
    setPermissions(prev => ({
      ...prev,
      location: {
        ...prev.location,
        supported: platform !== 'web' || 'geolocation' in navigator
      },
      camera: {
        ...prev.camera,
        supported: platform !== 'web' || 'mediaDevices' in navigator
      },
      fileSystem: {
        ...prev.fileSystem,
        supported: true // Always supported through Capacitor
      }
    }));
  }, []);

  // Check current permission status without requesting
  const checkPermissionStatus = useCallback(async () => {
    try {
      const results = {};

      // Check location permissions
      try {
        if (isNative) {
          const locationPerms = await Geolocation.checkPermissions();
          results.location = locationPerms.location;
        } else if ('permissions' in navigator) {
          const locationPerm = await navigator.permissions.query({ name: 'geolocation' });
          results.location = locationPerm.state;
        } else {
          results.location = 'prompt';
        }
      } catch (error) {
        console.warn('Failed to check location permissions:', error);
        results.location = 'unknown';
      }

      // Check camera permissions
      try {
        if (isNative) {
          const cameraPerms = await Camera.checkPermissions();
          results.camera = cameraPerms.camera;
        } else if ('permissions' in navigator) {
          const cameraPerm = await navigator.permissions.query({ name: 'camera' });
          results.camera = cameraPerm.state;
        } else {
          results.camera = 'prompt';
        }
      } catch (error) {
        console.warn('Failed to check camera permissions:', error);
        results.camera = 'unknown';
      }

      // Check file system permissions (mostly relevant for native)
      try {
        if (isNative) {
          const filePerms = await Filesystem.checkPermissions();
          results.fileSystem = filePerms.publicStorage || 'granted';
        } else {
          results.fileSystem = 'granted'; // Web always has file access through input
        }
      } catch (error) {
        console.warn('Failed to check file system permissions:', error);
        results.fileSystem = 'unknown';
      }

      // Update state
      setPermissions(prev => ({
        location: {
          ...prev.location,
          status: results.location || 'unknown'
        },
        camera: {
          ...prev.camera,
          status: results.camera || 'unknown'
        },
        fileSystem: {
          ...prev.fileSystem,
          status: results.fileSystem || 'unknown'
        }
      }));

      return results;
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return {};
    }
  }, [isNative]);

  // Request location permission and get initial location
  const requestLocationPermission = useCallback(async (showToast = true) => {
    try {
      setPermissions(prev => ({
        ...prev,
        location: { ...prev.location, requested: true }
      }));

      const result = await locationService.requestLocationPermission();
      
      setPermissions(prev => ({
        ...prev,
        location: {
          ...prev.location,
          status: result.granted ? 'granted' : 'denied'
        }
      }));

      if (result.granted) {
        // Get initial location
        try {
          const location = await locationService.getBestLocation();
          setCurrentLocation(location);
          setLocationError(null);
          
          if (showToast && location.source !== 'default') {
            toast.success(`Location detected: ${location.city}`);
          }
        } catch (locationError) {
          console.warn('Failed to get initial location:', locationError);
          setLocationError(locationError.message);
        }
      } else if (showToast) {
        toast.error('Location permission denied. Some features may be limited.');
      }

      return result.granted;
    } catch (error) {
      console.error('Failed to request location permission:', error);
      setPermissions(prev => ({
        ...prev,
        location: { ...prev.location, status: 'denied' }
      }));
      
      if (showToast) {
        toast.error('Failed to request location permission');
      }
      return false;
    }
  }, []);

  // Request camera permission
  const requestCameraPermission = useCallback(async (showToast = true) => {
    try {
      setPermissions(prev => ({
        ...prev,
        camera: { ...prev.camera, requested: true }
      }));

      let granted = false;

      if (isNative) {
        const result = await Camera.requestPermissions();
        granted = result.camera === 'granted';
      } else {
        // For web, we test by trying to access camera
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop()); // Stop immediately
          granted = true;
        } catch (error) {
          granted = false;
        }
      }

      setPermissions(prev => ({
        ...prev,
        camera: {
          ...prev.camera,
          status: granted ? 'granted' : 'denied'
        }
      }));

      if (granted && showToast) {
        toast.success('Camera access granted');
      } else if (!granted && showToast) {
        toast.error('Camera permission denied. Photo features may be limited.');
      }

      return granted;
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      setPermissions(prev => ({
        ...prev,
        camera: { ...prev.camera, status: 'denied' }
      }));
      
      if (showToast) {
        toast.error('Failed to request camera permission');
      }
      return false;
    }
  }, [isNative]);

  // Request file system permission
  const requestFileSystemPermission = useCallback(async (showToast = true) => {
    try {
      setPermissions(prev => ({
        ...prev,
        fileSystem: { ...prev.fileSystem, requested: true }
      }));

      let granted = true; // Default to true for web

      if (isNative) {
        const result = await Filesystem.requestPermissions();
        granted = result.publicStorage === 'granted';
      }

      setPermissions(prev => ({
        ...prev,
        fileSystem: {
          ...prev.fileSystem,
          status: granted ? 'granted' : 'denied'
        }
      }));

      if (granted && showToast) {
        toast.success('File access granted');
      } else if (!granted && showToast) {
        toast.error('File permission denied. Some features may be limited.');
      }

      return granted;
    } catch (error) {
      console.error('Failed to request file system permission:', error);
      setPermissions(prev => ({
        ...prev,
        fileSystem: { ...prev.fileSystem, status: 'denied' }
      }));
      
      if (showToast) {
        toast.error('Failed to request file system permission');
      }
      return false;
    }
  }, [isNative]);

  // Request all permissions
  const requestAllPermissions = useCallback(async (options = {}) => {
    const {
      requestLocation = true,
      requestCamera = true,
      requestFileSystem = true,
      showToasts = true
    } = options;

    const results = {};

    try {
      if (requestLocation) {
        results.location = await requestLocationPermission(showToasts);
      }

      if (requestCamera) {
        results.camera = await requestCameraPermission(showToasts);
      }

      if (requestFileSystem) {
        results.fileSystem = await requestFileSystemPermission(showToasts);
      }

      const allGranted = Object.values(results).every(Boolean);
      
      if (allGranted && showToasts) {
        toast.success('All permissions granted!');
      } else if (showToasts) {
        const deniedPermissions = Object.entries(results)
          .filter(([_, granted]) => !granted)
          .map(([permission, _]) => permission);
        
        if (deniedPermissions.length > 0) {
          toast.warning(`Some permissions denied: ${deniedPermissions.join(', ')}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to request all permissions:', error);
      if (showToasts) {
        toast.error('Failed to request permissions');
      }
      return results;
    }
  }, [requestLocationPermission, requestCameraPermission, requestFileSystemPermission]);

  // Update current location
  const updateLocation = useCallback(async () => {
    if (permissions.location.status !== 'granted') {
      return null;
    }

    try {
      const location = await locationService.getBestLocation();
      setCurrentLocation(location);
      setLocationError(null);
      return location;
    } catch (error) {
      console.error('Failed to update location:', error);
      setLocationError(error.message);
      return null;
    }
  }, [permissions.location.status]);

  // Initialize permissions on app start
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        checkPlatformSupport();
        await checkPermissionStatus();
        
        // For mobile apps, request permissions on startup
        if (isNative) {
          // Small delay to let UI settle
          setTimeout(async () => {
            await requestAllPermissions({
              showToasts: false // Don't show toasts on initial load
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize permissions:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializePermissions();
  }, [checkPlatformSupport, checkPermissionStatus, requestAllPermissions, isNative]);

  // Get stored location on initialization
  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        const storedLocation = await locationService.getStoredLocation();
        if (storedLocation) {
          setCurrentLocation(storedLocation);
        }
      } catch (error) {
        console.warn('Failed to get stored location:', error);
      }
    };

    getInitialLocation();
  }, []);

  const value = {
    // Permission states
    permissions,
    isInitialized,
    
    // Location data
    currentLocation,
    locationError,
    
    // Permission request functions
    requestLocationPermission,
    requestCameraPermission,
    requestFileSystemPermission,
    requestAllPermissions,
    
    // Utility functions
    checkPermissionStatus,
    updateLocation,
    
    // Platform info
    isNative,
    platform: Capacitor.getPlatform(),
    
    // Helper functions to check specific permissions
    hasLocationPermission: permissions.location.status === 'granted',
    hasCameraPermission: permissions.camera.status === 'granted',
    hasFileSystemPermission: permissions.fileSystem.status === 'granted',
    
    // Check if all critical permissions are granted
    hasAllCriticalPermissions: permissions.location.status === 'granted' && 
                               permissions.camera.status === 'granted' && 
                               permissions.fileSystem.status === 'granted'
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};