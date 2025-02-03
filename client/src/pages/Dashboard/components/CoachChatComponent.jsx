import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../../SocketContext';
import { useAuth } from '../../../stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const CoachChatComponent = ({ onClose, selectedClient }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Register the coach
    socket.emit('register', user.id);

    // Listen for incoming messages
    socket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== user.id) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [socket, user.id]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      senderId: user.id,
      receiverId: selectedClient.id,
      content: newMessage.trim(),
      timestamp: new Date(),
    };

    socket.emit('sendMessage', message);
    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <User />
          <span>
            {selectedClient.firstName} {selectedClient.lastName}
          </span>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.senderId === user.id ? 'justify-end' : 'justify-start'
            } mb-2`}
          >
            <div
              className={`max-w-xs p-2 rounded-lg ${
                message.senderId === user.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              <p>{message.content}</p>
              <small className="text-xs opacity-70">
                {format(new Date(message.timestamp), 'HH:mm')}
              </small>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit">
          <Send />
        </Button>
      </form>
    </Card>
  );
};

export default CoachChatComponent;