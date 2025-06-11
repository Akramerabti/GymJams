// client/src/pages/Taskforce/InventoryManagement.jsx
// Enhanced version with 3PL integration

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, FileDown, AlertTriangle, ArrowUpDown, RefreshCw, 
  Plus, Minus, Filter, GridIcon, ViewIcon, ChevronDown, 
  ChevronUp, Warehouse, Truck, RotateCw, Settings, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import inventoryService from '../../services/inventory.service';
import thirdPartyLogisticsService from '../../services/thirdPartyLogistics.service'; // New service
import { toast } from 'sonner';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const InventoryManagement = ({ onRefreshDashboard }) => {
  // Original state variables
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editedStockQuantity, setEditedStockQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // New state variables for 3PL integration
  const [activeTab, setActiveTab] = useState('inventory');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouseSyncLoading, setWarehouseSyncLoading] = useState(false);
  const [showWarehouseDialog, setShowWarehouseDialog] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    code: '',
    provider: 'shipbob',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    isActive: true,
    apiCredentials: {
      apiKey: '',
      secretKey: '',
      warehouseId: '',
      environment: 'sandbox'
    }
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillmentOrders, setFulfillmentOrders] = useState([]);
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false);
  
  const { user } = useAuth();
  const isMobile = windowWidth < 768;

  // Track window size
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768 && viewMode === 'table') {
        setViewMode('grid');
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial state
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const getUserRole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  // Fetch inventory and warehouses on component mount
  useEffect(() => {
    fetchInventory();
    fetchWarehouses();
    fetchFulfillmentOrders();
  }, []);

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventory();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const response = await thirdPartyLogisticsService.getWarehouses();
      setWarehouses(response.warehouses || []);
      
      // If we have warehouses, select the first one by default
      if (response.warehouses?.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(response.warehouses[0]._id);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to fetch warehouses');
    }
  };

  // New function to fetch fulfillment orders
  const fetchFulfillmentOrders = async () => {
    try {
      setFulfillmentLoading(true);
      const response = await thirdPartyLogisticsService.getFulfillmentOrders();
      setFulfillmentOrders(response.orders || []);
    } catch (error) {
      console.error('Error fetching fulfillment orders:', error);
    } finally {
      setFulfillmentLoading(false);
    }
  };

  // Sync inventory with 3PL
  const syncInventoryWith3PL = async (warehouseId) => {
    if (!warehouseId) return;
    
    try {
      setWarehouseSyncLoading(true);
      await thirdPartyLogisticsService.syncInventory(warehouseId);
      toast.success('Inventory synced successfully');
      fetchInventory(); // Refresh inventory after sync
    } catch (error) {
      console.error('Error syncing inventory:', error);
      toast.error('Failed to sync inventory with warehouse');
    } finally {
      setWarehouseSyncLoading(false);
    }
  };

  // Create warehouse
  const handleCreateWarehouse = async () => {
    try {
      await thirdPartyLogisticsService.createWarehouse(newWarehouse);
      toast.success('Warehouse created successfully');
      fetchWarehouses();
      setShowWarehouseDialog(false);
      setNewWarehouse({
        name: '',
        code: '',
        provider: 'shipbob',
        location: {
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        isActive: true,
        apiCredentials: {
          apiKey: '',
          secretKey: '',
          warehouseId: '',
          environment: 'sandbox'
        }
      });
    } catch (error) {
      console.error('Error creating warehouse:', error);
      toast.error('Failed to create warehouse');
    }
  };

  // Create fulfillment order
  const createFulfillmentOrder = async (orderId) => {
    try {
      await thirdPartyLogisticsService.createFulfillmentOrder(orderId);
      toast.success('Fulfillment order created successfully');
      fetchFulfillmentOrders();
    } catch (error) {
      console.error('Error creating fulfillment order:', error);
      toast.error('Failed to create fulfillment order');
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle inventory update
  const handleUpdateStock = async (productId) => {
    // Original update stock function from your code
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can update inventory.');
      return;
    }
    
    try {
      const stockQuantity = parseInt(editedStockQuantity);
      if (isNaN(stockQuantity) || stockQuantity < 0) {
        toast.error('Please enter a valid stock quantity (0 or greater)');
        return;
      }
      
      await inventoryService.updateInventory(productId, { stockQuantity });
      
      // Update local state
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === productId 
            ? { ...product, stockQuantity } 
            : product
        )
      );
      
      setEditingProduct(null);
      toast.success('Stock quantity updated successfully');

      // Trigger dashboard refresh if provided
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock quantity');
    }
  };

  // Apply sorting and filtering to products
  const sortedProducts = React.useMemo(() => {
    let sortableProducts = [...products];
    
    // Apply filters
    if (searchTerm) {
      sortableProducts = sortableProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      sortableProducts = sortableProducts.filter(product => 
        product.category === selectedCategory
      );
    }
    
    if (selectedStatus) {
      if (selectedStatus === 'inStock') {
        sortableProducts = sortableProducts.filter(product => product.stockQuantity > 5);
      } else if (selectedStatus === 'lowStock') {
        sortableProducts = sortableProducts.filter(product => 
          product.stockQuantity > 0 && product.stockQuantity <= 5
        );
      } else if (selectedStatus === 'outOfStock') {
        sortableProducts = sortableProducts.filter(product => product.stockQuantity <= 0);
      }
    }
    
    // Apply sort
    if (sortConfig.key) {
      sortableProducts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [products, searchTerm, sortConfig, selectedCategory, selectedStatus]);

  // Get stock status badge
  const getStockBadge = (quantity) => {
    if (quantity <= 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    } else if (quantity <= 5) {
      return (
        <Badge variant="warning" className="bg-amber-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge variant="success" className="bg-green-500 flex items-center gap-1">
          In Stock
        </Badge>
      );
    }
  };

  // Categories for filtering
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    return uniqueCategories;
  }, [products]);

  // Render 3PL warehouse section
  const renderWarehouseSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">3PL Warehouses</h2>
        <Button onClick={() => setShowWarehouseDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {warehouses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Warehouse className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Warehouses Connected</h3>
            <p className="text-gray-500 mb-4">
              Connect to your 3PL providers to manage inventory across warehouses.
            </p>
            <Button onClick={() => setShowWarehouseDialog(true)}>
              Connect Warehouse
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(warehouse => (
            <Card key={warehouse._id} className={`${warehouse.isActive ? '' : 'opacity-60'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                  <Badge variant={warehouse.isActive ? 'success' : 'secondary'} className="bg-green-500">
                    {warehouse.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{warehouse.provider} • {warehouse.code}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">{warehouse.location.city}, {warehouse.location.state}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => syncInventoryWith3PL(warehouse._id)}
                      disabled={warehouseSyncLoading}
                    >
                      {warehouseSyncLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCw className="h-4 w-4 mr-2" />
                      )}
                      Sync Inventory
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Warehouse Options</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => console.log('Edit warehouse', warehouse._id)}>
                          Edit Connection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(getWarehousePortalUrl(warehouse), '_blank')}>
                          Open 3PL Portal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => console.log('Disable warehouse', warehouse._id)}
                        >
                          {warehouse.isActive ? 'Disable Warehouse' : 'Enable Warehouse'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Warehouse connection dialog */}
      <Dialog open={showWarehouseDialog} onOpenChange={setShowWarehouseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect 3PL Warehouse</DialogTitle>
            <DialogDescription>
              Enter your warehouse details to connect with your 3PL provider.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Warehouse Name</label>
              <Input
                id="name"
                value={newWarehouse.name}
                onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                placeholder="East Coast Fulfillment"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">Warehouse Code</label>
              <Input
                id="code"
                value={newWarehouse.code}
                onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
                placeholder="EAST-1"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="provider" className="text-sm font-medium">3PL Provider</label>
              <Select
                value={newWarehouse.provider}
                onValueChange={(value) => setNewWarehouse({ ...newWarehouse, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipbob">ShipBob</SelectItem>
                  <SelectItem value="shipmonk">ShipMonk</SelectItem>
                  <SelectItem value="deliverr">Deliverr</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">API Key</label>
              <Input
                id="apiKey"
                value={newWarehouse.apiCredentials.apiKey}
                onChange={(e) => setNewWarehouse({ 
                  ...newWarehouse, 
                  apiCredentials: { 
                    ...newWarehouse.apiCredentials, 
                    apiKey: e.target.value 
                  } 
                })}
                placeholder="sk_123456789"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="warehouseId" className="text-sm font-medium">Warehouse ID (in 3PL system)</label>
              <Input
                id="warehouseId"
                value={newWarehouse.apiCredentials.warehouseId}
                onChange={(e) => setNewWarehouse({ 
                  ...newWarehouse, 
                  apiCredentials: { 
                    ...newWarehouse.apiCredentials, 
                    warehouseId: e.target.value 
                  } 
                })}
                placeholder="3pl-warehouse-id"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="environment" className="text-sm font-medium">Environment</label>
              <Select
                value={newWarehouse.apiCredentials.environment}
                onValueChange={(value) => setNewWarehouse({ 
                  ...newWarehouse, 
                  apiCredentials: { 
                    ...newWarehouse.apiCredentials, 
                    environment: value 
                  } 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarehouseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWarehouse}>
              Connect Warehouse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render fulfillment management section
  const renderFulfillmentSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Order Fulfillment</h2>
        <Button onClick={fetchFulfillmentOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {fulfillmentLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : fulfillmentOrders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Fulfillment Orders</h3>
            <p className="text-gray-500 mb-4">
              Orders that need to be fulfilled by 3PL warehouses will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fulfillmentOrders.map(order => (
                <TableRow key={order._id}>
                  <TableCell className="font-medium">#{order._id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={
                      order.fulfillment?.status === 'shipped' ? 'bg-green-500' :
                      order.fulfillment?.status === 'processing' ? 'bg-blue-500' :
                      order.fulfillment?.status === 'exception' ? 'bg-red-500' :
                      'bg-gray-500'
                    }>
                      {order.fulfillment?.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.fulfillment?.warehouse ? 
                      warehouses.find(w => w._id === order.fulfillment.warehouse)?.name || 'Unknown' : 
                      'Not assigned'
                    }
                  </TableCell>
                  <TableCell>
                    {order.fulfillment?.tracking?.number ? (
                      <a 
                        href={order.fulfillment.tracking.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center"
                      >
                        {order.fulfillment.tracking.number.slice(0, 10)}...
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : 'Not shipped'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Details
                      </Button>
                      
                      {!order.fulfillment?.thirdPartyId && (
                        <Button 
                          size="sm"
                          onClick={() => createFulfillmentOrder(order._id)}
                        >
                          Send to 3PL
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Order details dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder._id.slice(-6).toUpperCase()}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="font-medium mb-2">Order Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Created:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p><span className="font-medium">Status:</span> {selectedOrder.status}</p>
                  <p><span className="font-medium">Payment:</span> {selectedOrder.paymentStatus}</p>
                  <p><span className="font-medium">Total:</span> ${selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Fulfillment Details</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Status:</span> 
                    <Badge className="ml-2">
                      {selectedOrder.fulfillment?.status || 'pending'}
                    </Badge>
                  </p>
                  <p>
                    <span className="font-medium">Warehouse:</span> 
                    {selectedOrder.fulfillment?.warehouse ? 
                      warehouses.find(w => w._id === selectedOrder.fulfillment.warehouse)?.name || 'Unknown' : 
                      'Not assigned'
                    }
                  </p>
                  <p><span className="font-medium">3PL Reference:</span> {selectedOrder.fulfillment?.thirdPartyId || 'Not sent to 3PL'}</p>
                  {selectedOrder.fulfillment?.shippedAt && (
                    <p><span className="font-medium">Shipped:</span> {new Date(selectedOrder.fulfillment.shippedAt).toLocaleString()}</p>
                  )}
                  {selectedOrder.fulfillment?.tracking?.number && (
                    <p>
                      <span className="font-medium">Tracking:</span> 
                      <a 
                        href={selectedOrder.fulfillment.tracking.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline ml-1"
                      >
                        {selectedOrder.fulfillment.tracking.number}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Order Items</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product ? item.product.name : `Product ${index + 1}`}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Shipping Information</h3>
              <div className="text-sm space-y-1">
                <p>
                  {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                </p>
                <p>{selectedOrder.shippingAddress.address}</p>
                {selectedOrder.shippingAddress.apartment && (
                  <p>{selectedOrder.shippingAddress.apartment}</p>
                )}
                <p>
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                </p>
                <p>{selectedOrder.shippingAddress.country}</p>
                <p className="mt-2">
                  <span className="font-medium">Email:</span> {selectedOrder.shippingAddress.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {selectedOrder.shippingAddress.phone}
                </p>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              {!selectedOrder.fulfillment?.thirdPartyId && (
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse._id} value={warehouse._id}>{warehouse.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {!selectedOrder.fulfillment?.thirdPartyId && (
                <Button onClick={() => createFulfillmentOrder(selectedOrder._id)}>
                  Send to 3PL
                </Button>
              )}
              
              {selectedOrder.fulfillment?.thirdPartyId && (
                <Button 
                  variant="outline"
                  onClick={() => console.log('Update tracking for', selectedOrder._id)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Tracking
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // Helper function to get warehouse portal URL
  const getWarehousePortalUrl = (warehouse) => {
    switch (warehouse.provider) {
      case 'shipbob':
        return 'https://merchant.shipbob.com/login';
      case 'shipmonk':
        return 'https://app.shipmonk.com/login';
      case 'deliverr':
        return 'https://sellerportal.deliverr.com/login';
      default:
        return '#';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Manage your product inventory and 3PL fulfillment</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={fetchInventory}
            variant="outline"
            className="gap-2"
            size={isMobile ? "sm" : "default"}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            onClick={() => exportInventoryCSV()}
            variant="outline" 
            className="gap-2"
            size={isMobile ? "sm" : "default"}
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Inventory Stats Cards */}
      <InventoryStats products={products} />

      {/* Tabs for different inventory sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="warehouses">3PL Warehouses</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-6 pt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Product Inventory</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters - same as original code */}
              <div className="space-y-3 mb-6">
                {/* Mobile Search and Filter */}
                <div className="w-full flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Mobile Collapsible Filters */}
                <Collapsible 
                  open={isFiltersOpen} 
                  onOpenChange={setIsFiltersOpen}
                  className="md:hidden w-full"
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full flex justify-between">
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters & View
                      </span>
                      {isFiltersOpen ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pt-2 space-y-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Stock Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock Status</SelectItem>
                        <SelectItem value="inStock">In Stock</SelectItem>
                        <SelectItem value="lowStock">Low Stock</SelectItem>
                        <SelectItem value="outOfStock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setViewMode('table')}
                      >
                        <ViewIcon className="h-4 w-4 mr-2" />
                        Table
                      </Button>
                      <Button 
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setViewMode('grid')}
                      >
                        <GridIcon className="h-4 w-4 mr-2" />
                        Grid
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setSelectedStatus('all');
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </CollapsibleContent>
                </Collapsible>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock Status</SelectItem>
                      <SelectItem value="inStock">In Stock</SelectItem>
                      <SelectItem value="lowStock">Low Stock</SelectItem>
                      <SelectItem value="outOfStock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <Button 
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <ViewIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <GridIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedStatus('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Product List - same as original code */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {viewMode === 'table' && !isMobile ? <TableView /> : <GridView />}
                  
                  {/* Results Count */}
                  <div className="mt-4 text-sm text-gray-500">
                    Showing {sortedProducts.length} of {products.length} products
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="warehouses" className="space-y-6 pt-6">
          {renderWarehouseSection()}
        </TabsContent>
        
        <TabsContent value="fulfillment" className="space-y-6 pt-6">
          {renderFulfillmentSection()}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Table View Component - Same as original
  function TableView() {
    return (
      <div className="rounded-md border">
        <ScrollArea className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer min-w-[180px]"
                  onClick={() => handleSort('name')}
                >
                  Product Name
                  {sortConfig.key === 'name' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  Category
                  {sortConfig.key === 'category' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('stockQuantity')}
                >
                  Stock
                  {sortConfig.key === 'stockQuantity' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('price')}
                >
                  Price
                  {sortConfig.key === 'price' && (
                    <ArrowUpDown className={`ml-2 h-4 w-4 inline ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">
                      {editingProduct === product._id ? (
                        <Input
                          type="number"
                          min="0"
                          className="w-20 inline-block"
                          value={editedStockQuantity}
                          onChange={(e) => setEditedStockQuantity(e.target.value)}
                        />
                      ) : (
                        <span className={product.stockQuantity <= 5 ? 'text-red-600 font-bold' : ''}>
                          {product.stockQuantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell>{getStockBadge(product.stockQuantity)}</TableCell>
                    <TableCell className="text-right">
                      {editingProduct === product._id ? (
                        <div className="flex justify-end space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingProduct(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateStock(product._id)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(product._id);
                            setEditedStockQuantity(product.stockQuantity.toString());
                          }}
                        >
                          Edit Stock
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                      <p>No products found. {searchTerm && 'Try a different search term.'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  }

  // Grid View Component - Same as original
  function GridView() {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4">
        {sortedProducts.length > 0 ? (
          sortedProducts.map((product) => (
            <Card key={product._id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-base">{product.name}</h3>
                    {getStockBadge(product.stockQuantity)}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span>Category: {product.category}</span>
                    <span className="font-medium">${product.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Stock:</span>
                      {editingProduct === product._id ? (
                        <Input
                          type="number"
                          min="0"
                          className="w-16 h-8 text-sm"
                          value={editedStockQuantity}
                          onChange={(e) => setEditedStockQuantity(e.target.value)}
                        />
                      ) : (
                        <span className={`font-bold ${product.stockQuantity <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stockQuantity}
                        </span>
                      )}
                    </div>
                    
                    {editingProduct === product._id ? (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 text-xs px-2"
                          onClick={() => setEditingProduct(null)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          className="h-8 text-xs px-2"
                          onClick={() => handleUpdateStock(product._id)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => {
                          setEditingProduct(product._id);
                          setEditedStockQuantity(product.stockQuantity.toString());
                        }}
                      >
                        Edit Stock
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p>No products found. {searchTerm && 'Try a different search term.'}</p>
          </div>
        )}
      </div>
    );
  }
};

// Inventory Stats Component
const InventoryStats = ({ products = [] }) => {
  const totalProducts = products.length;
  const inStock = products.filter(product => product.stockQuantity > 5).length;
  const lowStock = products.filter(product => product.stockQuantity > 0 && product.stockQuantity <= 5).length;
  const outOfStock = products.filter(product => product.stockQuantity <= 0).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <span className="text-sm text-gray-500">Total Products</span>
          <span className="text-2xl font-bold">{totalProducts}</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <span className="text-sm text-gray-500">In Stock</span>
          <span className="text-2xl font-bold text-green-600">{inStock}</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <span className="text-sm text-gray-500">Low Stock</span>
          <span className="text-2xl font-bold text-amber-500">{lowStock}</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <span className="text-sm text-gray-500">Out of Stock</span>
          <span className="text-2xl font-bold text-red-600">{outOfStock}</span>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;