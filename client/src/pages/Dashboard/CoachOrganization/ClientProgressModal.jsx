import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import  Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, Save, BarChart2, Calendar, 
  TrendingUp, TrendingDown, Settings, 
  Plus, Trash2, Award, Activity,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import  Textarea  from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const METRIC_CONFIG = {
  weight: {
    label: 'Weight',
    unit: 'lbs',
    min: 50,
    max: 500,
    step: 0.1,
    placeholder: 'Enter weight in pounds',
    validation: (value) => value > 0 && value <= 500,
    color: '#3b82f6' // blue
  },
  strength: {
    label: 'Bench Press',
    unit: 'lbs',
    min: 20,
    max: 1000,
    step: 5,
    placeholder: 'Enter max lift weight',
    validation: (value) => value > 0 && value <= 1000,
    color: '#10b981' // green
  },
  cardio: {
    label: '5K Time',
    unit: 'minutes',
    min: 10,
    max: 180,
    step: 0.1,
    placeholder: 'Enter 5K time in minutes',
    validation: (value) => value > 0 && value <= 180,
    color: '#ef4444' // red
  },
  bodyFat: {
    label: 'Body Fat',
    unit: '%',
    min: 5,
    max: 50,
    step: 0.1,
    placeholder: 'Enter body fat percentage',
    validation: (value) => value >= 5 && value <= 50,
    color: '#f59e0b' // amber
  }
};

// Helper functions
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

