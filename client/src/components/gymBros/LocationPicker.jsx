import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Search, Loader, Navigation } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '400px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

const LocationPicker = ({ location, onLocationChange }) => {
  const [markerPosition, setMarkerPosition] = useState({
    lat: location?.lat || 37.7749,
    lng: location?.lng || -122.4194,
  });
  const [address, setAddress] = useState(location?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  const [markerAnimation, setMarkerAnimation] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Reverse geocoding function
  const reverseGeocode = useCallback(async (position) => {
    if (!map) return;
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
      
      setAddress(response.formatted_address);
      onLocationChange({
        lat: position.lat,
        lng: position.lng,
        address: response.formatted_address,
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress("Location found (address unavailable)");
    }
  }, [map, onLocationChange]);

  // Handle map click
  const onMapClick = useCallback((event) => {
    const newPosition = { 
      lat: event.latLng.lat(), 
      lng: event.latLng.lng() 
    };
    
    setMarkerPosition(newPosition);
    setMarkerAnimation(window.google.maps.Animation.DROP);
    
    // Reset animation after it plays
    setTimeout(() => setMarkerAnimation(null), 750);
  }, []);

  // Handle location search
  const handleSearch = useCallback(async () => {
    if (!map || !searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(`Search failed: ${status}`));
          }
        });
      });
      
      const newPosition = {
        lat: response.geometry.location.lat(),
        lng: response.geometry.location.lng()
      };
      
      setMarkerPosition(newPosition);
      setAddress(response.formatted_address);
      setMapZoom(15); // Zoom in when a location is found
      
      map.panTo(newPosition);
      setMarkerAnimation(window.google.maps.Animation.DROP);
      
      onLocationChange({
        lat: newPosition.lat,
        lng: newPosition.lng,
        address: response.formatted_address,
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [map, searchQuery, onLocationChange]);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setMarkerPosition(newPosition);
          setMapZoom(15);
          
          if (map) {
            map.panTo(newPosition);
          }
          
          setMarkerAnimation(window.google.maps.Animation.DROP);
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    }
  };

  // Update address when marker position changes
  useEffect(() => {
    if (markerPosition.lat && markerPosition.lng) {
      reverseGeocode(markerPosition);
    }
  }, [markerPosition, reverseGeocode]);

  // Handle enter key in search input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (loadError) return <div className="p-4 text-red-500">Error loading maps</div>;
  if (!isLoaded) return <div className="p-4 flex items-center"><Loader className="animate-spin mr-2" size={20} /> Loading map...</div>;

  // Custom marker icon (SVG path for a pin)
  const customMarkerIcon = {
    path: "M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z",
    fillColor: "#2563eb",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 1.5,
    anchor: new window.google.maps.Point(12, 21.7),
  };

  return (
    <div className="w-full space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find location..."
          className="w-full p-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        

        <button
          onClick={getUserLocation}
          className="absolute right-2 top-2 p-1.5 text-blue-500 hover:text-blue-700 transition-colors"
          title="Use my current location"
        >
          <Navigation size={20} />
        </button>
        
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="absolute right-12 top-2 px-2 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {isSearching ? <Loader className="animate-spin" size={16} /> : "Find"}
        </button>
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={mapZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
      >
        <Marker
          position={markerPosition}
          animation={markerAnimation}
          icon={customMarkerIcon}
          draggable={true}
          onDragEnd={(e) => {
            const newPosition = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
            };
            setMarkerPosition(newPosition);
          }}
        />
      </GoogleMap>

      {/* Display selected address */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-start">
          <MapPin className="text-blue-500 mt-1 mr-2 flex-shrink-0" size={20} />
          <div>

            <p className="font-medium text-gray-900">{address || "No location selected"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;