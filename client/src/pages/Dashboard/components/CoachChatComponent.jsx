import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../../SocketContext';
import { useAuth } from '../../../stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, User, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import subscriptionService from '../../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';

const CoachChatComponent = ({ onClose, selectedClient }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const getUserId = () => {
    return user?.id || user?.user?.id;
  };
  
  const userId = getUserId();

  const handleBack = () => {
    setIsChatVisible(false);
    setTimeout(() => onClose(), 300);
  };


  const handleReceiveMessage = (message) => {

    setMessages((prev) => {
      // Prevent duplicate messages
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

  const fetchMessages = async () => {
    console.log('Fetching messages for:', selectedClient);
    if (!selectedClient?.id) return;

    setIsLoading(true);
    try {
      const fetchedMessages = await subscriptionService.fetchMessages(
        selectedClient.id
      );
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    if (userId) {
    // Register the coach socket
    socket.emit('register', userId);
    socket.on('receiveMessage', handleReceiveMessage);
    }
    
    fetchMessages();

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [selectedClient?.subscriptionId,socket, user.id, user.user.id]);

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) return;

    const timestamp = new Date().toISOString();

    console.log('Sending message:asssssssssssssssss', selectedClient);

    try {

      // Emit the message via WebSocket
      socket.emit('sendMessage', {
        subscriptionId: selectedClient.id,
        senderId: getUserId(),
        receiverId: selectedClient.userId,
        content: trimmedMessage,
        timestamp,
      });
      
      // Use the service method to send message
      const updatedSubscription = await subscriptionService.sendMessage(
        selectedClient.id,
        user.id || user.user.id,
        selectedClient.userId,
        trimmedMessage,
        timestamp
      );

      setMessages(updatedSubscription.messages);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show error to user
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 z-50 bg-gray-100 flex flex-col"
    >
      <div className="relative flex-1 flex flex-col max-w-2xl mx-auto w-full shadow-xl bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
          <div className="flex items-center justify-between p-4">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              className="text-white hover:bg-white/20 absolute left-2 top-1/2 -translate-y-1/2"
            >
              <ArrowLeft />
            </Button>
            <div className="flex items-center gap-2 mx-auto">
              <User className="w-6 h-6" />
              <span className="font-semibold text-lg">
                {selectedClient.firstName} {selectedClient.lastName}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {isLoading ? (
            <p className="text-center text-gray-500">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500">No messages yet</p>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={`${index}-${message.timestamp}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${
                    message.sender === getUserId() 
                      ? 'justify-end' 
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                      message.sender === getUserId()
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                        : 'bg-white border text-gray-800'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <small className={`text-xs opacity-70 block mt-1 text-right ${
                      message.sender === getUserId() 
                        ? 'text-gray-200' 
                        : 'text-gray-500'
                    }`}>
                      {format(parseISO(message.timestamp), 'HH:mm')}
                    </small>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          )}
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-full px-4 py-2 border-2 border-gray-300 focus:border-indigo-500 transition-colors"
            />
            <Button onClick={sendMessage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center"
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