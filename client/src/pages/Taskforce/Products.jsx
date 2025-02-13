import React, { useState, useEffect } from 'react';
import ProductForm from '../../components/product/ProductForm';
import ProductList from '../../components/product/ProductList';
import PromotionForm from '../../components/product/PromotionForm';
import productService from '../../services/product.service';
import { useAuth } from '../../stores/authStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, TagIcon, Package, Loader2 } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();

  const categories = ['Weights', 'Machines', 'Accessories', 'CardioEquipment'];

  const getUserrole = (user) => {
    return user?.user?.role || user?.role || '';
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productService.getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (product) => {
    if (getUserrole(user) !== 'taskforce' && getUserrole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can add products.');
      return;
    }
    console.log('product:', product);
    try {
      const newProduct = await productService.addProduct(product);
      setProducts((prevProducts) => [...prevProducts, newProduct]);
      setActiveTab("list");
      toast.success('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (getUserrole(user) !== 'taskforce' && getUserrole(user) !== 'admin') {
      toast.error('Access denied. Only taskforce members can delete products.');
      return;
    }

    try {
      await productService.deleteProduct(id, token);
      setProducts((prevProducts) => prevProducts.filter((product) => product._id !== id));
      toast.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    }
  };

  const handleApplyPromotion = async (productId, promotion) => {
    if (user?.role !== 'taskforce') {
      toast.error('Access denied. Only taskforce members can apply promotions.');
      return;
    }

    try {
      const updatedProduct = await productService.applyPromotion(productId, promotion, token);
      setProducts((prevProducts) =>
        prevProducts.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
      setActiveTab("list");
      toast.success('Promotion applied successfully!');
    } catch (error) {
      console.error('Error applying promotion:', error);
      toast.error('Failed to apply promotion. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

            <TabsContent value="list" className="mt-0">
              {products.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No products found. Add your first product to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <ProductList products={products} onDeleteProduct={handleDeleteProduct} />
              )}
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