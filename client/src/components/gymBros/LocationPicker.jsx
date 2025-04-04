import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Search, Loader, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const containerStyle = {
  width: '100%',
  height: '400px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

// This component helps us respond to map events and keep track of the map instance
const MapController = ({ position, zoom, onClick }) => {
  const map = useMap();
  
  // Handle click events on map
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e) => {
      onClick(e.latlng);
    };

    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onClick]);

  // Update map view when position changes
  useEffect(() => {
    if (map && position) {
      map.setView([position.lat, position.lng], zoom || map.getZoom());
    }
  }, [map, position, zoom]);

  return null;
};

// Format address in the desired format
const formatAddress = (addressData) => {
  try {
    // If we didn't get address details, return the display name
    if (!addressData.address) {
      return addressData.display_name || "Address not found";
    }
    
    const address = addressData.address;
    
    // Extract components (with fallbacks for each part)
    const houseNumber = address.house_number || '';
    const street = address.road || address.street || address.pedestrian || '';
    const city = address.city || address.town || address.village || address.hamlet || '';
    const state = address.state || address.province || '';
    const postcode = address.postcode || '';
    const country = address.country || '';
    
    // Build address parts
    const parts = [];
    
    // Street address
    if (houseNumber && street) {
      parts.push(`${houseNumber} ${street}`);
    } else if (street) {
      parts.push(street);
    }
    
    // City
    if (city) {
      parts.push(city);
    }
    
    // State/Province with abbreviation for Canada
    if (state) {
      let stateAbbr = state;
      // Canadian province abbreviations
      if (country === 'Canada') {
        const provinceMap = {
          'Alberta': 'AB',
          'British Columbia': 'BC',
          'Manitoba': 'MB',
          'New Brunswick': 'NB',
          'Newfoundland and Labrador': 'NL',
          'Northwest Territories': 'NT',
          'Nova Scotia': 'NS',
          'Nunavut': 'NU',
          'Ontario': 'ON',
          'Prince Edward Island': 'PE',
          'Quebec': 'QC',
          'Saskatchewan': 'SK',
          'Yukon': 'YT'
        };
        stateAbbr = provinceMap[state] || state;
      }
      parts.push(stateAbbr);
    }
    
    // Postal code
    if (postcode) {
      parts.push(postcode);
    }
    
    // Country
    if (country) {
      parts.push(country);
    }
    
    // Join everything with commas
    return parts.join(', ');
  } catch (error) {
    console.error('Error formatting address:', error);
    return addressData.display_name || "Address not found";
  }
};

// Free geocoding using Nominatim (OpenStreetMap)
const geocodeLocation = async (lat, lng) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    return formatAddress(data);
  } catch (error) {
    console.error("Geocoding error:", error);
    return "Location found (address unavailable)";
  }
};

// Geocode a search query
const searchLocation = async (query) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`);
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const formattedAddress = formatAddress(data[0]);
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: formattedAddress
      };
    }
    return null;
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
};

// Debounce function to limit API requests
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
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
  const [mapCenter, setMapCenter] = useState(markerPosition);
  
  // Refs to track last geocoding request time to avoid rate limiting
  const lastGeocodingRequest = useRef(0);
  const geocodeDelayMs = 1000; // Min time between requests

  // Reverse geocoding function with rate limiting
  const reverseGeocode = useCallback(async (position) => {
    try {
      // Rate limiting check
      const now = Date.now();
      const timeElapsed = now - lastGeocodingRequest.current;
      
      if (timeElapsed < geocodeDelayMs) {
        await new Promise(resolve => setTimeout(resolve, geocodeDelayMs - timeElapsed));
      }
      
      lastGeocodingRequest.current = Date.now();
      
      // Get address from coordinates
      const formattedAddress = await geocodeLocation(position.lat, position.lng);
      
      setAddress(formattedAddress);
      
      // Send complete location data back to parent
      onLocationChange({
        lat: position.lat,
        lng: position.lng,
        address: formattedAddress,
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress("Location found (address unavailable)");
    }
  }, [onLocationChange]);

  // Debounced version of reverseGeocode to limit API calls
  const debouncedReverseGeocode = useCallback(
    debounce((position) => reverseGeocode(position), 500),
    [reverseGeocode]
  );

  // Handle map click
  const handleMapClick = useCallback((latlng) => {
    const newPosition = { 
      lat: latlng.lat, 
      lng: latlng.lng 
    };
    
    setMarkerPosition(newPosition);
    debouncedReverseGeocode(newPosition);
  }, [debouncedReverseGeocode]);

  // Handle location search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // First try if it's coordinates
      const coordsRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
      const match = searchQuery.match(coordsRegex);
      
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[3]);
        
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          const newPosition = { lat, lng };
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
          setMapZoom(15);
          reverseGeocode(newPosition);
        } else {
          alert('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
        }
      } else {
        // Otherwise do a search by address
        const result = await searchLocation(searchQuery);
        if (result) {
          setMarkerPosition(result);
          setMapCenter(result);
          setMapZoom(15);
          setAddress(result.address);
          
          onLocationChange({
            lat: result.lat,
            lng: result.lng,
            address: result.address,
          });
        } else {
          alert('Location not found. Try a different search term or coordinates.');
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      alert('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, reverseGeocode, onLocationChange]);

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
          setMapCenter(newPosition);
          setMapZoom(15);
          
          reverseGeocode(newPosition);
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert('Unable to get your location. Please ensure location services are enabled.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Update address when marker position changes via dragging
  const handleMarkerDrag = useCallback((event) => {
    const marker = event.target;
    const position = marker.getLatLng();
    const newPosition = {
      lat: position.lat,
      lng: position.lng
    };
    
    setMarkerPosition(newPosition);
    debouncedReverseGeocode(newPosition);
  }, [debouncedReverseGeocode]);

  // Handle enter key in search input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
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
          placeholder="Find location by address or coordinates..."
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
          disabled={isSearching || !searchQuery.trim()}
          className="absolute right-12 top-2 px-2 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {isSearching ? <Loader className="animate-spin" size={16} /> : "Find"}
        </button>
      </div>

      {/* OpenStreetMap/Leaflet Map */}
      <MapContainer
        center={[markerPosition.lat, markerPosition.lng]}
        zoom={mapZoom}
        style={containerStyle}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={[markerPosition.lat, markerPosition.lng]}
          draggable={true}
          eventHandlers={{
            dragend: handleMarkerDrag,
          }}
        />
        <MapController 
          position={mapCenter} 
          zoom={mapZoom} 
          onClick={handleMapClick} 
        />
      </MapContainer>

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