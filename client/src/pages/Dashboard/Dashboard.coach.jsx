import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, MessageSquare, Clock, Settings, ArrowRight, 
  TrendingUp, User, ChevronDown, Bell, Filter, Dumbbell, 
  BarChart2, CheckCircle, X, PlusCircle, Download, Upload, AlertCircle
} from 'lucide-react';
import subscriptionService from '../../services/subscription.service';
import { useAuth } from '../../stores/authStore';
import { toast } from 'sonner';
import StatCard from './CoachOrganization/StatCard';
import ClientList from './CoachOrganization/ClientList';
import Schedule from './CoachOrganization/Schedule';
import ClientDetailsModal from './CoachOrganization/ClientDetailsModal';
import CoachChatComponent from './components/CoachChatComponent';
import ClientWorkoutsModal from './CoachOrganization/ClientWorkoutsModal';
import ClientProgressModal from './CoachOrganization/ClientProgressModal';
import ClientStatsWidget from './CoachOrganization/ClientStatsWidget';
import clientService from '../../services/client.service';

const DashboardCoach = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    pendingRequests: 0,
    upcomingSessions: 0,
    messageThreads: 0,
  });
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatClient, setChatClient] = useState(null);
  const [isWorkoutsModalOpen, setIsWorkoutsModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMadeChanges, setHasMadeChanges] = useState(false);
  const [error, setError] = useState(null);

  // Ref for tab content to scroll to
  const tabContentRef = useRef(null);

  const handleStatCardClick = (tabValue) => {
    setActiveTab(tabValue);
    
    // Wait for tab content to render, then scroll
    setTimeout(() => {
      if (tabContentRef.current) {
        const yOffset = -70; // Adjust based on your header height
        const y = tabContentRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    }, 100);
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get clients from the API
      let clientsData = [];
      let pendingRequestsData = [];
      let sessionsData = [];
      
      try {
        clientsData = await clientService.getCoachClients();
      } catch (clientError) {
        console.error('Error fetching clients:', clientError);
        setError('Could not load client data. Please try again later.');
        clientsData = [];
      }
      
      try {
        pendingRequestsData = await clientService.getPendingRequests();
      } catch (requestsError) {
        console.error('Error fetching pending requests:', requestsError);
        pendingRequestsData = [];
      }
      
      try {
        const sessionResponse = await clientService.getCoachSessions();
        sessionsData = sessionResponse.data || [];
      } catch (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        sessionsData = [];
      }
      
      // Make sure we have arrays even if the API didn't return anything
      clientsData = Array.isArray(clientsData) ? clientsData : [];
      pendingRequestsData = Array.isArray(pendingRequestsData) ? pendingRequestsData : [];
      sessionsData = Array.isArray(sessionsData) ? sessionsData : [];
      
      // Process client data to standardize format and add additional information
      const processedClients = clientsData.map(client => ({
        ...client,
        unreadMessages: client.unreadCount || 0,
        lastActive: client.lastActive || 'N/A',
        progress: client.stats?.monthlyProgress || 0,
        status: client.status || 'active'
      }));
      
      setClients(processedClients);
      setPendingRequests(pendingRequestsData);
      setUpcomingSessions(sessionsData);
      
      // Calculate metrics
      const upcomingSessionsCount = sessionsData.length;
      
      const messageThreadsCount = processedClients.filter(c => 
        c.unreadMessages && c.unreadMessages > 0
      ).length;
      
      // Update stats
      setStats({
        activeClients: processedClients.length,
        pendingRequests: pendingRequestsData.length,
        upcomingSessions: upcomingSessionsCount,
        messageThreads: messageThreadsCount,
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      toast.error('Failed to fetch dashboard data');
      setClients([]);
      setUpcomingSessions([]);
      setPendingRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    
    // Set up a refresh interval (every 5 minutes)
    const refreshInterval = setInterval(() => {
      if (!hasMadeChanges) { // Only auto-refresh if no unsaved changes
        fetchDashboardData();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [hasMadeChanges]);

  // Generate sessions data from client workouts
  const generateSessionsFromWorkouts = (clients) => {
    const sessions = [];
    const now = new Date();
    
    clients.forEach(client => {
      // Check if client has workout data
      if (client.workouts && Array.isArray(client.workouts)) {
        // Only include non-completed workouts with future dates
        client.workouts.forEach(workout => {
          if (workout.completed) return;
          
          try {
            const workoutDate = new Date(`${workout.date}T${workout.time || '09:00'}`);
            
            // Only include future workouts
            if (workoutDate > now) {
              sessions.push({
                id: workout.id,
                clientId: client.id,
                clientName: `${client.firstName} ${client.lastName || ''}`.trim(),
                time: workout.time || '09:00',
                date: workout.date,
                dateObj: workoutDate,
                duration: '60 minutes', // Default duration
                type: workout.title
              });
            }
          } catch (err) {
            // Skip workouts with invalid dates
            console.warn('Invalid workout date format:', workout.date);
          }
        });
      }
    });
    
    // If no actual workout data is available, use mock data
    if (sessions.length === 0 && clients.length > 0) {
      return generateMockSessions(clients);
    }
    
    // Sort sessions by date
    return sessions.sort((a, b) => a.dateObj - b.dateObj);
  };

  // Generate mock sessions data as a fallback
  const generateMockSessions = (clients) => {
    const sessions = [];
    const now = new Date();
    
    clients.forEach(client => {
      // Create 1-2 sessions per client
      const sessionCount = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < sessionCount; i++) {
        const dayOffset = Math.floor(Math.random() * 7) + 1; // Next 7 days
        const hourOffset = Math.floor(Math.random() * 10) + 8; // Between 8am and 6pm
        
        const sessionDate = new Date(now);
        sessionDate.setDate(now.getDate() + dayOffset);
        sessionDate.setHours(hourOffset, 0, 0, 0);
        
        sessions.push({
          id: `session-${client.id}-${i}`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName || ''}`.trim(),
          time: sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: sessionDate.toLocaleDateString(),
          dateObj: sessionDate,
          duration: '60 minutes',
          type: ['Workout Review', 'Progress Check', 'Training Session'][Math.floor(Math.random() * 3)]
        });
      }
    });
    
    // Sort by date
    return sessions.sort((a, b) => a.dateObj - b.dateObj);
  };

  // Handle client search and filtering
  const filteredClients = () => {
    if (!clients || !Array.isArray(clients)) return [];
    
    return clients.filter(client => {
      // Apply status filter
      if (filterStatus !== 'all' && client.status !== filterStatus) {
        return false;
      }
      
      // Apply search filter
      if (searchTerm) {
        const fullName = `${client.firstName} ${client.lastName || ''}`.toLowerCase();
        const email = (client.email || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return fullName.includes(searchLower) || email.includes(searchLower);
      }
      
      return true;
    });
  };

  // Handle client selection
  const handleClientClick = async (client) => {
    try {
      setIsLoading(true);
      // Get detailed client data
      const detailedClient = await clientService.getClientById(client.id);
      setSelectedClient(detailedClient);
    } catch (error) {
      console.error('Failed to get client details:', error);
      toast.error('Failed to load client details');
      // Fall back to using the summary data we already have
      setSelectedClient(client);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chat opening
  const handleChatClick = (client) => {
    setChatClient(client);
    setIsChatOpen(true);
  };

  // Handle client updates
  const handleClientUpdate = async (clientId, updatedData) => {
    try {
      setHasMadeChanges(true);
      
      // Call API to update client data
      await clientService.updateClientStats(clientId, updatedData);
      
      // Update local state
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId
            ? { ...client, stats: { ...client.stats, ...updatedData } }
            : client
        )
      );
      
      toast.success('Client data updated successfully');
      setHasMadeChanges(false);
    } catch (error) {
      console.error('Failed to update client:', error);
      toast.error('Failed to update client data');
    }
  };

  // Handle client workouts
  const handleOpenWorkouts = (client) => {
    setSelectedClient(client);
    setIsWorkoutsModalOpen(true);
  };

  // Handle client progress
  const handleOpenProgress = (client) => {
    setSelectedClient(client);
    setIsProgressModalOpen(true);
  };
  
  // Handle updating client workouts
  const handleUpdateWorkouts = async (clientId, workouts) => {
    try {
      setHasMadeChanges(true);
      
      // Update workouts on the server
      await clientService.updateClientWorkouts(clientId, workouts);
      
      // Update local client state
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId
            ? { ...client, workouts }
            : client
        )
      );
      
      // If the selected client is this client, update that too
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => ({
          ...prev,
          workouts
        }));
      }
      
      // Update upcoming sessions
      setUpcomingSessions(prev => {
        // Remove all sessions for this client
        const filteredSessions = prev.filter(session => session.clientId !== clientId);
        
        // Generate new sessions for this client
        const updatedClient = clients.find(client => client.id === clientId);
        if (updatedClient) {
          updatedClient.workouts = workouts;
          const newSessions = generateSessionsFromWorkouts([updatedClient]);
          
          // Return combined sessions
          return [...filteredSessions, ...newSessions].sort((a, b) => a.dateObj - b.dateObj);
        }
        
        return filteredSessions;
      });
      
      toast.success('Client workouts updated successfully');
      setHasMadeChanges(false);
    } catch (error) {
      console.error('Failed to update workouts:', error);
      toast.error('Failed to update client workouts');
    }
  };

  // Handle updating client progress
  const handleUpdateProgress = async (clientId, progress) => {
    try {
      setHasMadeChanges(true);
      
      // Update progress on the server
      await clientService.updateClientProgress(clientId, progress);
      
      // Update local client state
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId
            ? { ...client, progress }
            : client
        )
      );
      
      // If the selected client is this client, update that too
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => ({
          ...prev,
          progress
        }));
      }
      
      toast.success('Client progress updated successfully');
      setHasMadeChanges(false);
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update client progress');
    }
  };
  
  // Export client data
  const handleExportClientData = async (client) => {
    try {
      let exportData;
      
      // Try to get full client data from the server
      try {
        exportData = await clientService.exportClientData(client.id);
      } catch (error) {
        console.warn('Could not fetch export data from server, using local data:', error);
        
        // Fall back to local client data
        exportData = {
          personalInfo: {
            id: client.id,
            name: `${client.firstName} ${client.lastName || ''}`.trim(),
            email: client.email,
            joinDate: client.joinDate || new Date().toISOString()
          },
          stats: client.stats || {},
          progress: client.progress || {
            weightProgress: [],
            strengthProgress: [],
            cardioProgress: [],
            bodyFatProgress: [],
            customMetrics: []
          },
          workouts: client.workouts || []
        };
      }
      
      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `client-data-${client.id}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Client data exported successfully');
    } catch (error) {
      console.error('Failed to export client data:', error);
      toast.error('Failed to export client data');
    }
  };

  // Group upcoming sessions by date
  const groupedSessions = () => {
    if (!upcomingSessions || !Array.isArray(upcomingSessions) || upcomingSessions.length === 0) {
      return [];
    }
    
    const grouped = {};
    
    upcomingSessions.forEach(session => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });
    
    return Object.entries(grouped).map(([date, sessions]) => ({
      date,
      sessions
    }));
  };

  // Handle status change
  const handleStatusChange = (status) => {
    setFilterStatus(status);
  };

  // Handle new client addition
  const handleAddClient = () => {
    toast.info('This feature will be implemented in a future update');
  };

  // Handle accepting a coaching request
  const handleAcceptRequest = async (requestId) => {
    try {
      setIsLoading(true);
      await clientService.acceptCoachingRequest(requestId);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Refresh client list
      const updatedClients = await clientService.getCoachClients();
      setClients(updatedClients);
      
      toast.success('Coaching request accepted successfully');
    } catch (error) {
      console.error('Failed to accept coaching request:', error);
      toast.error('Failed to accept coaching request');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle declining a coaching request
  const handleDeclineRequest = async (requestId) => {
    try {
      setIsLoading(true);
      await clientService.declineCoachingRequest(requestId);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast.success('Coaching request declined');
    } catch (error) {
      console.error('Failed to decline coaching request:', error);
      toast.error('Failed to decline coaching request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                Coach Dashboard
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Welcome back, {user?.firstName || user?.user?.firstName || 'Coach'}!
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3"
                onClick={() => window.location.href = '/profile'}
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Profile Settings</span>
                <span className="xs:hidden">Profile</span>
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3"
                onClick={handleAddClient}
              >
                <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">New Client</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Error display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-md p-4"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Stats Grid - Compact version for mobile */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
          <StatCard
            title="Active Clients"
            value={stats.activeClients}
            icon={Users}
            onClick={() => handleStatCardClick('clients')}
          />
          <StatCard 
            title="Messages" 
            value={stats.messageThreads} 
            icon={MessageSquare}
            onClick={() => handleStatCardClick('messages')}
          />
          <StatCard 
            title="Sessions" 
            value={stats.upcomingSessions} 
            icon={Calendar}
            onClick={() => handleStatCardClick('schedule')}
          />
          <StatCard 
            title="Pending"
            value={stats.pendingRequests} 
            icon={Clock}
            onClick={() => handleStatCardClick('requests')}
          />
          
        </div>

        {/* Main Tabs Section */}
        <Card className="shadow-lg" ref={tabContentRef}>
          <Tabs defaultValue="clients" value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="clients" className="data-[state=active]:bg-white">
                    <Users className="w-4 h-4 mr-2" />
                    Clients
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="data-[state=active]:bg-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="data-[state=active]:bg-white">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="requests" className="data-[state=active]:bg-white">
                    <Clock className="w-4 h-4 mr-2" />
                    Requests
                  </TabsTrigger>
                  
                </TabsList>
                
                {/* Search and Filter */}
                {activeTab === 'clients' && (
                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="relative group">
                      <Button
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Filter className="w-4 h-4" />
                        <span className="hidden md:inline">Status:</span>
                        <span className="font-medium capitalize">{filterStatus}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-10 hidden group-hover:block">
                        <div className="py-1">
                          {['all', 'active', 'inactive', 'pending'].map((status) => (
                            <button
                              key={status}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                filterStatus === status
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => handleStatusChange(status)}
                            >
                              <span className="capitalize">{status}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <TabsContent value="clients" className="mt-0">
                    {filteredClients().length > 0 ? (
                      <ClientList 
                        clients={filteredClients()} 
                        onClientClick={handleClientClick} 
                        onChatClick={handleChatClick}
                      />
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No clients found</h3>
                        <p className="text-gray-500 mb-6">
                          {searchTerm || filterStatus !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'You have no active clients yet'}
                        </p>
                        <Button onClick={handleAddClient}>
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add New Client
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="schedule" className="mt-0">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <Schedule 
                        clients={clients} 
                        onRefreshData={fetchDashboardData} // Pass the function here
                      />
                    )}
                  </TabsContent>
                                
                  <TabsContent value="requests" className="mt-0">
                    {pendingRequests.length > 0 ? (
                      <div className="space-y-4">
                        {pendingRequests.map((request) => (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {request.name || 'New Client'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Requested: {request.date 
                                    ? new Date(request.date).toLocaleDateString() 
                                    : 'Recently'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                onClick={() => handleDeclineRequest(request.id)}
                                disabled={isLoading}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAcceptRequest(request.id)}
                                disabled={isLoading}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No pending requests</h3>
                        <p className="text-gray-500 mb-6">
                          You don't have any pending client requests at the moment
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="messages" className="mt-0">
                    <div className="space-y-4">
                      {clients.length > 0 ? (
                        clients.map((client) => (
                          <motion.div
                            key={client.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {client.firstName} {client.lastName || ''}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Last message: {client.lastMessageTime 
                                    ? new Date(client.lastMessageTime).toLocaleString() 
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleChatClick(client)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                              {client.unreadMessages > 0 && (
                                <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {client.unreadMessages}
                                </span>
                              )}
                            </Button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No message threads</h3>
                          <p className="text-gray-500">
                            You don't have any active message threads
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>

        {/* Client Stats Widget - Only show if there are clients */}
        {clients.length > 0 && (
          <ClientStatsWidget clients={clients} />
        )}
      </div>

      {/* Client Details Modal */}
      <AnimatePresence>
        {selectedClient && (
          <ClientDetailsModal
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onSave={(updatedData) => handleClientUpdate(selectedClient.id, updatedData)}
            onOpenWorkouts={() => handleOpenWorkouts(selectedClient)}
            onOpenProgress={() => handleOpenProgress(selectedClient)}
            onExportData={() => handleExportClientData(selectedClient)}
          />
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatOpen && chatClient && (
          <CoachChatComponent
            selectedClient={chatClient}
            onClose={() => setIsChatOpen(false)}
            isChatOpen={isChatOpen}
          />
        )}
      </AnimatePresence>

      {/* Client Workouts Modal */}
      <AnimatePresence>
        {isWorkoutsModalOpen && selectedClient && (
          <ClientWorkoutsModal
            client={selectedClient}
            onClose={() => setIsWorkoutsModalOpen(false)}
            onSave={(updatedWorkouts) => handleUpdateWorkouts(selectedClient.id, updatedWorkouts)}
          />
        )}
      </AnimatePresence>

      {/* Client Progress Modal */}
      <AnimatePresence>
        {isProgressModalOpen && selectedClient && (
          <ClientProgressModal
            client={selectedClient}
            onClose={() => setIsProgressModalOpen(false)}
            onSave={(updatedProgress) => handleUpdateProgress(selectedClient.id, updatedProgress)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardCoach;