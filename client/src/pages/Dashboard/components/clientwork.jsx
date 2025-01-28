import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import FileInput from '@/components/ui/FileInput';
import Textarea from '@/components/ui/TextArea';
import { motion } from 'framer-motion';

const ClientWork = ({ client, onClose }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);

  const handleSendMessage = () => {
    // Logic to send message
    console.log('Message sent:', message);
    setMessage('');
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles(uploadedFiles);
    console.log('Files uploaded:', uploadedFiles);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4">
          Client Work: {client.firstName} {client.lastName || client.email}
        </h2>
        <div className="space-y-4">
          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Send Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Type your message here..."
            />
          </div>
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Files</label>
            <FileInput
              onChange={handleFileUpload}
              className="w-full"
              multiple
            />
          </div>
          {/* Display Uploaded Files */}
          {files.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Uploaded Files:</p>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
          >
            Send Message
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClientWork;