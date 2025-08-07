import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Plus, Search, Star } from 'lucide-react';
import gymBrosLocationService from '../../services/gymBrosLocation.service.js';

const NearbyGymsPreview = ({ location, onGymSelect, maxResults = 3 }) => {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location && location.lat && location.lng) {
      fetchNearbyGyms();
    }
  }, [location]);

  const fetchNearbyGyms = async () => {
    try {
      setLoading(true);
      const nearbyGyms = await gymBrosLocationService.searchNearbyGyms(
        location,
        '',
        15 // 15 mile radius for preview
      );
      setGyms(nearbyGyms.slice(0, maxResults));
    } catch (error) {
      console.error('Error fetching nearby gyms:', error);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/10 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-3 bg-white/20 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (gyms.length === 0) {
    return (
      <div className="bg-white/10 rounded-lg p-4 text-center">
        <div className="text-white/60 text-sm">
          No gyms found nearby. You can add one later!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gyms.map((gym) => (
        <div
          key={gym._id}
          className="bg-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-colors"
          onClick={() => onGymSelect && onGymSelect(gym)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-white font-medium text-sm">
                {gym.name}
              </h4>
              <div className="flex items-center text-white/70 text-xs mt-1">
                <MapPin size={12} className="mr-1" />
                <span>
                  {gym.location.city} • {gym.distanceMiles?.toFixed(1) || '0.0'} mi
                </span>
              </div>
              {gym.memberCount > 0 && (
                <div className="flex items-center text-white/70 text-xs mt-1">
                  <Users size={12} className="mr-1" />
                  <span>{gym.memberCount} members</span>
                </div>
              )}
            </div>
            {gym.rating?.average > 0 && (
              <div className="flex items-center text-yellow-400 text-xs">
                <Star size={12} className="mr-1" />
                <span>{gym.rating.average.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="text-center">
        <button
          type="button"
          className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
          onClick={() => onGymSelect && onGymSelect('view_all')}
        >
          View all nearby gyms →
        </button>
      </div>
    </div>
  );
};

export default NearbyGymsPreview;
