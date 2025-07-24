import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Send, FileText, Image, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const CoachInteraction = ({ coach }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // Mock files shared by the coach
  const coachFiles = [
    { id: 1, name: 'Workout Plan.pdf', type: 'pdf', date: '2023-10-01' },
    { id: 2, name: 'Nutrition Guide.png', type: 'image', date: '2023-10-05' },
    { id: 3, name: 'Progress Report.docx', type: 'doc', date: '2023-10-10' },
  ];

  const handleSendMessage = async () => {
    if (!message.trim() && files.length === 0) {
      toast.error('Please enter a message or attach a file.');
      return;
    }

    setIsSending(true);
    try {
      // Simulate sending a message (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Message sent successfully!');
      setMessage('');
      setFiles([]);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles(uploadedFiles);
    toast.success(`${uploadedFiles.length} file(s) uploaded.`);
  };

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <span>Communicate with {coach.firstName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File List Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Files Shared by Coach</h3>
          {coachFiles.length > 0 ? (
            <div className="space-y-3">
              {coachFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      {file.type === 'pdf' ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : file.type === 'image' ? (
                        <Image className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">{file.name}</p>
                      <p className="text-sm text-gray-500">Shared on {file.date}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No files shared yet.</p>
          )}
        </div>

        {/* Messaging Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Send a Message</h3>
          <div className="space-y-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Paperclip className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">Attach Files</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                />
              </label>
              <Button
                onClick={handleSendMessage}
                disabled={isSending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSending ? 'Sending...' : 'Send'}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachInteraction;