// BlogCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User } from 'lucide-react';

export const BlogCard = ({ blog, isDarkMode }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div 
      className={`rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:-translate-y-1 ${
        isDarkMode ? 'bg-gray-800 hover:shadow-blue-500/20' : 'bg-white hover:shadow-lg'
      }`}
    >
      {blog.featuredImage?.url ? (
        <div className="h-48 overflow-hidden">
          <img
            src={blog.featuredImage.url}
            alt={blog.featuredImage.alt || blog.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      ) : (
        <div className={`h-48 flex items-center justify-center ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <span className={`text-4xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>📷</span>
        </div>
      )}
      
      <div className="p-5">
        <Link to={`/blog/${blog.slug}`}>
          <h3 className={`text-lg font-bold mb-2 hover:text-blue-600 ${
            isDarkMode ? 'text-white hover:text-blue-400' : ''
          }`}>
            {blog.title}
          </h3>
        </Link>
        
        <p className={`text-sm mb-4 line-clamp-3 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {blog.metaDescription}
        </p>
        
        <div className={`flex flex-wrap items-center text-xs ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <div className="flex items-center mr-4 mb-2">
            <Calendar size={14} className="mr-1" />
            <span>{formatDate(blog.publishDate)}</span>
          </div>
          
          <div className="flex items-center mr-4 mb-2">
            <Clock size={14} className="mr-1" />
            <span>{blog.readingTime} min read</span>
          </div>
          
          <div className="flex items-center mb-2">
            <User size={14} className="mr-1" />
            <span>
              {blog.author?.firstName} {blog.author?.lastName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;

