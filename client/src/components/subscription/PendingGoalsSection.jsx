import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, CheckCircle, X, Award, Clock, Shield, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const GoalApprovalItem = ({ client, goal, onApprove, onReject, isLoading }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  // Get difficulty config for this goal
  const difficultyConfig = GOAL_DIFFICULTY[goal.difficulty || 'medium'];
  const pointsToAward = difficultyConfig.points;
  
  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await onApprove(client.id, goal.id, pointsToAward, true);
    } catch (error) {
      console.error('Error approving goal:', error);
      toast.error('Failed to approve goal');
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async () => {
    try {
      setIsRejecting(true);
      await onReject(client.id, goal.id);
    } catch (error) {
      console.error('Error rejecting goal:', error);
      toast.error('Failed to reject goal');
    } finally {
      setIsRejecting(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="border-amber-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center">
                  <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
                  <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                    <Clock className="w-3 h-3 mr-1" /> 
                    Pending
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  Requested: {formatDate(goal.clientCompletionRequestDate || new Date())}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">{goal.title}</h4>
              <Badge className={difficultyConfig.color}>
                <span className="flex items-center">
                  {difficultyConfig.icon}
                  <span className="ml-1">{difficultyConfig.label}</span>
                </span>
              </Badge>
            </div>
            <p className="text-gray-700 mb-2">{goal.target}</p>
            <p className="text-sm text-gray-600">
              Due: {formatDate(goal.dueDate)}
            </p>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              <Award className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="font-medium">{pointsToAward} points will be awarded</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                disabled={isLoading || isApproving || isRejecting}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {isRejecting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Rejecting...
                  </span>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isLoading || isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Approving...
                  </span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve + Award Points
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PendingGoalsSection = ({ 
    pendingGoalApprovals, 
    handleCompleteClientGoal, 
    handleRejectGoalCompletion, 
    isLoading 
  }) => {
    if (pendingGoalApprovals.length === 0) return null;
  
    // Flatten goals for easy counting
    const totalPendingGoals = pendingGoalApprovals.reduce((total, client) => {
      const pendingGoals = (client.goals || []).filter(
        goal => goal.status === 'pending_approval' || goal.clientRequestedCompletion
      );
      return total + pendingGoals.length;
    }, 0);
  
    return (
      <Card className="shadow-lg mb-6">
        <CardHeader className="bg-amber-50 border-b border-amber-200">
          <CardTitle className="flex items-center text-amber-800">
            <Clock className="w-5 h-5 mr-2 text-amber-600" />
            Pending Goal Approvals ({totalPendingGoals})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {pendingGoalApprovals.map((client) => {
              const pendingGoals = (client.goals || []).filter(
                goal => goal.status === 'pending_approval' || goal.clientRequestedCompletion
              );
              
              return pendingGoals.map((goal) => (
                <GoalApprovalItem
                  key={`${client.id}-${goal.id}`}
                  client={client}
                  goal={goal}
                  onApprove={handleCompleteClientGoal}
                  onReject={handleRejectGoalCompletion}
                  isLoading={isLoading}
                />
              ));
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

export default PendingGoalsSection;