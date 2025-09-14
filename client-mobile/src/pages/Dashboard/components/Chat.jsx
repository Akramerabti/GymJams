import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../stores/authStore';
import { useSocket } from '../../../SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Image, X, Eye, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import subscriptionService from '../../../services/subscription.service';
import { format, parseISO, isSameDay } from 'date-fns';
import { toast } from 'sonner';

const Chat = ({ subscription, onClose }) => {
  const { user } = useAuth();
  const { socket, connected, connecting, reconnect } = useSocket();
  
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
  
  // Get user info
  const userId = user?.id || user?.user?.id;
  const coachId = subscription?.assignedCoach;
  
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

  // Try to reconnect socket if needed
  useEffect(() => {
    if (!connected && !connecting && socket === null) {
      //('Chat: Socket not connected, attempting to reconnect...');
      reconnect();
    }
  }, [connected, connecting, socket, reconnect]);

  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await subscriptionService.fetchMessages(subscription._id);
        
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

    if (subscription?._id) {
      fetchMessages();
    }
    
    return () => {
      // Clean up
      markingAsRead.current = false;
      processedMessageIds.current.clear();
    };
  }, [subscription?._id, userId]);

  // Register user with socket when connected
  useEffect(() => {
    if (socket && connected && userId) {
      try {
        //('Registering user with socket in Chat component:', userId);
        socket.emit('register', userId);
      } catch (err) {
        console.error('Error registering user with socket:', err);
      }
    }
  }, [socket, connected, userId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!messageIds?.length || markingAsRead.current || !subscription?._id) return;
    
    try {
      markingAsRead.current = true;
      //('Marking messages as read:', messageIds);
      
      // Update local state immediately
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      // Update timestamp
      lastReadTimestamp.current = Date.now();
      
      // Send to server
      await subscriptionService.markMessagesAsRead(subscription._id, messageIds);
      
      // Emit socket event for real-time update to the sender
      if (socket && connected && coachId) {
        try {
          socket.emit('messagesRead', {
            subscriptionId: subscription._id,
            messageIds,
            receiverId: coachId
          });
          //('Read receipt sent via socket');
        } catch (err) {
          console.error('Error sending read receipt via socket:', err);
        }
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    } finally {
      markingAsRead.current = false;
    }
  }, [socket, connected, subscription?._id, coachId]);

  // Socket event handlers for messages, typing, and read receipts
  useEffect(() => {
    if (!socket || !connected || !subscription?._id) return;
    
    // Handler functions
    const handleReceiveMessage = (message) => {
      //('Received message via socket:', message);
      
      // Skip if already processed
      if (processedMessageIds.current.has(message._id)) {
        //('Skipping duplicate message:', message._id);
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
      if (data.senderId === coachId) {
        setOtherUserTyping(data.isTyping);
      }
    };
    
    // Handle message read receipts
    const handleMessagesRead = (data) => {
      //('Messages read event received:', data);
      
      if (data.subscriptionId === subscription._id) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg._id) ? { ...msg, read: true } : msg
          )
        );
      }
    };
    
    try {
      // Register socket event listeners
      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('typing', handleTypingEvent);
      socket.on('messagesRead', handleMessagesRead);
    } catch (err) {
      console.error('Error setting up socket event listeners:', err);
    }
    
    return () => {
      // Clean up event listeners
      if (socket && connected) {
        try {
          socket.off('receiveMessage', handleReceiveMessage);
          socket.off('typing', handleTypingEvent);
          socket.off('messagesRead', handleMessagesRead);
        } catch (err) {
          console.error('Error removing socket event listeners:', err);
        }
      }
    };
  }, [socket, connected, userId, coachId, subscription?._id, markMessagesAsRead, isAtBottom]);

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
    
    if (!socket || !connected || !coachId) return;
    
    if (newMessage.trim()) {
      // Start typing indicator
      if (!isTyping) {
        setIsTyping(true);
        try {
          socket.emit('typing', {
            senderId: userId,
            receiverId: coachId,
            isTyping: true
          });
        } catch (err) {
          console.error('Error sending typing indicator:', err);
        }
      }
      
      // Set timer to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (socket && connected) {
          try {
            socket.emit('typing', {
              senderId: userId,
              receiverId: coachId,
              isTyping: false
            });
          } catch (err) {
            console.error('Error sending typing stop indicator:', err);
          }
        }
      }, 2000);
    } else {
      // If message is empty, stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        try {
          socket.emit('typing', {
            senderId: userId,
            receiverId: coachId,
            isTyping: false
          });
        } catch (err) {
          console.error('Error sending typing stop indicator:', err);
        }
      }
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, socket, connected, isTyping, userId, coachId]);

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
    
    // Accept images, videos, and PDFs
    if (
      file.type.startsWith('image') ||
      file.type.startsWith('video') ||
      file.type === 'application/pdf'
    ) {
      validFiles.push(file);
    } else {
      toast.error(`File type not supported: ${file.name}`);
    }
  }
  
  setFiles(prev => [...prev, ...validFiles]);
};

  // Remove a file from selection
  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Replace the handleSendMessage function in Chat.jsx with this corrected version:

const handleSendMessage = async () => {
  if ((!newMessage.trim() && files.length === 0)) return;
  if (!connected) {
    toast.error('You are currently offline. Please try again when connected.');
    return;
  }
  
  let tempId;
  try {
    const timestamp = new Date().toISOString();
    tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageContent = newMessage.trim();
    
    // Create temporary message
    const tempMessage = {
      _id: tempId,
      sender: userId,
      content: messageContent,
      timestamp: timestamp,
      read: false,
      pending: true,
      file: []
    };
    
    // Add to messages immediately and to processed IDs
    setMessages(prev => [...prev, tempMessage]);
    processedMessageIds.current.add(tempId);
    
    // Clear input and reset typing
    setNewMessage('');
    if (isTyping) {
      setIsTyping(false);
      if (socket && connected) {
        try {
          socket.emit('typing', {
            senderId: userId,
            receiverId: coachId, // or coachId for Chat.jsx
            isTyping: false,
            subscriptionId: subscription._id // or subscription._id for Chat.jsx
          });
        } catch (err) {
          console.error('Error sending typing stop indicator:', err);
        }
      }
    }
    
    // Upload files if any
    let uploadedFiles = [];
    if (files.length > 0) {
      try {

        const onProgress = (progress) => {
        };
        
        uploadedFiles = await subscriptionService.uploadFiles(files, onProgress);
        
        
        const fileAttachments = uploadedFiles.map(file => {
          
          return {
            path: file.path,
            type: file.type,
            originalName: file.originalName, 
            size: file.size,
            mimetype: file.mimetype
          };
        });


        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId ? { ...msg, file: fileAttachments } : msg
          )
        );
      } catch (error) {
        console.error('❌ Failed to upload files:', error);
        toast.error('Failed to upload files');
      }
    }
    
    const socketMessageData = {
      senderId: userId,
      receiverId: coachId, // or coachId for Chat.jsx
      content: messageContent,
      timestamp,
      subscriptionId: subscription._id, // or subscription._id for Chat.jsx
      file: uploadedFiles.map(file => {
        return {
          path: file.path,
          type: file.type,
          originalName: file.originalName, // ✅ CRITICAL: Preserve originalName
          size: file.size,
          mimetype: file.mimetype
        };
      })
    };
    
    // Send via socket for real-time delivery if connected
    if (socket && connected) {
      try {
        socket.emit('sendMessage', socketMessageData);
      } catch (socketError) {
        console.error('❌ Error sending message via socket:', socketError);
      }
    }

    // Prepare API message data
    const apiFileData = uploadedFiles.map(file => {
      return {
        path: file.path,
        type: file.type,
        originalName: file.originalName, // ✅ CRITICAL: Preserve originalName
        size: file.size,
        mimetype: file.mimetype
      };
    });


    const response = await subscriptionService.sendMessage(
      subscription._id, // or subscription._id for Chat.jsx
      userId,
      coachId, // or coachId for Chat.jsx
      messageContent,
      timestamp,
      apiFileData
    );
    
    
    // Replace temporary message with actual message
    if (response) {
      let serverMessage = null;
      
      // Handle different response formats
      if (response.messages && Array.isArray(response.messages)) {
        const sortedMessages = [...response.messages].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        serverMessage = sortedMessages[0];
      } else if (response.message) {
        serverMessage = response.message;
      } else if (response._id) {
        serverMessage = response;
      }
      
      if (serverMessage) {
        
        processedMessageIds.current.add(serverMessage._id);
        
        setMessages(prev => {
          const hasDuplicate = prev.some(msg => 
            msg._id !== tempId &&
            !msg.pending &&
            msg.sender === serverMessage.sender &&
            msg.content === serverMessage.content &&
            Math.abs(new Date(msg.timestamp) - new Date(serverMessage.timestamp)) < 3000
          );
          
          if (hasDuplicate) {
            return prev.filter(msg => msg._id !== tempId);
          }
          
          return prev
            .filter(msg => msg._id !== tempId)
            .concat(serverMessage);
        });
      } else {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId ? { ...msg, pending: false } : msg
          )
        );
      }
    }
    
    // Clear files
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Scroll to bottom
    scrollToBottom();
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    toast.error('Failed to send message. Please try again.');
    
    if (tempId) {
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
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
      // Get all messages sent by the user (current user)
      const userMessages = messages.filter(msg => 
        msg.sender === userId && !msg.pending
      );
      
      if (userMessages.length === 0) return;
      
      // Sort in chronological order
      userMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Find the last message that is read
      let lastReadMsg = null;
      
      for (let i = userMessages.length - 1; i >= 0; i--) {
        if (userMessages[i].read) {
          lastReadMsg = userMessages[i];
          break;
        }
      }
      
      setLastReadMessageId(lastReadMsg?._id || null);
    }
  }, [messages, userId]);
  
  // Update lastReadMessageId when receiving messagesRead event
  useEffect(() => {
    if (!socket || !connected || !subscription?._id) return;

    //('Setting up messagesRead event listener');
    
    const handleMessagesReadEvent = (data) => {
      //('Received messagesRead event:', data);
      
      if (data.subscriptionId !== subscription._id) return;
      
      // Check if this response includes a lastReadMessage directly from server
      if (data.lastReadMessage && data.lastReadMessage._id) {
        //('Using server-provided last read message ID:', data.lastReadMessage._id);
        setLastReadMessageId(data.lastReadMessage._id);
        return;
      }
      
      // Get messages sent by me (user) that were marked as read
      const myMessages = messages.filter(msg => msg.sender === userId);
      //(`Found ${myMessages.length} messages from me`);
      
      const myReadMessages = myMessages.filter(msg => 
        data.messageIds.includes(msg._id)
      );
      
      //(`${myReadMessages.length} of my messages were marked as read in this event`);
      
      // If any messages were marked as read, update the last read message ID
      if (myReadMessages.length > 0) {
        // Sort in reverse chronological order
        myReadMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const newLastReadMessageId = myReadMessages[0]._id;
        //('Setting last read message ID to:', newLastReadMessageId);
        setLastReadMessageId(newLastReadMessageId);
      }
    };
    
    try {
      socket.on('messagesRead', handleMessagesReadEvent);
    } catch (err) {
      console.error('Error setting up messagesRead event listener:', err);
    }
    
    return () => {
      if (socket && connected) {
        try {
          socket.off('messagesRead', handleMessagesReadEvent);
        } catch (err) {
          console.error('Error removing messagesRead event listener:', err);
        }
      }
    };
  }, [socket, connected, subscription?._id, userId, messages]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
        className="fixed left-0 right-0 top-24 bottom-0 bg-gray-50 z-[9999] flex flex-col items-center justify-center"
      >
        <div className="max-w-2xl w-full h-full md:h-[calc(100dvh-8rem)] md:rounded-lg md:shadow-2xl bg-white flex flex-col overflow-hidden">
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
              {!connected && (
                <div className="ml-auto rounded-full bg-red-500 px-3 py-1 text-xs text-white">
                  {connecting ? 'Connecting...' : 'Offline'}
                </div>
              )}
            </div>
          </div>

          {/* Chat Message Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 overflow-y-auto"
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
              <>
                {/* Message groups by date */}
                {groupedMessages.map((group, groupIndex) => (
                  <div key={`date-${groupIndex}`} className="mb-6">
                    {/* Date separator */}
                    <div className="flex justify-center mb-4">
                      <div className="bg-gray-200 rounded-full px-4 py-1 text-xs text-black">
                        {format(group.date, 'MMMM d, yyyy')}
                      </div>
                    </div>
                    
                    {/* Messages for this date */}
                    <div className="space-y-4">
                      {group.messages.map((message) => {
                        const isCurrentUser = message.sender === userId;
                        const isLastReadMessage = message._id === lastReadMessageId;
                        
                        return (
                          <div key={message._id} className="message-container">
                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div 
                                className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                                  isCurrentUser 
                                    ? 'bg-indigo-500 text-white' 
                                    : 'bg-gray-100 text-gray-800'
                                } ${message.pending ? 'opacity-70' : ''}`}
                              >
                                  {/* File attachments */}
{message.file && message.file.length > 0 && (
  <div className="mb-2">
    {message.file.map((file, idx) => {

      let displayName = file.originalName;
      
      // Only use fallbacks if originalName is truly missing or corrupted
      if (!displayName || displayName.trim() === '' || /^[a-f0-9\-]{32,}$/.test(displayName)) {

        
        // Try to extract from path as last resort
        if (file.path) {
          const pathParts = file.path.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          
          // If the last part of path looks like a filename with extension, use it
          if (lastPart.includes('.') && !(/^[a-f0-9\-]{32,}\.[a-z0-9]+$/i.test(lastPart))) {
            displayName = lastPart;
          } else {
            // Extract just the extension if available
            const extension = lastPart.split('.').pop();
            displayName = `File.${extension}`;
          }
        } else {
          displayName = 'Unknown file';
        }
      }

      // Fix type detection
      let fileType = file.type;
      if (!fileType && file.mimetype) {
        fileType = file.mimetype;
      }
      
      // Enhanced type detection fallback
      if (!fileType || fileType === 'image' || fileType === 'video') {
        const extension = displayName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
          fileType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) {
          fileType = `video/${extension}`;
        } else if (extension === 'pdf') {
          fileType = 'application/pdf';
        }
      }

      // File URL logic
      const fileUrl = file.path
        ? (file.path.startsWith('http') ? file.path : `${import.meta.env.VITE_API_URL}/${file.path.replace(/^\//, '')}`)
        : '';

      const isPDF = fileType === 'application/pdf' || displayName.toLowerCase().endsWith('.pdf');
      const isImage = fileType && fileType.startsWith('image/');
      const isVideo = fileType && fileType.startsWith('video/');

      return (
        <div key={`${message._id}-file-${idx}`} className="mb-2">
          {isPDF ? (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg max-w-sm">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#000' }} title={displayName}>
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">PDF Document</p>
              </div>
              <a
                href={fileUrl}
                download={displayName}
                className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                title={`Download ${displayName}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          ) : isImage ? (
            <div>
              <img
                src={fileUrl}
                alt={displayName}
                className="max-w-full h-auto rounded-lg"
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200?text=Image+Error';
                }}
                title={displayName}
              />
            </div>
          ) : isVideo ? (
            <div>
              <video controls className="max-w-full h-auto rounded-lg" title={displayName}>
                <source src={fileUrl} type={fileType} />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="p-2 bg-gray-100 rounded-lg">
              <p className="text-xs" title={displayName}>
                📄 {displayName}
              </p>
              <a
                href={fileUrl}
                download={displayName}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Download
              </a>
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
                            
                            {/* Read receipt indicator */}
                            {isLastReadMessage && (
                              <div className="flex justify-end mt-1 pr-2">
                                <div className="flex items-center text-gray-500 text-xs">
                                  <Eye className="w-3 h-3 mr-1" />
                                  <span>Seen</span>
                                </div>
                              </div>
                            )}
                            
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
            {/* Selected files preview */}
{files.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto">
    {files.map((file, index) => {
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      return (
        <div key={`file-preview-${index}`} className="relative">
          {isImage ? (
            <img src={URL.createObjectURL(file)} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
          ) : isVideo ? (
            <video className="w-24 h-24 object-cover rounded-lg">
              <source src={URL.createObjectURL(file)} type={file.type} />
              Your browser does not support the video tag.
            </video>
          ) : isPDF ? (
            <div className="w-24 h-24 flex flex-col items-center justify-center bg-red-100 rounded-lg border-2 border-red-200">
              <svg className="w-8 h-8 text-red-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-center px-1 font-medium text-red-800">
                {file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name}
              </span>
            </div>
          ) : (
            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-lg">
              <span className="text-xs text-center p-2 break-words">
                {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
              </span>
            </div>
          )}
          <button
            onClick={() => handleRemoveFile(index)}
            className="absolute top-1 right-1 bg-white/80 p-1 rounded-full hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-gray-800" />
          </button>
          
          {/* Tooltip with full filename on hover */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 rounded-b-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="truncate text-center">
              {file.name}
            </div>
          </div>
        </div>
      );
    })}
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
    accept="image/*,video/*,application/pdf"  // Add PDF support
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
                disabled={(!newMessage.trim() && files.length === 0) || !connected}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-md transition-colors disabled:bg-gray-400"
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