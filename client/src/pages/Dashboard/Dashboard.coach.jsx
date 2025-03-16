import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, MessageSquare, Clock, Settings, ArrowRight } from 'lucide-react';
import subscriptionService from '../../services/subscription.service';
import { useAuth } from '../../stores/authStore';
import { toast } from 'sonner';
import StatCard from './CoachOrganization/StatCard';
import ClientList from './CoachOrganization/ClientList';
import Schedule from './CoachOrganization/Schedule';
import ClientDetailsModal from './CoachOrganization/ClientDetailsModal';
import CoachChatComponent from './components/CoachChatComponent';

const DashboardCoach = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    pendingRequests: 0,
    upcomingSessions: 0,
    messageThreads: 0,
  });
  const [clients, setClients] = useState([]);
  const [activeClients, setActiveClients] = useState([]); // Add activeClients state
  const [selectedClient, setSelectedClient] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatClient, setChatClient] = useState(null);
  const [showActiveClients, setShowActiveClients] = useState(false); // Add showActiveClients state

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await subscriptionService.getCoachDashboardData();
        console.log('API Response:', data); // Debugging log
        setStats({
          activeClients: data.stats?.activeClients || 0,
          pendingRequests: data.stats?.pendingRequests || 0,
          upcomingSessions: data.stats?.upcomingSessions || 0,
          messageThreads: data.stats?.messageThreads || 0,
        });
        setClients(data.recentClients || []);
        setActiveClients(data.recentClients || []); // Set activeClients
        setUpcomingSessions(data.upcomingSessions || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error); // Debugging log
        toast.error('Failed to fetch dashboard data');
        setClients([]);
        setActiveClients([]); // Reset activeClients
        setUpcomingSessions([]);
      }
    };
    fetchDashboardData();
  }, []);

  const handleClientClick = (client) => setSelectedClient(client);
  const handleChatClick = (client) => {
    setChatClient(client);
    setIsChatOpen(true);
  };
  const handleCloseChat = () => setIsChatOpen(false);

  // Handler for showing active clients modal
  const handleActiveClientsClick = () => {
    setShowActiveClients(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Coach Dashboard</h1>
              <p className="text-blue-100">Manage your clients and schedule</p>
            </div>
            <Button
              variant="outline"
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Clients"
            value={stats.activeClients}
            icon={Users}
            onClick={handleActiveClientsClick} // Add onClick handler
          />
          <StatCard title="Pending Requests" value={stats.pendingRequests} icon={Clock} />
          <StatCard title="Upcoming Sessions" value={stats.upcomingSessions} icon={Calendar} />
          <StatCard title="Active Messages" value={stats.messageThreads} icon={MessageSquare} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 from-black to-gray-900 bg-gradient-to-br rounded-2xl p-6 shadow-lg">
          {/* Client List */}
          <Card className="lg:col-span-2 bg-gradient-to-tr from-purple-900 to-yellow-900">
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {clients && clients.length > 0 ? (
                <ClientList clients={clients} onClientClick={handleClientClick} onChatClick={handleChatClick} />
              ) : (
                <p className="text-gray-500">No recent clients found.</p>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSessions && upcomingSessions.length > 0 ? (
                <Schedule sessions={upcomingSessions} />
              ) : (
                <p className="text-gray-500">No sessions scheduled for today.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Clients Modal */}
        <AnimatePresence>
          {showActiveClients && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-4">Active Clients</h2>
                <div className="space-y-4">
                  {activeClients.length > 0 ? (
                    activeClients.map((client) => (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md"
                        onClick={() => handleClientClick(client)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">
                              {client.firstName} {client.lastName || client.email}
                            </p>
                            <p className="text-sm text-gray-500">Last active: {client.lastActive}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-gray-500">No active clients found.</p>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowActiveClients(false)}
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Modal */}
        <AnimatePresence>
          {isChatOpen && chatClient && (
            <CoachChatComponent
              selectedClient={chatClient}
              onClose={handleCloseChat}
              isChatOpen={isChatOpen}
            />
          )}
        </AnimatePresence>

        {/* Client Details Modal */}
        <AnimatePresence>
          {selectedClient && (
            <ClientDetailsModal
              client={selectedClient}
              onClose={() => setSelectedClient(null)}
              onSave={() => {/* Handle save */}}
              onOpenWork={() => {/* Handle open work */}}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardCoach;