import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Clock, User, MoreHorizontal, 
  PlusCircle, X, Check, Edit, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const Schedule = ({ sessions = [], onAddSession, onEditSession, onDeleteSession }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSession, setNewSession] = useState({
    clientId: '',
    clientName: '',
    date: '',
    time: '',
    type: '',
    duration: '60 minutes'
  });
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editedSession, setEditedSession] = useState(null);

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewSession({
      clientId: '',
      clientName: '',
      date: '',
      time: '',
      type: '',
      duration: '60 minutes'
    });
  };

  const handleSaveNewSession = () => {
    // Validate required fields
    if (!newSession.clientName || !newSession.date || !newSession.time || !newSession.type) {
      alert('Please fill in all required fields');
      return;
    }

    // Call the parent component's onAddSession function
    if (onAddSession) {
      onAddSession({
        ...newSession,
        id: `session-${Date.now()}`
      });
    }

    // Reset form and close it
    handleCancelAdd();
  };

  const handleEditClick = (session) => {
    setEditingSessionId(session.id);
    setEditedSession({...session});
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditedSession(null);
  };

  const handleSaveEdit = () => {
    if (!editedSession) return;

    // Validate required fields
    if (!editedSession.clientName || !editedSession.date || !editedSession.time || !editedSession.type) {
      alert('Please fill in all required fields');
      return;
    }

    // Call the parent component's onEditSession function
    if (onEditSession) {
      onEditSession(editedSession);
    }

    // Reset edit state
    setEditingSessionId(null);
    setEditedSession(null);
  };

  const handleDeleteClick = (sessionId) => {
    if (confirm('Are you sure you want to delete this session?')) {
      if (onDeleteSession) {
        onDeleteSession(sessionId);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Session Button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleAddClick}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Session
        </Button>
      </div>

      {/* Add Session Form */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm mb-4"
        >
          <h3 className="font-semibold text-blue-800 mb-3">Add New Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name*</label>
              <Input
                value={newSession.clientName}
                onChange={(e) => setNewSession({...newSession, clientName: e.target.value})}
                placeholder="Client name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Type*</label>
              <Input
                value={newSession.type}
                onChange={(e) => setNewSession({...newSession, type: e.target.value})}
                placeholder="e.g., Workout Review"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date*</label>
              <Input
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time*</label>
              <Input
                type="time"
                value={newSession.time}
                onChange={(e) => setNewSession({...newSession, time: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <Input
                value={newSession.duration}
                onChange={(e) => setNewSession({...newSession, duration: e.target.value})}
                placeholder="e.g., 60 minutes"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancelAdd}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveNewSession}>
              <Check className="w-4 h-4 mr-2" />
              Save Session
            </Button>
          </div>
        </motion.div>
      )}

      {/* Sessions List */}
      {sessions.length > 0 ? (
        sessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            {editingSessionId === session.id ? (
              // Edit Session Form
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name*</label>
                  <Input
                    value={editedSession.clientName}
                    onChange={(e) => setEditedSession({...editedSession, clientName: e.target.value})}
                    placeholder="Client name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type*</label>
                  <Input
                    value={editedSession.type}
                    onChange={(e) => setEditedSession({...editedSession, type: e.target.value})}
                    placeholder="e.g., Workout Review"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date*</label>
                  <Input
                    type="date"
                    value={editedSession.date}
                    onChange={(e) => setEditedSession({...editedSession, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time*</label>
                  <Input
                    type="time"
                    value={editedSession.time}
                    onChange={(e) => setEditedSession({...editedSession, time: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <Input
                    value={editedSession.duration}
                    onChange={(e) => setEditedSession({...editedSession, duration: e.target.value})}
                    placeholder="e.g., 60 minutes"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-2 mt-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              // Session Display
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{session.clientName}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {session.date}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {session.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditClick(session)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteClick(session.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    {session.type}
                  </div>
                  <span>{session.duration}</span>
                </div>
              </>
            )}
          </motion.div>
        ))
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No sessions scheduled</p>
          <p className="text-sm text-gray-400 mb-4">Click "Add Session" to schedule a new session</p>
        </div>
      )}
    </div>
  );
};

export default Schedule;