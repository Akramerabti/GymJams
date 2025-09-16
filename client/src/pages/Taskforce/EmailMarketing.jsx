import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Mail, Send, Users, Eye, MousePointer, Target, TrendingUp,
  Plus, Calendar, Filter, BarChart2, Clock, AlertCircle,
  CheckCircle, XCircle, RefreshCw, Zap, Edit, Copy,
  TestTube, Loader2, X, Archive, EyeOff, Maximize2, Minimize2, Split
} from 'lucide-react';

// Mock theme context since we don't have the actual one
const useTheme = () => ({ darkMode: false });

const EmailMarketing = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [hiddenCampaigns, setHiddenCampaigns] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const { darkMode } = useTheme();

  // Mock data for demonstration
  useEffect(() => {
    setCampaigns([
      {
        _id: '1',
        name: 'Weekly Newsletter #12',
        subject: 'Your Weekly Fitness Tips Are Here!',
        status: 'sent',
        sentCount: 1250,
        opens: 380,
        clicks: 95,
        recipientCount: 1250,
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        name: 'Product Launch Campaign',
        subject: 'New Product Alert: Premium Whey Protein',
        status: 'draft',
        sentCount: 0,
        opens: 0,
        clicks: 0,
        recipientCount: 850,
        createdAt: new Date().toISOString()
      }
    ]);
  }, []);

  const toggleHideCampaign = (campaignId) => {
    setHiddenCampaigns(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      } else {
        return [...prev, campaignId];
      }
    });
  };

  const visibleCampaigns = useMemo(() => {
    if (showHidden) {
      return campaigns.filter(campaign => hiddenCampaigns.includes(campaign._id));
    }
    return campaigns.filter(campaign => !hiddenCampaigns.includes(campaign._id));
  }, [campaigns, hiddenCampaigns, showHidden]);

  const CampaignCard = ({ campaign }) => {
    const isHidden = hiddenCampaigns.includes(campaign._id);
    
    const getStatusIcon = () => {
      switch (campaign.status) {
        case 'sent': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'sending': return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
        case 'draft': return <Edit className="w-5 h-5 text-gray-500" />;
        default: return null;
      }
    };

    const openRate = campaign.sentCount > 0 
      ? ((campaign.opens / campaign.sentCount) * 100).toFixed(1)
      : 0;
    
    const clickRate = campaign.opens > 0
      ? ((campaign.clicks / campaign.opens) * 100).toFixed(1)
      : 0;

    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${isHidden ? 'opacity-75' : ''}`}>
        <div className="flex justify-between items-start mb-4">
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => setSelectedCampaign(campaign)}
          >
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {campaign.name || 'Untitled Campaign'}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              {campaign.subject}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {getStatusIcon()}
            <span className={`text-sm font-medium capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {campaign.status}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleHideCampaign(campaign._id);
              }}
              className={`p-1 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded transition-colors`}
              title={isHidden ? 'Show campaign' : 'Hide campaign'}
            >
              {isHidden ? 
                <Eye className="w-4 h-4 text-gray-500" /> : 
                <EyeOff className="w-4 h-4 text-gray-500" />
              }
            </button>
          </div>
        </div>

        {campaign.status === 'sent' && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className={`flex items-center justify-center w-12 h-12 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg mx-auto mb-2`}>
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {campaign.sentCount.toLocaleString()}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sent</p>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center w-12 h-12 ${darkMode ? 'bg-green-900' : 'bg-green-50'} rounded-lg mx-auto mb-2`}>
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{openRate}%</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Open Rate</p>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center w-12 h-12 ${darkMode ? 'bg-purple-900' : 'bg-purple-50'} rounded-lg mx-auto mb-2`}>
                <MousePointer className="w-6 h-6 text-purple-600" />
              </div>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{clickRate}%</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Click Rate</p>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center w-12 h-12 ${darkMode ? 'bg-amber-900' : 'bg-amber-50'} rounded-lg mx-auto mb-2`}>
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {campaign.recipientCount}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recipients</p>
            </div>
          </div>
        )}
        
        {campaign.createdAt && (
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-4`}>
            Created {new Date(campaign.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  };

  // Full-Screen Editor Component
  const FullScreenEditor = ({ isOpen, onClose, initialData = {}, onSave }) => {
    const [editorData, setEditorData] = useState({
      subject: '',
      content: '',
      ...initialData
    });
    const [viewMode, setViewMode] = useState('split'); // 'split', 'code', 'preview'
    const [isMinimized, setIsMinimized] = useState(false);
    const [showTemplates, setShowTemplates] = useState(true);

    useEffect(() => {
      if (isOpen && initialData) {
        setEditorData({ ...initialData });
      }
    }, [isOpen, initialData]);

    // HTML Template Library - Inbox-Optimized Templates
    const htmlTemplates = [
      {
        category: 'Buttons',
        items: [
          {
            name: 'Primary Button',
            code: `<div style="text-align: center; margin: 20px 0;">
  <a href="#" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; font-family: Arial, sans-serif;">
    View Details
  </a>
</div>`
          },
          {
            name: 'Secondary Button',
            code: `<div style="text-align: center; margin: 20px 0;">
  <a href="#" style="display: inline-block; padding: 14px 28px; background-color: transparent; color: #2563eb; text-decoration: none; border: 1px solid #2563eb; border-radius: 6px; font-weight: 500; font-family: Arial, sans-serif;">
    Learn More
  </a>
</div>`
          },
          {
            name: 'Button Row',
            code: `<div style="text-align: center; margin: 20px 0;">
  <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 0 8px; font-family: Arial, sans-serif;">
    Read More
  </a>
  <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 0 8px; font-family: Arial, sans-serif;">
    Contact Us
  </a>
</div>`
          }
        ]
      },
      {
        category: 'Content Blocks',
        items: [
          {
            name: 'Personal Message',
            code: `<div style="margin: 25px 0; padding: 25px; background-color: #f8fafc; border-radius: 8px; border-left: 3px solid #2563eb;">
  <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 18px; font-family: Arial, sans-serif;">Hello {{firstName}},</h3>
  <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">I wanted to personally reach out and share something that I think you'll find valuable. We've been working on some updates that I believe will help you achieve your goals.</p>
</div>`
          },
          {
            name: 'Educational Tip',
            code: `<div style="margin: 25px 0; padding: 20px; background-color: #fefce8; border-radius: 8px;">
  <h3 style="color: #713f12; margin: 0 0 10px 0; font-family: Arial, sans-serif;">Today's Insight</h3>
  <p style="color: #a16207; margin: 0; font-size: 16px; line-height: 1.5; font-family: Arial, sans-serif;">Here's a helpful tip that many of our community members have found useful in their journey.</p>
</div>`
          },
          {
            name: 'Community Spotlight',
            code: `<div style="margin: 25px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
  <h3 style="color: #0c4a6e; margin: 0 0 15px 0; font-family: Arial, sans-serif;">Community Member Spotlight</h3>
  <p style="font-style: italic; font-size: 16px; color: #0369a1; margin: 0 0 15px 0; line-height: 1.6; font-family: Arial, sans-serif;">"This approach has really helped me stay consistent with my goals."</p>
  <div style="margin-top: 15px;">
    <strong style="color: #0c4a6e; font-family: Arial, sans-serif;">Sarah M.</strong>
    <br>
    <span style="color: #0369a1; font-size: 14px; font-family: Arial, sans-serif;">Community Member</span>
  </div>
</div>`
          }
        ]
      },
      {
        category: 'Images & Media',
        items: [
          {
            name: 'Image with Context',
            code: `<div style="text-align: center; margin: 25px 0;">
  <img src="https://via.placeholder.com/500x300" alt="Relevant content image" style="width: 100%; max-width: 500px; height: auto; border-radius: 6px;">
  <p style="margin: 12px 0 0 0; color: #64748b; font-size: 14px; font-family: Arial, sans-serif;">This image relates to today's topic</p>
</div>`
          },
          {
            name: 'Content Gallery',
            code: `<div style="margin: 25px 0;">
  <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <img src="https://via.placeholder.com/250x200" alt="Content image 1" style="width: 100%; max-width: 250px; height: auto; border-radius: 6px;">
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569; font-family: Arial, sans-serif;">Resource 1</p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top;">
        <img src="https://via.placeholder.com/250x200" alt="Content image 2" style="width: 100%; max-width: 250px; height: auto; border-radius: 6px;">
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569; font-family: Arial, sans-serif;">Resource 2</p>
      </td>
    </tr>
  </table>
</div>`
          }
        ]
      },
      {
        category: 'Decorative',
        items: [
          {
            name: 'Simple Divider',
            code: `<div style="text-align: center; margin: 25px 0;">
  <hr style="border: none; height: 1px; background-color: #e2e8f0; width: 50%; margin: 0 auto;">
</div>`
          },
          {
            name: 'Content Separator',
            code: `<div style="text-align: center; margin: 25px 0;">
  <div style="display: inline-block; padding: 0 15px;">
    <span style="color: #94a3b8; font-size: 14px; font-family: Arial, sans-serif;">• • •</span>
  </div>
</div>`
          },
          {
            name: 'Highlighted Box',
            code: `<div style="margin: 20px 0; padding: 20px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px;">
  <p style="margin: 0; text-align: center; color: #334155; font-family: Arial, sans-serif; font-size: 16px;">Important information or helpful reminder goes here</p>
</div>`
          }
        ]
      },
      {
        category: 'Updates & News',
        items: [
          {
            name: 'Update Notice',
            code: `<div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
  <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #065f46; font-family: Arial, sans-serif;">What's New</h3>
  <p style="margin: 0; color: #047857; font-size: 15px; font-family: Arial, sans-serif;">We've made some improvements based on your feedback.</p>
</div>`
          },
          {
            name: 'Weekly Summary',
            code: `<div style="background-color: #fefce8; color: #713f12; padding: 20px; border-radius: 6px; margin: 20px 0;">
  <h3 style="margin: 0 0 15px 0; font-size: 18px; font-family: Arial, sans-serif;">This Week's Highlights</h3>
  <ul style="margin: 0; padding-left: 20px; font-family: Arial, sans-serif; color: #a16207;">
    <li style="margin-bottom: 8px;">Key update or insight</li>
    <li style="margin-bottom: 8px;">Community highlight</li>
    <li>Helpful resource</li>
  </ul>
</div>`
          }
        ]
      },
      {
        category: 'Footer Elements',
        items: [
          {
            name: 'Simple Footer',
            code: `<div style="margin: 30px 0 20px 0; padding: 20px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px; font-family: Arial, sans-serif;">
    Thank you for being part of our community.
  </p>
  <p style="margin: 0; color: #64748b; font-size: 14px; font-family: Arial, sans-serif;">
    <a href="#" style="color: #2563eb; text-decoration: none;">Manage preferences</a> | 
    <a href="#" style="color: #2563eb; text-decoration: none;">Unsubscribe</a>
  </p>
</div>`
          },
          {
            name: 'Connect Footer',
            code: `<div style="text-align: center; margin: 25px 0; padding: 20px;">
  <p style="margin: 0 0 12px 0; color: #475569; font-size: 15px; font-family: Arial, sans-serif;">Stay connected with us</p>
  <div style="margin: 12px 0;">
    <a href="#" style="display: inline-block; margin: 0 8px; color: #2563eb; text-decoration: none; font-family: Arial, sans-serif; font-size: 14px;">Facebook</a>
    <a href="#" style="display: inline-block; margin: 0 8px; color: #2563eb; text-decoration: none; font-family: Arial, sans-serif; font-size: 14px;">Twitter</a>
    <a href="#" style="display: inline-block; margin: 0 8px; color: #2563eb; text-decoration: none; font-family: Arial, sans-serif; font-size: 14px;">LinkedIn</a>
  </div>
</div>`
          },
          {
            name: 'Contact Information',
            code: `<div style="background-color: #f1f5f9; color: #334155; padding: 20px; text-align: center; margin: 25px 0; border-radius: 6px;">
  <h4 style="margin: 0 0 12px 0; font-size: 16px; font-family: Arial, sans-serif;">Questions? We're here to help</h4>
  <p style="margin: 0 0 8px 0; font-size: 14px; font-family: Arial, sans-serif;">Email: support@company.com</p>
  <p style="margin: 0; font-size: 14px; font-family: Arial, sans-serif;">Visit our help center for more resources</p>
</div>`
          }
        ]
      }
    ];

    const insertTemplate = (templateCode) => {
      const textarea = document.getElementById('html-editor');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentContent = editorData.content;
        const newContent = currentContent.substring(0, start) + '\n' + templateCode + '\n' + currentContent.substring(end);
        
        setEditorData(prev => ({ ...prev, content: newContent }));
        
        // Focus back to textarea and position cursor
        setTimeout(() => {
          textarea.focus();
          const newPosition = start + templateCode.length + 2;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 10);
      }
    };

    if (!isOpen) return null;

    const handleSave = () => {
      onSave(editorData);
      onClose();
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col mt-15" style={{ height: '95dvh' }}>
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 flex justify-between items-center flex-shrink-0`}>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Email Editor
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Full-screen editing mode
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggles */}
            <div className={`flex rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-1`}>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'code' 
                    ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow-sm` 
                    : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'split' 
                    ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow-sm` 
                    : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                <Split className="w-4 h-4 inline mr-1" />
                Split
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'preview' 
                    ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow-sm` 
                    : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                Preview
              </button>
            </div>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} rounded-lg transition-colors`}
            >
              {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className={`p-2 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} rounded-lg transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subject Line */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-b px-6 py-3 flex-shrink-0`}>
          <input
            type="text"
            placeholder="Email subject line..."
            value={editorData.subject}
            onChange={(e) => setEditorData(prev => ({ ...prev, subject: e.target.value }))}
            className={`w-full text-lg font-medium ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b px-4 py-2 flex justify-between items-center flex-shrink-0`}>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  HTML Content
                </h3>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className={`px-3 py-1 text-xs rounded ${
                    showTemplates 
                      ? 'bg-blue-600 text-white' 
                      : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                  } transition-colors`}
                >
                  Templates
                </button>
              </div>
              <div className="flex-1 flex">
                <textarea
                  id="html-editor"
                  value={editorData.content}
                  onChange={(e) => setEditorData(prev => ({ ...prev, content: e.target.value }))}
                  className={`${showTemplates ? 'w-2/3' : 'w-full'} p-4 ${
                    darkMode 
                      ? 'bg-gray-900 text-gray-100 placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  } font-mono text-sm border-0 focus:ring-0 resize-none`}
                  placeholder="Enter your HTML content here..."
                  style={{ minHeight: 'calc(100dvh - 16rem)' }}
                />
                
                {/* Template Panel */}
                {showTemplates && (
                  <div className={`w-1/3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-l flex flex-col mb-5`}>
                    <div className="p-3 flex-shrink-0">
                      <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        HTML Templates
                      </h4>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4" style={{ maxHeight: 'calc(100dvh - 20rem)' }}>
                      
                      {htmlTemplates.map((category) => (
                        <div key={category.category} className="space-y-2">
                          <h5 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
                            {category.category}
                          </h5>
                          <div className="space-y-2">
                            {category.items.map((template, idx) => (
                              <button
                                key={idx}
                                onClick={() => insertTemplate(template.code)}
                                className={`w-full text-left p-2 text-xs rounded ${
                                  darkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' 
                                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                                } transition-colors`}
                              >
                                <div className="font-medium">{template.name}</div>
                                <div className={`text-xs mt-1 opacity-75 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Click to insert
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          {viewMode === 'split' && (
            <div className={`w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex-shrink-0`}></div>
          )}

          {/* Preview */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b px-4 py-2 flex-shrink-0`}>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Preview
                </h3>
              </div>
              <div className={`flex-1 overflow-auto p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className={`max-w-2xl mx-auto ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                  {editorData.subject && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <h4 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                        Subject:
                      </h4>
                      <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>
                        {editorData.subject}
                      </p>
                    </div>
                  )}
                  <div 
                    dangerouslySetInnerHTML={{ __html: editorData.content }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-t px-6 py-4 flex justify-between items-center flex-shrink-0`}>
          <div className="flex items-center space-x-4">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Use <code className={`px-1 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                {`{{firstName}}`}
              </code> and <code className={`px-1 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                {`{{email}}`}
              </code> for personalization
            </p>
            <span className={`text-gray-300 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Browse <strong>Templates</strong> panel for pre-built components
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Updated NewCampaignModal with full-screen editor integration
  const NewCampaignModal = () => {
    const [campaignData, setCampaignData] = useState({
      name: '',
      subject: '',
      htmlContent: '',
      testMode: false,
      testEmail: ''
    });
    const [showFullEditor, setShowFullEditor] = useState(false);

    const emailTemplates = [
      {
        id: 'weekly-tips',
        name: 'Weekly Fitness Tips',
        description: 'Weekly newsletter with fitness tips and advice',
        subject: '{{firstName}}, Your Weekly Fitness Tips Are Here!',
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1a202c; text-align: center;">Your Weekly Fitness Tips</h1>
  <p style="color: #4a5568; font-size: 16px;">Hi {{firstName}},</p>
  <p style="color: #4a5568; font-size: 16px;">Here are this week's tips to help you crush your fitness goals:</p>
  
  <div style="margin: 30px 0; padding: 20px; background-color: #f7fafc; border-radius: 8px;">
    <h3 style="color: #2d3748;">💡 Tip #1: Progressive Overload</h3>
    <p style="color: #4a5568;">Gradually increase the weight, frequency, or number of repetitions in your strength training routine.</p>
  </div>
  
  <div style="text-align: center; margin: 40px 0;">
    <a href="https://gymtonic.ca/coaching" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Explore Coaching Plans
    </a>
  </div>
  
  <p style="color: #718096; font-size: 14px; text-align: center;">
    Stay strong,<br>
    The GymTonic Team
  </p>
</div>`
      }
    ];

    const handleTemplateSelect = (template) => {
      setCampaignData({
        ...campaignData,
        subject: template.subject,
        htmlContent: template.content,
        name: campaignData.name || template.name
      });
    };

    const openFullEditor = () => {
      setShowFullEditor(true);
    };

    const handleEditorSave = (editorData) => {
      setCampaignData({
        ...campaignData,
        subject: editorData.subject,
        htmlContent: editorData.content
      });
    };

    const handleSendCampaign = async () => {
      if (!campaignData.subject || !campaignData.htmlContent) {
        alert('Please fill in subject and content');
        return;
      }
      
      // Mock send action
      console.log('Sending campaign:', campaignData);
      setShowNewCampaign(false);
    };

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl max-w-4xl w-full h-[90dvh] flex flex-col`}>
            <div className={`p-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b flex justify-between items-center flex-shrink-0`}>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Create Email Campaign
              </h2>
              <button
                onClick={() => setShowNewCampaign(false)}
                className={`p-1 ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} rounded-lg transition-colors`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                {/* Campaign Details */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="e.g., Weekly Newsletter - January"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Start with a Template (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {emailTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`border-2 ${
                          darkMode ? 'border-gray-700 hover:border-blue-400' : 'border-gray-200 hover:border-blue-500'
                        } rounded-lg p-4 cursor-pointer transition-colors`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {template.name}
                        </h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                          {template.description}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">Click to use this template</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Edit Fields */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Email Subject
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="e.g., {{firstName}}, Your weekly fitness tips are here!"
                    value={campaignData.subject}
                    onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                  />
                </div>

                {/* Content Preview & Editor Button */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Content
                    </label>
                    <button
                      onClick={openFullEditor}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>Full Editor</span>
                    </button>
                  </div>
                  
                  {campaignData.htmlContent ? (
                    <div className={`${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    } border rounded-lg p-4 max-h-64 overflow-y-auto`}>
                      <div dangerouslySetInnerHTML={{ __html: campaignData.htmlContent }} />
                    </div>
                  ) : (
                    <div className={`${
                      darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                    } border-2 border-dashed rounded-lg p-8 text-center`}>
                      <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No content yet. Click "Full Editor" to start creating your email.</p>
                    </div>
                  )}
                </div>

                {/* Test Mode */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="testMode"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={campaignData.testMode}
                    onChange={(e) => setCampaignData({ ...campaignData, testMode: e.target.checked })}
                  />
                  <label htmlFor="testMode" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Send as test email
                  </label>
                </div>

                {campaignData.testMode && (
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Test Email Address
                    </label>
                    <input
                      type="email"
                      className={`w-full px-4 py-2 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="test@example.com"
                      value={campaignData.testEmail}
                      onChange={(e) => setCampaignData({ ...campaignData, testEmail: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t flex justify-between flex-shrink-0`}>
              <button
                onClick={() => setShowNewCampaign(false)}
                className={`px-4 py-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendCampaign}
                disabled={sending || !campaignData.subject || !campaignData.htmlContent}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    {campaignData.testMode ? <TestTube className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                    <span>{campaignData.testMode ? 'Send Test' : 'Send Campaign'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Full Screen Editor */}
        <FullScreenEditor
          isOpen={showFullEditor}
          onClose={() => setShowFullEditor(false)}
          initialData={{
            subject: campaignData.subject,
            content: campaignData.htmlContent
          }}
          onSave={handleEditorSave}
        />
      </>
    );
  };

  return (
    <div 
      className={`p-6 max-w-7xl mt-10 mx-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
      style={{ 
        minHeight: '100dvh', 
        paddingTop: '10rem', 
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Email Marketing
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
            Send targeted campaigns to engage your users
          </p>
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaign List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {showHidden ? 'Hidden Campaigns' : 'Recent Campaigns'}
          </h2>
          {campaigns.length > 0 && hiddenCampaigns.length > 0 && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Archive className="w-4 h-4" />
              <span>{showHidden ? 'Show Active' : `Show Hidden (${hiddenCampaigns.length})`}</span>
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : visibleCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleCampaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-12 text-center`}>
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No campaigns yet
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Create your first email campaign to engage with your users
            </p>
            <button
              onClick={() => setShowNewCampaign(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Campaign</span>
            </button>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className={`mt-12 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg p-6`}>
        <h3 className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>
          📧 Email Marketing Best Practices
        </h3>
        <ul className={`space-y-2 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
          <li>✓ Personalize subject lines with {`{{firstName}}`} for 26% higher open rates</li>
          <li>✓ Keep subject lines under 50 characters for mobile optimization</li>
          <li>✓ Send emails Tuesday-Thursday between 9-11 AM for best engagement</li>
          <li>✓ Include a clear call-to-action button above the fold</li>
          <li>✓ Always test your emails before sending to your full list</li>
        </ul>
      </div>

      {/* Modals */}
      {showNewCampaign && <NewCampaignModal />}
    </div>
  );
};

export default EmailMarketing;