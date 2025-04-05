// components/blog/BlogPost.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, Tag, User, Calendar, ChevronLeft, Share2, Bookmark, 
  Heart, MessageSquare, Facebook, Twitter, Linkedin, Copy, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import AdBanner from './AdBanner';
import RelatedPosts from './RelatedPosts';
import CommentSection from './CommentSection';
import AdInjector from './AdInjector';
import { toast } from 'sonner';
import { useAuth } from '../../stores/authStore';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adViewEvents, setAdViewEvents] = useState({});
  const [imageLoaded, setImageLoaded] = useState(false);
  const contentRef = useRef(null);
  const adTimerRef = useRef(null);

  // Track reading position for targeted ads
  const trackScrollPosition = () => {
    if (!contentRef.current) return;
    
    const element = contentRef.current;
    const totalHeight = element.scrollHeight - element.clientHeight;
    const scrolled = element.scrollTop;
    
    const calculatedProgress = Math.min(Math.round((scrolled / totalHeight) * 100), 100);
    setReadingProgress(calculatedProgress);
    
    // Show popup ad when reader is 50% through the article
    if (calculatedProgress >= 50 && !showAdPopup && !adViewEvents.popup) {
      if (adTimerRef.current) clearTimeout(adTimerRef.current);
      
      adTimerRef.current = setTimeout(() => {
        setShowAdPopup(true);
        // Mark this ad as viewed
        setAdViewEvents(prev => ({ ...prev, popup: true }));
      }, 2000);
    }
  };

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

  // Set up scroll tracking
  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', trackScrollPosition);
      return () => content.removeEventListener('scroll', trackScrollPosition);
    }
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (adTimerRef.current) clearTimeout(adTimerRef.current);
    };
  }, []);

  // Fetch blog post data
  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/blog/${slug}`);
        setBlog(response.data.data);
        
        // Fetch related posts
        const relatedResponse = await api.get(`/blog/${slug}/related`);
        setRelatedPosts(relatedResponse.data.data);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load blog post. It may have been removed or does not exist.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlog();
  }, [slug]);
  
  // Increment view count once the post is loaded
  useEffect(() => {
    if (blog && !loading) {
      const trackView = async () => {
        try {
          await api.post(`/blog/${slug}/view`);
        } catch (error) {
          console.warn('Failed to track view:', error);
        }
      };
      
      trackView();
    }
  }, [blog, loading, slug]);

  // Handle social sharing
  const handleShare = (platform) => {
    const url = window.location.href;
    const title = blog?.title || 'Check out this blog post';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareOptions(false);
  };

  // Share options dropdown animation
  const shareOptionsVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.1 } }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Close popup ad
  const handleClosePopup = () => {
    setShowAdPopup(false);
  };

  // Process content with injected ads
  const processContentWithAds = (content) => {
    if (!content) return '';
    
    // Only inject ads if we have them configured
    if (blog?.adPlacements?.length > 0) {
      return (
        <AdInjector
          content={content}
          adPlacements={blog.adPlacements}
          readingProgress={readingProgress}
          isDarkMode={isDarkMode}
          setAdViewEvents={setAdViewEvents}
        />
      );
    }
    
    // Otherwise just return the content
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };
  
  // Handle image loading
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Helper to get fallback content when featured image fails to load
  const getFallbackImageContent = () => {
    return (
      <div className={`rounded-lg flex items-center justify-center ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`} style={{ height: '400px' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Image not available
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
          <Button onClick={() => navigate('/blog')}>
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Ad Banner */}
      <div className="container mx-auto px-4 pt-8">
        <AdBanner position="top" className="max-w-5xl mx-auto" />
      </div>
      
      {/* Back to blog link */}
      <div className="container mx-auto px-4 py-6">
        <Link 
          to="/blog"
          className={`inline-flex items-center ${
            isDarkMode 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-blue-600 hover:text-blue-500'
          }`}
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Blog
        </Link>
      </div>
      
      {/* Blog Header */}
      <header className={`pt-8 pb-12 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-800 to-gray-900' 
          : 'bg-gradient-to-b from-blue-50 to-gray-50'
      }`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Category */}
            <Link 
              to={`/blog?category=${blog.category}`}
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                isDarkMode 
                  ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              {blog.category}
            </Link>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              {blog.title}
            </h1>
            
            {/* Meta info */}
            <div className={`flex flex-wrap items-center gap-4 mb-6 text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                {blog.readingTime} min read
              </div>
              
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                {formatDate(blog.publishDate)}
              </div>
              
              <div className="flex items-center">
                <MessageSquare size={16} className="mr-2" />
                {blog.comments.length} {blog.comments.length === 1 ? 'comment' : 'comments'}
              </div>
              
              <div className="flex items-center">
                <Heart size={16} className="mr-2" />
                {blog.analytics.likes} likes
              </div>
            </div>
            
            {/* Author info */}
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                {blog.author.profileImage ? (
                  <AvatarImage src={blog.author.profileImage} alt={`${blog.author.firstName} ${blog.author.lastName}`} />
                ) : (
                  <AvatarFallback>
                    {blog.author.firstName.charAt(0)}{blog.author.lastName.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <Link 
                  to={`/blog?author=${blog.author._id}`}
                  className={`font-medium ${
                    isDarkMode ? 'text-white hover:text-blue-300' : 'text-gray-900 hover:text-blue-600'
                  }`}
                >
                  {blog.author.firstName} {blog.author.lastName}
                </Link>
                {blog.author.bio && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {blog.author.bio.substring(0, 60)}{blog.author.bio.length > 60 ? '...' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Featured Image */}
      {blog.featuredImage?.url && (
        <div className="container mx-auto px-4 -mt-6 mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-lg overflow-hidden shadow-lg">
              {!imageLoaded && (
                <div className="w-full h-96 animate-pulse bg-gray-300"></div>
              )}
              <img 
                src={blog.featuredImage.url} 
                alt={blog.featuredImage.alt || blog.title} 
                className={`w-full h-auto object-cover ${imageLoaded ? 'block' : 'hidden'}`}
                onLoad={handleImageLoad}
                onError={() => setImageLoaded(true)} // Still set loaded on error to remove loading state
              />
              {imageLoaded && !blog.featuredImage.url && getFallbackImageContent()}
              {blog.featuredImage.credit && imageLoaded && (
                <div className={`p-2 text-xs ${
                  isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  Photo: {blog.featuredImage.credit}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main content with sidebar */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          {/* Main content */}
          <main className="lg:w-3/4">
            <div className="max-w-3xl mx-auto">
              {/* Social sharing */}
              <div className="sticky top-6 z-10 float-left mr-6">
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="icon"
                      className={`rounded-full ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : ''
                      }`}
                      onClick={() => setShowShareOptions(!showShareOptions)}
                    >
                      <Share2 size={18} />
                    </Button>
                    
                    <AnimatePresence>
                      {showShareOptions && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={shareOptionsVariants}
                          className={`absolute left-full ml-2 py-2 px-1 rounded-lg shadow-lg ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-blue-100 hover:text-blue-600"
                              onClick={() => handleShare('facebook')}
                              title="Share on Facebook"
                            >
                              <Facebook size={18} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-blue-100 hover:text-blue-500"
                              onClick={() => handleShare('twitter')}
                              title="Share on Twitter"
                            >
                              <Twitter size={18} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-blue-100 hover:text-blue-700"
                              onClick={() => handleShare('linkedin')}
                              title="Share on LinkedIn"
                            >
                              <Linkedin size={18} />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-gray-100"
                              onClick={() => handleShare('copy')}
                              title="Copy link"
                            >
                              {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : ''
                    }`}
                    title="Save for later"
                  >
                    <Bookmark size={18} />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : ''
                    }`}
                    title="Like this article"
                  >
                    <Heart size={18} />
                  </Button>
                </div>
              </div>
              
              {/* Article content */}
              <article 
                ref={contentRef}
                className={`prose max-w-none ${
                  isDarkMode ? 'prose-invert' : ''
                } overflow-auto max-h-[800px] pr-4`}
              >
                {processContentWithAds(blog.content)}
              </article>
              
              <div className="clear-both"></div>
              
              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-12">
                  <h3 className={`text-lg font-medium mb-3 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/blog?tag=${tag}`}
                        className={`px-3 py-1 rounded-full text-sm ${
                          isDarkMode 
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Author bio (expanded) */}
              <div className={`mt-12 p-6 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <div className="flex flex-col sm:flex-row gap-6">
                  <Avatar className="h-20 w-20">
                    {blog.author.profileImage ? (
                      <AvatarImage src={blog.author.profileImage} alt={`${blog.author.firstName} ${blog.author.lastName}`} />
                    ) : (
                      <AvatarFallback className="text-xl">
                        {blog.author.firstName.charAt(0)}{blog.author.lastName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {blog.author.firstName} {blog.author.lastName}
                    </h3>
                    
                    {blog.author.bio && (
                      <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {blog.author.bio}
                      </p>
                    )}
                    
                    <Link
                      to={`/blog?author=${blog.author._id}`}
                      className={`text-sm font-medium ${
                        isDarkMode 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-blue-600 hover:text-blue-500'
                      }`}
                    >
                      More articles from this author
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Comment section */}
              <CommentSection 
                comments={blog.comments} 
                postId={blog._id}
                postSlug={blog.slug}
                user={user}
                isDarkMode={isDarkMode}
              />
            </div>
          </main>
          
          {/* Sidebar */}
          <aside className="lg:w-1/4">
            <div className="sticky top-6">
              {/* Sidebar ad */}
              <div className="mb-8">
                <AdBanner position="sidebar" />
              </div>
              
              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div className={`rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                } p-6 mb-8`}>
                  <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
                  <RelatedPosts 
                    posts={relatedPosts}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
              
              {/* Newsletter signup */}
              <div className={`rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              } p-6`}>
                <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
                <p className={`text-sm mb-4 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Subscribe to our newsletter for the latest fitness tips and exclusive content.
                </p>
                
                <form className="space-y-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className={`w-full p-2 rounded-md text-sm ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400' 
                        : 'border border-gray-300'
                    }`}
                    required
                  />
                  <Button className="w-full">Subscribe</Button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      {/* Bottom Ad Banner */}
      <div className="container mx-auto px-4 pb-8">
        <AdBanner position="footer" className="max-w-5xl mx-auto" />
      </div>
      
      {/* Popup ad (displayed when user reaches 50% of article) */}
      <AnimatePresence>
        {showAdPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className={`rounded-lg shadow-xl overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full bg-black/20 hover:bg-black/30 text-white z-10"
                  onClick={handleClosePopup}
                >
                  <span>×</span>
                </Button>
                
                <div className="p-4">
                  <h4 className="text-lg font-bold mb-2">Special Offer</h4>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Get 15% off premium exercise equipment this week only!
                  </p>
                  
                  <Button 
                    className="w-full"
                    onClick={() => {
                      navigate('/shop?promo=BLOG15');
                      handleClosePopup();
                    }}
                  >
                    Shop Now
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogPost;