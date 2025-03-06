import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, AlertTriangle, ArrowUpDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import inventoryService from '../../services/inventory.service';
import { toast } from 'sonner';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editedStockQuantity, setEditedStockQuantity] = useState('');
  const { user } = useAuth();

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
    if (searchTerm) {
      sortableProducts = sortableProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
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
  }, [products, searchTerm, sortConfig]);

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

  const getStockStatusBadge = (quantity) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= 5) {
      return <Badge variant="warning" className="bg-yellow-500">Low Stock</Badge>;
    } else {
      return <Badge variant="success" className="bg-green-500">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-500 mt-1">Manage your product inventory and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchInventory}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={exportInventoryCSV}
            variant="outline" 
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Product Inventory</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer w-1/4"
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
                      Stock Quantity
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
                        <TableCell>{getStockStatusBadge(product.stockQuantity)}</TableCell>
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
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                          <p>No products found. {searchTerm && 'Try a different search term.'}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;