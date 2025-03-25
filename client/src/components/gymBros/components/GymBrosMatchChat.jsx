import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Image, X, Eye, Loader2, Calendar, MapPin, Award, Flag, Phone } from 'lucide-react';
import { format, parseISO, isSameDay, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useSocket } from '../../../SocketContext';
import useAuthStore from '../../../stores/authStore';
import gymbrosService from '../../../services/gymbros.service';

const GymBrosMatchChat = ({ match, onClose }) => {
  const { user } = useAuthStore();
  const socket = useSocket();
  
  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [expandedProfile, setExpandedProfile] = useState(false);
  
  // Refs for managing chat state
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const lastReadTimestamp = useRef(0);
  const markingAsRead = useRef(false);
  const lastMessageReceived = useRef(null);
  
  // Get user info
  const userId = user?.id || (user?.user && user?.user.id);
  const otherUserId = match?.userId || match?._id;
  
  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // Check if user is at bottom of chat
  const isAtBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 50;
  }, []);

  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await gymbrosService.fetchMatchMessages(match._id);
        
        // Reset processed message IDs
        processedMessageIds.current.clear();
        
        // Sort and deduplicate messages
        const uniqueMessages = [];
        const messageIds = new Set();
        
        response.forEach(msg => {
          if (!messageIds.has(msg._id)) {
            messageIds.add(msg._id);
            processedMessageIds.current.add(msg._id);
            uniqueMessages.push(msg);
          }
        });
        
        // Sort by timestamp
        uniqueMessages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        setMessages(uniqueMessages);
        
        // Check for unread messages after initial load
        setTimeout(() => {
          const unreadMessages = uniqueMessages.filter(
            msg => !msg.read && msg.sender !== userId
          );
          
          if (unreadMessages.length > 0) {
            markMessagesAsRead(unreadMessages.map(msg => msg._id));
          }
        }, 500);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        toast.error('Failed to load messages. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };

    if (match?._id) {
      fetchMessages();
    }
    
    return () => {
      // Clean up
      markingAsRead.current = false;
      processedMessageIds.current.clear();
    };
  }, [match?._id, userId]);

  // Set up socket connection monitoring
  useEffect(() => {
    if (!socket) return;
    
    const handleConnect = () => {
      console.log('Socket connected in chat component');
      setSocketConnected(true);
      
      // Re-register user ID when reconnected
      if (userId) {
        socket.emit('register', userId);
      }
    };
    
    const handleDisconnect = () => {
      console.log('Socket disconnected in chat component');
      setSocketConnected(false);
    };
    
    // Set initial connection state
    setSocketConnected(socket.connected);
    
    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Register user with socket
    if (userId) {
      socket.emit('register', userId);
      console.log('User registered with socket:', userId);
    }
    
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, userId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!messageIds?.length || markingAsRead.current || !match?._id) return;
    
    try {
      markingAsRead.current = true;
      console.log('Marking messages as read:', messageIds);
      
      // Update local state immediately
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      // Update timestamp
      lastReadTimestamp.current = Date.now();
      
      // Send to server
      await gymbrosService.markMatchMessagesAsRead(match._id, messageIds);
      
      // Emit socket event for real-time update to the sender
      if (socket && socketConnected) {
        socket.emit('messagesRead', {
          matchId: match._id,
          messageIds,
          receiverId: otherUserId
        });
        console.log('Read receipt sent via socket');
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    } finally {
      markingAsRead.current = false;
    }
  }, [socket, socketConnected, match?._id, otherUserId]);

  // Socket event handlers for messages, typing, and read receipts
  useEffect(() => {
    if (!socket || !match?._id) return;
    
    // Handle receiving messages
    const handleReceiveMessage = (message) => {
      console.log('Received message via socket:', message);
      
      // Skip if already processed
      if (processedMessageIds.current.has(message._id)) {
        console.log('Skipping duplicate message:', message._id);
        return;
      }
      
      // Add to processed set
      processedMessageIds.current.add(message._id);
      
      // Save the last message from the other party for read receipt purposes
      if (message.sender !== userId) {
        lastMessageReceived.current = message;
      }
      
      // Add to messages
      setMessages(prev => {
        // Double-check it's not already in the array
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        
        // Add new message
        const newMessages = [...prev, message];
        
        // If we're at the bottom and message is from the other party, mark as read
        if (message.sender !== userId && isAtBottom()) {
          setTimeout(() => {
            markMessagesAsRead([message._id]);
          }, 300);
        }
        
        return newMessages;
      });
    };
    
    // Handle typing indicators
    const handleTypingEvent = (data) => {
      if (data.senderId === otherUserId) {
        setOtherUserTyping(data.isTyping);
      }
    };
    
    // Handle message read receipts
    const handleMessagesRead = (data) => {
      console.log('Messages read event received:', data);
      
      if (data.matchId === match._id) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg._id) ? { ...msg, read: true } : msg
          )
        );
      }
    };
    
    // Register socket event listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTypingEvent);
    socket.on('messagesRead', handleMessagesRead);
    
    return () => {
      // Clean up event listeners
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTypingEvent);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, userId, otherUserId, match?._id, markMessagesAsRead, isAtBottom]);

  // Check for unread messages when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (isAtBottom()) {
        const unreadMessages = messages
          .filter(msg => !msg.read && msg.sender !== userId)
          .map(msg => msg._id);
        
        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages);
        }
      }
    };
    
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages, userId, markMessagesAsRead, isAtBottom]);

  // Handle typing indicator with debounce
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (!socket || !socketConnected || !otherUserId) return;
    
    if (newMessage.trim()) {
      // Start typing indicator
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          senderId: userId,
          receiverId: otherUserId,
          isTyping: true
        });
      }
      
      // Set timer to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: otherUserId,
          isTyping: false
        });
      }, 2000);
    } else {
      // If message is empty, stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: otherUserId,
          isTyping: false
        });
      }
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, socket, socketConnected, isTyping, userId, otherUserId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping, scrollToBottom]);

  // File upload handling
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB per file
    const maxTotalSize = 20 * 1024 * 1024; // 20MB total
    
    let totalSize = 0;
    const validFiles = [];
    
    for (const file of selectedFiles) {
      totalSize += file.size;
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds the 5MB limit`);
        continue;
      }
      
      if (totalSize > maxTotalSize) {
        toast.error('Total file size exceeds 20MB');
        break;
      }
      
      validFiles.push(file);
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  // Remove a file from selection
  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0) || !socket) return;
    
    try {
      const timestamp = new Date().toISOString();
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create temporary message
      const tempMessage = {
        _id: tempId,
        sender: userId,
        content: newMessage.trim(),
        timestamp: timestamp,
        read: false,
        pending: true,
        file: []
      };
      
      // Add to messages immediately
      setMessages(prev => [...prev, tempMessage]);
      processedMessageIds.current.add(tempId);
      
      // Clear input and reset typing
      setNewMessage('');
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: otherUserId,
          isTyping: false
        });
      }
      
      // Upload files if any
      let uploadedFiles = [];
      if (files.length > 0) {
        try {
          uploadedFiles = await gymbrosService.uploadFiles(files);
          
          // Update temporary message with files
          const fileAttachments = uploadedFiles.map(file => ({
            path: file.path,
            type: file.type
          }));
          
          setMessages(prev => 
            prev.map(msg => 
              msg._id === tempId ? { ...msg, file: fileAttachments } : msg
            )
          );
        } catch (error) {
          console.error('Failed to upload files:', error);
          toast.error('Failed to upload files');
        }
      }
      
      // Send message via service
      const response = await gymbrosService.sendMatchMessage(
        match._id,
        newMessage.trim(),
        uploadedFiles.map(file => ({
          path: file.path,
          type: file.type
        }))
      );
      
      // Replace temporary message with actual message
      if (response && response.message) {
        setMessages(prev => {
          // Get the latest message from the API response
          const newMessage = response.message;
          
          if (newMessage) {
            processedMessageIds.current.add(newMessage._id);
          }
          
          // Remove the temporary message and add the real one
          return prev
            .filter(msg => msg._id !== tempId)
            .concat(newMessage ? [newMessage] : []);
        });
      }
      
      // Clear files
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg._id !== `temp-${timestamp}`));
    }
  };

  // Sort and group messages by date
  const groupedMessages = React.useMemo(() => {
    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Group by date
    const groups = [];
    let currentDate = null;
    let currentGroup = [];
    
    sortedMessages.forEach(message => {
      const messageDate = new Date(message.timestamp);
      
      // If this is a new date, start a new group
      if (!currentDate || !isSameDay(messageDate, currentDate)) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          });
        }
        
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        // Add to existing group
        currentGroup.push(message);
      }
    });
    
    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }
    
    return groups;
  }, [messages]);

  
  const formatImageUrl = (url) => {
    if (!url) return "/api/placeholder/400/400";
    
    if (url.startsWith('blob:')) {
      return url;
    } else if (url.startsWith('http')) {
      return url;
    } else {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
  };

  // Report user handler
  const handleReportUser = () => {
    toast('Report submitted', {
      description: 'Our team will review this report within 24 hours',
      icon: <Flag className="text-red-500" />
    });
    
    // Close modal
    setExpandedProfile(false);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
      className="fixed inset-0 bg-white z-[9999] flex flex-col"
    >
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-md">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {/* Profile info and toggle */}
          <div 
            className="flex items-center ml-3 cursor-pointer"
            onClick={() => setExpandedProfile(!expandedProfile)}
          >
            <img
              src={formatImageUrl(match.profileImage || (match.images && match.images[0]))}
              alt={match.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
            <div className="ml-3 text-white">
              <h3 className="font-semibold">{match.name}, {match.age}</h3>
              <p className="text-xs text-white/80">
                {match.lastActive ? formatDistanceToNow(new Date(match.lastActive), { addSuffix: true }) : 'Offline'}
              </p>
            </div>
          </div>
          
          {!socketConnected && (
            <div className="ml-auto rounded-full bg-red-500 px-3 py-1 text-xs text-white">
              Reconnecting...
            </div>
          )}
        </div>
      </div>
      
      {/* Expanded profile section */}
      <AnimatePresence>
        {expandedProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-gray-50 border-b"
          >
            <div className="p-4">
              <div className="flex items-center">
                <img
                  src={formatImageUrl(match.profileImage || (match.images && match.images[0]))}
                  alt={match.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div className="ml-4">
                  <h2 className="text-xl font-bold">{match.name}, {match.age}</h2>
                  
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin size={16} className="mr-1" />
                    <span className="text-sm">{match.location?.distance || 0} miles away</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {match.workoutTypes?.slice(0, 3).map(type => (
                      <span key={type} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        {type}
                      </span>
                    ))}
                    {match.workoutTypes?.length > 3 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        +{match.workoutTypes.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center text-gray-700">
                  <Award size={16} className="mr-2 text-blue-500" />
                  <span className="text-sm">{match.experienceLevel || 'Any level'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar size={16} className="mr-2 text-blue-500" />
                  <span className="text-sm">{match.preferredTime || 'Flexible'}</span>
                </div>
              </div>
              
              {match.bio && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700">{match.bio}</p>
                </div>
              )}
              
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 rounded-lg flex items-center justify-center">
                  <Phone size={16} className="mr-2" />
                  Share Contact
                </button>
                <button 
                  onClick={handleReportUser}
                  className="bg-red-100 hover:bg-red-200 text-red-800 p-2 rounded-lg"
                >
                  <Flag size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Message Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4">
            <div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Image className="h-8 w-8 text-blue-500" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-gray-500 mb-6">Break the ice with {match.name} by sending a message</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Ask about their favorite workout</p>
                <p>• Find out when they usually hit the gym</p>
                <p>• See if they'd like to workout together</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Message groups by date */}
            {groupedMessages.map((group, groupIndex) => (
              <div key={`date-${groupIndex}`} className="mb-6">
                {/* Date separator */}
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-200 rounded-full px-4 py-1 text-xs text-gray-600">
                    {format(group.date, 'MMMM d, yyyy')}
                  </div>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-4">
                {group.messages.map((message) => {
                      const isCurrentUser = message.sender === userId;

                      return (
                      <div key={message._id} className="message-container">
                        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div 
                            className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                              isCurrentUser 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-800'
                            } ${message.pending ? 'opacity-70' : ''}`}
                          >
                            {/* File attachments */}
                            {message.file && message.file.length > 0 && (
                              <div className="mb-2">
                                {message.file.map((file, idx) => {
                                  // Create proper URL with fallback
                                  const fileUrl = file.path ? 
                                    (file.path.startsWith('http') ? file.path : `${import.meta.env.VITE_API_URL}/${file.path.replace(/^\//, '')}`) : 
                                    '';
                                  
                                  return (
                                    <div key={`${message._id}-file-${idx}`} className="mb-2">
                                      {file.type?.startsWith('image') ? (
                                        <img
                                          src={fileUrl}
                                          alt="uploaded"
                                          className="max-w-full h-auto rounded-lg"
                                          loading="lazy"
                                          onError={(e) => {
                                            e.target.src = "/api/placeholder/400/400";
                                          }}
                                        />
                                      ) : file.type?.startsWith('video') ? (
                                        <video controls className="max-w-full h-auto rounded-lg">
                                          <source src={fileUrl} type={file.type} />
                                          Your browser does not support the video tag.
                                        </video>
                                      ) : (
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                          <p className="text-xs">File: {file.path.split('/').pop()}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Message content */}
                            {message.content && <p className="text-sm break-words">{message.content}</p>}

                            {/* Timestamp */}
                            <div className="flex justify-end mt-1">
                              <small className={`text-xs opacity-70 ${
                                isCurrentUser ? 'text-gray-200' : 'text-gray-500'
                              }`}>
                                {format(parseISO(message.timestamp), 'HH:mm')}
                              </small>
                            </div>
                          </div>
                        </div>
                        
                        {/* Message sending indicator */}
                        {message.pending && (
                          <div className="flex justify-end mt-1 pr-2">
                            <div className="flex items-center text-gray-500 text-xs">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              <span>Sending...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <motion.div
                    className="flex space-x-1"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  </motion.div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input Area */}
      <div className="p-4 border-t bg-white">
        {/* Selected files preview */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto">
            {files.map((file, index) => (
              <div key={`file-preview-${index}`} className="relative">
                {file.type.startsWith('image') ? (
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
                ) : file.type.startsWith('video') ? (
                  <video className="w-24 h-24 object-cover rounded-lg">
                    <source src={URL.createObjectURL(file)} type={file.type} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-lg">
                    <span className="text-xs text-center p-2">{file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-1 right-1 bg-white/80 p-1 rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-4 h-4 text-gray-800" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Message form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="w-full flex justify-center items-center space-x-2"
        >
          <label className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition-colors">
            <Image className="w-5 h-5 text-gray-600" />
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full px-4 py-2 border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && files.length === 0) || !socketConnected}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-md transition-colors disabled:bg-gray-400"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default GymBrosMatchChat;