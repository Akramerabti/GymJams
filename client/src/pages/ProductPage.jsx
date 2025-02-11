import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Heart,
  Share2,
  Star,
  Truck,
  RefreshCw,
  Shield,
  ChevronLeft,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const ProductPage = ({ product, isPreview = false }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);

  // Handle both URL strings and image preview URLs
  const productImages = [
    ...(product.imagePreviews || []), // Handle preview images from form
    ...(product.images || []).map(img => img.url || img), // Handle stored images
    product.imageUrl, // Handle single image fallback
  ].filter(Boolean); // Remove any undefined/null values
  
  // Ensure we have at least one image
  if (productImages.length === 0) {
    productImages.push('/api/placeholder/400/400');
  }

  const features = [
    { icon: <Truck className="h-5 w-5" />, text: "Free shipping on orders over $50" },
    { icon: <RefreshCw className="h-5 w-5" />, text: "30-day return policy" },
    { icon: <Shield className="h-5 w-5" />, text: "2-year warranty" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Breadcrumb - Hidden on mobile */}
        {!isPreview && (
          <div className="hidden md:flex mb-6 items-center text-sm text-gray-500">
            <button onClick={() => window.history.back()} className="flex items-center hover:text-gray-700">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}

        {/* Main product grid - Image takes more space on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12" style={{ gridTemplateRows: 'auto minmax(0, 1fr)' }}>
          {/* Product Images - Much larger on mobile */}
          <div className="space-y-4 -mx-4 md:mx-0 h-[70vh] md:h-auto">
            <Carousel className="w-full relative">
              <CarouselContent>
                {productImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative">
                      <img
                        src={image}
                        alt={`${product.name} - View ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {productImages.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <CarouselNext className="absolute right-4 top-1/2 transform -translate-y-1/2" />
                </>
              )}
            </Carousel>
          </div>

          {/* Product Info - Compact on mobile */}
          <div className="space-y-4 md:space-y-6 px-4 md:px-0">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-xs md:text-sm text-gray-500">128 reviews</span>
              </div>
            </div>

            <div className="space-y-2 md:space-y-4">
              <p className="text-2xl md:text-3xl font-bold text-gray-900">${product.price}</p>
              <p className="text-xs md:text-sm text-green-600">In stock</p>
            </div>

            <div className="prose prose-sm text-gray-500 text-sm md:text-base">
              <p>{product.description}</p>
            </div>

            {/* Size Selector - Compact on mobile */}
            {product.sizes && (
              <div className="space-y-2 md:space-y-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                      className="w-10 h-10 md:w-12 md:h-12 text-sm"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector - Compact on mobile */}
            <div className="space-y-2 md:space-y-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 md:h-12"
                >
                  -
                </Button>
                <span className="w-12 text-center text-sm md:text-base">{quantity}</span>
                <Button
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 md:h-12"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons - Full width on mobile */}
            <div className="flex gap-2 md:gap-4 mt-4">
              <Button className="flex-1 h-10 md:h-12 text-sm md:text-base">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center"
                onClick={() => setIsWishlist(!isWishlist)}
              >
                <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isWishlist ? 'fill-current text-red-500' : ''}`} />
              </Button>
              <Button
                variant="outline"
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center"
              >
                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Features - Grid on mobile */}
            <div className="border-t pt-4 md:pt-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    {feature.icon}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;