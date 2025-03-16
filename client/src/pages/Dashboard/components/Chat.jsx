import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../stores/authStore';
import { useSocket } from '../../../SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Image, Video, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import subscriptionService from '../../../services/subscription.service';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const Chat = ({ subscription, onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState(subscription.messages || []);
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
  
  // Track which messages have been processed to avoid duplicates
  const processedMessageIds = useRef(new Set());

  const getUserId = () => {
    return user?.id || user?.user?.id;
  };

  const userId = getUserId();
  const coachId = subscription.assignedCoach;

  // Check socket connection
  useEffect(() => {
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
  }, [socket]);

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
  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(
        msg => !msg.read && msg.sender !== userId
      );
      
      if (unreadMessages.length === 0) return;
      
      const messageIds = unreadMessages.map(msg => msg._id);
      console.log('Marking messages as read:', messageIds);
      
      // Update local state immediately for better UX
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
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
    }
  };

  // Check for unread messages
  useEffect(() => {
    const unreadMessages = messages.filter(
      msg => !msg.read && msg.sender !== userId
    );
    
    if (unreadMessages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  // Socket connection and event handling
  useEffect(() => {
    if (!socket) return;
    
    console.log('Setting up socket event listeners in Chat component');
    
    // Handle receiving messages
    const handleReceiveMessage = (message) => {
      console.log('Received message via socket:', message);
      
      // Prevent duplicate messages by tracking processed IDs
      if (processedMessageIds.current.has(message._id)) {
        console.log('Skipping duplicate message:', message._id);
        return;
      }
      
      // Add to processed messages set
      processedMessageIds.current.add(message._id);
      
      setMessages(prev => {
        // Double-check if message already exists to prevent duplicates
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        
        // Add new message
        const newMessages = [...prev, message];
        
        // Mark as read immediately if it's not from the current user
        if (message.sender !== userId) {
          markMessagesAsRead();
        }
        
        return newMessages;
      });
    };
    
    // Handle typing indicator
    const handleTypingEvent = (data) => {
      if (data.senderId === coachId) {
        console.log('Coach is typing:', data.isTyping);
        setOtherUserTyping(data.isTyping);
      }
    };
    
    // Handle message read receipts
    const handleMessagesRead = (data) => {
      console.log('Messages read event received:', data);
      
      if (data.subscriptionId === subscription._id) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg._id) ? { ...msg, read: true } : msg
          )
        );
      }
    };
    
    // Handle message sent confirmation
    const handleMessageSent = (data) => {
      console.log('Message sent confirmation received:', data);
      
      // Remove from pending messages if it was delivered
      if (data.status === 'delivered') {
        setPendingMessages(prev => 
          prev.filter(msg => msg._id !== data.messageId)
        );
      }
    };
    
    // Register event listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTypingEvent);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('messageSent', handleMessageSent);
    
    // Register user with socket when component mounts
    if (userId) {
      socket.emit('register', userId);
      console.log('User registered with socket in Chat component:', userId);
    }
    
    // Clean up event listeners
    return () => {
      console.log('Cleaning up socket event listeners in Chat component');
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTypingEvent);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('messageSent', handleMessageSent);
    };
  }, [socket, userId, coachId, subscription._id]);

  // Initialize processed messages set with existing message IDs
  useEffect(() => {
    // Clear the set first
    processedMessageIds.current.clear();
    
    // Add all existing message IDs to the set
    messages.forEach(msg => {
      processedMessageIds.current.add(msg._id);
    });
  }, []);

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
        console.log('Sent typing:true event to coach');
      }
      
      // Set timer to stop typing indicator after inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', {
          senderId: userId,
          receiverId: coachId,
          isTyping: false
        });
        console.log('Sent typing:false event to coach after timeout');
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
        console.log('Sent typing:false event to coach (empty message)');
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
        toast.promise(
          subscriptionService.uploadFiles(files),
          {
            loading: 'Uploading files...',
            success: (result) => {
              uploadedFiles = result;
              return 'Files uploaded successfully';
            },
            error: 'Failed to upload files'
          }
        );
      }
      
      // When files are uploaded, update temporary message
      if (uploadedFiles.length > 0) {
        const fileAttachments = uploadedFiles.map(file => ({
          path: file.path,
          type: file.type
        }));
        
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId ? { ...msg, file: fileAttachments } : msg
          )
        );
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
          }))
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
      setMessages(prev => {
        // Remove the temporary message
        const filteredMessages = prev.filter(msg => msg._id !== tempId);
        
        // Get the new messages from the API response, avoiding duplicates
        const existingIds = new Set(filteredMessages.map(msg => msg._id));
        const newApiMessages = updatedSubscription.messages.filter(msg => !existingIds.has(msg._id));
        
        // Add to processed IDs set to prevent future duplicates
        newApiMessages.forEach(msg => {
          processedMessageIds.current.add(msg._id);
        });
        
        return [...filteredMessages, ...newApiMessages];
      });
      
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
    // Create a map to deduplicate messages by ID
    const messagesMap = new Map();
    
    // Add all messages to the map (newer versions will overwrite older ones)
    [...messages].forEach(msg => {
      messagesMap.set(msg._id, msg);
    });
    
    // Convert the map back to an array and sort by timestamp
    return Array.from(messagesMap.values()).sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }, [messages]);

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
            {allMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              allMessages.map((msg) => (
                <div 
                  key={`${msg._id}-${msg.timestamp}`} 
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
                        {msg.file.map((file, idx) => (
                          <div key={`${msg._id}-file-${idx}`}>
                            {file.type?.startsWith('image') ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}/${file.path}`}
                                alt="uploaded"
                                className="max-w-full h-auto rounded-lg"
                                loading="lazy"
                              />
                            ) : file.type?.startsWith('video') ? (
                              <video controls className="max-w-full h-auto rounded-lg">
                                <source src={`${import.meta.env.VITE_API_URL}/${file.path}`} type={file.type} />
                                Your browser does not support the video tag.
                              </video>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message content */}
                    {msg.content && <p className="text-sm break-words">{msg.content}</p>}

                    {/* Timestamp and status */}
                    <div className="flex items-center justify-end mt-1 text-right space-x-1">
                      <small className={`text-xs opacity-70 ${
                        msg.sender === userId ? 'text-gray-200' : 'text-gray-500'
                      }`}>
                        {format(parseISO(msg.timestamp), 'HH:mm')}
                      </small>
                      
                      {/* Message status indicators */}
                      {msg.sender === userId && (
                        <>
                          {msg.pending && (
                            <svg className="w-3 h-3 text-gray-200 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          
                          {!msg.pending && msg.read && (
                            <Eye className="w-3 h-3 text-gray-200" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
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