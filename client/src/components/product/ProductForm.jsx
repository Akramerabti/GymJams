import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TextArea from "@/components/ui/TextArea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/Switch";
import { Eye, Heart, Badge, ShoppingCart, Upload, Image as ImageIcon, Smartphone, Monitor, X, Save, ArrowLeft, Loader2, Plus, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { useMediaQuery } from "react-responsive";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { format } from 'date-fns';

const ProductForm = ({ categories, onAddProduct, initialData = null, isEditing = false }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stockQuantity: '',
    images: [], // Array of File objects for new uploads
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImageCount, setExistingImageCount] = useState(0);

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData && isEditing) {
      console.log("Initializing form with data:", initialData);
      
      // Format dates for input fields
      let formattedDiscount = { ...initialData.discount } || { percentage: '', startDate: '', endDate: '' };
      if (formattedDiscount.startDate) {
        formattedDiscount.startDate = format(new Date(formattedDiscount.startDate), 'yyyy-MM-dd');
      }
      if (formattedDiscount.endDate) {
        formattedDiscount.endDate = format(new Date(formattedDiscount.endDate), 'yyyy-MM-dd');
      }

      // Create image previews for existing images
      const existingImages = Array.isArray(initialData.images) ? initialData.images : [];
      setExistingImageCount(existingImages.length);
      
      const imagePreviews = existingImages.map(image => {
        return image.startsWith('http') 
          ? image 
          : `${import.meta.env.VITE_API_URL}/${image}`;
      });

      console.log("Setting image previews:", imagePreviews);

      setProduct({
        ...initialData,
        discount: formattedDiscount,
        imagePreviews,
        images: [], // We don't need to re-upload images unless new ones are added
      });
    }
  }, [initialData, isEditing]);

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

  const handleSpecsChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      specs: {
        ...product.specs,
        [name]: value,
      },
    });
  };

  const handleFeaturedChange = (checked) => {
    setProduct({ ...product, featured: checked });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    console.log('Selected Files:', files);
  
    const totalImages = product.images.length + product.imagePreviews.length + files.length;
  
    // Only enforce the maximum limit during file selection
    if (totalImages > 8) {
      setErrors({ ...errors, images: 'Maximum 8 images allowed' });
      toast.error('Maximum 8 images allowed');
      return;
    }
  
    // Create object URLs for preview
    const newPreviews = files.map(file => URL.createObjectURL(file));
  
    setProduct(prev => ({
      ...prev,
      images: [...prev.images, ...files],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }));
    
    setTouched({ ...touched, images: true });
    validateField('images', [...product.images, ...files]);
  };

  const removeImage = (index) => {
    // Handle differently based on whether it's a new upload or existing image
    if (index < existingImageCount) {
      // This is an existing image, mark it for removal but keep track of it
      const newImagePreviews = [...product.imagePreviews];
      newImagePreviews.splice(index, 1);
      
      setExistingImageCount(prev => prev - 1);
      setProduct(prev => ({
        ...prev,
        imagePreviews: newImagePreviews,
      }));
    } else {
      // This is a newly uploaded image
      const adjustedIndex = index - existingImageCount;
      const newImages = [...product.images];
      const newPreviews = [...product.imagePreviews];
      
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(newPreviews[index]);
      
      newImages.splice(adjustedIndex, 1);
      newPreviews.splice(index, 1);
      
      setProduct(prev => ({
        ...prev,
        images: newImages,
        imagePreviews: newPreviews,
      }));
    }
    
    validateField('images', product.images);
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
        const totalImageCount = (Array.isArray(value) ? value.length : 0) + product.imagePreviews.length;
        
        // When editing, we don't require new images if there are already previews
        if (isEditing && product.imagePreviews.length >= 2) {
          delete newErrors.images;
        } else if (totalImageCount < 2) {
          newErrors.images = 'Minimum 2 images required';
        } else if (totalImageCount > 8) {
          newErrors.images = 'Maximum 8 images allowed';
        } else {
          delete newErrors.images;
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
      validateField(field, product[field]);
      setTouched({ ...touched, [field]: true });
    });
  
    // Check if there are any errors
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    // Validate the form
    if (!validateForm()) {
      toast.error('Please correct all errors before submitting.');
      setIsSubmitting(false);
      return;
    }
  
    // Check minimum image requirement
    const totalImageCount = product.images.length + product.imagePreviews.length;
    if (totalImageCount < 2) {
      toast.error('Please upload at least 2 images.');
      setIsSubmitting(false);
      return;
    }
  
    try {
      // Create a FormData object
      const formData = new FormData();
  
      // Append product fields
      formData.append('name', product.name);
      formData.append('description', product.description);
      formData.append('price', product.price);
      formData.append('category', product.category);
      formData.append('stockQuantity', product.stockQuantity);
      formData.append('featured', product.featured);
      formData.append('specs', JSON.stringify(product.specs));
      formData.append('discount', JSON.stringify(product.discount));
  
      // If editing, include the _id
      if (isEditing && initialData?._id) {
        formData.append('_id', initialData._id);
        
        // Pass existing image paths if available
        if (initialData.images && initialData.images.length > 0) {
          // If we're editing and have removed some images, create a list of remaining images
          if (product.imagePreviews.length < initialData.images.length) {
            // Find which images to keep based on their URLs
            const keptImages = initialData.images.filter((imgPath, idx) => {
              const fullUrl = imgPath.startsWith('http') 
                ? imgPath 
                : `${import.meta.env.VITE_API_URL}/${imgPath}`;
              
              // Check if this image URL is still in the previews
              return product.imagePreviews.includes(fullUrl);
            });
            
            formData.append('existingImages', JSON.stringify(keptImages));
          } else {
            // Keep all existing images
            formData.append('existingImages', JSON.stringify(initialData.images));
          }
        }
      }
  
      // Append images as binary files (only new images)
      product.images.forEach((file) => {
        formData.append('images', file);
      });
  
      // Log the data being sent
      console.log('Sending product data:', Object.fromEntries(formData));
  
      // Call the parent function to handle the API request
      const response = await onAddProduct(formData);
      
      // Show success notification
      toast.success(isEditing ? 'Product updated successfully!' : 'Product added successfully!');
      
      return response;
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} product. Please try again.`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const MobileForm = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Enter product name"
          className={errors.name && touched.name ? 'border-red-500' : ''}
        />
        {errors.name && touched.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-3">
        <Label htmlFor="description">Description</Label>
        <TextArea
          id="description"
          name="description"
          value={product.description}
          onChange={handleChange}
          className={`h-24 ${errors.description && touched.description ? 'border-red-500' : ''}`}
          placeholder="Enter product description"
        />
        {errors.description && touched.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={product.price}
            onChange={handleChange}
            className={errors.price && touched.price ? 'border-red-500' : ''}
            placeholder="0.00"
          />
          {errors.price && touched.price && <p className="text-xs text-red-500">{errors.price}</p>}
        </div>

        <div className="space-y-3">
          <Label htmlFor="stockQuantity">Stock Quantity</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            value={product.stockQuantity}
            onChange={handleChange}
            className={errors.stockQuantity && touched.stockQuantity ? 'border-red-500' : ''}
            placeholder="0"
          />
          {errors.stockQuantity && touched.stockQuantity && <p className="text-xs text-red-500">{errors.stockQuantity}</p>}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="category">Category</Label>
        <Select
          value={product.category}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className={errors.category && touched.category ? 'border-red-500' : ''}>
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
        {errors.category && touched.category && <p className="text-xs text-red-500">{errors.category}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="featured">Featured Product</Label>
          <Switch 
            id="featured"
            checked={product.featured}
            onCheckedChange={handleFeaturedChange}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="images" className="flex justify-between">
          Product Images
          <span className="text-sm text-gray-500">
            {product.imagePreviews.length}/8 images
          </span>
        </Label>
        <div className={cn(
          "border-2 border-dashed rounded-lg p-4",
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
            <span className="text-sm text-center text-gray-600">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-gray-400">
              PNG, JPG up to 10MB (2-8 images)
            </span>
          </label>
        </div>
        {errors.images && touched.images && (
          <p className="text-xs text-red-500">{errors.images}</p>
        )}

        {/* Image Preview Grid */}
        {(product.imagePreviews.length > 0) && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {product.imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-16 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold">Product Specifications</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="weight">Weight</Label>
            <Input
              id="weight"
              name="weight"
              value={product.specs.weight}
              onChange={handleSpecsChange}
              placeholder="e.g., 500g"
            />
          </div>
          <div>
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              name="dimensions"
              value={product.specs.dimensions}
              onChange={handleSpecsChange}
              placeholder="e.g., 10 x 5 x 2 cm"
            />
          </div>
          <div>
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              name="material"
              value={product.specs.material}
              onChange={handleSpecsChange}
              placeholder="e.g., Stainless Steel"
            />
          </div>
          <div>
            <Label htmlFor="warranty">Warranty</Label>
            <Input
              id="warranty"
              name="warranty"
              value={product.specs.warranty}
              onChange={handleSpecsChange}
              placeholder="e.g., 1 Year Limited"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold">Discount Settings</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="percentage">Discount Percentage (%)</Label>
            <Input
              id="percentage"
              name="percentage"
              type="number"
              min="0"
              max="100"
              value={product.discount.percentage || ''}
              onChange={handleDiscountChange}
              placeholder="e.g., 10"
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={product.discount.startDate || ''}
              onChange={handleDiscountChange}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={product.discount.endDate || ''}
              onChange={handleDiscountChange}
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button 
          type="button" 
          onClick={handleSubmit} 
          className="w-full gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditing ? 'Updating Product...' : 'Adding Product...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Add Product'}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const DesktopForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Form Column */}
      <div className="md:col-span-3 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              value={product.name}
              onChange={handleChange}
              className={errors.name && touched.name ? 'border-red-500' : ''}
              required
            />
            {errors.name && touched.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              name="description"
              value={product.description}
              onChange={handleChange}
              className={`h-32 text-black ${errors.description && touched.description ? 'border-red-500' : ''}`}
              required
            />
            {errors.description && touched.description && <p className="text-xs text-red-500">{errors.description}</p>}
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
                  className={`pl-6 ${errors.price && touched.price ? 'border-red-500' : ''}`}
                  required
                />
                {errors.price && touched.price && <p className="text-xs text-red-500">{errors.price}</p>}
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
                className={errors.stockQuantity && touched.stockQuantity ? 'border-red-500' : ''}
                required
              />
              {errors.stockQuantity && touched.stockQuantity && <p className="text-xs text-red-500">{errors.stockQuantity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={product.category}
                onValueChange={handleCategoryChange}
                required
              >
                <SelectTrigger className={errors.category && touched.category ? 'border-red-500' : ''}>
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
              {errors.category && touched.category && <p className="text-xs text-red-500">{errors.category}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="featured" className="block mb-2">Featured Product</Label>
              <div className="flex items-center h-10">
                <Switch 
                  id="featured"
                  checked={product.featured}
                  onCheckedChange={handleFeaturedChange}
                />
                <span className="ml-2 text-sm text-gray-600">
                  {product.featured ? 'Product will be featured' : 'Not featured'}
                </span>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="images" className="flex justify-between">
              Product Images
              <span className="text-sm text-gray-500">
                {product.imagePreviews.length}/8 images
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
              <p className="text-xs text-red-500">{errors.images}</p>
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

          {/* Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  name="weight"
                  value={product.specs.weight}
                  onChange={handleSpecsChange}
                  placeholder="e.g., 500g"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  name="dimensions"
                  value={product.specs.dimensions}
                  onChange={handleSpecsChange}
                  placeholder="e.g., 10 x 5 x 2 cm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  name="material"
                  value={product.specs.material}
                  onChange={handleSpecsChange}
                  placeholder="e.g., Stainless Steel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty">Warranty</Label>
                <Input
                  id="warranty"
                  name="warranty"
                  value={product.specs.warranty}
                  onChange={handleSpecsChange}
                  placeholder="e.g., 1 Year Limited"
                />
              </div>
            </div>
          </div>

          {/* Discount Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Discount Settings</h3>
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
                {errors.discountPercentage && <p className="text-xs text-red-500">{errors.discountPercentage}</p>}
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
                {errors.discountStartDate && <p className="text-xs text-red-500">{errors.discountStartDate}</p>}
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
                {errors.discountEndDate && <p className="text-xs text-red-500">{errors.discountEndDate}</p>}
              </div>
            </div>
          </div>

          {/* Submit and Preview Buttons */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1 gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating Product...' : 'Adding Product...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Save Changes' : 'Add Product'}
                </>
              )}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" type="button" onClick={() => setShowDetailedPreview(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Product Preview</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full">
                  <div className="p-4">
                    {/* Product Preview Content */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Preview Image */}
                        <div className="md:w-1/3">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {product.imagePreviews.length > 0 ? (
                              <img
                                src={product.imagePreviews[0]}
                                alt={product.name || 'Product preview'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                          {product.imagePreviews.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {product.imagePreviews.slice(0, 4).map((preview, idx) => (
                                <div key={idx} className="aspect-square rounded overflow-hidden">
                                  <img
                                    src={preview}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="md:w-2/3">
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {product.name || 'Product Name'}
                          </h2>
                          
                          <div className="flex items-center space-x-2 mb-4">
                            <span className="text-xl font-bold text-gray-900">
                              ${parseFloat(product.price || 0).toFixed(2)}
                            </span>
                            {product.discount.percentage && (
                              <Badge className="bg-red-500">
                                {product.discount.percentage}% OFF
                              </Badge>
                            )}
                            {product.featured && (
                              <Badge className="bg-blue-500">Featured</Badge>
                            )}
                          </div>
                          
                          <div className="mb-4">
                            <Badge variant="outline">{product.category || 'Category'}</Badge>
                          </div>
                          
                          <p className="text-gray-700 mb-6">
                            {product.description || 'Product description will appear here.'}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700">Weight</h3>
                              <p className="text-gray-600">{product.specs.weight || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700">Dimensions</h3>
                              <p className="text-gray-600">{product.specs.dimensions || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700">Material</h3>
                              <p className="text-gray-600">{product.specs.material || 'N/A'}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700">Warranty</h3>
                              <p className="text-gray-600">{product.specs.warranty || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                              Stock: {product.stockQuantity || '0'} units
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Heart className="h-4 w-4 mr-1" />
                                Wishlist
                              </Button>
                              <Button size="sm">
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </div>

      {/* Quick Preview Card */}
      <div className="md:col-span-2">
        <Card>
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
                {product.featured && (
                  <span className="inline-block bg-blue-100 px-2 py-1 rounded-full text-sm text-blue-600">
                    Featured
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <MobileForm />
      ) : (
        <DesktopForm />
      )}
    </>
  );
};

export default ProductForm;