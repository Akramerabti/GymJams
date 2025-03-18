import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Dumbbell, Activity, Calendar, Edit, ArrowRight, Plus, Save, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Individual goal card component
const GoalCard = ({ goal, onEdit }) => {
  const { id, title, target, progress, due, icon: Icon } = goal;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg border shadow-sm"
    >
      <div className="flex items-start space-x-4">
        <div className="bg-blue-50 p-2 rounded-full">
          {Icon || <Target className="w-6 h-6 text-blue-600" />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold">{title}</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-8 h-8 p-0" 
              onClick={() => onEdit(goal)}
            >
              <Edit className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-2">{target}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Due: {due}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Goal edit dialog component
const GoalEditDialog = ({ goal, isOpen, onClose, onSave }) => {
  const [editedGoal, setEditedGoal] = useState(goal);
  
  const handleProgressChange = (value) => {
    setEditedGoal({
      ...editedGoal,
      progress: value[0]
    });
  };
  
  const handleSave = () => {
    onSave(editedGoal);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Goal Progress</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-title">Goal</Label>
              <p id="goal-title" className="font-medium text-gray-900">{editedGoal.title}</p>
            </div>
            
            <div>
              <Label htmlFor="goal-target">Target</Label>
              <p id="goal-target" className="text-gray-700">{editedGoal.target}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goal-progress">Progress ({editedGoal.progress}%)</Label>
              <Slider
                id="goal-progress"
                value={[editedGoal.progress]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleProgressChange}
              />
            </div>
            
            <div>
              <Label htmlFor="goal-due">Due Date</Label>
              <p id="goal-due" className="text-gray-700">{editedGoal.due}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main goals section component
const GoalsSection = ({ goals, onUpdateGoal, onViewAll }) => {
  const [editingGoal, setEditingGoal] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(null);
  };
  
  const handleSaveGoal = (updatedGoal) => {
    onUpdateGoal(updatedGoal);
  };
  
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
            {goals.length > 0 ? (
              goals.slice(0, 4).map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onEdit={handleEditGoal} 
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-xl font-medium text-gray-700">No goals set</h3>
                <p className="text-gray-500 mt-2">Your fitness goals will appear here once created.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      {editingGoal && (
        <GoalEditDialog
          goal={editingGoal}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveGoal}
        />
      )}
    </>
  );
};

export default GoalsSection;