// This is a utility function you can add to your client-side code
// to handle read receipts in a reliable way

// Add this to a new file like src/utils/readReceiptUtils.js

/**
 * Manages the read receipts functionality for chat messages
 */
export const ReadReceiptManager = {
    /**
     * Mark messages as read with proper error handling and socket events
     * @param {Object} config - Configuration object
     * @returns {Promise<boolean>} - Success status
     */
    async markMessagesAsRead({
      socket,
      subscriptionId,
      messageIds,
      receiverId,
      subscriptionService,
      userId,
      lastReadTimestamp,
      updateMessages
    }) {
      if (!messageIds || messageIds.length === 0) return false;
      
      try {
        //(`Marking ${messageIds.length} messages as read in subscription ${subscriptionId}`);
        
        // Update the last read timestamp
        if (lastReadTimestamp) {
          lastReadTimestamp.current = Date.now();
        }
        
        // Update the messages in the UI immediately for better UX
        if (updateMessages) {
          updateMessages(prev => 
            prev.map(msg => 
              messageIds.includes(msg._id) ? { ...msg, read: true } : msg
            )
          );
        }
        
        // Send socket event for real-time update
        if (socket && socket.connected) {
          socket.emit('messagesRead', {
            subscriptionId,
            messageIds,
            receiverId,
            readerId: userId
          });
          //('Read receipt sent via socket');
        } else {
          console.warn('Socket not connected, using API fallback for read receipts');
        }
        
        // Also send API request as a reliable fallback
        await subscriptionService.markMessagesAsRead(subscriptionId, messageIds, userId);
        
        return true;
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
        return false;
      }
    },
    
    /**
     * Determine if a message should show a read receipt
     * @param {Object} message - The message object
     * @param {Array} allMessages - All messages in the conversation
     * @param {String} userId - Current user's ID
     * @returns {Boolean} - Whether this message should show a read receipt
     */
    shouldShowReadReceipt(message, allMessages, userId) {
      if (!message || !allMessages || !userId) return false;
      
      // Only show for messages sent by the current user that have been read
      if (message.sender !== userId || !message.read) return false;
      
      // Get all messages sent by the current user that have been read
      const readUserMessages = allMessages.filter(
        msg => msg.sender === userId && msg.read
      );
      
      // Find the last read message from the user
      const lastReadUserMessage = readUserMessages[readUserMessages.length - 1];
      
      // Only show the receipt on the last read message from the user
      return lastReadUserMessage && lastReadUserMessage._id === message._id;
    },
    
    /**
     * Process incoming messages to check if they need to be marked as read
     * @param {Object} config - Configuration options
     */
    processIncomingMessages({
      newMessages,
      userId,
      isAtBottom,
      markAsReadFn
    }) {
      if (!newMessages || !newMessages.length) return;
      
      // Filter out messages from others that need to be marked as read
      const messagesToMarkAsRead = newMessages
        .filter(msg => msg.sender !== userId && !msg.read)
        .map(msg => msg._id);
      
      // If user is at the bottom of the chat and there are unread messages, mark them as read
      if (isAtBottom && messagesToMarkAsRead.length > 0) {
        markAsReadFn(messagesToMarkAsRead);
      }
    }
  };
  
  // -----------------------------------------------------------------
  // Integration into the Chat component - add these functions
  
  /**
   * Checks if the current user is at the bottom of the chat
   * @returns {Boolean} - Whether the user is at the bottom
   */
  const isAtBottom = () => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 50;
  };
  
  /**
   * Marks the specified messages as read
   * @param {Array} messageIds - IDs of messages to mark as read
   */
  const markMessagesAsRead = async (messageIds) => {
    // Return if there are no messages to mark or already marking
    if (!messageIds || messageIds.length === 0 || markingAsRead.current) return;
    
    try {
      markingAsRead.current = true;
      //('Marking messages as read:', messageIds);
      
      // Update UI immediately
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, read: true } : msg
        )
      );
      
      // Update read timestamp
      lastReadTimestamp.current = Date.now();
      
      // Send socket event first for real-time updates
      if (socket && socketConnected) {
        socket.emit('messagesRead', {
          subscriptionId: subscription._id,
          messageIds,
          receiverId: coachId,
          readerId: userId
        });
        //('Read receipt sent via socket');
      }
      
      // Then send API request as a fallback
      await subscriptionService.markMessagesAsRead(subscription._id, messageIds);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    } finally {
      markingAsRead.current = false;
    }
  };
  
  // Add a scroll handler to check and mark messages as read
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
  
  // Process new messages for read status when receiving messages
  const handleReceiveMessage = (message) => {
    //('Received message via socket:', message);
    
    // Check if we've already processed this message ID
    if (processedMessageIds.current.has(message._id)) {
      //('Skipping duplicate message:', message._id);
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
      
      // If the user is at the bottom and the message is from someone else, mark it as read
      if (message.sender !== userId && isAtBottom()) {
        // Debounce the mark as read to avoid multiple rapid calls
        const now = Date.now();
        if (now - lastReadTimestamp.current > 500) {
          setTimeout(() => {
            markMessagesAsRead([message._id]);
          }, 300);
        }
      }
      
      return newMessages;
    });
  };