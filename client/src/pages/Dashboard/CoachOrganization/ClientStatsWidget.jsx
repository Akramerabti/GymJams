import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  BarChart2, TrendingUp, Award, ArrowUpRight, ArrowDownRight,
  Users, AlertTriangle, CheckCircle, Target, Clock, Calendar,
  Heart, Dumbbell, Zap, Medal, Brain, Coffee
} from 'lucide-react';
import Progress from '@/components/ui/progress';
import { useTheme } from '../../../contexts/ThemeContext';
import clientService from '../../../services/client.service';
import { toast } from 'sonner';

const ClientStatsWidget = ({ clients }) => {
  const { darkMode } = useTheme();
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
    clientGoals: {},
    pendingApprovals: 0,
    completedGoals: 0,
    workoutsByDay: {},
    topWorkoutTypes: [],
    sleepQualityAvg: 0,
    nutritionComplianceAvg: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!clients || clients.length === 0) return;
    
    setIsLoading(true);
    
    // Collect all client analytics
    const analyzeClientData = async () => {
      try {
        // Fetch additional data if needed
        // For now, we'll work with the data we have
        
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
        
        // Count pending goal approvals
        const pendingApprovals = clients.reduce((count, client) => {
          const pendingGoals = (client.goals || []).filter(
            goal => goal.status === 'pending_approval' || goal.clientRequestedCompletion
          );
          return count + pendingGoals.length;
        }, 0);
        
        // Count completed goals
        const completedGoals = clients.reduce((count, client) => {
          const completed = (client.goals || []).filter(
            goal => goal.completed || goal.status === 'completed'
          );
          return count + completed.length;
        }, 0);

        // Aggregate client goals
        const clientGoals = clients.reduce((goals, client) => {
          if (client.fitnessProfile?.goals && Array.isArray(client.fitnessProfile.goals)) {
            client.fitnessProfile.goals.forEach(goal => {
              goals[goal] = (goals[goal] || 0) + 1;
            });
          }
          return goals;
        }, {});
        
        // Analyze workout patterns by day of week
        const workoutsByDay = clients.reduce((days, client) => {
          // Get client's workouts
          const workouts = client.workouts || [];
          
          // Count workouts by day
          workouts.forEach(workout => {
            if (workout.date) {
              try {
                const date = new Date(workout.date);
                const day = date.toLocaleDateString('en-US', { weekday: 'long' });
                days[day] = (days[day] || 0) + 1;
              } catch (e) {
                // Skip invalid dates
              }
            }
          });
          
          return days;
        }, {});
        
        // Analyze top workout types
        const workoutTypes = {};
        clients.forEach(client => {
          (client.workouts || []).forEach(workout => {
            if (workout.type) {
              workoutTypes[workout.type] = (workoutTypes[workout.type] || 0) + 1;
            }
          });
        });
        
        // Sort and get top 3 workout types
        const topWorkoutTypes = Object.entries(workoutTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type, count]) => ({ type, count }));
        
        // Calculate average sleep quality and nutrition compliance
        const sleepQualityTotal = clients.reduce((sum, client) => {
          // Check if recoveryMetrics is available (elite clients)
          if (client.recoveryMetrics?.sleepQuality?.average) {
            return sum + client.recoveryMetrics.sleepQuality.average;
          }
          return sum;
        }, 0);
        
        const sleepQualityCount = clients.filter(
          client => client.recoveryMetrics?.sleepQuality?.average
        ).length;
        
        const sleepQualityAvg = sleepQualityCount > 0 ? 
          sleepQualityTotal / sleepQualityCount : 0;
        
        const nutritionComplianceTotal = clients.reduce((sum, client) => {
          return sum + (client.stats?.nutritionCompliance || 0);
        }, 0);
        
        const nutritionComplianceAvg = clients.length > 0 ? 
          nutritionComplianceTotal / clients.length : 0;

        // Calculate progress trend (comparing to last week or month)
        // For this example, we'll use a mock trend
        const progressTrend = Math.floor(Math.random() * 25) - 10;
        
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
          clientGoals,
          pendingApprovals,
          completedGoals,
          workoutsByDay,
          topWorkoutTypes,
          sleepQualityAvg: Math.round(sleepQualityAvg),
          nutritionComplianceAvg: Math.round(nutritionComplianceAvg)
        });
        
      } catch (error) {
        console.error('Error analyzing client data:', error);
        toast.error('Failed to analyze client data');
      } finally {
        setIsLoading(false);
      }
    };
    
    analyzeClientData();
    
  }, [clients]);

  // Get the top 3 most common client goals
  const getTopGoals = () => {
    return Object.entries(stats.clientGoals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([goal, count]) => goal);
  };
  
  // Get the most popular workout day
  const getTopWorkoutDay = () => {
    if (Object.keys(stats.workoutsByDay).length === 0) return 'N/A';
    
    return Object.entries(stats.workoutsByDay)
      .sort((a, b) => b[1] - a[1])
      .map(([day]) => day)[0];
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-6 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-blue-600" />
          Client Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Key Metric Cards */}
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
            </div>            <p className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>{stats.averageProgress}%</p>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs" style={{ color: '#000000' }}>
                <span>Average</span>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-green-800">Workout Stats</h3>
              <div className="bg-green-100 p-1.5 rounded-full">
                <Dumbbell className="w-4 h-4 text-green-600" />
              </div>
            </div>            <p className="text-3xl font-bold mb-1" style={{ color: '#000000' }}>{stats.totalWorkouts}</p>
            <p className="text-xs mb-2" style={{ color: '#000000' }}>Total workouts completed</p>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span style={{ color: '#000000' }}>Most Active Day</span>
                <span className="font-medium" style={{ color: '#000000' }}>{getTopWorkoutDay()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span style={{ color: '#000000' }}>Most Popular</span>
                <span className="font-medium capitalize" style={{ color: '#000000' }}>
                  {stats.topWorkoutTypes[0]?.type || 'N/A'}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-amber-800">Goal Tracking</h3>
              <div className="bg-amber-100 p-1.5 rounded-full">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
            </div>            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold" style={{ color: '#000000' }}>{stats.completedGoals}</p>
                <p className="text-xs" style={{ color: '#000000' }}>Completed goals</p>
              </div>
              {stats.pendingApprovals > 0 && (
                <div className="bg-amber-100 p-2 rounded-md">
                  <p className="text-xs font-bold text-amber-800">{stats.pendingApprovals}</p>
                  <p className="text-xs text-amber-700">Pending</p>
                </div>
              )}
            </div>
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs">
                <span style={{ color: '#000000' }}>Client Motivation</span>
                <span className="font-medium" style={{ color: '#000000' }}>
                  {stats.averageProgress >= 75 ? 'High' : 
                   stats.averageProgress >= 50 ? 'Good' : 
                   stats.averageProgress >= 25 ? 'Moderate' : 'Low'}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
            className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-purple-800">Recovery & Wellness</h3>
              <div className="bg-purple-100 p-1.5 rounded-full">
                <Heart className="w-4 h-4 text-purple-600" />
              </div>
            </div>            <div className="flex justify-between">
              <div>
                <p className="text-3xl font-bold mb-1" style={{ color: '#000000' }}>{stats.sleepQualityAvg || '-'}</p>
                <p className="text-xs" style={{ color: '#000000' }}>Sleep quality score</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-1" style={{ color: '#000000' }}>{stats.nutritionComplianceAvg}%</p>
                <p className="text-xs" style={{ color: '#000000' }}>Nutrition compliance</p>
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span style={{ color: '#000000' }}>Overall Wellness</span>
                <span className="font-medium" style={{ color: '#000000' }}>
                  {((stats.sleepQualityAvg + stats.nutritionComplianceAvg) / 2) >= 75 ? 'Excellent' : 
                   ((stats.sleepQualityAvg + stats.nutritionComplianceAvg) / 2) >= 60 ? 'Good' : 
                   ((stats.sleepQualityAvg + stats.nutritionComplianceAvg) / 2) >= 40 ? 'Average' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Statistics */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Client Status Distribution</h3>
            <div className="flex space-x-2 h-8 mb-4">
              {stats.activeClients > 0 && (
                <div 
                  className="bg-green-500 rounded-l-md h-full relative tooltip-trigger"
                  style={{ 
                    width: `${(stats.activeClients / stats.totalClients) * 100}%` 
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {stats.activeClients}
                  </span>
                </div>
              )}
              {stats.inactiveClients > 0 && (
                <div 
                  className="bg-amber-500 h-full relative rounded-r-md"
                  style={{ 
                    width: `${(stats.inactiveClients / stats.totalClients) * 100}%`
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {stats.inactiveClients}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <div className="flex justify-between">
                <span className="text-sm">Active Clients:</span>
                <span className="text-sm font-semibold">{stats.activeClients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Inactive Clients:</span>
                <span className="text-sm font-semibold">{stats.inactiveClients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Upcoming Sessions:</span>
                <span className="text-sm font-semibold">{stats.upcomingSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending Approvals:</span>
                <span className="text-sm font-semibold text-amber-600">{stats.pendingApprovals}</span>
              </div>
            </div>
            
            {/* Risk distribution legend */}
            <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Adherence Risk</h4>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs">High ({stats.riskDistribution.high})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-xs">Medium ({stats.riskDistribution.medium})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Low ({stats.riskDistribution.low})</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Client Fitness Insights */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Client Insights</h3>
            
            {/* Top Performer / Needs Attention */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {stats.topPerformer && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center mb-2">
                    <Medal className="w-4 h-4 text-green-600 mr-1" />
                    <h4 className="text-sm font-medium text-green-800">Top Performer</h4>
                  </div>                  <p className="text-sm font-semibold" style={{ color: '#000000' }}>
                    {stats.topPerformer.firstName} {stats.topPerformer.lastName || ''}
                  </p>
                  <p className="text-xs" style={{ color: '#000000' }}>
                    Progress: <span className="font-medium">{stats.topPerformer.stats?.monthlyProgress || 0}%</span>
                  </p>
                </div>
              )}
              
              {stats.needsAttention && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mr-1" />
                    <h4 className="text-sm font-medium text-amber-800">Needs Attention</h4>
                  </div>                  <p className="text-sm font-semibold" style={{ color: '#000000' }}>
                    {stats.needsAttention.firstName} {stats.needsAttention.lastName || ''}
                  </p>
                  <p className="text-xs" style={{ color: '#000000' }}>
                    Progress: <span className="font-medium">{stats.needsAttention.stats?.monthlyProgress || 0}%</span>
                  </p>
                </div>
              )}
            </div>
            
            {/* Client Goals & Insights */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-1">Top Client Goals</h4>
                <div className="flex flex-wrap gap-2">
                  {getTopGoals().map((goal, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full capitalize">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-1">Popular Workout Types</h4>
                <div className="flex flex-wrap gap-2">
                  {stats.topWorkoutTypes.map((workout, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full capitalize">
                      {workout.type} ({workout.count})
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-1">Workout Insights</h4>
                <p className="text-sm">
                  <span className="font-medium">{getTopWorkoutDay()}</span> is the most popular workout day.
                  Average workout completion rate is <span className="font-medium">
                    {stats.totalClients > 0 
                      ? Math.round((stats.totalWorkouts / (stats.totalClients * 4)) * 100) 
                      : 0}%
                  </span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientStatsWidget;