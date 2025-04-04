import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Grid, List, Calendar, Tag as TagIcon, 
  ChevronDown, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import blogService from '../services/blog.service';
import adService from '../services/adsense.js'; // Import the improved ad service
import BlogCard from '../components/blog/BlogCard';
import BlogSidebar from '../components/blog/BlogSideBar';
import AdBanner from '../components/blog/AdBanner'; // Import the improved AdBanner component
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useAuth } from '../stores/authStore';

const Blog = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [popularBlogs, setPopularBlogs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tag: '',
    author: '',
    sort: 'publishDate:desc',
    page: 1,
    limit: 12
  });
  
  // Detect dark mode preference
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
  
  // Initialize AdService
  useEffect(() => {
    // Initialize the ad service when the component mounts
    adService.init().catch(err => {
      console.warn('Ad service initialization warning:', err);
      // Continue with the app even if ad service fails
    });
  }, []);
  
  // Apply URL params to filters on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const newFilters = { ...filters };
    
    // Extract filter values from URL
    if (searchParams.has('search')) newFilters.search = searchParams.get('search');
    if (searchParams.has('category')) newFilters.category = searchParams.get('category');
    if (searchParams.has('tag')) newFilters.tag = searchParams.get('tag');
    if (searchParams.has('author')) newFilters.author = searchParams.get('author');
    if (searchParams.has('sort')) newFilters.sort = searchParams.get('sort');
    if (searchParams.has('page')) newFilters.page = parseInt(searchParams.get('page')) || 1;
    
    setFilters(newFilters);
  }, [location.search]);
  
  // Fetch blogs when filters change
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        // Fetch blogs with current filters
        const response = await blogService.getBlogs(filters);
        
        // Update state with blog data
        setBlogs(response.data);
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems
        });
        
        // Update URL with current filters
        updateUrl();
        
      } catch (error) {
        console.error('Error fetching blogs:', error);
        toast.error('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, [filters]);
  
  // Fetch categories, tags, and special blog lists
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, tagsResponse, featuredResponse, popularResponse] = await Promise.all([
          blogService.getCategories(),
          blogService.getTags(),
          blogService.getBlogs({ featured: true, limit: 4 }),
          blogService.getBlogs({ sort: 'analytics.views:desc', limit: 5 })
        ]);
        
        setCategories(categoriesResponse.data);
        setTags(tagsResponse.data);
        setFeaturedBlogs(featuredResponse.data);
        setPopularBlogs(popularResponse.data);
        
      } catch (error) {
        console.error('Error fetching blog metadata:', error);
      }
    };
    
    fetchData();
  }, []);
  
  // Update URL with current filters
  const updateUrl = () => {
    const params = new URLSearchParams();
    
    // Only add non-empty and non-default filters
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.author) params.set('author', filters.author);
    if (filters.sort !== 'publishDate:desc') params.set('sort', filters.sort);
    if (filters.page > 1) params.set('page', filters.page.toString());
    
    // Update URL without triggering a navigation
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  };
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to first page when changing filters other than page
      page: key === 'page' ? value : 1
    }));
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterChange('search', filters.search);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      tag: '',
      author: '',
      sort: 'publishDate:desc',
      page: 1,
      limit: 12
    });
  };
  
  // Navigate to a specific page
  const goToPage = (page) => {
    handleFilterChange('page', page);
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };
  
  // Get active filter count for mobile button badge
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.tag) count++;
    if (filters.author) count++;
    if (filters.sort !== 'publishDate:desc') count++;
    return count;
  };
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Ad Banner */}
      <div className="w-full py-4">
        <div className="container mx-auto px-4">
          <AdBanner
            position="top"
            className="max-w-5xl mx-auto"
          />
        </div>
      </div>
      
      {/* Blog Header */}
      <header className={`py-12 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-800 to-gray-900' 
          : 'bg-gradient-to-b from-blue-50 to-gray-50'
      }`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Blog & Articles
            </h1>
            <p className={`text-lg md:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Expert advice on fitness, nutrition, and achieving your health goals
            </p>
            
            {/* Search bar */}
            <div className="mt-8 max-w-lg mx-auto">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    className={`pr-10 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                  <button
                    type="submit"
                    className={`absolute inset-y-0 right-0 flex items-center px-3 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <Search size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-1/4 space-y-8">
            <BlogSidebar
              categories={categories}
              tags={tags}
              popularPosts={popularBlogs}
              featuredPosts={featuredBlogs}
              activeFilters={{
                category: filters.category,
                tag: filters.tag
              }}
              onFilterChange={handleFilterChange}
              isDarkMode={isDarkMode}
            />
          </aside>
          
          {/* Blog posts grid */}
          <div className="lg:w-3/4">
            {/* Mobile filters button */}
            <div className="flex lg:hidden justify-between items-center mb-6">
              <Button
                variant="outline"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className={isDarkMode ? 'border-gray-700 hover:bg-gray-800' : ''}
              >
                <SlidersHorizontal size={16} className="mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white">
                    {getActiveFilterCount()}
                  </span>
                )}
              </Button>
              
              <div className="flex items-center">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l ${
                    viewMode === 'grid' 
                      ? isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                      : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r ${
                    viewMode === 'list' 
                      ? isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                      : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
            
            {/* Mobile filters dialog */}
            <AnimatePresence>
              {mobileFiltersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`lg:hidden z-20 mb-6 p-4 rounded-lg shadow ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Filters</h3>
                    <button onClick={() => setMobileFiltersOpen(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Category filter */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Category
                      </label>
                      <Select 
                        value={filters.category} 
                        onValueChange={(value) => handleFilterChange('category', value)}
                      >
                        <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                          <SelectItem value="">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category._id} ({category.count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Tags filter */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Tag
                      </label>
                      <Select 
                        value={filters.tag} 
                        onValueChange={(value) => handleFilterChange('tag', value)}
                      >
                        <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                          <SelectValue placeholder="All Tags" />
                        </SelectTrigger>
                        <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                          <SelectItem value="">All Tags</SelectItem>
                          {tags.slice(0, 10).map((tag) => (
                            <SelectItem key={tag._id} value={tag._id}>
                              {tag._id} ({tag.count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Sort options */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Sort By
                      </label>
                      <Select
                        value={filters.sort}
                        onValueChange={(value) => handleFilterChange('sort', value)}
                      >
                        <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                          <SelectValue />
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
                    
                    {/* Clear filters button */}
                    {getActiveFilterCount() > 0 && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full mt-2"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Active filters display */}
            {getActiveFilterCount() > 0 && (
              <div className={`mb-6 p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Filter size={16} className="mr-2" />
                    <span className="text-sm font-medium">Active Filters:</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-sm"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.search && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'
                    }`}>
                      <Search size={12} />
                      <span>{filters.search}</span>
                      <button 
                        onClick={() => handleFilterChange('search', '')}
                        className="ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {filters.category && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'
                    }`}>
                      <TagIcon size={12} />
                      <span>{filters.category}</span>
                      <button 
                        onClick={() => handleFilterChange('category', '')}
                        className="ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {filters.tag && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'
                    }`}>
                      <TagIcon size={12} />
                      <span>{filters.tag}</span>
                      <button 
                        onClick={() => handleFilterChange('tag', '')}
                        className="ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {filters.sort !== 'publishDate:desc' && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-200'
                    }`}>
                      <span>
                        {filters.sort === 'publishDate:asc' ? 'Oldest First' :
                         filters.sort === 'analytics.views:desc' ? 'Most Viewed' :
                         filters.sort === 'analytics.likes:desc' ? 'Most Liked' :
                         filters.sort === 'title:asc' ? 'Title (A-Z)' :
                         filters.sort === 'title:desc' ? 'Title (Z-A)' : filters.sort}
                      </span>
                      <button 
                        onClick={() => handleFilterChange('sort', 'publishDate:desc')}
                        className="ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Desktop sorting and view options */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <div className="flex items-center">
                <span className={`mr-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sort by:
                </span>
                <Select
                  value={filters.sort}
                  onValueChange={(value) => handleFilterChange('sort', value)}
                >
                  <SelectTrigger className={`w-[180px] ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}>
                    <SelectValue />
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
              
              <div className="flex items-center">
                <span className={`mr-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  View:
                </span>
                <div className="flex">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-l ${
                      viewMode === 'grid' 
                        ? isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                        : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-r ${
                      viewMode === 'list' 
                        ? isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                        : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Blog posts */}
            {loading ? (
              // Loading skeleton
              <div className={`grid ${
                viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              } gap-6`}>
                {[...Array(6)].map((_, index) => (
                  <div 
                    key={index} 
                    className={`animate-pulse rounded-lg overflow-hidden ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                  >
                    <div className={`h-48 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                    <div className="p-5 space-y-3">
                      <div className={`h-6 rounded ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-4 rounded ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-4 rounded ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}></div>
                      <div className="flex space-x-2">
                        <div className={`h-4 w-20 rounded ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                        <div className={`h-4 w-20 rounded ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              // Empty state
              <div className={`text-center py-16 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-lg`}>
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
                  <Filter className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No blog posts found</h3>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Try adjusting your search or filters
                </p>
                {getActiveFilterCount() > 0 && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              // Blog posts grid
              <div className={`grid ${
                viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              } gap-6`}>
                {blogs.map((blog) => (
                  <BlogCard 
                    key={blog._id} 
                    blog={blog}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            )}
            
            {/* In-content ad after the 6th post */}
            {blogs.length > 6 && (
              <div className="my-8">
                <AdBanner
                  position="in-content"
                  className="max-w-3xl mx-auto"
                />
              </div>
            )}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    onClick={() => goToPage(Math.max(1, filters.page - 1))}
                    disabled={filters.page === 1}
                    className={`px-3 ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : ''}`}
                  >
                    <ChevronLeft size={18} />
                  </Button>
                  
                  {Array.from({ length: pagination.totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    
                    // Show first, last, current and adjacent pages
                    if (
                      pageNumber === 1 ||
                      pageNumber === pagination.totalPages ||
                      (pageNumber >= filters.page - 1 && pageNumber <= filters.page + 1)
                    ) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === filters.page ? 'default' : 'outline'}
                          onClick={() => goToPage(pageNumber)}
                          className={pageNumber === filters.page ? '' : isDarkMode ? 'border-gray-700 hover:bg-gray-800' : ''}
                        >
                          {pageNumber}
                        </Button>
                      );
                    }
                    
                    // Show ellipsis for skipped pages
                    if (
                      (pageNumber === 2 && filters.page > 3) ||
                      (pageNumber === pagination.totalPages - 1 && filters.page < pagination.totalPages - 2)
                    ) {
                      return (
                        <Button
                          key={`ellipsis-${pageNumber}`}
                          variant="outline"
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
                    onClick={() => goToPage(Math.min(pagination.totalPages, filters.page + 1))}
                    disabled={filters.page === pagination.totalPages}
                    className={`px-3 ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : ''}`}
                  >
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;