import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Clock, Tag, User, Calendar, ChevronLeft, ChevronRight, Filter, Search, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import AdBanner from '../components/blog/AdBanner';
import BlogSidebar from '../components/blog/BlogSideBar';
import BlogCard from '../components/blog/BlogCard';
import { toast } from 'sonner';

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [sidebar, setSidebar] = useState({
    popularPosts: [],
    featuredPosts: []
  });
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    tag: searchParams.get('tag') || '',
    search: searchParams.get('search') || '',
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      const currentTheme = localStorage.getItem('siteTheme');
      setIsDarkMode(currentTheme === 'dark');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // Fetch blogs with current filters
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const page = searchParams.get('page') || 1;
        const category = searchParams.get('category') || '';
        const tag = searchParams.get('tag') || '';
        const search = searchParams.get('search') || '';
        
        // Update filters state
        setFilters({
          category,
          tag,
          search
        });
        
        // Build query string
        let queryString = `page=${page}&limit=9`;
        if (category) queryString += `&category=${category}`;
        if (tag) queryString += `&tag=${tag}`;
        if (search) queryString += `&search=${search}`;
        
        const response = await api.get(`/blog?${queryString}`);
        
        setBlogs(response.data.data);
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages
        });
      } catch (error) {
        console.error('Error fetching blogs:', error);
        toast.error('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, [searchParams]);
  
  // Fetch categories, tags, and sidebar data
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const [categoriesRes, tagsRes, popularRes, featuredRes] = await Promise.all([
          api.get('/blog/categories'),
          api.get('/blog/tags'),
          api.get('/blog?sort=analytics.views:desc&limit=5'),
          api.get('/blog?featured=true&limit=3')
        ]);
        
        setCategories(categoriesRes.data.data);
        setTags(tagsRes.data.data);
        setSidebar({
          popularPosts: popularRes.data.data,
          featuredPosts: featuredRes.data.data
        });
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      }
    };
    
    fetchSidebarData();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    // Reset to page 1 when filters change
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };
  
  // Handle search submissions
  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', filters.search);
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      tag: '',
      search: ''
    });
    
    setSearchParams({ page: '1' });
  };
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Ad Banner */}
      <AdBanner
        position="top"
        adCode={`
          <div id="div-gpt-ad-123456789-0" style="min-height: 90px; width: 100%;">
            <script>
              googletag.cmd.push(function() {
                googletag.display('div-gpt-ad-123456789-0');
              });
            </script>
          </div>
        `}
      />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
            GymJams Blog
          </h1>
          <p className="text-xl text-blue-100 text-center mt-4 max-w-2xl mx-auto">
            Expert advice, workout tips, and the latest in fitness trends
          </p>
          
          {/* Search Bar */}
          <form 
            onSubmit={handleSearch} 
            className="max-w-md mx-auto mt-8 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search articles..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10 w-full bg-white/90 border-0 focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              Search
            </Button>
          </form>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filters Toggle */}
          <div className="lg:hidden mb-4">
            <Button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline"
              className={`w-full flex items-center justify-between ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}`}
            >
              <span className="flex items-center">
                <Filter size={18} className="mr-2" />
                Filters
              </span>
              {filters.category || filters.tag ? (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Active
                </span>
              ) : null}
            </Button>
          </div>
          
          {/* Mobile Filters */}
          {showMobileFilters && (
            <div className="lg:hidden mb-6 p-4 rounded-lg border border-gray-200 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMobileFilters(false)}
                >
                  <X size={18} />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <h4 className="font-medium mb-2 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Categories
                  </h4>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => {
                          handleFilterChange('category', 
                            filters.category === cat._id ? '' : cat._id
                          );
                          setShowMobileFilters(false);
                        }}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                          filters.category === cat._id
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {cat._id} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Tags */}
                <div>
                  <h4 className="font-medium mb-2 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Popular Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 10).map((tag) => (
                      <button
                        key={tag._id}
                        onClick={() => {
                          handleFilterChange('tag', 
                            filters.tag === tag._id ? '' : tag._id
                          );
                          setShowMobileFilters(false);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          filters.tag === tag._id
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tag._id} ({tag.count})
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Clear Filters */}
                {(filters.category || filters.tag) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearFilters();
                      setShowMobileFilters(false);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <X size={16} className="mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Main Content Area */}
          <div className="lg:w-2/3">
            {/* Active Filters */}
            {(filters.category || filters.tag || filters.search) && (
              <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Active Filters:</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className={`text-red-600 hover:text-red-700 ${isDarkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
                  >
                    <X size={16} className="mr-1" />
                    Clear all
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.category && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                      <span>Category: {filters.category}</span>
                      <button
                        onClick={() => handleFilterChange('category', '')}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  
                  {filters.tag && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                      <span>Tag: {filters.tag}</span>
                      <button
                        onClick={() => handleFilterChange('tag', '')}
                        className="ml-1 hover:text-green-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  
                  {filters.search && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                      <span>Search: {filters.search}</span>
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="ml-1 hover:text-purple-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Blog Posts */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg overflow-hidden animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
                  >
                    <div className="h-48 w-full bg-gray-300 dark:bg-gray-700"></div>
                    <div className="p-4 space-y-4">
                      <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="text-6xl mb-4">😕</div>
                <h3 className="text-xl font-semibold mb-2">No blog posts found</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                {/* In-line Ad (after 3 posts) */}
                {blogs.length > 3 && (
                  <div className="my-6">
                    <AdBanner
                      position="in-content"
                      adCode={`
                        <div id="div-gpt-ad-123456789-1" style="min-height: 250px; width: 100%;">
                          <script>
                            googletag.cmd.push(function() {
                              googletag.display('div-gpt-ad-123456789-1');
                            });
                          </script>
                        </div>
                      `}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blogs.map((blog) => (
                    <BlogCard 
                      key={blog._id} 
                      blog={blog}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
                
                {/* Bottom Ad */}
                <div className="my-8">
                  <AdBanner
                    position="bottom"
                    adCode={`
                      <div id="div-gpt-ad-123456789-2" style="min-height: 250px; width: 100%;">
                        <script>
                          googletag.cmd.push(function() {
                            googletag.display('div-gpt-ad-123456789-2');
                          });
                        </script>
                      </div>
                    `}
                  />
                </div>
              </>
            )}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex space-x-1">
                  <Button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    variant="outline"
                    size="sm"
                    className={isDarkMode ? 'border-gray-700' : ''}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  
                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <Button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      variant={pagination.currentPage === index + 1 ? "default" : "outline"}
                      size="sm"
                      className={isDarkMode && pagination.currentPage !== index + 1 ? 'border-gray-700' : ''}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  
                  <Button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    variant="outline"
                    size="sm"
                    className={isDarkMode ? 'border-gray-700' : ''}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3">
            <BlogSidebar
              categories={categories}
              tags={tags.slice(0, 15)}
              popularPosts={sidebar.popularPosts}
              featuredPosts={sidebar.featuredPosts}
              activeFilters={filters}
              onFilterChange={handleFilterChange}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;