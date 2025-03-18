import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, ChevronUp, ChevronDown, Plus, 
  Edit, Save, Calendar, ArrowRight, Scale,
  Heart, Dumbbell, Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 140, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-600 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-3xl font-bold">{progress}%</span>
    </div>
  );
};

// Metric card component with visualization
const MetricCard = ({ title, data, unit, change, color = 'blue', isPositiveGood = true, onAddEntry }) => {
  // Determine if the change is "good" based on the metric type
  const isGoodChange = (change > 0 && isPositiveGood) || (change < 0 && !isPositiveGood);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg border shadow-sm"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700">{title}</h3>
        <div className="flex items-center space-x-2">
          {change !== undefined && (
            <div className={`flex items-center ${isGoodChange ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? (
                <ChevronUp className="w-4 h-4 mr-1" />
              ) : (
                <ChevronDown className="w-4 h-4 mr-1" />
              )}
              <span className="text-xs">{Math.abs(change).toFixed(1)}{unit}</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={onAddEntry}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {data && data.length > 1 ? (
        <div className="h-32 relative">
          {/* Simple line chart visualization */}
          <svg width="100%" height="100%" className="overflow-visible">
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={`var(--${color}-500)`} stopOpacity="0.2" />
                <stop offset="100%" stopColor={`var(--${color}-500)`} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {data.length > 1 && (
              <path
                d={`
                  M ${0} ${(1 - ((data[0].value - Math.min(...data.map(d => d.value))) / Math.max(...data.map(d => d.value) - Math.min(...data.map(d => d.value)) || 1))) * 100}
                  ${data.slice(1).map((point, i) => {
                    const x = ((i + 1) / (data.length - 1)) * 100;
                    const min = Math.min(...data.map(d => d.value));
                    const max = Math.max(...data.map(d => d.value));
                    const range = max - min || 1;
                    const y = (1 - ((point.value - min) / range)) * 100;
                    return `L ${x} ${y}`;
                  }).join(' ')}
                  V 100 H 0 Z
                `}
                fill={`url(#gradient-${color})`}
              />
            )}
            
            {data.map((point, i) => {
              const x = (i / (data.length - 1)) * 100 + "%";
              const min = Math.min(...data.map(d => d.value));
              const max = Math.max(...data.map(d => d.value));
              const range = max - min || 1;
              const y = (1 - ((point.value - min) / range)) * 100 + "%";
              
              return (
                <g key={i}>
                  {i > 0 && (
                    <line 
                      x1={(i-1) / (data.length - 1) * 100 + "%"}
                      y1={(1 - ((data[i-1].value - min) / range)) * 100 + "%"}
                      x2={x}
                      y2={y}
                      stroke={`var(--${color}-500)`}
                      strokeWidth="2"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="white"
                    stroke={`var(--${color}-500)`}
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>
          
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
            <span>{formatDate(data[0].date)}</span>
            <span>{formatDate(data[data.length - 1].date)}</span>
          </div>
          
          <div className="absolute top-0 right-0 text-xl font-bold">
            {data[data.length - 1].value}{unit}
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-400">
          {data && data.length === 1 ? (
            <div className="text-center">
              <div className="text-xl font-bold mb-2">{data[0].value}{unit}</div>
              <div className="text-xs text-gray-500">{formatDate(data[0].date)}</div>
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
      )}
      
      {data && data.length > 0 && (
        <div className="mt-3 text-xs text-right">
          <Button 
            variant="link" 
            className="h-8 p-0 text-xs text-blue-600" 
            size="sm"
          >
            View History
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// Metric Entry Dialog Component
const MetricEntryDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  metricType, 
  unit, 
  label,
  lastValue = ''
}) => {
  const [value, setValue] = useState(lastValue);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const handleSave = () => {
    if (!value) return;
    
    onSave({
      metricType,
      value: parseFloat(value),
      date,
      notes
    });
    
    // Reset form
    setValue(lastValue);
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {label || 'Metric'} Entry</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metric-value">Value ({unit})</Label>
              <Input
                id="metric-value"
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter ${label.toLowerCase()} in ${unit}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metric-date">Date</Label>
              <Input
                id="metric-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metric-notes">Notes (Optional)</Label>
              <Textarea
                id="metric-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this measurement"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Stats Update Dialog Component
const StatsUpdateDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  stats 
}) => {
  const [updatedStats, setUpdatedStats] = useState({
    workoutsCompleted: stats?.workoutsCompleted || 0,
    currentStreak: stats?.currentStreak || 0,
    monthlyProgress: stats?.monthlyProgress || 0,
    goalsAchieved: stats?.goalsAchieved || 0,
    weeklyTarget: stats?.weeklyTarget || 3,
    nutritionCompliance: stats?.nutritionCompliance || 0
  });
  
  const handleChange = (field, value) => {
    setUpdatedStats(prev => ({
      ...prev,
      [field]: typeof value === 'number' ? value : parseInt(value, 10) || 0
    }));
  };
  
  const handleSave = () => {
    onSave(updatedStats);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Your Stats</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workouts-completed">Workouts Completed</Label>
              <Input
                id="workouts-completed"
                type="number"
                min="0"
                value={updatedStats.workoutsCompleted}
                onChange={(e) => handleChange('workoutsCompleted', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-streak">Current Streak (days)</Label>
              <Input
                id="current-streak"
                type="number"
                min="0"
                value={updatedStats.currentStreak}
                onChange={(e) => handleChange('currentStreak', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthly-progress">Monthly Progress (%)</Label>
              <Input
                id="monthly-progress"
                type="number"
                min="0"
                max="100"
                value={updatedStats.monthlyProgress}
                onChange={(e) => handleChange('monthlyProgress', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goals-achieved">Goals Achieved</Label>
              <Input
                id="goals-achieved"
                type="number"
                min="0"
                value={updatedStats.goalsAchieved}
                onChange={(e) => handleChange('goalsAchieved', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weekly-target">Weekly Target</Label>
              <Input
                id="weekly-target"
                type="number"
                min="1"
                max="7"
                value={updatedStats.weeklyTarget}
                onChange={(e) => handleChange('weeklyTarget', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nutrition-compliance">Nutrition Compliance (%)</Label>
              <Input
                id="nutrition-compliance"
                type="number"
                min="0"
                max="100"
                value={updatedStats.nutritionCompliance}
                onChange={(e) => handleChange('nutritionCompliance', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Update Stats
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Progress Section Component
const ProgressSection = ({ 
  stats, 
  healthMetrics, 
  onUpdateStats,
  onAddMetricEntry
}) => {
  const [activeMetric, setActiveMetric] = useState(null);
  const [isMetricDialogOpen, setIsMetricDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  
  // Calculate changes for metrics
  const calculateChange = (data) => {
    if (!data || data.length < 2) return undefined;
    const latest = data[data.length - 1].value;
    const earliest = data[0].value;
    return latest - earliest;
  };
  
  const handleAddMetricEntry = (metricType) => {
    const metricData = healthMetrics[metricType];
    const lastValue = metricData && metricData.length > 0 
      ? metricData[metricData.length - 1].value 
      : '';
      
    setActiveMetric({
      type: metricType,
      lastValue: lastValue.toString(),
      label: {
        weight: 'Weight',
        bodyFat: 'Body Fat',
        strength: 'Strength',
        cardio: 'Cardio'
      }[metricType],
      unit: {
        weight: 'lbs',
        bodyFat: '%',
        strength: 'lbs',
        cardio: 'min'
      }[metricType]
    });
    
    setIsMetricDialogOpen(true);
  };
  
  const handleSaveMetricEntry = (entryData) => {
    onAddMetricEntry(entryData);
  };
  
  const handleUpdateStats = (updatedStats) => {
    onUpdateStats(updatedStats);
  };
  
  return (
    <>
      <div className="space-y-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Overall Progress</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStatsDialogOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Stats
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ProgressRing progress={stats?.monthlyProgress || 0} />
              <p className="mt-4 text-gray-600">
                {stats?.monthlyProgress >= 75 
                  ? 'Excellent progress!' 
                  : stats?.monthlyProgress >= 50 
                    ? 'Good progress!' 
                    : stats?.monthlyProgress >= 25 
                      ? 'You\'re making progress!' 
                      : 'Just getting started!'}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-sm">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Workouts</p>
                  <p className="text-xl font-semibold">{stats?.workoutsCompleted || 0}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Streak</p>
                  <p className="text-xl font-semibold">{stats?.currentStreak || 0} days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Health Metrics Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard 
                title="Weight Tracking" 
                data={healthMetrics.weight} 
                unit="lbs" 
                change={calculateChange(healthMetrics.weight)}
                color="blue"
                isPositiveGood={false} // For weight, lower is typically better
                onAddEntry={() => handleAddMetricEntry('weight')}
              />
              
              <MetricCard 
                title="Body Fat" 
                data={healthMetrics.bodyFat} 
                unit="%" 
                change={calculateChange(healthMetrics.bodyFat)}
                color="amber"
                isPositiveGood={false} // For body fat, lower is typically better
                onAddEntry={() => handleAddMetricEntry('bodyFat')}
              />
              
              <MetricCard 
                title="Strength" 
                data={healthMetrics.strength} 
                unit="lbs" 
                change={calculateChange(healthMetrics.strength)}
                color="green"
                isPositiveGood={true} // For strength, higher is better
                onAddEntry={() => handleAddMetricEntry('strength')}
              />
              
              <MetricCard 
                title="Cardio Fitness" 
                data={healthMetrics.cardio} 
                unit="min" 
                change={calculateChange(healthMetrics.cardio)}
                color="red"
                isPositiveGood={false} // For cardio time, lower is better
                onAddEntry={() => handleAddMetricEntry('cardio')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Metric Entry Dialog */}
      {activeMetric && (
        <MetricEntryDialog
          isOpen={isMetricDialogOpen}
          onClose={() => setIsMetricDialogOpen(false)}
          onSave={handleSaveMetricEntry}
          metricType={activeMetric.type}
          unit={activeMetric.unit}
          label={activeMetric.label}
          lastValue={activeMetric.lastValue}
        />
      )}
      
      {/* Stats Update Dialog */}
      <StatsUpdateDialog
        isOpen={isStatsDialogOpen}
        onClose={() => setIsStatsDialogOpen(false)}
        onSave={handleUpdateStats}
        stats={stats}
      />
    </>
  );
};

export default ProgressSection;