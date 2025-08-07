import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, MapPin, Users, Star, Clock, Dumbbell,
  Building, ChevronRight, X
} from 'lucide-react';
import gymBrosLocationService from '../../services/gymBrosLocation.service.js';

const GymSelector = ({ location, selectedGym, onGymSelect, onCreateGym }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    address: '',
    gymChain: '',
    amenities: [],
    description: ''
  });

  const commonAmenities = [
    'Free Weights', 'Cardio Equipment', 'Swimming Pool', 'Sauna', 'Steam Room',
    'Group Classes', 'Personal Training', 'Locker Rooms', 'Parking',
    'Juice Bar', 'Towel Service', '24/7 Access', 'CrossFit Box'
  ];

  useEffect(() => {
    if (location && location.lat && location.lng) {
      fetchNearbyGyms();
    }
  }, [location]);

  const fetchNearbyGyms = async (query = '') => {
    try {
      setLoading(true);
      const nearbyGyms = await gymBrosLocationService.searchNearbyGyms(
        location,
        query,
        25 // 25 mile radius
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

  const handleGymSelect = (gym) => {
    onGymSelect && onGymSelect(gym);
  };

  const handleCreateGym = async () => {
    try {
      if (!createFormData.name.trim()) {
        alert('Gym name is required');
        return;
      }

      const gymData = {
        name: createFormData.name.trim(),
        location: {
          lat: location.lat,
          lng: location.lng,
          address: createFormData.address || location.address,
          city: location.city,
          state: location.state,
          country: location.country || 'US'
        },
        description: createFormData.description,
        gymChain: createFormData.gymChain,
        amenities: createFormData.amenities
      };

      const result = await gymBrosLocationService.createGym(gymData);
      
      if (result.success) {
        onCreateGym && onCreateGym(result.gym);
        onGymSelect && onGymSelect(result.gym);
        setShowCreateForm(false);
        setCreateFormData({
          name: '',
          address: '',
          gymChain: '',
          amenities: [],
          description: ''
        });
        // Refresh gym list
        fetchNearbyGyms(searchQuery);
      }
    } catch (error) {
      console.error('Error creating gym:', error);
      alert('Failed to create gym. Please try again.');
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

  if (!location || !location.lat || !location.lng) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60 text-sm">
          Please set your location first to find nearby gyms
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
          onClick={() => onGymSelect && onGymSelect(null)}
          className="text-white/70 text-sm hover:text-white transition-colors"
        >
          Skip for now - I'll add my gym later
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for your gym..."
          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

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
          {gyms.map((gym) => (
            <div
              key={gym._id}
              className={`bg-white/10 rounded-xl p-4 cursor-pointer transition-all hover:bg-white/20 ${
                selectedGym && selectedGym._id === gym._id ? 'ring-2 ring-blue-400 bg-white/20' : ''
              }`}
              onClick={() => handleGymSelect(gym)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-medium">
                    {gym.name}
                  </h3>
                  {gym.gymChain && (
                    <div className="flex items-center text-white/70 text-sm mt-1">
                      <Building size={14} className="mr-1" />
                      <span>{gym.gymChain}</span>
                    </div>
                  )}
                  <div className="flex items-center text-white/70 text-sm mt-1">
                    <MapPin size={14} className="mr-1" />
                    <span>
                      {gym.location.address || `${gym.location.city}, ${gym.location.state}`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    {gym.distanceMiles !== undefined && (
                      <span className="text-white/70 text-xs">
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
                <ChevronRight className="text-white/40" size={20} />
              </div>
            </div>
          ))}
          
          {gyms.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-white/60 text-sm mb-4">
                No gyms found{searchQuery ? ` for "${searchQuery}"` : ' nearby'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create New Gym Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Can't find your gym? Add it
        </button>
      </div>

      {/* Create Gym Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-lg">Add New Gym</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Gym Name *
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Planet Fitness"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={createFormData.address}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={location.address || "Enter gym address"}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Gym Chain (Optional)
                </label>
                <input
                  type="text"
                  value={createFormData.gymChain}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, gymChain: e.target.value }))}
                  placeholder="e.g. Planet Fitness, LA Fitness"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {commonAmenities.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center text-sm text-white cursor-pointer"
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

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the gym..."
                  rows={3}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateGym}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Gym
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
