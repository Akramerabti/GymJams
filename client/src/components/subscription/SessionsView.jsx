import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertTriangle, Filter, ChevronDown, Search, Download, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format, parseISO, isBefore, isToday, addDays, isAfter, isSameDay, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import clientService from '../../services/client.service';

// Helper function to group sessions by date
const groupSessionsByDate = (sessions) => {
  const grouped = {};
  
  sessions.forEach(session => {
    const dateKey = session.date;
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(session);
  });
  
  // Sort sessions within each date by time
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => {
      return a.time.localeCompare(b.time);
    });
  });
  
  // Convert to array and sort by date
  return Object.entries(grouped)
    .map(([date, sessions]) => ({ date, sessions }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const SessionsView = ({ subscription }) => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [groupedSessions, setGroupedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!subscription || !subscription._id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Call API to fetch sessions for this subscription
        const response = await clientService.getClientSessions(subscription._id);
        
        if (response && Array.isArray(response.data)) {
          setSessions(response.data);
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

  // Apply filters whenever sessions, filter status, or search term changes
  useEffect(() => {
    const filterSessions = () => {
      let result = [...sessions];
      
      // Apply status filter
      if (filterStatus !== 'all') {
        const now = new Date();
        
        switch (filterStatus) {
          case 'upcoming':
            result = result.filter(session => {
              const sessionDate = parseISO(session.date);
              return isAfter(sessionDate, now) || isToday(sessionDate);
            });
            break;
          case 'past':
            result = result.filter(session => {
              const sessionDate = parseISO(session.date);
              return isBefore(sessionDate, now) && !isToday(sessionDate);
            });
            break;
          case 'today':
            result = result.filter(session => {
              const sessionDate = parseISO(session.date);
              return isToday(sessionDate);
            });
            break;
          case 'thisWeek':
            result = result.filter(session => {
              const sessionDate = parseISO(session.date);
              const startOfWeek = new Date();
              startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
              startOfWeek.setHours(0, 0, 0, 0);
              
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
              endOfWeek.setHours(23, 59, 59, 999);
              
              return isWithinInterval(sessionDate, { start: startOfWeek, end: endOfWeek });
            });
            break;
          default:
            break;
        }
      }
      
      // Apply search filter
      if (searchTerm) {
        const lowercaseSearch = searchTerm.toLowerCase();
        result = result.filter(session => {
          return (
            (session.type && session.type.toLowerCase().includes(lowercaseSearch)) ||
            (session.notes && session.notes.toLowerCase().includes(lowercaseSearch)) ||
            (session.coachName && session.coachName.toLowerCase().includes(lowercaseSearch))
          );
        });
      }
      
      setFilteredSessions(result);
    };
    
    filterSessions();
  }, [sessions, filterStatus, searchTerm]);

  // Group filtered sessions by date
  useEffect(() => {
    setGroupedSessions(groupSessionsByDate(filteredSessions));
  }, [filteredSessions]);

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
          Past
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
            Soon
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
        Upcoming
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

  // Handle export to CSV
  const handleExportSessions = () => {
    try {
      // Create CSV content
      let csvContent = "Type,Date,Time,Duration,Notes\n";
      
      sessions.forEach(session => {
        const formatDate = session.date ? format(parseISO(session.date), 'yyyy-MM-dd') : 'N/A';
        const type = session.type || 'Coaching Session';
        const time = session.time || 'N/A';
        const duration = session.duration || '60 minutes';
        const notes = session.notes ? `"${session.notes.replace(/"/g, '""')}"` : '';
        
        csvContent += `${type},${formatDate},${time},${duration},${notes}\n`;
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'coaching_sessions.csv');
      document.body.appendChild(link);
      
      // Click the link and remove it
      link.click();
      document.body.removeChild(link);
      
      toast.success('Sessions exported to CSV');
    } catch (error) {
      console.error('Error exporting sessions:', error);
      toast.error('Failed to export sessions');
    }
  };

  // No sessions state
  if (!isLoading && sessions.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-3" />
            <h3 className="text-xl font-medium text-gray-700">No scheduled sessions</h3>
            <p className="text-gray-500 mt-2 mb-6">Your coach hasn't scheduled any sessions with you yet.</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 mb-6">{error}</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <CardTitle>All Sessions</CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportSessions}
            className="whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="whitespace-nowrap"
          >
            Go Back
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search by session type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
              </div>
              
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center w-full justify-between sm:w-auto"
                  onClick={() => {}}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span>
                    {filterStatus === 'all' && 'All Sessions'}
                    {filterStatus === 'upcoming' && 'Upcoming'}
                    {filterStatus === 'past' && 'Past'}
                    {filterStatus === 'today' && 'Today'}
                    {filterStatus === 'thisWeek' && 'This Week'}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-10 hidden group-hover:block">
                  <div className="py-1">
                    {['all', 'upcoming', 'past', 'today', 'thisWeek'].map((status) => (
                      <button
                        key={status}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          filterStatus === status
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setFilterStatus(status)}
                      >
                        <span className="capitalize">
                          {status === 'all' && 'All Sessions'}
                          {status === 'upcoming' && 'Upcoming'}
                          {status === 'past' && 'Past'}
                          {status === 'today' && 'Today'}
                          {status === 'thisWeek' && 'This Week'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sessions list */}
            {groupedSessions.length > 0 ? (
              <div className="space-y-8">
                {groupedSessions.map(group => (
                  <div key={group.date} className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      {formatSessionDate(group.date)}
                    </h3>
                    <div className="space-y-4">
                      {group.sessions.map((session, sessionIndex) => (
                        <motion.div
                          key={session.id || sessionIndex}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: sessionIndex * 0.05 }}
                          className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div>
                              <div className="flex items-center">
                                <h4 className="font-medium text-lg mr-2">{session.type}</h4>
                                {getSessionBadge(session.date, session.time)}
                              </div>
                              {session.coachName && (
                                <div className="flex items-center text-gray-600 text-sm mt-1">
                                  <User className="w-3 h-3 mr-1" />
                                  {session.coachName}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-4 h-4 mr-2 text-blue-600" />
                              <span>{session.time} • {session.duration || '60 minutes'}</span>
                            </div>
                          </div>
                          
                          {session.notes && (
                            <div className="bg-gray-50 p-3 rounded-md mb-3">
                              <p className="text-sm text-gray-700">{session.notes}</p>
                            </div>
                          )}
                          
                          {!isPastSession(session.date, session.time) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => handleAddToCalendar(session)}
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Add to Calendar
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-xl font-medium text-gray-700">No sessions found</h3>
                <p className="text-gray-500 mt-2">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Your coach hasn\'t scheduled any sessions yet'}
                </p>
              </div>
            )}
            
            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-3 rounded-lg border shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-xl font-bold text-gray-900">{sessions.length}</p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1">Upcoming</p>
                <p className="text-xl font-bold text-blue-600">
                  {sessions.filter(s => !isPastSession(s.date, s.time)).length}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1">Past</p>
                <p className="text-xl font-bold text-gray-600">
                  {sessions.filter(s => isPastSession(s.date, s.time)).length}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1">Today</p>
                <p className="text-xl font-bold text-green-600">
                  {sessions.filter(s => {
                    try {
                      const sessionDate = parseISO(s.date);
                      return isToday(sessionDate);
                    } catch (e) {
                      return false;
                    }
                  }).length}
                </p>
              </div>
            </div>
            </>
            )}
            </CardContent>
            </Card>
            );
            }

            export default SessionsView;