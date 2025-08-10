import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, MapPin, Users, Star, Clock, Dumbbell,
  Building, ChevronRight, X, AlertCircle, Globe, Calendar,
  Home, Trophy, Check
} from 'lucide-react';
import gymBrosLocationService from '../../services/gymBrosLocation.service.js';


const GymSelector = ({ location, selectedGym, onGymSelect, onCreateGym, userId, isGuest }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [selectedGyms, setSelectedGyms] = useState([]); // Track multiple selections
  const [selectedType, setSelectedType] = useState('all'); // Filter by type
  const [searchRadius, setSearchRadius] = useState(50); // Configurable search radius
  const [appliedSelections, setAppliedSelections] = useState([]); // Track what's been applied
const [showApplied, setShowApplied] = useState(false); 
  const [createFormData, setCreateFormData] = useState({
    name: '',
    type: 'gym', // Default type
    gymChain: '',
    amenities: [],
    description: '',
    website: '',
    phone: '',
    guestEmail: '',
    // Gym's actual location - comprehensive for worldwide support
    gymLocation: {
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
  });

  const commonAmenities = [
    'Free Weights', 'Cardio Equipment', 'Swimming Pool', 'Sauna', 'Steam Room',
    'Group Classes', 'Personal Training', 'Locker Rooms', 'Parking',
    'Juice Bar', 'Towel Service', '24/7 Access', 'CrossFit Box',
    'Basketball Court', 'Tennis Court', 'Rock Climbing Wall'
  ];

  // Type definitions with icons and descriptions
  const facilityTypes = [
    { 
      value: 'gym', 
      label: 'Gym', 
      icon: <Dumbbell size={16} />, 
      description: 'Traditional fitness centers and gyms',
      placeholder: 'e.g. Planet Fitness Downtown'
    },
    { 
      value: 'sport_center', 
      label: 'Sport Center', 
      icon: <Trophy size={16} />, 
      description: 'Multi-sport facilities and recreation centers',
      placeholder: 'e.g. Community Sports Complex'
    },
    { 
      value: 'community', 
      label: 'Community', 
      icon: <Home size={16} />, 
      description: 'Community centers and local groups',
      placeholder: 'e.g. Neighborhood Fitness Group'
    },
    { 
      value: 'event', 
      label: 'Event', 
      icon: <Calendar size={16} />, 
      description: 'Fitness events and temporary activities',
      placeholder: 'e.g. Weekend Running Club'
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: <Building size={16} />, 
      description: 'Other fitness-related venues',
      placeholder: 'e.g. Outdoor Training Area'
    }
  ];

  // Common countries for quick selection
  const commonCountries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'RU', name: 'Russia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SG', name: 'Singapore' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'NZ', name: 'New Zealand' }
  ].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (location && location.lat && location.lng) {
      fetchNearbyGyms();
      
      // Auto-detect user's country from their location
      if (!createFormData.gymLocation.country && location.country) {
        setCreateFormData(prev => ({
          ...prev,
          gymLocation: {
            ...prev.gymLocation,
            country: location.country
          }
        }));
      }
    }
  }, [location]);

  const hasUnappliedChanges = () => {
  if (selectedGyms.length !== appliedSelections.length) return true;
  return selectedGyms.some(gym => !appliedSelections.some(applied => applied._id === gym._id));
};

  const fetchNearbyGyms = async (query = '') => {
    try {
      setLoading(true);
      const nearbyGyms = await gymBrosLocationService.searchNearbyGyms(
        location,
        query,
        searchRadius // Use configurable radius
      );
      setGyms(nearbyGyms);
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (location) {
      fetchNearbyGyms(query);
    }
  };

  const handleRadiusChange = async (newRadius) => {
  setSearchRadius(newRadius);
  if (location) {
    try {
      setLoading(true);
      const nearbyGyms = await gymBrosLocationService.searchNearbyGyms(
        location,
        searchQuery,
        newRadius
      );
      setGyms(nearbyGyms);
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  }
};

  const handleGymToggle = (gym) => {
  setSelectedGyms(prev => {
    const isSelected = prev.some(selected => selected._id === gym._id);
    const newSelection = isSelected 
      ? prev.filter(selected => selected._id !== gym._id)
      : [...prev, gym];
    
    // If selection changed, hide applied state
    if (showApplied) {
      setShowApplied(false);
    }
    
    return newSelection;
  });
};

  const handleApplySelection = () => {
  // Pass selected gyms to parent component
  onGymSelect && onGymSelect(selectedGyms);
  
  // Update UI state
  setAppliedSelections([...selectedGyms]);
  setShowApplied(true);
  
  // Hide the applied state after 2 seconds
  setTimeout(() => {
    setShowApplied(false);
  }, 2000);
};

  const formatLocationDisplay = (location) => {
    if (!location) return 'Unknown location';
    
    const parts = [];
    
    if (location.address && location.address.trim()) {
      parts.push(location.address.trim());
    }
    
    if (location.city && location.city.trim()) {
      parts.push(location.city.trim());
    }
    
    if (location.state && location.state.trim() && location.state !== 'undefined') {
      parts.push(location.state.trim());
    }
    
    if (location.country && location.country.trim()) {
      // Show country code for non-US/CA locations
      if (!['US', 'CA'].includes(location.country)) {
        parts.push(location.country);
      }
    }
    
    if (location.zipCode && location.zipCode.trim()) {
      parts.push(location.zipCode.trim());
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Your current location';
  };

  const validateGymLocation = () => {
    if (useCurrentLocation) {
      return true;
    }

    const loc = createFormData.gymLocation;
    const errors = [];

    if (!loc.address.trim()) {
      errors.push('Street address is required');
    }
    if (!loc.city.trim()) {
      errors.push('City is required');
    }
    if (!loc.country.trim()) {
      errors.push('Country is required');
    }

    if (errors.length > 0) {
      alert('Please complete the gym location:\n' + errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleCreateGym = async () => {
    try {
      if (!createFormData.name.trim()) {
        alert('Name is required');
        return;
      }

      if (!validateGymLocation()) {
        return;
      }

      let createdByUserId = userId;
      if (isGuest) {
        if (!createFormData.guestEmail || !createFormData.guestEmail.includes('@')) {
          alert('Please enter a valid email to add a facility as a guest.');
          return;
        }
        createdByUserId = createFormData.guestEmail.trim();
      }

      let gymLocationData;
      
      if (useCurrentLocation) {
        // Use user's current location as gym location
        gymLocationData = {
          lat: location.lat,
          lng: location.lng,
          address: location.address || '',
          city: location.city || '',
          state: location.state || '',
          country: location.country || '',
          zipCode: location.zipCode || ''
        };
      } else {
        // Use the entered address - backend will geocode it
        gymLocationData = {
          address: createFormData.gymLocation.address.trim(),
          city: createFormData.gymLocation.city.trim(),
          state: createFormData.gymLocation.state.trim(),
          country: createFormData.gymLocation.country.trim(),
          zipCode: createFormData.gymLocation.zipCode.trim(),
          // Pass user's coordinates as fallback
          lat: location.lat,
          lng: location.lng
        };
      }

      setGeocodingInProgress(true);

      const gymData = {
        name: createFormData.name.trim(),
        type: createFormData.type, // Include the type
        location: gymLocationData,
        userLocation: location, // User's current location for distance calculation
        description: createFormData.description.trim(),
        gymChain: createFormData.gymChain.trim(),
        website: createFormData.website.trim(),
        phone: createFormData.phone.trim(),
        amenities: createFormData.amenities,
        createdByUserId,
        shouldGeocode: !useCurrentLocation // Tell backend whether to geocode
      };

      const result = await gymBrosLocationService.createGym(gymData);
      
      if (result.success) {
        // Check if geocoding was successful
        if (result.geocoded === false && !useCurrentLocation) {
          alert('Note: The facility was created but we couldn\'t find the exact location. It may appear at an approximate location.');
        }
        
        onCreateGym && onCreateGym(result.gym);
        
        // Auto-select the newly created gym
        setSelectedGyms(prev => [...prev, result.gym]);
        
        setShowCreateForm(false);
        setCreateFormData({
          name: '',
          type: 'gym',
          gymChain: '',
          amenities: [],
          description: '',
          website: '',
          phone: '',
          guestEmail: '',
          gymLocation: {
            address: '',
            city: '',
            state: '',
            country: location.country || '',
            zipCode: ''
          }
        });
        setUseCurrentLocation(false);
        // Refresh gym list
        fetchNearbyGyms(searchQuery);
      }
    } catch (error) {
      console.error('Error creating gym:', error);
      alert('Failed to create facility. Please try again.');
    } finally {
      setGeocodingInProgress(false);
    }
  };

  const toggleAmenity = (amenity) => {
    setCreateFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getTypeIcon = (type) => {
    const typeConfig = facilityTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : <Building size={16} />;
  };

  const getTypeLabel = (type) => {
    const typeConfig = facilityTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.label : 'Other';
  };

  // Filter gyms by selected type
  const filteredGyms = selectedType === 'all' 
    ? gyms 
    : gyms.filter(gym => gym.type === selectedType);

  if (!location || !location.lat || !location.lng) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60 text-sm">
          Please set your location first to find nearby facilities
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Skip Option */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => onGymSelect && onGymSelect([])}
          className="text-white/70 text-sm hover:text-white transition-colors"
        >
          Skip for now - I'll add my facilities later
        </button>
      </div>

      {/* Search Radius and Type Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Radius Selector */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Search radius:</label>
          <select 
            value={searchRadius} 
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="w-full p-3 bg-white border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value={5}>5 miles</option>
            <option value={10}>10 miles</option>
            <option value={25}>25 miles</option>
            <option value={50}>50 miles</option>
            <option value={100}>100 miles</option>
            <option value={250}>250 miles</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <label className="text-white text-sm font-medium">Filter by type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-3 bg-white border-2 border-gray-300 rounded-xl text-black focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="all">All Types</option>
            {facilityTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type Filter Buttons (Alternative visual display) */}
      <div className="space-y-2">
        <label className="text-white text-sm font-medium">Quick filter:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-white/30 text-white border-2 border-white/40'
                : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
            }`}
          >
            All Types ({gyms.length})
          </button>
          {facilityTypes.map(type => {
            const count = gyms.filter(gym => gym.type === type.value).length;
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  selectedType === type.value
                    ? 'bg-white/30 text-white border-2 border-white/40'
                    : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                }`}
              >
                {type.icon}
                {type.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for facilities..."
          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {/* Selected Count and Apply Button */}
{selectedGyms.length > 0 && (
  <div className={`border rounded-xl p-4 transition-all duration-300 ${
    showApplied && !hasUnappliedChanges()
      ? 'bg-green-600/20 border-green-400/30' 
      : 'bg-blue-600/20 border-blue-400/30'
  }`}>
    <div className="flex items-center justify-between">
      <div className="text-white">
        <span className="font-medium">{selectedGyms.length}</span> facility{selectedGyms.length !== 1 ? 'ies' : ''} selected
        {hasUnappliedChanges() && appliedSelections.length > 0 && (
          <span className="text-yellow-300 text-sm ml-2">(changes not applied)</span>
        )}
      </div>
      <button
        onClick={handleApplySelection}
        disabled={showApplied && !hasUnappliedChanges()}
        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
          showApplied && !hasUnappliedChanges()
            ? 'bg-green-600 text-white cursor-default'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {showApplied && !hasUnappliedChanges() ? (
          <>
            <Check size={16} />
            Applied!
          </>
        ) : (
          <>
            <Check size={16} />
            Apply Selection
          </>
        )}
      </button>
    </div>
  </div>
)}
      {/* Gym List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/10 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {filteredGyms.map((gym) => {
            const isSelected = selectedGyms.some(selected => selected._id === gym._id);
            return (
              <div
                key={gym._id}
                className={`bg-white/10 rounded-xl p-4 cursor-pointer transition-all hover:bg-white/20 ${
                  isSelected ? 'ring-2 ring-blue-400 bg-white/20' : ''
                }`}
                onClick={() => handleGymToggle(gym)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(gym.type)}
                      <h3 className="text-white font-medium">
                        {gym.name}
                      </h3>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white/80">
                        {getTypeLabel(gym.type)}
                      </span>
                    </div>
                    {gym.gymChain && (
                      <div className="flex items-center text-white/70 text-sm mt-1">
                        <Building size={14} className="mr-1" />
                        <span>{gym.gymChain}</span>
                      </div>
                    )}
                    <div className="flex items-center text-white/70 text-sm mt-1">
                      <MapPin size={14} className="mr-1" />
                      <span>{formatLocationDisplay(gym.location)}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      {gym.distanceMiles !== undefined && gym.distanceMiles !== null && (
                        <span className="text-white/70 text-xs font-medium">
                          {gym.distanceMiles.toFixed(1)} mi away
                        </span>
                      )}
                      {gym.memberCount > 0 && (
                        <div className="flex items-center text-white/70 text-xs">
                          <Users size={12} className="mr-1" />
                          <span>{gym.memberCount} members</span>
                        </div>
                      )}
                      {gym.rating?.average > 0 && (
                        <div className="flex items-center text-yellow-400 text-xs">
                          <Star size={12} className="mr-1" />
                          <span>{gym.rating.average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {gym.amenities && gym.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {gym.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="px-2 py-1 bg-white/10 rounded text-xs text-white/80"
                          >
                            {amenity}
                          </span>
                        ))}
                        {gym.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
                            +{gym.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <div className="bg-blue-500 rounded-full p-1">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                    <ChevronRight className="text-white/40" size={20} />
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredGyms.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-white/60 text-sm mb-4">
                No facilities found{searchQuery ? ` for "${searchQuery}"` : ' nearby'} 
                {selectedType !== 'all' && ` of type "${getTypeLabel(selectedType)}"`}
                {` within ${searchRadius} miles`}
              </div>
              <button
                onClick={() => handleRadiusChange(searchRadius === 250 ? 25 : Math.min(searchRadius * 2, 250))}
                className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
              >
                {searchRadius < 250 ? `Try ${Math.min(searchRadius * 2, 250)} miles →` : 'Reset to 25 miles'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create New Facility Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Can't find your facility? Add it
        </button>
      </div>

      {/* Create Facility Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-lg flex items-center">
                <Globe className="mr-2" size={20} />
                Add New Facility (Worldwide)
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-white/60 hover:text-white"
                disabled={geocodingInProgress}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Facility Type */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Facility Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {facilityTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setCreateFormData(prev => ({ ...prev, type: type.value }))}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        createFormData.type === type.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {type.icon}
                        <span className="font-medium">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-300">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Facility Name */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {getTypeLabel(createFormData.type)} Name *
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={facilityTypes.find(t => t.value === createFormData.type)?.placeholder}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Location Toggle and Fields */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white text-sm font-medium flex items-center">
                    <MapPin className="mr-2" size={16} />
                    Facility Location
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCurrentLocation}
                      onChange={(e) => setUseCurrentLocation(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-white text-sm">I'm at this location now</span>
                  </label>
                </div>
                
                {!useCurrentLocation ? (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={createFormData.gymLocation.address}
                        onChange={(e) => setCreateFormData(prev => ({ 
                          ...prev, 
                          gymLocation: { ...prev.gymLocation, address: e.target.value }
                        }))}
                        placeholder="Street address * (e.g., 123 Main Street)"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={createFormData.gymLocation.city}
                        onChange={(e) => setCreateFormData(prev => ({ 
                          ...prev, 
                          gymLocation: { ...prev.gymLocation, city: e.target.value }
                        }))}
                        placeholder="City *"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={createFormData.gymLocation.state}
                        onChange={(e) => setCreateFormData(prev => ({ 
                          ...prev, 
                          gymLocation: { ...prev.gymLocation, state: e.target.value }
                        }))}
                        placeholder="State/Province/Region"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={createFormData.gymLocation.country}
                        onChange={(e) => setCreateFormData(prev => ({ 
                          ...prev, 
                          gymLocation: { ...prev.gymLocation, country: e.target.value }
                        }))}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Country *</option>
                        <optgroup label="Common Countries">
                          {commonCountries.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      <input
                        type="text"
                        value={createFormData.gymLocation.zipCode}
                        onChange={(e) => setCreateFormData(prev => ({ 
                          ...prev, 
                          gymLocation: { ...prev.gymLocation, zipCode: e.target.value }
                        }))}
                        placeholder="ZIP/Postal Code"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="bg-blue-900/30 border border-blue-600/50 rounded p-2">
                      <p className="text-blue-200 text-xs">
                        We'll geocode this address to place the facility accurately on the map.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    <MapPin className="inline mr-1" size={14} />
                    Using: {formatLocationDisplay(location)}
                  </p>
                )}
              </div>

              {/* Chain/Organization (Optional) */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Chain/Organization (Optional)
                </label>
                <input
                  type="text"
                  value={createFormData.gymChain}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, gymChain: e.target.value }))}
                  placeholder="e.g. Planet Fitness, LA Fitness, Community Recreation"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234-567-8900"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={createFormData.website}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-gray-800 p-3 rounded-lg">
                  {commonAmenities.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center text-sm text-white cursor-pointer hover:text-blue-300"
                    >
                      <input
                        type="checkbox"
                        checked={createFormData.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="mr-2 accent-blue-500"
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the facility, special features, etc..."
                  rows={3}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Guest Email (if guest) */}
              {isGuest && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Your Email * (Required for guests)
                  </label>
                  <input
                    type="email"
                    value={createFormData.guestEmail}
                    onChange={e => setCreateFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={geocodingInProgress}
                  className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateGym}
                  disabled={geocodingInProgress}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {geocodingInProgress ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Geocoding...
                    </>
                  ) : (
                    `Add ${getTypeLabel(createFormData.type)}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymSelector;