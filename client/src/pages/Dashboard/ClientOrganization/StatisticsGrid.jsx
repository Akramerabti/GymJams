import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Activity, BarChart2, Target, ChevronUp } from 'lucide-react';

// Custom StatCard component
const StatCard = ({ title, value, icon: Icon, trend, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl shadow-lg overflow-hidden p-6 cursor-pointer hover:shadow-xl transition-shadow"
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg bg-blue-50">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4 transform rotate-180" />
          )}
          <span className="ml-1">{Math.abs(trend).toFixed(1)}%</span>
        </div>
      )}
    </div>
    <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </motion.div>
);

const StatisticsGrid = ({ stats, historicalStats, onStatClick }) => {
  // Calculate trends based on historical data
  const trends = useMemo(() => {
    if (!historicalStats || !stats) return {};
    
    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };
    
    return {
      workoutsCompleted: calculateTrend(
        stats.workoutsCompleted, 
        historicalStats.workoutsCompleted
      ),
      currentStreak: calculateTrend(
        stats.currentStreak, 
        historicalStats.currentStreak
      ),
      monthlyProgress: calculateTrend(
        stats.monthlyProgress, 
        historicalStats.monthlyProgress
      ),
      goalsAchieved: calculateTrend(
        stats.goalsAchieved, 
        historicalStats.goalsAchieved
      ),
    };
  }, [stats, historicalStats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Workouts Completed"
        value={stats?.workoutsCompleted || 0}
        icon={Dumbbell}
        trend={trends.workoutsCompleted}
        onClick={() => onStatClick('workouts')}
      />
      <StatCard
        title="Current Streak"
        value={`${stats?.currentStreak || 0} days`}
        icon={Activity}
        trend={trends.currentStreak}
        onClick={() => onStatClick('streak')}
      />
      <StatCard
        title="Monthly Progress"
        value={`${stats?.monthlyProgress || 0}%`}
        icon={BarChart2}
        trend={trends.monthlyProgress}
        onClick={() => onStatClick('progress')}
      />
      <StatCard
        title="Goals Achieved"
        value={stats?.goalsAchieved || 0}
        icon={Target}
        trend={trends.goalsAchieved}
        onClick={() => onStatClick('goals')}
      />
    </div>
  );
};

export default StatisticsGrid;