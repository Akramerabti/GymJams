import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Clock, CheckCircle, X, Award, Shield, Zap, User, AlertTriangle, Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import Progress from '@/components/ui/progress';
import { toast } from 'sonner';
import TextArea from '../ui/TextArea.jsx';

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

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Rejection dialog component
const RejectionDialog = ({ isOpen, onClose, onConfirm, goalTitle }) => {
  const [reason, setReason] = useState('');
  
  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject Goal Completion</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p>
            You are about to reject the completion request for:
            <span className="font-medium block mt-1">{goalTitle}</span>
          </p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for rejection (optional)</label>
            <TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide feedback to help the client understand why the goal wasn't completed"
              className="min-h-32"
            />
          </div>
          
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div className="ml-2">
              <p className="text-amber-800 font-medium">Important</p>
              <p className="text-amber-700 text-sm">
                The client will be notified that their goal completion request was rejected and will need to resubmit when ready.
              </p>
            </div>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Confirmation dialog component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, goal }) => {
  if (!goal) return null;
  
  const difficultyConfig = GOAL_DIFFICULTY[goal.difficulty || 'medium'];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Approve Goal Completion</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p>
            You are about to approve completion for:
            <span className="font-medium block mt-1">{goal.title}</span>
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium">{goal.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{goal.target}</p>
            <p className="text-xs text-gray-500">
              Difficulty: {difficultyConfig.label}
            </p>
          </div>
          
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <div className="ml-2">
              <p className="text-blue-800 font-medium">Reward for completion</p>
              <p className="text-blue-700 text-sm">
                Approving will award the client <span className="font-semibold">{difficultyConfig.points} points</span> for completing this {difficultyConfig.label.toLowerCase()} goal.
              </p>
            </div>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirm(difficultyConfig.points)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve & Award Points
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Individual goal approval card
const PendingGoalCard = ({ client, goal, onApprove, onReject }) => {
  const difficultyConfig = GOAL_DIFFICULTY[goal.difficulty || 'medium'];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg shadow border border-amber-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="bg-amber-100 p-2 rounded-full mr-3">
            <User className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
            <p className="text-sm text-gray-500">{client.email}</p>
          </div>
        </div>
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          <Clock className="w-3 h-3 mr-1" />
          <span>Pending Approval</span>
        </Badge>
      </div>
      
      <div className="bg-amber-50 p-3 rounded-lg mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium flex items-center">
              <Target className="w-4 h-4 mr-2 text-amber-700" />
              {goal.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{goal.target}</p>
          </div>
          <Badge className={difficultyConfig.color}>
            <span className="flex items-center">
              {difficultyConfig.icon}
              <span className="ml-1">{difficultyConfig.label}</span>
            </span>
          </Badge>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Client reports</span>
            <span>{goal.progress}% complete</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          <Clock className="inline w-3 h-3 mr-1" />
          Requested: {formatDate(goal.clientCompletionRequestDate || new Date())}
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm text-amber-700">
          <Award className="w-4 h-4 mr-1" />
          <span>{difficultyConfig.points} points will be awarded</span>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onReject(client.id, goal.id, goal.title)}
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onApprove(client.id, goal.id, goal)}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Main component
const PendingGoalsSection = ({ pendingGoalApprovals, handleCompleteClientGoal, handleRejectGoalCompletion, isLoading }) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [selectedGoalTitle, setSelectedGoalTitle] = useState('');
  
  // Handle goal approval
  const handleApproveClick = (clientId, goalId, goal) => {
    setSelectedClient(clientId);
    setSelectedGoalId(goalId);
    setSelectedGoal(goal);
    setConfirmDialogOpen(true);
  };
  
  // Handle goal rejection
  const handleRejectClick = (clientId, goalId, goalTitle) => {
    setSelectedClient(clientId);
    setSelectedGoalId(goalId);
    setSelectedGoalTitle(goalTitle);
    setRejectionDialogOpen(true);
  };
  
  // Confirm goal approval
  const confirmApproval = (pointsToAward) => {
    handleCompleteClientGoal(selectedClient, selectedGoalId, pointsToAward, true);
    setConfirmDialogOpen(false);
    setSelectedClient(null);
    setSelectedGoalId(null);
    setSelectedGoal(null);
  };
  
  // Confirm goal rejection
  const confirmRejection = (reason) => {
    handleRejectGoalCompletion(selectedClient, selectedGoalId, reason);
    setRejectionDialogOpen(false);
    setSelectedClient(null);
    setSelectedGoalId(null);
    setSelectedGoalTitle('');
  };
  
  // Check if there are no pending approvals
  if (!pendingGoalApprovals || pendingGoalApprovals.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="shadow border-amber-200">
        <CardHeader className="bg-amber-50 border-b border-amber-200">
          <CardTitle className="flex items-center text-amber-800">
            <Clock className="w-5 h-5 mr-2 text-amber-600" />
            Pending Goal Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 divide-y divide-amber-100">
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-600" />
            <div className="ml-2">
              <p className="text-amber-800 text-sm">
                {pendingGoalApprovals.length} {pendingGoalApprovals.length === 1 ? 'client has' : 'clients have'} submitted goals for your approval.
              </p>
            </div>
          </Alert>
          
          <div className="space-y-4 pt-4">
            {pendingGoalApprovals.map((client) => (
              client.pendingGoals.map((goal) => (
                <PendingGoalCard
                  key={`${client.id}-${goal.id}`}
                  client={client}
                  goal={goal}
                  onApprove={handleApproveClick}
                  onReject={handleRejectClick}
                />
              ))
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmApproval}
        goal={selectedGoal}
      />
      
      <RejectionDialog
        isOpen={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        onConfirm={confirmRejection}
        goalTitle={selectedGoalTitle}
      />
    </motion.div>
  );
};

export default PendingGoalsSection;