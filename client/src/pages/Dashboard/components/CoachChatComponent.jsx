import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../../SocketContext';
import { useAuth } from '../../../stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import subscriptionService from '../../../services/subscription.service';

const CoachChatComponent = ({ onClose, selectedClient }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const getUserId = () => {
    return user?.id || user?.user?.id;
  };
  
  const userId = getUserId();


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
        {isLoading ? (
          <p className="text-center text-gray-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${index}-${message.timestamp}`}
              className={`flex ${
                message.sender === getUserId() ? 'justify-end' : 'justify-start'
              } mb-2`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  message.sender === getUserId()
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-black'
                }`}
              >
                {message.content}
                <small className="text-xs opacity-70 block mt-1">
                  {format(new Date(message.timestamp), 'HH:mm')}
                </small>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t flex">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 mr-2"
              />
              <Button onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
          </div>
    </Card>
  );
};

export default CoachChatComponent;