import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, CheckCircle, AlertTriangle, Info, ChevronRight, 
  Download, Calendar as CalendarIcon, PlusCircle, X, Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isBefore, isToday, addDays } from 'date-fns';
import { toast } from 'sonner';
import clientService from '../../../services/client.service.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextArea } from '@/components/ui/textarea';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return format(date, 'EEEE, MMMM d, yyyy');
};

// Helper function to format date for input field
const formatDateForInput = (date) => {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
};

// Helper function to get today's date string
const getTodayString = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

const SessionsView = ({ subscription }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    date: getTodayString(),
    time: '09:00',
    sessionType: 'General Check-in',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is allowed to request sessions based on subscription tier
  const canRequestSessions = subscription?.subscription === 'premium' || subscription?.subscription === 'elite';

  useEffect(() => {
    fetchSessions();
  }, [subscription]);

  const fetchSessions = async () => {
    if (!subscription || !subscription._id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call API to fetch sessions for this subscription
      const response = await clientService.getClientSessions(subscription._id);
      
      if (response && Array.isArray(response.data)) {
        // Sort sessions by date and time
        const sortedSessions = response.data.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA - dateB;
        });
        
        setSessions(sortedSessions);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Unable to load your scheduled sessions. Please try again later.');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const SESSION_TYPE_MAPPING = {
    'General Check-in': 'general',
    'Form Review': 'form',
    'Progress Review': 'progress',
    'Nutrition Consultation': 'nutrition',
    'Goal Setting': 'goal'
  };
  

  // Handle add to calendar
  const handleAddToCalendar = (session) => {
    try {
      const title = `Coaching Session: ${session.type || 'Coaching'}`;
      const startDate = `${session.date}T${session.time}`;
      const endTime = calculateEndTime(session.time, session.duration);
      const endDate = `${session.date}T${endTime}`;
      const description = `Coaching session with ${session.coachName || 'your coach'}: ${session.type}`;
      
      // Create Google Calendar URL
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate.replace(/[-:]/g, '')}/${endDate.replace(/[-:]/g, '')}&details=${encodeURIComponent(description)}`;
      
      // Open in new tab
      window.open(googleCalendarUrl, '_blank');
      
      toast.success('Opening Google Calendar...');
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error('Failed to add to calendar');
    }
  };

  // Calculate end time based on duration
  const calculateEndTime = (timeString, durationString) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      let durationMinutes = 60; // Default 60 minutes
      
      if (durationString) {
        const match = durationString.match(/(\d+)/);
        if (match) {
          durationMinutes = parseInt(match[1], 10);
        }
      }
      
      let endHours = hours + Math.floor(durationMinutes / 60);
      let endMinutes = minutes + (durationMinutes % 60);
      
      if (endMinutes >= 60) {
        endHours += 1;
        endMinutes -= 60;
      }
      
      // Format with leading zeros
      const formattedHours = String(endHours).padStart(2, '0');
      const formattedMinutes = String(endMinutes).padStart(2, '0');
      
      return `${formattedHours}:${formattedMinutes}`;
    } catch (e) {
      // Return an hour later as fallback
      return timeString;
    }
  };

  const handleRequestSession = () => {
    if (!canRequestSessions) {
      toast.error('Session requests are only available for Premium and Elite members');
      return;
    }
    
    setRequestForm({
      date: getTodayString(),
      time: '09:00',
      sessionType: 'General Check-in',
      notes: '',
    });
    
    setShowRequestModal(true);
  };

  const handleFormChange = (field, value) => {
    setRequestForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitRequest = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate form data
      const sessionDateStr = requestForm.date;
      const todayStr = getTodayString();
      
      if (sessionDateStr < todayStr) {
        toast.error('Session date cannot be in the past');
        setIsSubmitting(false);
        return;
      }
      
      // Get the user-friendly session type and its enum equivalent
      const userFriendlyType = requestForm.sessionType;
      const enumSessionType = SESSION_TYPE_MAPPING[userFriendlyType] || 'general';
      
      // Prepare the request data with both formats
      const sessionData = {
        date: requestForm.date,
        time: requestForm.time,
        sessionType: userFriendlyType,  // Send the user-friendly version
        enumSessionType: enumSessionType, // Send the enum version for the server
        notes: requestForm.notes,
        duration: '60 minutes'
      };
      
      console.log('Sending session request with data:', sessionData);
      
      // Send the actual API request
      const response = await clientService.requestSession(subscription._id, sessionData);
      
      // Handle successful response
      toast.success('Session request sent to your coach!');
      setShowRequestModal(false);
      
      // Add the new session to the local state - use the returned session if available
      const newSession = response?.session || {
        id: `temp-${Date.now()}`,
        date: sessionData.date,
        time: sessionData.time,
        type: userFriendlyType, // Use the user-friendly version for display
        sessionType: enumSessionType, // Keep the enum value too
        notes: sessionData.notes,
        duration: sessionData.duration,
        status: 'pending',
        isPending: true
      };
      
      setSessions(prev => [...prev, newSession]);
      
      // Refresh the sessions list from server after a short delay
      setTimeout(() => {
        fetchSessions();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to request session:', error);
      
      // Provide meaningful error messages based on the error
      if (error.response?.status === 403) {
        toast.error('You don\'t have permission to request sessions with your current plan');
      } else if (error.response?.status === 429) {
        toast.error('You\'ve reached your session request limit');
      } else {
        toast.error('Failed to send session request: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export sessions to calendar
  const exportSessionsToCalendar = () => {
    try {
      if (sessions.length === 0) {
        toast.error('No sessions to export');
        return;
      }
      
      const icsContent = [];
      
      // Add ICS header
      icsContent.push('BEGIN:VCALENDAR');
      icsContent.push('VERSION:2.0');
      icsContent.push('PRODID:-//GymTonic//Session Calendar//EN');
      
      // Add events
      sessions.forEach(session => {
        icsContent.push('BEGIN:VEVENT');
        
        // Generate UID
        const uid = `${session.id || `session-${Date.now()}`}@gymtonic.app`;
        icsContent.push(`UID:${uid}`);
        
        // Format date and time
        const startDate = `${session.date.replace(/-/g, '')}T${session.time.replace(/:/g, '')}00`;
        
        // Calculate end time (default to 1 hour if no duration specified)
        const endTime = calculateEndTime(session.time, session.duration || '60 minutes');
        const endDate = `${session.date.replace(/-/g, '')}T${endTime.replace(/:/g, '')}00`;
        
        icsContent.push(`DTSTART:${startDate}`);
        icsContent.push(`DTEND:${endDate}`);
        
        // Event details
        icsContent.push(`SUMMARY:Coaching Session: ${session.type || 'Coaching'}`);
        icsContent.push(`DESCRIPTION:Coaching session with ${session.coachName || 'your coach'}`);
        
        icsContent.push('END:VEVENT');
      });
      
      icsContent.push('END:VCALENDAR');
      
      // Create file and download
      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'coaching-sessions.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Calendar exported successfully');
    } catch (error) {
      console.error('Failed to export calendar:', error);
      toast.error('Failed to export calendar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-2xl font-bold">Your Coaching Sessions</h2>
        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
          {sessions.length > 0 && (
            <Button 
              variant="outline" 
              onClick={exportSessionsToCalendar}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Calendar
            </Button>
          )}
          
          {canRequestSessions && (
            <Button 
              onClick={handleRequestSession}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Request Session
            </Button>
          )}
        </div>
      </div>
      
      {!canRequestSessions && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Basic Plan Limitation</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  With your Basic plan, you cannot request additional coaching sessions. 
                  Upgrade to Premium or Elite to request sessions anytime!
                </p>
                <p className="mt-2">
                  <Button 
                    size="sm" 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => window.location.href = '/subscription-management'}
                  >
                    Upgrade Your Plan
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No sessions scheduled</h3>
          <p className="text-gray-500 mb-6">
            {canRequestSessions 
              ? 'Request a session with your coach to get started!' 
              : 'Your coach will schedule sessions for you.'}
          </p>
          {canRequestSessions && (
            <Button 
              onClick={handleRequestSession}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Request Your First Session
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Upcoming Sessions</h3>
            {sessions
              .filter(session => {
                // Filter for future sessions
                const sessionDate = new Date(`${session.date}T${session.time}`);
                return sessionDate >= new Date();
              })
              .map((session, index) => (
                <motion.div
                  key={session.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border rounded-lg transition-shadow hover:shadow-md ${
                    session.isPending ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-lg">{session.type || session.sessionType || 'Coaching Session'}</h4>
                        {session.isPending && (
                          <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                            Awaiting Confirmation
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{formatDate(session.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{session.time} • {session.duration || '60 minutes'}</span>
                        </div>
                        {session.notes && (
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Notes:</span> {session.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCalendar(session)}
                        className="flex items-center"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Add to Calendar
                      </Button>
                      
                      {session.isPending && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            // Remove the pending session
                            setSessions(prev => prev.filter(s => s.id !== session.id));
                            toast.success('Session request cancelled');
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
            {sessions.filter(session => {
              const sessionDate = new Date(`${session.date}T${session.time}`);
              return sessionDate >= new Date();
            }).length === 0 && (
              <p className="text-gray-500 text-center py-4">No upcoming sessions scheduled</p>
            )}
          </div>
          
          {/* Past Sessions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Past Sessions</h3>
            {sessions
              .filter(session => {
                // Filter for past sessions
                const sessionDate = new Date(`${session.date}T${session.time}`);
                return sessionDate < new Date();
              })
              .map((session, index) => (
                <motion.div
                  key={session.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium text-lg">{session.type || 'Coaching Session'}</h4>
                      <div className="mt-2 space-y-1 text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{formatDate(session.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{session.time} • {session.duration || '60 minutes'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                      Completed
                    </Badge>
                  </div>
                </motion.div>
              ))}
              
            {sessions.filter(session => {
              const sessionDate = new Date(`${session.date}T${session.time}`);
              return sessionDate < new Date();
            }).length === 0 && (
              <p className="text-gray-500 text-center py-4">No past sessions</p>
            )}
          </div>
        </div>
      )}
      
      {/* Session Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Coaching Session</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-date">Date</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={requestForm.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  min={getTodayString()}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-time">Time</Label>
                <Input
                  id="session-time"
                  type="time"
                  value={requestForm.time}
                  onChange={(e) => handleFormChange('time', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
  <Label htmlFor="session-type">Session Type</Label>
  <Select 
    value={requestForm.sessionType} 
    onValueChange={(value) => handleFormChange('sessionType', value)}
  >
    <SelectTrigger id="session-type">
      <SelectValue placeholder="Select session type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="General Check-in">General Check-in</SelectItem>
      <SelectItem value="Form Review">Form Review</SelectItem>
      <SelectItem value="Progress Review">Progress Review</SelectItem>
      <SelectItem value="Nutrition Consultation">Nutrition Consultation</SelectItem>
      <SelectItem value="Goal Setting">Goal Setting</SelectItem>
      <SelectItem value="Training Session">Training Session</SelectItem>
    </SelectContent>
  </Select>
</div>
            
            <div className="space-y-2">
              <Label htmlFor="session-notes">Additional Notes</Label>
              <TextArea
                id="session-notes"
                placeholder="Add any details your coach should know about this session..."
                value={requestForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRequestModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Sending...' : 'Request Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionsView;