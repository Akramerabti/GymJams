import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../../SocketContext';
import { useAuth } from '../../../stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User, X, Image, Eye, Loader2 } from 'lucide-react';
import { format, parseISO, isSameDay, formatDistanceToNow } from 'date-fns';
import subscriptionService from '../../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CoachChatComponent = ({ onClose, selectedClient }) => {
  const { user } = useAuth();
  const { socket, connected, connecting, reconnect } = useSocket();
  
  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastReadMessageId, setLastReadMessageId] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  
  // Refs for managing chat state
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const lastReadTimestamp = useRef(0);
  const markingAsRead = useRef(false);
  const lastMessageReceived = useRef(null);
  const registrationAttemptsRef = useRef(0);
  
  // Get user info
  const userId = user?.id || user?.user?.id;
  const clientId = selectedClient?.userId || selectedClient?.user;
  const subscriberId = selectedClient?.id || selectedClient?._id;

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      //('Socket connected');
      if (user?.id) {
        socket.emit('register', user.id);
      }
    };

    const handleDisconnect = () => {
      //('Socket disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, user]);
  
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

  // Mark messages as read - Define this callback first before using it
  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!messageIds?.length || markingAsRead.current || !subscriberId) return;
    
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
      await subscriptionService.markMessagesAsRead(subscriberId, messageIds);
      
      // Emit socket event for real-time update to the sender
      if (socket && connected && clientId) {
        try {
          socket.emit('messagesRead', {
            subscriptionId: subscriberId,
            messageIds,
            receiverId: clientId
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
  }, [socket, connected, subscriberId, clientId]);


  useEffect(() => {

    if (!socket && !connecting) {
      //('Socket not connected and not connecting, attempting reconnect...');
      reconnect();
      return; // Exit early and wait for next effect run with socket
    }

    // STEP 2: Register with socket if connected
    if (socket && connected && userId) {
      try {
        registrationAttemptsRef.current += 1;
        //(`Registering user with socket (attempt #${registrationAttemptsRef.current}):`, userId);
        socket.emit('register', userId);
        setSocketReady(true);
      } catch (err) {
        console.error('Error registering user with socket:', err);
        setSocketReady(false);
      }
    } else {
      setSocketReady(false);
    }

    // STEP 3: Setup event listeners if socket is available
      const handleReceiveMessage = (message) => {
        //('Received message via socket:', message);
        
        // Skip if not for this subscription
        if (message.subscriptionId !== subscriberId) {
          //('Message is for a different subscription, ignoring');
          return;
        }
        
        // Skip if already processed by ID
        if (processedMessageIds.current.has(message._id)) {
          //('Skipping already processed message by ID:', message._id);
          return;
        }
        
        // Add to processed set
        processedMessageIds.current.add(message._id);
        
        // Save the last message from the other party for read receipt purposes
        if (message.sender !== userId) {
          lastMessageReceived.current = message;
        }
        
        // Add to messages with enhanced deduplication
        setMessages(prev => {
          // First check: ID-based deduplication
          if (prev.some(m => m._id === message._id)) {
            //('Message already exists in state, skipping duplicate by ID');
            return prev;
          }
          
          // Second check: Content + timestamp deduplication (handles cases where backend returns same message with different IDs)
          const isDuplicateContent = prev.some(m => 
            m.sender === message.sender && 
            m.content === message.content && 
            Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 3000 // Within 3 seconds
          );
          
          if (isDuplicateContent) {
            //('Skipping duplicate message with same content & similar timestamp');
            return prev;
          }
          
          // Third check: Replace temp messages with actual messages
          // If there's a pending message with same content from same sender, replace it
          const hasPendingVersion = prev.findIndex(m => 
            m.pending && 
            m.sender === message.sender && 
            m.content === message.content
          );
          
          let newMessages;
          if (hasPendingVersion !== -1) {
            //('Replacing pending message with confirmed message');
            newMessages = [...prev];
            newMessages[hasPendingVersion] = message;
          } else {
            // No pending version, just add the new message
            newMessages = [...prev, message];
          }
          
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
        // Skip if not for this subscription
        if (data.subscriptionId !== subscriberId) return;
        
        // Update typing state if from the client
        if (data.senderId === clientId) {
          setOtherUserTyping(data.isTyping);
        }
      };
      
      // Handle message read receipts
      const handleMessagesRead = (data) => {
        //('Messages read event received:', data);
        
        // Skip if not for this subscription
        if (data.subscriptionId !== subscriberId) return;
        
        // Update messages' read status
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg._id) ? { ...msg, read: true } : msg
          )
        );
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('typing', handleTypingEvent);
      socket.on('messagesRead', handleMessagesRead);
  
      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('typing', handleTypingEvent);
        socket.off('messagesRead', handleMessagesRead);
      };
    }, [socket, connected, subscriberId, userId, clientId, isAtBottom, markMessagesAsRead]);

  // Fetch messages when component mounts or subscription changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!subscriberId) {
        //('No subscription ID available, skipping message fetch');
        return;
      }

      try {
        setIsLoading(true);
        //('Fetching messages for subscription:', subscriberId);
        const response = await subscriptionService.fetchMessages(subscriberId);
        
        // Reset processed message IDs
        processedMessageIds.current.clear();
        
        // Process the response format - handle both array and object formats
        let fetchedMessages = [];
        if (Array.isArray(response)) {
          fetchedMessages = response;
        } else if (response && Array.isArray(response.messages)) {
          fetchedMessages = response.messages;
        } else {
          console.warn('Unexpected response format from messages API:', response);
          fetchedMessages = [];
        }
        
        //(`Received ${fetchedMessages.length} messages, processing...`);
        
        // Sort and deduplicate messages with improved algorithm
        const uniqueMessages = [];
        const messageIds = new Set();
        const seenContents = new Map(); // Map of content+timestamp to count occurrences
        
        // First pass: identify duplicate content with same timestamps
        fetchedMessages.forEach(msg => {
          const contentKey = `${msg.content || ''}|${msg.timestamp}|${msg.sender}`;
          seenContents.set(contentKey, (seenContents.get(contentKey) || 0) + 1);
        });
        
        // Second pass: add messages, skipping duplicates
        fetchedMessages.forEach(msg => {
          // Always skip if ID is already processed
          if (messageIds.has(msg._id)) {
            return;
          }
          
          // Add to tracked IDs
          messageIds.add(msg._id);
          processedMessageIds.current.add(msg._id);
          
          // Check for content duplicates (same content, timestamp and sender)
          const contentKey = `${msg.content || ''}|${msg.timestamp}|${msg.sender}`;
          
          // If we've seen this exact content multiple times and this isn't the first one, skip it
          if (seenContents.get(contentKey) > 1 && 
              uniqueMessages.some(m => 
                m.content === msg.content && 
                m.timestamp === msg.timestamp && 
                m.sender === msg.sender)) {
            //('Skipping duplicate content message:', msg._id);
            return;
          }
          
          // Add message to unique list
          uniqueMessages.push(msg);
        });
        
        // Sort by timestamp
        uniqueMessages.sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        //(`After deduplication: ${uniqueMessages.length} unique messages`);
        setMessages(uniqueMessages);
        
        // Check for unread messages after initial load
        setTimeout(() => {
          const unreadMessages = uniqueMessages.filter(
            msg => !msg.read && msg.sender !== userId
          );
          
          if (unreadMessages.length > 0) {
            //(`Marking ${unreadMessages.length} unread messages as read`);
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
    
    return () => {
      // Clean up
      markingAsRead.current = false;
      processedMessageIds.current.clear();
    };
  }, [subscriberId, userId, markMessagesAsRead]);

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
    
    if (!socket || !connected || !clientId || !subscriberId) return;
    
    if (newMessage.trim()) {
      // Start typing indicator
      if (!isTyping) {
        setIsTyping(true);
        try {
          socket.emit('typing', {
            senderId: userId,
            receiverId: clientId,
            isTyping: true,
            subscriptionId: subscriberId
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
              receiverId: clientId,
              isTyping: false,
              subscriptionId: subscriberId
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
            receiverId: clientId,
            isTyping: false,
            subscriptionId: subscriberId
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
  }, [newMessage, socket, connected, isTyping, userId, clientId, subscriberId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping, scrollToBottom]);

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
    if (!socket || !connected || !subscriberId) return;

    //('Setting up messagesRead event listener');
    
    const handleMessagesReadEvent = (data) => {
      //('Received messagesRead event:', data);
      
      if (data.subscriptionId !== subscriberId) return;
      
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
  }, [socket, connected, subscriberId, userId, messages]);

  // File upload handling
  // Supported file types: images (jpg, png, gif, etc.), videos (mp4, webm, etc.), and PDFs
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

  // Send message
  const handleSendMessage = async () => {
  if ((!newMessage.trim() && files.length === 0)) return;
  if (!connected) {
    toast.error('You are currently offline. Please try again when connected.');
    return;
  }
  
  let tempId; // Declare tempId here
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
      
      // Check for duplicate message prevention (avoid double-sends)
      const isDuplicateSend = messages.some(msg => 
        msg.sender === userId &&
        msg.content === messageContent &&
        msg.pending &&
        (new Date() - new Date(msg.timestamp)) < 10000 // Sent in last 10 seconds
      );
      
      if (isDuplicateSend) {
        //('Preventing duplicate message send within 10 seconds');
        toast.info('Message already being sent');
        return;
      }
      
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
              receiverId: clientId,
              isTyping: false,
              subscriptionId: selectedClient._id
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
            //(`Upload progress: ${progress}%`);
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
      
      // Send via socket for real-time delivery if connected
      if (socket && connected) {
        try {
          socket.emit('sendMessage', {
            senderId: userId,
            receiverId: clientId,
            content: messageContent,
            timestamp,
            subscriptionId: selectedClient._id,
            file: uploadedFiles.map(file => ({
              path: file.path,
              type: file.type
            }))
          });
          //('Message sent via socket for real-time delivery');
        } catch (socketError) {
          console.error('Error sending message via socket:', socketError);
          // Continue with API call even if socket fails
        }
      }
      
      // Make API call to ensure message is stored in database
      const response = await subscriptionService.sendMessage(
        subscriberId,  
        userId,
        clientId,
        messageContent,
        timestamp,
        uploadedFiles.map(file => ({
          path: file.path,
          type: file.type
        }))
      );
      
      // Replace temporary message with actual message
      if (response) {
        let serverMessage = null;
        
        // Handle different response formats
        if (response.messages && Array.isArray(response.messages)) {
          // Get the latest message from the API response
          const sortedMessages = [...response.messages].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
          serverMessage = sortedMessages[0];
        } else if (response.message) {
          serverMessage = response.message;
        } else if (response._id) {
          // Response is the message itself
          serverMessage = response;
        }
        
        if (serverMessage) {
          //('Replacing temp message with server message:', serverMessage._id);
          processedMessageIds.current.add(serverMessage._id);
          
          // Update messages state
          setMessages(prev => {
            // Find if message with same content/sender/timestamp already exists (duplicates)
            const hasDuplicate = prev.some(msg => 
              msg._id !== tempId && // Not the temp message
              !msg.pending && // Not pending
              msg.sender === serverMessage.sender &&
              msg.content === serverMessage.content &&
              Math.abs(new Date(msg.timestamp) - new Date(serverMessage.timestamp)) < 3000 // Within 3 seconds
            );
            
            if (hasDuplicate) {
              //('Server message appears to be a duplicate, just removing temp message');
              return prev.filter(msg => msg._id !== tempId);
            }
            
            // Otherwise replace temp with confirmed message
            return prev
              .filter(msg => msg._id !== tempId)
              .concat(serverMessage);
          });
        } else {
          //('No server message returned, but API call succeeded');
          // Update the pending status on the temporary message
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
      console.error('Failed to send message:', error);
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
    if (!socket || !connected || !subscriberId) return;

    //('Setting up messagesRead event listener');
    
    const handleMessagesReadEvent = (data) => {
      //('Received messagesRead event:', data);
      
      if (data.subscriptionId !== selectedClient._id) return;
      
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
  }, [socket, connected, subscriberId, userId, messages]);

  // Get client name for display
  const clientName = selectedClient ? 
    `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim() :
    'Client';

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
              <h3 className="font-semibold text-lg text-white">Chat with {clientName}</h3>
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
      const fileUrl = file.path
        ? (file.path.startsWith('http') ? file.path : `${import.meta.env.VITE_API_URL}/${file.path.replace(/^\//, '')}`)
        : '';
      
      // Enhanced PDF detection
      const isPDF = file.type === 'application/pdf' || 
                    (file.path && file.path.toLowerCase().endsWith('.pdf')) ||
                    (!file.type && file.path && file.path.toLowerCase().includes('.pdf'));
      
      const isImage = file.type && file.type.startsWith('image/');
      const isVideo = file.type && file.type.startsWith('video/');
      
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
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.path ? file.path.split('/').pop() : 'PDF Document'}
                </p>
                <p className="text-xs text-gray-500">PDF Document</p>
              </div>
              <a
                href={fileUrl}
                download
                className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                title="Download PDF"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          ) : isImage ? (
            <img
              src={fileUrl}
              alt="uploaded"
              className="max-w-full h-auto rounded-lg"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200?text=Image+Error';
              }}
            />
          ) : isVideo ? (
            <video controls className="max-w-full h-auto rounded-lg">
              <source src={fileUrl} type={file.type} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="p-2 bg-gray-100 rounded-lg">
              <p className="text-xs">File: {file.path ? file.path.split('/').pop() : 'Unknown file'}</p>
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
                <Image className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*,video/*,application/pdf"
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

export default CoachChatComponent;