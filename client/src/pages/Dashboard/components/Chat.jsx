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

  useEffect(() => {
    if (socket) {
      // Register the user with their socket ID
      socket.emit('register', user._id);

      // Listen for incoming messages
      socket.on('receiveMessage', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    }

    return () => {
      if (socket) {
        socket.off('receiveMessage');
      }
    };
  }, [socket, user._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const message = {
        sender: user._id,
        content: newMessage.trim(),
        timestamp: new Date(),
        read: false,
      };

      // Send the message via WebSocket
      socket.emit('sendMessage', {
        senderId: user._id,
        receiverId: subscription.assignedCoach,
        content: newMessage.trim(),
      });

      // Update the subscription with the new message
      const updatedSubscription = await subscriptionService.sendMessage(
        subscription._id,
        message
      );

      setMessages(updatedSubscription.messages);
      setNewMessage('');
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
            className={`mb-4 ${msg.sender === user._id ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.sender === user._id ? 'bg-blue-500 text-white' : 'bg-gray-200'
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
