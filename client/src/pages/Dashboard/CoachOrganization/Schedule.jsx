import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Clock, User, 
  PlusCircle, X, Check, Edit, Trash2, AlertTriangle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clientService from '../../../services/client.service'; // Import the client service
import { toast } from 'sonner';

const Schedule = ({ clients = [], onRefreshData, darkMode }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSession, setNewSession] = useState({
    clientId: '',
    date: '',
    time: '',
    type: '',
    duration: '60 minutes',
    notes: ''
  });
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editedSession, setEditedSession] = useState(null);
  const [groupedSessions, setGroupedSessions] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Fetch sessions from backend on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Group sessions by date whenever the sessions array changes
  useEffect(() => {
    groupSessionsByDate();
  }, [sessions]);

  // Fetch sessions from backend
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching sessions...');
      const response = await clientService.getCoachSessions();
      console.log('Sessions response:', response.data || response);
      
      // Handle both formats - response.data or direct response
      const sessionsData = response.data || response;
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load scheduled sessions');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group sessions by date for display
  const groupSessionsByDate = () => {
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      setGroupedSessions([]);
      return;
    }
    
    const grouped = {};
    
    sessions.forEach(session => {
      // Ensure date is a string
      const dateStr = typeof session.date === 'string' ? session.date : new Date(session.date).toISOString().split('T')[0];
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(session);
    });
    
    const formattedGroups = Object.entries(grouped).map(([date, sessions]) => ({
      date,
      sessions: sessions.sort((a, b) => {
        // Sort by time within the same date
        return a.time.localeCompare(b.time);
      })
    }));

    // Sort groups by date
    formattedGroups.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    setGroupedSessions(formattedGroups);
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setNewSession({
      clientId: '',
      date: new Date().toISOString().split('T')[0], // Default to today
      time: '',
      type: '',
      duration: '60 minutes',
      notes: ''
    });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewSession({
      clientId: '',
      date: '',
      time: '',
      type: '',
      duration: '60 minutes',
      notes: ''
    });
  };

  const handleSaveNewSession = async () => {
    // Validate required fields
    if (!newSession.clientId || !newSession.date || !newSession.time || !newSession.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare session data for API
      const sessionData = {
        clientId: newSession.clientId,
        date: newSession.date,
        time: newSession.time,
        type: newSession.type,
        duration: newSession.duration,
        notes: newSession.notes || ''
      };
      
      console.log('Creating new session with data:', sessionData);
      
      // Send to backend
      const response = await clientService.createSession(sessionData);
      
      if (response.data || response) {
        toast.success('Session scheduled successfully');
        await fetchSessions(); // Refresh the sessions list
        
        // Reset form and close it
        handleCancelAdd();
        
        // Refresh parent component if needed
        if (onRefreshData) {
          onRefreshData();
        }
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to schedule session');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (sessionId) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    
    try {
      setIsLoading(true);
      
      console.log('Deleting session:', sessionToDelete);
      
      // Send delete request to backend
      await clientService.deleteSession(sessionToDelete);
      
      toast.success('Session deleted successfully');
      await fetchSessions(); // Refresh the sessions list
      
      // Refresh parent component if needed
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const handleEditClick = (session) => {
    setEditingSessionId(session.id);
    setEditedSession({...session});
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditedSession(null);
  };

  const handleSaveEdit = async () => {
    if (!editedSession) return;

    // Validate required fields
    if (!editedSession.clientId || !editedSession.date || !editedSession.time || !editedSession.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      
      // Prepare session data for API
      const sessionData = {
        clientId: editedSession.clientId,
        date: editedSession.date,
        time: editedSession.time,
        type: editedSession.type,
        duration: editedSession.duration,
        notes: editedSession.notes || ''
      };
      
      console.log('Updating session with data:', sessionData);
      
      // Send to backend
      const response = await clientService.updateSession(editedSession.id, sessionData);
      
      if (response.data || response) {
        toast.success('Session updated successfully');
        await fetchSessions(); // Refresh the sessions list
        
        // Reset edit state
        setEditingSessionId(null);
        setEditedSession(null);
        
        // Refresh parent component if needed
        if (onRefreshData) {
          onRefreshData();
        }
      }
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a client from the dropdown
  const handleClientSelect = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setNewSession({
        ...newSession,
        clientId: clientId,
        clientName: `${selectedClient.firstName} ${selectedClient.lastName || ''}`.trim()
      });
    }
  };

  // Handle selecting a client during edit
  const handleEditClientSelect = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setEditedSession({
        ...editedSession,
        clientId: clientId,
        clientName: `${selectedClient.firstName} ${selectedClient.lastName || ''}`.trim()
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`space-y-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      {/* Add Session Button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleAddClick}
          className={`${darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          disabled={isLoading}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Session
        </Button>
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
            >
              <div className="flex items-start mb-4">
                <div className="bg-red-100 p-2 rounded-full mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Session</h3>
                  <p className="text-gray-600">Are you sure you want to delete this session? This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={cancelDelete}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    'Delete Session'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Client*</label>
              <Select onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {`${client.firstName} ${client.lastName || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Type*</label>
              <Select onValueChange={(value) => setNewSession({...newSession, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Workout Review">Workout Review</SelectItem>
                  <SelectItem value="Progress Check">Progress Check</SelectItem>
                  <SelectItem value="Training Session">Training Session</SelectItem>
                  <SelectItem value="Nutrition Consultation">Nutrition Consultation</SelectItem>
                  <SelectItem value="Goal Setting">Goal Setting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date*</label>
              <Input
                id="metric-date"
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                required
                min={new Date().toISOString().split('T')[0]}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <Select 
                defaultValue="60 minutes"
                onValueChange={(value) => setNewSession({...newSession, duration: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 minutes">30 minutes</SelectItem>
                  <SelectItem value="45 minutes">45 minutes</SelectItem>
                  <SelectItem value="60 minutes">60 minutes</SelectItem>
                  <SelectItem value="90 minutes">90 minutes</SelectItem>
                  <SelectItem value="120 minutes">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <Input
                type="text"
                value={newSession.notes || ''}
                onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                placeholder="Optional notes about this session"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancelAdd} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleSaveNewSession}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Session
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Display loading state */}
      {isLoading && !isAdding && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Sessions List */}
      {!isLoading && groupedSessions.length > 0 ? (
        <div className="space-y-8">
          {groupedSessions.map((group) => (
            <div key={group.date} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                {formatDate(group.date)}
              </h3>
              <div className="space-y-4">
                {group.sessions.map((session) => (
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Client*</label>
                          <Select onValueChange={handleEditClientSelect} defaultValue={session.clientId}>
                            <SelectTrigger>
                              <SelectValue placeholder={session.clientName} />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                  {`${client.firstName} ${client.lastName || ''}`.trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Session Type*</label>
                          <Select 
                            defaultValue={editedSession.type}
                            onValueChange={(value) => setEditedSession({...editedSession, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select session type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Workout Review">Workout Review</SelectItem>
                              <SelectItem value="Progress Check">Progress Check</SelectItem>
                              <SelectItem value="Training Session">Training Session</SelectItem>
                              <SelectItem value="Nutrition Consultation">Nutrition Consultation</SelectItem>
                              <SelectItem value="Goal Setting">Goal Setting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date*</label>
                          <Input
                            type="date"
                            value={editedSession.date}
                            onChange={(e) => setEditedSession({...editedSession, date: e.target.value})}
                            required
                            min={new Date().toISOString().split('T')[0]}
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                          <Select 
                            defaultValue={editedSession.duration || "60 minutes"}
                            onValueChange={(value) => setEditedSession({...editedSession, duration: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30 minutes">30 minutes</SelectItem>
                              <SelectItem value="45 minutes">45 minutes</SelectItem>
                              <SelectItem value="60 minutes">60 minutes</SelectItem>
                              <SelectItem value="90 minutes">90 minutes</SelectItem>
                              <SelectItem value="120 minutes">120 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <Input
                            type="text"
                            value={editedSession.notes || ''}
                            onChange={(e) => setEditedSession({...editedSession, notes: e.target.value})}
                            placeholder="Optional notes about this session"
                          />
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
                                <Clock className="w-4 h-4 mr-1" />
                                {session.time}
                              </span>
                              <span>{session.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditClick(session)}
                              className="text-blue-600 hover:bg-blue-50"
                              disabled={isLoading}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => openDeleteDialog(session.id)}
                             className="text-red-600 hover:bg-red-50"
                             disabled={isLoading}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                            {session.type}
                          </div>
                          {session.notes && (
                            <div className="text-xs text-gray-500">
                              Notes: {session.notes}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {editingSessionId === session.id && (
                      <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleCancelEdit} disabled={isLoading}>
                          Cancel
                        </Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700" 
                          onClick={handleSaveEdit}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No sessions scheduled</p>
          <p className="text-sm text-gray-400 mb-4">Click "Add Session" to schedule a new session</p>
        </div>
      ) : null}
    </div>
  );
};

export default Schedule;