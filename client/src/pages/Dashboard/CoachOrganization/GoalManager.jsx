import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Dumbbell, Activity, Calendar, CheckCircle, Shield, Award, Zap, 
  AlertTriangle, Coins, Info, Clock, RefreshCcw, Plus, Save, X,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Progress from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextArea } from '@/components/ui/TextArea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import subscriptionService from '../../../services/subscription.service';
import { toast } from 'sonner';
import { useSocket } from '../../../SocketContext';
import { usePoints } from '../../../hooks/usePoints';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Goal difficulty configuration
const GOAL_DIFFICULTY = {
  easy: {
    label: 'Easy',
    points: 50,
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Shield className="w-4 h-4" />
  },
  medium: {
    label: 'Medium',
    points: 100,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Award className="w-4 h-4" />
  },
  hard: {
    label: 'Hard',
    points: 200,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Zap className="w-4 h-4" />
  }
};

// Goal types configuration
const GOAL_TYPES = [
  { id: 'strength', label: 'Strength', icon: <Dumbbell className="w-4 h-4 mr-2" /> },
  { id: 'cardio', label: 'Cardio', icon: <Activity className="w-4 h-4 mr-2" /> },
  { id: 'weight', label: 'Weight', icon: <Target className="w-4 h-4 mr-2" /> },
  { id: 'consistency', label: 'Consistency', icon: <Calendar className="w-4 h-4 mr-2" /> },
  { id: 'custom', label: 'Custom', icon: <Target className="w-4 h-4 mr-2" /> },
];

// Helper function to get goal icon
const getGoalIcon = (type) => {
  const goalType = GOAL_TYPES.find(t => t.id === type);
  return goalType ? goalType.icon : <Target className="w-6 h-6 text-blue-600" />;
};

// Helper function to get today's date plus N days
const getFutureDateString = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Individual goal card component
const GoalCard = ({ 
  goal, 
  onComplete, 
  subscription,
  onEdit
}) => {
  const { id, title, target, progress, due, type, difficulty = 'medium', completed, status } = goal;
  const difficultyConfig = GOAL_DIFFICULTY[difficulty];
  const icon = goal.icon || getGoalIcon(type);
  
  const isPendingApproval = status === 'pending_approval' || goal.clientRequestedCompletion;
  const isRejected = status === 'rejected' || goal.rejectedAt;
  
  const renderActionButton = () => {
    if (completed || status === 'completed') {
      return (
        <div className="flex items-center text-green-600 text-xs">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span>Completed {goal.completedDate ? `on ${formatDate(goal.completedDate)}` : ''}</span>
        </div>
      );
    } else if (isPendingApproval) {
      return (
        <div className="flex items-center text-amber-600 text-xs">
          <Clock className="w-4 h-4 mr-1" />
          <span>Awaiting Coach Approval</span>
        </div>
      );
    } else {
      return (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(goal)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onComplete(goal.id)}
            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Request Completion
          </Button>
        </div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-4 rounded-lg border shadow-sm ${
        completed || status === 'completed' ? 'border-green-200 bg-green-50' : 
        isPendingApproval ? 'border-amber-200 bg-amber-50' : 
        isRejected ? 'border-red-200 bg-red-50' : ''
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="bg-white p-2 rounded-full shadow-sm">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h4 className="font-semibold">{title}</h4>
                <Badge className={difficultyConfig.color}>
                  <span className="flex items-center">
                    {difficultyConfig.icon}
                    <span className="ml-1">{difficultyConfig.label}</span>
                  </span>
                </Badge>
                
                {isPendingApproval && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Pending Approval</span>
                  </Badge>
                )}
                
                {isRejected && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>Needs Review</span>
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{target}</p>
            </div>
            {!completed && !isPendingApproval && (
              <div className="mt-2 sm:mt-0 flex items-center">
                <Coins className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-xs text-gray-600">{difficultyConfig.points} points on completion</span>
              </div>
            )}
          </div>
          
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {isRejected && goal.rejectionReason && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-700">
                <AlertTriangle className="inline w-3 h-3 mr-1" />
                Coach feedback: {goal.rejectionReason}
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">Due: {due}</p>
            
            {isRejected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onComplete(id)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <RefreshCcw className="w-4 h-4 mr-1" />
                Resubmit
              </Button>
            )}
            
            {!isRejected && renderActionButton()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Custom Radio Button Group components for Goal Types and Difficulty
const GoalTypeRadioGroup = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label>Goal Type</Label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {GOAL_TYPES.map((type) => (
          <div 
            key={type.id}
            className={`
              p-3 rounded-lg border cursor-pointer flex items-center
              ${value === type.id ? 
                'bg-blue-50 border-blue-300 text-blue-600' : 
                'border-gray-200 hover:bg-gray-50'}
            `}
            onClick={() => onChange(type.id)}
          >
            {type.icon}
            <span className="ml-2">{type.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DifficultyRadioGroup = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label>Difficulty (Points Reward)</Label>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {Object.entries(GOAL_DIFFICULTY).map(([key, config]) => (
          <div 
            key={key}
            className={`
              p-3 rounded-lg border cursor-pointer flex flex-col items-center
              ${value === key ? 
                'bg-blue-50 border-blue-300 text-blue-600' : 
                'border-gray-200 hover:bg-gray-50'}
            `}
            onClick={() => onChange(key)}
          >
            <div className="flex items-center mb-1">
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </div>
            <span className="text-xs text-gray-500">{config.points} points</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Integrated Goals Section component
const IntegratedGoalsSection = ({ 
  goals: initialGoals,
  onCompleteGoal,
  onViewAll,
  subscription 
}) => {

  const [goals, setGoals] = useState(initialGoals || []);
  const [activeTab, setActiveTab] = useState('view');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [completionConfirmGoalId, setCompletionConfirmGoalId] = useState(null);
  const { socket } = useSocket();
  const { addPoints } = usePoints();
  const [newGoalForm, setNewGoalForm] = useState({
    id: `goal-${Date.now()}`,
    title: '',
    description: '',
    type: 'strength',
    target: '',
    difficulty: 'medium',
    dueDate: getFutureDateString(14),
    status: 'active',
    progress: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Update goals when initialGoals changes
  useEffect(() => {
    setGoals(initialGoals || []);
  }, [initialGoals]);

  // Handle socket events for goal approvals and rejections
  useEffect(() => {
    if (!socket) return;
    
    const handleGoalApproved = (data) => {
      //('Goal approved socket event received:', data);
      const { goalId, pointsAwarded } = data;
      
      // Update the goals array
      setGoals(currentGoals => 
        currentGoals.map(goal => 
          goal.id === goalId
            ? { 
                ...goal, 
                status: 'completed',
                completed: true,
                completedDate: new Date().toISOString(),
                pointsAwarded,
                progress: 100
              }
            : goal
        )
      );
      
      // Add points to user's total
      if (addPoints && pointsAwarded) {
        addPoints(pointsAwarded);
      }
    };
    
    const handleGoalRejected = (data) => {
      //('Goal rejected socket event received:', data);
      const { goalId, reason } = data;
      
      // Update the goals array
      setGoals(currentGoals => 
        currentGoals.map(goal => 
          goal.id === goalId
            ? { 
                ...goal, 
                status: 'active', // Reset to active
                clientRequestedCompletion: false,
                clientCompletionRequestDate: null,
                rejectedAt: new Date().toISOString(),
                rejectionReason: reason || 'Your coach has requested more progress',
                progress: Math.min(90, goal.progress) // Cap at 90% if rejected
              }
            : goal
        )
      );
    };
    
    socket.on('goalApproved', handleGoalApproved);
    socket.on('goalRejected', handleGoalRejected);
    
    return () => {
      socket.off('goalApproved', handleGoalApproved);
      socket.off('goalRejected', handleGoalRejected);
    };
  }, [socket, addPoints]);

  const handleRequestGoalCompletion = async (goalId) => {
    // Set the goal ID for completion confirmation
    setCompletionConfirmGoalId(goalId);
  };

  const confirmGoalCompletion = async () => {
    if (!completionConfirmGoalId) return;
    
    try {
      // Validate subscription ID
      if (!subscription || !subscription._id) {
        toast.error('Subscription information is missing. Please refresh the page.');
        setCompletionConfirmGoalId(null);
        return;
      }
      
      // Find the goal to be completed
      const goal = goals.find(g => g.id === completionConfirmGoalId);
      if (!goal) {
        toast.error('Goal not found');
        return;
      }
      
      // Get subscription ID safely
      const subscriptionId = subscription._id;
      //('Using subscription ID for goal completion:', subscriptionId);
      
      // Optimistic UI update
      const updatedGoals = goals.map(g => 
        g.id === completionConfirmGoalId 
          ? { 
              ...g, 
              status: 'pending_approval',
              clientRequestedCompletion: true,
              clientCompletionRequestDate: new Date().toISOString(),
              progress: 100
            } 
          : g
      );
      
      setGoals(updatedGoals);
      
      // Send request to the backend
      await subscriptionService.requestGoalCompletion(subscriptionId, completionConfirmGoalId);
      
      toast.success('Completion request sent to your coach!', {
        description: 'Your coach will review and approve this goal.'
      });
      
      // Reset state
      setCompletionConfirmGoalId(null);
      
    } catch (error) {
      console.error('Failed to request goal completion:', error);
      toast.error(`Failed to send completion request: ${error.message || 'Please try again'}`);
      
      // Revert optimistic update
      setGoals(initialGoals);
    }
  };

  const handleCancelCompletion = () => {
    setCompletionConfirmGoalId(null);
  };

  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setNewGoalForm({
      id: goal.id,
      title: goal.title || '',
      description: goal.description || '',
      type: goal.type || 'strength',
      target: goal.target || '',
      difficulty: goal.difficulty || 'medium',
      dueDate: goal.dueDate ? new Date(goal.dueDate).toISOString().split('T')[0] : getFutureDateString(14),
      status: goal.status || 'active',
      progress: goal.progress || 0
    });
    setActiveTab('add');
  };

  const handleAddNewGoal = () => {
    // Reset form for a new goal
    setSelectedGoal(null);
    setNewGoalForm({
      id: `goal-${Date.now()}`,
      title: '',
      description: '',
      type: 'strength',
      target: '',
      difficulty: 'medium',
      dueDate: getFutureDateString(14),
      status: 'active',
      progress: 0
    });
    setActiveTab('add');
  };

  const handleFormChange = (field, value) => {
    setNewGoalForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!newGoalForm.title || !newGoalForm.type || !newGoalForm.target || !newGoalForm.dueDate) {
        setFormError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Validate subscription ID
      if (!subscription || !subscription._id) {
        setFormError('Subscription information is missing. Please refresh the page and try again.');
        setIsSubmitting(false);
        return;
      }
      
      const dueDate = new Date(newGoalForm.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        setFormError('Due date cannot be in the past');
        setIsSubmitting(false);
        return;
      }
      
      // Prepare the goal data
      const goalData = {
        ...newGoalForm,
        dueDate: new Date(newGoalForm.dueDate),
        due: formatDate(new Date(newGoalForm.dueDate)),
        progress: parseInt(newGoalForm.progress) || 0,
      };
      
      // Get subscription ID safely
      const subscriptionId = subscription._id;
      //('Using subscription ID for goal:', subscriptionId);
      
      // Add or update the goal
      let updatedGoal;
      if (selectedGoal) {
        // Update existing goal
        updatedGoal = await subscriptionService.updateClientGoal(subscriptionId, goalData);
        
        // Update goals array
        setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        toast.success('Goal updated successfully!');
      } else {
        // Add new goal
        updatedGoal = await subscriptionService.addClientGoal(subscriptionId, goalData);
        
        // Add new goal to array
        setGoals(prev => [...prev, updatedGoal]);
        toast.success('New goal added successfully!');
      }
      
      // Reset form and go back to view tab
      setActiveTab('view');
      setSelectedGoal(null);
      
    } catch (error) {
      console.error('Failed to save goal:', error);
      setFormError(`Failed to save goal: ${error.message || 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter active and completed goals
  const activeGoals = goals.filter(goal => !goal.completed && goal.status !== 'completed');
  const completedGoals = goals.filter(goal => goal.completed || goal.status === 'completed');
  
  // Further filter active goals
  const pendingGoals = activeGoals.filter(
    goal => goal.status === 'pending_approval' || goal.clientRequestedCompletion
  );
  const regularActiveGoals = activeGoals.filter(
    goal => goal.status !== 'pending_approval' && !goal.clientRequestedCompletion
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Goals</CardTitle>
        <div className="space-x-2">
          <Button 
            onClick={handleAddNewGoal}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="view">View Goals</TabsTrigger>
            <TabsTrigger value="add">{selectedGoal ? 'Edit Goal' : 'Add New Goal'}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view">
            {/* Pending Approvals Section */}
            {pendingGoals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium flex items-center text-amber-800 mb-3">
                  <Clock className="w-4 h-4 mr-2" />
                  Awaiting Coach Approval
                </h3>
                <div className="space-y-4">
                  {pendingGoals.map(goal => (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal} 
                      onComplete={handleRequestGoalCompletion}
                      onEdit={handleEditGoal}
                      subscription={subscription}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Active Goals */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-medium flex items-center text-gray-800 mb-3">
                <Target className="w-4 h-4 mr-2" />
                Active Goals
              </h3>
              
              {regularActiveGoals.length > 0 ? (
                <div className="space-y-4">
                  {regularActiveGoals.map(goal => (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal} 
                      onComplete={handleRequestGoalCompletion} 
                      onEdit={handleEditGoal}
                      subscription={subscription}
                    />
                  ))}
                </div>
              ) : (
                pendingGoals.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No active goals</h3>
                    <p className="text-gray-500 mb-4">Your coach will assign goals for you to work on, or you can create your own.</p>
                    <Button onClick={handleAddNewGoal} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create a Goal
                    </Button>
                  </div>
                )
              )}
            </div>
            
            {/* Completed Goals Section */}
            {completedGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center text-green-800 mb-3">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed Goals
                </h3>
                <div className="space-y-4">
                  {completedGoals.map(goal => (
                    <GoalCard 
                      key={goal.id} 
                      goal={goal} 
                      onComplete={() => {}} // No-op for completed goals
                      onEdit={handleEditGoal}
                      subscription={subscription}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Goal Completion Confirmation */}
            {completionConfirmGoalId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">Complete Goal</h3>
                  <p className="mb-4">Are you sure you've completed this goal? Your coach will review your request.</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    {goals.find(g => g.id === completionConfirmGoalId) && (
                      <>
                        <h4 className="font-medium">{goals.find(g => g.id === completionConfirmGoalId).title}</h4>
                        <p className="text-sm text-gray-600">{goals.find(g => g.id === completionConfirmGoalId).target}</p>
                      </>
                    )}
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-200 mb-4">
                    <Info className="h-4 w-4 text-blue-600" />
                    <div className="ml-2">
                      <p className="text-blue-800 font-medium">Reward for completion</p>
                      <p className="text-blue-700 text-sm">
                        Your coach will review and approve this goal. You will earn 
                        <span className="font-semibold"> {
                          GOAL_DIFFICULTY[goals.find(g => g.id === completionConfirmGoalId)?.difficulty || 'medium'].points
                        } points</span> when approved.
                      </p>
                    </div>
                  </Alert>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCancelCompletion}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={confirmGoalCompletion}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit for Approval
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="add">
            <form onSubmit={handleSubmitGoal} className="space-y-4">
              {/* Goal Title */}
              <div className="space-y-2">
                <Label htmlFor="goal-title">Goal Title</Label>
                <Input
                  id="goal-title"
                  value={newGoalForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="E.g., Improve Bench Press"
                />
              </div>

              {/* Goal Description */}
              <div className="space-y-2">
                <Label htmlFor="goal-description">Description</Label>
                <TextArea
                  id="goal-description"
                  value={newGoalForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe the goal in detail..."
                  rows={3}
                />
              </div>

              {/* Goal Type - Replaced with custom radio group */}
              <GoalTypeRadioGroup 
                value={newGoalForm.type}
                onChange={(value) => handleFormChange('type', value)}
              />

              {/* Goal Target */}
              <div className="space-y-2">
                <Label htmlFor="goal-target">Specific Target</Label>
                <Input
                  id="goal-target"
                  value={newGoalForm.target}
                  onChange={(e) => handleFormChange('target', e.target.value)}
                  placeholder="E.g., Increase bench press by 10kg"
                />
              </div>

              {/* Goal Difficulty - Replaced with custom radio group */}
              <DifficultyRadioGroup 
                value={newGoalForm.difficulty}
                onChange={(value) => handleFormChange('difficulty', value)}
              />

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="goal-due-date">Due Date</Label>
                <Input
                  id="goal-due-date"
                  type="date"
                  value={newGoalForm.dueDate}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
                  min={getFutureDateString(1)} // At least tomorrow
                />
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <Label htmlFor="goal-progress">Progress (%)</Label>
                <Input
                  id="goal-progress"
                  type="number"
                  value={newGoalForm.progress}
                  onChange={(e) => handleFormChange('progress', e.target.value)}
                  min="0"
                  max="100"
                />
              </div>

              {/* Error Message */}
              {formError && (
                <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200 p-3">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span>{formError}</span>
                </Alert>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab('view')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : selectedGoal ? 'Update Goal' : 'Add Goal'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IntegratedGoalsSection;