import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Dumbbell, Activity, Calendar, ArrowRight, 
  CheckCircle, Shield, Award, Zap, 
  AlertTriangle, Coins, Info, Clock, RefreshCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Progress from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
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

// Helper function to get goal icon
const getGoalIcon = (type) => {
  switch (type) {
    case 'strength':
      return <Dumbbell className="w-6 h-6 text-blue-600" />;
    case 'cardio':
      return <Activity className="w-6 h-6 text-green-600" />;
    case 'weight':
      return <Target className="w-6 h-6 text-red-600" />;
    default:
      return <Calendar className="w-6 h-6 text-purple-600" />;
  }
};

// Individual goal card component
const GoalCard = ({ goal, onComplete, subscription }) => {
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onComplete(goal.id)}
          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Request Completion
        </Button>
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
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
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

// Completion confirmation dialog
const CompletionDialog = ({ isOpen, onClose, onConfirm, goal }) => {
  if (!goal) return null;
  
  const difficultyConfig = GOAL_DIFFICULTY[goal.difficulty || 'medium'];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Goal</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p>Are you sure you've completed this goal?</p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium">{goal.title}</h3>
            <p className="text-sm text-gray-600">{goal.target}</p>
          </div>
          
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <div className="ml-2">
              <p className="text-blue-800 font-medium">Reward for completion</p>
              <p className="text-blue-700 text-sm">
                Your coach will review and approve this goal. You will earn <span className="font-semibold">{difficultyConfig.points} points</span> when approved.
              </p>
            </div>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Submit for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main goals section component
const GoalsSection = ({ 
  goals: initialGoals, 
  onCompleteGoal,
  onViewAll,
  subscription 
}) => {
  const [goals, setGoals] = useState(initialGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const { socket } = useSocket();
  const { addPoints } = usePoints();

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
    
    // Add event listeners
    socket.on('goalApproved', handleGoalApproved);
    socket.on('goalRejected', handleGoalRejected);
    
    // Cleanup
    return () => {
      socket.off('goalApproved', handleGoalApproved);
      socket.off('goalRejected', handleGoalRejected);
    };
  }, [socket, addPoints]);

  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  const handleRequestGoalCompletion = async (goalId) => {
    try {
      // Find the goal to be completed
      const goal = goals.find(g => g.id === goalId);
      if (!goal) {
        toast.error('Goal not found');
        return;
      }
      
      // Set dialog states for confirmation
      setSelectedGoal(goal);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Failed to prepare goal completion request:', error);
      toast.error('Failed to prepare completion request');
    }
  };
  
  const confirmComplete = async () => {
    if (!selectedGoal) return;
    
    try {
      // Optimistic UI update
      const updatedGoals = goals.map(g => 
        g.id === selectedGoal.id 
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
      await subscriptionService.requestGoalCompletion(subscription._id, selectedGoal.id);
      
      toast.success('Completion request sent to your coach!', {
        description: 'Your coach will review and approve this goal.'
      });
      
      setIsDialogOpen(false);
      setSelectedGoal(null);
      
    } catch (error) {
      console.error('Failed to request goal completion:', error);
      toast.error('Failed to send completion request');
      
      // Revert optimistic update
      setGoals(initialGoals);
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
    <>
      <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Current Goals</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onViewAll} // This now correctly navigates to goals tab
        >
          View All
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardHeader>
        <CardContent>
          {/* Pending Approval Section */}
          {pendingGoals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium flex items-center text-amber-800 mb-3">
                <Clock className="w-4 h-4 mr-2" />
                Awaiting Coach Approval
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingGoals.slice(0, 2).map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    onComplete={() => {}} // No-op for pending goals
                    subscription={subscription}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Active Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regularActiveGoals.length > 0 ? (
              regularActiveGoals.slice(0, 4 - pendingGoals.length).map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onComplete={handleRequestGoalCompletion} 
                  subscription={subscription}
                />
              ))
            ) : (
              pendingGoals.length === 0 && (
                <div className="col-span-2 text-center py-8">
                  <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-xl font-medium text-gray-700">No active goals</h3>
                  <p className="text-gray-500 mt-2">Your coach will assign goals for you to work on.</p>
                </div>
              )
            )}
          </div>
          
          {/* Show recently completed goals if there are any */}
          {completedGoals.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium flex items-center text-green-800 mb-3">
                <CheckCircle className="w-4 h-4 mr-2" />
                Recently Completed
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.slice(0, 2).map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    onComplete={() => {}} // No-op for completed goals
                    subscription={subscription}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Goal completion confirmation dialog */}
      <CompletionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmComplete}
        goal={selectedGoal}
      />
    </>
  );
};

export default GoalsSection;