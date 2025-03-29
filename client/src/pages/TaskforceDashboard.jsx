import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Routes, Route, useLocation } from 'react-router-dom';
import { 
  PackageOpen, Users, HelpCircle, ClipboardList, BarChart3, 
  ArrowUp, ArrowDown, DollarSign, ShoppingCart, AlertTriangle, 
  Settings, Calendar, Search, ShoppingBag, Menu, X,
  FileText, Archive, Edit, Pencil
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

// Import components
import Products from './Taskforce/Products';
import Applications from './Taskforce/Applications';
import Support from './Taskforce/Support';
import InventoryManagement from './Taskforce/InventoryManagement';
import BlogManagement from './Taskforce/BlogManagement';
import AdManagement from './Taskforce/AdManagement';

// Import services
import productService from '../services/product.service';
import inventoryService from '../services/inventory.service';
import orderService from '../services/order.service';
import blogService from '../services/blog.service';
import { useAuth } from '../stores/authStore';

const TaskForceDashboard = () => {
  const { slug } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    products: { total: 0, outOfStock: 0, lowStock: 0 },
    orders: { recent: 0, pending: 0, total: 0 },
    revenue: { daily: 0, weekly: 0, monthly: 0 },
    applications: { pending: 0, approved: 0, rejected: 0 },
    support: { open: 0, resolved: 0 },
    blogs: { total: 0, published: 0, draft: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 768;

  // Track window size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getUserRole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  // Function to trigger refresh after operations
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Determine if we're in a specific ad management route
  const isAdManagementRoute = location.pathname.includes('/ads/');
  
  useEffect(() => {
    // Check if user has permissions
    if (getUserRole(user) !== 'admin' && getUserRole(user) !== 'taskforce') {
      navigate('/');
      return;
    }

    // Set the active tab based on the route
    if (isAdManagementRoute) {
      setActiveTab('ads');
    } else if (location.pathname.includes('/blog')) {
      setActiveTab('blog');
    }

    fetchDashboardData();
  }, [user, navigate, refreshTrigger, location.pathname]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch product data for statistics
      const productsResponse = await productService.getProducts();
      const products = productsResponse.data || [];
      
      // Fetch order data
      let orders = [];
      let orderStats = { recent: 0, pending: 0, total: 0 };
      let revenueStats = { daily: 0, weekly: 0, monthly: 0 };
      
      try {
        const ordersResponse = await orderService.getOrders();
        orders = ordersResponse.data || [];
        
        // Calculate order stats
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        orderStats.total = orders.length;
        orderStats.pending = orders.filter(order => order.status === 'pending').length;
        orderStats.recent = orders.filter(order => new Date(order.createdAt) >= oneDayAgo).length;
        
        // Calculate revenue stats
        const dailyOrders = orders.filter(order => new Date(order.createdAt) >= oneDayAgo);
        const weeklyOrders = orders.filter(order => new Date(order.createdAt) >= sevenDaysAgo);
        const monthlyOrders = orders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo);
        
        revenueStats.daily = dailyOrders.reduce((total, order) => total + (order.total || 0), 0);
        revenueStats.weekly = weeklyOrders.reduce((total, order) => total + (order.total || 0), 0);
        revenueStats.monthly = monthlyOrders.reduce((total, order) => total + (order.total || 0), 0);
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Continue with products data only
      }
      
      // Fetch inventory data if available
      let inventoryData = [];
      try {
        const inventoryResponse = await inventoryService.getInventory();
        inventoryData = inventoryResponse.data || [];
      } catch (error) {
        console.error('Error fetching inventory:', error);
        // Continue with products data only
      }
      
      // Fetch blog data if available
      let blogStats = { total: 0, published: 0, draft: 0 };
      try {
        const blogResponse = await blogService.getBlogs();
        const blogs = blogResponse.data || [];
        
        blogStats.total = blogs.length;
        blogStats.published = blogs.filter(blog => blog.status === 'published').length;
        blogStats.draft = blogs.filter(blog => blog.status === 'draft').length;
      } catch (error) {
        console.error('Error fetching blogs:', error);
      }
      
      // Combine data for statistics or use product data if inventory not available
      const stockData = inventoryData.length > 0 ? inventoryData : products;
      
      // Calculate dashboard metrics
      const outOfStock = stockData.filter(item => item.stockQuantity <= 0).length;
      const lowStock = stockData.filter(item => item.stockQuantity > 0 && item.stockQuantity <= 5).length;
      
      // Update dashboard data
      setDashboardData({
        products: { 
          total: products.length, 
          outOfStock, 
          lowStock 
        },
        orders: orderStats,
        revenue: revenueStats,
        applications: { pending: 2, approved: 15, rejected: 3 }, // Example data, would be replaced with real API data
        support: { open: 4, resolved: 12 }, // Example data, would be replaced with real API data
        blogs: blogStats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, trendType, loading }) => (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
            )}
          </div>
          <div className={`p-2 rounded-full ${loading ? 'bg-gray-200' : 'bg-blue-50'}`}>
            {loading ? (
              <Skeleton className="h-6 w-6 rounded-full" />
            ) : (
              <Icon className="h-6 w-6 text-blue-500" />
            )}
          </div>
        </div>
        {!loading && trend && (
          <div className="flex items-center mt-4">
            {trendType === 'up' ? (
              <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <p className={`text-xs ${trendType === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trendValue}% {trendType === 'up' ? 'increase' : 'decrease'} from last month
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AlertCard = ({ title, count, icon: Icon, variant, loading }) => (
    <div className={`flex items-center p-4 rounded-lg ${
      variant === 'danger' ? 'bg-red-50' : 
      variant === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
    }`}>
      {loading ? (
        <Skeleton className="h-10 w-10 rounded-full" />
      ) : (
        <div className={`p-2 rounded-full ${
          variant === 'danger' ? 'bg-red-100 text-red-600' : 
          variant === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
        }`}>
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="ml-4">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        {loading ? (
          <Skeleton className="h-5 w-12 mt-1" />
        ) : (
          <p className={`text-xl font-semibold ${
            variant === 'danger' ? 'text-red-600' : 
            variant === 'warning' ? 'text-amber-600' : 'text-blue-600'
          }`}>
            {count}
          </p>
        )}
      </div>
    </div>
  );

  const MobileTabMenu = () => (
    <div className="md:hidden relative">
      <Button
        variant="outline"
        className="flex items-center gap-2 w-full justify-between"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {activeTab === 'overview' && <BarChart3 className="h-4 w-4" />}
        {activeTab === 'products' && <PackageOpen className="h-4 w-4" />}
        {activeTab === 'inventory' && <ClipboardList className="h-4 w-4" />}
        {activeTab === 'applications' && <Users className="h-4 w-4" />}
        {activeTab === 'support' && <HelpCircle className="h-4 w-4" />}
        {activeTab === 'blog' && <FileText className="h-4 w-4" />}
        {activeTab === 'ads' && <Edit className="h-4 w-4" />}
        <span className="capitalize flex-1 text-left">
          {activeTab}
        </span>
        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white shadow-lg rounded-md overflow-hidden">
          <div className="p-2 space-y-1">
            {['overview', 'products', 'inventory', 'applications', 'support', 'blog'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setActiveTab(tab);
                  setMobileMenuOpen(false);
                  if (tab === 'blog' || tab === 'ads') {
                    navigate(`/taskforce-dashboard/${tab}`);
                  }
                }}
              >
                {tab === 'overview' && <BarChart3 className="h-4 w-4" />}
                {tab === 'products' && <PackageOpen className="h-4 w-4" />}
                {tab === 'inventory' && <ClipboardList className="h-4 w-4" />}
                {tab === 'applications' && <Users className="h-4 w-4" />}
                {tab === 'support' && <HelpCircle className="h-4 w-4" />}
                {tab === 'blog' && <FileText className="h-4 w-4" />}
                {tab === 'ads' && <Edit className="h-4 w-4" />}
                <span className="capitalize">{tab}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // If we're in ad management route, render the AdManagement component
  if (isAdManagementRoute) {
    return <AdManagement />;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">TaskForce Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage products, inventory, and support tickets</p>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        if (value === 'blog' && !location.pathname.includes('/blog')) {
          navigate('/taskforce-dashboard/blog');
        }
      }} className="space-y-6">
        <div className="sticky top-0 z-10 bg-gray-50 pb-4">
          {/* Mobile Menu */}
          <MobileTabMenu />
          
          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid grid-cols-7 w-full">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <PackageOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-2" disabled={!slug}>
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Ad Management</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Products" 
              value={dashboardData.products.total}
              icon={ShoppingBag} 
              trend={true}
              trendValue={8.2}
              trendType="up"
              loading={loading}
            />
            <StatCard 
              title="Recent Orders" 
              value={dashboardData.orders.recent}
              icon={ShoppingCart} 
              loading={loading}
            />
            <StatCard 
              title="Weekly Revenue" 
              value={`$${dashboardData.revenue.weekly.toLocaleString()}`}
              icon={DollarSign}
              trend={true}
              trendValue={5.1}
              trendType="up" 
              loading={loading}
            />
            <StatCard 
              title="Blog Posts" 
              value={dashboardData.blogs.total}
              icon={FileText} 
              loading={loading}
            />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 md:mt-8 mb-4">Alerts & Notifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <AlertCard 
              title="Out of Stock Items" 
              count={dashboardData.products.outOfStock} 
              icon={AlertTriangle} 
              variant="danger"
              loading={loading}
            />
            <AlertCard 
              title="Low Stock Items" 
              count={dashboardData.products.lowStock} 
              icon={AlertTriangle} 
              variant="warning"
              loading={loading}
            />
            <AlertCard 
              title="Open Support Tickets" 
              count={dashboardData.support.open} 
              icon={HelpCircle} 
              variant="info"
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 md:mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your store</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="ml-4 space-y-2">
                          <Skeleton className="h-4 w-full md:w-64" />
                          <Skeleton className="h-3 w-3/4 md:w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <ShoppingCart className="h-5 w-5" />
                      </span>
                      <div className="ml-4">
                        <p className="text-sm font-medium">New order #12345</p>
                        <p className="text-sm text-gray-500">30 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <DollarSign className="h-5 w-5" />
                      </span>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Payment received for order #12342</p>
                        <p className="text-sm text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                      </span>
                      <div className="ml-4">
                        <p className="text-sm font-medium">Product "Fitness Band XL" is low on stock</p>
                        <p className="text-sm text-gray-500">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="ml-4">
                        <p className="text-sm font-medium">New blog post published</p>
                        <p className="text-sm text-gray-500">1 day ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Tasks</CardTitle>
                <CardDescription>Items that need your attention</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Skeleton className="h-5 w-5 rounded mr-2" />
                          <Skeleton className="h-4 w-full md:w-64" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm md:text-base">Review pending applications (2)</span>
                      </div>
                      <Badge>High</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm md:text-base">Restock out-of-stock items (3)</span>
                      </div>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm md:text-base">Respond to support tickets (4)</span>
                      </div>
                      <Badge variant="outline">Low</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm md:text-base">Update blog content (1)</span>
                      </div>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Products onRefreshDashboard={triggerRefresh} />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManagement onRefreshDashboard={triggerRefresh} />
        </TabsContent>

        <TabsContent value="applications">
          <Applications />
        </TabsContent>

        <TabsContent value="support">
          <Support />
        </TabsContent>

        <TabsContent value="blog">
          <BlogManagement />
        </TabsContent>

        <TabsContent value="ads">
          {slug ? (
            <AdManagement />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Edit className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Ad Management</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Select a blog post from the Blog section to manage its ad placements.
              </p>
              <Button onClick={() => setActiveTab('blog')}>
                Go to Blog Management
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskForceDashboard;