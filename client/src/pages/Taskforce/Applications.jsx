// client/src/pages/Taskforce/Applications.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import applicationService from '../../services/application.service';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, RefreshCw, Filter, FileDown, Eye, CheckCircle, XCircle, 
  File, Link2, Calendar, Clock, Loader2, User, Briefcase, 
  Mail, Phone, MessageSquare, Download
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import TextArea from "@/components/ui/TextArea";
import { ScrollArea } from "@/components/ui/scroll-area";

const ApplicationDetails = ({ application, onApprove, onReject, onClose, isProcessing }) => {
  const [feedback, setFeedback] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const getApplicationTypeLabel = (type) => {
    switch (type) {
      case 'coach':
        return 'Fitness Coach';
      case 'affiliate':
        return 'Affiliate Partner';
      case 'taskforce':
        return 'Taskforce Member';
      case 'general':
        return 'General Employment';
      case 'support':
        return 'Support Request';
      default:
        return type;
    }
  };
  
  return (
    <ScrollArea className="h-[80vh] pr-4">
      <div className="space-y-6">
        {/* Header with status */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              {application.name}
            </h3>
            <p className="text-gray-500">{application.email}</p>
          </div>
          <div className="flex flex-col items-end">
            {getStatusBadge(application.status)}
            <span className="text-sm text-gray-500 mt-1">
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              {formatDate(application.createdAt)}
            </span>
          </div>
        </div>
        
        {/* Application details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Application Type:</span>
              <span className="text-sm">{getApplicationTypeLabel(application.applicationType)}</span>
            </div>
            
            {application.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{application.phone}</span>
              </div>
            )}
            
            {application.portfolioUrl && (
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Portfolio/LinkedIn:</span>
                <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
                  {application.portfolioUrl}
                </a>
              </div>
            )}
            
            {application.resume && (
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Resume:</span>
                <a href={`${import.meta.env.VITE_API_URL}/${application.resume}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline flex items-center">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download
                </a>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Applied:</span>
              <span className="text-sm">{formatDate(application.createdAt)}</span>
            </div>
            
            {application.reviewedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Reviewed:</span>
                <span className="text-sm">{formatDate(application.reviewedAt)}</span>
              </div>
            )}
            
            {application.reviewedBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Reviewed By:</span>
                <span className="text-sm">{application.reviewedBy.firstName} {application.reviewedBy.lastName}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Message content */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            Message
          </h4>
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
            {application.message}
          </div>
        </div>
        
        {/* Feedback if already reviewed */}
        {application.feedback && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              Feedback
            </h4>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {application.feedback}
            </div>
          </div>
        )}
        
        {/* Action buttons for pending applications */}
        {application.status === 'pending' && (
          <div className="space-y-4">
            <h4 className="font-medium">Review Application</h4>
            <TextArea
              placeholder="Add feedback or notes about this application..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
            />
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRejectConfirm(true)}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              
              <Button 
                onClick={() => onApprove(application._id, feedback)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
            </div>
            
            {/* Rejection confirmation */}
            <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reject this application? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      setShowRejectConfirm(false);
                      onReject(application._id, feedback);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Rejection'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  const getUserRole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = [...applications];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(app => 
        app.name.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        app.message.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(app => app.status === statusFilter);
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(app => app.applicationType === typeFilter);
    }
    
    setFilteredApplications(result);
  }, [applications, searchTerm, statusFilter, typeFilter]);

  const fetchApplications = async () => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await applicationService.getApplications();
      
      const apps = response.data || [];
      setApplications(apps);
      setFilteredApplications(apps);
      
      // Calculate stats
      const stats = {
        pending: apps.filter(app => app.status === 'pending').length,
        approved: apps.filter(app => app.status === 'approved').length,
        rejected: apps.filter(app => app.status === 'rejected').length,
        total: apps.length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetails(true);
  };

  const handleApproveApplication = async (id, feedback) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can approve applications.');
      return;
    }
    
    try {
      setIsProcessing(true);
      const response = await applicationService.updateApplicationStatus(id, 'approved', feedback);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => app._id === id ? { ...app, status: 'approved', feedback, reviewedAt: new Date(), reviewedBy: user } : app)
      );
      
      setShowDetails(false);
      toast.success('Application approved successfully');
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectApplication = async (id, feedback) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can reject applications.');
      return;
    }
    
    try {
      setIsProcessing(true);
      const response = await applicationService.updateApplicationStatus(id, 'rejected', feedback);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => app._id === id ? { ...app, status: 'rejected', feedback, reviewedAt: new Date(), reviewedBy: user } : app)
      );
      
      setShowDetails(false);
      toast.success('Application rejected successfully');
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportApplicationsCSV = () => {
    // Generate CSV content
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Status', 'Date Applied', 'Message'];
    const csvContent = [
      headers.join(','),
      ...filteredApplications.map(app => [
        `"${app.name.replace(/"/g, '""')}"`,
        `"${app.email.replace(/"/g, '""')}"`,
        app.phone ? `"${app.phone.replace(/"/g, '""')}"` : '',
        app.applicationType,
        app.status,
        new Date(app.createdAt).toLocaleDateString(),
        `"${app.message.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      ].join(','))
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `applications-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getApplicationTypeLabel = (type) => {
    switch (type) {
      case 'coach':
        return 'Fitness Coach';
      case 'affiliate':
        return 'Affiliate Partner';
      case 'taskforce':
        return 'Taskforce Member';
      case 'general':
        return 'General Employment';
      case 'support':
        return 'Support Request';
      default:
        return type;
    }
  };

  if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 text-center max-w-md">
              You don't have permission to view this page. Only Taskforce members and administrators can access the applications dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Applications</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Manage and review incoming applications</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchApplications}
            variant="outline"
            className="gap-2"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            onClick={exportApplicationsCSV}
            variant="outline" 
            className="gap-2"
            size="sm"
            disabled={filteredApplications.length === 0}
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500">Total Applications</span>
            <span className="text-2xl font-bold">{stats.total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500">Pending</span>
            <span className="text-2xl font-bold text-yellow-500">{stats.pending}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500">Approved</span>
            <span className="text-2xl font-bold text-green-600">{stats.approved}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500">Rejected</span>
            <span className="text-2xl font-bold text-red-600">{stats.rejected}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Review and manage all applications submitted through the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="md:w-1/3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-1 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="coach">Fitness Coach</SelectItem>
                  <SelectItem value="affiliate">Affiliate Partner</SelectItem>
                  <SelectItem value="taskforce">Taskforce Member</SelectItem>
                  <SelectItem value="general">General Employment</SelectItem>
                  <SelectItem value="support">Support Request</SelectItem>
                </SelectContent>
              </Select>
              
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="px-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Applications Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <File className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {applications.length > 0 
                  ? 'Try adjusting your filters to see more results.' 
                  : 'There are no applications submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application._id} className={application.status === 'pending' ? 'bg-yellow-50 text-black' : ' text-black'}>
                      <TableCell className="font-medium text-black">
                        <div>{application.name}</div>
                        <div className="text-sm text-black">{application.email}</div>
                      </TableCell>
                      <TableCell>{getApplicationTypeLabel(application.applicationType)}</TableCell>
                      <TableCell>{formatDate(application.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={showDetails && selectedApplication?._id === application._id} onOpenChange={setShowDetails}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(application)}
                              className="bg-blue-400 "
                            >
                              <Eye className="h-4 w-4 mr-1 " />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] z-50">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                Application from {application.name} for {getApplicationTypeLabel(application.applicationType)}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedApplication && (
                              <ApplicationDetails
                                application={selectedApplication}
                                onApprove={handleApproveApplication}
                                onReject={handleRejectApplication}
                                onClose={() => setShowDetails(false)}
                                isProcessing={isProcessing}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Applications;