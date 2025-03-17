import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart2, TrendingUp, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Progress from '@/components/ui/progress';

const ClientStatsWidget = ({ clients }) => {
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    averageProgress: 0,
    topPerformer: null,
    needsAttention: null,
    progressTrend: 0,
  });

  useEffect(() => {
    if (!clients || clients.length === 0) return;

    // Calculate statistics
    const totalWorkouts = clients.reduce(
      (sum, client) => sum + (client.stats?.workoutsCompleted || 0),
      0
    );

    // Calculate average progress
    const validProgressClients = clients.filter(
      (client) => client.stats?.monthlyProgress !== undefined
    );
    
    const averageProgress = validProgressClients.length
      ? validProgressClients.reduce(
          (sum, client) => sum + (client.stats?.monthlyProgress || 0),
          0
        ) / validProgressClients.length
      : 0;

    // Identify top performer (highest progress)
    const topPerformer = clients.reduce((best, current) => {
      if (!best || (current.stats?.monthlyProgress || 0) > (best.stats?.monthlyProgress || 0)) {
        return current;
      }
      return best;
    }, null);

    // Identify clients needing attention (lowest progress)
    const needsAttention = clients.reduce((worst, current) => {
      // Only consider clients with some activity
      if (current.stats?.workoutsCompleted > 0) {
        if (!worst || (current.stats?.monthlyProgress || 0) < (worst.stats?.monthlyProgress || 0)) {
          return current;
        }
      }
      return worst;
    }, null);

    // Calculate a mock progress trend (could use historical data in a real app)
    // For now, just use a random value between -10 and +15
    const progressTrend = Math.floor(Math.random() * 25) - 10;

    setStats({
      totalWorkouts,
      averageProgress: Math.round(averageProgress),
      topPerformer,
      needsAttention,
      progressTrend,
    });
  }, [clients]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-blue-600" />
          Client Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overall Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-blue-800">Overall Progress</h3>
              <div className={`flex items-center ${stats.progressTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.progressTrend >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                <span className="text-xs font-medium">{Math.abs(stats.progressTrend)}%</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.averageProgress}%</p>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Target</span>
                <span>100%</span>
              </div>
              <Progress value={stats.averageProgress} className="h-1.5" />
            </div>
          </motion.div>

          {/* Total Workouts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-amber-800">Total Workouts</h3>
              <div className="bg-amber-100 p-1.5 rounded-full">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalWorkouts}</p>
            <p className="text-xs text-gray-500">
              Across {clients.length} {clients.length === 1 ? 'client' : 'clients'}
            </p>
          </motion.div>

          {/* Top Performer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-green-800">Top Performer</h3>
              <div className="bg-green-100 p-1.5 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            {stats.topPerformer ? (
              <>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {stats.topPerformer.firstName} {stats.topPerformer.lastName || ''}
                </p>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span>Progress:</span>
                  <span className="font-medium text-green-600">
                    {stats.topPerformer.stats?.monthlyProgress || 0}%
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">No data available</p>
            )}
          </motion.div>

          {/* Needs Attention */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
            className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-purple-800">Needs Attention</h3>
              <div className="bg-purple-100 p-1.5 rounded-full">
                <Award className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            {stats.needsAttention ? (
              <>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {stats.needsAttention.firstName} {stats.needsAttention.lastName || ''}
                </p>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span>Progress:</span>
                  <span className="font-medium text-amber-600">
                    {stats.needsAttention.stats?.monthlyProgress || 0}%
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">No clients need attention</p>
            )}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientStatsWidget;