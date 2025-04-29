import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileEdit, Clock, CheckCircle, X, Calendar, MessageSquare, 
  User, ChevronDown, ChevronUp, Info, AlertTriangle 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TextArea } from '@/components/ui/textArea';
import { toast } from 'sonner';

const PlanUpdateRequests = ({ clients, onRefreshData }) => {
  const [planRequests, setPlanRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState({});

  // Filter clients to find those with plan update requests
  useEffect(() => {
    if (!clients || !Array.isArray(clients)) {
      setPlanRequests([]);
      setIsLoading(false);
      return;
    }

  }, [clients]);

  const toggleExpand = (requestId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const handleRespondToRequest = (request) => {
    setSelectedRequest(request);
    setResponseMessage('');
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setPlanRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'completed', responseDate: new Date().toISOString() } 
            : req
        )
      );
      
      toast.success('Plan update request approved successfully!');
      setSelectedRequest(null);
      
      // Refresh parent data
      if (onRefreshData) onRefreshData();
      
    } catch (error) {
      console.error('Error approving plan request:', error);
      toast.error('Failed to approve plan update request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest || !responseMessage.trim()) {
      toast.error('Please provide a response message explaining why the request is declined');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setPlanRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { 
                ...req, 
                status: 'declined', 
                responseDate: new Date().toISOString(),
                responseMessage 
              } 
            : req
        )
      );
      
      toast.success('Response sent to client');
      setSelectedRequest(null);
      setResponseMessage('');
      
      // Refresh parent data
      if (onRefreshData) onRefreshData();
      
    } catch (error) {
      console.error('Error declining plan request:', error);
      toast.error('Failed to send response');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to format date in a friendly way
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      
      // Calculate time difference in days
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Get subscription badge component
  const getSubscriptionBadge = (type) => {
    const config = {
      basic: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      premium: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      elite: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' }
    };
    
    const style = config[type?.toLowerCase()] || config.basic;
    
    return (
      <Badge className={`${style.bg} ${style.text} ${style.border}`}>
        {type || 'Basic'}
      </Badge>
    );
  };

  // Group requests by date (today, yesterday, older)
  const groupedRequests = planRequests.reduce((groups, request) => {
    const date = new Date(request.requestDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now - 86400000).toDateString();
    
    const key = isToday ? 'today' : isYesterday ? 'yesterday' : 'older';
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    groups[key].push(request);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Plan Update Requests</h2>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {planRequests.filter(r => r.status === 'pending').length} pending
          </Badge>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : planRequests.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <FileEdit className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No plan update requests</h3>
          <p className="text-gray-500">
            When clients request changes to their plans, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's requests */}
          {groupedRequests.today && groupedRequests.today.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Today</h3>
              {groupedRequests.today.map((request) => (
                <RequestCard 
                  key={request.id}
                  request={request}
                  isExpanded={expandedRequests[request.id]}
                  onToggleExpand={() => toggleExpand(request.id)}
                  onRespond={() => handleRespondToRequest(request)}
                  getSubscriptionBadge={getSubscriptionBadge}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
          
          {/* Yesterday's requests */}
          {groupedRequests.yesterday && groupedRequests.yesterday.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Yesterday</h3>
              {groupedRequests.yesterday.map((request) => (
                <RequestCard 
                  key={request.id}
                  request={request}
                  isExpanded={expandedRequests[request.id]}
                  onToggleExpand={() => toggleExpand(request.id)}
                  onRespond={() => handleRespondToRequest(request)}
                  getSubscriptionBadge={getSubscriptionBadge}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
          
          {/* Older requests */}
          {groupedRequests.older && groupedRequests.older.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Older</h3>
              {groupedRequests.older.map((request) => (
                <RequestCard 
                  key={request.id}
                  request={request}
                  isExpanded={expandedRequests[request.id]}
                  onToggleExpand={() => toggleExpand(request.id)}
                  onRespond={() => handleRespondToRequest(request)}
                  getSubscriptionBadge={getSubscriptionBadge}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Response Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Respond to Plan Update Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{selectedRequest.clientName}</span>
                  {getSubscriptionBadge(selectedRequest.subscriptionType)}
                </div>
                <p className="text-gray-700">{selectedRequest.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Requested: {formatDate(selectedRequest.requestDate)}
                </p>
              </div>
              
              <div className="space-y-4">
                <TextArea
                  placeholder="Write your response here..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                />
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-700">
                      Approving without a message will notify the client their plan will be updated.
                      Declining requires an explanation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedRequest(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDecline}
              disabled={isSubmitting || !responseMessage.trim()}
            >
              <X className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Decline'}
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Individual request card component
const RequestCard = ({ 
  request, 
  isExpanded, 
  onToggleExpand, 
  onRespond,
  getSubscriptionBadge,
  formatDate
}) => {
  const isCompleted = request.status === 'completed';
  const isDeclined = request.status === 'declined';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border rounded-lg hover:shadow-sm transition-shadow ${
        isCompleted 
          ? 'bg-green-50 border-green-200' 
          : isDeclined 
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full mt-1 ${
            isCompleted 
              ? 'bg-green-100' 
              : isDeclined 
                ? 'bg-red-100'
                : 'bg-blue-100'
          }`}>
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : isDeclined ? (
              <X className="w-5 h-5 text-red-600" />
            ) : (
              <FileEdit className="w-5 h-5 text-blue-600" />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{request.clientName}</h4>
              {getSubscriptionBadge(request.subscriptionType)}
              {!isCompleted && !isDeclined && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
              {isDeclined && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <X className="w-3 h-3 mr-1" />
                  Declined
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(request.requestDate)}
            </p>
            
            <div className={`mt-2 overflow-hidden transition-all duration-300 ${
              isExpanded ? 'max-h-96' : 'max-h-12'
            }`}>
              <p className={`${isExpanded ? '' : 'line-clamp-2'} ${
                isCompleted 
                  ? 'text-green-800' 
                  : isDeclined 
                    ? 'text-red-800'
                    : 'text-gray-700'
              }`}>
                {request.content}
              </p>
              
              {isDeclined && request.responseMessage && isExpanded && (
                <div className="mt-3 border-t border-red-200 pt-2">
                  <p className="text-sm font-medium text-red-700">Response:</p>
                  <p className="text-sm text-red-800">{request.responseMessage}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={onToggleExpand}
              className={`text-xs flex items-center mt-1 ${
                isCompleted 
                  ? 'text-green-600' 
                  : isDeclined 
                    ? 'text-red-600'
                    : 'text-blue-600'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" /> Show more
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isCompleted && !isDeclined && (
            <Button
              size="sm"
              onClick={onRespond}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Respond
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = `/dashboard/clients/${request.clientId}`}
            className={`${
              isCompleted 
                ? 'text-green-600 border-green-200 hover:bg-green-50' 
                : isDeclined 
                  ? 'text-red-600 border-red-200 hover:bg-red-50'
                  : 'text-blue-600 border-blue-200 hover:bg-blue-50'
            }`}
          >
            <User className="w-4 h-4 mr-1" />
            View Client
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanUpdateRequests;