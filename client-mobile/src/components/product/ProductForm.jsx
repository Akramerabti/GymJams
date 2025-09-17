import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TextArea from "@/components/ui/TextArea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/Switch";
import { Eye, Heart, Badge, ShoppingCart, Upload, Image as ImageIcon, Smartphone, Monitor, X, Save, ArrowLeft, Loader2, Plus, Trash, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { useMediaQuery } from "react-responsive";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { format } from 'date-fns';

// Predefined colors
const PREDEFINED_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Brown', hex: '#A52A2A' },
];

// Color Selector Component
const ColorSelector = ({ selectedColors, onColorsChange, touched, error }) => {
  const [customColor, setCustomColor] = useState('');

  const handleColorToggle = (color) => {
    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter(c => c !== color));
    } else {
      onColorsChange([...selectedColors, color]);
    }
  };

  const handleAddCustomColor = () => {
    if (customColor && !selectedColors.includes(customColor)) {
      onColorsChange([...selectedColors, customColor]);
      setCustomColor('');
    }
  };

  const removeColor = (color) => {
    onColorsChange(selectedColors.filter(c => c !== color));
  };

  return (
    <div className="space-y-3">
      <Label>Available Colors</Label>
      <div className="grid grid-cols-6 gap-2">
        {PREDEFINED_COLORS.map(({ name, hex }) => (
          <button
            key={name}
            type="button"
            onClick={() => handleColorToggle(name)}
            className={cn(
              "relative w-full aspect-square rounded-lg border-2 transition-all",
              selectedColors.includes(name) 
                ? "border-blue-500 ring-2 ring-blue-200" 
                : "border-gray-300 hover:border-gray-400"
            )}
            title={name}
          >
            <div 
              className="absolute inset-1 rounded-md"
              style={{ backgroundColor: hex }}
            />
            {selectedColors.includes(name) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full p-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-blue-500">
                    <path d="M13.354 4.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L6 11.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add custom color (e.g., Teal, Maroon)"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomColor())}
          className="flex-1"
        />
        <Button 
          type="button" 
          size="sm"
          onClick={handleAddCustomColor}
          disabled={!customColor}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedColors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedColors.map(color => (
            <div
              key={color}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span>{color}</span>
              <button
                type="button"
                onClick={() => removeColor(color)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {error && touched && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

// Mobile Form Component
const MobileForm = ({
  product,
  errors,
  touched,
  categories,
  isSubmitting,
  isEditing,
  handleChange,
  handleDiscountChange,
  handleSpecsChange,
  handleFeaturedChange,
  handlePreOrderChange,
  handleImageChange,
  removeImage,
  handleCategoryChange,
  handleGenderChange,
  handleColorsChange,
  assignColorToImage,
  handleSubmit,
  setShowDetailedPreview
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  return (
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
        {errors.name && touched.name && (
          <p className="text-xs text-red-500">{errors.name}</p>
        )}
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

      {/* Gender selector for Clothes */}
      {product.category === 'Clothes' && (
        <div className="space-y-3">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={product.gender || ''}
            onValueChange={handleGenderChange}
          >
            <SelectTrigger className={errors.gender && touched.gender ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select gender category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Men">Men</SelectItem>
              <SelectItem value="Women">Women</SelectItem>
              <SelectItem value="Unisex">Unisex</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && touched.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
        </div>
      )}

      {/* Color Selector */}
      <ColorSelector
        selectedColors={product.colors}
        onColorsChange={handleColorsChange}
        touched={touched.colors}
        error={errors.colors}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="featured">Featured Product</Label>
          <Switch 
            id="featured"
            checked={product.featured}
            onCheckedChange={handleFeaturedChange}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <Label htmlFor="preOrder">Pre-order Product</Label>
          <Switch
            id="preOrder"
            checked={product.preOrder}
            onCheckedChange={handlePreOrderChange}
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

        {/* Image Preview Grid with Color Assignment */}
        {product.imagePreviews.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Tap an image to assign it to a color</p>
            <div className="grid grid-cols-4 gap-2">
              {product.imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview.url || preview}
                    alt={`Preview ${index + 1}`}
                    className={cn(
                      "w-full h-16 object-cover rounded-lg cursor-pointer",
                      selectedImageIndex === index ? "ring-2 ring-blue-500" : ""
                    )}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {preview.color && (
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                      {preview.color}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedImageIndex !== null && product.colors.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">
                  Assign color to image {selectedImageIndex + 1}:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      assignColorToImage(selectedImageIndex, null);
                      setSelectedImageIndex(null);
                    }}
                    className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                  >
                    No specific color
                  </button>
                  {product.colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        assignColorToImage(selectedImageIndex, color);
                        setSelectedImageIndex(null);
                      }}
                      className={cn(
                        "px-2 py-1 rounded text-xs",
                        product.imagePreviews[selectedImageIndex]?.color === color
                          ? "bg-blue-500 text-white"
                          : "bg-white border border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
};

// Desktop Form Component
const DesktopForm = ({
  product,
  errors,
  touched,
  categories,
  isSubmitting,
  isEditing,
  handleChange,
  handleDiscountChange,
  handleSpecsChange,
  handleFeaturedChange,
  handlePreOrderChange,
  handleImageChange,
  removeImage,
  handleCategoryChange,
  handleGenderChange,
  handleColorsChange,
  assignColorToImage,
  handleSubmit,
  setShowDetailedPreview
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  return (
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
              {product.category === 'Clothes' ? (
                <>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={product.gender || ''}
                    onValueChange={handleGenderChange}
                    required
                  >
                    <SelectTrigger className={errors.gender && touched.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select gender category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Men">Men</SelectItem>
                      <SelectItem value="Women">Women</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && touched.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                </>
              ) : (
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
                  <div className="flex items-center h-10 mt-2">
                    <Switch
                      id="preOrder"
                      checked={product.preOrder}
                      onCheckedChange={handlePreOrderChange}
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {product.preOrder ? 'Pre-order enabled' : 'Not a pre-order'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Show toggles below if Clothes category is selected */}
          {product.category === 'Clothes' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="featured"
                  checked={product.featured}
                  onCheckedChange={handleFeaturedChange}
                />
                <Label htmlFor="featured">Featured Product</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="preOrder"
                  checked={product.preOrder}
                  onCheckedChange={handlePreOrderChange}
                />
                <Label htmlFor="preOrder">Pre-order Product</Label>
              </div>
            </div>
          )}

          {/* Color Selector */}
          <ColorSelector
            selectedColors={product.colors}
            onColorsChange={handleColorsChange}
            touched={touched.colors}
            error={errors.colors}
          />

          {/* Image Upload Section with Color Assignment */}
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

            {/* Image Preview Grid with Color Assignment */}
            {product.imagePreviews.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Click on an image to assign it to a specific color variant
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {product.imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url || preview}
                        alt={`Preview ${index + 1}`}
                        className={cn(
                          "w-full h-24 object-cover rounded-lg cursor-pointer transition-all",
                          selectedImageIndex === index 
                            ? "ring-2 ring-blue-500" 
                            : "hover:ring-2 hover:ring-gray-300"
                        )}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {preview.color && (
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {preview.color}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedImageIndex !== null && product.colors.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Assign color to image {selectedImageIndex + 1}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          assignColorToImage(selectedImageIndex, null);
                          setSelectedImageIndex(null);
                        }}
                        className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                      >
                        No specific color
                      </button>
                      {product.colors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            assignColorToImage(selectedImageIndex, color);
                            setSelectedImageIndex(null);
                          }}
                          className={cn(
                            "px-3 py-1 rounded text-sm transition-colors",
                            product.imagePreviews[selectedImageIndex]?.color === color
                              ? "bg-blue-500 text-white"
                              : "bg-white border border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                                src={product.imagePreviews[0].url || product.imagePreviews[0]}
                                alt={product.name || 'Product preview'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Color swatches in preview */}
                          {product.colors.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Available Colors:</p>
                              <div className="flex gap-2 flex-wrap">
                                {product.colors.map(color => {
                                  const colorInfo = PREDEFINED_COLORS.find(c => c.name === color);
                                  return (
                                    <div
                                      key={color}
                                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                                      style={{ 
                                        backgroundColor: colorInfo?.hex || '#ccc',
                                      }}
                                      title={color}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="md:w-2/3">
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {product.name || 'Product Name'}
                          </h2>
                          
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xl font-bold text-gray-900">
                              ${parseFloat(product.price || 0).toFixed(2)}
                            </span>
                            {product.discount.percentage && (
                              <Badge className="bg-red-500">
                                {product.discount.percentage}% OFF
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-2 mb-4">
                            <Badge variant="outline">{product.category || 'Category'}</Badge>
                            {product.category === 'Clothes' && product.gender && (
                              <Badge variant="outline" className="bg-purple-50">
                                {product.gender}
                              </Badge>
                            )}
                            {product.featured && (
                              <span className="inline-block bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-600">
                                Featured
                              </span>
                            )}
                            {product.preOrder && (
                              <span className="inline-block bg-yellow-100 px-3 py-1 rounded-full text-sm text-yellow-600">
                                Pre-order
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 mb-6">
                            {product.description || 'Product description will appear here.'}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            {product.specs.weight && (
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700">Weight</h3>
                                <p className="text-gray-600">{product.specs.weight}</p>
                              </div>
                            )}
                            {product.specs.dimensions && (
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700">Dimensions</h3>
                                <p className="text-gray-600">{product.specs.dimensions}</p>
                              </div>
                            )}
                            {product.specs.material && (
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700">Material</h3>
                                <p className="text-gray-600">{product.specs.material}</p>
                              </div>
                            )}
                            {product.specs.warranty && (
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700">Warranty</h3>
                                <p className="text-gray-600">{product.specs.warranty}</p>
                              </div>
                            )}
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
                  src={product.imagePreviews[0].url || product.imagePreviews[0]}
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
                {product.category === 'Clothes' && product.gender && (
                  <span className="inline-block bg-purple-100 px-2 py-1 ml-2 rounded-full text-sm text-purple-600">
                    {product.gender}
                  </span>
                )}
                {product.discount.percentage && (
                  <span className="inline-block bg-green-100 px-2 py-1 rounded-full text-sm text-green-600">
                    {product.discount.percentage}% off
                  </span>
                )}
                {product.colors.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {product.colors.slice(0, 5).map(color => {
                      const colorInfo = PREDEFINED_COLORS.find(c => c.name === color);
                      return (
                        <div
                          key={color}
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: colorInfo?.hex || '#ccc' }}
                          title={color}
                        />
                      );
                    })}
                    {product.colors.length > 5 && (
                      <span className="text-xs text-gray-500 ml-1">+{product.colors.length - 5}</span>
                    )}
                  </div>
                )}
                {product.featured && (
                  <span className="inline-block bg-blue-100 ml-2 px-3 py-1 rounded-full text-sm text-blue-600">
                    Featured
                  </span>
                )}
                {product.preOrder && (
                  <span className="inline-block bg-yellow-100 px-3 py-1 ml-2 rounded-full text-sm text-yellow-600">
                    Pre-order
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main ProductForm Component
const ProductForm = ({ categories, onAddProduct, initialData = null, isEditing = false }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [product, setProduct] = useState({
    name: '', 
    description: '', 
    price: '', 
    category: '', 
    stockQuantity: '',
    colors: [],
    gender: null,
    images: [], 
    imagePreviews: [], 
    featured: false, 
    preOrder: false,
    specs: { weight: '', dimensions: '', material: '', warranty: '' },
    discount: { percentage: '', startDate: '', endDate: '' },
  });

  const [showDetailedPreview, setShowDetailedPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImageCount, setExistingImageCount] = useState(0);

  useEffect(() => {
    if (initialData && isEditing) {
      let formattedDiscount = { 
        percentage: initialData.discount?.percentage || '',
        startDate: initialData.discount?.startDate ? format(new Date(initialData.discount.startDate), 'yyyy-MM-dd') : '',
        endDate: initialData.discount?.endDate ? format(new Date(initialData.discount.endDate), 'yyyy-MM-dd') : ''
      };

      const existingImages = Array.isArray(initialData.imageUrls) ? initialData.imageUrls : (Array.isArray(initialData.images) ? initialData.images : []);
      setExistingImageCount(existingImages.length);
      
      const imagePreviews = existingImages.map(image => {
        if (typeof image === 'object' && image.url) {
          return image; // Already has the correct structure
        }
        if (typeof image === 'string' && image.startsWith('http')) {
          return { url: image, color: null };
        }
        if (typeof image === 'string') {
          const apiUrl = import.meta.env.VITE_API_URL;
          return { url: `${apiUrl.replace(/\/$/, '')}/${image.replace(/^\//, '')}`, color: null };
        }
        // Fallback for non-string, non-object values
        return { url: '', color: null };
      });

      setProduct({
        ...initialData,
        price: initialData.price.toString(),
        stockQuantity: initialData.stockQuantity.toString(),
        colors: initialData.colors || [],
        gender: initialData.gender || null,
        discount: formattedDiscount,
        imagePreviews,
        images: [],
        specs: {
          weight: initialData.specs?.weight || '',
          dimensions: initialData.specs?.dimensions || '',
          material: initialData.specs?.material || '',
          warranty: initialData.specs?.warranty || '',
        }
      });
    }
  }, [initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleCategoryChange = (value) => {
    setProduct(prev => ({ 
      ...prev, 
      category: value,
      // Reset gender if not Clothes
      gender: value === 'Clothes' ? prev.gender : null 
    }));
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleGenderChange = (value) => {
    setProduct(prev => ({ ...prev, gender: value }));
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  const handleColorsChange = (colors) => {
    setProduct(prev => ({ ...prev, colors }));
    setTouched(prev => ({ ...prev, colors: true }));
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

  const handlePreOrderChange = (checked) => {
    setProduct({ ...product, preOrder: checked });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const totalImages = product.images.length + product.imagePreviews.length + files.length;
  
    if (totalImages > 8) {
      setErrors({ ...errors, images: 'Maximum 8 images allowed' });
      toast.error('Maximum 8 images allowed');
      return;
    }
  
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      color: null,
      file: file
    }));
  
    setProduct(prev => ({
      ...prev,
      images: [...prev.images, ...files],
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }));
    
    setTouched({ ...touched, images: true });
    validateField('images', [...product.images, ...files]);
  };

  const removeImage = (index) => {
    if (index < existingImageCount) {
      const newImagePreviews = [...product.imagePreviews];
      newImagePreviews.splice(index, 1);
      
      setExistingImageCount(prev => prev - 1);
      setProduct(prev => ({
        ...prev,
        imagePreviews: newImagePreviews,
      }));
    } else {
      const adjustedIndex = index - existingImageCount;
      const newImages = [...product.images];
      const newPreviews = [...product.imagePreviews];
      
      if (newPreviews[index]?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(newPreviews[index].url);
      }
      
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

  const assignColorToImage = (imageIndex, color) => {
    const newPreviews = [...product.imagePreviews];
    newPreviews[imageIndex] = {
      ...newPreviews[imageIndex],
      color: color
    };
    setProduct(prev => ({
      ...prev,
      imagePreviews: newPreviews
    }));
  };

  const validateField = (name, value) => {
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };

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
          const totalImageCount = (Array.isArray(value) ? value.length : 0) + (isEditing ? existingImageCount : 0);

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
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!product.name) newErrors.name = 'Product name is required';
    if (!product.description) newErrors.description = 'Description is required';
    if (!product.price || isNaN(product.price) || product.price <= 0) newErrors.price = 'Price must be a valid number greater than 0';
    if (!product.category) newErrors.category = 'Category is required';
    if (product.category === 'Clothes' && !product.gender) {
      newErrors.gender = 'Gender selection is required for clothing';
    }
    if (!product.stockQuantity || isNaN(product.stockQuantity) || product.stockQuantity < 0) newErrors.stockQuantity = 'Stock must be a valid number 0 or greater';
    const totalImageCount = product.images.length + product.imagePreviews.length;
    if (totalImageCount < 2) newErrors.images = 'Minimum 2 images required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ 
      name: true, 
      description: true, 
      price: true, 
      category: true, 
      stockQuantity: true, 
      images: true,
      gender: product.category === 'Clothes',
      colors: true 
    });
    
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please correct all errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Basic fields
      Object.keys(product).forEach(key => {
        if (key === 'images') {
          product.images.forEach(file => formData.append('images', file));
        } else if (key === 'specs' || key === 'discount') {
          formData.append(key, JSON.stringify(product[key]));
        } else if (key === 'colors') {
          formData.append('colors', JSON.stringify(product.colors));
        } else if (key === 'gender' && product.category === 'Clothes') {
          formData.append('gender', product.gender);
        } else if (key === 'ratings') {
          formData.append('ratings', JSON.stringify(product[key]));
        } else if (key !== 'imagePreviews') {
          formData.append(key, product[key]);
        }
      });

      // Handle image color associations
      const imageColorAssociations = [];
      product.imagePreviews.forEach((preview, index) => {
        if (preview.color && index >= existingImageCount) {
          imageColorAssociations.push({
            index: index - existingImageCount,
            color: preview.color
          });
        }
      });
      formData.append('imageColorAssociations', JSON.stringify(imageColorAssociations));

      if (isEditing && initialData?._id) {
        formData.append('_id', initialData._id);
        const existingImagesFromPreviews = product.imagePreviews
          .slice(0, existingImageCount)
          .map(preview => {
            if (typeof preview === 'object' && preview.url) {
              return { url: preview.url, color: preview.color };
            }
            return { url: preview, color: null };
          });
        formData.append('existingImages', JSON.stringify(existingImagesFromPreviews));
      }

      await onAddProduct(formData);
      toast.success(isEditing ? 'Product updated successfully!' : 'Product added successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} product.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formProps = {
    product,
    errors,
    touched,
    categories,
    isSubmitting,
    isEditing,
    handleChange,
    handleDiscountChange,
    handleSpecsChange,
    handleFeaturedChange,
    handlePreOrderChange,
    handleImageChange,
    removeImage,
    handleCategoryChange,
    handleGenderChange,
    handleColorsChange,
    assignColorToImage,
    handleSubmit,
    setShowDetailedPreview,
  };

  return (
    <>
      {isMobile ? <MobileForm {...formProps} /> : <DesktopForm {...formProps} />}
    </>
  );
};

export default ProductForm;