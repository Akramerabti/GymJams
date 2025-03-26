import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { 
  PackageOpen, Users, HelpCircle, ClipboardList, BarChart3, 
  ArrowUp, ArrowDown, DollarSign, ShoppingCart, AlertTriangle, 
  Settings, Calendar, Search, ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Import components
import Products from './Taskforce/Products';
import Applications from './Taskforce/Applications';
import Support from './Taskforce/Support';
import InventoryManagement from './Taskforce/InventoryManagement';

// Import services
import productService from '../services/product.service';
import inventoryService from '../services/inventory.service';

const TaskForceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    products: { total: 0, outOfStock: 0, lowStock: 0 },
    orders: { recent: 0, pending: 0, total: 0 },
    revenue: { daily: 0, weekly: 0, monthly: 0 },
    applications: { pending: 0, approved: 0, rejected: 0 },
    support: { open: 0, resolved: 0 }
  });
  const [loading, setLoading] = useState(true);

  const getUserRole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  useEffect(() => {
    // Check if user has permissions
    if (getUserRole(user) !== 'admin' && getUserRole(user) !== 'taskforce') {
      navigate('/');
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch product data for statistics
      const productsResponse = await productService.getProducts();
      const products = productsResponse.data || [];
      
      // Fetch inventory data if available
      let inventoryData = [];
      try {
        const inventoryResponse = await inventoryService.getInventory();
        inventoryData = inventoryResponse.data || [];
      } catch (error) {
        console.error('Error fetching inventory:', error);
        // Continue with products data only
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
        // Other data would come from corresponding API calls
        orders: { recent: 5, pending: 3, total: 32 },
        revenue: { daily: 350, weekly: 2450, monthly: 10500 },
        applications: { pending: 2, approved: 15, rejected: 3 },
        support: { open: 4, resolved: 12 }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, trendType, loading }) => (
    <Card>
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

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">TaskForce Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage products, inventory, and support tickets</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="sticky top-0 z-10 bg-gray-50 pb-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <PackageOpen className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Users className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Support
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              title="Pending Applications" 
              value={dashboardData.applications.pending}
              icon={Calendar} 
              loading={loading}
            />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Alerts & Notifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
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
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-3 w-40" />
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
                          <Skeleton className="h-4 w-64" />
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
                        <span>Review pending applications (2)</span>
                      </div>
                      <Badge>High</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Restock out-of-stock items (3)</span>
                      </div>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Respond to support tickets (4)</span>
                      </div>
                      <Badge variant="outline">Low</Badge>
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
          <Products />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManagement />
        </TabsContent>

        <TabsContent value="applications">
          <Applications />
        </TabsContent>

        <TabsContent value="support">
          <Support />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskForceDashboard;