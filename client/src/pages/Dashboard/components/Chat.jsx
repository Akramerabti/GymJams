import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../stores/authStore';
import { useSocket } from '../../../SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react'; // Added ArrowLeft for the back button
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
      socket.on('receiveMessage', handleReceiveMessage);
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
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }} // Start off-screen to the right
        animate={{ x: 0 }} // Slide in to the left
        exit={{ x: '100%' }} // Slide out to the right
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }} // Smooth animation
        className="fixed inset-0 bg-gray-50 z-[9999] flex flex-col items-center justify-center"
      >
        {/* Chat Container */}
        <div className="max-w-2xl w-full h-full md:h-[90vh] md:rounded-lg md:shadow-2xl bg-white flex flex-col overflow-hidden">
          {/* Header with Gradient Background */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-md">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h3 className="font-semibold text-lg text-white">Chat with Coach</h3>
            </div>
          </div>
  
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  msg.sender === getUserId() ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                    msg.sender === getUserId()
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <small
                    className={`text-xs opacity-70 block mt-1 ${
                      msg.sender === getUserId() ? 'text-gray-200' : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
  
          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center space-x-2"
            >
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