// components/GymBros/MapSidePanel.jsx
import React, { useEffect, useState } from 'react';
import { 
  X, ChevronLeft, MapPin, Users, Star, Clock, 
  Dumbbell, Calendar, Phone, Globe, Mail, 
  CheckCircle, TrendingUp, Award, Heart
} from 'lucide-react';

const MapSidePanel = ({ isOpen, onClose, data, type }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setActiveTab('info');
    } else {
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [isOpen]);

  if (!data && !isAnimating) return null;

  const renderGymPanel = () => (
    <>
      {/* Header Image */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
              <Dumbbell size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{data.name}</h3>
              {data.gymChain && (
                <p className="text-sm opacity-90">{data.gymChain}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {['info', 'members', 'schedule'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-black">{data.memberCount || 0}</p>
                <p className="text-xs text-black">Members</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <Star className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-black">
                  {data.rating?.average?.toFixed(1) || 'N/A'}
                </p>
                <p className="text-xs text-black">Rating</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-black">
                  {data.distanceMiles?.toFixed(1) || '0'}mi
                </p>
                <p className="text-xs text-black">Distance</p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.address || `${data.location?.city || 'Unknown'}`}
                  </p>
                  <button className="text-blue-600 text-sm font-medium mt-2 hover:underline">
                    Get Directions →
                  </button>
                </div>
              </div>
            </div>

            {/* Hours */}
            {data.hours && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Hours</p>
                    <div className="mt-2 space-y-1">
                      {Object.entries(data.hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{day}</span>
                          <span className="text-gray-900">{hours.open} - {hours.close}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Amenities */}
            {data.amenities && data.amenities.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {data.amenities.map((amenity, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="space-y-2">
              {data.phone && (
                <a 
                  href={`tel:${data.phone}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Phone className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-900">{data.phone}</span>
                </a>
              )}
              {data.website && (
                <a 
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Globe className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-900">Visit Website</span>
                </a>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Member list coming soon!</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.memberCount || 0} active members
              </p>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Class schedule coming soon!</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t space-y-2">
        <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Enter Group
        </button>
      </div>
    </>
  );

  const renderUserPanel = () => (
    <>
      {/* User Header */}
      <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            {data.avatar ? (
              <div dangerouslySetInnerHTML={{ __html: renderAvatarSVG(data.avatar, 60) }} />
            ) : (
              <Users size={32} />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{data.name}</h3>
            <p className="text-sm opacity-90">
              {data.age} years • {data.experienceLevel}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={14} />
              <span className="text-sm">{data.distanceAway || '0'}mi away</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Bio */}
        {data.bio && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">About</h4>
            <p className="text-sm text-gray-600">{data.bio}</p>
          </div>
        )}

        {/* Workout Types */}
        {data.workoutTypes && data.workoutTypes.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Workout Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {data.workoutTypes.map((type, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {data.goals && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Fitness Goals</h4>
            <p className="text-sm text-gray-600">{data.goals}</p>
          </div>
        )}

        {/* Schedule */}
        {data.preferredTime && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Preferred Workout Time</h4>
            </div>
            <p className="text-sm text-gray-600">{data.preferredTime}</p>
          </div>
        )}

        {/* Gym */}
        {data.primaryGym && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Primary Gym</h4>
            </div>
            <p className="text-sm text-gray-600">{data.primaryGym}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t space-y-2">
        <button className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
          View Full Profile
        </button>
        <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Send Message
        </button>
      </div>
    </>
  );

  const renderEventPanel = () => (
    <>
      {/* Event Header */}
      <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 backdrop-blur rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{data.name}</h3>
            <p className="text-sm opacity-90">
              {new Date(data.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Event Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">About This Event</h4>
          <p className="text-sm text-gray-600">{data.description}</p>
        </div>

        {/* Location */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Location</p>
              <p className="text-sm text-gray-600 mt-1">{data.location || 'TBD'}</p>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">
                {data.participants || 0} Interested
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Be one of the first to join!
              </p>
            </div>
          </div>
        </div>

        {/* Organizer */}
        {data.organizer && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Organized By</h4>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-300 rounded-full" />
              <div>
                <p className="font-medium text-gray-900">{data.organizer.name}</p>
                <p className="text-sm text-gray-600">{data.organizer.role || 'Event Organizer'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t space-y-2">
        <button className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
          I'm Interested
        </button>
        <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          Share Event
        </button>
      </div>
    </>
  );

  const renderAvatarSVG = (avatar, size) => {
    // Simple avatar SVG string for inline rendering
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100">
        <ellipse cx="50" cy="65" rx="25" ry="30" fill="${avatar.furColor || '#8B4513'}" />
        <circle cx="50" cy="35" r="20" fill="${avatar.furColor || '#8B4513'}" />
        <circle cx="35" cy="25" r="10" fill="${avatar.furColor || '#8B4513'}" />
        <circle cx="65" cy="25" r="10" fill="${avatar.furColor || '#8B4513'}" />
        <circle cx="43" cy="35" r="3" fill="#000" />
        <circle cx="57" cy="35" r="3" fill="#000" />
      </svg>
    `;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel - Mobile first, responsive design */}
      <div className={`fixed left-0  top-0 h-full w-full md:w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Close Button - Fixed position for mobile */}
        <div className="absolute right-0 top-0 z-50 py-20 p-4">
          <button
            onClick={onClose}
            className="p-2 bg-black/80 backdrop-blur rounded-full shadow-lg hover:bg-black/90 transition-colors"
            aria-label="Close panel"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Content based on type */}
        {data && (
          <>
            {type === 'gym' && renderGymPanel()}
            {type === 'user' && renderUserPanel()}
            {type === 'event' && renderEventPanel()}
          </>
        )}
      </div>
    </>
  );
};

export default MapSidePanel;