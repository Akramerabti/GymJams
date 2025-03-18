import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isBefore, isToday, addDays } from 'date-fns';
import { toast } from 'sonner';
import clientService from '../../../services/client.service';

const UpcomingSessions = ({ subscription, onViewAll }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchSessions();
  }, [subscription]);

  // Function to format date
  const formatSessionDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Check if date is in the past
  const isPastSession = (dateString, timeString) => {
    try {
      const today = new Date();
      const sessionDate = parseISO(dateString);
      
      if (isBefore(sessionDate, today) && !isToday(sessionDate)) {
        return true;
      }
      
      if (isToday(sessionDate) && timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const sessionTime = new Date();
        sessionTime.setHours(hours, minutes, 0, 0);
        return isBefore(sessionTime, today);
      }
      
      return false;
    } catch (e) {
      return false;
    }
  };

  // Get badge color based on date
  const getSessionBadge = (dateString, timeString) => {
    if (isPastSession(dateString, timeString)) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Missed
        </Badge>
      );
    }
    
    try {
      const sessionDate = parseISO(dateString);
      
      if (isToday(sessionDate)) {
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Today
          </Badge>
        );
      }
      
      if (isBefore(new Date(), addDays(sessionDate, 2))) {
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Upcoming
          </Badge>
        );
      }
    } catch (e) {
      // Default badge for parsing errors
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Scheduled
        </Badge>
      );
    }
    
    // Default badge
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        Scheduled
      </Badge>
    );
  };

  // Handle add to calendar
  const handleAddToCalendar = (session) => {
    try {
      const title = `Coaching Session: ${session.type}`;
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

  // No sessions state
  if (!isLoading && sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-xl font-medium text-gray-700">No scheduled sessions</h3>
            <p className="text-gray-500 mt-2">Your coach hasn't scheduled any sessions yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Sessions</CardTitle>
        {sessions.length > 3 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onViewAll}
          >
            View All
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.slice(0, 3).map((session, index) => (
              <motion.div
                key={session.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium text-lg">{session.type}</h3>
                  {getSessionBadge(session.date, session.time)}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    <span>{formatSessionDate(session.date)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    <span>{session.time} • {session.duration || '60 minutes'}</span>
                  </div>
                </div>
                
                {!isPastSession(session.date, session.time) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleAddToCalendar(session)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Show notification if there are more than 3 sessions */}
        {sessions.length > 3 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-700">
                You have {sessions.length - 3} more scheduled session{sessions.length - 3 > 1 ? 's' : ''}.
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-blue-700 font-semibold hover:text-blue-900"
                  onClick={onViewAll}
                >
                  View all
                </Button>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingSessions;