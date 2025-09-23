import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, MessageSquare, Clock, Settings, ArrowRight, 
  TrendingUp, User, ChevronDown, Bell, Filter, Dumbbell, 
  BarChart2, CheckCircle, X, PlusCircle, Download, Upload, AlertCircle,
  FileEdit
} from 'lucide-react';
import subscriptionService from '../../services/subscription.service';
import { useAuth } from '../../stores/authStore';
import { toast } from 'sonner';
import StatCard from './CoachOrganization/StatCard';
import ClientList from './CoachOrganization/ClientList';
import Schedule from './CoachOrganization/Schedule';
import ClientDetailsModal from './CoachOrganization/ClientDetailsModal';
import CoachChatComponent from './components/CoachChatComponent';
import ClientStatsWidget from './CoachOrganization/ClientStatsWidget';
import clientService from '../../services/client.service';
import PendingGoalsSection from '../../components/subscription/PendingGoalsSection.jsx';
import PlanUpdateRequests from './CoachOrganization/PlanUpdateRequests'; // Import the new component
import SubscriptionInfoDialog from './CoachOrganization/SupscriptionInfoDialog.jsx';
import { constructFromSymbol } from 'date-fns/constants';

const DashboardCoach = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    pendingRequests: 0,
    upcomingSessions: 0,
    messageThreads: 0,
    planUpdateRequests: 0 // Add new stat for plan update requests
  });
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatClient, setChatClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMadeChanges, setHasMadeChanges] = useState(false);
  const [error, setError] = useState(null);
  const [pendingGoalCount, setPendingGoalCount] = useState(0);
  const [pendingGoalApprovals, setPendingGoalApprovals] = useState([]);

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
  

  const getGoalId = (goal) => {
    if (!goal) return null;
    
    // Try different possible ID fields in order of preference
    if (goal.id) return goal.id;
    if (goal._id) {
      // Handle if _id is an ObjectId (toString if it's an object)
      return typeof goal._id === 'object' ? goal._id.toString() : goal._id;
    }
    
    return null;
  };
  
  // Helper function to check if goal IDs match (handles different formats)
  const doGoalIdsMatch = (goal, goalId) => {
    if (!goal || !goalId) return false;
    
    // Check for "id" field match
    if (goal.id === goalId) return true;
    
    // Check for "_id" field match
    if (goal._id) {
      const goalObjectId = typeof goal._id === 'object' ? goal._id.toString() : goal._id;
      return goalObjectId === goalId;
    }
    
    return false;
  };
  
  const handleCompleteClientGoal = async (clientId, goalId, pointsToAward, isApproval = false) => {
    try {
      setIsLoading(true);
      
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        console.error('Client not found:', { clientId, availableClientsIds: clients.map(c => c.id) });
        toast.error('Client not found');
        return;
      }
      
      // Check if client has goals
      if (!client.goals || !Array.isArray(client.goals)) {
        console.error('Client has no goals array:', client);
        toast.error('Client has no goals');
        return;
      }
      
      // Find the goal - check both id and _id fields
      const goal = client.goals.find(g => doGoalIdsMatch(g, goalId));
      
      if (!goal) {
        console.error('Goal not found:', { 
          goalId, 
          availableGoalIds: client.goals.map(g => ({
            id: g.id,
            _id: g._id,
            title: g.title
          }))
        });
        toast.error('Goal not found');
        return;
      }
      
      // If this is an approval of a client's completion request
      if (isApproval) {
        // Call the approval endpoint which will award points and update status on backend
        const result = await subscriptionService.approveGoalCompletion(clientId, goalId, pointsToAward);
        
        if (result) {
          // Success! Update local state to reflect changes
          setClients(prevClients => 
            prevClients.map(c => 
              c.id === clientId
                ? { 
                    ...c, 
                    goals: c.goals.map(g => 
                      doGoalIdsMatch(g, goalId)
                        ? { 
                            ...g, 
                            status: 'completed',
                            completed: true, 
                            completedDate: new Date().toISOString(),
                            coachApproved: true,
                            coachApprovalDate: new Date().toISOString(),
                            pointsAwarded: pointsToAward,
                            progress: 100 
                          } 
                        : g
                    ),
                    stats: {
                      ...c.stats,
                      goalsAchieved: (c.stats?.goalsAchieved || 0) + 1,
                    }
                  }
                : c
            )
          );
          
          toast.success(`Goal approved! Client was awarded ${pointsToAward} points.`);
        }
      } else {
        // This is a direct completion (coach marks a goal as complete)
        // Update the goal status locally
        const updatedGoals = client.goals.map(g => 
          doGoalIdsMatch(g, goalId)
            ? { 
                ...g, 
                status: 'completed',
                completed: true, 
                completedDate: new Date().toISOString(),
                coachApproved: true,
                coachApprovalDate: new Date().toISOString(),
                pointsAwarded: pointsToAward,
                progress: 100 
              } 
            : g
        );
        
        // Update client stats locally
        const updatedStats = {
          ...client.stats,
          goalsAchieved: (client.stats?.goalsAchieved || 0) + 1,
        };
        
        // Update client in the local state
        setClients(prevClients => 
          prevClients.map(c => 
            c.id === clientId
              ? { 
                  ...c, 
                  goals: updatedGoals,
                  stats: updatedStats
                }
              : c
          )
        );
        
        // Save goal updates to server
        await subscriptionService.updateClientGoal(clientId, {
          ...goal,
          status: 'completed',
          completed: true,
          completedDate: new Date().toISOString(),
          coachApproved: true,
          coachApprovalDate: new Date().toISOString(),
          pointsAwarded: pointsToAward,
          progress: 100
        });
        
        // Save stats updates to server
        await subscriptionService.updateClientStats(clientId, updatedStats);
        
        // Award points to client through the dedicated endpoint
        await clientService.awardClientPoints(clientId, pointsToAward);
        
        toast.success(`Goal marked as complete! Client was awarded ${pointsToAward} points.`);
      }
      
      // Refresh the client data to ensure everything is up to date
      fetchDashboardData();
      
    } catch (error) {
      console.error('Failed to complete goal:', error);
      toast.error('Failed to update goal status');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRejectGoalCompletion = async (clientId, goalId) => {
    try {
      setIsLoading(true);
      
      // Call the reject endpoint
      await subscriptionService.rejectGoalCompletion(clientId, goalId);
      
      // Update local state
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === clientId
            ? { 
                ...c, 
                goals: c.goals?.map(g => 
                  doGoalIdsMatch(g, goalId)
                    ? { 
                        ...g, 
                        status: 'active',
                        clientRequestedCompletion: false,
                        clientCompletionRequestDate: null
                      } 
                    : g
                ) || []
              }
            : c
        )
      );
      
      toast.success('Goal completion request rejected');
    } catch (error) {
      console.error('Failed to reject goal completion:', error);
      toast.error('Failed to reject goal completion');
    } finally {
      setIsLoading(false);
    }
  };

  
  const filteredClients = () => {
    if (!clients || !Array.isArray(clients)) return [];
    
    // First filter based on status and search term
    const filtered = clients.filter(client => {
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
    
    // Then sort by priority:
    // 1. Active status first (active > paused > inactive)
    // 2. Within active status, sort by subscription tier (elite > premium > basic)
    // 3. Within each tier, sort by most recently active
    return filtered.sort((a, b) => {
      // Helper function to get status priority (active > paused > inactive)
      const getStatusPriority = (status) => {
        if (status === 'active') return 0;
        if (status === 'paused') return 1;
        return 2; // inactive or any other status
      };
      
      // Helper function to get subscription tier priority (elite > premium > basic)
      const getTierPriority = (tier) => {
        if (tier === 'elite') return 0;
        if (tier === 'premium') return 1;
        return 2; // basic or any other tier
      };
      
      // First, sort by activity status
      const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (statusDiff !== 0) return statusDiff;
      
      // For clients with the same status, sort by subscription tier
      const tierDiff = getTierPriority(a.subscription) - getTierPriority(b.subscription);
      if (tierDiff !== 0) return tierDiff;
      
      // For clients with the same status and tier, sort by last active time (most recent first)
      // Handle potential missing lastActiveRaw by defaulting to a very old date
      const aDate = a.lastActiveRaw ? new Date(a.lastActiveRaw) : new Date(0);
      const bDate = b.lastActiveRaw ? new Date(b.lastActiveRaw) : new Date(0);
      
      return bDate - aDate; // Descending order (most recent first)
    });
  };


  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
  
      // Fetch all necessary data in parallel
      const [
        clientsData,
        pendingRequestsData,
        sessionsData,
        pendingGoalApprovalsData
      ] = await Promise.all([
        clientService.getCoachClients(),
        clientService.getPendingRequests(),
        clientService.getCoachSessions(),
        subscriptionService.getPendingGoalApprovals()
      ]);
  
      // Process and update state
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setPendingRequests(Array.isArray(pendingRequestsData) ? pendingRequestsData : []);
      setUpcomingSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setPendingGoalApprovals(Array.isArray(pendingGoalApprovalsData) ? pendingGoalApprovalsData : []);

      // Count premium and elite clients for plan update requests
      const premiumAndEliteClients = (Array.isArray(clientsData) ? clientsData : [])
        .filter(client => 
          client.subscription === 'premium' || 
          client.subscription === 'elite' || 
          client.subscriptionType === 'Premium' || 
          client.subscriptionType === 'Elite'
        );
      
      // For demo purposes, assume 30% of premium/elite clients have plan update requests
      const planUpdateRequestCount = Math.ceil(premiumAndEliteClients.length * 0.3);
  
      // Update pending goal count
      const pendingGoalCount = (Array.isArray(pendingGoalApprovalsData) ? pendingGoalApprovalsData : [])
        .reduce((count, client) => {
          const pendingGoals = (client.pendingGoals || []).filter(
            goal => goal.status === 'pending_approval' || goal.clientRequestedCompletion
          );
          return count + pendingGoals.length;
        }, 0);
  
      setPendingGoalCount(pendingGoalCount);
  
      // Update stats
      setStats({
        activeClients: clientsData.length,
        pendingRequests: pendingRequestsData.length,
        upcomingSessions: sessionsData.length,
        messageThreads: clientsData.filter(c => c.unreadMessages && c.unreadMessages > 0).length,
        pendingGoals: pendingGoalCount,
        planUpdateRequests: planUpdateRequestCount // Add this new stat
      });
  
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const refreshInterval = setInterval(() => {
      if (!hasMadeChanges) {
        fetchDashboardData();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [hasMadeChanges]);

  const handleClientClick = async (client) => {
    try {
      setIsLoading(true);
    
      const subscription = await subscriptionService.getSubscriptionBySubscriptionId(client.id);
     
      setSelectedClient({
        ...client,
        subscriptionData: subscription
      });
    } catch (error) {
      console.error('Failed to get subscription details:', error);
      toast.error('Failed to load subscription details');
      setSelectedClient(client);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatClick = (client) => {
    setChatClient(client);
    setIsChatOpen(true);
  };

  const handleClientUpdate = async (clientId, updatedData) => {
    try {
      setHasMadeChanges(true);
      await clientService.updateClientStats(clientId, updatedData);
      
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

  const handleExportClientData = async (client) => {
    try {
      let exportData;
      
      try {
        exportData = await clientService.exportClientData(client.id);
      } catch (error) {
        console.warn('Could not fetch export data from server, using local data:', error);
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
      
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `client-data-${client.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Client data exported successfully');
    } catch (error) {
      console.error('Failed to export client data:', error);
      toast.error('Failed to export client data');
    }
  };

  const handleStatusChange = (status) => {
    setFilterStatus(status);
  };

  const handleAddClient = () => {
    toast.info('This feature will be implemented in a future update');
  };

  return (
    <div className="min-h-screen mt-20 bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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

        {/* Pending Goal Alert */}
        {pendingGoalApprovals.length > 0 && (
        <PendingGoalsSection
          pendingGoalApprovals={pendingGoalApprovals}
          handleCompleteClientGoal={handleCompleteClientGoal}
          handleRejectGoalCompletion={handleRejectGoalCompletion}
          isLoading={isLoading}
        />
      )}

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


        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-4"> {/* Changed to 5 columns */}
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
            title="Plan Requests"
            value={stats.planUpdateRequests} 
            icon={FileEdit}
            onClick={() => handleStatCardClick('plan-requests')}
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
                  {/* Removed the Messages tab */}
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
                      <div className="space-y-4">
                        {/* Active clients section */}
                        {filteredClients().filter(c => c.status === 'active').length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              Active Clients
                            </h3>
                            <ClientList 
                              clients={filteredClients().filter(c => c.status === 'active')} 
                              onClientClick={handleClientClick} 
                              onChatClick={handleChatClick}
                            />
                          </div>
                        )}

                        {/* Paused clients section */}
                        {filteredClients().filter(c => c.status === 'paused').length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-3 mt-6 flex items-center">
                              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                              Paused Clients
                            </h3>
                            <ClientList 
                              clients={filteredClients().filter(c => c.status === 'paused')} 
                              onClientClick={handleClientClick} 
                              onChatClick={handleChatClick}
                            />
                          </div>
                        )}

                        {/* Inactive clients section */}
                        {filteredClients().filter(c => c.status !== 'active' && c.status !== 'paused').length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-3 mt-6 flex items-center">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                              Inactive Clients
                            </h3>
                            <ClientList 
                              clients={filteredClients().filter(c => c.status !== 'active' && c.status !== 'paused')} 
                              onClientClick={handleClientClick} 
                              onChatClick={handleChatClick}
                            />
                          </div>
                        )}
                      </div>
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
                    <Schedule 
                      clients={clients} 
                      onRefreshData={fetchDashboardData}
                    />
                  </TabsContent>
                  
                  {/* New Plan Requests Tab */}
                  <TabsContent value="plan-requests" className="mt-0">
                    <PlanUpdateRequests 
                      clients={clients}
                      onRefreshData={fetchDashboardData}
                    />
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
                    {/* Removed messages tab content as requested */}
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>

        {/* Client Stats Widget */}
        {clients.length > 0 && (
          <ClientStatsWidget clients={clients} />
        )}
      </div>
      

      {/* Client Details Modal */}
      <AnimatePresence>
  {selectedClient && (
    <ClientDetailsModal
      key={selectedClient.id} // Add this key prop
      client={selectedClient}
      onClose={() => setSelectedClient(null)}
      onSave={(updatedData) => handleClientUpdate(selectedClient.id, updatedData)}
      onExportData={() => handleExportClientData(selectedClient)}
      onCompleteGoal={handleCompleteClientGoal}
      onRejectGoal={handleRejectGoalCompletion}
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
    </div>
  );
};

export default DashboardCoach;