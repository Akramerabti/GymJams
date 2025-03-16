import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../stores/authStore';
import { useSocket } from '../../../SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Image, Video, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import subscriptionService from '../../../services/subscription.service';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';

const Chat = ({ subscription, onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Create a ref to track processed message IDs to prevent duplicates
  const processedMessageIds = useRef(new Set());
  // Track last read timestamp to avoid unnecessary mark-as-read calls
  const lastReadTimestamp = useRef(0);
  // Use a ref to track whether a mark-as-read operation is in progress
  const markingAsRead = useRef(false);
  
  const getUserId = () => {
    return user?.id || user?.user?.id;
  };

  const userId = getUserId();
  const coachId = subscription.assignedCoach;

  // Format timestamp in a user-friendly way
  const formatTimestamp = (timestamp) => {
    try {
      const date = parseISO(timestamp);
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Yesterday ' + format(date, 'HH:mm');
      } else {
        return format(date, 'MMM d, HH:mm');
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  // Fetch messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await subscriptionService.fetchMessages(subscription._id);
        
        console.log('Fetched messages:', response.length);
        
        // Reset processed IDs when loading a new set of messages
        processedMessageIds.current.clear();
        
        // Create a new array for de-duplicated messages
        const uniqueMessages = [];
        const messageIds = new Set();
        
        response.forEach(msg => {
          if (!messageIds.has(msg._id)) {
            messageIds.add(msg._id);
            processedMessageIds.current.add(msg._id);
            uniqueMessages.push(msg);
          }
        });
        
        setMessages(uniqueMessages);
        
        // After initial load, check for unread messages without race conditions
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

    fetchMessages();

    // Handle socket connection status
    if (socket) {
      setSocketConnected(socket.connected);
      
      const handleConnect = () => {
        console.log('Socket connected in chat component');
        setSocketConnected(true);
      };
      
      const handleDisconnect = () => {
        console.log('Socket disconnected in chat component');
        setSocketConnected(false);
      };
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }

  }, [subscription._id, socket, userId]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to check if user is at bottom of chat container
  const isAtBottom = () => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 50;
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds) => {
    // Return if there are no messages to mark or already marking
    if (!messageIds || messageIds.length === 0 || markingAsRead.current) return;
    
    try {
      markingAsRead.current = true;
      console.log('Marking messages as read:', messageIds);
      
      // Update local state immediately for better UX
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      // Update read timestamp
      lastReadTimestamp.current = Date.now();
      
      // Send to server
      await subscriptionService.markMessagesAsRead(subscription._id, messageIds);
      
      // Emit socket event for real-time update
      if (socket && socketConnected) {
        socket.emit('messagesRead', {
          subscriptionId: subscription._id,
          messageIds,
          receiverId: coachId
        });
        console.log('Read receipt sent via socket for messages:', messageIds);
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    } finally {
      markingAsRead.current = false;
    }
  };

  // Check for unread messages when user scrolls to bottom
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
  }, [messages, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  const handleMessagesRead = useCallback((data) => {
    console.log('Messages read event received:', data);
    
    if (data.subscriptionId === subscription._id) {
      // Update read status for these specific messages
      setMessages(prev => 
        prev.map(msg => 
          data.messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
    }
  }, [subscription._id]);
  
  useEffect(() => {
    if (!socket) return;
    
    console.log('Setting up socket event listeners in Chat component');
    
    // Handle receiving messages
    const handleReceiveMessage = (message) => {
      console.log('Received message via socket:', message);
      
      // Check if we've already processed this message ID
      if (processedMessageIds.current.has(message._id)) {
        console.log('Skipping duplicate message:', message._id);
        return;
      }
      
      // Add to processed set
      processedMessageIds.current.add(message._id);
      
      setMessages(prev => {
        // Double-check it's not already in the messages array
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        
        // Add new message
        const newMessages = [...prev, message];
        
        // Check if we should mark as read (only if at bottom of chat)
        if (message.sender !== userId && isAtBottom()) {
          // Debounce the mark as read to avoid multiple rapid calls
          const now = Date.now();
          if (now - lastReadTimestamp.current > 1000) {
            setTimeout(() => {
              markMessagesAsRead([message._id]);
            }, 300);
          }
        }
        
        return newMessages;
      });
    };
    
    // Handle typing indicator
    const handleTypingEvent = (data) => {
      if (data.senderId === coachId) {
        setOtherUserTyping(data.isTyping);
      }
    };
    
    // Register event listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTypingEvent);
    socket.on('messagesRead', handleMessagesRead);
    
    // Register user with socket
    if (userId) {
      socket.emit('register', userId);
      console.log('User registered with socket in Chat component:', userId);
    }
    
    // Clean up event listeners on unmount
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTypingEvent);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, userId, coachId, subscription._id, handleMessagesRead]);

  // Handle typing indicator with debounce
  useEffect(() => {
    // Clear existing timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (!socket || !socketConnected) return;
    
    if (newMessage.trim()) {
      // Start typing indicator
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          senderId: userId,
          receiverId: coachId,
          isTyping: true
        });
      }
      
      // Set timer to stop typing indicator after inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: coachId,
          isTyping: false
        });
      }, 2000);
    } else {
      // If message is empty, immediately stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: coachId,
          isTyping: false
        });
      }
    }
    
    // Clean up timer on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, socket, socketConnected, isTyping, userId, coachId]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB per file
    const maxTotalSize = 100 * 1024 * 1024; // 100MB total
    
    let totalSize = 0;
    const validFiles = [];
    
    for (const file of selectedFiles) {
      totalSize += file.size;
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds the 10MB limit`);
        continue;
      }
      
      if (totalSize > maxTotalSize) {
        toast.error('Total file size exceeds 100MB');
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

  // Send a message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0) || !socket) return;
    
    try {
      const timestamp = new Date().toISOString();
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create temporary message for immediate display
      const tempMessage = {
        _id: tempId,
        sender: userId,
        content: newMessage.trim(),
        timestamp: timestamp,
        read: false,
        pending: true,
        file: [] // Will be updated after upload
      };
      
      // Add to pending messages and display immediately
      setPendingMessages(prev => [...prev, tempMessage]);
      setMessages(prev => [...prev, tempMessage]);
      processedMessageIds.current.add(tempId);
      
      // Clear input field and reset typing state
      setNewMessage('');
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: coachId,
          isTyping: false
        });
      }
      
      // Upload files if any
      let uploadedFiles = [];
      if (files.length > 0) {
        try {
          uploadedFiles = await subscriptionService.uploadFiles(files);
          console.log('Files uploaded:', uploadedFiles);
          
          // Update temporary message with files right away for real-time display
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
      
      // Emit via socket for real-time delivery
      if (socketConnected) {
        socket.emit('sendMessage', {
          senderId: userId,
          receiverId: coachId,
          content: newMessage.trim(),
          timestamp: timestamp,
          file: uploadedFiles.map(file => ({
            path: file.path,
            type: file.type
          })),
          subscriptionId: subscription._id // Important: include subscription ID
        });
        console.log('Message sent via socket');
      } else {
        toast.error('Socket disconnected, message will be sent when connection is restored');
      }
      
      // Make API call to ensure message is stored
      const updatedSubscription = await subscriptionService.sendMessage(
        subscription._id,
        userId,
        coachId,
        newMessage.trim(),
        timestamp,
        uploadedFiles.map(file => ({
          path: file.path,
          type: file.type
        }))
      );
      
      // Replace temporary message with the actual saved message
      if (updatedSubscription && updatedSubscription.messages) {
        setMessages(prev => {
          // Remove the temporary message
          const filteredMessages = prev.filter(msg => msg._id !== tempId);
          
          // Get the new messages from the API response
          const newMessages = updatedSubscription.messages;
          const latestMessage = newMessages[newMessages.length - 1];
          
          // Add the new message ID to the processed set
          if (latestMessage && latestMessage._id) {
            processedMessageIds.current.add(latestMessage._id);
          }
          
          // Only add the latest message if it's not already in the filtered messages
          if (latestMessage && !filteredMessages.some(msg => msg._id === latestMessage._id)) {
            return [...filteredMessages, latestMessage];
          }
          
          return filteredMessages;
        });
      }
      
      // Remove from pending messages
      setPendingMessages(prev => prev.filter(msg => msg._id !== tempId));
      
      // Clear files after sending
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  // Sort and deduplicate messages
  const allMessages = React.useMemo(() => {
    const messagesMap = new Map();
    
    // Add all messages to a map, with the ID as key to ensure uniqueness
    messages.forEach(msg => {
      messagesMap.set(msg._id, msg);
    });
    
    // Convert back to array and sort by timestamp
    return Array.from(messagesMap.values()).sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }, [messages]);

  // Get the last read message from the current user
  // This function now correctly selects the most recently sent message by the user that has been read
  const lastReadMessage = React.useMemo(() => {
    // Group messages by sender
    const userMessages = allMessages
      .filter(msg => msg.sender === userId && !msg.pending)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort descending by time
    
    // Find the first read message in the sorted array (most recent read message)
    return userMessages.find(msg => msg.read);
  }, [allMessages, userId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
        className="fixed inset-0 bg-gray-50 z-[9999] flex flex-col items-center justify-center"
      >
        <div className="max-w-2xl w-full h-full md:h-[90vh] md:rounded-lg md:shadow-2xl bg-white flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-md">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h3 className="font-semibold text-lg text-white">Chat with Coach</h3>
              {!socketConnected && (
                <div className="ml-auto rounded-full bg-red-500 px-3 py-1 text-xs text-white">
                  Reconnecting...
                </div>
              )}
            </div>
          </div>

          {/* Chat Message Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-4"
          >
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : allMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {/* Group messages by date */}
                {(() => {
                  let currentDate = null;
                  return allMessages.map((msg, index) => {
                    // Check if we need to display a date separator
                    const msgDate = new Date(msg.timestamp);
                    const messageDate = format(msgDate, 'yyyy-MM-dd');
                    const showDateSeparator = currentDate !== messageDate;
                    
                    // Update current date
                    if (showDateSeparator) {
                      currentDate = messageDate;
                    }
                    
                    return (
                      <React.Fragment key={`${msg._id}-${index}`}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
                              {isToday(msgDate) 
                                ? 'Today' 
                                : isYesterday(msgDate) 
                                  ? 'Yesterday' 
                                  : format(msgDate, 'MMMM d, yyyy')}
                            </div>
                          </div>
                        )}
                        
                        <div className="message-container">
                          <div 
                            className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                                msg.sender === userId ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-800'
                              } ${msg.pending ? 'opacity-70' : ''}`}
                            >
                              {/* File attachments */}
                              {msg.file && msg.file.length > 0 && (
                                <div className="mb-2">
                                  {msg.file.map((file, idx) => {
                                    // Create proper URL with fallback
                                    const fileUrl = file.path ? 
                                      (file.path.startsWith('http') ? file.path : `${import.meta.env.VITE_API_URL}/${file.path.replace(/^\//, '')}`) : 
                                      '';
                                    
                                    return (
                                      <div key={`${msg._id}-file-${idx}`}>
                                        {file.type?.startsWith('image') ? (
                                          <img
                                            src={fileUrl}
                                            alt="uploaded"
                                            className="max-w-full h-auto rounded-lg"
                                            loading="lazy"
                                            onError={(e) => {
                                              console.error('Image failed to load:', fileUrl);
                                              e.target.src = 'https://via.placeholder.com/200?text=Image+Error';
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
                              {msg.content && <p className="text-sm break-words">{msg.content}</p>}

                              {/* Timestamp */}
                              <div className="flex justify-end mt-1">
                                <small className={`text-xs opacity-70 ${
                                  msg.sender === userId ? 'text-gray-200' : 'text-gray-500'
                                }`}>
                                  {formatTimestamp(msg.timestamp)}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()}

                {/* Read receipt indicator - Important for Instagram-like behavior */}
                {lastReadMessage && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end mt-1 pr-2"
                  >
                    <div className="flex items-center text-gray-400 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      <span>Seen</span>
                    </div>
                  </motion.div>
                )}

                {/* Pending messages indicator */}
                {pendingMessages.length > 0 && (
                  <div className="flex justify-end mt-1 pr-2">
                    <div className="flex items-center text-gray-400 text-xs">
                      <svg className="w-3 h-3 mr-1 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </div>
                  </div>
                )}

                {/* Typing indicator - shown at the bottom */}
                {otherUserTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-2 rounded-lg">
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
              <div className="flex flex-wrap gap-2 mb-4">
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
                <Image className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full px-4 py-2 border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors"
              />
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-md transition-colors"
                disabled={(!newMessage.trim() && files.length === 0) || !socketConnected}
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Chat;