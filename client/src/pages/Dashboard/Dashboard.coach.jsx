import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, MessageSquare, TrendingUp,
  Clock, CheckSquare, AlertCircle, Settings, ArrowRight
} from 'lucide-react';
import subscriptionService from '../../services/subscription.service';
import ClientWork from './components/CoachChatComponent';
import { useAuth } from '../../stores/authStore';
import { toast } from 'sonner';
import CoachChatComponent from './components/CoachChatComponent';

const DashboardCoach = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    pendingRequests: 0,
    upcomingSessions: 0,
    messageThreads: 0
  });

  const [clients, setClients] = useState([]);
  const [activeClients, setActiveClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [showClientWork, setShowClientWork] = useState(false);
  const [showActiveClients, setShowActiveClients] = useState(false);
  const [chatClient, setChatClient] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false); // State to track chat visibility

  useEffect(() => {

    const fetchDashboardData = async () => {
      try {
        const data = await subscriptionService.getCoachDashboardData();
        setStats({
          activeClients: data.stats.activeClients,
          pendingRequests: data.stats.pendingRequests,
          upcomingSessions: data.stats.upcomingSessions,
          messageThreads: data.stats.messageThreads,
        });
        setClients(data.recentClients);
        setActiveClients(data.recentClients);
        setUpcomingSessions([
          { id: 1, clientName: 'Client 1', time: '10:00 AM', duration: '30 min' },
          { id: 2, clientName: 'Client 2', time: '11:00 AM', duration: '45 min' },
        ]);
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
      }
    };

    fetchDashboardData();
  
  }, [isChatOpen, showActiveClients, selectedClient]);

  const handleClientClick = (client) => {
    setSelectedClient(client);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setChatClient(null);
  };

  const handleChatClick = (client) => {
    setChatClient(client);
    setIsChatOpen(true); // Open the chat
  
  };

  const handleUpdateClientStats = async (updatedStats) => {
    try {
      await subscriptionService.updateClientStats(selectedClient.id, updatedStats);
      toast.success('Client stats updated successfully');
      setSelectedClient(null);
    } catch (error) {
      toast.error('Failed to update client stats');
    }
  };

  const handleActiveClientsClick = async () => {
    try {
      setShowActiveClients(true);
    } catch (error) {
      toast.error('Failed to fetch active clients');
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </motion.div>
  );

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
              onClick={() => {/* Add settings handler */}}
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
            onClick={handleActiveClientsClick}
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={Clock}
          />
          <StatCard
            title="Upcoming Sessions"
            value={stats.upcomingSessions}
            icon={Calendar}
          />
          <StatCard
            title="Active Messages"
            value={stats.messageThreads}
            icon={MessageSquare}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 from-black to-gray-900 bg-gradient-to-br rounded-2xl p-6 shadow-lg">
          {/* Client List */}
          <Card className="lg:col-span-2 bg-gradient-to-tr from-purple-900 to-yellow-900">
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length > 0 ? (
                <motion.div
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.1 } },
                    hidden: {},
                  }}
                >
                  {clients.map((client) => (
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
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatClick(client);
                          }}
                          className="relative"
                        >
                          <MessageSquare className="h-5 w-5" />
                          {client.unreadMessages > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {client.unreadMessages}
                            </span>
                          )}
                        </Button>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
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
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="p-4 bg-white rounded-lg shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{session.clientName}</p>
                        <span className="text-sm text-gray-500">{session.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{session.duration}</p>
                    </motion.div>
                  ))}
                </div>
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
                className="bg-white rounded-xl p-6 max-w-lg w-full shadow-lg"
              >
                <h2 className="text-2xl font-bold mb-4">
                  {selectedClient.firstName} {selectedClient.lastName || selectedClient.email}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Workouts Completed</label>
                    <input
                      name="workoutsCompleted"
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      defaultValue={selectedClient.stats.workoutsCompleted}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Streak</label>
                    <input
                      name="currentStreak"
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      defaultValue={selectedClient.stats.currentStreak}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Progress</label>
                    <input
                      name="monthlyProgress"
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      defaultValue={selectedClient.stats.monthlyProgress}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Goals Achieved</label>
                    <input
                      name="goalsAchieved"
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      defaultValue={selectedClient.stats.goalsAchieved}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedClient(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const updatedStats = {
                        workoutsCompleted: parseInt(document.querySelector('input[name="workoutsCompleted"]').value),
                        currentStreak: parseInt(document.querySelector('input[name="currentStreak"]').value),
                        monthlyProgress: parseInt(document.querySelector('input[name="monthlyProgress"]').value),
                        goalsAchieved: parseInt(document.querySelector('input[name="goalsAchieved"]').value),
                      };
                      handleUpdateClientStats(updatedStats);
                      window.location.reload();
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowClientWork(true)}
                  >
                    Open Client Work
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Client Work Modal */}
        <AnimatePresence>
          {showClientWork && selectedClient && (
            <ClientWork
              client={selectedClient}
              onClose={() => setShowClientWork(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardCoach;