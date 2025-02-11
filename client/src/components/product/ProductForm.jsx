import React, { useState} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TextArea from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Image as ImageIcon,
  Smartphone,
  Monitor,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils";

// Import the ProductPage component
import ProductPage from '../../pages/ProductPage';

const ProductForm = ({ categories, onAddProduct }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stockQuantity: '',
    image: null,
    imagePreview: null,
  });
  const [showDetailedPreview, setShowDetailedPreview] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct({
        ...product,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleCategoryChange = (value) => {
    setProduct({ ...product, category: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(product).forEach(key => {
      if (key !== 'imagePreview') {
        formData.append(key, product[key]);
      }
    });
    onAddProduct(formData);
    setProduct({
      name: '',
      description: '',
      price: '',
      category: '',
      stockQuantity: '',
      image: null,
      imagePreview: null,
    });
  };

  const DevicePreview = ({ device }) => {
    const isMobile = device === 'mobile';
    
    return (
      <div className={cn(
        "border rounded-lg mx-auto overflow-hidden bg-white",
        isMobile ? "w-[375px] h-[667px]" : "w-full max-w-6xl"
      )}>
        <div className={cn(
          "overflow-y-auto",
          isMobile ? "h-[667px]" : "h-[800px]"
        )}>
          <ProductPage 
            product={{
              ...product,
              imageUrl: product.imagePreview,
              sizes: ['S', 'M', 'L', 'XL'], // Example sizes
              price: Number(product.price) || 0,
            }}
            isPreview={true}
          />
        </div>
      </div>
    );
  };

  
  return (
    <div className="flex gap-6 max-w-6xl mx-auto p-6">
      <Card className="w-2/3">
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                value={product.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                name="description"
                value={product.description}
                onChange={handleChange}
                className="h-32"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={product.price}
                    onChange={handleChange}
                    className="pl-6"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={product.stockQuantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={product.category}
                onValueChange={handleCategoryChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG up to 10MB
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Add Product
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" type="button">
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Product Preview</DialogTitle>
                  </DialogHeader>
                  
                  <Tabs defaultValue="desktop" className="w-full h-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="desktop" className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Desktop
                      </TabsTrigger>
                      <TabsTrigger value="mobile" className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Mobile
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="desktop" className="mt-0 h-[calc(90vh-8rem)] overflow-auto">
                      <DevicePreview device="desktop" />
                    </TabsContent>
                    
                    <TabsContent value="mobile" className="mt-0 h-[calc(90vh-8rem)] overflow-auto flex justify-center">
                      <DevicePreview device="mobile" />
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </CardContent>
      </Card>

    <Card className="w-1/3">
        <CardHeader>
          <CardTitle>Quick Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {product.imagePreview ? (
              <img
                src={product.imagePreview}
                alt="Product preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-semibold">
                {product.name || 'Product Name'}
              </h3>
              <p className="text-sm text-gray-600">
                {product.description || 'Product description will appear here'}
              </p>
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  ${product.price || '0.00'}
                </span>
                <span className="text-sm text-gray-600">
                  Stock: {product.stockQuantity || '0'}
                </span>
              </div>
              {product.category && (
                <span className="inline-block bg-gray-100 px-2 py-1 rounded-full text-sm">
                  {product.category}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;