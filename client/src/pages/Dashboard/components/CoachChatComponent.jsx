import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../../SocketContext';
import { useAuth } from '../../../stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User, X, Image, Video, Eye } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import subscriptionService from '../../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CoachChatComponent = ({ onClose, selectedClient, isChatOpen }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef(new Set());
  // Track last read timestamp to avoid unnecessary mark-as-read calls
  const lastReadTimestamp = useRef(0);
  // Use a ref to track whether a mark-as-read operation is in progress
  const markingAsRead = useRef(false);

  const getUserId = () => {
    return user?.id || user?.user?.id;
  };

  const userId = getUserId();
  const clientId = selectedClient?.userId || selectedClient?.id;

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

  // Check socket connection
  useEffect(() => {
    if (socket) {
      setSocketConnected(socket.connected);
      
      const handleConnect = () => {
        console.log('Socket connected in coach chat component');
        setSocketConnected(true);
      };
      
      const handleDisconnect = () => {
        console.log('Socket disconnected in coach chat component');
        setSocketConnected(false);
      };
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket]);

  // Load messages when client changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedClient?.id) return;
      
      try {
        setIsLoading(true);
        console.log('Coach fetching messages for client:', selectedClient.id);
        const response = await subscriptionService.fetchMessages(selectedClient.id);
        
        // Reset processed IDs when loading a new set of messages
        processedMessageIds.current.clear();
        
        // Create a new array for de-duplicated messages
        const uniqueMessages = [];
        const messageIds = new Set();
        
        // Use the actual messages array from the response
        const fetchedMessages = Array.isArray(response) ? response : 
                               (response.messages ? response.messages : []);
        
        fetchedMessages.forEach(msg => {
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
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    // Reset state when client changes
    return () => {
      setMessages([]);
      processedMessageIds.current.clear();
    };
  }, [selectedClient?.id, userId]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if user is at bottom of chat
  const isAtBottom = () => {
    if (!chatContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 50;
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds) => {
    // Return if there are no messages to mark, already marking, or not connected
    if (!messageIds || messageIds.length === 0 || markingAsRead.current || !selectedClient?.id) return;
    
    try {
      markingAsRead.current = true;
      console.log('Coach marking messages as read:', messageIds);
      
      // Update local state immediately for better UX
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      // Update read timestamp
      lastReadTimestamp.current = Date.now();
      
      // Send to server
      await subscriptionService.markMessagesAsRead(selectedClient.id, messageIds);
      
      // Emit socket event for real-time update
      if (socket && socketConnected) {
        socket.emit('messagesRead', {
          subscriptionId: selectedClient.id,
          messageIds,
          receiverId: clientId
        });
        console.log('Read receipt sent via socket for messages:', messageIds);
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    } finally {
      markingAsRead.current = false;
    }
  };

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
  }, [messages, userId]);

  // Scroll to bottom when messages change if at bottom
  useEffect(() => {
      scrollToBottom();
  }, [messages, otherUserTyping]);

  const handleMessagesRead = useCallback((data) => {
    console.log('Coach received messages read event:', data);
    
    if (data.subscriptionId === selectedClient?.id) {
      setMessages(prev => 
        prev.map(msg => 
          data.messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
    }
  }, [selectedClient?.id]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !selectedClient) return;
    
    console.log('Setting up socket event listeners in Coach Chat component');
    
    // Handle receiving messages
    const handleReceiveMessage = (message) => {
      console.log('Coach received message via socket:', message);
      
      // Check if we've already processed this message ID
      if (processedMessageIds.current.has(message._id)) {
        console.log('Coach skipping duplicate message:', message._id);
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
      if (data.senderId === clientId) {
        console.log('Client is typing:', data.isTyping);
        setOtherUserTyping(data.isTyping);
      }
    };
    
    // Register event listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTypingEvent);
    socket.on('messagesRead', handleMessagesRead);
    
    // Register user with socket when component mounts
    if (userId) {
      socket.emit('register', userId);
      console.log('Coach registered with socket in Chat component:', userId);
    }
    
    // Clean up event listeners
    return () => {
      console.log('Cleaning up socket event listeners in Coach Chat component');
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTypingEvent);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [socket, userId, clientId, selectedClient?.id, handleMessagesRead]);

  // Handle typing indicator with debounce
  useEffect(() => {
    // Clear existing timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (!socket || !socketConnected || !clientId) return;
    
    if (newMessage.trim()) {
      // Start typing indicator
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          senderId: userId,
          receiverId: clientId,
          isTyping: true
        });
      }
      
      // Set timer to stop typing indicator after inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: clientId,
          isTyping: false
        });
      }, 2000);
    } else {
      // If message is empty, immediately stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: clientId,
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
  }, [newMessage, socket, socketConnected, isTyping, userId, clientId]);

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

  // Send message handler
  const sendMessage = async (e) => {
    e.preventDefault();

    if ((!newMessage.trim() && files.length === 0) || !socket || !selectedClient?.id) return;

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
          receiverId: clientId,
          isTyping: false,
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
            type: file.type,
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
          receiverId: clientId,
          content: newMessage.trim(),
          timestamp: timestamp,
          file: uploadedFiles.map(file => ({
            path: file.path,
            type: file.type,
          })),
          subscriptionId: selectedClient.id
        });
        console.log('Message sent via socket');
      } else {
        toast.error('Socket disconnected, message will be sent when connection is restored');
      }

      // Make API call to ensure message is stored
      const updatedSubscription = await subscriptionService.sendMessage(
        selectedClient.id,
        userId,
        clientId,
        newMessage.trim(),
        timestamp,
        uploadedFiles.map(file => ({
          path: file.path,
          type: file.type,
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

  // All messages including pending ones, ensuring unique IDs and proper sorting
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
  // This function now correctly selects the most recently sent message by the coach that has been read
  const lastSeenMessage = React.useMemo(() => {
    // Get all messages from the coach that have been read, sorted by timestamp (newest first)
    const coachMessages = allMessages
      .filter(msg => msg.sender === userId && !msg.pending && msg.read)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Return the most recent read message (first one in the sorted array)
    return coachMessages[0];
  }, [allMessages, userId]);

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 z-[9999] bg-gray-100 flex flex-col"
    >
      <div className="flex flex-col max-w-2xl mx-auto w-full shadow-xl bg-white overflow-hidden h-full">
        {/* Header */}
        <div className="sticky z-[9999] bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/20 absolute left-2 top-1/2 -translate-y-1/2"
            >
              <ArrowLeft />
            </Button>
            <div className="flex items-center gap-2 mx-auto">
              <User className="w-6 h-6" />
              <span className="font-semibold text-lg">
                {selectedClient.firstName} {selectedClient.lastName}
              </span>
            </div>
            {!socketConnected && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-500 px-2 py-1 text-xs">
                Reconnecting...
              </div>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50"
          onScroll={() => {
            if (isAtBottom()) {
              const unreadMessages = messages
                .filter(msg => !msg.read && msg.sender !== userId)
                .map(msg => msg._id);
              
              if (unreadMessages.length > 0) {
                markMessagesAsRead(unreadMessages);
              }
            }
          }}
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
            <AnimatePresence>
              {/* Group messages by date */}
              {(() => {
                let currentDate = null;
                return allMessages.map((message, index) => {
                  // Check if we need to display a date separator
                  const msgDate = new Date(message.timestamp);
                  const messageDate = format(msgDate, 'yyyy-MM-dd');
                  const showDateSeparator = currentDate !== messageDate;
                  
                  // Update current date
                  if (showDateSeparator) {
                    currentDate = messageDate;
                  }
                  
                  return (
                    <React.Fragment key={`${message._id}-${index}`}>
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
                  
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${message.sender === userId ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                            message.sender === userId
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                              : 'bg-white border text-gray-800'
                          } ${message.pending ? 'opacity-70' : ''}`}
                        >
                          {/* Display files if they exist */}
                          {message.file && message.file.length > 0 && (
                            <div className="mb-2">
                              {message.file.map((file, idx) => {
                                // Create proper URL with fallback
                                const fileUrl = file.path ? 
                                  (file.path.startsWith('http') ? file.path : `${import.meta.env.VITE_API_URL}/${file.path.replace(/^\//, '')}`) : 
                                  '';
                                
                                return (
                                  <div key={`${message._id}-file-${idx}`}>
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

                          {/* Display message content if it exists */}
                          {message.content && <p className="break-words">{message.content}</p>}

                          {/* Display timestamp */}
                          <small className={`text-xs opacity-70 ${
                            message.sender === userId ? 'text-gray-200' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </small>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                });
              })()}

              {/* Read indicator - Instagram-like behavior for the most recent read message */}
              {lastSeenMessage && (
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

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
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
            </AnimatePresence>
          )}
        </div>

        {/* Message Input Area */}
        <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
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
          <form onSubmit={sendMessage} className="flex justify-center items-center space-x-2">
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
              className="flex-1 rounded-full px-4 py-2 border-2 border-gray-300 focus:border-indigo-500 transition-colors"
            />
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center"
              disabled={(!newMessage.trim() && files.length === 0) || !socketConnected}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default CoachChatComponent;