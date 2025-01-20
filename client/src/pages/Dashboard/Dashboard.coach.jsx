import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, MessageSquare, TrendingUp,
  Clock, CheckSquare, AlertCircle, Settings
} from 'lucide-react';
import subscriptionService from '../../services/subscription.service';
import { useAuth } from '../../stores/authStore';
import { toast } from 'sonner';

const DashboardCoach = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    pendingRequests: 0,
    upcomingSessions: 0,
    messageThreads: 0
  });

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

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

        // Mock upcoming sessions (replace with actual data from the backend)
        setUpcomingSessions([
          { id: 1, clientName: 'Client 1', time: '10:00 AM', duration: '30 min' },
          { id: 2, clientName: 'Client 2', time: '11:00 AM', duration: '45 min' },
        ]);
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
      }
    };

    fetchDashboardData();
  }, []);

  const handleClientClick = (client) => {
    setSelectedClient(client);
  };

  const handleUpdateClientStats = async (updatedStats) => {
    try {
      await subscriptionService.updateClientStats(selectedClient.id, updatedStats);
      toast.success('Client stats updated successfully');
      setSelectedClient(null); // Close the modal
    } catch (error) {
      toast.error('Failed to update client stats');
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
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
          className="p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length > 0 ? (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => handleClientClick(client)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center ">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            {client.firstName} {client.lastName || client.email}
                          </p>
                          <p className="text-sm text-gray-500">Last active: {client.lastActive}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-blue-700">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
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
                    <div key={session.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{session.clientName}</p>
                        <span className="text-sm text-gray-500">{session.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{session.duration}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No sessions scheduled for today.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Client Details Modal */}
        {selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full">
              <h2 className="text-2xl font-bold mb-4 ">
                {selectedClient.firstName} {selectedClient.lastName || selectedClient.email}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Workouts Completed</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    defaultValue={selectedClient.stats.workoutsCompleted}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Streak</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    defaultValue={selectedClient.stats.currentStreak}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Progress</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    defaultValue={selectedClient.stats.monthlyProgress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Goals Achieved</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCoach;