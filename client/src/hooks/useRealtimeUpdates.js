import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../SocketContext';
import { toast } from 'sonner';


export const useRealtimeUpdates = () => {
  const { socket, connected } = useSocket();
  const eventListeners = useRef(new Map());
  const subscriptions = useRef(new Set());


  const subscribe = useCallback((updateType, callback, options = {}) => {
    if (!socket || !connected) {
      console.warn(`[Realtime] Cannot subscribe to ${updateType}: socket not connected`);
      return () => {}; 
    }

    const subscriptionKey = `${updateType}_${Date.now()}_${Math.random()}`;
    
    subscriptions.current.add(subscriptionKey);
  
    const eventHandler = (data) => {
      //(`[Realtime] Received ${updateType} update:`, data);
      
      try {
        callback(data);
      } catch (error) {
        console.error(`[Realtime] Error handling ${updateType} update:`, error);
      }
    };

    eventListeners.current.set(subscriptionKey, {
      eventName: updateType,
      handler: eventHandler
    });

    socket.on(updateType, eventHandler);

    if (options.room) {
      socket.emit('join-room', options.room);
    }

    if (options.requestInitial) {
      socket.emit(`request-${updateType}`, options.requestInitial);
    }

    return () => {
      socket.off(updateType, eventHandler);
      eventListeners.current.delete(subscriptionKey);
      subscriptions.current.delete(subscriptionKey);
      
      if (options.room) {
        socket.emit('leave-room', options.room);

      }

    };
  }, [socket, connected]);

  const subscribeToMessages = useCallback((matchId, onMessage) => {
    return subscribe('new-message', (data) => {
      if (data.matchId === matchId) {
        onMessage(data);
      }
    }, {
      room: `match-${matchId}`
    });
  }, [subscribe]);


  const subscribeToMatches = useCallback((userId, onMatchUpdate) => {
    return subscribe('match-update', onMatchUpdate, {
      room: `user-${userId}`
    });
  }, [subscribe]);


  const subscribeToNewMatches = useCallback((userId, onNewMatch) => {
    return subscribe('new-match', (data) => {
      onNewMatch(data);

      if (data.matchedProfile) {
        toast.success(`New match with ${data.matchedProfile.name || 'someone'}!`, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => {

              window.dispatchEvent(new CustomEvent('navigateToMatches', {
                detail: { matchedProfile: data.matchedProfile }
              }));
            }
          }
        });
      }
    }, {
      room: `user-${userId}`
    });
  }, [subscribe]);

  /**
   * Subscribe to user presence updates
   */
  const subscribeToPresence = useCallback((onPresenceUpdate) => {
    return subscribe('user-presence', onPresenceUpdate);
  }, [subscribe]);

  /**
   * Subscribe to boost notifications
   */
  const subscribeToBoosts = useCallback((userId, onBoostUpdate) => {
    return subscribe('boost-update', onBoostUpdate, {
      room: `user-${userId}`
    });
  }, [subscribe]);

  /**
   * Subscribe to typing indicators
   */
  const subscribeToTyping = useCallback((matchId, onTypingUpdate) => {
    return subscribe('typing-status', (data) => {
      if (data.matchId === matchId) {
        onTypingUpdate(data);
      }
    }, {
      room: `match-${matchId}`
    });
  }, [subscribe]);

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback((matchId, isTyping) => {
    if (socket && connected) {
      socket.emit('typing', { matchId, isTyping });
    }
  }, [socket, connected]);

  /**
   * Send message read receipt
   */
  const sendReadReceipt = useCallback((matchId, messageId) => {
    if (socket && connected) {
      socket.emit('message-read', { matchId, messageId });
    }
  }, [socket, connected]);

  /**
   * Request real-time data refresh
   */
  const requestRefresh = useCallback((dataType, params = {}) => {
    if (socket && connected) {
      socket.emit(`refresh-${dataType}`, params);
      //(`[Realtime] Requested refresh for ${dataType}`);
    }
  }, [socket, connected]);

  /**
   * Get connection status and stats
   */
  const getConnectionInfo = useCallback(() => {
    return {
      connected,
      subscriptions: Array.from(subscriptions.current),
      activeListeners: eventListeners.current.size
    };
  }, [connected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove all event listeners
      eventListeners.current.forEach(({ eventName, handler }) => {
        if (socket) {
          socket.off(eventName, handler);
        }
      });
      
      eventListeners.current.clear();
      subscriptions.current.clear();
      
      //('[Realtime] Cleaned up all subscriptions');
    };
  }, [socket]);

  // Auto-reconnect logic
  useEffect(() => {
    if (socket) {
      const handleReconnect = () => {
        //('[Realtime] Socket reconnected, refreshing subscriptions');
        
        // Optionally trigger a refresh of critical data
        requestRefresh('matches');
        requestRefresh('messages');
      };

      const handleDisconnect = () => {
        //('[Realtime] Socket disconnected');
      };

      socket.on('connect', handleReconnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleReconnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket, requestRefresh]);

  return {
    subscribe,
    subscribeToMessages,
    subscribeToMatches,
    subscribeToNewMatches,
    subscribeToPresence,
    subscribeToBoosts,
    subscribeToTyping,
    sendTypingIndicator,
    sendReadReceipt,
    requestRefresh,
    getConnectionInfo,
    connected
  };
};

export default useRealtimeUpdates;
