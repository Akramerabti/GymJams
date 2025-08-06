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
  PlusCircle, TagIcon, Package, Loader2, BarChart2, Filter, ListFilter,
  Circle, ArrowUpDown, Trash2, CalendarClock, DollarSign, CheckCircle, XCircle, 
  Search, ViewIcon, GridIcon, Menu, ChevronDown, ChevronUp
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Products = ({ onRefreshDashboard }) => {
  // Add state for editing coupon
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToPromote, setProductToPromote] = useState(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productStats, setProductStats] = useState({
    total: 0,
    featured: 0,
    inStock: 0,
    outOfStock: 0,
    withDiscount: 0
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);  const { user } = useAuth();
  const isMobile = window.innerWidth < 768;

  const categories = ['Clothes', 'Machines', 'Accessories', 'CardioEquipment'];

  const getUserRole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Set view mode based on screen size
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('grid');
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
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

      // Trigger dashboard refresh if provided
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async (productData) => {
    if (getUserRole(user) !== 'taskforce' && getUserRole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can edit products.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Product data:', productData);
      const { imagePreviews, images, ...fields } = productData;

      let updatedProduct;
      // If images is an array of File objects, use FormData
      if (images && images.length > 0 && images[0] instanceof File) {
        const formData = new FormData();
        // Append all fields except images
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        // Append images
        for (let i = 0; i < images.length; i++) {
          formData.append('images', images[i]);
        }
        // If specs/discount are objects, stringify them
        if (typeof productData.specs === 'object') {
          formData.set('specs', JSON.stringify(productData.specs));
        }
        if (typeof productData.discount === 'object') {
          formData.set('discount', JSON.stringify(productData.discount));
        }
        updatedProduct = await productService.updateProduct(productToEdit._id, formData, true); // true = isFormData
      } else {
        // No new images, send as JSON
        updatedProduct = await productService.updateProduct(productToEdit._id, productData);
      }

      setProducts((prevProducts) =>
        prevProducts.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );

      setProductToEdit(null);
      setActiveTab("list");
      toast.success('Product updated successfully!');

      // Update stats
      calculateProductStats(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));

      // Trigger dashboard refresh if provided
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product. Please try again.');
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

      // Trigger dashboard refresh if provided
      if (onRefreshDashboard) onRefreshDashboard();
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

      // Trigger dashboard refresh if provided
      if (onRefreshDashboard) onRefreshDashboard();
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
      
      setProductToPromote(null);
      setActiveTab("list");
      toast.success('Promotion applied successfully!');
      
      // Update stats
      calculateProductStats(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));

      // Trigger dashboard refresh if provided
      if (onRefreshDashboard) onRefreshDashboard();
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

  const [coachingPromo, setCoachingPromo] = useState({ code: '', discount: '', subscription: '' });
  const [coachingPromos, setCoachingPromos] = useState([]);
  // Coupon code form and list state
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount: '',
    type: '',
    subscription: '',
    products: [],
    categories: [],
    maxUses: '',
    duration: 'once', // Default to 'once' to avoid empty string enum validation error
    duration_in_months: ''
  });
  const [couponCodes, setCouponCodes] = useState([]);
  // Fetch coupon codes
  useEffect(() => {
    fetchCouponCodes();
  }, []);

  const fetchCouponCodes = async () => {
    try {
      const codes = await productService.getCouponCodes();
      setCouponCodes(codes);
    } catch (err) {
      toast.error('Failed to fetch coupon codes');
    }
  };

  // Handler for coupon code submission
  const handleCouponCodeSubmit = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discount || !couponForm.type) {
      toast.error('Please enter a coupon code, discount, and select a type.');
      return;
    }
    try {
      let subscriptionValue = couponForm.subscription === 'All' ? 'all' : couponForm.subscription;
      let payload = {
        code: couponForm.code,
        discount: couponForm.discount,
        type: couponForm.type,
        subscription: subscriptionValue,
        products: couponForm.products,
        categories: couponForm.categories,
        maxUses: couponForm.maxUses
      };
      // Only pass duration for coaching type
      if (couponForm.type === 'coaching') {
        payload.duration = couponForm.duration || 'once'; // Ensure default value
        if (couponForm.duration === 'repeating' && couponForm.duration_in_months) {
          payload.duration_in_months = couponForm.duration_in_months;
        }
      } else if (couponForm.type === 'both') {
        payload.duration = 'once';
      }
      
      console.log('Products.jsx: Submitting coupon payload:', payload);
      
      await productService.createCouponCode(payload);
      toast.success(`Coupon code "${couponForm.code}" created!`);
      setCouponForm({ code: '', discount: '', type: '', subscription: '', products: [], categories: [], maxUses: '', duration: 'once', duration_in_months: '' });
      fetchCouponCodes();
    } catch (err) {
      console.error('Products.jsx: Coupon creation error:', err);
      toast.error(err.response?.data?.message || 'Failed to create coupon code');
    }
  };

  useEffect(() => {
    fetchCoachingPromos();
  }, []);

  const fetchCoachingPromos = async () => {
    try {
      const promos = await productService.getCoachingPromos();
      setCoachingPromos(promos);
    } catch (err) {
      toast.error('Failed to fetch coaching promos');
    }
  };

  const subscriptionOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'elite', label: 'Elite' },
    { value: 'all', label: 'All' }
  ];

  // Handler for coaching promo submission
  const handleCoachingPromoSubmit = async (e) => {
    e.preventDefault();
    if (!coachingPromo.code || !coachingPromo.discount || !coachingPromo.subscription) {
      toast.error('Please enter a coupon code, discount, and select a subscription.');
      return;
    }
    try {
      await productService.createCoachingPromo({
        code: coachingPromo.code,
        discount: coachingPromo.discount,
        subscription: coachingPromo.subscription
      });
      toast.success(`Coaching promo "${coachingPromo.code}" with ${coachingPromo.discount}% discount for ${coachingPromo.subscription} created!`);
      setCoachingPromo({ code: '', discount: '', subscription: '' });
      fetchCoachingPromos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create promo');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 ">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Manage your product catalog and promotions</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "add-product" ? "secondary" : "outline"}
            onClick={() => {
              setActiveTab("add-product");
              setProductToEdit(null);
            }}
            className="gap-2"
            size={isMobile ? "sm" : "default"}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button
            variant={activeTab === "promotions" ? "secondary" : "outline"}
            onClick={() => {
              setActiveTab("promotions");
              setProductToPromote(null);
            }}
            className="gap-2"
            size={isMobile ? "sm" : "default"}
          >
            <TagIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Promotions</span>
            <span className="sm:hidden">Promo</span>
          </Button>
        </div>
      </div>

      {/* Product Statistics Cards - Mobile Friendly */}
      {activeTab === "list" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          <Card className="h-full">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Total</p>
                <p className="text-lg md:text-2xl font-bold">{productStats.total}</p>
              </div>
              <Package className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">In Stock</p>
                <p className="text-lg md:text-2xl font-bold">{productStats.inStock}</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Out of Stock</p>
                <p className="text-lg md:text-2xl font-bold">{productStats.outOfStock}</p>
              </div>
              <XCircle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">With Discount</p>
                <p className="text-lg md:text-2xl font-bold">{productStats.withDiscount}</p>
              </div>
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="p-3 md:p-4 flex justify-between items-center">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Featured</p>
                <p className="text-lg md:text-2xl font-bold">{productStats.featured}</p>
              </div>
              <BarChart2 className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 md:mb-6">
              <TabsTrigger value="list" className="gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Product List</span>
                <span className="sm:hidden">Products</span>
              </TabsTrigger>
              <TabsTrigger value="add-product" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </TabsTrigger>
              <TabsTrigger value="promotions" className="gap-2">
                <TagIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Promotions</span>
                <span className="sm:hidden">Promo</span>
              </TabsTrigger>
              <TabsTrigger value="coupon-codes" className="gap-2">
                <TagIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Coupon Codes</span>
                <span className="sm:hidden">Coupons</span>
              </TabsTrigger>
              {productToEdit && (
                <TabsTrigger value="edit-product" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Product</span>
                  <span className="sm:hidden">Edit</span>
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="list" className="mt-0">
              <ProductList
                products={filteredProducts}
                onDeleteProduct={handleDeleteProduct}
                onEditProduct={(product) => {
                  setProductToEdit(product);
                  setActiveTab('edit-product');
                }}
                onPromote={setProductToPromote}
                bulkSelectMode={bulkSelectMode}
                selectedProducts={selectedProducts}
                onSelectProduct={handleSelectProduct}
                viewMode={viewMode}
              />
            </TabsContent>

            <TabsContent value="coupon-codes" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Add Coupon Code</CardTitle>
                  <CardDescription>
                    Create a coupon code for products, coaching, or both. Set usage limits and applicable products or subscriptions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4 max-w-md" onSubmit={handleCouponCodeSubmit}>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="coupon-code">Coupon Code</label>
                      <Input
                        id="coupon-code"
                        value={couponForm.code}
                        onChange={e => setCouponForm({ ...couponForm, code: e.target.value })}
                        placeholder="e.g. SAVE10"
                        maxLength={20}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="coupon-discount">Discount (%)</label>
                      <Input
                        id="coupon-discount"
                        type="number"
                        min={1}
                        max={100}
                        value={couponForm.discount}
                        onChange={e => setCouponForm({ ...couponForm, discount: e.target.value })}
                        placeholder="e.g. 10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Coupon Type</label>
                      <select
                        value={couponForm.type}
                        onChange={e => {
                          const newType = e.target.value;
                          const updates = { ...couponForm, type: newType };
                          
                          // Set appropriate defaults based on type
                          if (newType === 'coaching') {
                            updates.duration = couponForm.duration || 'once';
                            updates.subscription = couponForm.subscription || '';
                          } else if (newType === 'both') {
                            updates.duration = 'once'; // Always 'once' for both type
                            updates.subscription = couponForm.subscription || '';
                          } else {
                            // For product type, clear coaching-specific fields
                            updates.duration = 'once';
                            updates.subscription = '';
                          }
                          
                          setCouponForm(updates);
                        }}
                        className="w-full border rounded px-2 py-2"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="product">Product</option>
                        <option value="coaching">Coaching</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    {couponForm.type === 'coaching' || couponForm.type === 'both' ? (
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="coupon-subscription">Subscription</label>
                        <select
                          id="coupon-subscription"
                          value={couponForm.subscription === '' ? 'all' : couponForm.subscription}
                          onChange={e => {
                            const val = e.target.value;
                            setCouponForm({ ...couponForm, subscription: val === 'all' ? 'all' : val });
                          }}
                          className="w-full border rounded px-2 py-2"
                        >
                          <option value="all">All</option>
                          {subscriptionOptions.filter(opt => opt.value !== 'all').map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {couponForm.type === 'product' || couponForm.type === 'both' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Products (optional)</label>
                          <select
                            multiple
                            value={couponForm.products}
                            onChange={e => setCouponForm({ ...couponForm, products: Array.from(e.target.selectedOptions, o => o.value) })}
                            className="w-full border rounded px-2 py-2"
                          >
                            {products.map(product => (
                              <option key={product._id} value={product._id}>{product.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Categories (optional)</label>
                          <select
                            multiple
                            value={couponForm.categories}
                            onChange={e => setCouponForm({ ...couponForm, categories: Array.from(e.target.selectedOptions, o => o.value) })}
                            className="w-full border rounded px-2 py-2"
                          >
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : null}
                    {/* Duration only for coaching type */}
                    {couponForm.type === 'coaching' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1" htmlFor="coupon-duration">Duration</label>
                          <select
                            id="coupon-duration"
                            value={couponForm.duration}
                            onChange={e => setCouponForm({ ...couponForm, duration: e.target.value })}
                            className="w-full border rounded px-2 py-2"
                            required
                          >
                            <option value="once">Once (first charge only)</option>
                            <option value="forever">Forever (all charges)</option>
                            <option value="repeating">Repeating (for X months)</option>
                          </select>
                        </div>
                        {couponForm.duration === 'repeating' && (
                          <div>
                            <label className="block text-sm font-medium mb-1" htmlFor="coupon-duration-months">Duration in Months</label>
                            <Input
                              id="coupon-duration-months"
                              type="number"
                              min={1}
                              value={couponForm.duration_in_months}
                              onChange={e => setCouponForm({ ...couponForm, duration_in_months: e.target.value })}
                              placeholder="e.g. 3"
                              required
                            />
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="coupon-max-uses">Max Uses</label>
                      <Input
                        id="coupon-max-uses"
                        type="number"
                        min={1}
                        value={couponForm.maxUses}
                        onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                        placeholder="e.g. 100 (leave blank for unlimited)"
                      />
                    </div>
                    <Button type="submit" className="gap-2">
                      <TagIcon className="h-4 w-4" />
                      Create Coupon
                    </Button>
                  </form>
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Existing Coupon Codes</h4>
                    <ul className="text-sm">
                      {couponCodes.length === 0 && <li className="text-gray-400">No coupons yet.</li>}
                      {couponCodes.map(coupon => (
                        <li key={coupon._id} className="flex items-center gap-2 flex-wrap border rounded p-2 mb-2 bg-gray-50">
                          <button
                            type="button"
                            className="bg-blue-600 text-white px-2 py-1 rounded mr-2 text-xs"
                            onClick={() => setEditingCoupon(coupon)}
                          >Edit</button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                className="bg-red-600 text-white px-2 py-1 rounded mr-2 text-xs"
                              >Delete</button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Coupon Code</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete coupon <span className="font-mono font-bold">{coupon.code}</span>? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                  <button
                                    type="button"
                                    className="bg-red-600 text-white px-3 py-1 rounded"
                                    onClick={async () => {
                                      try {
                                        await productService.deleteCouponCode(coupon._id);
                                        toast.success('Coupon deleted!');
                                        fetchCouponCodes();
                                      } catch (err) {
                                        toast.error(err.response?.data?.message || 'Failed to delete coupon');
                                      }
                                    }}
                                  >Delete</button>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <span className="font-mono text-base font-bold mr-2">{coupon.code}</span>
                          <span className="text-lg font-bold text-blue-700 mr-2">{coupon.discount}%</span>
                          <span className="bg-gray-200 px-2 py-1 rounded text-xs font-semibold mr-2 text-black">{coupon.type}</span>
                          <div className="flex flex-col gap-1 ml-2">
                            {coupon.subscription && coupon.type !== 'product' && (
                              <span className="bg-white border px-2 py-1 rounded text-xs">Subscription: <b>{coupon.subscription}</b></span>
                            )}
                            {coupon.products && coupon.products.length > 0 && (
                              <span className="bg-white border px-2 py-1 rounded text-xs">Products: <b>{coupon.products.length}</b></span>
                            )}
                            {coupon.categories && coupon.categories.length > 0 && (
                              <span className="bg-white border px-2 py-1 rounded text-xs">Categories: <b>{coupon.categories.join(', ')}</b></span>
                            )}
                            {coupon.maxUses && (
                              <span className="bg-white border px-2 py-1 rounded text-xs">Max Uses: <b>{coupon.maxUses}</b></span>
                            )}
                            {coupon.usedCount !== undefined && (
                              <span className="bg-white border px-2 py-1 rounded text-xs">Used: <b>{coupon.usedCount}</b></span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* Edit Coupon Modal */}
                    {editingCoupon && (
                      <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
                          <h4 className="font-semibold mb-2">Edit Coupon Discount</h4>
                          <form
                            onSubmit={async e => {
                              e.preventDefault();
                              const newDiscount = e.target.elements.discount.value;
                              if (!newDiscount || isNaN(Number(newDiscount)) || Number(newDiscount) < 1 || Number(newDiscount) > 100) {
                                toast.error('Discount must be a number between 1 and 100.');
                                return;
                              }
                              try {
                                await productService.updateCouponDiscount(editingCoupon._id, newDiscount);
                                toast.success('Discount updated!');
                                setEditingCoupon(null);
                                fetchCouponCodes();
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to update discount');
                              }
                            }}
                          >
                            <label className="block text-sm font-medium mb-1">Discount (%)</label>
                            <input
                              type="number"
                              name="discount"
                              min={1}
                              max={100}
                              defaultValue={editingCoupon.discount}
                              className="w-full px-2 py-1 border rounded mb-3"
                              required
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                className="text-gray-500 px-3 py-1 rounded hover:bg-gray-100"
                                onClick={() => setEditingCoupon(null)}
                              >Cancel</button>
                              <button
                                type="submit"
                                className="bg-blue-600 text-white px-3 py-1 rounded"
                              >Save</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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

            <TabsContent value="edit-product" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Product</CardTitle>
                  <CardDescription>Update details for {productToEdit?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {productToEdit && (
                    <ProductForm 
                      categories={categories} 
                      onAddProduct={handleEditProduct} 
                      initialData={productToEdit}
                      isEditing={true}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promotions" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Apply Promotion</CardTitle>
                  <CardDescription>
                    {productToPromote 
                      ? `Set up a promotion for ${productToPromote.name}` 
                      : 'Select a product and set up a promotion.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PromotionForm 
                    products={products} 
                    onApplyPromotion={handleApplyPromotion} 
                    selectedProductId={productToPromote?._id}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coaching-promos" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Add Coaching Promotion</CardTitle>
                  <CardDescription>
                    Create a discount code for coaching services. Users can redeem this code for a discount.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4 max-w-md" onSubmit={handleCoachingPromoSubmit}>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="coach-code">Coupon Code</label>
                      <Input
                        id="coach-code"
                        value={coachingPromo.code}
                        onChange={e => setCoachingPromo({ ...coachingPromo, code: e.target.value })}
                        placeholder="e.g. COACH10"
                        maxLength={20}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="coach-discount">Discount (%)</label>
                      <Input
                        id="coach-discount"
                        type="number"
                        min={1}
                        max={100}
                        value={coachingPromo.discount}
                        onChange={e => setCoachingPromo({ ...coachingPromo, discount: e.target.value })}
                        placeholder="e.g. 10"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="coach-subscription">Subscription</label>
                      <select
                        id="coach-subscription"
                        value={coachingPromo.subscription}
                        onChange={e => setCoachingPromo({ ...coachingPromo, subscription: e.target.value })}
                        className="w-full border rounded px-2 py-2"
                        required
                      >
                        <option value="">Select subscription</option>
                        {/* Always show all options, including 'All' */}
                        {subscriptionOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" className="gap-2">
                      <TagIcon className="h-4 w-4" />
                      Create Promo
                    </Button>
                  </form>
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Existing Coaching Promos</h4>
                    <ul className="text-sm">
                      {coachingPromos.length === 0 && <li className="text-gray-400">No promos yet.</li>}
                      {coachingPromos.map(promo => (
                        <li key={promo._id}>
                          <span className="font-mono">{promo.code}</span> - {promo.discount}% for <b>{promo.subscription}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
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