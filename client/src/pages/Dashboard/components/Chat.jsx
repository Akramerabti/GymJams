import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../stores/authStore';
import { useSocket } from '../../../SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import subscriptionService from '../../../services/subscription.service';

const Chat = ({ subscription, onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState(subscription.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Helper function to safely get the user ID
  const getUserId = () => {
    return user?.id || user?.user?.id;
  };

  const userId = getUserId();

  const handleReceiveMessage = (message) => {
    setMessages((prev) => {
      const isDuplicate = prev.some(
        (m) =>
          m.content === message.content &&
          m.timestamp === message.timestamp
      );
      return isDuplicate ? prev : [...prev, message];
    });

    if (message.sender !== userId) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  // Register the user with their socket ID and listen for incoming messages
  useEffect(() => {
    if (!socket) return;

      if (userId) {
        // Register the user with their socket ID
        socket.emit('register', userId);
        // Listen for incoming messages
        socket.on('receiveMessage',handleReceiveMessage );
      }

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
      };
  }, [socket, user]);

  // Scroll to the bottom of the chat when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        const userId = getUserId();

        // Send the message via WebSocket
        socket.emit('sendMessage', {
          subscriptionId: subscription._id, // Include subscriptionId in the WebSocket message
          senderId: userId,
          receiverId: subscription.assignedCoach,
          content: newMessage.trim(),
          timestamp: new Date().toISOString(),
        });

        // Update the subscription with the new message via API call
        const updatedSubscription = await subscriptionService.sendMessage(
          subscription._id,
          userId,
          subscription.assignedCoach,
          newMessage.trim(),
          new Date().toISOString()
        );

        // Update the local messages state with the updated subscription messages
        setMessages(updatedSubscription.messages);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 right-4 w-96 bg-white rounded-lg shadow-lg flex flex-col"
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Chat with Coach</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.sender === getUserId() ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.sender === getUserId() ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {msg.content}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t flex">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1 mr-2"
        />
        <Button onClick={handleSendMessage}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Chat;