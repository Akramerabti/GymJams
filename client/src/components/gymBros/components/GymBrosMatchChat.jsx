import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Image, X, Loader2, MapPin, Calendar, Award, Flag, Phone } from 'lucide-react';
import { format, parseISO, isSameDay, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useSocket } from '../../../SocketContext';
import useAuthStore from '../../../stores/authStore';
import gymbrosService from '../../../services/gymbros.service';

const GymBrosMatchChat = ({ otherUserInfo, matchId, onClose }) => {
  const { user } = useAuthStore();
  const { socket, connected: socketConnected } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProfile, setExpandedProfile] = useState(false);
  
  // Refs
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const userIdRef = useRef(null);
  const seenContentMessages = useRef(new Set());

  // Get user info
  const userId = user?.id || (user?.user && user?.user.id);
  const otherUserId = otherUserInfo.userId || otherUserInfo._id;
  
  // Debug IDs - helps debugging ID matching issues
  useEffect(() => {
    console.log('Current userId:', userId);
    console.log('UserIdRef.current:', userIdRef.current);
    console.log('OtherUserId:', otherUserId);
  }, [userId, otherUserId]);

  // Function to normalize IDs for comparison
  const normalizeId = (id) => {
    if (!id) return null;
    
    // If it's an object with an id property (from API)
    if (typeof id === 'object' && id.id) return String(id.id);
    
    // If it's an object with an _id property (alternate API format)
    if (typeof id === 'object' && id._id) return String(id._id);
    
    // If it's an object without id properties (like an ObjectId)
    if (typeof id === 'object') return String(id);
    
    // If it's already a string, just return it
    return String(id);
  };
  
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

  // Create a message deduplication key
  const createMessageKey = (message) => {
    const sender = normalizeId(message.sender);
    const content = message.content || '';
    const timestamp = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
    return `${sender}:${content}:${timestamp}`;
  };

  const addMessageWithDeduplication = useCallback((newMessage, currentMessages) => {
    // Skip if already processed by ID
    if (processedMessageIds.current.has(newMessage._id)) {
      console.log('Skipping duplicate message by ID:', newMessage._id);
      return currentMessages;
    }
    
    // Create a content key for deduplication
    const messageKey = createMessageKey(newMessage);
    
    // Skip if we've seen this content recently (within 5 seconds)
    if (seenContentMessages.current.has(messageKey)) {
      console.log('Skipping duplicate message by content:', messageKey);
      return currentMessages;
    }
    
    // Add to processed IDs and content keys
    processedMessageIds.current.add(newMessage._id);
    seenContentMessages.current.add(messageKey);
    
    // Check for pending messages to replace
    if (!newMessage.pending) {
      const pendingIndex = currentMessages.findIndex(msg => 
        msg.pending && 
        normalizeId(msg.sender) === normalizeId(newMessage.sender) && 
        msg.content === newMessage.content &&
        Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 10000 // Within 10 seconds
      );
      
      if (pendingIndex >= 0) {
        // Replace the pending message
        console.log('Replacing pending message with confirmed message');
        const updatedMessages = [...currentMessages];
        updatedMessages[pendingIndex] = newMessage;
        return updatedMessages;
      }
    }
    
    // Add new message
    return [...currentMessages, newMessage];
  }, []);

  // Fetch messages effect with deduplication
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const messages = await gymbrosService.fetchMatchMessages(matchId);
        console.log('Fetched messages:', messages);
        
        // Debug the sender format in received messages
        if (messages.length > 0) {
          console.log('Example message sender format:', {
            sender: messages[0].sender,
            type: typeof messages[0].sender
          });
        }
        
        // Normalize all messages and deduplicate
        const normalizedMessages = [];
        processedMessageIds.current.clear();
        seenContentMessages.current.clear();
        
        if (Array.isArray(messages)) {
          // Process messages one by one with deduplication
          messages.forEach(message => {
            // Create a new messages array each time
            const updatedMessages = addMessageWithDeduplication(message, normalizedMessages);
            // Replace the array reference if it changed
            if (updatedMessages !== normalizedMessages) {
              normalizedMessages.length = 0;
              normalizedMessages.push(...updatedMessages);
            }
          });
        }
        
        setMessages(normalizedMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [matchId, addMessageWithDeduplication]);

  useEffect(() => {
    if (socket && socketConnected) {
      try {
        // For authenticated users, register with their user ID
        if (userId) {
          console.log('GymBrosMatchChat: Registering authenticated user with socket:', userId);
          socket.emit('register', userId);
        } 
        // For guest users, check if we have a userIdRef value
        else if (userIdRef.current) {
          console.log('GymBrosMatchChat: Registering guest user with socket:', userIdRef.current);
          socket.emit('register', userIdRef.current);
        }
        // For new guest users without an ID yet
        else if (matchId && otherUserId) {
          // Attempt to find the match details to determine the guest ID
          console.log('GymBrosMatchChat: Attempting to determine guest ID for registration');
          gymbrosService.findMatch(otherUserId)
            .then(matchDetails => {
              if (matchDetails && matchDetails.users && matchDetails.users.length === 2) {
                // Find the user that's not the receiver (must be the sender/guest)
                const guestUserId = matchDetails.users.find(id => 
                  normalizeId(id) !== normalizeId(otherUserId)
                );
                
                if (guestUserId) {
                  console.log(`GymBrosMatchChat: Found and registering guest user ID: ${guestUserId}`);
                  userIdRef.current = guestUserId;
                  socket.emit('register', guestUserId);
                }
              }
            })
            .catch(error => {
              console.error('Error finding match details for socket registration:', error);
            });
        }
      } catch (err) {
        console.error('Error registering with socket:', err);
      }
    }
  }, [socket, socketConnected, userId, matchId, otherUserId]);

  // Socket event handlers for messages and typing
  useEffect(() => {
    if (!socket || !socketConnected || !matchId) return;

    const handleReceiveMessage = (message) => {
      console.log('Received message via socket:', message);
      if (message.matchId !== matchId) return;
      
      // Use the addMessageWithDeduplication function
      setMessages(prev => addMessageWithDeduplication(message, prev));
    };

    const handleTypingEvent = (data) => {
      if (data.matchId !== matchId) return;
      setOtherUserTyping(data.isTyping);
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTypingEvent);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTypingEvent);
    };
  }, [socket, socketConnected, matchId, addMessageWithDeduplication]);

  useEffect(() => {
    if (socket) {
      const handleDebugMessage = (data) => {
        console.log('Socket debug message:', data);
      };
      
      socket.on('debug', handleDebugMessage);
      
      return () => {
        socket.off('debug', handleDebugMessage);
      };
    }
  }, [socket]);

  // Handle typing indicator effect
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (!socket || !socketConnected || !otherUserId || !matchId) return;
    
    // Get effective user ID (authenticated user or guest)
    const effectiveSenderId = userId || userIdRef.current;
    
    // If we don't have a sender ID yet, we can't send typing indicators
    if (!effectiveSenderId) {
      console.log('Cannot send typing indicator - sender ID not yet determined');
      return;
    }
    
    if (newMessage.trim()) {
      // Start typing indicator
      if (!isTyping) {
        setIsTyping(true);
        try {
          console.log('Sending typing start with sender ID:', effectiveSenderId);
          socket.emit('typing', {
            senderId: effectiveSenderId,
            receiverId: otherUserId,
            isTyping: true,
            matchId // Include matchId for proper routing
          });
        } catch (err) {
          console.error('Error sending typing indicator:', err);
        }
      }
      
      // Set timer to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        try {
          socket.emit('typing', {
            senderId: effectiveSenderId,
            receiverId: otherUserId,
            isTyping: false,
            matchId // Include matchId for proper routing
          });
        } catch (err) {
          console.error('Error sending typing stop indicator:', err);
        }
      }, 2000);
    } else {
      // If message is empty, stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        try {
          socket.emit('typing', {
            senderId: effectiveSenderId,
            receiverId: otherUserId,
            isTyping: false,
            matchId // Include matchId for proper routing
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
  }, [newMessage, socket, socketConnected, isTyping, userId, otherUserId, matchId, userIdRef.current]);
  
  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping, scrollToBottom]);

  // Determine guest user ID effect
  useEffect(() => {
    // If user is not authenticated (guest) or userId is null, fetch the match to determine the user's ID
    if (!userId && matchId && otherUserId) {
      const determineGuestUserId = async () => {
        try {
          console.log('GymBrosMatchChat: Determining guest user ID');
          const matchDetails = await gymbrosService.findMatch(otherUserId);
          
          if (matchDetails && matchDetails.users && matchDetails.users.length === 2) {
            // Find the user that's not the receiver (must be the sender/guest)
            const guestUserId = matchDetails.users.find(id => 
              normalizeId(id) !== normalizeId(otherUserId)
            );
            
            if (guestUserId) {
              console.log(`GymBrosMatchChat: Found guest user ID: ${guestUserId}`);
              // Store the determined userId in a ref so we can use it later
              userIdRef.current = guestUserId;
            } else {
              console.error('GymBrosMatchChat: Could not determine guest user ID');
            }
          }
        } catch (error) {
          console.error('GymBrosMatchChat: Error finding match details:', error);
        }
      };
      
      determineGuestUserId();
    }
  }, [userId, matchId, otherUserId]);

  // Send message handler
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && files.length === 0) || !socketConnected) return;
    
    let tempId; // Declare outside try-catch block
    try {
      tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      // Get effective sender ID for consistency
      let effectiveSenderId = userId || userIdRef.current;
      
      // Create temporary message with effectiveSenderId
      const tempMessage = {
        _id: tempId,
        sender: effectiveSenderId, // Use effectiveSenderId here
        content: newMessage.trim(),
        timestamp,
        pending: true
      };
  
      // Add to messages with deduplication
      setMessages(prev => addMessageWithDeduplication(tempMessage, prev));
      setNewMessage('');
      
      // If no effectiveSenderId is available, try to determine it
      if (!effectiveSenderId) {
        try {
          // Fetch match details to get both users
          const matchDetails = await gymbrosService.findMatch(otherUserId);
          
          if (matchDetails && matchDetails.users && matchDetails.users.length === 2) {
            // Find the user that's not the receiver
            effectiveSenderId = matchDetails.users.find(id => 
              normalizeId(id) !== normalizeId(otherUserId)
            );
            
            console.log(`Determined sender ID for guest user: ${effectiveSenderId}`);
            userIdRef.current = effectiveSenderId; // Save for future use
          } else {
            console.error('Could not determine sender ID for guest user');
            throw new Error('Unable to determine sender ID');
          }
        } catch (matchError) {
          console.error('Error finding match details:', matchError);
          throw new Error('Failed to determine sender ID');
        }
      }
      
      console.log('Sending message:', matchId, effectiveSenderId, otherUserId, newMessage.trim(), tempId, timestamp);
  
      // Socket emit with all required fields
      socket.emit('sendMessage', {
        matchId,
        senderId: effectiveSenderId,
        receiverId: otherUserId,
        content: newMessage.trim(),
        timestamp,
        tempId
      });
  
      // API call with proper structure
      const response = await gymbrosService.sendMessage({
        matchId,
        senderId: effectiveSenderId,
        receiverId: otherUserId,
        content: newMessage.trim(),
        tempId,
        timestamp
      });
      
      // Update the message to remove pending status
      if (response && response.success) {
        setMessages(prev => prev.map(msg => {
          // If this is our temporary message, update it
          if (msg._id === tempId) {
            return {
              ...msg,
              pending: false,
              _id: response.messageId || msg._id // Use server-assigned ID if available
            };
          }
          return msg;
        }));
      }
  
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
      // Remove temp message if it was created
      if (tempId) {
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
      }
    }
  };

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
  
  // Format image URL helper
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

  // Conversation starters for empty state
  const conversationStarters = [
    "Hi! I see we both enjoy weightlifting. What's your favorite exercise?",
    `I usually work out in the ${otherUserInfo?.preferredTime?.toLowerCase() || 'evening'}. Does that work for you too?`,
    "Looking for a workout buddy this weekend. Interested?",
  ];

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
          <button onClick={onClose} className="text-white p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {/* Profile info and toggle */}
          <div 
            className="flex items-center ml-3 cursor-pointer"
            onClick={() => setExpandedProfile(!expandedProfile)}
          >
            <img
              src={formatImageUrl(otherUserInfo.profileImage || (otherUserInfo.images && otherUserInfo.images[0]))}
              alt={otherUserInfo.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/api/placeholder/400/400";
              }}
            />
            <div className="ml-3 text-white">
              <h3 className="font-semibold">{otherUserInfo.name}, {otherUserInfo.age}</h3>
              <p className="text-xs text-white/80">
                {otherUserInfo.lastActive ? formatDistanceToNow(new Date(otherUserInfo.lastActive), { addSuffix: true }) : 'Offline'}
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
                  src={formatImageUrl(otherUserInfo.profileImage || (otherUserInfo.images && otherUserInfo.images[0]))}
                  alt={otherUserInfo.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/400/400";
                  }}
                />
                <div className="ml-4">
                  <h2 className="text-xl font-bold">{otherUserInfo.name}, {otherUserInfo.age}</h2>
                  
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin size={16} className="mr-1" />
                    <span className="text-sm">{otherUserInfo.location?.distance || 0} miles away</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {otherUserInfo.workoutTypes?.slice(0, 3).map(type => (
                      <span key={type} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        {type}
                      </span>
                    ))}
                    {otherUserInfo.workoutTypes?.length > 3 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        +{otherUserInfo.workoutTypes.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center text-gray-700">
                  <Award size={16} className="mr-2 text-blue-500" />
                  <span className="text-sm">{otherUserInfo.experienceLevel || 'Any level'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar size={16} className="mr-2 text-blue-500" />
                  <span className="text-sm">{otherUserInfo.preferredTime || 'Flexible'}</span>
                </div>
              </div>
              
              {otherUserInfo.bio && (
                <div className="mt-4">
                  <p className="text-sm text-gray-700">{otherUserInfo.bio}</p>
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
          /* Empty state UI */
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-md flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg">
                  <img 
                    src={formatImageUrl(otherUserInfo.profileImage || (otherUserInfo.images && otherUserInfo.images[0]))}
                    alt={otherUserInfo.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/api/placeholder/400/400";
                    }}
                  />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 shadow-md border-2 border-white"
                >
                  <Send size={14} className="text-white" />
                </motion.div>
              </div>

              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold mb-2"
              >
                Start chatting with {otherUserInfo.name}
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 mb-8"
              >
                Begin your fitness journey together with a friendly message
              </motion.p>
              
              <div className="w-full space-y-2">
                <h4 className="text-left text-sm font-medium text-gray-700 mb-2">
                  Try these conversation starters:
                </h4>
                
                {conversationStarters.map((starter, index) => (
                  <motion.div
                    key={`starter-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                    onClick={() => {
                      setNewMessage(starter);
                      setTimeout(() => {
                        document.querySelector('input[type="text"]').focus();
                      }, 100);
                    }}
                    className="bg-blue-50 p-3 rounded-lg text-left text-sm text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    "{starter}"
                  </motion.div>
                ))}
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
                      // Use normalizeId to ensure consistent comparison
                      const effectiveSenderId = normalizeId(userId || userIdRef.current);
                      const messageSenderId = normalizeId(message.sender);
                      const isCurrentUser = messageSenderId === effectiveSenderId;

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