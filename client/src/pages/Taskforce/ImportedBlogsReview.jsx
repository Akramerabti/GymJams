import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Eye, 
  Edit, 
  ExternalLink, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight,
  Clock,
  Calendar,
  FileText,
  Tag
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
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../../stores/authStore';

const ImportedBlogsReview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [importedBlogs, setImportedBlogs] = useState([]);
  const [selectedBlogs, setSelectedBlogs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    source: 'all',
    category: 'all',
    page: 1,
    limit: 10
  });
  const [refreshing, setRefreshing] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);
  const [tagInput, setTagInput] = useState('');
  
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
  
  // Fetch imported blogs with pending status
  useEffect(() => {
    const fetchImportedBlogs = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const queryParams = new URLSearchParams({
          page: filters.page,
          limit: filters.limit,
          status: 'draft', // Only get drafts for review
          imported: true // Custom param to get only imported blogs
        });
        
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.source !== 'all') queryParams.append('source', filters.source);
        if (filters.category !== 'all') queryParams.append('category', filters.category);
        
        // Call backend API
        const response = await blogService.getBlogs(Object.fromEntries(queryParams));
        
        setImportedBlogs(response.data);
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems
        });
      } catch (error) {
        console.error('Error fetching imported blogs:', error);
        toast.error('Failed to load imported blogs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchImportedBlogs();
  }, [filters]);
  
  // Fetch import statistics
  useEffect(() => {
    const fetchImportStats = async () => {
      try {
        const response = await blogService.getImportStats();
        
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching import stats:', error);
      }
    };
    
    fetchImportStats();
  }, [refreshing]);
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when filters change (except when changing page)
      page: key === 'page' ? value : 1
    }));
  };
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', filters.search);
  };
  
  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      source: 'all',
      category: 'all',
      page: 1,
      limit: 10
    });
  };
  
  // Toggle blog selection
  const toggleBlogSelection = (blogId) => {
    setSelectedBlogs(prev => {
      if (prev.includes(blogId)) {
        return prev.filter(id => id !== blogId);
      } else {
        return [...prev, blogId];
      }
    });
  };
  
  // Select/deselect all blogs
  const toggleSelectAll = () => {
    if (selectedBlogs.length === importedBlogs.length) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(importedBlogs.map(blog => blog._id));
    }
  };
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
  
  // Open view dialog
  const handleViewBlog = (blog) => {
    setCurrentBlog(blog);
    setViewDialogOpen(true);
  };
  
  // Open edit dialog
  const handleEditBlog = (blog) => {
    setCurrentBlog(blog);
    setEditDialogOpen(true);
  };
  
  // Handle blog field change in edit mode
  const handleBlogChange = (field, value) => {
    setCurrentBlog(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add tag to blog
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // Check if tag already exists
    if (currentBlog?.tags?.includes(tagInput.trim())) {
      toast.error('Tag already exists');
      return;
    }
    
    setCurrentBlog(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()]
    }));
    
    setTagInput('');
  };
  
  // Remove tag from blog
  const handleRemoveTag = (tag) => {
    setCurrentBlog(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  // Save edited blog
  const saveEditedBlog = async () => {
    if (!currentBlog) return;
    
    try {
      const response = await blogService.updateImportedContent(currentBlog._id, currentBlog);
      
      // Update blog in list
      setImportedBlogs(prev => 
        prev.map(blog => blog._id === currentBlog._id ? response.data : blog)
      );
      
      toast.success('Blog updated successfully');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating blog:', error);
      toast.error('Failed to update blog');
    }
  };
  
  // Approve selected blogs
  const approveSelectedBlogs = async () => {
    if (selectedBlogs.length === 0) {
      toast.info('No blogs selected');
      return;
    }
    
    try {
      const response = await blogService.approveImportedBlogs(selectedBlogs);
      
      toast.success(`${response.data.count} blogs approved`);
      
      // Remove approved blogs from the list
      setImportedBlogs(prev => 
        prev.filter(blog => !selectedBlogs.includes(blog._id))
      );
      
      // Clear selection
      setSelectedBlogs([]);
      
      // Refresh stats
      setRefreshing(prev => !prev);
    } catch (error) {
      console.error('Error approving blogs:', error);
      toast.error('Failed to approve blogs');
    }
  };
  
  // Reject selected blogs
  const rejectSelectedBlogs = async () => {
    if (selectedBlogs.length === 0) {
      toast.info('No blogs selected');
      return;
    }
    
    try {
      const response = await blogService.rejectImportedBlogs(selectedBlogs);
      
      toast.success(`${response.data.count} blogs rejected`);
      
      // Remove rejected blogs from the list
      setImportedBlogs(prev => 
        prev.filter(blog => !selectedBlogs.includes(blog._id))
      );
      
      // Clear selection
      setSelectedBlogs([]);
      
      // Refresh stats
      setRefreshing(prev => !prev);
    } catch (error) {
      console.error('Error rejecting blogs:', error);
      toast.error('Failed to reject blogs');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : ''}`}>Imported Blog Review</h1>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Review and manage content imported from external sources
          </p>
        </div>
        
        <Button 
          onClick={() => setRefreshing(prev => !prev)}
          variant="outline"
          className={isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : ''}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Pending Review
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : ''}`}>
                {stats.pending}
              </p>
            </div>
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-amber-50'}`}>
              <Clock className={isDarkMode ? 'h-5 w-5 text-amber-400' : 'h-5 w-5 text-amber-500'} />
            </div>
          </CardContent>
        </Card>
        
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Approved
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : ''}`}>
                {stats.approved}
              </p>
            </div>
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <Check className={isDarkMode ? 'h-5 w-5 text-green-400' : 'h-5 w-5 text-green-500'} />
            </div>
          </CardContent>
        </Card>
        
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Rejected
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : ''}`}>
                {stats.rejected}
              </p>
            </div>
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
              <X className={isDarkMode ? 'h-5 w-5 text-red-400' : 'h-5 w-5 text-red-500'} />
            </div>
          </CardContent>
        </Card>
        
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Imported
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : ''}`}>
                {stats.total}
              </p>
            </div>
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <FileText className={isDarkMode ? 'h-5 w-5 text-blue-400' : 'h-5 w-5 text-blue-500'} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="w-full md:w-1/3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search blogs..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className={`pl-10 w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </form>
            </div>
            
            {/* Source filter */}
            <div className="w-full md:w-1/4">
              <Select
                value={filters.source}
                onValueChange={(value) => handleFilterChange('source', value)}
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
                  <SelectItem value="Health Tips">Health Tips</SelectItem>
                  <SelectItem value="Motivation">Motivation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Reset filters button */}
            {(filters.search || filters.source !== 'all' || filters.category !== 'all') && (
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
                checked={selectedBlogs.length === importedBlogs.length && importedBlogs.length > 0}
                onCheckedChange={toggleSelectAll}
                id="select-all" 
                className={isDarkMode ? 'data-[state=checked]:bg-blue-600 border-gray-600' : ''}
              />
              <label 
                htmlFor="select-all" 
                className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {selectedBlogs.length === 0 
                  ? 'Select All' 
                  : `Selected ${selectedBlogs.length} of ${importedBlogs.length}`
                }
              </label>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={rejectSelectedBlogs}
                disabled={selectedBlogs.length === 0}
              >
                <X className="h-4 w-4 mr-2" />
                Reject Selected
              </Button>
              <Button
                size="sm"
                onClick={approveSelectedBlogs}
                disabled={selectedBlogs.length === 0}
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
                ) : importedBlogs.length === 0 ? (
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
                  importedBlogs.map((blog) => (
                    <TableRow key={blog._id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <TableCell className="pr-0">
                        <Checkbox 
                          checked={selectedBlogs.includes(blog._id)} 
                          onCheckedChange={() => toggleBlogSelection(blog._id)}
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
                            onClick={() => handleEditBlog(blog)}
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
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {importedBlogs.length} of {pagination.totalItems} results
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                  className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : ''}
                >
                  <ArrowLeft className="h-4 w-4" />
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
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* View Blog Dialog */}
      {currentBlog && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className={`max-w-3xl max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}`}>
            <DialogHeader>
              <DialogTitle>{currentBlog.title}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {/* Source info */}
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50'
              }`}>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Source Information
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Source:</span>
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {currentBlog.source?.name || 'Unknown'}
                    </span>
                    <Badge className={`ml-2 ${getSourceBadgeClass(currentBlog.source?.type)}`}>
                      {currentBlog.source?.type}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Imported:</span>
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {currentBlog.source?.importedAt 
                        ? formatDate(currentBlog.source.importedAt) 
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Category:</span>
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {currentBlog.category || 'Uncategorized'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Tags:</span>
                    <div className="ml-2 flex flex-wrap gap-1">
                      {currentBlog.tags?.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className={isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {!currentBlog.tags?.length && (
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No tags</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Original URL:</span>
                    <a 
                      href={currentBlog.source?.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isDarkMode ? 'ml-2 text-blue-400 hover:text-blue-300' : 'ml-2 text-blue-600 hover:text-blue-800'}
                    >
                      View Original Source
                      <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Content Preview
                </h4>
                <div 
                  className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                  } prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}
                  style={{ maxHeight: '400px', overflow: 'auto' }}
                >
                  <div dangerouslySetInnerHTML={{ __html: currentBlog.content }} />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      rejectSelectedBlogs([currentBlog._id]);
                      setViewDialogOpen(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewDialogOpen(false)}
                    className={isDarkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      approveSelectedBlogs([currentBlog._id]);
                      setViewDialogOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Blog Dialog */}
      {currentBlog && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className={`max-w-3xl ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}`}>
            <DialogHeader>
              <DialogTitle>Edit Imported Article</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title
                </label>
                <Input
                  value={currentBlog.title}
                  onChange={(e) => handleBlogChange('title', e.target.value)}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              
              {/* Meta Description */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Meta Description
                </label>
                <Textarea
                  value={currentBlog.metaDescription}
                  onChange={(e) => handleBlogChange('metaDescription', e.target.value)}
                  rows={2}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currentBlog.metaDescription?.length || 0}/160 characters recommended
                </p>
              </div>
              
              {/* Content */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Content
                </label>
                <Textarea
                  value={currentBlog.content}
                  onChange={(e) => handleBlogChange('content', e.target.value)}
                  rows={8}
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              
              {/* Category */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <Select
                  value={currentBlog.category}
                  onValueChange={(value) => handleBlogChange('category', value)}
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
              
              {/* Tags */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentBlog.tags?.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className={isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : ''}
                    >
                      {tag}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)} 
                      />
                    </Badge>
                  ))}
                </div>
                
                <div className="flex">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    className={`ml-2 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : ''}`}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className={isDarkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEditedBlog}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ImportedBlogsReview;