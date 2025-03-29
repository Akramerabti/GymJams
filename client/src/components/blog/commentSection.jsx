
// CommentSection.jsx
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Heart, Reply, MoreHorizontal } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import api from '../../services/api';

const CommentSection = ({ comments, postId, postSlug, user, isDarkMode }) => {
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState(comments || []);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await api.post(`/blog/${postSlug}/comments`, {
        content: commentText
      });
      
      // Add the new comment to the local state
      setLocalComments([...localComments, response.data.data]);
      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReplyToggle = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText('');
  };
  
  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to reply');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await api.post(`/blog/${postSlug}/comments/${commentId}/replies`, {
        content: replyText
      });
      
      // Update the local state with the new reply
      const updatedComments = localComments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.data.data]
          };
        }
        return comment;
      });
      
      setLocalComments(updatedComments);
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="mt-16">
      <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Comments ({localComments.length})
      </h3>
      
      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              {user.profileImage ? (
                <AvatarImage src={user.profileImage} alt={user.firstName} />
              ) : (
                <AvatarFallback>
                  {user.firstName ? user.firstName.charAt(0) : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className={`w-full mb-2 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                }`}
                required
              />
              
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className={`p-4 rounded-lg mb-8 ${
          isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          Please <a href="/login" className="text-blue-500 underline">log in</a> to post a comment.
        </div>
      )}
      
      {/* Comments list */}
      <div className="space-y-6">
        {localComments.length === 0 ? (
          <div className={`text-center py-8 rounded-lg ${
            isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
          }`}>
            <p>Be the first to comment on this post!</p>
          </div>
        ) : (
          localComments.map((comment) => (
            <div 
              key={comment._id} 
              className={`${isDarkMode ? 'border-gray-700' : 'border-gray-100'} border-b pb-6 last:border-0`}
            >
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  {comment.user.profileImage ? (
                    <AvatarImage src={comment.user.profileImage} alt={comment.user.firstName} />
                  ) : (
                    <AvatarFallback>
                      {comment.user.firstName.charAt(0)}{comment.user.lastName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {comment.user.firstName} {comment.user.lastName}
                      </h4>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal size={16} />
                    </Button>
                  </div>
                  
                  <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {comment.content}
                  </div>
                  
                  <div className="flex gap-4 mt-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 px-2 ${
                        isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Heart size={14} className="mr-1" />
                      <span>{comment.likes?.count || 0}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 px-2 ${
                        isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => handleReplyToggle(comment._id)}
                    >
                      <Reply size={14} className="mr-1" />
                      <span>Reply</span>
                    </Button>
                  </div>
                  
                  {/* Reply form */}
                  {replyingTo === comment._id && (
                    <div className="mt-4 flex gap-3">
                      {user && (
                        <Avatar className="h-8 w-8">
                          {user.profileImage ? (
                            <AvatarImage src={user.profileImage} alt={user.firstName} />
                          ) : (
                            <AvatarFallback>
                              {user.firstName ? user.firstName.charAt(0) : 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      
                      <div className="flex-1">
                        <Textarea
                          placeholder={`Reply to ${comment.user.firstName}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className={`w-full mb-2 text-sm ${
                            isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                          }`}
                          required
                        />
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(comment._id)}
                            disabled={submitting}
                          >
                            {submitting ? 'Posting...' : 'Post'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                            className={isDarkMode ? 'border-gray-700' : ''}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className={`mt-4 pl-6 border-l-2 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {comment.replies.map((reply) => (
                        <div key={reply._id} className="mb-4 last:mb-0">
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              {reply.user.profileImage ? (
                                <AvatarImage src={reply.user.profileImage} alt={reply.user.firstName} />
                              ) : (
                                <AvatarFallback>
                                  {reply.user.firstName.charAt(0)}{reply.user.lastName.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div className="flex-1">
                              <div>
                                <h5 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {reply.user.firstName} {reply.user.lastName}
                                </h5>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {formatDate(reply.createdAt)}
                                </p>
                              </div>
                              
                              <div className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {reply.content}
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`h-7 px-2 mt-1 ${
                                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <Heart size={12} className="mr-1" />
                                <span className="text-xs">0</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;