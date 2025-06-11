import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, X, Image, Link2, Eye, ArrowLeft, CheckCircle, Tag, Info, 
  Clock, Calendar, ListFilter, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import blogService from '../../services/blog.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../../components/ui/dialog';
import { useAuth } from '../../stores/authStore';

// Mock rich text editor (in a real implementation, you would use a proper library like TinyMCE, CKEditor, etc.)
const RichTextEditor = ({ value, onChange, isDarkMode }) => {
  return (
    <div className="border rounded-md overflow-hidden">
      {/* Editor toolbar */}
      <div className={`flex items-center p-2 gap-1 ${
        isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b'
      }`}>
        {['Bold', 'Italic', 'Underline', '-', 'H1', 'H2', 'H3', '-', 'Bullet List', 'Numbered List', '-', 'Quote', 'Code'].map((item, i) => 
          item === '-' 
            ? <div key={i} className={`mx-1 w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            : <button 
                key={i} 
                className={`px-2 py-1 rounded ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                {item}
              </button>
        )}
        
        <div className={`mx-1 w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
        
        <button className={`px-2 py-1 rounded flex items-center ${
          isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        }`}>
          <Image className="h-4 w-4 mr-1" />
          <span>Image</span>
        </button>
        
        <button className={`px-2 py-1 rounded flex items-center ${
          isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        }`}>
          <Link2 className="h-4 w-4 mr-1" />
          <span>Link</span>
        </button>
      </div>
      
      {/* Editor content area */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-[400px] border-0 rounded-none p-4 ${
          isDarkMode ? 'bg-gray-800 text-white placeholder:text-gray-500' : ''
        }`}
        placeholder="Start writing your blog post here..."
      />
    </div>
  );
};

const BlogEditor = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const previewIframeRef = useRef(null);
  const isEditMode = Boolean(slug);
  
  const [blog, setBlog] = useState({
    title: '',
    metaDescription: '',
    content: '',
    category: '',
    tags: [],
    status: 'draft',
    featuredImage: {
      url: '',
      alt: '',
      credit: ''
    }
  });
  
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
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
  
  // Fetch blog data if in edit mode
  useEffect(() => {
    const fetchBlog = async () => {
      if (!isEditMode) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await blogService.getBlogBySlug(slug);
        
        const blogData = response.data;
        
        if (!blogData) {
          toast.error('Blog post not found');
          navigate('/admin/blog');
          return;
        }
        
        // Check user permission (only author or admin can edit)
        if (user.id !== blogData.author._id && user.role !== 'admin') {
          toast.error('You do not have permission to edit this blog post');
          navigate('/admin/blog');
          return;
        }
        
        // Update form with blog data
        setBlog({
          title: blogData.title,
          metaDescription: blogData.metaDescription,
          content: blogData.content,
          category: blogData.category,
          tags: blogData.tags || [],
          status: blogData.status,
          featuredImage: blogData.featuredImage || {
            url: '',
            alt: '',
            credit: ''
          }
        });
        
      } catch (error) {
        console.error('Error fetching blog:', error);
        toast.error('Failed to load blog post');
        navigate('/admin/blog');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlog();
  }, [isEditMode, slug, navigate, user]);
  
  // Prompt before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);
  
  // Handle blog field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setBlog({
      ...blog,
      [name]: value
    });
    
    setUnsavedChanges(true);
  };
  
  // Handle rich text content changes
  const handleContentChange = (value) => {
    setBlog({
      ...blog,
      content: value
    });
    
    setUnsavedChanges(true);
  };
  
  // Handle featured image changes
  const handleImageChange = (field, value) => {
    setBlog({
      ...blog,
      featuredImage: {
        ...blog.featuredImage,
        [field]: value
      }
    });
    
    setUnsavedChanges(true);
  };
  
  // Add a tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // Prevent duplicate tags
    if (blog.tags.includes(tagInput.trim())) {
      toast.error('Tag already exists');
      return;
    }
    
    setBlog({
      ...blog,
      tags: [...blog.tags, tagInput.trim()]
    });
    
    setTagInput('');
    setUnsavedChanges(true);
  };
  
  // Remove a tag
  const handleRemoveTag = (tag) => {
    setBlog({
      ...blog,
      tags: blog.tags.filter(t => t !== tag)
    });
    
    setUnsavedChanges(true);
  };
  
  // Handle tag input keypress (add tag on Enter)
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Preview the blog post
  const handlePreview = () => {
    setPreviewOpen(true);
    
    // Wait for iframe to load then inject content
    setTimeout(() => {
      if (previewIframeRef.current) {
        const iframe = previewIframeRef.current;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Create preview HTML
        const previewHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${blog.title || 'Blog Preview'}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                line-height: 1.6;
                color: ${isDarkMode ? '#f3f4f6' : '#374151'};
                background-color: ${isDarkMode ? '#111827' : '#f9fafb'};
                padding: 2rem;
              }
              .prose {
                max-width: 65ch;
                margin: 0 auto;
              }
              .prose img {
                border-radius: 0.375rem;
                margin: 2rem 0;
              }
              .prose h1, .prose h2, .prose h3 {
                margin-top: 2rem;
                margin-bottom: 1rem;
                font-weight: 600;
                line-height: 1.25;
              }
              .prose h1 {
                font-size: 2.25rem;
              }
              .prose h2 {
                font-size: 1.875rem;
              }
              .prose h3 {
                font-size: 1.5rem;
              }
              .prose p {
                margin-bottom: 1.25rem;
              }
              .prose ul, .prose ol {
                margin-bottom: 1.25rem;
                padding-left: 1.625rem;
              }
              .prose li {
                margin-bottom: 0.5rem;
              }
              .prose blockquote {
                border-left: 4px solid ${isDarkMode ? '#4b5563' : '#d1d5db'};
                padding-left: 1rem;
                font-style: italic;
                color: ${isDarkMode ? '#9ca3af' : '#6b7280'};
                margin: 1.5rem 0;
              }
              .prose a {
                color: #2563eb;
                text-decoration: underline;
              }
            </style>
          </head>
          <body class="${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}">
            <div class="max-w-3xl mx-auto py-8">
              ${blog.featuredImage?.url ? `
                <div class="mb-8">
                  <img 
                    src="${blog.featuredImage.url}" 
                    alt="${blog.featuredImage.alt || blog.title}" 
                    class="w-full h-auto rounded-lg shadow-lg"
                  />
                  ${blog.featuredImage.credit ? `
                    <p class="text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}">
                      Photo: ${blog.featuredImage.credit}
                    </p>
                  ` : ''}
                </div>
              ` : ''}
              
              <h1 class="text-3xl md:text-4xl font-bold mb-4">${blog.title || 'Untitled Blog Post'}</h1>
              
              <div class="prose ${isDarkMode ? 'prose-invert' : ''} max-w-none">
                ${blog.content || '<p>No content yet</p>'}
              </div>
              
              ${blog.tags.length > 0 ? `
                <div class="mt-8 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
                  <h3 class="text-lg font-medium mb-3">Tags</h3>
                  <div class="flex flex-wrap gap-2">
                    ${blog.tags.map(tag => `
                      <span class="px-3 py-1 rounded-full text-sm ${
                        isDarkMode 
                          ? 'bg-gray-800 text-gray-300' 
                          : 'bg-gray-100 text-gray-800'
                      }">
                        ${tag}
                      </span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </body>
          </html>
        `;
        
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }, 100);
  };
  
  // Save the blog post
  const handleSave = async (newStatus = null) => {
    // Validate form
    if (!blog.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!blog.metaDescription.trim()) {
      toast.error('Meta description is required');
      return;
    }
    
    if (!blog.category) {
      toast.error('Category is required');
      return;
    }
    
    if (!blog.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    // Update status if provided
    const dataToSave = {
      ...blog,
      status: newStatus || blog.status
    };
    
    setSaving(true);
    
    try {
      if (isEditMode) {
        // Update existing blog
        await blogService.updateBlog(slug, dataToSave);
        toast.success('Blog post updated successfully');
      } else {
        // Create new blog
        const response = await blogService.createBlog(dataToSave);
        toast.success('Blog post created successfully');
        
        // Redirect to edit page with the new slug
        navigate(`/admin/blog/edit/${response.data.slug}`);
      }
      
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error(error.response?.data?.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };
  
  // Discard changes
  const handleDiscard = () => {
    if (unsavedChanges) {
      setConfirmDiscardOpen(true);
    } else {
      navigate('/admin/blog');
    }
  };
  
  // Confirm discard and navigate away
  const confirmDiscard = () => {
    setConfirmDiscardOpen(false);
    setUnsavedChanges(false);
    navigate('/admin/blog');
  };
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 shadow-sm ${
        isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'
      }`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="mr-4"
                onClick={handleDiscard}
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">
                {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={saving}
                className={isDarkMode ? 'hover:bg-gray-700 border-gray-700' : ''}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button
                variant={blog.status === 'published' ? 'default' : 'outline'}
                onClick={() => handleSave('published')}
                disabled={saving}
                className={
                  blog.status === 'published' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : isDarkMode ? 'hover:bg-gray-700 border-gray-700' : ''
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {blog.status === 'published' ? 'Update' : 'Publish'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saving}
                className={isDarkMode ? 'hover:bg-gray-700 border-gray-700' : ''}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main editor column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                name="title"
                value={blog.title}
                onChange={handleChange}
                placeholder="Enter a descriptive title"
                className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
              />
            </div>
            
            {/* Meta Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Meta Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                name="metaDescription"
                value={blog.metaDescription}
                onChange={handleChange}
                placeholder="Enter a brief description for SEO (150-160 characters)"
                className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                maxLength={160}
              />
              <div className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {blog.metaDescription.length}/160 characters
              </div>
            </div>
            
            {/* Rich text editor */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Content <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={blog.content}
                onChange={handleContentChange}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
          
          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Blog Settings */}
            <div className={`rounded-lg ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'
            } p-5`}>
              <h3 className="text-lg font-medium mb-4">Blog Settings</h3>
              
              {/* Status */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Status
                </label>
                <Select
                  value={blog.status}
                  onValueChange={(value) => {
                    setBlog({ ...blog, status: value });
                    setUnsavedChanges(true);
                  }}
                >
                  <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Category */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={blog.category}
                  onValueChange={(value) => {
                    setBlog({ ...blog, category: value });
                    setUnsavedChanges(true);
                  }}
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
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tags
                </label>
                <div className="flex space-x-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add a tag"
                    className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddTag}
                    className={isDarkMode ? 'hover:bg-gray-700 border-gray-700' : ''}
                  >
                    Add
                  </Button>
                </div>
                
                {blog.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {blog.tags.map(tag => (
                      <div
                        key={tag}
                        className={`group flex items-center px-3 py-1 rounded-full text-sm ${
                          isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className={`ml-1.5 p-0.5 rounded-full ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Featured Image */}
            <div className={`rounded-lg ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'
            } p-5`}>
              <h3 className="text-lg font-medium mb-4">Featured Image</h3>
              
              {/* Image URL */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Image URL
                </label>
                <Input
                  value={blog.featuredImage.url}
                  onChange={(e) => handleImageChange('url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              
              {/* Image Alt Text */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Alt Text
                </label>
                <Input
                  value={blog.featuredImage.alt}
                  onChange={(e) => handleImageChange('alt', e.target.value)}
                  placeholder="Descriptive text for the image"
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              
              {/* Image Credit */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Image Credit
                </label>
                <Input
                  value={blog.featuredImage.credit}
                  onChange={(e) => handleImageChange('credit', e.target.value)}
                  placeholder="Photo by John Doe on Unsplash"
                  className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              
              {/* Image preview */}
              {blog.featuredImage.url && (
                <div className="mt-4">
                  <div className="border rounded-md overflow-hidden">
                    <img
                      src={blog.featuredImage.url}
                      alt={blog.featuredImage.alt || 'Featured image'}
                      className="w-full h-auto"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* SEO Tips */}
            <div className={`rounded-lg ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'
            } p-5`}>
              <div className="flex items-center mb-4">
                <Info className={`h-5 w-5 mr-2 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-500'
                }`} />
                <h3 className="text-lg font-medium">SEO Tips</h3>
              </div>
              
              <ul className={`space-y-2 text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use a descriptive, keyword-rich title (50-60 characters)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Write a compelling meta description (150-160 characters)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Include targeted keywords naturally throughout your content</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use descriptive alt text for images</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Structure your content with proper headings (H2, H3)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl p-0" showClose={false}>
          <div className="flex justify-between items-center p-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <Button
              variant="ghost"
              onClick={() => setPreviewOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="h-[80vh] bg-white p-0">
            <iframe
              ref={previewIframeRef}
              className="w-full h-full border-0"
              title="Blog Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Confirm discard dialog */}
      <Dialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>You have unsaved changes that will be lost if you leave this page.</p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDiscardOpen(false)}
              className={isDarkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDiscard}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogEditor;