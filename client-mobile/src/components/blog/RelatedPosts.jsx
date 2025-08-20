// RelatedPosts.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const RelatedPosts = ({ posts, isDarkMode }) => {
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link 
          key={post._id} 
          to={`/blog/${post.slug}`}
          className="block group"
        >
          <div className="flex gap-3">
            {post.featuredImage?.url ? (
              <img 
                src={post.featuredImage.url}
                alt={post.title}
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className={`w-20 h-20 rounded flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span>📷</span>
              </div>
            )}
            
            <div className="flex-1">
              <h4 className={`font-medium text-sm group-hover:underline line-clamp-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {post.title}
              </h4>
              
              <div className={`flex items-center mt-2 text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Calendar size={12} className="mr-1" />
                <span>{formatDate(post.publishDate)}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RelatedPosts;