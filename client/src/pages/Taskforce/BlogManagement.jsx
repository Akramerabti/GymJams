import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Edit, Trash2, Eye, AlertTriangle, ChevronLeft, ChevronRight,
  Search, Filter, X, BarChart, ExternalLink, Tag, Calendar, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import blogService from '../../services/blog.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
    status: '',
    category: '',
    page: 1,
    limit: 10,
    sort: 'publishDate:desc'
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

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

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        // Author ID is used to get both published and draft blogs for the current user
        const authorParams = user?.role === 'admin' ? {} : { author: user?.id };
        
        const response = await blogService.getBlogs({
          ...filters,
          ...authorParams
        });
        
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
    
    fetchBlogs();
  }, [filters, user]);

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

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', filters.search);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      page: 1,
      limit: 10,
      sort: 'publishDate:desc'
    });
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
      icon: <Clock className="h-5 w-5 text-purple-500" />,
      color: 'border-purple-100 dark:border-purple-900'
    },
    {
      title: 'Likes',
      value: analytics.totalLikes.toLocaleString(),
      icon: <Calendar className="h-5 w-5 text-red-500" />,
      color: 'border-red-100 dark:border-red-900'
    }
  ];

  // Ad revenue analytics (admin only)
  const adRevenueSummary = [
    {
      title: 'Ad Impressions',
      value: analytics.adImpressions.toLocaleString(),
      delta: '+12%',
      deltaType: 'increase'
    },
    {
      title: 'Ad Clicks',
      value: analytics.adClicks.toLocaleString(),
      delta: '+5.2%',
      deltaType: 'increase'
    },
    {
      title: 'Ad Revenue',
      value: `$${analytics.adRevenue.toFixed(2)}`,
      delta: '+8.1%',
      deltaType: 'increase'
    }
  ];

  // Check if user has access to this page
  if (!user || (user.role !== 'admin' && user.role !== 'coach')) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You don't have permission to access this page.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Header and Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Blog Management</h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Manage your blog posts and analytics
              </p>
            </div>
            
            <div className="flex space-x-3">
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
                  className={isDarkMode ? 'border-gray-700 hover:border-gray-600' : ''}
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Analytics Dashboard
                </Button>
              )}
            </div>
          </div>
          
          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analyticsSummary.map((item, index) => (
              <Card 
                key={index} 
                className={`border-l-4 ${item.color} ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
                }`}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.title}
                    </p>
                    <p className="text-2xl font-bold mt-1">{item.value}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-full dark:bg-gray-700">
                    {item.icon}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Ad Revenue Summary (Admin Only) */}
          {user.role === 'admin' && (
            <div className={`p-5 rounded-lg ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'
            }`}>
              <h2 className="text-lg font-semibold mb-4">Ad Revenue Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {adRevenueSummary.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-md ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.title}
                    </p>
                    <div className="flex items-baseline mt-1">
                      <p className="text-2xl font-bold mr-2">{item.value}</p>
                      <span className={`text-xs ${
                        item.deltaType === 'increase' 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {item.delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right mt-4">
                <Button 
                  variant="link" 
                  className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                  onClick={() => navigate('/admin/blog/revenue')}
                >
                  View detailed report
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Filters */}
          <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              {/* Search box */}
              <div className="w-full md:w-1/3">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search blog posts..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className={`pl-10 w-full ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                    }`}
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
                    <SelectItem value="">All Status</SelectItem>
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
                    <SelectItem value="">All Categories</SelectItem>
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
              {(filters.search || filters.status || filters.category) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className={`px-2.5 ${isDarkMode ? 'text-gray-300 hover:text-white' : ''}`}
                >
                  <X size={16} className="mr-1" />
                  Reset
                </Button>
              )}
            </div>
            
            {/* Blog posts table */}
            <div className="overflow-x-auto border rounded-md dark:border-gray-700">
              <Table>
                <TableHeader className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <TableRow>
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
                      <TableRow key={index}>
                        {[...Array(6)].map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <div className={`h-5 w-full rounded animate-pulse ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : blogs.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <div className={`p-3 rounded-full ${
                            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                          }`}>
                            <Filter className={`h-6 w-6 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                          </div>
                          <h3 className="mt-2 text-base font-medium">No blog posts found</h3>
                          <p className={`mt-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Blog posts list
                    blogs.map((blog) => (
                      <TableRow 
                        key={blog._id}
                        className={isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}
                      >
                        <TableCell className="font-medium">
                          {blog.title.length > 60 
                            ? `${blog.title.substring(0, 60)}...` 
                            : blog.title}
                        </TableCell>
                        <TableCell>{blog.category}</TableCell>
                        <TableCell>{getStatusBadge(blog.status)}</TableCell>
                        <TableCell>{formatDate(blog.publishDate)}</TableCell>
                        <TableCell className="text-right">{blog.analytics.views.toLocaleString()}</TableCell>
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
                            <DropdownMenuContent align="end" className={
                              isDarkMode ? 'bg-gray-800 border-gray-700' : ''
                            }>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/blog/${blog.slug}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/blog/edit/${blog.slug}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(blog)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                              {user.role === 'admin' && (
                                <DropdownMenuItem onClick={() => navigate(`/admin/blog/ads/${blog.slug}`)}>
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
                <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Showing {blogs.length} of {pagination.totalItems} results
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                    disabled={filters.page === 1}
                    className={isDarkMode ? 'border-gray-700' : ''}
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
                          className={isDarkMode && !isCurrentPage ? 'border-gray-700' : ''}
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
                          className={isDarkMode ? 'border-gray-700' : ''}
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
                    className={isDarkMode ? 'border-gray-700' : ''}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete the blog post:</p>
            <p className="font-medium mt-2">"{blogToDelete?.title}"</p>
            <div className="mt-4 flex items-center p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md">
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
    </div>
  );
};

export default BlogManagement;