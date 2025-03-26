import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, AlertTriangle, ArrowUpDown, RefreshCw, Plus, Minus, Filter, GridIcon, ViewIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import inventoryService from '../../services/inventory.service';
import { toast } from 'sonner';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const InventoryManagement = ({ onRefreshDashboard }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editedStockQuantity, setEditedStockQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
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

  useEffect(() => {
    fetchInventory();
  }, []);

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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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

  const handleUpdateStock = async (productId) => {
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

  const exportInventoryCSV = () => {
    // Generate CSV content
    const headers = ['Product ID', 'Name', 'Category', 'Stock Quantity', 'Price', 'Status'];
    const csvContent = [
      headers.join(','),
      ...sortedProducts.map(product => [
        product._id,
        `"${product.name.replace(/"/g, '""')}"`, // Handle commas in product names
        product.category,
        product.stockQuantity,
        product.price,
        product.stockQuantity > 5 ? 'In Stock' : product.stockQuantity > 0 ? 'Low Stock' : 'Out of Stock'
      ].join(','))
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Table View Component
  const TableView = () => (
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

  // Grid View Component for mobile
  const GridView = () => (
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

  // Quick Stats for Inventory
  const InventoryStats = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Manage your product inventory and stock levels</p>
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
            onClick={exportInventoryCSV}
            variant="outline" 
            className="gap-2"
            size={isMobile ? "sm" : "default"}
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Inventory Stats */}
      <InventoryStats />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Product Inventory</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters - Responsive Design */}
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
                    <SelectItem value="">All Categories</SelectItem>
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
                    <SelectItem value="">All Stock Status</SelectItem>
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
                    setSelectedCategory('');
                    setSelectedStatus('');
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
                  <SelectItem value="">All Categories</SelectItem>
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
                  <SelectItem value="">All Stock Status</SelectItem>
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
                  setSelectedCategory('');
                  setSelectedStatus('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Product List - Table or Grid based on viewMode */}
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
    </div>
  );
};

export default InventoryManagement;