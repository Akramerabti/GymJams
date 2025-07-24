// src/pages/Blog.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, Filter, ChevronRight, ChevronLeft, CalendarIcon, 
  Clock, User, TagIcon, Grid, List, SlidersHorizontal, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import blogService from '../services/blog.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import BlogCard from '../components/blog/BlogCard';
import BlogSidebar from '../components/blog/BlogSideBar';
import AdBanner from '../components/blog/AdBanner';
import { useAuth } from '../stores/authStore';

const Blog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const contentRef = useRef(null);
  
  // State for blog posts and metadata
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  // Categories and tags
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
    author: '',
    sort: 'publishDate:desc',
    page: 1,
    limit: 9
  });
  
  // Parse query params on mount and when URL changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    
    const newFilters = {
      ...filters,
      search: queryParams.get('search') || '',
      category: queryParams.get('category') || '',
      tag: queryParams.get('tag') || '',
      author: queryParams.get('author') || '',
      sort: queryParams.get('sort') || 'publishDate:desc',
      page: parseInt(queryParams.get('page') || '1', 10)
    };
    
    setFilters(newFilters);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  
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
  
  // Fetch blog posts based on filters
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Convert filters to query params
        const queryParams = { ...filters };
        
        // Filter out empty values
        Object.keys(queryParams).forEach(key => {
          if (!queryParams[key]) delete queryParams[key];
        });
        
        // Fetch blog posts with filters
        const response = await blogService.getBlogs(queryParams);
        
        setPosts(response.data || []);
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems
        });
        
        // If first page, also fetch featured and popular posts
        if (queryParams.page === 1 || !queryParams.page) {
          // Fetch featured posts (most recent with featured flag)
          const featuredResponse = await blogService.getBlogs({
            limit: 3, 
            featured: true,
            sort: 'publishDate:desc'
          });
          setFeaturedPosts(featuredResponse.data || []);
          
          // Fetch popular posts (most viewed)
          const popularResponse = await blogService.getBlogs({
            limit: 5,
            sort: 'analytics.views:desc'
          });
          setPopularPosts(popularResponse.data || []);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, [filters]);
  
  // Fetch categories and tags
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          blogService.getCategories(),
          blogService.getTags()
        ]);
        
        setCategories(categoriesResponse.data || []);
        setTags(tagsResponse.data || []);
      } catch (error) {
        console.error('Error fetching categories and tags:', error);
      }
    };
    
    fetchCategoriesAndTags();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    // Create new filters object
    const newFilters = {
      ...filters,
      [key]: value,
      // Reset to page 1 when filters change (except for page changes)
      page: key === 'page' ? value : 1
    };
    
    // Update URL with new filters
    const queryParams = new URLSearchParams();
    
    // Only add non-empty values to query params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && key !== 'limit') {
        queryParams.append(key, value);
      }
    });
    
    // Navigate to new URL
    navigate(`${location.pathname}?${queryParams.toString()}`);
    
    // Update filters state
    setFilters(newFilters);
  };
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', filters.search);
  };
  
  // Clear filters
  const clearFilters = () => {
    navigate(`${location.pathname}`);
    
    setFilters({
      search: '',
      category: '',
      tag: '',
      author: '',
      sort: 'publishDate:desc',
      page: 1,
      limit: 9
    });
  };
  
  // Get page numbers to display
  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pageNumbers = [];
    
    // Always show first and last pages
    if (totalPages <= 5) {
      // If total pages <= 5, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page
      pageNumbers.push(1);
      
      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.tag) count++;
    if (filters.author) count++;
    if (filters.sort && filters.sort !== 'publishDate:desc') count++;
    return count;
  };
  
  // Render loading state
  if (loading && posts.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render error state
  if (error && posts.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'
      }`}>
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen mt-10 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Hero section with featured post */}
      {featuredPosts.length > 0 && !filters.search && !filters.category && !filters.tag && filters.page === 1 && (
        <div className={`py-16 ${isDarkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-blue-50 to-gray-50'}`}>
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main featured post */}
                <div className="lg:col-span-3">
                  <Link to={`/blog/${featuredPosts[0]?.slug}`} className="block group">
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      {featuredPosts[0]?.featuredImage?.url ? (
                        <div className="relative h-80 overflow-hidden">
                          <img
                            src={featuredPosts[0].featuredImage.url}
                            alt={featuredPosts[0].title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 p-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                              isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {featuredPosts[0].category}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2 group-hover:underline">
                              {featuredPosts[0].title}
                            </h2>
                            <p className="text-gray-200 mb-2 line-clamp-2">
                              {featuredPosts[0].metaDescription}
                            </p>
                            <div className="flex items-center text-gray-300 text-sm">
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {formatDate(featuredPosts[0].publishDate)}
                              </span>
                              <span className="mx-2">•</span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {featuredPosts[0].readingTime} min read
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`relative h-80 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl">📝</span>
                          </div>
                          <div className="absolute bottom-0 left-0 p-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                              {featuredPosts[0].title}
                            </h2>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
                
                {/* Secondary featured posts */}
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    {featuredPosts.slice(1, 3).map((post, index) => (
                      <Link key={post._id} to={`/blog/${post.slug}`} className="block group">
                        <div className="rounded-lg overflow-hidden shadow-lg">
                          <div className="grid grid-cols-5">
                            {/* Image */}
                            <div className="col-span-2">
                              {post.featuredImage?.url ? (
                                <div className="h-32 overflow-hidden">
                                  <img
                                    src={post.featuredImage.url}
                                    alt={post.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                              ) : (
                                <div className={`h-32 flex items-center justify-center ${
                                  isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                }`}>
                                  <span className="text-2xl">📝</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="col-span-3 p-4">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                                isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {post.category}
                              </span>
                              <h3 className={`font-bold mb-2 line-clamp-2 group-hover:underline ${
                                isDarkMode ? 'text-white' : 'text-gray-800'
                              }`}>
                                {post.title}
                              </h3>
                              <div className={`flex items-center text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {post.readingTime} min
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Ad banner (top) */}
      <div className="max-w-5xl mx-auto my-8">
        <AdBanner position="top" className="mx-auto" />
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Blog
            </h1>
            
            {user?.role === 'admin' || user?.role === 'taskforce' ? (
              <Button
                onClick={() => navigate('/admin/blog/new')}
                className="mt-4 md:mt-0"
              >
                New Post
              </Button>
            ) : null}
          </div>
          
          {/* Filters */}
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 mb-8">
            {/* Search form */}
            <div className="lg:w-2/3">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search blog posts..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className={`pl-10 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
                  />
                </div>
                <Button type="submit">
                  Search
                </Button>
              </form>
            </div>
            
            {/* Filter button on mobile */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                onClick={() => setFiltersOpen(true)}
                className={`w-full justify-between ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''
                }`}
              >
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Filters</span>
                </div>
                {getActiveFilterCount() > 0 && (
                  <span className={`ml-2 h-5 w-5 rounded-full text-xs flex items-center justify-center ${
                    isDarkMode ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getActiveFilterCount()}
                  </span>
                )}
              </Button>
            </div>
            
            {/* Sort and view options */}
            <div className="flex space-x-2 lg:w-1/3">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className={`rounded-md border text-sm px-3 py-2 flex-grow ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
                }`}
              >
                <option value="publishDate:desc">Newest First</option>
                <option value="publishDate:asc">Oldest First</option>
                <option value="analytics.views:desc">Most Viewed</option>
                <option value="title:asc">Title (A-Z)</option>
                <option value="title:desc">Title (Z-A)</option>
                <option value="analytics.likes:desc">Most Liked</option>
              </select>
              
              {/* View mode toggle */}
              <div className={`flex rounded-md border ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 flex items-center justify-center ${
                    viewMode === 'grid' 
                      ? isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-100 text-gray-800'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 flex items-center justify-center ${
                    viewMode === 'list' 
                      ? isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-100 text-gray-800'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Filter pills */}
          {getActiveFilterCount() > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.category && (
                <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                }`}>
                  <span>Category: {filters.category}</span>
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="ml-2 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {filters.tag && (
                <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                }`}>
                  <span>Tag: {filters.tag}</span>
                  <button
                    onClick={() => handleFilterChange('tag', '')}
                    className="ml-2 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {filters.author && (
                <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                }`}>
                  <span>Author: {filters.author}</span>
                  <button
                    onClick={() => handleFilterChange('author', '')}
                    className="ml-2 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {filters.search && (
                <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  isDarkMode ? 'bg-amber-900 text-amber-200' : 'bg-amber-100 text-amber-800'
                }`}>
                  <span>Search: {filters.search}</span>
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-2 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {filters.sort && filters.sort !== 'publishDate:desc' && (
                <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                }`}>
                  <span>
                    Sort: {
                      filters.sort === 'publishDate:asc' ? 'Oldest First' :
                      filters.sort === 'analytics.views:desc' ? 'Most Viewed' :
                      filters.sort === 'title:asc' ? 'Title (A-Z)' :
                      filters.sort === 'title:desc' ? 'Title (Z-A)' :
                      filters.sort === 'analytics.likes:desc' ? 'Most Liked' :
                      filters.sort
                    }
                  </span>
                  <button
                    onClick={() => handleFilterChange('sort', 'publishDate:desc')}
                    className="ml-2 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <button
                onClick={clearFilters}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                }`}
              >
                <span>Clear all</span>
                <X className="h-3 w-3 ml-1" />
              </button>
            </div>
          )}
          
          {/* Main content area */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Blog posts */}
            <div className="lg:w-2/3">
              {/* No results message */}
              {posts.length === 0 && !loading ? (
                <div className={`flex flex-col items-center justify-center py-16 px-4 text-center rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white shadow'
                }`}>
                  <Filter className={`h-12 w-12 mb-4 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <h3 className="text-xl font-bold mb-2">No blog posts found</h3>
                  <p className={`max-w-md mb-6 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    We couldn't find any blog posts matching your search criteria. Try adjusting your filters or browse our latest posts.
                  </p>
                  <Button onClick={clearFilters}>
                    View all posts
                  </Button>
                </div>
              ) : (
                <>
                  {/* Grid view */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                      {posts.map((post) => (
                        <BlogCard key={post._id} blog={post} isDarkMode={isDarkMode} />
                      ))}
                    </div>
                  )}
                  
                  {/* List view */}
                  {viewMode === 'list' && (
                    <div className="space-y-6">
                      {posts.map((post) => (
                        <div key={post._id} className={`rounded-lg overflow-hidden ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white shadow'
                        }`}>
                          <div className="flex flex-col md:flex-row">
                            {/* Image */}
                            {post.featuredImage?.url ? (
                              <div className="md:w-1/3">
                                <Link to={`/blog/${post.slug}`}>
                                  <div className="h-48 md:h-full overflow-hidden">
                                    <img
                                      src={post.featuredImage.url}
                                      alt={post.title}
                                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                  </div>
                                </Link>
                              </div>
                            ) : (
                              <div className={`md:w-1/3 h-48 md:h-auto flex items-center justify-center ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                <span className="text-4xl">📝</span>
                              </div>
                            )}
                            
                            {/* Content */}
                            <div className="md:w-2/3 p-6">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Link
                                  to={`/blog?category=${post.category}`}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {post.category}
                                </Link>
                                
                                <div className={`flex items-center text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{post.readingTime} min read</span>
                                </div>
                              </div>
                              
                              <Link to={`/blog/${post.slug}`}>
                                <h2 className={`text-xl font-bold mb-3 hover:underline ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {post.title}
                                </h2>
                              </Link>
                              
                              <p className={`mb-4 line-clamp-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {post.metaDescription}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-3">
                                    {post.author?.profileImage ? (
                                      <img
                                        src={post.author.profileImage}
                                        alt={`${post.author.firstName} ${post.author.lastName}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className={`w-full h-full flex items-center justify-center ${
                                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                                      }`}>
                                        <User className="h-4 w-4 text-gray-500" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <Link
                                      to={`/blog?author=${post.author?._id}`}
                                      className={`text-sm font-medium hover:underline ${
                                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                      }`}
                                    >
                                      {post.author?.firstName} {post.author?.lastName}
                                    </Link>
                                    <p className={`text-xs ${
                                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      {formatDate(post.publishDate)}
                                    </p>
                                  </div>
                                </div>
                                
                                <Link
                                  to={`/blog/${post.slug}`}
                                  className={`flex items-center text-sm ${
                                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                                  }`}
                                >
                                  <span>Read more</span>
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* In-content ad */}
                  {posts.length > 3 && (
                    <div className="my-8">
                      <AdBanner position="inContent" className="mx-auto" />
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-12">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          onClick={() => handleFilterChange('page', Math.max(1, pagination.currentPage - 1))}
                          disabled={pagination.currentPage === 1}
                          className={`${isDarkMode ? 'border-gray-700 text-gray-300' : ''}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {getPageNumbers().map((page, index) => (
                          <React.Fragment key={index}>
                            {page === '...' ? (
                              <span className={`px-4 py-2 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>...</span>
                            ) : (
                              <Button
                                variant={page === pagination.currentPage ? 'default' : 'outline'}
                                onClick={() => handleFilterChange('page', page)}
                                className={page === pagination.currentPage ? '' : isDarkMode ? 'border-gray-700 text-gray-300' : ''}
                              >
                                {page}
                              </Button>
                            )}
                          </React.Fragment>
                        ))}
                        
                        <Button
                          variant="outline"
                          onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, pagination.currentPage + 1))}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className={`${isDarkMode ? 'border-gray-700 text-gray-300' : ''}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="lg:w-1/3">
              <div className="sticky top-20">
                <BlogSidebar
                  categories={categories}
                  tags={tags}
                  popularPosts={popularPosts}
                  featuredPosts={featuredPosts.slice(0, 3)}
                  activeFilters={filters}
                  onFilterChange={handleFilterChange}
                  isDarkMode={isDarkMode}
                />
                
                {/* Sidebar ad */}
                <div className="mt-8">
                  <AdBanner position="sidebar" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile filters drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex lg:hidden"
            onClick={() => setFiltersOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`ml-auto w-4/5 max-w-sm h-full overflow-y-auto ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center">
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  <h3 className="text-lg font-semibold">Filters</h3>
                </div>
                <button onClick={() => setFiltersOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-6">
                {/* Categories */}
                <div>
                  <h4 className="font-medium mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => {
                          handleFilterChange('category', category._id);
                          setFiltersOpen(false);
                        }}
                        className={`flex justify-between w-full p-2 rounded-md text-sm ${
                          filters.category === category._id
                            ? isDarkMode 
                              ? 'bg-blue-900 text-blue-100' 
                              : 'bg-blue-100 text-blue-800'
                            : isDarkMode 
                              ? 'text-gray-300 hover:bg-gray-800' 
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        <span>{category._id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {category.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Tags */}
                <div>
                  <h4 className="font-medium mb-3">Popular Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag._id}
                        onClick={() => {
                          handleFilterChange('tag', tag._id);
                          setFiltersOpen(false);
                        }}
                        className={`px-3 py-1 rounded-full text-xs ${
                          filters.tag === tag._id
                            ? isDarkMode 
                              ? 'bg-blue-900 text-blue-100' 
                              : 'bg-blue-100 text-blue-800'
                            : isDarkMode 
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {tag._id} ({tag.count})
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sort options */}
                <div>
                  <h4 className="font-medium mb-3">Sort By</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'publishDate:desc', label: 'Newest First' },
                      { value: 'publishDate:asc', label: 'Oldest First' },
                      { value: 'analytics.views:desc', label: 'Most Viewed' },
                      { value: 'analytics.likes:desc', label: 'Most Liked' },
                      { value: 'title:asc', label: 'Title (A-Z)' },
                      { value: 'title:desc', label: 'Title (Z-A)' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleFilterChange('sort', option.value);
                          setFiltersOpen(false);
                        }}
                        className={`flex w-full p-2 rounded-md text-sm ${
                          filters.sort === option.value
                            ? isDarkMode 
                              ? 'bg-blue-900 text-blue-100' 
                              : 'bg-blue-100 text-blue-800'
                            : isDarkMode 
                              ? 'text-gray-300 hover:bg-gray-800' 
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Clear filters */}
                {getActiveFilterCount() > 0 && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        clearFilters();
                        setFiltersOpen(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Blog;