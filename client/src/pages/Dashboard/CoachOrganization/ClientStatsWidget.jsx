import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  BarChart2, TrendingUp, Award, ArrowUpRight, ArrowDownRight,
  Users, AlertTriangle, CheckCircle, Target, Clock, Calendar
} from 'lucide-react';
import Progress from '@/components/ui/progress';

const ClientStatsWidget = ({ clients }) => {
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    averageProgress: 0,
    topPerformer: null,
    needsAttention: null,
    progressTrend: 0,
    riskDistribution: { high: 0, medium: 0, low: 0 },
    fitnessLevelDistribution: {},
    upcomingSessions: 0,
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    clientGoals: {}
  });

  useEffect(() => {
    if (!clients || clients.length === 0) return;

    // Calculate basic statistics
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

    // Identify clients needing attention (lowest progress + high risk)
    // Consider adherence risk as a factor
    const needsAttention = clients.reduce((worst, current) => {
      // Skip clients with no activity
      if (!current.stats?.workoutsCompleted) return worst;
      
      // Consider adherence risk as a factor
      const currentRiskScore = 
        (current.stats?.adherenceRisk === 'high' ? 3 : 
         current.stats?.adherenceRisk === 'medium' ? 2 : 1) * 
        (100 - (current.stats?.monthlyProgress || 0));
      
      const worstRiskScore = worst ? 
        (worst.stats?.adherenceRisk === 'high' ? 3 : 
         worst.stats?.adherenceRisk === 'medium' ? 2 : 1) * 
        (100 - (worst.stats?.monthlyProgress || 0)) : 0;
      
      if (!worst || currentRiskScore > worstRiskScore) {
        return current;
      }
      return worst;
    }, null);

    // Calculate risk distribution
    const riskDistribution = clients.reduce((acc, client) => {
      const risk = client.stats?.adherenceRisk || 'medium';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, { high: 0, medium: 0, low: 0 });

    // Calculate fitness level distribution
    const fitnessLevelDistribution = clients.reduce((acc, client) => {
      const level = client.fitnessProfile?.level || 'beginner';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    // Count upcoming sessions
    const upcomingSessions = clients.reduce((count, client) => {
      return count + (client.nextSessionDetails ? 1 : 0);
    }, 0);

    // Count active vs inactive clients
    const activeClients = clients.filter(client => 
      client.status === 'active'
    ).length;
    
    const inactiveClients = clients.filter(client => 
      client.status === 'inactive' || client.status === 'paused'
    ).length;

    // Aggregate client goals
    const clientGoals = clients.reduce((goals, client) => {
      if (client.fitnessProfile?.goals && Array.isArray(client.fitnessProfile.goals)) {
        client.fitnessProfile.goals.forEach(goal => {
          goals[goal] = (goals[goal] || 0) + 1;
        });
      }
      return goals;
    }, {});

    // Calculate progress trend
    // For now, just use mock data. In a real app, you'd compare with historical data
    let progressTrend = Math.floor(Math.random() * 25) - 10;
    
    // Set all stats
    setStats({
      totalWorkouts,
      averageProgress: Math.round(averageProgress),
      topPerformer,
      needsAttention,
      progressTrend,
      riskDistribution,
      fitnessLevelDistribution,
      upcomingSessions,
      totalClients: clients.length,
      activeClients,
      inactiveClients,
      clientGoals
    });
  }, [clients]);

  // Get the top 3 most common client goals
  const getTopGoals = () => {
    return Object.entries(stats.clientGoals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([goal, count]) => goal);
  };

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
            <div className="mt-3">
              <div className="flex items-center text-xs text-blue-600">
                <Target className="w-3 h-3 mr-1" />
                <span>Top goals: {getTopGoals().join(', ')}</span>
              </div>
            </div>
          </motion.div>

          {/* Client Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-purple-800">Client Status</h3>
              <div className="bg-purple-100 p-1.5 rounded-full">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalClients}</p>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
                <span className="font-medium">{stats.activeClients}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-600 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Inactive
                </span>
                <span className="font-medium">{stats.inactiveClients}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-600 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Scheduled
                </span>
                <span className="font-medium">{stats.upcomingSessions}</span>
              </div>
            </div>
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
                <div className="flex flex-col space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className="font-medium text-green-600">
                      {stats.topPerformer.stats?.monthlyProgress || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workouts:</span>
                    <span className="font-medium">
                      {stats.topPerformer.stats?.workoutsCompleted || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Streak:</span>
                    <span className="font-medium">
                      {stats.topPerformer.stats?.currentStreak || 0} days
                    </span>
                  </div>
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
            className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-amber-800">Needs Attention</h3>
              <div className="bg-amber-100 p-1.5 rounded-full">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            {stats.needsAttention ? (
              <>
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {stats.needsAttention.firstName} {stats.needsAttention.lastName || ''}
                </p>
                <div className="flex flex-col space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className="font-medium text-amber-600">
                      {stats.needsAttention.stats?.monthlyProgress || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Level:</span>
                    <span className={`font-medium ${
                      stats.needsAttention.stats?.adherenceRisk === 'high' 
                        ? 'text-red-600' 
                        : stats.needsAttention.stats?.adherenceRisk === 'medium'
                          ? 'text-amber-600'
                          : 'text-green-600'
                    }`}>
                      {stats.needsAttention.stats?.adherenceRisk || 'medium'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Active:</span>
                    <span className="font-medium">
                      {stats.needsAttention.lastActive || 'N/A'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">No clients need attention</p>
            )}
          </motion.div>
        </div>

        {/* Additional Charts and Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Client Risk Distribution</h3>
            <div className="flex space-x-2 h-8">
              {stats.riskDistribution.high > 0 && (
                <div 
                  className="bg-red-500 rounded-l-md h-full relative tooltip-trigger"
                  style={{ 
                    width: `${(stats.riskDistribution.high / stats.totalClients) * 100}%` 
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {stats.riskDistribution.high}
                  </span>
                  <div className="tooltip">
                    High Risk
                  </div>
                </div>
              )}
              {stats.riskDistribution.medium > 0 && (
                <div 
                  className="bg-amber-500 h-full relative"
                  style={{ 
                    width: `${(stats.riskDistribution.medium / stats.totalClients) * 100}%`,
                    borderRadius: stats.riskDistribution.high === 0 ? '0.375rem 0 0 0.375rem' : '0'
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {stats.riskDistribution.medium}
                  </span>
                </div>
              )}
              {stats.riskDistribution.low > 0 && (
                <div 
                  className="bg-green-500 rounded-r-md h-full relative"
                  style={{ 
                    width: `${(stats.riskDistribution.low / stats.totalClients) * 100}%`,
                    borderRadius: (stats.riskDistribution.high === 0 && stats.riskDistribution.medium === 0) 
                      ? '0.375rem 0.375rem 0.375rem 0.375rem' 
                      : '0 0.375rem 0.375rem 0'
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {stats.riskDistribution.low}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span>High Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span>Low Risk</span>
              </div>
            </div>
          </div>

          {/* Fitness Level Distribution */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Fitness Level Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.fitnessLevelDistribution).map(([level, count]) => (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span className="capitalize">{level}</span>
                    <span>{count} clients</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        level === 'beginner' 
                          ? 'bg-blue-400' 
                          : level === 'intermediate' 
                            ? 'bg-green-400' 
                            : 'bg-purple-400'
                      }`}
                      style={{ width: `${(count / stats.totalClients) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
                <span>Beginner</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
                <span>Intermediate</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-400 rounded-full mr-1"></div>
                <span>Advanced</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientStatsWidget;