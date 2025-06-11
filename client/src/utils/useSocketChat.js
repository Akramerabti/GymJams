import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../SocketContext';
import { toast } from 'sonner';

/**
 * Custom hook to manage socket communications for chat components
 */
export function useSocketChat({ userId, recipientId, conversationId, onMessageReceived }) {
  const { socket, connected } = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const registeredEventsRef = useRef(false);

  // Track already processed message IDs to prevent duplicates
  const processedMessageIds = useRef(new Set());
  
  // Register with socket when connected
  useEffect(() => {
    if (socket && connected && userId) {
      console.log('Socket chat: Registering user with socket:', userId);
      
      try {
        socket.emit('register', userId);
      } catch (err) {
        console.error('Error registering with socket:', err);
      }
    }
  }, [socket, connected, userId]);

  // Set up event listeners for typing indicators and messages
  useEffect(() => {
    if (!socket || !connected || !userId || !recipientId || !conversationId) {
      return;
    }

    // Don't register events multiple times
    if (registeredEventsRef.current) return;
    
    console.log('Setting up socket chat events for conversation:', conversationId);
    
    // Handle receiving messages
    const handleReceiveMessage = (message) => {
      // Verify message belongs to this conversation
      const belongsToConversation = 
        message.subscriptionId === conversationId || 
        message.matchId === conversationId;
      
      if (!belongsToConversation) return;
      
      // Skip if already processed
      if (processedMessageIds.current.has(message._id)) {
        console.log('Skipping duplicate message:', message._id);
        return;
      }
      
      // Add to processed set
      processedMessageIds.current.add(message._id);
      
      // Call the provided callback
      if (onMessageReceived) {
        onMessageReceived(message);
      }
    };
    
    // Handle typing indicators
    const handleTypingEvent = (data) => {
      // Verify event belongs to this conversation
      const belongsToConversation = 
        data.subscriptionId === conversationId || 
        data.matchId === conversationId;
      
      if (!belongsToConversation) return;
      
      // Set typing state if sender is the other user
      if (data.senderId === recipientId) {
        setOtherUserTyping(data.isTyping);
      }
    };
    
    try {
      // Register socket event listeners
      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('typing', handleTypingEvent);
      registeredEventsRef.current = true;
      
      console.log('Successfully registered socket chat events');
    } catch (err) {
      console.error('Error setting up socket chat event listeners:', err);
      toast.error('Connection issue. Messages might be delayed.');
    }
    
    return () => {
      // Clean up event listeners
      if (socket) {
        try {
          socket.off('receiveMessage', handleReceiveMessage);
          socket.off('typing', handleTypingEvent);
          registeredEventsRef.current = false;
        } catch (err) {
          console.error('Error removing socket chat event listeners:', err);
        }
      }
    };
  }, [socket, connected, userId, recipientId, conversationId, onMessageReceived]);

  // Send typing indicator with debounce
  const updateTypingStatus = useCallback((isCurrentlyTyping) => {
    if (!socket || !connected || !userId || !recipientId || !conversationId) {
      return;
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Only emit event if status changes
    if (isCurrentlyTyping !== isTyping) {
      setIsTyping(isCurrentlyTyping);
      
      try {
        socket.emit('typing', {
          senderId: userId,
          receiverId: recipientId,
          isTyping: isCurrentlyTyping,
          subscriptionId: conversationId,
          matchId: conversationId
        });
      } catch (err) {
        console.error('Error sending typing indicator:', err);
      }
    }
    
    // Set timeout to clear typing status
    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        
        try {
          socket.emit('typing', {
            senderId: userId,
            receiverId: recipientId,
            isTyping: false,
            subscriptionId: conversationId,
            matchId: conversationId
          });
        } catch (err) {
          console.error('Error clearing typing indicator:', err);
        }
      }, 3000);
    }
  }, [socket, connected, userId, recipientId, conversationId, isTyping]);

  // Send message function
  const sendMessage = useCallback((content, files = []) => {
    if (!socket || !connected || !userId || !recipientId || !conversationId) {
      toast.error('Connection issue. Please try again.');
      return { success: false };
    }
    
    const timestamp = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Clear typing indicator
    updateTypingStatus(false);
    
    // Create message object
    const message = {
      _id: tempId,
      sender: userId,
      receiverId: recipientId,
      content,
      timestamp,
      file: files,
      subscriptionId: conversationId,
      matchId: conversationId,
      pending: true
    };
    
    // Send via socket
    try {
      socket.emit('sendMessage', message);
      console.log('Message sent via socket');
      
      // Add to processed IDs
      processedMessageIds.current.add(tempId);
      
      return { 
        success: true, 
        message,
        tempId
      };
    } catch (err) {
      console.error('Error sending message via socket:', err);
      toast.error('Message send failed. Please try again.');
      return { success: false };
    }
  }, [socket, connected, userId, recipientId, conversationId, updateTypingStatus]);

  // Mark messages as read
  const markAsRead = useCallback((messageIds) => {
    if (!socket || !connected || !userId || !recipientId || !conversationId || !messageIds.length) {
      return { success: false };
    }
    
    try {
      socket.emit('messagesRead', {
        subscriptionId: conversationId,
        matchId: conversationId,
        messageIds,
        receiverId: recipientId
      });
      
      return { success: true };
    } catch (err) {
      console.error('Error marking messages as read:', err);
      return { success: false };
    }
  }, [socket, connected, userId, recipientId, conversationId]);

  // Return values and functions
  return {
    connected,
    isTyping,
    otherUserTyping,
    updateTypingStatus,
    sendMessage,
    markAsRead,
    processedMessageIds
  };
}