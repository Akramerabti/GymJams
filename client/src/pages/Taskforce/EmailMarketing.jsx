import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Mail, Send, Users, Eye, MousePointer, Target, TrendingUp,
  Plus, Calendar, Filter, BarChart2, Clock, AlertCircle,
  CheckCircle, XCircle, RefreshCw, Zap, Edit, Copy,
  TestTube, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import emailMarketingService from '../../services/emailMarketing.service';

const EmailMarketing = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [recipientCount, setRecipientCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await emailMarketingService.getCampaigns();
      setCampaigns(response.data || []);
    } catch (error) {
      toast.error('Failed to load campaigns');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const CampaignCard = ({ campaign }) => {
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
           onClick={() => setSelectedCampaign(campaign)}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{campaign.name || 'Untitled Campaign'}</h3>
            <p className="text-sm text-gray-500 mt-1">{campaign.subject}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium capitalize">{campaign.status}</span>
          </div>
        </div>

        {campaign.status === 'sent' && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mx-auto mb-2">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{campaign.sentCount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Sent</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg mx-auto mb-2">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{openRate}%</p>
              <p className="text-xs text-gray-500">Open Rate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-lg mx-auto mb-2">
                <MousePointer className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{clickRate}%</p>
              <p className="text-xs text-gray-500">Click Rate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-50 rounded-lg mx-auto mb-2">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{campaign.recipientCount}</p>
              <p className="text-xs text-gray-500">Recipients</p>
            </div>
          </div>
        )}
        
        {campaign.createdAt && (
          <p className="text-xs text-gray-400 mt-4">
            Created {new Date(campaign.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  };

  const NewCampaignModal = () => {
    const [campaignData, setCampaignData] = useState({
      name: '',
      subject: '',
      htmlContent: '',
      filters: {
        role: 'all',
        hasSubscription: undefined,
        lastActiveWithin: undefined,
        acceptsMarketing: true
      },
      testMode: false,
      testEmail: ''
    });

    // Create a stable reference for filters
    const filtersString = useMemo(() => {
      return JSON.stringify(campaignData.filters);
    }, [campaignData.filters]);

    // Debounced update function to prevent excessive API calls
    const updateRecipientCount = useCallback(async (filters) => {
      try {
        setLoadingCount(true);
        const response = await emailMarketingService.getRecipientCount(filters);
        setRecipientCount(response.count);
      } catch (error) {
        console.error('Failed to get recipient count:', error);
      } finally {
        setLoadingCount(false);
      }
    }, []);

    // Debounce the API call
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        updateRecipientCount(campaignData.filters);
      }, 500); // Wait 500ms after last change

      return () => clearTimeout(timeoutId);
    }, [filtersString, updateRecipientCount, campaignData.filters]);

    const handleSendCampaign = async () => {
      if (!campaignData.subject || !campaignData.htmlContent) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (campaignData.testMode && !campaignData.testEmail) {
        toast.error('Please enter a test email address');
        return;
      }

      try {
        setSending(true);
        const response = await emailMarketingService.sendCampaign(campaignData);
        
        if (response.success) {
          toast.success(
            campaignData.testMode 
              ? 'Test email sent successfully!' 
              : `Campaign sent to ${response.stats.sent} recipients!`
          );
          setShowNewCampaign(false);
          fetchCampaigns();
        } else {
          toast.error(response.message || 'Failed to send campaign');
        }
      } catch (error) {
        toast.error('Error sending campaign');
        console.error(error);
      } finally {
        setSending(false);
      }
    };

    // Helper function to update filters without object recreation
    const updateFilters = useCallback((key, value) => {
      setCampaignData(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          [key]: value
        }
      }));
    }, []);

    // Pre-built templates
    const emailTemplates = [
      {
        name: 'Weekly Fitness Tips',
        subject: '{{firstName}}, Your Weekly Fitness Tips Are Here! 💪',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a202c; text-align: center;">Your Weekly Fitness Tips</h1>
            <p style="color: #4a5568; font-size: 16px;">Hi {{firstName}},</p>
            <p style="color: #4a5568; font-size: 16px;">Here are this week's tips to help you crush your fitness goals:</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f7fafc; border-radius: 8px;">
              <h3 style="color: #2d3748;">💡 Tip #1: Progressive Overload</h3>
              <p style="color: #4a5568;">Gradually increase the weight, frequency, or number of repetitions in your strength training routine.</p>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f7fafc; border-radius: 8px;">
              <h3 style="color: #2d3748;">🥗 Tip #2: Protein Timing</h3>
              <p style="color: #4a5568;">Consume protein within 30 minutes after your workout for optimal muscle recovery.</p>
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
          </div>
        `
      },
      {
        name: 'New Product Launch',
        subject: '🎉 New Product Alert: {{firstName}}, Check Out Our Latest!',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px; background-color: #3b82f6;">
              <h1 style="color: white; margin: 0;">New Product Launch!</h1>
            </div>
            
            <div style="padding: 40px 20px;">
              <p style="color: #4a5568; font-size: 16px;">Hey {{firstName}},</p>
              <p style="color: #4a5568; font-size: 16px;">We're excited to introduce our newest addition to the GymTonic family!</p>
              
              <div style="text-align: center; margin: 40px 0;">
                <img src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400" alt="New Product" style="width: 100%; max-width: 400px; border-radius: 8px;">
              </div>
              
              <h2 style="color: #1a202c; text-align: center;">Premium Whey Protein</h2>
              <p style="color: #4a5568; text-align: center;">25g of protein per serving • Low sugar • Amazing taste</p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://gymtonic.ca/shop" style="display: inline-block; padding: 16px 32px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                  Shop Now
                </a>
              </div>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="color: #92400e; font-weight: bold; margin: 0;">🎁 Launch Special: 20% OFF</p>
                <p style="color: #92400e; margin: 5px 0 0 0;">Use code: LAUNCH20</p>
              </div>
            </div>
          </div>
        `
      }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Create Email Campaign</h2>
          </div>

          <div className="p-6">
            {/* Campaign Details */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Weekly Newsletter - January"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., {{firstName}}, Your weekly fitness tips are here!"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                />
                <p className="mt-2 text-sm text-gray-500">
                 You can use {'{firstName}'} to personalize the subject line
                </p>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a Template
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {emailTemplates.map((template) => (
                    <div
                      key={template.name}
                      className="border-2 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => {
                        setCampaignData({
                          ...campaignData,
                          subject: template.subject,
                          htmlContent: template.content
                        });
                        toast.success(`Template "${template.name}" loaded`);
                      }}
                    >
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">Click to use this template</p>
                    </div>
                  ))}
                  <div
                    className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center"
                    onClick={() => setShowTemplateBuilder(true)}
                  >
                    <div className="text-center">
                      <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-semibold">Custom Template</h4>
                      <p className="text-sm text-gray-500">Build from scratch</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              {campaignData.htmlContent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: campaignData.htmlContent }} />
                  </div>
                </div>
              )}

              {/* Audience Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Your Audience</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Role
                    </label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={campaignData.filters.role}
                      onChange={(e) => updateFilters('role', e.target.value)}
                    >
                      <option value="all">All Users</option>
                      <option value="user">Regular Users</option>
                      <option value="athlete">Athletes</option>
                      <option value="coach">Coaches</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subscription Status
                    </label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const value = e.target.value === 'all' ? undefined : e.target.value === 'yes';
                        updateFilters('hasSubscription', value);
                      }}
                    >
                      <option value="all">All Users</option>
                      <option value="yes">Has Active Subscription</option>
                      <option value="no">No Subscription</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Active
                    </label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const value = e.target.value === 'all' ? undefined : parseInt(e.target.value);
                        updateFilters('lastActiveWithin', value);
                      }}
                    >
                      <option value="all">All Time</option>
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-900">
                      Estimated Recipients: {loadingCount ? (
                        <Loader2 className="inline w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <span className="text-2xl ml-2">{recipientCount !== null ? recipientCount : '---'}</span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => updateRecipientCount(campaignData.filters)}
                      disabled={loadingCount}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadingCount ? 'Loading...' : 'Update Count'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Mode */}
              <div className="border-t pt-6">
                <label htmlFor="test-mode" className="flex items-center space-x-3">
                  <input
                    id="test-mode"
                    name="testMode"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={campaignData.testMode}
                    onChange={(e) => setCampaignData({ ...campaignData, testMode: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-700">Send test email only</span>
                </label>
                
                {campaignData.testMode && (
                  <div className="mt-3">
                    <label htmlFor="test-email" className="sr-only">Test email address</label>
                    <input
                      id="test-email"
                      name="testEmail"
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter test email address"
                      value={campaignData.testEmail}
                      onChange={(e) => setCampaignData({ ...campaignData, testEmail: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setShowNewCampaign(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600 mt-2">Send targeted campaigns to engage your users</p>
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
        <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-6">
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
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📧 Email Marketing Best Practices</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ Personalize subject lines with {'{firstName}'} for 26% higher open rates</li>
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