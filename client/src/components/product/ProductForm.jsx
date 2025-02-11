import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TextArea from "@/components/ui/TextArea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Smartphone, Monitor, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from 'sonner'; // For displaying error messages
import ProductPage from '../../pages/ProductPage';

const ProductForm = ({ categories, onAddProduct }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stockQuantity: '',
    images: [], // Array of File objects
    imagePreviews: [], // Array of image URLs for preview
    featured: false,
    specs: {
      weight: '',
      dimensions: '',
      material: '',
      warranty: '',
    },
    discount: {
      percentage: '',
      startDate: '',
      endDate: '',
    },
  });

  const [showDetailedPreview, setShowDetailedPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
    setTouched({ ...touched, [name]: true });
    validateField(name, value);
  };

  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      discount: {
        ...product.discount,
        [name]: value,
      },
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    console.log('Selected Files:', files); // Debug: Check if files are being captured
  
    const totalImages = product.images.length + files.length;
  
    // Only enforce the maximum limit during file selection
    if (totalImages > 8) {
      setErrors({ ...errors, images: 'Maximum 8 images allowed' });
      return;
    }
  
    const newImages = [...product.images, ...files];
    const newPreviews = files.map(file => URL.createObjectURL(file));
  
    console.log('Updated Images:', newImages); // Debug: Check updated images
    console.log('Updated Previews:', newPreviews); // Debug: Check updated previews
  
    setProduct({
      ...product,
      images: newImages,
      imagePreviews: [...product.imagePreviews, ...newPreviews],
    });
    setTouched({ ...touched, images: true });
    validateField('images', newImages); // Validate images (but only for max limit)
  };

  const removeImage = (index) => {
    const newImages = [...product.images];
    const newPreviews = [...product.imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);

    setProduct({
      ...product,
      images: newImages,
      imagePreviews: newPreviews,
    });
    validateField('images', newImages);
  };

  const handleCategoryChange = (value) => {
    setProduct({ ...product, category: value });
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value) newErrors.name = 'Product name is required';
        else delete newErrors.name;
        break;
      case 'description':
        if (!value) newErrors.description = 'Description is required';
        else delete newErrors.description;
        break;
      case 'price':
        if (!value) newErrors.price = 'Price is required';
        else if (isNaN(value) || value <= 0) newErrors.price = 'Price must be greater than 0';
        else delete newErrors.price;
        break;
      case 'category':
        if (!value) newErrors.category = 'Category is required';
        else delete newErrors.category;
        break;
      case 'stockQuantity':
        if (!value) newErrors.stockQuantity = 'Stock quantity is required';
        else if (isNaN(value) || value < 0) newErrors.stockQuantity = 'Stock quantity must be 0 or greater';
        else delete newErrors.stockQuantity;
        break;
        case 'images':
          if (value.length < 2) {
            newErrors.images = 'Minimum 2 images required';
          } else if (value.length > 8) {
            newErrors.images = 'Maximum 8 images allowed';
          } else {
            delete newErrors.images; // Clear the error if validation passes
          }
          break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const allFields = ['name', 'description', 'price', 'category', 'stockQuantity', 'images'];
    allFields.forEach(field => {
      validateField(field, product[field]); // Validate each field
      setTouched({ ...touched, [field]: true }); // Mark the field as touched
    });
  
    // Check if there are any errors
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate the form (including the minimum number of images)
    if (!validateForm()) {
      toast.error('Please correct all errors before submitting.');
      return;
    }
  
    const formData = new FormData();
    Object.keys(product).forEach((key) => {
      if (key === 'images') {
        product.images.forEach((image) => {
          formData.append('images', image); // Append each image file
        });
      } else if (key !== 'imagePreviews') {
        formData.append(key, product[key]); // Append other fields
      }
    });
  
    try {
      await onAddProduct(formData); // Call the parent function to handle the API request
      toast.success('Product added successfully!');
    } catch (error) {
      toast.error('Failed to add product. Please try again.');
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      toast.error('Please fill out all required fields before previewing.');
      return;
    }
    setShowDetailedPreview(true);
  };

  const DevicePreview = ({ device }) => {
    const isMobile = device === 'mobile';
    const previewProduct = {
      ...product,
      imageUrl: product.imagePreviews[0] || 'https://via.placeholder.com/400', // Use the first image for preview
      sizes: ['S', 'M', 'L', 'XL'],
      price: Number(product.price) || 0,
      stockQuantity: Number(product.stockQuantity) || 0,
      discount: product.discount.percentage ? product.discount : null,
    };

    return (
      <div className={cn(
        "border rounded-lg mx-auto overflow-hidden bg-white",
        isMobile ? "w-[375px] h-[667px]" : "w-full max-w-6xl"
      )}>
        <div className={cn(
          "overflow-y-auto",
          isMobile ? "h-[667px]" : "h-[800px]"
        )}>
          <ProductPage product={previewProduct} isPreview={true} />
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
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                name="description"
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className="h-32 text-black"
                required
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
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
                  {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
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
                {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity}</p>}
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
              {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
            </div>

         {/* Image Upload Section */}
         <div className="space-y-2">
              <Label htmlFor="images" className="flex justify-between">
                Product Images
                <span className="text-sm text-gray-500">
                  {product.images.length}/8 images
                </span>
              </Label>
              <div className={cn(
                "border-2 border-dashed rounded-lg p-6",
                errors.images && touched.images ? "border-red-500" : "border-gray-200"
              )}>
                <input
                  type="file"
                  id="images"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG up to 10MB (2-8 images)
                  </span>
                </label>
              </div>
              {errors.images && touched.images && (
                <p className="text-sm text-red-500">{errors.images}</p>
              )}

              {/* Image Preview Grid */}
              {product.imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {product.imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Discount Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Discount </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Discount Percentage</Label>
                  <Input
                    id="discountPercentage"
                    name="percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={product.discount.percentage || ''}
                    onChange={handleDiscountChange}
                  />
                  {errors.discountPercentage && <p className="text-sm text-red-500">{errors.discountPercentage}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountStartDate">Start Date</Label>
                  <Input
                    id="discountStartDate"
                    name="startDate"
                    type="date"
                    value={product.discount.startDate || ''}
                    onChange={handleDiscountChange}
                  />
                  {errors.discountStartDate && <p className="text-sm text-red-500">{errors.discountStartDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountEndDate">End Date</Label>
                  <Input
                    id="discountEndDate"
                    name="endDate"
                    type="date"
                    value={product.discount.endDate || ''}
                    onChange={handleDiscountChange}
                  />
                  {errors.discountEndDate && <p className="text-sm text-red-500">{errors.discountEndDate}</p>}
                </div>
              </div>
            </div>

          {/* Submit and Preview Buttons */}
          <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Add Product
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" type="button" onClick={handlePreview}>
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

      {/* Quick Preview Card */}
      <Card className="w-1/3">
        <CardHeader>
          <CardTitle>Quick Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {product.imagePreviews.length > 0 ? (
              <img
                src={product.imagePreviews[0]} // Use the first image for the quick preview
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
              {product.discount.percentage && (
                <span className="inline-block bg-green-100 px-2 py-1 rounded-full text-sm text-green-600">
                  {product.discount.percentage}% off
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