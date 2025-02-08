import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../../SocketContext';
import { useAuth } from '../../../stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, User, X, Image, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import subscriptionService from '../../../services/subscription.service';
import { motion, AnimatePresence } from 'framer-motion';

const CoachChatComponent = ({ onClose, selectedClient, isChatOpen }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]); // Store multiple files
  const fileInputRef = useRef(null); // Ref to reset the file input
  const messagesEndRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const getUserId = () => {
    return user?.id || user?.user?.id;
  };
  const userId = getUserId();

  const handleBack = () => {
    onClose();
  };

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

  const fetchMessages = async () => {
    console.log('Fetching messages for:', selectedClient);
    if (!selectedClient?.id) return;
    try {
      const fetchedMessages = await subscriptionService.fetchMessages(selectedClient.id);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!socket) return;
    if (userId) {
      socket.emit('register', userId);
      socket.on('receiveMessage', handleReceiveMessage);
    }

    fetchMessages();
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [selectedClient?.id, socket, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage && files.length === 0) return;

    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        uploadedFiles = await subscriptionService.uploadFiles(files);
      }

      const timestamp = new Date().toISOString();
      const messagePayload = {
        subscriptionId: selectedClient.id,
        senderId: getUserId(),
        receiverId: selectedClient.userId,
        content: trimmedMessage,
        timestamp,
        file: uploadedFiles.map((file) => ({
          path: file.path,
          type: file.type,
        })),
      };

      // Emit the message via WebSocket
      socket.emit('sendMessage', messagePayload);

      // Update the subscription with the new message via API call
      const updatedSubscription = await subscriptionService.sendMessage(
        selectedClient.id,
        getUserId(),
        selectedClient.userId,
        trimmedMessage,
        timestamp,
        uploadedFiles.map((file) => ({
          path: file.path,
          type: file.type,
        }))
      );

      // Update the local messages state
      setMessages(updatedSubscription.messages);
      setNewMessage('');
      setFiles([]); // Clear all files after sending
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 100 * 1024 * 1024; // 100MB
    let totalSize = 0;

    selectedFiles.forEach((file) => {
      totalSize += file.size;
    });

    if (totalSize > maxSize) {
      alert('Total file size exceeds 100MB. Please select smaller files.');
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 z-[9999] bg-gray-100 flex flex-col"
    >
      <div className="flex flex-col max-w-2xl mx-auto w-full shadow-xl bg-white overflow-y-auto h-full">
        {/* Header */}
        <div className="sticky z-[9999] bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
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
        <ScrollArea className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
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
                    message.sender === getUserId() ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                      message.sender === getUserId()
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                        : 'bg-white border text-gray-800'
                    }`}
                  >
                    {message.file && Array.isArray(message.file) && message.file.length > 0 && (
                      <div className="mb-2">
                        {message.file.map((file, idx) => (
                          <div key={idx}>
                            {file.type === 'image' ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}/${file.path}`}
                                alt="uploaded"
                                className="max-w-full h-auto rounded-lg"
                              />
                            ) : file.type === 'video' ? (
                              <video controls className="max-w-full h-auto rounded-lg">
                                <source src={`${import.meta.env.VITE_API_URL}/${file.path}`} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                    {message.content && <p className="break-words">{message.content}</p>}
                    <small
                      className={`text-xs opacity-70 block mt-1 text-right ${
                        message.sender === getUserId() ? 'text-gray-200' : 'text-gray-500'
                      }`}
                    >
                      {format(parseISO(message.timestamp), 'HH:mm')}
                    </small>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="sticky bottom-0 bg-white border-t p-4 shadow-lg">
          {files.length > 0 && (
            <div className="flex justify-center flex-wrap gap-2 mb-4">
              {files.map((file, index) => (
                <div key={index} className="relative">
                  {file.type.startsWith('image') ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
                  ) : file.type.startsWith('video') ? (
                    <video className="w-24 h-24 object-cover rounded-lg">
                      <source src={URL.createObjectURL(file)} type={file.type} />
                      Your browser does not support the video tag.
                    </video>
                  ) : null}
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
          <form onSubmit={sendMessage} className="flex justify-center items-center space-x-2">
            <label className="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition-colors">
              <Image className="w-5 h-5" />
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
            </label>
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
              placeholder="Type a message..."
              className="flex-1 rounded-full px-4 py-2 border-2 border-gray-300 focus:border-indigo-500 transition-colors"
            />
            <Button
              onClick={sendMessage}
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