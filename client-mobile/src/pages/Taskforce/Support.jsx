// client/src/pages/Taskforce/Support.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/TextArea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Inbox,
  Send,
  Clock,
  User,
  Mail,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Loader2,
  Calendar,
  MessageSquare
} from 'lucide-react';

// Import the support ticket service
import supportTicketService from '../../services/supportTicket.service';

const Support = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    ticketsByStatus: { open: 0, 'in-progress': 0, resolved: 0, closed: 0 },
    totalTickets: 0,
    avgResponseTime: 0
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [responseContent, setResponseContent] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewTicketDialogOpen, setViewTicketDialogOpen] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ticketsPerPage, setTicketsPerPage] = useState(10);
  
  // Active view
  const [activeTab, setActiveTab] = useState('all');

  const userRole = user?.role || user?.user.role;

  // Fetch tickets and stats on component mount
  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, []);
  
  // Fetch tickets when filters change
  useEffect(() => {
    fetchTickets();
  }, [searchTerm, statusFilter, priorityFilter, currentPage, ticketsPerPage, activeTab]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Determine status filter based on active tab
      let statusParam = statusFilter;
      if (activeTab === 'open') {
        statusParam = 'open';
      } else if (activeTab === 'in-progress') {
        statusParam = 'in-progress';
      } else if (activeTab === 'resolved') {
        statusParam = 'resolved';
      } else if (activeTab === 'closed') {
        statusParam = 'closed';
      }
      
      const response = await supportTicketService.getSupportTickets({
        search: searchTerm,
        status: statusParam,
        priority: priorityFilter,
        page: currentPage,
        limit: ticketsPerPage
      });
      
      setTickets(response.tickets);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      toast.error('Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await supportTicketService.getSupportTicketStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching support ticket stats:', error);
      toast.error('Failed to fetch support ticket statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await supportTicketService.getSupportTicketById(ticketId);
      setSelectedTicket(response);
      setTicketStatus(response.status);
      setViewTicketDialogOpen(true);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast.error('Failed to fetch ticket details');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await supportTicketService.updateSupportTicket(ticketId, { status: newStatus });
      
      // Update local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
      
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      
      toast.success(`Ticket status updated to ${newStatus}`);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseContent.trim()) {
      toast.error('Please enter a response message');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await supportTicketService.addResponseToTicket(selectedTicket._id, {
        content: responseContent,
        status: ticketStatus
      });
      
      toast.success('Response sent successfully');
      
      // Update ticket in the list
      fetchTickets();
      
      // Update stats
      fetchStats();
      
      // Clear response field and close dialog
      setResponseContent('');
      setViewTicketDialogOpen(false);
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignToMe = async (ticketId) => {
    try {
      await supportTicketService.updateSupportTicket(ticketId, { assignedTo: user._id });
      
      toast.success('Ticket assigned to you');
      fetchTickets(); // Refresh tickets list
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <Badge className="bg-blue-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-gray-500">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-gray-500">Low</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'urgent':
        return <Badge className="bg-red-500">Urgent</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  // If the user doesn't have taskforce access, show access denied
  if (!user || !['taskforce', 'admin'].includes(userRole)) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 text-center max-w-md">
              You don't have permission to view this page. Only Taskforce members and administrators can access the support dashboard.
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
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Manage and respond to customer support requests</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => {
              fetchTickets();
              fetchStats();
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-blue-700">Open</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-blue-700">{stats.ticketsByStatus.open || 0}</p>
              )}
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Inbox className="h-6 w-6 text-blue-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-yellow-700">In Progress</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-yellow-700">{stats.ticketsByStatus['in-progress'] || 0}</p>
              )}
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="h-6 w-6 text-yellow-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-green-700">Resolved</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-green-700">{stats.ticketsByStatus.resolved || 0}</p>
              )}
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-purple-700">Avg. Response</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-purple-700">
                  {stats.avgResponseTime ? `${Math.round(stats.avgResponseTime)}h` : 'N/A'}
                </p>
              )}
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <Send className="h-6 w-6 text-purple-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          
          {activeTab === 'all' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderTicketList()}
        </TabsContent>
        
        <TabsContent value="open" className="mt-4">
          {renderTicketList()}
        </TabsContent>
        
        <TabsContent value="in-progress" className="mt-4">
          {renderTicketList()}
        </TabsContent>
        
        <TabsContent value="resolved" className="mt-4">
          {renderTicketList()}
        </TabsContent>
        
        <TabsContent value="closed" className="mt-4">
          {renderTicketList()}
        </TabsContent>
      </Tabs>      {/* Ticket Detail Dialog */}
      <Dialog open={viewTicketDialogOpen} onOpenChange={setViewTicketDialogOpen}>        <DialogContent 
          className="max-w-4xl h-[80vh] flex flex-col bg-white border shadow-2xl text-black"
          style={{ zIndex: 9999, position: 'fixed' }}
        >
          <DialogHeader>
            <DialogTitle className="text-black">Support Ticket #{selectedTicket?._id}</DialogTitle>
            <DialogDescription>
              {selectedTicket && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                  <span className="text-sm text-black">
                    Created: {formatTimestamp(selectedTicket.createdAt)}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-black">{selectedTicket.subject}</h3>
                  <div className="flex items-center text-sm text-black">
                    <User className="h-4 w-4 mr-1" />
                    <span>From: {selectedTicket.userName || selectedTicket.userEmail}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select 
                    value={ticketStatus} 
                    onValueChange={setTicketStatus}
                  >
                    <SelectTrigger className="w-[150px] text-black">
                      <SelectValue placeholder="Status" className="text-black" />
                    </SelectTrigger>
                    <SelectContent className="text-black">
                      <SelectItem value="open" className="text-black">Open</SelectItem>
                      <SelectItem value="in-progress" className="text-black">In Progress</SelectItem>
                      <SelectItem value="resolved" className="text-black">Resolved</SelectItem>
                      <SelectItem value="closed" className="text-black">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {!selectedTicket.assignedTo && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-black border-gray-300 bg-white hover:bg-gray-100"
                      onClick={() => handleAssignToMe(selectedTicket._id)}
                    >
                      Assign to Me
                    </Button>
                  )}
                </div>
              </div>
              
              <ScrollArea className="flex-1 mb-4 border rounded-md p-4">
                <div className="space-y-6">
                  {selectedTicket.messages.map((message, index) => (
                    <div key={index} className={`p-4 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-blue-50 border border-blue-100' 
                        : 'bg-gray-50 border border-gray-100'
                    }`}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-black">
                          {message.sender === 'user' ? 'Customer' : 'Support Staff'}
                        </span>
                        <span className="text-sm text-black">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-black">{message.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="space-y-4">
                <TextArea
                  placeholder="Type your response here..."
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  className="min-h-[100px] text-black placeholder:text-gray-500"
                />
                
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button 
                      variant="outline" 
                      className="text-black border-gray-300 bg-white hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  
                  <Button 
                    onClick={handleSendResponse}
                    disabled={isSubmitting || !responseContent.trim()}
                    className="text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Response
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // Helper function to render ticket list
  function renderTicketList() {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
                <div className="mt-2">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-8 w-[100px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (tickets.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium">No tickets found</h3>
            <p className="text-gray-500 mt-2">There are no support tickets matching your criteria.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <h3 
                    className="font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => fetchTicketDetails(ticket._id)}
                  >
                    {ticket.subject}
                  </h3>
                  <div className="flex gap-2">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
                
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="h-4 w-4" />
                  <span>{ticket.userEmail}</span>
                  
                  {ticket.userName && (
                    <>
                      <span className="mx-1">•</span>
                      <User className="h-4 w-4" />
                      <span>{ticket.userName}</span>
                    </>
                  )}
                  
                  <span className="mx-1">•</span>
                  <Calendar className="h-4 w-4" />
                  <span>{formatTimestamp(ticket.createdAt)}</span>
                  
                  {ticket.messages && (
                    <>
                      <span className="mx-1">•</span>
                      <MessageSquare className="h-4 w-4" />
                      <span>{ticket.messages.length} messages</span>
                    </>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div>
                    {ticket.assignedTo ? (
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">Assigned to:</span> {' '}
                        {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                      </span>
                    ) : (                      <span className="text-sm text-gray-500">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 text-black hover:bg-gray-100"
                          onClick={() => handleAssignToMe(ticket._id)}
                        >
                          Assign to me
                        </Button>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Select
                      defaultValue={ticket.status}
                      onValueChange={(value) => handleStatusChange(ticket._id, value)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      size="sm"
                      onClick={() => fetchTicketDetails(ticket._id)}
                    >
                      View Ticket
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                // Show first page, last page, and pages around current page
                if (
                  i === 0 || 
                  i === totalPages - 1 || 
                  (i >= currentPage - 2 && i <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(i + 1);
                        }}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis for skipped pages
                if (
                  (i === 1 && currentPage > 3) || 
                  (i === totalPages - 2 && currentPage < totalPages - 3)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  }
};

export default Support;