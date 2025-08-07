import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader, SkipForward } from 'lucide-react';
import LocationPicker from './LocationPicker';
import gymBrosLocationService from '../../services/gymBrosLocation.service';

const AutoLocationStep = ({ 
  location, 
  onLocationChange, 
  showSkipOption = false, 
  existingLocationMessage = '',
  user = null,
  phone = null 
}) => {
  const [step, setStep] = useState('checking'); // 'checking', 'requesting', 'picker', 'success', 'skipped'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationData, setLocationData] = useState(location);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Geocode coordinates to get city name
  const getCityFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      const address = data.address || {};
      
      // Extract city name
      const city = address.city || 
                  address.town || 
                  address.village || 
                  address.hamlet || 
                  address.municipality ||
                  'Unknown City';
      
      return city;
    } catch (error) {
      console.error('Error geocoding coordinates:', error);
      return 'Unknown City';
    }
  };

  // Store location in localStorage
  const storeLocationData = (locationData) => {
    try {
      const locationToStore = {
        lat: locationData.lat,
        lng: locationData.lng,
        city: locationData.city,
        timestamp: Date.now()
      };
      localStorage.setItem('userLocation', JSON.stringify(locationToStore));
      console.log('📱 Stored location in localStorage:', locationToStore);
    } catch (error) {
      console.error('Failed to store location:', error);
    }
  };

  // Get location from localStorage
  const getStoredLocation = () => {
    try {
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        const location = JSON.parse(stored);
        // Check if location is not too old (7 days)
        const isValid = location.timestamp && 
          (Date.now() - location.timestamp) < (7 * 24 * 60 * 60 * 1000);
        
        if (isValid && location.lat && location.lng) {
          return location;
        }
      }
    } catch (error) {
      console.error('Failed to get stored location:', error);
    }
    return null;
  };

  // Auto-request user's location
  const requestUserLocation = useCallback(async () => {
    setStep('requesting');
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setStep('picker');
      setLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          console.log('📍 Got user location:', { lat, lng });
          
          // Get city name
          const city = await getCityFromCoordinates(lat, lng);
          
          const newLocationData = { lat, lng, city };
          
          // Store in localStorage
          storeLocationData(newLocationData);
          
          // Update state
          setLocationData(newLocationData);
          setStep('success');
          setLoading(false);
          
          // Send to parent
          onLocationChange(newLocationData);
          
        } catch (error) {
          console.error('Error processing location:', error);
          setError('Failed to process location data');
          setStep('picker');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            setPermissionDenied(true);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
            break;
        }
        
        setError(errorMessage);
        setStep('picker');
        setLoading(false);
      },
      options
    );
  }, []); // Empty dependencies to prevent infinite loops

  // Check for existing location data
  const checkExistingLocation = useCallback(async () => {
    try {
      setStep('checking');
      setLoading(true);

      // 1. Check localStorage first
      const storedLocation = getStoredLocation();
      if (storedLocation) {
        console.log('📱 Using stored location:', storedLocation);
        setLocationData(storedLocation);
        setStep('success');
        setLoading(false);
        onLocationChange(storedLocation);
        return;
      }

      // 2. Check backend for logged-in users
      if (user || phone) {
        try {
          const locationCheck = await gymBrosLocationService.shouldSkipLocationStep(user, phone);
          
          if (locationCheck.skipStep && locationCheck.locationData) {
            console.log('🗄️ Using backend location:', locationCheck.locationData);
            
            // Convert backend data to our simplified format
            const simplifiedLocation = {
              lat: locationCheck.locationData.lat,
              lng: locationCheck.locationData.lng,
              city: locationCheck.locationData.city || locationCheck.locationData.address || 'Unknown City'
            };
            
            // Store in localStorage for future use
            storeLocationData(simplifiedLocation);
            
            setLocationData(simplifiedLocation);
            setStep('success');
            setLoading(false);
            onLocationChange(simplifiedLocation);
            return;
          }
        } catch (error) {
          console.warn('Backend location check failed:', error);
          // Continue to auto-request location
        }
      }

      // 3. Auto-request user's current location
      requestUserLocation();
      
    } catch (error) {
      console.error('Error checking existing location:', error);
      setError('Failed to check location data');
      setStep('picker');
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loop

  // Initialize on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeLocation = async () => {
      if (isMounted) {
        await checkExistingLocation();
      }
    };
    
    initializeLocation();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array

  // Handle manual location input from LocationPicker
  const handleManualLocation = (pickerLocation) => {
    // Convert to our simplified format
    const simplifiedLocation = {
      lat: pickerLocation.lat,
      lng: pickerLocation.lng,
      city: pickerLocation.city || pickerLocation.address || 'Unknown City'
    };
    
    // Store in localStorage
    storeLocationData(simplifiedLocation);
    
    setLocationData(simplifiedLocation);
    setStep('success');
    onLocationChange(simplifiedLocation);
  };

  // Skip location step
  const handleSkip = () => {
    setStep('skipped');
    onLocationChange(null);
  };

  // Retry location request
  const handleRetry = () => {
    setError(null);
    setPermissionDenied(false);
    requestUserLocation();
  };

  if (step === 'checking') {
    return (
      <div className="w-full space-y-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <h3 className="text-lg font-semibold text-white">Checking location...</h3>
          <p className="text-white/70">Looking for existing location data</p>
        </div>
      </div>
    );
  }

  if (step === 'requesting') {
    return (
      <div className="w-full space-y-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Navigation className="h-12 w-12 text-blue-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-white">Getting your location...</h3>
          <p className="text-white/70">Please allow location access when prompted</p>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
          <p className="text-blue-200 text-sm text-center">
            💡 This helps us find gym partners nearby. Your exact location is never shared with other users.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="w-full space-y-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Location confirmed!</h3>
          {locationData && (
            <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="h-5 w-5 text-green-400" />
                <span className="text-green-200">{locationData.city}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'skipped') {
    return (
      <div className="w-full space-y-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <SkipForward className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Location skipped</h3>
          <p className="text-white/70">You can add your location later in settings</p>
        </div>
      </div>
    );
  }

  if (step === 'picker') {
    return (
      <div className="w-full space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-200 font-medium">{error}</p>
                {permissionDenied && (
                  <p className="text-red-200/70 text-sm mt-1">
                    Please select your location manually below, or enable location access and try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-3 mb-4">
          {!permissionDenied && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Navigation className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          )}
          
          {showSkipOption && (
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Select your location manually:</h4>
          <LocationPicker
            location={locationData}
            onLocationChange={handleManualLocation}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default AutoLocationStep;
