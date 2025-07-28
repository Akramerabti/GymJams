import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Textarea from '@/components/ui/TextArea';
import { 
  User, X, Save, FileText, BarChart2, Dumbbell, 
  Download, Calendar, ChevronDown, ChevronUp,
  Edit, CheckCircle, Award, Target, Activity, Clipboard,
  Droplet, Heart, Zap, Cookie, Brain, ArrowRight
} from 'lucide-react';
import Progress from '@/components/ui/progress';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import GoalManager from './GoalManager';
import ClientWorkoutsModal from './ClientWorkoutsModal';
import ClientProgressModal from './ClientProgressModal';
import subscriptionService from '../../../services/subscription.service';

const ClientDetailsModal = ({ client, onClose, onSave, onExportData}) => {
  const [formData, setFormData] = useState({
    workoutsCompleted: 0,
    currentStreak: 0,
    monthlyProgress: 0,
    goalsAchieved: 0,
    notes: '',
    nextSession: '',
    weeklyTarget: 0,
    nutritionCompliance: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWorkoutsModalOpen, setIsWorkoutsModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [goals, setGoals] = useState([]);

  const modalRef = useRef(null);
  
  // Determine if client is premium or elite
  const isPremium = client.subscription === 'premium';
  const isElite = client.subscription === 'elite';
  const hasAdvancedFeatures = isPremium || isElite;
  
  // Calculate client since days or weeks
  const clientSince = () => {
    if (!client.joinDate) return 'Recently';
    
    const joinDate = new Date(client.joinDate);
    const now = new Date();
    const diffTime = Math.abs(now - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else {
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} weeks`;
    }
  };
  
  const fetchGoals = async () => {
    try {
      
      const goals = await subscriptionService.getClientGoals(client.id);
      setGoals(goals);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      toast.error('Failed to fetch goals');
    }
  };

  useEffect(() => {
    setActiveTab('overview');
  }, [client]); 

  useEffect(() => {
    if (client && client.stats) {
      setFormData({
        workoutsCompleted: client.stats.workoutsCompleted || 0,
        currentStreak: client.stats.currentStreak || 0,
        monthlyProgress: client.stats.monthlyProgress || 0,
        goalsAchieved: client.stats.goalsAchieved || 0,
        notes: client.notes || '',
        nextSession: client.nextSession || '',
        weeklyTarget: client.stats.weeklyTarget || 3,
        nutritionCompliance: client.stats.nutritionCompliance || 0
      });
    }

    fetchGoals();
  }, [client]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && 
          !isWorkoutsModalOpen && !isProgressModalOpen) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isWorkoutsModalOpen, isProgressModalOpen]); 

  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['workoutsCompleted', 'currentStreak', 'monthlyProgress', 'goalsAchieved', 'weeklyTarget', 'nutritionCompliance'];
    const processedValue = numericFields.includes(name) 
      ? value === '' ? 0 : Number(value) 
      : value;
    const finalValue = typeof processedValue === 'number' && isNaN(processedValue) 
      ? 0 
      : processedValue;
    setFormData({
      ...formData,
      [name]: finalValue
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      workoutsCompleted: formData.workoutsCompleted,
      currentStreak: formData.currentStreak,
      monthlyProgress: formData.monthlyProgress,
      goalsAchieved: formData.goalsAchieved,
      notes: formData.notes,
      nextSession: formData.nextSession,
      weeklyTarget: formData.weeklyTarget,
      nutritionCompliance: formData.nutritionCompliance,
      goals: formData.goals
    });
    setIsEditing(false);
  };
  
  const handleUpdateStatsClick = () => {
    setActiveTab('stats');
    setIsEditing(true);
  };

  const handleOpenWorkouts = () => {
    setIsWorkoutsModalOpen(true);
  };

  const handleOpenProgress = () => {
    setIsProgressModalOpen(true);
  };

  const handleAddGoal = async (newGoal) => {
    try {
      const addedGoal = await subscriptionService.addClientGoal(client.subscriptionId, newGoal);
      setGoals([...goals, addedGoal]);
      toast.success('Goal added successfully!');
    } catch (error) {
      console.error('Failed to add goal:', error);
      toast.error('Failed to add goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await subscriptionService.deleteClientGoal(client.subscriptionId, goalId);
      setGoals(goals.filter(g => g.id !== goalId));
      toast.success('Goal deleted successfully!');
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      const updatedGoal = await subscriptionService.requestGoalCompletion(client.subscriptionId, goalId);
      setGoals(goals.map(g => g.id === goalId ? updatedGoal : g));
      toast.success('Goal completion requested!');
    } catch (error) {
      console.error('Failed to request goal completion:', error);
      toast.error('Failed to request goal completion');
    }
  };

  const handleUpdateGoal = async (updatedGoal) => {
    try {
      const goal = await subscriptionService.updateClientGoal(client.subscriptionId, updatedGoal);
      setGoals(goals.map(g => g.id === goal.id ? goal : g));
      toast.success('Goal updated successfully!');
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error('Failed to update goal');
    }
  };

  // Render a progress bar with label
  const renderProgressBar = (value, label) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );

  const generateClientGoals = () => {
    // If client has advanced goals (premium or elite), use those
    if (hasAdvancedFeatures && client.advancedGoals && client.advancedGoals.length > 0) {
      return client.advancedGoals.map(goal => {
        // Calculate progress percentage
        const total = goal.targetValue - goal.startValue;
        const current = goal.currentValue - goal.startValue;
        const progressPercent = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
        
        // Determine icon based on goal type
        let icon;
        switch(goal.type) {
          case 'strength':
            icon = <Dumbbell className="w-6 h-6 text-blue-600" />;
            break;
          case 'endurance':
            icon = <Activity className="w-6 h-6 text-green-600" />;
            break;
          case 'body_composition':
            icon = <Droplet className="w-6 h-6 text-purple-600" />;
            break;
          default:
            icon = <Target className="w-6 h-6 text-orange-600" />;
        }
        
        // Format deadline
        const deadlineDate = new Date(goal.deadline);
        const now = new Date();
        const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
        const formattedDeadline = daysLeft > 0 ? `${daysLeft} days left` : 'Overdue';
        
        return {
          id: goal.id,
          title: goal.name,
          description: goal.description, // Renamed to "description"
          progress: progressPercent,
          due: formattedDeadline,
          icon,
          current: goal.currentValue,
          target: goal.targetValue, // Keep this as "target"
          unit: goal.type === 'body_composition' ? '%' : goal.type === 'endurance' ? 'min' : 'kg'
        };
      });
    }
    
    // For basic clients or fallback to standard goals
    return [
      { 
        title: "Strength Improvement", 
        target: `Increase ${client.stats?.strengthFocus || 'bench press'} by 10%`,
        progress: Math.min(100, Math.max(0, (client.stats?.strengthProgress || 0) * 100)), 
        due: "4 weeks",
        icon: <Dumbbell className="w-6 h-6 text-blue-600" />
      },
      { 
        title: "Consistency", 
        target: `${formData.weeklyTarget || 3} workouts per week`,
        progress: Math.min(100, Math.max(0, ((client.stats?.workoutsCompleted || 0) / (formData.weeklyTarget * 4)) * 100)),
        due: "Ongoing",
        icon: <Activity className="w-6 h-6 text-green-600" />
      },
      { 
        title: "Nutrition Plan", 
        target: "Follow meal plan consistently",
        progress: formData.nutritionCompliance || 70,
        due: "Ongoing",
        icon: <Clipboard className="w-6 h-6 text-orange-600" />
      },
      { 
        title: client.stats?.customGoalTitle || "Personal Best", 
        target: client.stats?.customGoalTarget || "Complete 5K run",
        progress: client.stats?.customGoalProgress || 50,
        due: client.stats?.customGoalDue || "2 weeks",
        icon: <Award className="w-6 h-6 text-purple-600" />
      }
    ];
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        key="client-details-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-white rounded-xl shadow-2xl overflow-auto max-h-[90vh] ${isExpanded ? 'w-full max-w-4xl' : 'w-full max-w-2xl'}`}
        >
          <div className="sticky top-0 z-10 bg-white">
             {/* Header */}
             <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold truncate max-w-[200px] sm:max-w-sm">
                    {client.firstName} {client.lastName || ''}
                  </h2>
                  <p className="text-sm text-gray-500">Client since: {clientSince()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
            </div>


            {/* Tab Navigation */}
            <div className="px-4 sm:px-6 pt-2 border-b overflow-x-auto">
              <Tabs>
                <TabsList className="bg-gray-100 w-full justify-start">
                  <TabsTrigger value="overview" onClick={() => setActiveTab('overview')} className="data-[state=active]:bg-white">
                    <User className="w-4 h-4 mr-2" />
                    <span className="min-w-max">Overview</span>
                  </TabsTrigger>
                  {/* New Questionnaire Tab */}
                  <TabsTrigger value="questionnaire" onClick={() => setActiveTab('questionnaire')} className="data-[state=active]:bg-white">
                    <Clipboard className="w-4 h-4 mr-2" />
                    <span className="min-w-max">Questionnaire Data</span>
                  </TabsTrigger>
                  <TabsTrigger value="goals" onClick={() => setActiveTab('goals')} className="data-[state=active]:bg-white">
                    <Target className="w-4 h-4 mr-2" />
                    <span className="min-w-max">Goals</span>
                  </TabsTrigger>
                  <TabsTrigger value="stats" onClick={() => setActiveTab('stats')} className="data-[state=active]:bg-white">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    <span className="min-w-max">Stats</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" onClick={() => setActiveTab('notes')} className="data-[state=active]:bg-white">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="min-w-max">Notes</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <Tabs defaultValue="overview" value={activeTab}>
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Client Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-500">Name</label>
                        <p className="font-medium">{client.firstName} {client.lastName || ''}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">Email</label>
                        <p className="font-medium">{client.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">Plan</label>
                        <p className="font-medium flex items-center">
                          {client.subscription?.charAt(0).toUpperCase() + client.subscription?.slice(1) || 'Basic'}
                          {isElite && <Award className="ml-1 w-4 h-4 text-amber-500" />}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">Status</label>
                        <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {client.status || 'Active'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Current Progress</h3>
                    <div className="space-y-3">
                      {renderProgressBar(formData.monthlyProgress, "Monthly Progress")}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <label className="block text-sm text-gray-500">Workouts</label>
                          <p className="text-xl font-semibold">{formData.workoutsCompleted}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <label className="block text-sm text-gray-500">Streak</label>
                          <p className="text-xl font-semibold">{formData.currentStreak} days</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <label className="block text-sm text-gray-500">Goals Achieved</label>
                          <p className="text-xl font-semibold">{formData.goalsAchieved}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <label className="block text-sm text-gray-500">Weekly Target</label>
                          <p className="text-xl font-semibold">{formData.weeklyTarget}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Featured Goal Progress */}
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Current Goal</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setActiveTab('goals')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View All Goals
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Display first goal from the list */}
                {(() => {
                  if (goals.length > 0) {
                    const featuredGoal = goals[0];
                    return (
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-50 p-2 rounded-full">
                          {featuredGoal.icon || <Target className="w-6 h-6 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{featuredGoal.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{featuredGoal.target}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Progress</span>
                              <span>{featuredGoal.progress}%</span>
                            </div>
                            <Progress value={featuredGoal.progress} className="h-2" />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Due: {featuredGoal.due}</p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <p className="text-gray-500 text-sm">No goals set yet.</p>
                    );
                  }
                })()}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleUpdateStatsClick}
                    className="flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Stats
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenWorkouts}
                    className="flex items-center"
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Manage Workouts
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenProgress}
                    className="flex items-center"
                  >
                    <BarChart2 className="w-4 h-4 mr-2" />
                    View Progress
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onExportData}
                    className="flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </TabsContent>

              {/* Questionnaire Data Tab */}
              <TabsContent value="questionnaire" className="mt-0">
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clipboard className="w-5 h-5 mr-2 text-blue-600" />
                    Questionnaire Data
                  </h3>
                  {client.subscriptionData && client.subscriptionData.questionnaireData ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(client.subscriptionData.questionnaireData).map(([key, value]) => {
                        // Format key to readable label
                        const label = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase());
                        // Format value
                        let displayValue;
                        if (Array.isArray(value)) {
                          displayValue = value.length > 0 ? value.join(', ') : 'Empty';
                        } else if (typeof value === 'boolean') {
                          displayValue = value ? 'Yes' : 'No';
                        } else if (value === '' || value === null || value === undefined) {
                          displayValue = 'Empty';
                        } else {
                          displayValue = value;
                        }
                        return (
                          <div key={key} className="bg-gray-50 p-3 rounded-lg flex flex-col">
                            <span className="text-xs text-gray-500 mb-1">{label}</span>
                            <span className="font-medium text-gray-800">{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No questionnaire data available.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="goals" className="mt-0">
                <GoalManager
                  client={client}
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                  onCompleteGoal={handleCompleteGoal}
                  subscription={{ 
                    _id: client.id,
                    id: client.id, // Providing both for compatibility
                    // Include other potentially useful properties from client
                    subscription: client.subscription,
                    status: client.status
                  }}
                />
              </TabsContent>          

              <TabsContent value="stats" className="mt-0">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Workouts Completed
                        </label>
                        <Input
                          type="number"
                          name="workoutsCompleted"
                          value={formData.workoutsCompleted}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Streak (days)
                        </label>
                        <Input
                          type="number"
                          name="currentStreak"
                          value={formData.currentStreak}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monthly Progress (%)
                        </label>
                        <Input
                          type="number"
                          name="monthlyProgress"
                          value={formData.monthlyProgress}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Goals Achieved
                        </label>
                        <Input
                          type="number"
                          name="goalsAchieved"
                          value={formData.goalsAchieved}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weekly Target (workouts)
                        </label>
                        <Input
                          type="number"
                          name="weeklyTarget"
                          value={formData.weeklyTarget}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nutrition Compliance (%)
                        </label>
                        <Input
                          type="number"
                          name="nutritionCompliance"
                          value={formData.nutritionCompliance}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Next Session
                        </label>
                        <Input
                          type="date"
                          name="nextSession"
                          value={formData.nextSession}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold">Client Stats</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-700">Fitness</h4>
                          <Dumbbell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Workouts</span>
                            <span className="font-semibold">{formData.workoutsCompleted}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Streak</span>
                            <span className="font-semibold">{formData.currentStreak} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Weekly Target</span>
                            <span className="font-semibold">{formData.weeklyTarget}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-700">Progress</h4>
                          <Award className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monthly</span>
                            <span className="font-semibold">{formData.monthlyProgress}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Goals Achieved</span>
                            <span className="font-semibold">{formData.goalsAchieved}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nutrition</span>
                            <span className="font-semibold">{formData.nutritionCompliance}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-purple-700">Schedule</h4>
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Next Session</span>
                            <span className="font-semibold">
                              {formData.nextSession ? new Date(formData.nextSession).toLocaleDateString() : 'Not scheduled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Active</span>
                            <span className="font-semibold">{client.lastActive || 'Unknown'}</span>
                          </div>
                          {client.fitnessProfile && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Experience</span>
                              <span className="font-semibold capitalize">{client.fitnessProfile.experience || 'Beginner'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional stats for premium/elite customers */}
                    {hasAdvancedFeatures && (
                      <div className="bg-white p-4 rounded-lg border mt-4">
                        <h4 className="font-medium text-gray-700 mb-3">Advanced Metrics</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs text-gray-500">Lifestyle Score</span>
                            <p className="text-lg font-semibold">{client.stats?.lifestyleScore || 75}/100</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs text-gray-500">Adherence Risk</span>
                            <p className={`text-lg font-semibold ${
                              client.stats?.adherenceRisk === 'high' ? 'text-red-600' :
                              client.stats?.adherenceRisk === 'medium' ? 'text-amber-600' :
                              'text-green-600'
                            }`}>
                              {client.stats?.adherenceRisk === 'high' ? 'High' :
                               client.stats?.adherenceRisk === 'medium' ? 'Medium' :
                               'Low'}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs text-gray-500">Recent Workouts</span>
                            <p className="text-lg font-semibold">{client.stats?.recentWorkouts || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Client Notes</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Add notes about this client..."
                        className="w-full h-64 resize-none"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button"
                          onClick={() => {
                            onSave({...formData});
                            setIsEditing(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      {formData.notes ? (
                        <div className="whitespace-pre-wrap">{formData.notes}</div>
                      ) : (
                        <p className="text-gray-500 italic">No notes have been added for this client.</p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Nutrition Tab (Premium & Elite Only) */}
              {hasAdvancedFeatures && (
                <TabsContent value="nutrition" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold">Nutrition Data</h3>
                      <Badge 
                        variant="outline" 
                        className={`${isElite ? "bg-amber-50 text-amber-700" : "bg-purple-50 text-purple-700"}`}
                      >
                        {isElite ? 'Elite' : 'Premium'}
                      </Badge>
                    </div>
                    
                    {client.nutritionData ? (
                      <div className="space-y-6">
                        {/* Macro targets */}
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                            <Cookie className="w-5 h-5 mr-2 text-blue-600" /> 
                            Daily Macro Targets
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">Protein</p>
                              <p className="text-xl font-bold text-blue-700">
                                {client.nutritionData.macroTargets.protein.value}{client.nutritionData.macroTargets.protein.unit}
                              </p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">Carbs</p>
                              <p className="text-xl font-bold text-green-700">
                                {client.nutritionData.macroTargets.carbs.value}{client.nutritionData.macroTargets.carbs.unit}
                              </p>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">Fat</p>
                              <p className="text-xl font-bold text-yellow-700">
                                {client.nutritionData.macroTargets.fat.value}{client.nutritionData.macroTargets.fat.unit}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Meal plan adherence */}
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <h4 className="font-medium text-gray-800 mb-3">Meal Plan</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Customized Plan</span>
                              <span className="font-medium text-green-600">
                                {client.nutritionData.mealPlan.customized ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Last Updated</span>
                              <span className="font-medium">
                                {formatDate(client.nutritionData.mealPlan.lastUpdated)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-2">
                              <span className="text-gray-600">Adherence Rate</span>
                              <span className="font-medium">
                                {client.nutritionData.mealPlan.adherenceRate}%
                              </span>
                            </div>
                            <Progress 
                              value={client.nutritionData.mealPlan.adherenceRate} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                        
                        {/* Supplements */}
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <h4 className="font-medium text-gray-800 mb-3">Recommended Supplements</h4>
                          <div className="flex flex-wrap gap-2">
                            {client.nutritionData.supplements.map((supplement, idx) => (
                              <Badge key={idx} variant="outline" className="bg-gray-50">
                                {supplement}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Elite-only nutrition data */}
                        {isElite && client.nutritionData.calories && (
                          <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              <Zap className="w-5 h-5 mr-2 text-amber-500" />
                              Elite Nutrition Metrics
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Daily Calories</p>
                                <div className="flex justify-between items-end">
                                  <div>
                                    <span className="text-xs text-gray-500">Target</span>
                                    <p className="text-lg font-semibold">{client.nutritionData.calories.target}</p>
                                  </div>
                                  <span className="text-gray-400 mx-2">vs</span>
                                  <div>
                                    <span className="text-xs text-gray-500">Actual</span>
                                    <p className="text-lg font-semibold">{client.nutritionData.calories.actual}</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Water Intake (L)</p>
                                <div className="flex justify-between items-end">
                                  <div>
                                    <span className="text-xs text-gray-500">Target</span>
                                    <p className="text-lg font-semibold">{client.nutritionData.waterIntake.target}</p>
                                  </div>
                                  <span className="text-gray-400 mx-2">vs</span>
                                  <div>
                                    <span className="text-xs text-gray-500">Actual</span>
                                    <p className="text-lg font-semibold">{client.nutritionData.waterIntake.actual}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <p className="text-gray-500">No nutrition data available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {/* Recovery Tab (Elite Only) */}
              {isElite && (
                <TabsContent value="recovery" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold">Recovery Metrics</h3>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">Elite</Badge>
                    </div>
                    
                    {client.recoveryMetrics ? (
                      <div className="space-y-6">
                        {/* Sleep Quality */}
                        <div className="bg-white p-4 rounded-lg border shadow-sm">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                            <Brain className="w-5 h-5 mr-2 text-purple-600" />
                            Sleep Quality
                          </h4>
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Average Quality</span>
                              <span className="text-sm font-medium">{client.recoveryMetrics.sleepQuality.average}%</span>
                            </div>
                            <Progress value={client.recoveryMetrics.sleepQuality.average} className="h-2" />
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Trend: </span>
                            <span className={client.recoveryMetrics.sleepQuality.trend === 'improving' ? 'text-green-600' : 'text-blue-600'}>
                              {client.recoveryMetrics.sleepQuality.trend === 'improving' ? 'Improving' : 'Stable'}
                            </span>
                          </div>
                          
                          {/* Recent sleep records */}
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-2">Recent Sleep Records:</p>
                            <div className="grid grid-cols-7 gap-1">
                              {client.recoveryMetrics.sleepQuality.latestRecords.map((record, idx) => (
                                <div key={idx} className="text-center">
                                  <div 
                                    className="h-16 bg-purple-100 rounded-md relative overflow-hidden"
                                    title={`${record.hours.toFixed(1)} hours - ${record.quality}% quality`}
                                  >
                                    <div 
                                      className="absolute bottom-0 w-full bg-purple-500"
                                      style={{ 
                                        height: `${(record.quality / 100) * 100}%`,
                                        opacity: 0.6 + ((record.quality / 100) * 0.4)
                                      }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                      {record.hours.toFixed(1)}h
                                    </div>
                                  </div>
                                  <p className="text-xs mt-1">
                                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* HRV and Soreness */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              <Heart className="w-5 h-5 mr-2 text-red-600" />
                              Heart Rate Variability
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Current HRV</span>
                                <span className="font-medium">{client.recoveryMetrics.hrv.current} ms</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Baseline</span>
                                <span className="font-medium">{client.recoveryMetrics.hrv.baseline} ms</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Status</span>
                                <span className={`font-medium ${
                                  client.recoveryMetrics.hrv.current >= client.recoveryMetrics.hrv.baseline 
                                    ? 'text-green-600' 
                                    : 'text-amber-600'
                                }`}>
                                  {client.recoveryMetrics.hrv.current >= client.recoveryMetrics.hrv.baseline 
                                    ? 'Ready for Training' 
                                    : 'Recovery Needed'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              <Activity className="w-5 h-5 mr-2 text-orange-600" />
                              Recovery Status
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Soreness Level</span>
                                <span className="font-medium">{client.recoveryMetrics.soreness.current}/10</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Affected Areas</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {client.recoveryMetrics.soreness.affected_areas.length > 0 ? 
                                    client.recoveryMetrics.soreness.affected_areas.map((area, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700">
                                        {area}
                                      </Badge>
                                    )) : 
                                    <span className="text-gray-500">None</span>
                                  }
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Recommended Rest</span>
                                <span className="font-medium">{client.recoveryMetrics.restDays.recommended} day(s)</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Rest Days Taken</span>
                                <span className={`font-medium ${
                                  client.recoveryMetrics.restDays.taken >= client.recoveryMetrics.restDays.recommended 
                                    ? 'text-green-600' 
                                    : 'text-amber-600'
                                }`}>
                                  {client.recoveryMetrics.restDays.taken} day(s)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Latest Assessment */}
                        {client.physiqueAssessments && client.physiqueAssessments.length > 0 && (
                          <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              <Dumbbell className="w-5 h-5 mr-2 text-blue-600" />
                              Latest Physique Assessment
                            </h4>
                            <div className="text-sm text-gray-600 mb-3">
                              Date: {formatDate(client.physiqueAssessments[0].date)}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Weight</p>
                                <p className="font-semibold">{client.physiqueAssessments[0].weight.toFixed(1)} kg</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Body Fat %</p>
                                <p className="font-semibold">{client.physiqueAssessments[0].bodyFat.toFixed(1)}%</p>
                              </div>
                              {Object.entries(client.physiqueAssessments[0].measurements).map(([key, value]) => (
                                <div key={key}>
                                  <p className="text-xs text-gray-500 capitalize">{key}</p>
                                  <p className="font-semibold">{value.toFixed(1)} cm</p>
                                </div>
                              ))}
                            </div>
                            {client.physiqueAssessments[0].notes && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-600">Notes:</p>
                                <p className="text-sm mt-1">{client.physiqueAssessments[0].notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <p className="text-gray-500">No recovery metrics available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </motion.div>
      </motion.div>

    <AnimatePresence>
  {isWorkoutsModalOpen && (
    <ClientWorkoutsModal
      key="workouts-modal" 
      client={client}
      onClose={() => setIsWorkoutsModalOpen(false)}
      onSave={(updatedWorkouts) => {
        onSave({ workouts: updatedWorkouts });
        setIsWorkoutsModalOpen(false);
      }}
    />
  )}
  {isProgressModalOpen && (
    <ClientProgressModal
      key="progress-modal"
      client={client}
      onClose={() => setIsProgressModalOpen(false)}
      onSave={(updatedProgress) => {
        onSave({ progress: updatedProgress });
        setIsProgressModalOpen(false);
      }}
    />
  )}
</AnimatePresence>
    </AnimatePresence>
  );
};

export default ClientDetailsModal;