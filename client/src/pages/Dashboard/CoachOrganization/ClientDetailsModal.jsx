import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import  Textarea  from '@/components/ui/textarea';
import { 
  User, X, Save, FileText, BarChart2, Dumbbell, 
  Download, MessageSquare, Calendar, ChevronDown, ChevronUp,
  Edit, CheckCircle, Award, Target, Activity, Clipboard
} from 'lucide-react';
import  Progress  from '@/components/ui/progress';

const ClientDetailsModal = ({ client, onClose, onSave, onOpenWorkouts, onOpenProgress, onExportData, onChatClick = () => {} }) => {
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

  // Initialize form data from client prop
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
  }, [client]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric fields from string to number
    const numericFields = ['workoutsCompleted', 'currentStreak', 'monthlyProgress', 'goalsAchieved', 'weeklyTarget', 'nutritionCompliance'];
    
    // Convert to number if it's a numeric field
    const processedValue = numericFields.includes(name) 
      ? value === '' ? 0 : Number(value) 
      : value;
    
    // Handle NaN values from invalid numeric input
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
      nutritionCompliance: formData.nutritionCompliance
    });
    setIsEditing(false);
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

  // Generate client goals based on current client data
  const generateClientGoals = () => {
    // Based on client data, generate realistic goals
    const goals = [
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
    
    return goals;
  };
  
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
        className={`bg-white rounded-xl shadow-2xl ${isExpanded ? 'w-full max-w-4xl' : 'w-full max-w-2xl'}`}
      >
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {client.firstName} {client.lastName || ''}
                </h2>
                <p className="text-gray-500">Client since: {clientSince()}</p>
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
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-4 border-b">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white">
                  <User className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="goals" className="data-[state=active]:bg-white">
                  <Target className="w-4 h-4 mr-2" />
                  Goals
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-white">
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Stats
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Notes
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <p className="font-medium">{client.plan || 'Standard'}</p>
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

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Stats
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onOpenWorkouts}
                    className="flex items-center"
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Manage Workouts
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onOpenProgress}
                    className="flex items-center"
                  >
                    <BarChart2 className="w-4 h-4 mr-2" />
                    View Progress
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onChatClick(client)}
                    className="flex items-center"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
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

              <TabsContent value="goals" className="mt-0">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Client Goals</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generateClientGoals().map((goal, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="mr-3">
                              {goal.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{goal.title}</h4>
                              <p className="text-sm text-gray-600">{goal.target}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Due: {goal.due}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progress</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                        </div>
                      </div>
                    </div>
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
            </div>
          </Tabs>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClientDetailsModal;