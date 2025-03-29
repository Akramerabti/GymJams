import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Edit, Trash2, ArrowLeft, AlertTriangle, 
  DollarSign, BarChart, Code, Toggle, Devices, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import blogService from '../../services/blog.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Slider } from '../../components/ui/slider';
import { useAuth } from '../../stores/authStore';

const AdManagement = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adPlacements, setAdPlacements] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [adFormOpen, setAdFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adPerformance, setAdPerformance] = useState({
    impressions: 0,
    clicks: 0,
    revenue: 0,
    ctr: 0,
    rpm: 0
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Ad form state
  const [adForm, setAdForm] = useState({
    position: 'top',
    adNetwork: 'adsense',
    adCode: '',
    isActive: true,
    displayCondition: {
      minReadTime: 0,
      deviceTypes: ['all']
    }
  });
  
  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Only admins can manage ad placements');
      navigate('/admin/blog');
    }
  }, [user, navigate]);
  
  // Check for dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      setIsDarkMode(localStorage.getItem('siteTheme') === 'dark');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);
  
  // Fetch blog and ad data
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const response = await blogService.getBlogBySlug(slug);
        
        if (!response.data) {
          toast.error('Blog post not found');
          navigate('/admin/blog');
          return;
        }
        
        setBlog(response.data);
        setAdPlacements(response.data.adPlacements || []);
        
        // Fetch mock ad performance data
        const performance = await blogService.getAdPerformance();
        const combinedData = performance.data.adsense || {};
        setAdPerformance({
          impressions: combinedData.impressions || 0,
          clicks: combinedData.clicks || 0,
          revenue: combinedData.revenue || 0,
          ctr: combinedData.ctr || 0,
          rpm: combinedData.rpm || 0
        });
        
      } catch (error) {
        console.error('Error fetching blog data:', error);
        toast.error('Failed to load blog data');
        navigate('/admin/blog');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogData();
  }, [slug, navigate]);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!adFormOpen) {
      // Reset form if not editing
      if (!isEditingAd) {
        setAdForm({
          position: 'top',
          adNetwork: 'adsense',
          adCode: '',
          isActive: true,
          displayCondition: {
            minReadTime: 0,
            deviceTypes: ['all']
          }
        });
      }
    }
  }, [adFormOpen, isEditingAd]);
  
  // Handle form input changes
  const handleFormChange = (field, value) => {
    setAdForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle display condition changes
  const handleConditionChange = (field, value) => {
    setAdForm(prev => ({
      ...prev,
      displayCondition: {
        ...prev.displayCondition,
        [field]: value
      }
    }));
  };
  
  // Handle device type selection
  const handleDeviceTypeChange = (type) => {
    const currentTypes = adForm.displayCondition.deviceTypes;
    
    // Special case for 'all'
    if (type === 'all') {
      setAdForm(prev => ({
        ...prev,
        displayCondition: {
          ...prev.displayCondition,
          deviceTypes: currentTypes.includes('all') ? [] : ['all']
        }
      }));
      return;
    }
    
    // Remove 'all' if any specific device is selected
    let newTypes = currentTypes.filter(t => t !== 'all');
    
    // Toggle the selected type
    if (newTypes.includes(type)) {
      newTypes = newTypes.filter(t => t !== type);
    } else {
      newTypes.push(type);
    }
    
    // If no specific devices selected, default to 'all'
    if (newTypes.length === 0) {
      newTypes = ['all'];
    }
    
    setAdForm(prev => ({
      ...prev,
      displayCondition: {
        ...prev.displayCondition,
        deviceTypes: newTypes
      }
    }));
  };
  
  // Open edit ad dialog
  const handleEditAd = (ad) => {
    setSelectedAd(ad);
    setAdForm({
      position: ad.position,
      adNetwork: ad.adNetwork,
      adCode: ad.adCode,
      isActive: ad.isActive,
      displayCondition: {
        minReadTime: ad.displayCondition?.minReadTime || 0,
        deviceTypes: ad.displayCondition?.deviceTypes || ['all']
      }
    });
    setIsEditingAd(true);
    setAdFormOpen(true);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (ad) => {
    setSelectedAd(ad);
    setDeleteDialogOpen(true);
  };
  
  // Add new ad placement
  const handleAddAd = async () => {
    try {
      // Validate form
      if (!adForm.adCode.trim()) {
        toast.error('Ad code is required');
        return;
      }
      
      const response = await blogService.addAdPlacement(slug, adForm);
      
      // Update local state
      setAdPlacements([...adPlacements, response.data]);
      
      toast.success('Ad placement added successfully');
      setAdFormOpen(false);
    } catch (error) {
      console.error('Error adding ad placement:', error);
      toast.error('Failed to add ad placement');
    }
  };
  
  // Update existing ad placement
  const handleUpdateAd = async () => {
    if (!selectedAd) return;
    
    try {
      // Validate form
      if (!adForm.adCode.trim()) {
        toast.error('Ad code is required');
        return;
      }
      
      const response = await blogService.updateAdPlacement(slug, selectedAd._id, adForm);
      
      // Update local state
      setAdPlacements(adPlacements.map(ad => 
        ad._id === selectedAd._id ? response.data : ad
      ));
      
      toast.success('Ad placement updated successfully');
      setAdFormOpen(false);
      setIsEditingAd(false);
      setSelectedAd(null);
    } catch (error) {
      console.error('Error updating ad placement:', error);
      toast.error('Failed to update ad placement');
    }
  };
  
  // Delete ad placement
  const handleDeleteAd = async () => {
    if (!selectedAd) return;
    
    try {
      await blogService.removeAdPlacement(slug, selectedAd._id);
      
      // Update local state
      setAdPlacements(adPlacements.filter(ad => ad._id !== selectedAd._id));
      
      toast.success('Ad placement removed successfully');
      setDeleteDialogOpen(false);
      setSelectedAd(null);
    } catch (error) {
      console.error('Error removing ad placement:', error);
      toast.error('Failed to remove ad placement');
    }
  };
  
  // Get position display name
  const getPositionName = (position) => {
    const positions = {
      'top': 'Top of Page',
      'bottom': 'Bottom of Page',
      'sidebar': 'Sidebar',
      'in-content': 'In-Content',
      'middle': 'Middle of Page'
    };
    
    return positions[position] || position;
  };
  
  // Get ad network display name
  const getNetworkName = (network) => {
    const networks = {
      'adsense': 'Google AdSense',
      'mediavine': 'Mediavine',
      'adthrive': 'AdThrive',
      'amazon': 'Amazon Associates',
      'custom': 'Custom Ad Code'
    };
    
    return networks[network] || network;
  };
  
  // Get status badge color
  const getStatusBadgeClass = (isActive) => {
    return isActive 
      ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
      : isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
  };
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="mr-4"
                onClick={() => navigate('/admin/blog')}
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Blogs
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold">Ad Management</h1>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {blog?.title}
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => {
                setIsEditingAd(false);
                setSelectedAd(null);
                setAdFormOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Ad Placement
            </Button>
          </div>
          
          {/* Performance Overview */}
          <div className={`p-6 rounded-lg ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'
          }`}>
            <h2 className="text-lg font-semibold mb-4">
              Ad Performance Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className={`${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-100'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Impressions</p>
                    <Eye className={`h-4 w-4 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    }`} />
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {adPerformance.impressions.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card className={`${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-100'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Clicks</p>
                    <div className={`p-1 rounded-full ${
                      isDarkMode ? 'bg-green-900' : 'bg-green-100'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isDarkMode ? 'bg-green-400' : 'bg-green-500'
                      }`}></div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {adPerformance.clicks.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card className={`${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-100'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>CTR</p>
                    <BarChart className={`h-4 w-4 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-500'
                    }`} />
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {adPerformance.ctr.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              
              <Card className={`${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-amber-50 border-amber-100'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>RPM</p>
                    <DollarSign className={`h-4 w-4 ${
                      isDarkMode ? 'text-amber-400' : 'text-amber-500'
                    }`} />
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    ${adPerformance.rpm.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className={`${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-100'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Revenue</p>
                    <DollarSign className={`h-4 w-4 ${
                      isDarkMode ? 'text-green-400' : 'text-green-500'
                    }`} />
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    ${adPerformance.revenue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Ad Placements Table */}
          <div className={`rounded-lg overflow-hidden ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow'
          }`}>
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">
                Ad Placements ({adPlacements.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDarkMode ? 'bg-gray-700' : ''}>
                    <TableHead>Position</TableHead>
                    <TableHead>Ad Network</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Min Read Time</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adPlacements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <AlertTriangle className={`h-8 w-8 mb-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-400'
                          }`} />
                          <p className="font-medium">No ad placements found</p>
                          <p className={`text-sm mt-1 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Add an ad placement to monetize this blog post</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    adPlacements.map((ad) => (
                      <TableRow key={ad._id} className={isDarkMode ? 'hover:bg-gray-700' : ''}>
                        <TableCell>{getPositionName(ad.position)}</TableCell>
                        <TableCell>{getNetworkName(ad.adNetwork)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getStatusBadgeClass(ad.isActive)
                          }`}>
                            {ad.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {ad.displayCondition?.minReadTime || 0} min
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {ad.displayCondition?.deviceTypes?.map((device) => (
                              <span 
                                key={device}
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {device === 'all' ? 'All Devices' : device}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAd(ad)}
                              className={isDarkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(ad)}
                              className={isDarkMode ? 'border-gray-700 hover:bg-gray-700 text-red-500' : 'text-red-500'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ad Form Dialog */}
      <Dialog open={adFormOpen} onOpenChange={setAdFormOpen}>
        <DialogContent className={`max-w-md ${
          isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''
        }`}>
          <DialogHeader>
            <DialogTitle>
              {isEditingAd ? 'Edit Ad Placement' : 'Add Ad Placement'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Position */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Position
              </label>
              <Select
                value={adForm.position}
                onValueChange={(value) => handleFormChange('position', value)}
              >
                <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                  <SelectItem value="top">Top of Page</SelectItem>
                  <SelectItem value="bottom">Bottom of Page</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="in-content">In-Content</SelectItem>
                  <SelectItem value="middle">Middle of Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Ad Network */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Ad Network
              </label>
              <Select
                value={adForm.adNetwork}
                onValueChange={(value) => handleFormChange('adNetwork', value)}
              >
                <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                  <SelectValue placeholder="Select ad network" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
                  <SelectItem value="adsense">Google AdSense</SelectItem>
                  <SelectItem value="mediavine">Mediavine</SelectItem>
                  <SelectItem value="adthrive">AdThrive</SelectItem>
                  <SelectItem value="amazon">Amazon Associates</SelectItem>
                  <SelectItem value="custom">Custom Ad Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Ad Code */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Ad Code
              </label>
              <Textarea
                value={adForm.adCode}
                onChange={(e) => handleFormChange('adCode', e.target.value)}
                placeholder="Paste your ad code here..."
                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white font-mono text-sm' : 'font-mono text-sm'}
                rows={5}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Paste the full ad code snippet from your ad network
              </p>
            </div>
            
            {/* Min Read Time */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Minimum Read Time
                </label>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {adForm.displayCondition.minReadTime} min
                </span>
              </div>
              <Slider
                value={[adForm.displayCondition.minReadTime]}
                min={0}
                max={10}
                step={1}
                onValueChange={(value) => handleConditionChange('minReadTime', value[0])}
                className={isDarkMode ? 'bg-gray-700' : ''}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Ad will only show after reader has spent this many minutes on the page
              </p>
            </div>
            
            {/* Device Types */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Target Devices
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'mobile', 'tablet', 'desktop'].map((deviceType) => (
                  <button
                    key={deviceType}
                    type="button"
                    onClick={() => handleDeviceTypeChange(deviceType)}
                    className={`py-1 px-3 rounded-full text-sm ${
                      adForm.displayCondition.deviceTypes.includes(deviceType)
                        ? isDarkMode 
                          ? 'bg-blue-900 text-blue-200' 
                          : 'bg-blue-100 text-blue-800'
                        : isDarkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {deviceType === 'all' ? 'All Devices' : deviceType}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Active Status */}
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Active
              </label>
              <Switch
                checked={adForm.isActive}
                onCheckedChange={(checked) => handleFormChange('isActive', checked)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdFormOpen(false)}
              className={isDarkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={isEditingAd ? handleUpdateAd : handleAddAd}
            >
              {isEditingAd ? 'Update' : 'Add'} Ad Placement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 text-white border-gray-700' : ''}>
          <DialogHeader>
            <DialogTitle>Delete Ad Placement</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this ad placement?</p>
            <div className="mt-4 flex items-center p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">This action cannot be undone.</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className={isDarkMode ? 'border-gray-700 hover:bg-gray-700' : ''}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAd}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdManagement;