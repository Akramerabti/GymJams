import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Percent, Search, Tag, Clock, CheckCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const PromotionForm = ({ products = [], onApplyPromotion, selectedProductId = null }) => {
  const [formState, setFormState] = useState({
    productId: '',
    percentage: 10,
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filter products by search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Common date formatter
  const formatDate = (date) => {
    return format(date, 'PPP');
  };

  // Initialize with selectedProductId if provided
  useEffect(() => {
    if (selectedProductId) {
      setFormState(prev => ({ ...prev, productId: selectedProductId }));
      const product = products.find(p => p._id === selectedProductId);
      if (product) {
        setSelectedProduct(product);
        setIsPreviewVisible(true);
      }
    }
  }, [selectedProductId, products]);

  // Update selected product when productId changes
  useEffect(() => {
    if (formState.productId) {
      const product = products.find(p => p._id === formState.productId);
      setSelectedProduct(product || null);
      setIsPreviewVisible(!!product);
    } else {
      setSelectedProduct(null);
      setIsPreviewVisible(false);
    }
  }, [formState.productId, products]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyPromotion(formState.productId, {
      percentage: parseInt(formState.percentage),
      startDate: formState.startDate.toISOString(),
      endDate: formState.endDate.toISOString(),
    });
    
    // Reset form
    setFormState({
      productId: '',
      percentage: 10,
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
    });
    setSelectedProduct(null);
    setIsPreviewVisible(false);
  };

  const handleProductSelect = (productId) => {
    setFormState({ ...formState, productId });
    setIsProductPopoverOpen(false);
  };

  const handlePercentageChange = (value) => {
    // Ensure percentage is between 1 and 99
    let percentage = parseInt(value);
    if (isNaN(percentage)) percentage = 0;
    if (percentage < 0) percentage = 0;
    if (percentage > 99) percentage = 99;
    
    setFormState({ ...formState, percentage });
  };

  // Calculate discounted price for preview
  const getDiscountedPrice = () => {
    if (!selectedProduct) return 0;
    const discount = formState.percentage / 100;
    return selectedProduct.price * (1 - discount);
  };

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Form Column */}
      <div className="md:col-span-3 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product-select">Select Product</Label>
            <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isProductPopoverOpen}
                  className="w-full justify-between"
                >
                  {selectedProduct ? selectedProduct.name : "Select a product..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search products..." 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>No products found.</CommandEmpty>
                    <CommandGroup>
                      {filteredProducts.map((product) => (
                        <CommandItem
                          key={product._id}
                          value={product._id}
                          onSelect={() => handleProductSelect(product._id)}
                        >
                          <div className="flex items-center">
                            {/* Product thumbnail */}
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}/${product.images[0]}`}
                                alt={product.name}
                                className="w-8 h-8 object-cover rounded mr-2"
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.jpg';
                                  e.target.onerror = null;
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center mr-2">
                                <Tag className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Product name and price */}
                            <div className="flex-1">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                            
                            {/* Check icon if selected */}
                            {product._id === formState.productId && (
                              <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Discount Percentage */}
          <div className="space-y-2">
            <Label htmlFor="percentage">Discount Percentage (%)</Label>
            <div className="relative">
              <Percent className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="percentage"
                type="number"
                min="1"
                max="99"
                value={formState.percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <input
              type="range"
              min="1"
              max="99"
              value={formState.percentage}
              onChange={(e) => handlePercentageChange(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>99%</span>
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(formState.startDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formState.startDate}
                    onSelect={(date) => date && setFormState({ ...formState, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(formState.endDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formState.endDate}
                    onSelect={(date) => date && setFormState({ ...formState, endDate: date })}
                    initialFocus
                    disabled={(date) => date < formState.startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Duration Shortcuts */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => setFormState({
                ...formState,
                startDate: new Date(),
                endDate: addDays(new Date(), 7)
              })}
            >
              <Clock className="h-3 w-3 mr-1" />
              1 Week
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => setFormState({
                ...formState,
                startDate: new Date(),
                endDate: addDays(new Date(), 14)
              })}
            >
              <Clock className="h-3 w-3 mr-1" />
              2 Weeks
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => setFormState({
                ...formState,
                startDate: new Date(),
                endDate: addDays(new Date(), 30)
              })}
            >
              <Clock className="h-3 w-3 mr-1" />
              1 Month
            </Badge>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!formState.productId || formState.percentage <= 0}
          >
            Apply Promotion
          </Button>
        </form>
      </div>

      {/* Preview Column */}
      <div className="md:col-span-2">
        <div className="sticky top-4">
          <h3 className="font-medium text-gray-900 mb-4">Promotion Preview</h3>
          
          {isPreviewVisible && selectedProduct ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  {/* Product Image */}
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}/${selectedProduct.images[0]}`}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                          e.target.onerror = null;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <h4 className="font-medium mt-2">{selectedProduct.name}</h4>
                  <Badge className="mt-1">{selectedProduct.category}</Badge>
                </div>
                
                {/* Pricing Info */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500">Original Price:</span>
                    <span className="font-medium">{formatPrice(selectedProduct.price)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500">Discount:</span>
                    <span className="text-green-600 font-medium">{formState.percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="font-medium">New Price:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(getDiscountedPrice())}
                    </span>
                  </div>
                </div>
                
                {/* Promotion Period */}
                <div className="mt-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>
                      Active from {formatDate(formState.startDate)} to {formatDate(formState.endDate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500 py-12">
                <Tag className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>Select a product and set discount details to see a preview</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionForm;