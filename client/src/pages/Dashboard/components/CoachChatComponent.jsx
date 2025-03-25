import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../../SocketContext';
import { useAuth } from '../../../stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User, X, Image, Eye, Loader2 } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import subscriptionService from '../../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CoachChatComponent = ({ onClose, selectedClient }) => {
  // Get socket object and connection status from context
  const { socket: socketInstance, connected: socketConnected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for managing chat state
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const lastReadTimestamp = useRef(0);
  const markingAsRead = useRef(false);
  const lastMessageReceived = useRef(null);
  
  // Get user IDs
  const userId = user?.id || user?.user?.id;
  const clientId = selectedClient?.userId || selectedClient?.user;
  
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

  // Fetch messages when client changes
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
        
        // Handle different response formats
        const fetchedMessages = Array.isArray(response) ? response : 
                              (response.messages ? response.messages : []);
        
        fetchedMessages.forEach(msg => {
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

    if (selectedClient?.id) {
      fetchMessages();
    }
    
    // Reset state when client changes
    return () => {
      setMessages([]);
      processedMessageIds.current.clear();
      lastMessageReceived.current = null;
    };
  }, [selectedClient?.id, userId]);

  // Set up socket connection monitoring
  useEffect(() => {
    // Skip if socket is not available
    if (!socketInstance) return;
    
    console.log('Coach setting up socket connection monitoring');
    
    // Register user with socket
    if (userId && socketConnected) {
      try {
        socketInstance.emit('register', userId);
        console.log('Coach registered with socket:', userId);
      } catch (err) {
        console.error("Error registering coach with socket:", err);
      }
    }
  }, [socketInstance, socketConnected, userId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!messageIds?.length || markingAsRead.current || !selectedClient?.id) return;
    
    try {
      markingAsRead.current = true;
      console.log('Coach marking messages as read:', messageIds);
      
      // Update local state immediately
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      // Update timestamp
      lastReadTimestamp.current = Date.now();
      
      // Send to server
      await subscriptionService.markMessagesAsRead(selectedClient.id, messageIds);
      
      // Emit socket event for real-time update to the sender
      if (socketInstance && socketConnected) {
        try {
          socketInstance.emit('messagesRead', {
            subscriptionId: selectedClient.id,
            messageIds,
            receiverId: clientId
          });
          console.log('Read receipt sent via socket to client');
        } catch (err) {
          console.error("Error sending read receipt:", err);
        }
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    } finally {
      markingAsRead.current = false;
    }
  }, [socketInstance, socketConnected, selectedClient?.id, clientId]);

  // Socket event handlers for messages, typing, and read receipts
  useEffect(() => {
    if (!socketInstance || !selectedClient?.id || !clientId) return;
    
    console.log('Setting up socket event listeners in Coach Chat component');
    
    // Handle receiving messages
    const handleReceiveMessage = (message) => {
      console.log('Coach received message via socket:', message);
      
      // Only process messages for the current client
      if (message.subscriptionId !== selectedClient.id) {
        return;
      }
      
      // Skip if already processed
      if (processedMessageIds.current.has(message._id)) {
        console.log('Coach skipping duplicate message:', message._id);
        return;
      }
      
      // Add to processed set
      processedMessageIds.current.add(message._id);
      
      // Save the last message from the client for read receipt purposes
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
        
        // If we're at the bottom and message is from the client, mark as read
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
      if (data.senderId === clientId) {
        console.log('Client is typing:', data.isTyping);
        setOtherUserTyping(data.isTyping);
      }
    };
    
    // Handle message read receipts
    const handleMessagesRead = (data) => {
      console.log('Coach received messages read event:', data);
      
      if (data.subscriptionId === selectedClient.id) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg._id) ? { ...msg, read: true } : msg
          )
        );
      }
    };
    
    try {
      // Register socket event listeners
      socketInstance.on('receiveMessage', handleReceiveMessage);
      socketInstance.on('typing', handleTypingEvent);
      socketInstance.on('messagesRead', handleMessagesRead);
    } catch (err) {
      console.error("Error setting up socket event listeners:", err);
    }
    
    // Cleanup function
    return () => {
      // Clean up event listeners
      try {
        console.log('Cleaning up socket event listeners in Coach Chat component');
        socketInstance.off('receiveMessage', handleReceiveMessage);
        socketInstance.off('typing', handleTypingEvent);
        socketInstance.off('messagesRead', handleMessagesRead);
      } catch (err) {
        console.error("Error cleaning up socket event listeners:", err);
      }
    };
  }, [socketInstance, userId, clientId, selectedClient?.id, markMessagesAsRead, isAtBottom]);

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
    
    if (!socketInstance || !socketConnected || !clientId) return;
    
    if (newMessage.trim()) {
      // Start typing indicator
      if (!isTyping) {
        setIsTyping(true);
        try {
          socketInstance.emit('typing', {
            senderId: userId,
            receiverId: clientId,
            isTyping: true
          });
        } catch (err) {
          console.error("Error sending typing indicator:", err);
        }
      }
      
      // Set timer to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        try {
          socketInstance.emit('typing', {
            senderId: userId,
            receiverId: clientId,
            isTyping: false
          });
        } catch (err) {
          console.error("Error stopping typing indicator:", err);
        }
      }, 2000);
    } else {
      // If message is empty, stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        try {
          socketInstance.emit('typing', {
            senderId: userId,
            receiverId: clientId,
            isTyping: false
          });
        } catch (err) {
          console.error("Error stopping typing indicator:", err);
        }
      }
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, socketInstance, socketConnected, isTyping, userId, clientId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping, scrollToBottom]);

  // File upload handling
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

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && files.length === 0) || !socketInstance || !selectedClient?.id) return;
    
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
        try {
          socketInstance.emit('typing', {
            senderId: userId,
            receiverId: clientId,
            isTyping: false
          });
        } catch (err) {
          console.error("Error stopping typing indicator:", err);
        }
      }
      
      // Upload files if any
      let uploadedFiles = [];
      if (files.length > 0) {
        try {
          const onProgress = (progress) => {
            // You could add progress bar functionality here
            console.log(`Upload progress: ${progress}%`);
          };
          
          uploadedFiles = await subscriptionService.uploadFiles(files, onProgress);
          
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
      
      // Emit via socket for real-time delivery
      if (socketConnected) {
        try {
          socketInstance.emit('sendMessage', {
            senderId: userId,
            receiverId: clientId,
            content: newMessage.trim(),
            timestamp: timestamp,
            file: uploadedFiles.map(file => ({
              path: file.path,
              type: file.type
            })),
            subscriptionId: selectedClient.id
          });
          console.log('Message sent via socket to client');
        } catch (err) {
          console.error("Error sending message via socket:", err);
          toast.error('Socket error, message will be saved but may be delayed');
        }
      } else {
        toast.error('Socket disconnected, message will be saved but may be delayed');
      }
      
      // Make API call to ensure message is stored
      const response = await subscriptionService.sendMessage(
        selectedClient.id,
        userId,
        clientId,
        newMessage.trim(),
        timestamp,
        uploadedFiles.map(file => ({
          path: file.path,
          type: file.type
        }))
      );
      
      // Replace temporary message with actual message
      if (response && response.messages) {
        setMessages(prev => {
          // Get the latest message from the API response
          const sortedMessages = [...response.messages].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
          const latestMessage = sortedMessages[0];
          
          if (latestMessage) {
            processedMessageIds.current.add(latestMessage._id);
          }
          
          // Remove the temporary message and add the real one
          return prev
            .filter(msg => msg._id !== tempId)
            .concat(latestMessage ? [latestMessage] : []);
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
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
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

  // Find the last read message from current user - improved version
  const [lastReadMessageId, setLastReadMessageId] = useState(null);
  
  // Initialize lastReadMessageId when messages load
  useEffect(() => {
    if (messages.length > 0 && userId) {
      // Get all messages sent by the coach (current user)
      const coachMessages = messages.filter(msg => 
        msg.sender === userId && !msg.pending
      );
      
      if (coachMessages.length === 0) return;
      
      // Sort in chronological order
      coachMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Find the last message that is read
      let lastReadMsg = null;
      
      for (let i = coachMessages.length - 1; i >= 0; i--) {
        if (coachMessages[i].read) {
          lastReadMsg = coachMessages[i];
          break;
        }
      }
      
      setLastReadMessageId(lastReadMsg?._id || null);
    }
  }, [messages, userId]);
  
  // Update lastReadMessageId when receiving messagesRead event
  useEffect(() => {
    if (!socketInstance || !selectedClient?.id) return;

    console.log('Setting up messagesRead event listener in coach component');
    
    const handleMessagesReadEvent = (data) => {
      console.log('Coach received messagesRead event:', data);
      
      if (data.subscriptionId !== selectedClient.id) return;
      
      // Check if this response includes a lastReadMessage directly from server
      if (data.lastReadMessage && data.lastReadMessage._id) {
        console.log('Coach using server-provided last read message ID:', data.lastReadMessage._id);
        setLastReadMessageId(data.lastReadMessage._id);
        return;
      }
      
      // Get messages sent by me (coach) that were marked as read
      const myMessages = messages.filter(msg => msg.sender === userId);
      console.log(`Found ${myMessages.length} messages from coach`);
      
      const myReadMessages = myMessages.filter(msg => 
        data.messageIds.includes(msg._id)
      );
      
      console.log(`${myReadMessages.length} of coach messages were marked as read in this event`);
      
      // If any messages were marked as read, update the last read message ID
      if (myReadMessages.length > 0) {
        // Sort in reverse chronological order
        myReadMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const newLastReadMessageId = myReadMessages[0]._id;
        console.log('Setting coach last read message ID to:', newLastReadMessageId);
        setLastReadMessageId(newLastReadMessageId);
      }
    };
    
    try {
      socketInstance.on('messagesRead', handleMessagesReadEvent);
      
      return () => {
        console.log('Removing messagesRead event listener from coach component');
        socketInstance.off('messagesRead', handleMessagesReadEvent);
      };
    } catch (err) {
      console.error("Error with messagesRead event listener:", err);
    }
  }, [socketInstance, selectedClient?.id, userId, messages]);

  // Get client name for display
  const clientName = `${selectedClient?.firstName || ''} ${selectedClient?.lastName || ''}`.trim() || 'Client';

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
              <span className="font-semibold text-lg">{clientName}</span>
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
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <AnimatePresence>
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
                      const isLastReadMessage = message._id === lastReadMessageId;
                      
                      return (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          className="message-container mb-4"
                        >
                          <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            <div 
                              className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                                isCurrentUser 
                                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                                  : 'bg-white border text-gray-800'
                              } ${message.pending ? 'opacity-70' : ''}`}
                              title={format(parseISO(message.timestamp), 'MMMM d, yyyy HH:mm')}
                              onClick={(e) => {
                                // Show timestamp on mobile devices on tap
                                if (window.innerWidth <= 768) {
                                  alert(format(parseISO(message.timestamp), 'MMMM d, yyyy HH:mm'));
                                }
                              }}
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
                              {message.content && <p className="break-words">{message.content}</p>}

                              {/* Timestamp - Hidden by default, visible on hover via title attribute */}
                              <div className="flex justify-end mt-1">
                                <small className={`text-xs opacity-70 ${
                                  isCurrentUser ? 'text-gray-200' : 'text-gray-500'
                                }`}>
                                  {format(parseISO(message.timestamp), 'HH:mm')}
                                </small>
                              </div>
                            </div>
                          </div>
                          
                          {/* Read receipt indicator - now below the message like in Chat.jsx */}
                          {message._id === lastReadMessageId && (
                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mt-1 pr-2`} key={`read-${message._id}`}>
                              <div className="flex items-center text-gray-500 text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                <span>Seen</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Message sending indicator */}
                          {message.pending && (
                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mt-1 pr-2`} key={`pending-${message._id}`}>
                              <div className="flex items-center text-gray-500 text-xs">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                <span>Sending...</span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
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
          <form onSubmit={handleSendMessage} className="flex justify-center items-center space-x-2">
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
              disabled={(!newMessage.trim() && files.length === 0) || !socketConnected}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center disabled:bg-gray-400"
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