import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Dumbbell, Activity, Calendar, ArrowRight, 
  CheckCircle, Shield, Award, Zap, 
  AlertTriangle, Coins, Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Progress from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

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
const GoalCard = ({ goal, onComplete }) => {
  const { id, title, target, progress, due, type, difficulty = 'medium', completed } = goal;
  const difficultyConfig = GOAL_DIFFICULTY[difficulty];
  const icon = goal.icon || getGoalIcon(type);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-4 rounded-lg border shadow-sm ${
        completed ? 'border-green-200 bg-green-50' : ''
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
              </div>
              <p className="text-sm text-gray-600 mb-2">{target}</p>
            </div>
            {!completed && (
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
          
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">Due: {due}</p>
            
            {!completed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onComplete(id)}
                className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Complete
              </Button>
            )}
            
            {completed && (
              <div className="flex items-center text-green-600 text-xs">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>Completed {goal.completedDate ? `on ${formatDate(goal.completedDate)}` : ''}</span>
              </div>
            )}
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
                You will earn <span className="font-semibold">{difficultyConfig.points} points</span> for completing this {difficultyConfig.label.toLowerCase()} goal.
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
            Complete Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main goals section component
const GoalsSection = ({ goals, onCompleteGoal, onViewAll }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  const handleCompleteGoal = (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setIsDialogOpen(true);
    }
  };
  
  const confirmComplete = () => {
    if (selectedGoal) {
      onCompleteGoal(selectedGoal);
      setIsDialogOpen(false);
      setSelectedGoal(null);
    }
  };
  
  // Filter active and completed goals
  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Goals</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onViewAll}
          >
            View All
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.length > 0 ? (
              activeGoals.slice(0, 4).map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onComplete={handleCompleteGoal} 
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-xl font-medium text-gray-700">No active goals</h3>
                <p className="text-gray-500 mt-2">Your coach will assign goals for you to work on.</p>
              </div>
            )}
          </div>
          
          {/* Show recently completed goals if there are any */}
          {completedGoals.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Recently Completed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.slice(0, 2).map(goal => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    onComplete={() => {}} // No-op for completed goals
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