// Line chart component
const SimpleLineChart = ({ data, title, color = "#2563eb" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 0);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1; // Avoid division by zero
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">{title}</h4>
        <span className="text-sm text-gray-500">
          Latest: {data.length > 0 ? data[data.length - 1].value.toFixed(1) : 'N/A'}
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
            const y1 = `${100 - ((prevPoint.value - minValue) / range) * 100}%`;
            const x2 = `${(index / (data.length - 1)) * 100}%`;
            const y2 = `${100 - ((point.value - minValue) / range) * 100}%`;
            
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

// Component definition
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
    value: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [newCustomMetric, setNewCustomMetric] = useState({
    name: '',
    unit: '',
    target: '',
    current: '',
    trackingFrequency: 'weekly'
  });
  const [metricToDelete, setMetricToDelete] = useState(null);
  const [isDeleteMetricConfirmOpen, setIsDeleteMetricConfirmOpen] = useState(false);

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

  const handleAddEntry = () => {
    if (!newEntry.value || !newEntry.date) {
      setValidationError('Please fill in all required fields');
      return;
    }

    const value = parseFloat(newEntry.value);
    if (isNaN(value)) {
      setValidationError('Please enter a valid number');
      return;
    }

    const config = selectedMetric in METRIC_CONFIG ? METRIC_CONFIG[selectedMetric] : null;
    if (config && !config.validation(value)) {
      setValidationError(`Value must be between ${config.min} and ${config.max} ${config.unit}`);
      return;
    }

    const entry = {
      date: newEntry.date,
      value: parseFloat(newEntry.value),
      notes: newEntry.notes || ''
    };

    // Update progressData based on the selected metric
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
          current: parseFloat(newEntry.value)
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
    setValidationError('');

    // Reset form
    setNewEntry({
      value: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleUpdateEntry = () => {
    if (!newEntry.value || !newEntry.date || editingEntryIndex === null) {
      setValidationError('Please fill in all required fields');
      return;
    }

    const value = parseFloat(newEntry.value);
    if (isNaN(value)) {
      setValidationError('Please enter a valid number');
      return;
    }

    const config = selectedMetric in METRIC_CONFIG ? METRIC_CONFIG[selectedMetric] : null;
    if (config && !config.validation(value)) {
      setValidationError(`Value must be between ${config.min} and ${config.max} ${config.unit}`);
      return;
    }

    const updatedEntry = {
      date: newEntry.date,
      value: parseFloat(newEntry.value),
      notes: newEntry.notes || ''
    };

    // Update progressData based on the selected metric
    let updatedProgressData = {...progressData};
    
    if (selectedMetric === 'weight') {
      const entries = [...progressData.weightProgress];
      entries[editingEntryIndex] = updatedEntry;
      updatedProgressData.weightProgress = entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (selectedMetric === 'strength') {
      const entries = [...progressData.strengthProgress];
      entries[editingEntryIndex] = updatedEntry;
      updatedProgressData.strengthProgress = entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (selectedMetric === 'cardio') {
      const entries = [...progressData.cardioProgress];
      entries[editingEntryIndex] = updatedEntry;
      updatedProgressData.cardioProgress = entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (selectedMetric === 'bodyFat') {
      const entries = [...progressData.bodyFatProgress];
      entries[editingEntryIndex] = updatedEntry;
      updatedProgressData.bodyFatProgress = entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
      // Handle custom metrics
      const customMetricIndex = progressData.customMetrics.findIndex(metric => metric.id === selectedMetric);
      if (customMetricIndex !== -1) {
        const updatedCustomMetrics = [...progressData.customMetrics];
        const entries = [...updatedCustomMetrics[customMetricIndex].data];
        entries[editingEntryIndex] = updatedEntry;
        updatedCustomMetrics[customMetricIndex] = {
          ...updatedCustomMetrics[customMetricIndex],
          data: entries.sort((a, b) => new Date(a.date) - new Date(b.date)),
          current: parseFloat(newEntry.value)
        };
        updatedProgressData.customMetrics = updatedCustomMetrics;
      }
    }

    setProgressData(updatedProgressData);
    setIsEditingEntry(false);
    setEditingEntryIndex(null);
    setValidationError('');

    // Reset form
    setNewEntry({
      value: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleEditEntry = (metricType, index) => {
    let entryToEdit;
    
    if (metricType === 'weight') {
      entryToEdit = progressData.weightProgress[index];
    } else if (metricType === 'strength') {
      entryToEdit = progressData.strengthProgress[index];
    } else if (metricType === 'cardio') {
      entryToEdit = progressData.cardioProgress[index];
    } else if (metricType === 'bodyFat') {
      entryToEdit = progressData.bodyFatProgress[index];
    } else {
      // Handle custom metrics
      const customMetric = progressData.customMetrics.find(metric => metric.id === metricType);
      if (customMetric) {
        entryToEdit = customMetric.data[index];
      }
    }

    if (entryToEdit) {
      setSelectedMetric(metricType);
      setNewEntry({
        value: entryToEdit.value.toString(),
        date: entryToEdit.date,
        notes: entryToEdit.notes || ''
      });
      setEditingEntryIndex(index);
      setIsEditingEntry(true);
    }
  };

  const handleDeleteEntry = () => {
    if (!entryToDelete) return;
    
    const { metricType, entryDate } = entryToDelete;
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
    setIsDeleteConfirmOpen(false);
    setEntryToDelete(null);
  };

  const openDeleteConfirmation = (metricType, entryDate) => {
    setEntryToDelete({ metricType, entryDate });
    setIsDeleteConfirmOpen(true);
  };

  const handleAddCustomMetric = () => {
    if (!newCustomMetric.name || !newCustomMetric.unit) {
      setValidationError('Please provide a name and unit for the custom metric');
      return;
    }
    
    const metric = {
      id: `custom-${Date.now()}`,
      name: newCustomMetric.name,
      unit: newCustomMetric.unit,
      target: parseFloat(newCustomMetric.target) || 0,
      current: parseFloat(newCustomMetric.current) || 0,
      trackingFrequency: newCustomMetric.trackingFrequency || 'weekly',
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
    setValidationError('');
    
    // Reset form
    setNewCustomMetric({
      name: '',
      unit: '',
      target: '',
      current: '',
      trackingFrequency: 'weekly'
    });
  };

  const handleDeleteCustomMetric = () => {
    if (!metricToDelete) return;
    
    setProgressData({
      ...progressData,
      customMetrics: progressData.customMetrics.filter(metric => metric.id !== metricToDelete)
    });
    
    setIsDeleteMetricConfirmOpen(false);
    setMetricToDelete(null);
  };

  const openDeleteMetricConfirmation = (metricId) => {
    setMetricToDelete(metricId);
    setIsDeleteMetricConfirmOpen(true);
  };

  const handleSave = () => {
    onSave(progressData);
    onClose();
  };

  const MetricCard = ({ metric }) => {
    const config = METRIC_CONFIG[metric];
    const data = progressData[`${metric}Progress`];
    const color = config.color;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">{config.label} Progress</CardTitle>
            {data.length > 0 && renderChange(data, metric)}