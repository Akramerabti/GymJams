import React, { useState, useRef } from 'react';
import { 
  Target, Clock, CheckCircle, X, AlertTriangle, 
  Award, Shield, Zap, Coins, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

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

// Helper function for formatting dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Helper function to safely get goal ID from various possible fields
const getGoalId = (goal) => {
  if (!goal) return null;
  
  // Try different possible ID fields in order of preference
  if (goal.id) return goal.id;
  if (goal._id) {
    // Handle if _id is an ObjectId (toString if it's an object)
    return typeof goal._id === 'object' ? goal._id.toString() : goal._id;
  }
  
  return null;
};

const PendingGoalsSection = ({ 
  pendingGoalApprovals, 
  handleCompleteClientGoal, 
  handleRejectGoalCompletion,
  isLoading 
}) => {
  // Use refs to ensure values persist during async operations
  const goalDataRef = useRef(null);
  
  // Dialog states
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  // UI states for display in dialogs
  const [dialogGoal, setDialogGoal] = useState(null);

  // Improved handler that stores all necessary data in one place
  const handleApprovalClick = (subscriptionId, goal) => {
    // Get the goal ID safely
    const goalId = getGoalId(goal);
    
    console.log("Goal data for approval:", {
      goal,
      extractedId: goalId,
      subscriptionId
    });
    
    if (!subscriptionId || !goalId) {
      console.error("Invalid goal data:", { subscriptionId, goalId, goal });
      toast.error("Invalid goal data");
      return;
    }
    
    // Store complete data in the ref for persistence
    goalDataRef.current = {
      subscriptionId,
      goalId,
      difficulty: goal.difficulty || 'medium',
      title: goal.title
    };
    
    // Set display data for the dialog
    setDialogGoal(goal);
    setShowApprovalDialog(true);
  };

  const handleRejectClick = (subscriptionId, goal) => {
    // Get the goal ID safely
    const goalId = getGoalId(goal);
    
    console.log("Goal data for rejection:", {
      goal,
      extractedId: goalId,
      subscriptionId
    });
    
    if (!subscriptionId || !goalId) {
      console.error("Invalid goal data:", { subscriptionId, goalId, goal });
      toast.error("Invalid goal data");
      return;
    }
    
    // Store complete data in the ref for persistence
    goalDataRef.current = {
      subscriptionId,
      goalId,
      title: goal.title
    };
    
    // Set display data for the dialog
    setDialogGoal(goal);
    setShowRejectDialog(true);
  };

  const confirmApproval = () => {
    // Get data from the ref which persists regardless of component rerenders
    const data = goalDataRef.current;
    
    if (!data || !data.subscriptionId || !data.goalId) {
      console.error("Missing goal or subscription information in ref:", data);
      toast.error("Missing goal information. Please try again.");
      return;
    }

    // Get points based on difficulty
    const difficulty = data.difficulty || 'medium';
    const pointsToAward = GOAL_DIFFICULTY[difficulty]?.points || 100;

    console.log("Approving goal with data:", {
      subscriptionId: data.subscriptionId,
      goalId: data.goalId,
      pointsToAward,
      isApproval: true
    });

    // Call the handler with data from the ref
    handleCompleteClientGoal(
      data.subscriptionId,
      data.goalId,
      pointsToAward,
      true // This flag indicates it's an approval
    );
    
    // Close dialog and clean up
    setShowApprovalDialog(false);
    goalDataRef.current = null;
  };

  const confirmReject = () => {
    // Get data from the ref which persists regardless of component rerenders
    const data = goalDataRef.current;
    
    if (!data || !data.subscriptionId || !data.goalId) {
      console.error("Missing goal or subscription information in ref:", data);
      toast.error("Missing goal information. Please try again.");
      return;
    }

    console.log("Rejecting goal with data:", {
      subscriptionId: data.subscriptionId,
      goalId: data.goalId
    });

    // Call the handler with data from the ref
    handleRejectGoalCompletion(
      data.subscriptionId,
      data.goalId
    );
    
    // Close dialog and clean up
    setShowRejectDialog(false);
    goalDataRef.current = null;
  };

  // If there are no pending goals, don't render anything
  if (!pendingGoalApprovals || pendingGoalApprovals.length === 0) {
    return null;
  }
  
  // Count total pending goals
  const totalPendingGoals = pendingGoalApprovals.reduce(
    (count, client) => count + (client.pendingGoals?.length || 0), 0
  );

  return (
    <div className="mb-8">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800">Pending Goal Approvals</h3>
            <p className="text-amber-700 mt-1 text-sm">
              You have {totalPendingGoals} pending goal completion {totalPendingGoals === 1 ? 'request' : 'requests'} from your clients.
            </p>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {pendingGoalApprovals.map((client) => (
          <AccordionItem 
            key={client.id} 
            value={client.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
                  <p className="text-sm text-gray-500">
                    {client.pendingGoals?.length || 0} pending goal{client.pendingGoals?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 mt-2">
                {client.pendingGoals && client.pendingGoals.map((goal, index) => (
                  <div 
                    key={getGoalId(goal) || index} 
                    className="border border-amber-200 bg-amber-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium">{goal.title}</h4>
                          {goal.difficulty && (
                            <Badge className={`ml-2 ${GOAL_DIFFICULTY[goal.difficulty]?.color || 'bg-gray-100 text-gray-800'}`}>
                              {GOAL_DIFFICULTY[goal.difficulty]?.icon}
                              <span className="ml-1">{GOAL_DIFFICULTY[goal.difficulty]?.label || goal.difficulty}</span>
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{goal.target || goal.description}</p>
                        <div className="mt-2 text-xs text-amber-700 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span>
                            Requested: {formatDate(goal.clientCompletionRequestDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleRejectClick(client.id, goal)}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprovalClick(client.id, goal)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Approval Dialog */}
      <Dialog 
        open={showApprovalDialog} 
        onOpenChange={(open) => {
          setShowApprovalDialog(open);
          if (!open) goalDataRef.current = null; // Clean up ref when dialog is closed
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve Goal Completion</DialogTitle>
            <DialogDescription>
              This will mark the goal as completed and award points to the client.
            </DialogDescription>
          </DialogHeader>
          
          {dialogGoal && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium">{dialogGoal.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{dialogGoal.target || dialogGoal.description}</p>
                <div className="mt-3 flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {GOAL_DIFFICULTY[dialogGoal.difficulty]?.icon || <Award className="w-4 h-4 text-blue-600" />}
                      <span className="ml-1 text-sm">
                        {GOAL_DIFFICULTY[dialogGoal.difficulty]?.label || 'Medium'} Difficulty
                      </span>
                    </div>
                  </div>
                  <div className="text-green-600 font-medium text-sm flex items-center">
                    <Coins className="w-4 h-4 mr-1" />
                    {GOAL_DIFFICULTY[dialogGoal.difficulty]?.points || 100} points
                  </div>
                </div>
              </div>
              
              <div className="flex items-start bg-blue-50 p-3 rounded-md">
                <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p>
                    Client will receive <span className="font-bold">{GOAL_DIFFICULTY[dialogGoal.difficulty]?.points || 100} points</span> for completing this {GOAL_DIFFICULTY[dialogGoal.difficulty]?.label?.toLowerCase() || 'medium'} difficulty goal.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowApprovalDialog(false);
                goalDataRef.current = null; // Clean up ref
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={confirmApproval}
              disabled={isLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Approve Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog 
        open={showRejectDialog} 
        onOpenChange={(open) => {
          setShowRejectDialog(open);
          if (!open) goalDataRef.current = null; // Clean up ref when dialog is closed
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Goal Completion</DialogTitle>
            <DialogDescription>
              The client will be notified that they need to make more progress on this goal.
            </DialogDescription>
          </DialogHeader>
          
          {dialogGoal && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium">{dialogGoal.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{dialogGoal.target || dialogGoal.description}</p>
              </div>
              
              <div className="flex items-start bg-amber-50 p-3 rounded-md">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p>
                    This will reset the goal status and notify the client that they need to make more progress before requesting completion again.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                goalDataRef.current = null; // Clean up ref
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmReject}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Reject Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingGoalsSection;