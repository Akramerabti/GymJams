import React, { useState, useEffect, useRef } from 'react';
import { 
  Target, Dumbbell, Activity, Calendar, Edit, Plus, Save, X, AlertTriangle, 
  CheckCircle, Award, Shield, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Textarea from '@/components/ui/TextArea'; // Ensure this path is correct
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

// Goal difficulty configuration
const GOAL_DIFFICULTY = {
  easy: {
    label: 'Easy',
    points: 50,
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Shield className="w-4 h-4" />,
  },
  medium: {
    label: 'Medium',
    points: 100,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Award className="w-4 h-4" />,
  },
  hard: {
    label: 'Hard',
    points: 200,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Zap className="w-4 h-4" />,
  },
};

// Goal types configuration
const GOAL_TYPES = [
  { id: 'strength', label: 'Strength', icon: <Dumbbell className="w-4 h-4 mr-2" /> },
  { id: 'cardio', label: 'Cardio', icon: <Activity className="w-4 h-4 mr-2" /> },
  { id: 'weight', label: 'Weight', icon: <Target className="w-4 h-4 mr-2" /> },
  { id: 'consistency', label: 'Consistency', icon: <Calendar className="w-4 h-4 mr-2" /> },
  { id: 'custom', label: 'Custom', icon: <Edit className="w-4 h-4 mr-2" /> },
];

// Helper function to format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return dateString;
  }
};

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

// New goal dialog component
const AddNewGoal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  goal = null 
}) => {
  const dialogContentRef = useRef(null);
  const [formData, setFormData] = useState({
    id: goal?.id || `goal-${Date.now()}`,
    title: goal?.title || '',
    description: goal?.description || '',
    type: goal?.type || '',
    target: goal?.target || '',
    difficulty: goal?.difficulty || 'medium',
    dueDate: goal?.dueDate ? formatDateForInput(goal.dueDate) : getFutureDateString(14),
    status: goal?.status || 'active',
    progress: goal?.progress || 0,
    clientRequestedCompletion: goal?.clientRequestedCompletion || false,
    clientCompletionRequestDate: goal?.clientCompletionRequestDate || null,
    coachApproved: goal?.coachApproved || false,
    coachApprovalDate: goal?.coachApprovalDate || null,
    pointsAwarded: goal?.pointsAwarded || 0,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened, resetting form data');
      setFormData({
        id: goal?.id || `goal-${Date.now()}`,
        title: goal?.title || '',
        description: goal?.description || '',
        type: goal?.type || '',
        target: goal?.target || '',
        difficulty: goal?.difficulty || 'medium',
        dueDate: goal?.dueDate ? formatDateForInput(goal.dueDate) : getFutureDateString(14),
        status: goal?.status || 'active',
        progress: goal?.progress || 0,
        clientRequestedCompletion: goal?.clientRequestedCompletion || false,
        clientCompletionRequestDate: goal?.clientCompletionRequestDate || null,
        coachApproved: goal?.coachApproved || false,
        coachApprovalDate: goal?.coachApprovalDate || null,
        pointsAwarded: goal?.pointsAwarded || 0,
      });
      setError('');
    }
  }, [isOpen, goal]);

  const handleChange = (field, value) => {
    console.log(`Form field "${field}" changed to:`, value);
    setFormData(prevData => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault(); // Prevent default form submission behavior
      e.stopPropagation(); // Stop event from bubbling up
    }

    console.log('Form submitted');
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.title || !formData.type || !formData.target || !formData.dueDate) {
      console.log('Validation failed: Missing required fields');
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // Validate due date is not in the past
    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      console.log('Validation failed: Due date is in the past');
      setError('Due date cannot be in the past');
      setIsSubmitting(false);
      return;
    }

    // Prepare the goal object
    const newGoal = {
        ...formData,
        id: formData.id || `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        dueDate: new Date(formData.dueDate),
        due: formatDate(new Date(formData.dueDate)), // Add formatted date for display
        createdAt: goal?.createdAt || new Date().toISOString(),
        progress: parseInt(formData.progress) || 0,
        status: formData.status || 'active', // Ensure status is set
        clientRequestedCompletion: formData.clientRequestedCompletion || false,
        coachApproved: formData.coachApproved || false,
        pointsAwarded: formData.pointsAwarded || 0,
      };

    // Call the onSave function with the new goal
    console.log('Saving goal:', newGoal);
    onSave(newGoal);
    setError('');
    setIsSubmitting(false);
  };

  // Specifically handle clicking the cancel button
  const handleCancel = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Cancel button clicked');
    onClose();
  };

  // Safely handle dialog open change
  const handleOpenChange = (open) => {
    console.log('Dialog open state changed to:', open);
    if (!open && !isSubmitting) {
      console.log('Dialog closed');
      onClose();
    }
  };

  const handleContentClick = (e) => {
    console.log('Dialog content clicked');
    // Let the event bubble up if it's not inside a form control
    const target = e.target;
    const isFormElement = target.tagName === 'INPUT' || 
                           target.tagName === 'SELECT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.tagName === 'BUTTON' ||
                           target.closest('[role="combobox"]') ||
                           target.closest('[role="listbox"]');
    
    if (isFormElement) {
      console.log('Form element clicked, stopping propagation');
      e.stopPropagation();
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
    >
      <DialogContent 
        ref={dialogContentRef} 
        className="sm:max-w-[550px] z-[1000]"
        onClick={handleContentClick}
      >
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Goal Title */}
            <div className="space-y-2">
              <Label htmlFor="goal-title">Goal Title</Label>
              <Input
                id="goal-title"
                value={formData.title}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange('title', e.target.value);
                }}
                placeholder="E.g., Improve Bench Press"
              />
            </div>

            {/* Goal Description */}
            <div className="space-y-2">
              <Label htmlFor="goal-description">Description</Label>
              <Textarea
                id="goal-description"
                value={formData.description}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange('description', e.target.value);
                }}
                placeholder="Describe the goal in detail..."
                rows={3}
              />
            </div>

            {/* Goal Type */}
            <div className="space-y-2">
              <Label htmlFor="goal-type">Goal Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger id="goal-type">
                  <SelectValue placeholder="Select a goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {GOAL_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="flex items-center">
                        <div className="flex items-center">
                          {type.icon}
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Goal Target */}
            <div className="space-y-2">
              <Label htmlFor="goal-target">Specific Target</Label>
              <Input
                id="goal-target"
                value={formData.target}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange('target', e.target.value);
                }}
                placeholder="E.g., Increase bench press by 10kg"
              />
            </div>

            {/* Goal Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="goal-difficulty">Difficulty (Points Reward)</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => handleChange('difficulty', value)}
              >
                <SelectTrigger id="goal-difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(GOAL_DIFFICULTY).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="flex items-center">
                        <div className="flex items-center">
                          {config.icon}
                          <span className="ml-2">{config.label} ({config.points} points)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="goal-due-date">Due Date</Label>
              <Input
                id="goal-due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange('dueDate', e.target.value);
                }}
                min={getFutureDateString(1)} // At least tomorrow
              />
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <Label htmlFor="goal-progress">Progress (%)</Label>
              <Input
                id="goal-progress"
                type="number"
                value={formData.progress}
                onChange={(e) => {
                  e.stopPropagation();
                  handleChange('progress', e.target.value);
                }}
                min="0"
                max="100"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="goal-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger id="goal-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200 p-3">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span>{error}</span>
              </Alert>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {goal ? 'Update Goal' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewGoal;