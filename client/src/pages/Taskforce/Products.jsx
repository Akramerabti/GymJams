import React, { useState, useEffect, useMemo } from 'react';
import ProductForm from '../../components/product/ProductForm';
import ProductList from '../../components/product/ProductList';
import PromotionForm from '../../components/product/PromotionForm';
import productService from '../../services/product.service';
import { useAuth } from '../../stores/authStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  PlusCircle, TagIcon, Package, Loader2, BarChart2, Filter,
  Circle, ArrowUpDown, Trash2, CalendarClock, DollarSign, CheckCircle, XCircle, Search
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectGroup, SelectItem, 
  SelectLabel, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const Products = () => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [productToDelete, setProductToDelete] = useState(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productStats, setProductStats] = useState({
    total: 0,
    featured: 0,
    inStock: 0,
    outOfStock: 0,
    withDiscount: 0
  });
  const { user } = useAuth();

  const categories = ['Weights', 'Machines', 'Accessories', 'CardioEquipment'];

  const getUserRole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productService.getProducts();
      const productsData = response.data || [];
      setProducts(productsData);
      
      // Calculate product statistics
      calculateProductStats(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProductStats = (productsData) => {
    const stats = {
      total: productsData.length,
      featured: productsData.filter(p => p.featured).length,
      inStock: productsData.filter(p => p.stockQuantity > 0).length,
      outOfStock: productsData.filter(p => p.stockQuantity <= 0).length,
      withDiscount: productsData.filter(p => 
        p.discount && 
        p.discount.percentage > 0 && 
        new Date(p.discount.startDate) <= new Date() &&
        new Date(p.discount.endDate) >= new Date()
      ).length
    };
    setProductStats(stats);
  };

  const handleAddProduct = async (product) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can add products.');
      return;
    }
    
    try {
      setIsLoading(true);
      const newProduct = await productService.addProduct(product);
      setProducts((prevProducts) => [...prevProducts, newProduct]);
      setActiveTab("list");
      toast.success('Product added successfully!');
      
      // Update stats
      calculateProductStats([...products, newProduct]);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can delete products.');
      return;
    }

    try {
      setIsLoading(true);
      await productService.deleteProduct(id);
      const updatedProducts = products.filter((product) => product._id !== id);
      setProducts(updatedProducts);
      setProductToDelete(null);
      toast.success('Product deleted successfully!');
      
      // Update stats
      calculateProductStats(updatedProducts);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // Sequential deletion to avoid overwhelming the server
      for (const productId of selectedProducts) {
        await productService.deleteProduct(productId);
      }
      
      const updatedProducts = products.filter(
        (product) => !selectedProducts.includes(product._id)
      );
      
      setProducts(updatedProducts);
      setSelectedProducts([]);
      setBulkSelectMode(false);
      toast.success(`${selectedProducts.length} products deleted successfully!`);
      
      // Update stats
      calculateProductStats(updatedProducts);
    } catch (error) {
      console.error('Error deleting products in bulk:', error);
      toast.error('Failed to delete some products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPromotion = async (productId, promotion) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can apply promotions.');
      return;
    }

    try {
      setIsLoading(true);
      const updatedProduct = await productService.applyPromotion(productId, promotion);
      
      setProducts((prevProducts) =>
        prevProducts.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
      
      setActiveTab("list");
      toast.success('Promotion applied successfully!');
      
      // Update stats
      calculateProductStats(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
    } catch (error) {
      console.error('Error applying promotion:', error);
      toast.error('Failed to apply promotion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product._id));
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort products based on search, filters, and sort config
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        // Apply search filter
        const matchesSearch = searchTerm === '' || 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
          const matchesCategory = selectedCategory === 'all' || selectedCategory === '' || product.category === selectedCategory;

          // Apply status filter
          let matchesStatus = true;
          if (selectedStatus === 'inStock') {
            matchesStatus = product.stockQuantity > 0;
          } else if (selectedStatus === 'outOfStock') {
            matchesStatus = product.stockQuantity <= 0;
          } else if (selectedStatus === 'withDiscount') {
            matchesStatus = product.discount && 
              product.discount.percentage > 0 && 
              new Date(product.discount.startDate) <= new Date() &&
              new Date(product.discount.endDate) >= new Date();
          }
        
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortConfig.key === 'name') {
          return sortConfig.direction === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortConfig.key === 'price') {
          return sortConfig.direction === 'asc' 
            ? a.price - b.price
            : b.price - a.price;
        } else if (sortConfig.key === 'stockQuantity') {
          return sortConfig.direction === 'asc' 
            ? a.stockQuantity - b.stockQuantity
            : b.stockQuantity - a.stockQuantity;
        } else if (sortConfig.key === 'category') {
          return sortConfig.direction === 'asc' 
            ? a.category.localeCompare(b.category)
            : b.category.localeCompare(a.category);
        }
        return 0;
      });
  }, [products, searchTerm, selectedCategory, selectedStatus, sortConfig]);

  // Calculate how many products are currently in view after filtering
  const filteredCount = filteredProducts.length;
  const totalCount = products.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-500 mt-1">Manage your product catalog and promotions</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={activeTab === "add-product" ? "secondary" : "outline"}
            onClick={() => setActiveTab("add-product")}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Product
          </Button>
          <Button
            variant={activeTab === "promotions" ? "secondary" : "outline"}
            onClick={() => setActiveTab("promotions")}
            className="gap-2"
          >
            <TagIcon className="h-4 w-4" />
            Promotions
          </Button>
        </div>
      </div>

      {/* Product Statistics Cards */}
      {activeTab === "list" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">{productStats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">In Stock</p>
                <p className="text-2xl font-bold">{productStats.inStock}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold">{productStats.outOfStock}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">With Discount</p>
                <p className="text-2xl font-bold">{productStats.withDiscount}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Featured</p>
                <p className="text-2xl font-bold">{productStats.featured}</p>
              </div>
              <BarChart2 className="h-8 w-8 text-purple-500" />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="list" className="gap-2">
                <Package className="h-4 w-4" />
                Product List
              </TabsTrigger>
              <TabsTrigger value="add-product" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Product
              </TabsTrigger>
              <TabsTrigger value="promotions" className="gap-2">
                <TagIcon className="h-4 w-4" />
                Promotions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-0 space-y-4">
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative w-full sm:w-64 flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="inStock">In Stock</SelectItem>
                    <SelectItem value="outOfStock">Out of Stock</SelectItem>
                    <SelectItem value="withDiscount">With Discount</SelectItem>
                  </SelectContent>
                </Select>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      More Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleSort('name')}>
                      Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('price')}>
                      Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('stockQuantity')}>
                      Stock {sortConfig.key === 'stockQuantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('category')}>
                      Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setBulkSelectMode(!bulkSelectMode)}>
                      {bulkSelectMode ? 'Exit Selection Mode' : 'Select Multiple'}
                    </DropdownMenuItem>
                    {bulkSelectMode && (
                      <DropdownMenuItem 
                        onClick={handleSelectAllProducts}
                        disabled={filteredProducts.length === 0}
                      >
                        {selectedProducts.length === filteredProducts.length 
                          ? 'Deselect All' 
                          : 'Select All'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Bulk Action Controls */}
              {bulkSelectMode && selectedProducts.length > 0 && (
                <div className="mb-4 flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium">
                    {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex-1" />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1">
                        <Trash2 className="h-4 w-4" />
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {selectedProducts.length} selected products.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Selected'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              
              {/* Product List */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {totalCount === 0 
                      ? 'No products found. Add your first product to get started.'
                      : 'No products match your filters. Try adjusting your search criteria.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div>
                  <ProductList 
                    products={filteredProducts}
                    onDeleteProduct={(id) => setProductToDelete(id)}
                    bulkSelectMode={bulkSelectMode}
                    selectedProducts={selectedProducts}
                    onSelectProduct={handleSelectProduct}
                    onPromote={(productId) => {
                      setActiveTab("promotions");
                      // Set the product ID for the promotion form (this would need to be implemented in the PromotionForm component)
                    }}
                  />
                  
                  {/* Product Count Info */}
                  <div className="mt-4 text-sm text-gray-500">
                    Showing {filteredCount} of {totalCount} products
                  </div>
                </div>
              )}
              
              {/* Delete Confirmation Dialog */}
              <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the product 
                      and remove it from your catalog.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteProduct(productToDelete)}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            <TabsContent value="add-product" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Product</CardTitle>
                  <CardDescription>Fill in the details to add a new product to your catalog.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductForm categories={categories} onAddProduct={handleAddProduct} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promotions" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Apply Promotion</CardTitle>
                  <CardDescription>Select a product and set up a promotion.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PromotionForm products={products} onApplyPromotion={handleApplyPromotion} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;