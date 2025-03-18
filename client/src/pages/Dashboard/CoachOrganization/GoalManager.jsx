import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Dumbbell, Activity, Calendar, Edit, Plus, Save, X, AlertTriangle, 
  CheckCircle, Award, Shield, Zap, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Textarea from '@/components/ui/TextArea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import AddNewGoal from '../../../components/subscription/AddNewGoal';

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
  { id: 'custom', label: 'Custom', icon: <Edit className="w-4 h-4 mr-2" /> },
];

// Helper function to format date for input field
const formatDateForInput = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
};

// Helper function to get today's date plus N days
const getFutureDateString = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return formatDateForInput(date);
};

// Helper function to get icon based on goal type
const getGoalIcon = (type) => {
  const goalType = GOAL_TYPES.find(t => t.id === type);
  return goalType ? goalType.icon : <Target className="w-4 h-4 mr-2" />;
};


// Individual goal card component
const GoalCard = ({ goal, onEdit, onDelete, onMarkComplete }) => {
  const difficulty = goal.difficulty || 'medium';
  const difficultyConfig = GOAL_DIFFICULTY[difficulty];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border p-4 shadow-sm"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            {getGoalIcon(goal.type)}
          </div>
          <div>
            <div className="flex items-center mb-1">
              <h3 className="font-medium text-lg mr-2">{goal.title}</h3>
              <Badge className={difficultyConfig.color}>
                <span className="flex items-center">
                  {difficultyConfig.icon}
                  <span className="ml-1">{difficultyConfig.label}</span>
                </span>
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">{goal.target}</p>
            <p className="text-xs text-gray-500">Due: {goal.due}</p>
            {goal.completed && (
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" /> Completed on {goal.completedDate}
              </p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-1">
          {!goal.completed && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(goal)}
                className="h-8 w-8 p-0 text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 p-0 text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {!goal.completed && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Completion will award client {difficultyConfig.points} points
            </p>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onMarkComplete(goal.id)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Confirmation dialog component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[100]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p>{message}</p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PendingApprovalsSection = ({ pendingGoals, onApprove, onReject }) => {
    if (!pendingGoals || pendingGoals.length === 0) return null;
    
    return (
      <div className="mt-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold">Pending Goal Approvals</h3>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <Alert variant="warning" className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <p>The following goals are awaiting your approval. Please review the client's progress before approving.</p>
          </Alert>
          
          <div className="space-y-4">
            {pendingGoals.map(goal => (
              <div key={goal.id} className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getGoalIcon(goal.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{goal.title}</h4>
                      <p className="text-sm text-gray-600 mb-1">{goal.target}</p>
                      <p className="text-xs text-gray-500">
                        Requested: {formatDate(goal.clientCompletionRequestDate || new Date())}
                      </p>
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Client reports:</span>
                          <span>{goal.progress}% complete</span>
                        </div>
                        <Progress value={goal.progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="text-sm">
                    <span className="font-medium text-amber-700">
                      Approve to award {GOAL_DIFFICULTY[goal.difficulty || 'medium'].points} points
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      onClick={() => onReject(goal.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(goal.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

// Main goals component for coach
const GoalManager = ({ 
  client, 
  goals, 
  onAddGoal, 
  onUpdateGoal, 
  onDeleteGoal, 
  onCompleteGoal,
  onAwardPoints   
}) => {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [goalToComplete, setGoalToComplete] = useState(null);

  const activeGoals = goals.filter(goal => !goal.completed && goal.status !== 'pending_approval' && !goal.clientRequestedCompletion);
  const pendingGoals = goals.filter(goal => goal.status === 'pending_approval' || goal.clientRequestedCompletion);
  const completedGoals = goals.filter(goal => goal.completed || goal.status === 'completed');
  
  // Weekly goal limit check
  const currentWeekGoals = goals.filter(goal => {
    if (goal.completed) return false;
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    const goalDate = new Date(goal.createdAt || goal.addedAt || new Date());
    return goalDate >= startOfWeek && goalDate <= endOfWeek;
  });
  
  const weeklyLimitReached = currentWeekGoals.length >= 2;
  
  // Handle add goal
  const handleAddGoal = () => {
    if (weeklyLimitReached) {
      return;
    }
    
    setSelectedGoal(null);
    setIsAddGoalOpen(true);
  };
  
  // Handle edit goal
  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setIsEditGoalOpen(true);
  };
  
  // Handle delete goal
  const handleDeleteGoal = (goalId) => {
    setGoalToDelete(goalId);
    setIsDeleteConfirmOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    onDeleteGoal(goalToDelete);
    setIsDeleteConfirmOpen(false);
    setGoalToDelete(null);
  };
  
  // Handle mark goal as complete
  const handleMarkComplete = (goalId) => {
    setGoalToComplete(goalId);
    setIsCompleteConfirmOpen(true);
  };
  
  // Handle confirm completion
  const handleConfirmComplete = () => {
    onCompleteGoal(goalToComplete);
    setIsCompleteConfirmOpen(false);
    setGoalToComplete(null);
  };
  
  // Handle save goal
  const handleSaveGoal = (goal) => {
    if (selectedGoal) {
      onUpdateGoal(goal);
      setIsEditGoalOpen(false);
    } else {
      const newGoal = {
        ...goal,
        addedAt: new Date().toISOString(),
      };
      onAddGoal(newGoal);
      setIsAddGoalOpen(false);
    }
    setSelectedGoal(null);
  };

  const handleApproveGoal = async (goalId) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      
      // Calculate points to award
      const difficulty = goal.difficulty || 'medium';
      const pointsToAward = GOAL_DIFFICULTY[difficulty].points;
      
      // Call parent component method to approve goal and award points
      await onCompleteGoal(goalId, pointsToAward, true);
      
      toast.success(`Goal approved! Client awarded ${pointsToAward} points.`);
    } catch (error) {
      console.error('Error approving goal:', error);
      toast.error('Failed to approve goal');
    }
  };
  
  // Handle goal rejection
  const handleRejectGoal = async (goalId) => {
    try {
      const updatedGoal = goals.find(g => g.id === goalId);
      if (!updatedGoal) return;
      
      // Reset goal status
      updatedGoal.status = 'active';
      updatedGoal.clientRequestedCompletion = false;
      updatedGoal.clientCompletionRequestDate = null;
      
      await onUpdateGoal(updatedGoal);
      
      toast.success('Goal completion request rejected');
    } catch (error) {
      console.error('Error rejecting goal:', error);
      toast.error('Failed to reject goal');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Client Goals</h2>
        
        <div className="flex items-center space-x-2">
          {weeklyLimitReached && (
            <p className="text-amber-600 text-sm mr-2">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Weekly limit of 2 goals reached
            </p>
          )}
          
          <Button
            onClick={handleAddGoal}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={weeklyLimitReached}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </div>
      
      {/* Pending Approvals Section */}
      {pendingGoals.length > 0 && (
        <PendingApprovalsSection 
          pendingGoals={pendingGoals}
          onApprove={handleApproveGoal}
          onReject={handleRejectGoal}
        />
      )}

      {/* Active Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Goals</h3>
        
        {activeGoals.length > 0 ? (
          <div className="space-y-4">
            {activeGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onMarkComplete={handleMarkComplete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-xl font-medium text-gray-700">No active goals</h3>
            <p className="text-gray-500 mt-2">
              Add goals for {client.firstName} to work towards
            </p>
          </div>
        )}
      </div>
      
      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Completed Goals</h3>
          
          <div className="space-y-4">
            {completedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => {}} // No editing for completed goals
                onDelete={() => {}} // No deleting for completed goals
                onMarkComplete={() => {}} // No marking for completed goals
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Add Goal Dialog */}
      <AddNewGoal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onSave={handleSaveGoal}
      />
      
      {/* Edit Goal Dialog */}
      <AddNewGoal
        isOpen={isEditGoalOpen}
        onClose={() => setIsEditGoalOpen(false)}
        onSave={handleSaveGoal}
        goal={selectedGoal}
      />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this goal? This action cannot be undone."
      />
      
      {/* Complete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCompleteConfirmOpen}
        onClose={() => setIsCompleteConfirmOpen(false)}
        onConfirm={handleConfirmComplete}
        title="Confirm Completion"
        message={
          goalToComplete && 
          `Are you sure you want to mark this goal as complete? This will award the client ${
            GOAL_DIFFICULTY[goals.find(g => g.id === goalToComplete)?.difficulty || 'medium'].points
          } points.`
        }
      />
    </div>
  );
};

export default GoalManager;