// BlogSidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import AdBanner from './AdBanner';

const BlogSidebar = ({ 
  categories, 
  tags, 
  popularPosts,
  featuredPosts,
  activeFilters,
  onFilterChange,
  isDarkMode
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onFilterChange('search', searchQuery);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="space-y-8">
      {/* Search */}
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 ${isDarkMode ? 'bg-gray-700 border-gray-700 text-white' : ''}`}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
          >
            Search
          </Button>
        </form>
      </div>
      
      {/* Featured Posts */}
      {featuredPosts?.length > 0 && (
        <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="p-6 pb-3">
            <h3 className="font-bold text-lg mb-2">Featured Posts</h3>
          </div>
          
          <div className="px-6 pb-6 space-y-4">
            {featuredPosts.map((post) => (
              <Link 
                key={post._id} 
                to={`/blog/${post.slug}`}
                className="block"
              >
                <div className="flex gap-3">
                  {post.featuredImage?.url ? (
                    <img 
                      src={post.featuredImage.url}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <span>📷</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className={`font-medium line-clamp-2 text-sm ${
                      isDarkMode ? 'text-white hover:text-blue-300' : 'hover:text-blue-600'
                    }`}>
                      {post.title}
                    </h4>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(post.publishDate)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Ad Banner */}
      <div>
        <AdBanner
          position="sidebar"
          adCode={`
            <div id="div-gpt-ad-123456789-4" style="min-height: 250px; width: 100%;">
              <script>
                googletag.cmd.push(function() {
                  googletag.display('div-gpt-ad-123456789-4');
                });
              </script>
            </div>
          `}
        />
      </div>
      
      {/* Categories */}
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <h3 className="font-bold text-lg mb-4">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => onFilterChange(
                'category', 
                activeFilters.category === category._id ? '' : category._id
              )}
              className={`flex items-center justify-between w-full p-2 rounded-md text-sm ${
                activeFilters.category === category._id
                  ? isDarkMode 
                    ? 'bg-blue-900 text-blue-100' 
                    : 'bg-blue-100 text-blue-800'
                  : isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'hover:bg-gray-100'
              }`}
            >
              <span>{category._id}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Popular Posts */}
      {popularPosts?.length > 0 && (
        <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="font-bold text-lg mb-4">Popular Posts</h3>
          <div className="space-y-4">
            {popularPosts.map((post, index) => (
              <Link 
                key={post._id}
                to={`/blog/${post.slug}`}
                className="block group"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    index < 3
                      ? isDarkMode 
                        ? 'bg-blue-900 text-blue-100' 
                        : 'bg-blue-100 text-blue-800'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <h4 className={`text-sm group-hover:underline line-clamp-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    {post.title}
                  </h4>
                </div>
              </Link>
            ))}
            
            <Link 
              to="/blog?sort=views:desc"
              className={`inline-flex items-center text-sm font-medium ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <span>View all popular posts</span>
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      )}
      
      {/* Tags */}
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <h3 className="font-bold text-lg mb-4">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag._id}
              onClick={() => onFilterChange(
                'tag', 
                activeFilters.tag === tag._id ? '' : tag._id
              )}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                activeFilters.tag === tag._id
                  ? isDarkMode 
                    ? 'bg-blue-900 text-blue-100' 
                    : 'bg-blue-100 text-blue-800'
                  : isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {tag._id} ({tag.count})
            </button>
          ))}
        </div>
      </div>
      
      {/* Newsletter Signup */}
      <div className={`rounded-lg p-6 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-blue-900 to-indigo-900' 
          : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Subscribe to Our Newsletter
        </h3>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-blue-100' : 'text-gray-700'}`}>
          Get the latest fitness tips and exclusive content delivered to your inbox.
        </p>
        
        <form className="space-y-3">
          <Input
            type="email"
            placeholder="Your email address"
            className={isDarkMode ? 'bg-blue-800/50 border-blue-700 text-white placeholder:text-blue-300' : ''}
          />
          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
            Subscribe
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BlogSidebar;


