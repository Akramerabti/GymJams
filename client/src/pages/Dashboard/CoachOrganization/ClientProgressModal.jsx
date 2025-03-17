import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, Save, BarChart2, Calendar, 
  TrendingUp, TrendingDown, Settings, 
  Plus, Trash2, Award, Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper functions (moved to the top level)
const calculateChange = (data) => {
    if (!data || data.length < 2) return { value: 0, percentage: 0, isPositive: true };
    
    const latest = data[data.length - 1].value;
    const earliest = data[0].value;
    const change = latest - earliest;
    const percentageChange = (change / Math.abs(earliest)) * 100;
    
    return {
      value: Math.abs(change),
      percentage: Math.abs(percentageChange),
      isPositive: change > 0
    };
  };
  
  // Line chart component
const SimpleLineChart = ({ data, title, color = "#2563eb" }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const range = maxValue - minValue;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800">{title}</h4>
          <span className="text-sm text-gray-500">
            Latest: {data.length > 0 ? data[data.length - 1].value : 'N/A'}
          </span>
        </div>
        <div className="h-20 relative">
          <svg width="100%" height="100%" className="overflow-visible">
            {/* X and Y Axes */}
            <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#e5e7eb" strokeWidth="1" />
            
            {/* Data points and lines */}
            {data.length > 1 && data.map((point, index) => {
              if (index === 0) return null;
              
              const prevPoint = data[index - 1];
              const x1 = `${((index - 1) / (data.length - 1)) * 100}%`;
              const y1 = `${100 - ((prevPoint.value - minValue) / (range || 1)) * 100}%`;
              const x2 = `${(index / (data.length - 1)) * 100}%`;
              const y2 = `${100 - ((point.value - minValue) / (range || 1)) * 100}%`;
              
              return (
                <g key={index}>
                  <line
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth="2"
                  />
                  <circle
                    cx={x2} cy={y2}
                    r="3"
                    fill="#fff"
                    stroke={color}
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };
  
  const getMetricTitle = (metricId, progressData) => {
    if (metricId === 'weight') return 'Weight (lbs)';
    if (metricId === 'strength') return 'Strength (Bench Press - lbs)';
    if (metricId === 'cardio') return 'Cardio (5K Run - min)';
    if (metricId === 'bodyFat') return 'Body Fat (%)';
    
    const customMetric = progressData.customMetrics.find(metric => metric.id === metricId);
    return customMetric ? `${customMetric.name} (${customMetric.unit})` : 'Unknown Metric';
  };
  
  const getMetricData = (metricId, progressData) => {
    if (metricId === 'weight') return progressData.weightProgress;
    if (metricId === 'strength') return progressData.strengthProgress;
    if (metricId === 'cardio') return progressData.cardioProgress;
    if (metricId === 'bodyFat') return progressData.bodyFatProgress;
    
    const customMetric = progressData.customMetrics.find(metric => metric.id === metricId);
    return customMetric ? customMetric.data : [];
  };
  
  const getMetricUnit = (metricId, progressData) => {
    if (metricId === 'weight') return 'lbs';
    if (metricId === 'strength') return 'lbs';
    if (metricId === 'cardio') return 'min';
    if (metricId === 'bodyFat') return '%';
    
    const customMetric = progressData.customMetrics.find(metric => metric.id === metricId);
    return customMetric ? customMetric.unit : '';
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const calculateOverallProgress = (progressData) => {
    // Calculate overall progress using imported calculateChange
    const weightProgress = calculateChange(progressData.weightProgress).percentage;
    const strengthProgress = calculateChange(progressData.strengthProgress).percentage;
    const cardioProgress = calculateChange(progressData.cardioProgress).percentage;
    const bodyFatProgress = calculateChange(progressData.bodyFatProgress).percentage;
  
    const total = (weightProgress + strengthProgress + cardioProgress + bodyFatProgress) / 4;
    return Math.min(100, Math.max(0, Math.round(total)));
  };
  
  const calculateConsistency = (progressData) => {
    // Calculate consistency
    const totalEntries = [
      ...progressData.weightProgress,
      ...progressData.strengthProgress,
      ...progressData.cardioProgress,
      ...progressData.bodyFatProgress,
      ...progressData.customMetrics.flatMap(metric => metric.data)
    ].length;
  
    const weeksTracked = 12; // Assuming 12 weeks of tracking
    const consistency = (totalEntries / (weeksTracked * 4)) * 100; // 4 metrics tracked weekly
    return Math.min(100, Math.max(0, Math.round(consistency)));
  };
  
  const getProgressQuality = (progressData) => {
    // Determine progress quality
    const overallProgress = calculateOverallProgress(progressData);
    if (overallProgress >= 75) return 'excellent';
    if (overallProgress >= 50) return 'good';
    if (overallProgress >= 25) return 'moderate';
    return 'slow';
  };
  
  const getProgressNotes = (progressData) => {
    // Generate progress notes
    const weightChange = calculateChange(progressData.weightProgress);
    const strengthChange = calculateChange(progressData.strengthProgress);
    const cardioChange = calculateChange(progressData.cardioProgress);
    const bodyFatChange = calculateChange(progressData.bodyFatProgress);
  
    let notes = [];
    
    if (weightChange.value > 0) {
      if (!weightChange.isPositive) { // For weight, lower is typically better
        notes.push(`weight decreased by ${weightChange.value.toFixed(1)} lbs`);
      } else {
        notes.push(`weight increased by ${weightChange.value.toFixed(1)} lbs`);
      }
    }
    
    if (strengthChange.value > 0) {
      if (strengthChange.isPositive) { // For strength, higher is better
        notes.push(`strength improved by ${strengthChange.value.toFixed(1)} lbs`);
      } else {
        notes.push(`strength decreased by ${strengthChange.value.toFixed(1)} lbs`);
      }
    }
    
    if (cardioChange.value > 0) {
      if (!cardioChange.isPositive) { // For cardio time, lower is better
        notes.push(`cardio time improved by ${cardioChange.value.toFixed(1)} minutes`);
      } else {
        notes.push(`cardio time increased by ${cardioChange.value.toFixed(1)} minutes`);
      }
    }
    
    if (bodyFatChange.value > 0) {
      if (!bodyFatChange.isPositive) { // For body fat, lower is better
        notes.push(`body fat decreased by ${bodyFatChange.value.toFixed(1)}%`);
      } else {
        notes.push(`body fat increased by ${bodyFatChange.value.toFixed(1)}%`);
      }
    }
  
    return notes.length > 0 ? ` Specifically, ${notes.join(', ')}.` : '';
  };
  
  // Component definition remains the same - moved to below utility functions
  const ClientProgressModal = ({ client, onClose, onSave }) => {
    const [progressData, setProgressData] = useState({
      weightProgress: [],
      strengthProgress: [],
      cardioProgress: [],
      bodyFatProgress: [],
      customMetrics: []
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [newEntry, setNewEntry] = useState({
      metric: '',
      value: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    const [newCustomMetric, setNewCustomMetric] = useState({
      name: '',
      unit: '',
      target: '',
      current: '',
      trackingFrequency: 'weekly'
    });
    const [isAddingEntry, setIsAddingEntry] = useState(false);
    const [isAddingMetric, setIsAddingMetric] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState('weight');
  
    // Determine if a positive change is good based on metric type
    const isPositiveGood = (metricType) => {
      // For cardio (measured in time), lower is better
      if (metricType === 'cardio') return false;
      // For body fat, lower is better
      if (metricType === 'bodyFat') return false;
      // For weight, it depends on the goal (assuming weight loss is the goal)
      if (metricType === 'weight') return false;
      // For strength and custom metrics, higher is typically better
      return true;
    };
  
    const renderChange = (data, metricType) => {
      const change = calculateChange(data);
      const positiveIsGood = isPositiveGood(metricType);
      
      // Determine if the change is "good" based on the metric type
      const isGoodChange = (change.isPositive && positiveIsGood) || (!change.isPositive && !positiveIsGood);
      
      return (
        <div className={`flex items-center ${isGoodChange ? 'text-green-600' : 'text-red-600'}`}>
          {change.isPositive ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          <span className="font-medium">{change.value.toFixed(1)}</span>
          <span className="text-xs ml-1">({change.percentage.toFixed(1)}%)</span>
        </div>
      );
    };
  
    // Rest of the component stays the same...
    // Initialize progress data from client prop
    useEffect(() => {
      if (client) {
        // If client has progress data, use it
        // Otherwise, generate some mock data for demo purposes
        if (client.progress) {
          setProgressData(client.progress);
        } else {
          const mockData = generateMockProgressData();
          setProgressData(mockData);
        }
      }
    }, [client]);
  
    // Generate mock progress data for demonstration
    const generateMockProgressData = () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 90); // 90 days ago
      
      const weightData = [];
      const strengthData = [];
      const cardioData = [];
      const bodyFatData = [];
      
      // Generate weight data (slight downward trend)
      let weight = 185; // Starting weight
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (i * 7)); // Weekly data points
        
        // Add some random variation with a slight downward trend
        weight -= (Math.random() * 0.7); // Lose up to 0.7 lbs per week
        weightData.push({
          date: date.toISOString().split('T')[0],
          value: parseFloat(weight.toFixed(1)),
          notes: ''
        });
      }
      
      // Generate strength data (upward trend)
      let strength = 135; // Starting bench press weight
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (i * 7)); // Weekly data points
        
        // Add some random variation with an upward trend
        strength += (Math.random() * 2.5); // Gain up to 2.5 lbs per week
        strengthData.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(strength / 5) * 5, // Round to nearest 5 lbs
          notes: ''
        });
      }
      
      // Generate cardio data (improved times - lower is better)
      let cardio = 30; // Starting cardio time (5k run in minutes)
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (i * 7)); // Weekly data points
        
        // Add some random variation with a downward trend (improvement)
        cardio -= (Math.random() * 0.4); // Improve by up to 0.4 minutes per week
        if (cardio < 22) cardio = 22; // Don't go below 22 minutes
        
        cardioData.push({
          date: date.toISOString().split('T')[0],
          value: parseFloat(cardio.toFixed(1)),
          notes: ''
        });
      }
      
      // Generate body fat data (slight downward trend)
      let bodyFat = 22; // Starting body fat percentage
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (i * 7)); // Weekly data points
        
        // Add some random variation with a slight downward trend
        bodyFat -= (Math.random() * 0.3); // Lose up to 0.3% per week
        bodyFatData.push({
          date: date.toISOString().split('T')[0],
          value: parseFloat(bodyFat.toFixed(1)),
          notes: ''
        });
      }
      
      // Custom metrics example
      const customMetrics = [
        {
          id: 'custom-1',
          name: 'Pull-ups (max reps)',
          unit: 'reps',
          target: 15,
          current: 8,
          trackingFrequency: 'weekly',
          data: [
            { date: weightData[0].date, value: 3, notes: 'Starting point' },
            { date: weightData[4].date, value: 5, notes: '' },
            { date: weightData[8].date, value: 7, notes: 'Form improved' },
            { date: weightData[11].date, value: 8, notes: '' }
          ]
        }
      ];
      
      return {
        weightProgress: weightData,
        strengthProgress: strengthData,
        cardioProgress: cardioData,
        bodyFatProgress: bodyFatData,
        customMetrics
      };
    };
  
    const handleAddEntry = () => {
      if (!newEntry.value || !newEntry.date) {
        return;
      }
      
      const entry = {
        date: newEntry.date,
        value: parseFloat(newEntry.value),
        notes: newEntry.notes || ''
      };
      
      // Determine which progress array to update based on selected metric
      let updatedProgressData;
      
      if (selectedMetric === 'weight') {
        updatedProgressData = {
          ...progressData,
          weightProgress: [...progressData.weightProgress, entry].sort((a, b) => new Date(a.date) - new Date(b.date))
        };
      } else if (selectedMetric === 'strength') {
        updatedProgressData = {
          ...progressData,
          strengthProgress: [...progressData.strengthProgress, entry].sort((a, b) => new Date(a.date) - new Date(b.date))
        };
      } else if (selectedMetric === 'cardio') {
        updatedProgressData = {
          ...progressData,
          cardioProgress: [...progressData.cardioProgress, entry].sort((a, b) => new Date(a.date) - new Date(b.date))
        };
      } else if (selectedMetric === 'bodyFat') {
        updatedProgressData = {
          ...progressData,
          bodyFatProgress: [...progressData.bodyFatProgress, entry].sort((a, b) => new Date(a.date) - new Date(b.date))
        };
      } else {
        // Handle custom metrics
        const customMetricIndex = progressData.customMetrics.findIndex(metric => metric.id === selectedMetric);
        
        if (customMetricIndex !== -1) {
          const updatedCustomMetrics = [...progressData.customMetrics];
          updatedCustomMetrics[customMetricIndex] = {
            ...updatedCustomMetrics[customMetricIndex],
            data: [...updatedCustomMetrics[customMetricIndex].data, entry].sort((a, b) => new Date(a.date) - new Date(b.date)),
            current: parseFloat(newEntry.value) // Update current value
          };
          
          updatedProgressData = {
            ...progressData,
            customMetrics: updatedCustomMetrics
          };
        } else {
          updatedProgressData = progressData;
        }
      }
      
      setProgressData(updatedProgressData);
      setIsAddingEntry(false);
      
      // Reset form
      setNewEntry({
        metric: '',
        value: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    };
  
    const handleAddCustomMetric = () => {
      if (!newCustomMetric.name || !newCustomMetric.unit) {
        return;
      }
      
      const metric = {
        id: `custom-${Date.now()}`,
        name: newCustomMetric.name,
        unit: newCustomMetric.unit,
        target: parseFloat(newCustomMetric.target) || 0,
        current: parseFloat(newCustomMetric.current) || 0,
        trackingFrequency: newCustomMetric.trackingFrequency,
        data: []
      };
      
      // Add initial data point if current value is provided
      if (newCustomMetric.current) {
        metric.data.push({
          date: new Date().toISOString().split('T')[0],
          value: parseFloat(newCustomMetric.current),
          notes: 'Initial value'
        });
      }
      
      setProgressData({
        ...progressData,
        customMetrics: [...progressData.customMetrics, metric]
      });
      
      setIsAddingMetric(false);
      
      // Reset form
      setNewCustomMetric({
        name: '',
        unit: '',
        target: '',
        current: '',
        trackingFrequency: 'weekly'
      });
    };
  
    const handleDeleteEntry = (metricType, entryDate) => {
      let updatedProgressData;
      
      if (metricType === 'weight') {
        updatedProgressData = {
          ...progressData,
          weightProgress: progressData.weightProgress.filter(entry => entry.date !== entryDate)
        };
      } else if (metricType === 'strength') {
        updatedProgressData = {
          ...progressData,
          strengthProgress: progressData.strengthProgress.filter(entry => entry.date !== entryDate)
        };
      } else if (metricType === 'cardio') {
        updatedProgressData = {
          ...progressData,
          cardioProgress: progressData.cardioProgress.filter(entry => entry.date !== entryDate)
        };
      } else if (metricType === 'bodyFat') {
        updatedProgressData = {
          ...progressData,
          bodyFatProgress: progressData.bodyFatProgress.filter(entry => entry.date !== entryDate)
        };
      } else {
        // Handle custom metrics
        const customMetricIndex = progressData.customMetrics.findIndex(metric => metric.id === metricType);
        
        if (customMetricIndex !== -1) {
          const updatedCustomMetrics = [...progressData.customMetrics];
          updatedCustomMetrics[customMetricIndex] = {
            ...updatedCustomMetrics[customMetricIndex],
            data: updatedCustomMetrics[customMetricIndex].data.filter(entry => entry.date !== entryDate)
          };
          
          updatedProgressData = {
            ...progressData,
            customMetrics: updatedCustomMetrics
          };
        } else {
          updatedProgressData = progressData;
        }
      }
      
      setProgressData(updatedProgressData);
    };
  
    const handleDeleteCustomMetric = (metricId) => {
      setProgressData({
        ...progressData,
        customMetrics: progressData.customMetrics.filter(metric => metric.id !== metricId)
      });
    };
  
    const handleSave = () => {
      onSave(progressData);
      onClose();
    };
  
    // The rest of your component rendering code...
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <BarChart2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">
                {client.firstName}'s Progress
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
  
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab Navigation */}
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b mb-6">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-white">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-white">
                    <Activity className="w-4 h-4 mr-2" />
                    Detailed Progress
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="data-[state=active]:bg-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Custom Metrics
                  </TabsTrigger>
                </TabsList>
              </div>
  
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight Progress */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">Weight Progress</h3>
                      {progressData.weightProgress.length > 0 && renderChange(progressData.weightProgress, 'weight')}
                    </div>
                    
                    {progressData.weightProgress.length > 0 ? (
                      <SimpleLineChart 
                        data={progressData.weightProgress} 
                        title="Weight (lbs)" 
                        color="#3b82f6"
                      />
                    ) : (
                      <p className="text-gray-500 text-center py-8">No weight data available</p>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMetric('weight');
                          setIsAddingEntry(true);
                        }}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                  
                  {/* Strength Progress */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">Strength Progress</h3>
                      {progressData.strengthProgress.length > 0 && renderChange(progressData.strengthProgress, 'strength')}
                    </div>
                    
                    {progressData.strengthProgress.length > 0 ? (
                      <SimpleLineChart 
                        data={progressData.strengthProgress} 
                        title="Bench Press (lbs)" 
                        color="#10b981"
                      />
                    ) : (
                      <p className="text-gray-500 text-center py-8">No strength data available</p>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMetric('strength');
                          setIsAddingEntry(true);
                        }}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                  
                  {/* Cardio Progress */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">Cardio Progress</h3>
                      {progressData.cardioProgress.length > 0 && renderChange(progressData.cardioProgress, 'cardio')}
                    </div>
                    
                    {progressData.cardioProgress.length > 0 ? (
                      <SimpleLineChart 
                        data={progressData.cardioProgress} 
                        title="5K Run Time (min)" 
                        color="#ef4444"
                      />
                    ) : (
                      <p className="text-gray-500 text-center py-8">No cardio data available</p>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMetric('cardio');
                          setIsAddingEntry(true);
                        }}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                  
                  {/* Body Fat Progress */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">Body Fat Progress</h3>
                      {progressData.bodyFatProgress.length > 0 && renderChange(progressData.bodyFatProgress, 'bodyFat')}
                    </div>
                    
                    {progressData.bodyFatProgress.length > 0 ? (
                      <SimpleLineChart 
                        data={progressData.bodyFatProgress} 
                        title="Body Fat (%)" 
                        color="#f59e0b"
                      />
                    ) : (
                      <p className="text-gray-500 text-center py-8">No body fat data available</p>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMetric('bodyFat');
                          setIsAddingEntry(true);
                        }}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Entry
                      </Button>
                    </div>
                  </div>
                </div>
  
                {/* Summary section */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <div className="flex items-start space-x-4">
                    <Award className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-700 mb-2">Progress Summary</h3>
                      <p className="text-blue-800 mb-4">
                        {client.firstName} has been making {getProgressQuality(progressData)} progress toward their fitness goals.
                        {getProgressNotes(progressData)}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">Overall Progress</p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">
                              {calculateOverallProgress(progressData)}%
                            </span>
                            <Progress 
                              value={calculateOverallProgress(progressData)} 
                              className="w-24 h-2" 
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">Consistency</p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">
                              {calculateConsistency(progressData)}%
                            </span>
                            <Progress 
                              value={calculateConsistency(progressData)} 
                              className="w-24 h-2" 
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <p className="text-sm text-gray-500 mb-1">Trend</p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">
                              {client.stats?.currentStreak || 0} day streak
                            </span>
                            <Activity className="w-5 h-5 text-blue-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
  
              {/* Details Tab and other tabs content remain mostly unchanged... */}
              {/* The rest of your JSX would continue from here */}
  
            </Tabs>
          </div>
  
          {/* Footer */}
          <div className="flex justify-end p-6 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  export default ClientProgressModal;