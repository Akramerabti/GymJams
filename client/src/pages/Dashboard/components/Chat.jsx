import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../stores/authStore';
import { useSocket } from '../../../SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Image, Video, X, Eye } from 'lucide-react'; // Import Eye icon
import { motion, AnimatePresence } from 'framer-motion';
import subscriptionService from '../../../services/subscription.service';
import { format, parseISO } from 'date-fns';

const Chat = ({ subscription, onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState(subscription.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]); // Store multiple files
  const [isTyping, setIsTyping] = useState(false); // Track if the current user is typing
  const [otherUserTyping, setOtherUserTyping] = useState(false); // Track if the other user is typing
  const fileInputRef = useRef(null); // Ref to reset the file input
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // Ref to track scroll position

  const getUserId = () => {
    return user?.id || user?.user?.id;
  };

  const userId = getUserId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAtBottom = () => {
    if (!chatContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 50; // 50px threshold
  };

  const markMessagesAsRead = async () => {
    const unreadMessages = messages.filter((msg) => !msg.read && msg.sender !== userId);
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg._id);
      await subscriptionService.markMessagesAsRead(subscription._id, messageIds);
      setMessages((prev) =>
        prev.map((msg) => (messageIds.includes(msg._id) ? { ...msg, read: true } : msg))
      );
    }
  };

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    markMessagesAsRead();
  }, []);

  // Handle receiving a new message
  const handleReceiveMessage = (message) => {
    console.log('Client received message:', message);
    setMessages((prev) => {
      const isDuplicate = prev.some((m) => m._id === message._id); // Check for duplicate _id
      return isDuplicate ? prev : [...prev, message];
    });

    // Mark messages as read if the current user is the receiver
    if (message.sender !== userId) {
      markMessagesAsRead();
    }
  };

  // Handle typing events
  const handleTyping = (isTyping) => {
    socket.emit('typing', {
      senderId: userId,
      receiverId: subscription.assignedCoach,
      isTyping,
    });
  };
  // Handle sending a message
  const handleSendMessage = async () => {
    if (newMessage.trim() || files.length > 0) {
      try {
        const userId = getUserId();

        // Upload files if any
        let uploadedFiles = [];
        if (files.length > 0) {
          uploadedFiles = await subscriptionService.uploadFiles(files);
        }

        console.log('Uploaded files:', uploadedFiles);

        // Emit the message via socket
        socket.emit('sendMessage', {
          senderId: getUserId(),
          receiverId: subscription.assignedCoach,
          content: newMessage.trim(),
          timestamp: new Date().toISOString(),
          file: uploadedFiles.map((file) => ({
            path: file.path,
            type: file.type,
          })),
        });

        // Update the subscription with the new message via API call
        const updatedSubscription = await subscriptionService.sendMessage(
          subscription._id,
          userId,
          subscription.assignedCoach,
          newMessage.trim(),
          new Date().toISOString(),
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
        console.error('Failed to send message:', error);
      }
    }
  };

  // Handle file changes
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxSize = 100 * 1024 * 1024; // 100MB
    let totalSize = 0;

    // Calculate total size of selected files
    selectedFiles.forEach((file) => {
      totalSize += file.size;
    });

    if (totalSize > maxSize) {
      alert('Total file size exceeds 100MB. Please select smaller files.');
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  // Handle removing a file
  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
  };

  useEffect(() => {
    if (!socket) return;
  
    if (userId) {
      socket.emit('register', userId);
      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('typing', (data) => {
        if (data.senderId !== userId) {
          setOtherUserTyping(data.isTyping);
        }
      });
      socket.on('messagesRead', (data) => {
        if (data.subscriptionId === subscription._id) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (data.messageIds.includes(msg._id)) {
                return { ...msg, read: true };
              }
              return msg;
            })
          );
        }
      });
    }
  
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing');
      socket.off('messagesRead');
    };
  }, [socket, user, subscription._id]);

  // Typing timeout effect
  useEffect(() => {
    let typingTimeout;
    if (newMessage.trim()) {
      if (!isTyping) {
        handleTyping(true);
        setIsTyping(true);
      }
      typingTimeout = setTimeout(() => {
        handleTyping(false);
        setIsTyping(false);
      }, 2000); // Adjust the timeout as needed
    } else {
      handleTyping(false);
      setIsTyping(false);
    }

    return () => clearTimeout(typingTimeout);
  }, [newMessage]);

  useEffect(() => {
    scrollToBottom();
    markMessagesAsRead(); // Mark messages as read when the component mounts or updates
  }, [messages]);


  const mostRecentMessage = messages
  .filter((msg) => msg.sender === userId)
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
        className="fixed inset-0 bg-gray-50 z-[9999] flex flex-col items-center justify-center"
      >
        <div className="max-w-2xl w-full h-full md:h-[90vh] md:rounded-lg md:shadow-2xl bg-white flex flex-col overflow-hidden">
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

          <div
            ref={chatContainerRef}
            className="chat-container flex-1 p-4 overflow-y-auto space-y-4"
            onScroll={() => {
              if (isAtBottom()) {
                scrollToBottom();
              }
            }}
          >
            {messages.map((msg) => {
              const uniqueKey = msg._id; // Use the unique _id as the key
              return (
                <div key={uniqueKey} className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-lg shadow-sm ${msg.sender === userId ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {/* Display files if they exist */}
                    {msg.file && msg.file.length > 0 && (
                      <div className="mb-2">
                        {msg.file.map((file, idx) => (
                          <div key={idx}>
                            {file.type.startsWith('image') ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}/${file.path}`}
                                alt="uploaded"
                                className="max-w-full h-auto rounded-lg"
                              />
                            ) : file.type.startsWith('video') ? (
                              <video controls className="max-w-full h-auto rounded-lg">
                                <source src={`${import.meta.env.VITE_API_URL}/${file.path}`} type={file.type} />
                                Your browser does not support the video tag.
                              </video>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Display message content if it exists */}
                    {msg.content && <p className="text-sm break-words">{msg.content}</p>}

                    {/* Display timestamp */}
                    <small className={`text-xs opacity-70 block mt-1 ${msg.sender === userId ? 'text-gray-200' : 'text-gray-500'}`}>
                      {format(parseISO(msg.timestamp), 'HH:mm')}
                    </small>

                    {/* Display eye icon for read messages */}
                    {msg.sender === userId && msg.read && (
                      <div className="flex justify-end mt-1">
                        <Eye className="w-4 h-4 text-gray-400" /> {/* Grey eye icon */}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {otherUserTyping && isAtBottom() && (
              <div className="flex justify-start">
                <div className="text-gray-500 text-sm font-bold">
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Typing...
                  </motion.span>
                </div>
              </div>
            )}

            {/* Scroll to bottom ref */}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white">
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="w-full flex justify-center items-center space-x-2"
            >
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
                placeholder="Type a message..."
                className="flex-1 rounded-full px-4 py-2 text-white border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-colors"
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