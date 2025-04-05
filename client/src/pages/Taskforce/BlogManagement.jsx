import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Edit, Trash2, Eye, AlertTriangle, ChevronLeft, ChevronRight,
  Search, Filter, X, BarChart, ExternalLink, Tag, Calendar, Clock,
  MoreHorizontal, Loader2, Download, RefreshCw, MessageSquare, Check, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import blogService from '../../services/blog.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { TextArea } from '@/components/ui/TextArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Progress from '@/components/ui/progress';
import { useAuth } from '../../stores/authStore';

const BlogManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [analytics, setAnalytics] = useState({
    totalBlogs: 0,
    totalViews: 0,
    totalComments: 0,
    totalLikes: 0,
    adImpressions: 0,
    adClicks: 0,
    adRevenue: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    page: 1,
    limit: 10,
    sort: 'publishDate:desc'
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  
  // New state for blog import functionality
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importOptions, setImportOptions] = useState({
    sources: ['newsapi', 'rss'],
    categories: ['Fitness', 'Nutrition'],
    count: 10
  });
  const [importedBlogs, setImportedBlogs] = useState([]);
  const [selectedImportedBlogs, setSelectedImportedBlogs] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState(null);
  const [activeTab, setActiveTab] = useState('published');
  const [editImportedBlogOpen, setEditImportedBlogOpen] = useState(false);
  const [currentImportedBlog, setCurrentImportedBlog] = useState(null);
  const [importStats, setImportStats] = useState({
    total: 0,
    processed: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  // State for Imported Blogs Review tab
  const [pendingBlogs, setPendingBlogs] = useState([]);
  const [pendingBlogsLoading, setPendingBlogsLoading] = useState(false);
  const [pendingBlogsFilters, setPendingBlogsFilters] = useState({
    search: '',
    source: 'all',
    category: 'all',
    page: 1,
    limit: 10
  });
  const [pendingBlogsPagination, setPendingBlogsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [selectedPendingBlogs, setSelectedPendingBlogs] = useState([]);
  const [viewBlogDialogOpen, setViewBlogDialogOpen] = useState(false);
  const [blogToView, setBlogToView] = useState(null);
  const [refreshStats, setRefreshStats] = useState(false);

  const getUserRole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  // Check for dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      setIsDarkMode(localStorage.getItem('siteTheme') === 'dark');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);
  
  // Fetch import stats
  useEffect(() => {
    const fetchImportStats = async () => {
      if (user?.role !== 'admin' && user?.role !== 'taskforce') return;
      
      try {
        const response = await blogService.getImportStats();
        setImportStats(response.data || {
          total: 0,
          processed: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        });
      } catch (error) {
        console.error('Error fetching import stats:', error);
      }
    };
    
    fetchImportStats();
  }, [user, refreshStats]);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        // Author ID is used to get both published and draft blogs for the current user
        const authorParams = user?.role === 'admin' ? {} : { author: user?.id };
        
        // Convert 'all' filter values to empty strings for the API
        const apiFilters = {
          ...filters,
          status: filters.status === 'all' ? '' : filters.status,
          category: filters.category === 'all' ? '' : filters.category,
          ...authorParams
        };
        
        if (activeTab === 'imported') {
          // Only fetch imported blogs
          apiFilters.imported = true;
        } else {
          // Exclude imported blogs for other tabs
          apiFilters.imported = false;
        }
        
        const response = await blogService.getBlogs(apiFilters);
        
        setBlogs(response.data);
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems
        });
        
        // Calculate basic analytics
        if (response.data.length > 0) {
          const totalViews = response.data.reduce((sum, blog) => sum + blog.analytics.views, 0);
          const totalComments = response.data.reduce((sum, blog) => sum + blog.comments.length, 0);
          const totalLikes = response.data.reduce((sum, blog) => sum + blog.analytics.likes, 0);
          
          setAnalytics(prev => ({
            ...prev,
            totalBlogs: response.pagination.totalItems,
            totalViews,
            totalComments,
            totalLikes,
          }));
        }
        
      } catch (error) {
        console.error('Error fetching blogs:', error);
        toast.error('Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab !== 'pending') {
      fetchBlogs();
    }
  }, [filters, user, activeTab]);
  
  // Fetch pending review blogs
  useEffect(() => {
    const fetchPendingBlogs = async () => {
      if (activeTab !== 'pending') return;
      
      setPendingBlogsLoading(true);
      try {
        // Build query parameters for pending review blogs
        const queryParams = {
          page: pendingBlogsFilters.page,
          limit: pendingBlogsFilters.limit,
          status: 'draft',
          imported: true // Only imported blogs
        };
        
        if (pendingBlogsFilters.search) queryParams.search = pendingBlogsFilters.search;
        if (pendingBlogsFilters.source !== 'all') queryParams.source = pendingBlogsFilters.source;
        if (pendingBlogsFilters.category !== 'all') queryParams.category = pendingBlogsFilters.category;
        
        const response = await blogService.getBlogs(queryParams);
        
        setPendingBlogs(response.data);
        setPendingBlogsPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems
        });
      } catch (error) {
        console.error('Error fetching pending blogs:', error);
        toast.error('Failed to load pending blogs');
      } finally {
        setPendingBlogsLoading(false);
      }
    };
    
    if (activeTab === 'pending') {
      fetchPendingBlogs();
    }
  }, [pendingBlogsFilters, activeTab]);

  // Fetch ad performance data (admin only)
  useEffect(() => {
    const fetchAdPerformance = async () => {
      if (user?.role !== 'admin') return;
      
      try {
        const response = await blogService.getAdPerformance();
        
        // Combine data from different ad networks
        const adsense = response.data.adsense || {};
        const mediavine = response.data.mediavine || {};
        
        const totalImpressions = (adsense.impressions || 0) + (mediavine.impressions || 0);
        const totalClicks = (adsense.clicks || 0) + (mediavine.clicks || 0);
        const totalRevenue = (adsense.revenue || 0) + (mediavine.revenue || 0);
        
        setAnalytics(prev => ({
          ...prev,
          adImpressions: totalImpressions,
          adClicks: totalClicks,
          adRevenue: totalRevenue
        }));
        
      } catch (error) {
        console.error('Error fetching ad performance:', error);
      }
    };
    
    fetchAdPerformance();
  }, [user]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when filters change
      page: key === 'page' ? value : 1
    }));
  };

  // Handle pending blogs filter changes
  const handlePendingBlogsFilterChange = (key, value) => {
    setPendingBlogsFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when filters change (except when changing page)
      page: key === 'page' ? value : 1
    }));
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (activeTab === 'pending') {
      handlePendingBlogsFilterChange('search', pendingBlogsFilters.search);
    } else {
      handleFilterChange('search', filters.search);
    }
  };

  // Clear filters
  const clearFilters = () => {
    if (activeTab === 'pending') {
      setPendingBlogsFilters({
        search: '',
        source: 'all',
        category: 'all',
        page: 1,
        limit: 10
      });
    } else {
      setFilters({
        search: '',
        status: 'all',
        category: 'all',
        page: 1,
        limit: 10,
        sort: 'publishDate:desc'
      });
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Not published';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const badges = {
      published: {
        color: isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
        label: 'Published'
      },
      draft: {
        color: isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
        label: 'Draft'
      },
      archived: {
        color: isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-800',
        label: 'Archived'
      }
    };
    
    const { color, label } = badges[status] || badges.draft;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // Get source badge color
  const getSourceBadgeClass = (source) => {
    const sources = {
      'newsapi': isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800',
      'rss': isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
      'spoonacular': isDarkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-800'
    };
    
    return sources[source] || (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  // Delete blog dialog and handling
  const openDeleteDialog = (blog) => {
    setBlogToDelete(blog);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;
    
    try {
      await blogService.deleteBlog(blogToDelete.slug);
      
      // Remove the blog from the state
      setBlogs(blogs.filter(blog => blog._id !== blogToDelete._id));
      
      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        totalBlogs: prev.totalBlogs - 1
      }));
      
      toast.success('Blog post deleted successfully');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog post');
    } finally {
      setBlogToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  // NEW FUNCTIONS FOR BLOG IMPORT

  // Open import dialog
  const openImportDialog = () => {
    setImportedBlogs([]);
    setSelectedImportedBlogs([]);
    setImportProgress(0);
    setImportError(null);
    setImportDialogOpen(true);
  };

  // Handle import options change
  const handleImportOptionChange = (key, value) => {
    setImportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle source selection
  const toggleSource = (source) => {
    setImportOptions(prev => {
      const currentSources = prev.sources || [];
      if (currentSources.includes(source)) {
        return {
          ...prev,
          sources: currentSources.filter(s => s !== source)
        };
      } else {
        return {
          ...prev,
          sources: [...currentSources, source]
        };
      }
    });
  };

  // Handle category selection
  const toggleCategory = (category) => {
    setImportOptions(prev => {
      const currentCategories = prev.categories || [];
      if (currentCategories.includes(category)) {
        return {
          ...prev,
          categories: currentCategories.filter(c => c !== category)
        };
      } else {
        return {
          ...prev,
          categories: [...currentCategories, category]
        };
      }
    });
  };

  // Fetch blogs from external sources
  const fetchExternalBlogs = async () => {
    setImportLoading(true);
    setImportProgress(10);
    setImportError(null);
    setImportedBlogs([]);
    
    try {
      // Call the backend to fetch blogs
      const response = await blogService.importContent({
        sources: importOptions.sources,
        categories: importOptions.categories,
        count: importOptions.count
      });
      
      setImportProgress(100);
      
      // Process the imported blogs
      if (response.data && response.data.length > 0) {
        setImportedBlogs(response.data);
        // Select all blogs by default
        setSelectedImportedBlogs(response.data.map(blog => blog._id));
        toast.success(`Successfully fetched ${response.data.length} blog posts`);
      } else {
        toast.info('No blog posts found matching your criteria');
      }
    } catch (error) {
      console.error('Error fetching external blogs:', error);
      setImportError(error.response?.data?.message || 'Failed to fetch blogs');
      toast.error('Failed to fetch blog posts');
    } finally {
      setImportLoading(false);
    }
  };

  // Toggle selection of imported blog
  const toggleBlogSelection = (blogId) => {
    setSelectedImportedBlogs(prev => {
      if (prev.includes(blogId)) {
        return prev.filter(id => id !== blogId);
      } else {
        return [...prev, blogId];
      }
    });
  };
  
  // Toggle selection of pending review blog
  const togglePendingBlogSelection = (blogId) => {
    setSelectedPendingBlogs(prev => {
      if (prev.includes(blogId)) {
        return prev.filter(id => id !== blogId);
      } else {
        return [...prev, blogId];
      }
    });
  };

  // Select/Deselect all blogs
  const toggleSelectAll = () => {
    if (selectedImportedBlogs.length === importedBlogs.length) {
      setSelectedImportedBlogs([]);
    } else {
      setSelectedImportedBlogs(importedBlogs.map(blog => blog._id));
    }
  };
  
  // Select/Deselect all pending blogs
  const toggleSelectAllPending = () => {
    if (selectedPendingBlogs.length === pendingBlogs.length) {
      setSelectedPendingBlogs([]);
    } else {
      setSelectedPendingBlogs(pendingBlogs.map(blog => blog._id));
    }
  };

  // Open edit dialog for imported blog
  const openEditImportedBlog = (blog) => {
    setCurrentImportedBlog({
      ...blog,
      // Add default values if not present
      title: blog.title || '',
      content: blog.content || '',
      metaDescription: blog.metaDescription || blog.description || '',
      category: blog.category || 'Fitness',
      tags: blog.tags || [],
      status: 'draft'
    });
    setEditImportedBlogOpen(true);
  };

  // Handle imported blog field changes
  const handleImportedBlogChange = (field, value) => {
    setCurrentImportedBlog(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add/remove tag for imported blog
  const handleImportedBlogTag = (tag, action) => {
    if (!tag) return;
    
    setCurrentImportedBlog(prev => {
      const currentTags = prev.tags || [];
      if (action === 'add') {
        // Prevent duplicate tags
        if (!currentTags.includes(tag)) {
          return {
            ...prev,
            tags: [...currentTags, tag]
          };
        }
      } else {
        return {
          ...prev,
          tags: currentTags.filter(t => t !== tag)
        };
      }
      return prev;
    });
  };

  // Save edited imported blog
  const saveImportedBlog = async () => {
    if (!currentImportedBlog) return;
    
    try {
      const response = await blogService.updateImportedContent(
        currentImportedBlog._id,
        currentImportedBlog
      );
      
      // Update in the list - either pending blogs or imported blogs
      if (activeTab === 'pending') {
        setPendingBlogs(prev => 
          prev.map(blog => 
            blog._id === currentImportedBlog._id ? response.data : blog
          )
        );
      } else {
        setImportedBlogs(prev => 
          prev.map(blog => 
            blog._id === currentImportedBlog._id ? response.data : blog
          )
        );
      }
      
      toast.success('Blog post updated successfully');
      setEditImportedBlogOpen(false);
    } catch (error) {
      console.error('Error updating imported blog:', error);
      toast.error('Failed to update blog post');
    }
  };

  // Open view dialog for blog
  const handleViewBlog = (blog) => {
    setBlogToView(blog);
    setViewBlogDialogOpen(true);
  };

  // Approve selected blogs
  const approveSelectedBlogs = async (blogIds = null) => {
    // If blogIds is provided, use it, otherwise use selectedImportedBlogs or selectedPendingBlogs
    const idsToApprove = blogIds || 
      (activeTab === 'pending' ? selectedPendingBlogs : selectedImportedBlogs);
    
    if (idsToApprove.length === 0) {
      toast.info('No blogs selected');
      return;
    }
    
    try {
      const response = await blogService.approveImportedBlogs(idsToApprove);
      
      toast.success(`${response.data.count} blogs approved`);
      
      // Remove approved blogs from the list
      if (activeTab === 'pending') {
        setPendingBlogs(prev => 
          prev.filter(blog => !idsToApprove.includes(blog._id))
        );
        setSelectedPendingBlogs([]);
      } else {
        setImportedBlogs(prev => 
          prev.filter(blog => !idsToApprove.includes(blog._id))
        );
        setSelectedImportedBlogs([]);
      }
      
      // Close dialogs if open
      setViewBlogDialogOpen(false);
      
      // Refresh stats
      setRefreshStats(prev => !prev);
    } catch (error) {
      console.error('Error approving blogs:', error);
      toast.error('Failed to approve blogs');
    }
  };

  // Reject selected blogs
  const rejectSelectedBlogs = async (blogIds = null) => {
    // If blogIds is provided, use it, otherwise use selectedImportedBlogs or selectedPendingBlogs
    const idsToReject = blogIds || 
      (activeTab === 'pending' ? selectedPendingBlogs : selectedImportedBlogs);
    
    if (idsToReject.length === 0) {
      toast.info('No blogs selected');
      return;
    }
    
    try {
      const response = await blogService.rejectImportedBlogs(idsToReject);
      
      toast.success(`${response.data.count} blogs rejected`);
      
      // Remove rejected blogs from the list
      if (activeTab === 'pending') {
        setPendingBlogs(prev => 
          prev.filter(blog => !idsToReject.includes(blog._id))
        );
        setSelectedPendingBlogs([]);
      } else {
        setImportedBlogs(prev => 
          prev.filter(blog => !idsToReject.includes(blog._id))
        );
        setSelectedImportedBlogs([]);
      }
      
      // Close dialogs if open
      setViewBlogDialogOpen(false);
      
      // Refresh stats
      setRefreshStats(prev => !prev);
    } catch (error) {
      console.error('Error rejecting blogs:', error);
      toast.error('Failed to reject blogs');
    }
  };

  // Analytics summary cards
  const analyticsSummary = [
    {
      title: 'Total Posts',
      value: analytics.totalBlogs,
      icon: <Tag className="h-5 w-5 text-blue-500" />,
      color: 'border-blue-100 dark:border-blue-900'
    },
    {
      title: 'Views',
      value: analytics.totalViews.toLocaleString(),
      icon: <Eye className="h-5 w-5 text-green-500" />,
      color: 'border-green-100 dark:border-green-900'
    },
    {
      title: 'Comments',
      value: analytics.totalComments.toLocaleString(),
      icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
      color: 'border-purple-100 dark:border-purple-900'
    },
    {
      title: 'Likes',
      value: analytics.totalLikes.toLocaleString(),
      icon: <Calendar className="h-5 w-5 text-red-500" />,
      color: 'border-red-100 dark:border-red-900'
    }
  ];

  // Import stats cards
  const importStatsSummary = [
    {
      title: 'Pending Review',
      value: importStats.pending || 0,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      color: 'border-amber-100 dark:border-amber-900'
    },
    {
      title: 'Approved',
      value: importStats.approved || 0,
      icon: <Check className="h-5 w-5 text-green-500" />,
      color: 'border-green-100 dark:border-green-900'
    },
    {
      title: 'Rejected',
      value: importStats.rejected || 0,
      icon: <X className="h-5 w-5 text-red-500" />,
      color: 'border-red-100 dark:border-red-900'
    },
    {
      title: 'Total Imported',
      value: importStats.total || 0,
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      color: 'border-blue-100 dark:border-blue-900'
    }
  ];

  // Check if user has access to this page
  if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="mb-6 text-gray-600">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your blog posts and analytics
          </p>
        </div>
        
        <div className="flex space-x-3">
          {/* NEW: Fetch External Blogs Button */}
          <Button
            onClick={openImportDialog}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Fetch Blogs
          </Button>
          
          <Button
            onClick={() => navigate('/admin/blog/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Post
          </Button>
          
          {user.role === 'admin' && (
            <Button
              variant="outline"
              onClick={() => navigate('/admin/blog/analytics')}
              className={isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}
            >
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          )}
        </div>
      </div>
      
      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analyticsSummary.map((item, index) => (
          <Card 
            key={index} 
            className={`border-l-4 ${item.color} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.title}
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : ''}`}>{item.value}</p>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                {item.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Import Stats Summary */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDarkMode ? 'text-white' : ''}>Content Import Stats</CardTitle>
          <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
            Overview of imported blog content from external sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {importStatsSummary.map((item, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${item.color} ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.title}
                  </p>
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                    {item.icon}
                  </div>
                </div>
                <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setActiveTab('pending');
              setRefreshStats(prev => !prev);
            }}
            className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshStats ? 'animate-spin' : ''}`} />
            Manage Imported Content
          </Button>
        </CardFooter>
      </Card>
      
      {/* Tabs for different blog types */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="imported">Imported</TabsTrigger>
        </TabsList>
        
        {/* Published/Draft/Imported Blogs Tab */}
        <TabsContent value={activeTab === 'pending' ? 'hidden' : activeTab} className="p-0">
          <Card className={`shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Search box */}
                <div className="w-full md:w-1/3">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search blog posts..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className={`pl-10 w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </form>
                </div>
                
                {/* Status filter */}
                <div className="w-full md:w-1/4">
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Category filter */}
                <div className="w-full md:w-1/4">
                  <Select
                    value={filters.category}
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Fitness">Fitness</SelectItem>
                      <SelectItem value="Nutrition">Nutrition</SelectItem>
                      <SelectItem value="Workout Plans">Workout Plans</SelectItem>
                      <SelectItem value="Equipment Reviews">Equipment Reviews</SelectItem>
                      <SelectItem value="Success Stories">Success Stories</SelectItem>
                      <SelectItem value="Health Tips">Health Tips</SelectItem>
                      <SelectItem value="Motivation">Motivation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sort filter */}
                <div className="w-full md:w-1/4">
                  <Select
                    value={filters.sort}
                    onValueChange={(value) => handleFilterChange('sort', value)}
                  >
                    <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                      <SelectItem value="publishDate:desc">Newest First</SelectItem>
                      <SelectItem value="publishDate:asc">Oldest First</SelectItem>
                      <SelectItem value="analytics.views:desc">Most Viewed</SelectItem>
                      <SelectItem value="analytics.likes:desc">Most Liked</SelectItem>
                      <SelectItem value="title:asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title:desc">Title (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Reset filters button */}
                {(filters.search || filters.status !== 'all' || filters.category !== 'all') && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="px-2.5"
                  >
                    <X size={16} className="mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Blog posts table */}
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className={isDarkMode ? 'bg-gray-700 hover:bg-gray-700' : ''}>
                      <TableHead className="w-[30%]">Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      // Loading state
                      [...Array(5)].map((_, index) => (
                        <TableRow key={index} className={isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : ''}>
                          {[...Array(6)].map((_, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <div className={`h-5 w-full rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : blogs.length === 0 ? (
                      // Empty state
                      <TableRow className={isDarkMode ? 'hover:bg-gray-800' : ''}>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center">
                            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <Filter className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                            <h3 className={`mt-2 text-base font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>No blog posts found</h3>
                            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Try adjusting your search or filters
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Blog posts list
                      blogs.map((blog) => (
                        <TableRow key={blog._id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <TableCell className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>
                            {blog.title.length > 60 
                              ? `${blog.title.substring(0, 60)}...` 
                              : blog.title}
                              
                            {/* Source badge for imported content */}
                            {blog.source && blog.source.name && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200" variant="secondary">
                                {blog.source.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={isDarkMode ? 'text-gray-300' : ''}>{blog.category}</TableCell>
                          <TableCell>{getStatusBadge(blog.status)}</TableCell>
                          <TableCell className={isDarkMode ? 'text-gray-300' : ''}>{formatDate(blog.publishDate)}</TableCell>
                          <TableCell className={`text-right ${isDarkMode ? 'text-gray-300' : ''}`}>{blog.analytics.views.toLocaleString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className={isDarkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : ''}>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className={isDarkMode ? 'bg-gray-700' : ''}/>
                                <DropdownMenuItem onClick={() => navigate(`/blog/${blog.slug}`)} className={isDarkMode ? 'focus:bg-gray-700' : ''}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/blog/edit/${blog.slug}`)} className={isDarkMode ? 'focus:bg-gray-700' : ''}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeleteDialog(blog)} className={isDarkMode ? 'focus:bg-gray-700 text-red-400' : 'text-red-600'}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                {user.role === 'admin' && (
                                  <DropdownMenuItem onClick={() => navigate(`/taskforce-dashboard/ads/${blog.slug}`)} className={isDarkMode ? 'focus:bg-gray-700' : ''}>
                                    <BarChart className="h-4 w-4 mr-2" />
                                    Manage Ads
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {blogs.length} of {pagination.totalItems} results
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                      disabled={filters.page === 1}
                      className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const isCurrentPage = pageNumber === filters.page;
                      
                      // Show first page, last page, current page, and adjacent pages
                      if (
                        pageNumber === 1 ||
                        pageNumber === pagination.totalPages ||
                        (pageNumber >= filters.page - 1 && pageNumber <= filters.page + 1)
                      ) {
                        return (
                          <Button
                            key={pageNumber}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFilterChange('page', pageNumber)}
                            className={isDarkMode && !isCurrentPage ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                      
                      // Show dots for skipped pages, but only once
                      if (
                        (pageNumber === 2 && filters.page > 3) ||
                        (pageNumber === pagination.totalPages - 1 && filters.page < pagination.totalPages - 2)
                      ) {
                        return (
                          <Button
                            key={pageNumber}
                            variant="outline"
                            size="sm"
                            disabled
                            className={isDarkMode ? 'border-gray-700 text-gray-500' : ''}
                          >
                            ...
                          </Button>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, filters.page + 1))}
                      disabled={filters.page === pagination.totalPages}
                      className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pending Review Blogs Tab */}
        <TabsContent value="pending" className="p-0">
          <Card className={`shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Search box */}
                <div className="w-full md:w-1/3">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search pending blogs..."
                      value={pendingBlogsFilters.search}
                      onChange={(e) => setPendingBlogsFilters({...pendingBlogsFilters, search: e.target.value})}
                      className={`pl-10 w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </form>
                </div>
                
                {/* Source filter */}
                <div className="w-full md:w-1/4">
                  <Select
                    value={pendingBlogsFilters.source}
                    onValueChange={(value) => handlePendingBlogsFilterChange('source', value)}
                  >
                    <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="newsapi">News API</SelectItem>
                      <SelectItem value="rss">RSS Feeds</SelectItem>
                      <SelectItem value="spoonacular">Spoonacular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Category filter */}
                <div className="w-full md:w-1/4">
                  <Select
                    value={pendingBlogsFilters.category}
                    onValueChange={(value) => handlePendingBlogsFilterChange('category', value)}
                  >
                    <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Fitness">Fitness</SelectItem>
                      <SelectItem value="Nutrition">Nutrition</SelectItem>
                      <SelectItem value="Workout Plans">Workout Plans</SelectItem>
                      <SelectItem value="Health Tips">Health Tips</SelectItem>
                      <SelectItem value="Motivation">Motivation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Reset filters button */}
                {(pendingBlogsFilters.search || pendingBlogsFilters.source !== 'all' || pendingBlogsFilters.category !== 'all') && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="px-2.5"
                  >
                    <X size={16} className="mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Action Buttons */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={selectedPendingBlogs.length === pendingBlogs.length && pendingBlogs.length > 0}
                    onCheckedChange={toggleSelectAllPending}
                    id="select-all-pending" 
                    className={isDarkMode ? 'data-[state=checked]:bg-blue-600 border-gray-600' : ''}
                  />
                  <label 
                    htmlFor="select-all-pending" 
                    className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {selectedPendingBlogs.length === 0 
                      ? 'Select All' 
                      : `Selected ${selectedPendingBlogs.length} of ${pendingBlogs.length}`
                    }
                  </label>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => rejectSelectedBlogs()}
                    disabled={selectedPendingBlogs.length === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveSelectedBlogs()}
                    disabled={selectedPendingBlogs.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Selected
                  </Button>
                </div>
              </div>
              
              {/* Blogs Table */}
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className={isDarkMode ? 'bg-gray-700 hover:bg-gray-700' : ''}>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Imported</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBlogsLoading ? (
                      // Loading state
                      [...Array(5)].map((_, index) => (
                        <TableRow key={index} className={isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : ''}>
                          {[...Array(6)].map((_, cellIndex) => (
                            <TableCell key={cellIndex}>
                              <div className={`h-5 w-full rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pendingBlogs.length === 0 ? (
                      // Empty state
                      <TableRow className={isDarkMode ? 'hover:bg-gray-800' : ''}>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center">
                            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <Filter className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                            <h3 className={`mt-2 text-base font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>No imported blogs found</h3>
                            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Try adjusting your filters or import new content
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Blog list
                      pendingBlogs.map((blog) => (
                        <TableRow key={blog._id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <TableCell className="pr-0">
                            <Checkbox 
                              checked={selectedPendingBlogs.includes(blog._id)} 
                              onCheckedChange={() => togglePendingBlogSelection(blog._id)}
                              className={isDarkMode ? 'data-[state=checked]:bg-blue-600 border-gray-600' : ''}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>
                                {blog.title.length > 60 ? `${blog.title.substring(0, 60)}...` : blog.title}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {blog.tags?.slice(0, 3).map(tag => (
                                  <Badge 
                                    key={tag} 
                                    variant="outline" 
                                    className={isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {blog.tags?.length > 3 && (
                                  <Badge variant="outline" className={isDarkMode ? 'border-gray-600 text-gray-300' : ''}>
                                    +{blog.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSourceBadgeClass(blog.source?.type)}>
                              {blog.source?.name || blog.source?.type || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{blog.category || 'Uncategorized'}</TableCell>
                          <TableCell>
                            {blog.source?.importedAt ? formatDate(blog.source.importedAt) : 'Unknown'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex space-x-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewBlog(blog)}
                                className={isDarkMode ? 'hover:bg-gray-700 text-gray-300' : ''}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditImportedBlog(blog)}
                                className={isDarkMode ? 'hover:bg-gray-700 text-gray-300' : ''}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(blog.source?.url, '_blank')}
                                className={isDarkMode ? 'hover:bg-gray-700 text-gray-300' : ''}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {pendingBlogsPagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {pendingBlogs.length} of {pendingBlogsPagination.totalItems} results
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePendingBlogsFilterChange('page', Math.max(1, pendingBlogsFilters.page - 1))}
                      disabled={pendingBlogsFilters.page === 1}
                      className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {[...Array(pendingBlogsPagination.totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const isCurrentPage = pageNumber === pendingBlogsFilters.page;
                      
                      // Show first page, last page, current page, and adjacent pages
                      if (
                        pageNumber === 1 ||
                        pageNumber === pendingBlogsPagination.totalPages ||
                        (pageNumber >= pendingBlogsFilters.page - 1 && pageNumber <= pendingBlogsFilters.page + 1)
                      ) {
                        return (
                          <Button
                            key={pageNumber}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePendingBlogsFilterChange('page', pageNumber)}
                            className={isDarkMode && !isCurrentPage ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                          >
                            {pageNumber}
                          </Button>
                        );
                      }
                      
                      // Show dots for skipped pages, but only once
                      if (
                        (pageNumber === 2 && pendingBlogsFilters.page > 3) ||
                        (pageNumber === pendingBlogsPagination.totalPages - 1 && 
                         pendingBlogsFilters.page < pendingBlogsPagination.totalPages - 2)
                      ) {
                        return (
                          <Button
                            key={pageNumber}
                            variant="outline"
                            size="sm"
                            disabled
                            className={isDarkMode ? 'border-gray-700 text-gray-500' : ''}
                          >
                            ...
                          </Button>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePendingBlogsFilterChange('page', 
                        Math.min(pendingBlogsPagination.totalPages, pendingBlogsFilters.page + 1))}
                      disabled={pendingBlogsFilters.page === pendingBlogsPagination.totalPages}
                      className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className={isDarkMode ? 'text-gray-300' : ''}>Are you sure you want to delete the blog post:</p>
            <p className={`font-medium mt-2 ${isDarkMode ? 'text-white' : ''}`}>"{blogToDelete?.title}"</p>
            <div className={`mt-4 flex items-center p-4 ${isDarkMode ? 'bg-amber-900 text-amber-200' : 'bg-amber-50 text-amber-800'} rounded-md`}>
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">This action cannot be undone.</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className={isDarkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBlog}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Blog Import Dialog */}
      <Dialog 
        open={importDialogOpen} 
        onOpenChange={(open) => {
          if (!importLoading) setImportDialogOpen(open);
        }}
        className="max-w-4xl"
      >
        <DialogContent className={`max-w-4xl ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle>Import Blog Content</DialogTitle>
          </DialogHeader>
          
          {!importedBlogs.length ? (
            // Step 1: Configure import options
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sources Selection */}
                <div>
                  <h3 className={`text-base font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Select Sources
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Checkbox 
                        id="source-newsapi" 
                        checked={importOptions.sources.includes('newsapi')} 
                        onCheckedChange={() => toggleSource('newsapi')}
                        className={isDarkMode ? 'border-gray-600 data-[state=checked]:bg-blue-600' : ''}
                      />
                      <label 
                        htmlFor="source-newsapi" 
                        className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        News API (Current Articles)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox 
                        id="source-rss" 
                        checked={importOptions.sources.includes('rss')} 
                        onCheckedChange={() => toggleSource('rss')}
                        className={isDarkMode ? 'border-gray-600 data-[state=checked]:bg-blue-600' : ''}
                      />
                      <label 
                        htmlFor="source-rss" 
                        className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        RSS Feeds (Fitness Blogs)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox 
                        id="source-spoonacular" 
                        checked={importOptions.sources.includes('spoonacular')} 
                        onCheckedChange={() => toggleSource('spoonacular')}
                        className={isDarkMode ? 'border-gray-600 data-[state=checked]:bg-blue-600' : ''}
                      />
                      <label 
                        htmlFor="source-spoonacular" 
                        className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        Spoonacular (Nutrition Articles)
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Categories Selection */}
                <div>
                  <h3 className={`text-base font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Select Categories
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Checkbox 
                        id="category-fitness" 
                        checked={importOptions.categories.includes('Fitness')} 
                        onCheckedChange={() => toggleCategory('Fitness')}
                        className={isDarkMode ? 'border-gray-600 data-[state=checked]:bg-blue-600' : ''}
                      />
                      <label 
                        htmlFor="category-fitness" 
                        className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        Fitness
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox 
                        id="category-nutrition" 
                        checked={importOptions.categories.includes('Nutrition')} 
                        onCheckedChange={() => toggleCategory('Nutrition')}
                        className={isDarkMode ? 'border-gray-600 data-[state=checked]:bg-blue-600' : ''}
                      />
                      <label 
                        htmlFor="category-nutrition" 
                        className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        Nutrition
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox 
                        id="category-workoutplans" 
                        checked={importOptions.categories.includes('Workout Plans')} 
                        onCheckedChange={() => toggleCategory('Workout Plans')}
                        className={isDarkMode ? 'border-gray-600 data-[state=checked]:bg-blue-600' : ''}
                      />
                      <label 
                        htmlFor="category-workoutplans" 
                        className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        Workout Plans
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox 
                        id="category-healthtips" 
                        checked={importOptions.categories.includes('Health Tips')} 
                        onCheckedChange={() => toggleCategory('Health Tips')}
                        className={isDarkMode ? 'border-gray-600 data-[state=checked]:bg-blue-600' : ''}
                      />
                      <label 
                        htmlFor="category-healthtips" 
                        className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        Health Tips
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Max Count Slider */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Maximum Articles to Fetch
                  </h3>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {importOptions.count}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={importOptions.count}
                  onChange={(e) => handleImportOptionChange('count', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>5</span>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>50</span>
                </div>
              </div>
              
              {/* Error Message */}
              {importError && (
                <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700">
                  <p className="text-sm">{importError}</p>
                </div>
              )}
              
              {/* Progress Bar */}
              {importLoading && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Fetching Content...
                    </h3>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {importProgress}%
                    </span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}
            </div>
          ) : (
            // Step 2: Review and select imported blogs
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Review Imported Content ({importedBlogs.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleSelectAll}
                    className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                  >
                    {selectedImportedBlogs.length === importedBlogs.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setImportedBlogs([]);
                      setSelectedImportedBlogs([]);
                    }}
                    className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                  >
                    Back to Options
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className={isDarkMode ? 'bg-gray-700 hover:bg-gray-700' : ''}>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Title & Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedBlogs.map((blog) => (
                      <TableRow key={blog._id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <TableCell className="pr-0">
                          <Checkbox 
                            checked={selectedImportedBlogs.includes(blog._id)} 
                            onCheckedChange={() => toggleBlogSelection(blog._id)}
                            className={isDarkMode ? 'border-gray-600 data-[state=checked]:bg-blue-600' : ''}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>
                              {blog.title.length > 60 ? `${blog.title.substring(0, 60)}...` : blog.title}
                            </p>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className={isDarkMode ? 'border-gray-600 text-gray-300' : ''}>
                                {blog.source.name}
                              </Badge>
                              <span className={`text-xs ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(blog.source.importedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{blog.category || 'Uncategorized'}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditImportedBlog(blog)}
                            className={isDarkMode ? 'hover:bg-gray-700 text-gray-300' : ''}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(blog.source.url, '_blank')}
                            className={isDarkMode ? 'hover:bg-gray-700 text-gray-300' : ''}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Source
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {!importedBlogs.length ? (
              // Step 1 Footer: Fetch or Cancel
              <>
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                  disabled={importLoading}
                  className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                >
                  Cancel
                </Button>
                <Button
                  disabled={importLoading || importOptions.sources.length === 0 || importOptions.categories.length === 0}
                  onClick={fetchExternalBlogs}
                >
                  {importLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Fetch Articles
                    </>
                  )}
                </Button>
              </>
            ) : (
              // Step 2 Footer: Approve/Reject or Cancel
              <>
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                  className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                >
                  Cancel
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    onClick={() => rejectSelectedBlogs()}
                    disabled={selectedImportedBlogs.length === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Selected
                  </Button>
                  <Button
                    onClick={() => approveSelectedBlogs()}
                    disabled={selectedImportedBlogs.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Selected
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Imported Blog Dialog */}
      <Dialog open={editImportedBlogOpen} onOpenChange={setEditImportedBlogOpen}>
        <DialogContent className={`max-w-3xl ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}`}>
          <DialogHeader>
            <DialogTitle>Edit Imported Article</DialogTitle>
          </DialogHeader>
          
          {currentImportedBlog && (
            <div className="py-4 space-y-4 z-[1000]">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title
                </label>
                <Input
                  value={currentImportedBlog.title}
                  onChange={(e) => handleImportedBlogChange('title', e.target.value)}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              
              {/* Content */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Content
                </label>
                <TextArea
                  value={currentImportedBlog.content}
                  onChange={(e) => handleImportedBlogChange('content', e.target.value)}
                  rows={10}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              
              {/* Meta Description */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Meta Description
                </label>
                <TextArea
                  value={currentImportedBlog.metaDescription}
                  onChange={(e) => handleImportedBlogChange('metaDescription', e.target.value)}
                  rows={2}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentImportedBlog.metaDescription?.length || 0}/160 characters recommended
                </p>
              </div>
              
              {/* Category and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <Select
                    value={currentImportedBlog.category}
                    onValueChange={(value) => handleImportedBlogChange('category', value)}
                  >
                    <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                      <SelectItem value="Fitness">Fitness</SelectItem>
                      <SelectItem value="Nutrition">Nutrition</SelectItem>
                      <SelectItem value="Workout Plans">Workout Plans</SelectItem>
                      <SelectItem value="Equipment Reviews">Equipment Reviews</SelectItem>
                      <SelectItem value="Success Stories">Success Stories</SelectItem>
                      <SelectItem value="Health Tips">Health Tips</SelectItem>
                      <SelectItem value="Motivation">Motivation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <Select
                    value={currentImportedBlog.status}
                    onValueChange={(value) => handleImportedBlogChange('status', value)}
                  >
                    <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentImportedBlog.tags?.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className={`${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => handleImportedBlogTag(tag, 'remove')} 
                      />
                    </Badge>
                  ))}
                </div>
                
                <div className="flex">
                  <Input
                    placeholder="Add tag and press Enter"
                    value={currentImportedBlog.newTag || ''}
                    onChange={(e) => handleImportedBlogChange('newTag', e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleImportedBlogTag(currentImportedBlog.newTag, 'add');
                        handleImportedBlogChange('newTag', '');
                      }
                    }}
                    className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className={`ml-2 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                    onClick={() => {
                      handleImportedBlogTag(currentImportedBlog.newTag, 'add');
                      handleImportedBlogChange('newTag', '');
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              {/* Source Info */}
              <div className={`mt-4 p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50'
              }`}>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Source Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Source Name:</span>
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {currentImportedBlog.source?.name || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Import Date:</span>
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {currentImportedBlog.source?.importedAt 
                        ? new Date(currentImportedBlog.source.importedAt).toLocaleDateString() 
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Original URL:</span>
                    <a 
                      href={currentImportedBlog.source?.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`ml-2 ${
                        isDarkMode 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      View Original Source
                      <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditImportedBlogOpen(false)}
              className={isDarkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
            >
              Cancel
            </Button>
            <Button
              onClick={saveImportedBlog}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;