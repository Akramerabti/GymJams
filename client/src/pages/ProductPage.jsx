import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { 
  ChevronLeft, 
  ShoppingCart, 
  Heart,
  Share2,
  Star,
  Truck,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const ProductPage = () => {
  const { productId } = useParams();
  const { product, loading, error } = useProduct(productId);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-red-500">Error: {error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const productImages = [
    product.imageUrl,
    // Add more images here if available
  ];

  const features = [
    { icon: <Truck className="h-5 w-5" />, text: "Free shipping on orders over $50" },
    { icon: <RefreshCw className="h-5 w-5" />, text: "30-day return policy" },
    { icon: <Shield className="h-5 w-5" />, text: "2-year warranty" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center text-sm text-gray-500">
          <button onClick={() => window.history.back()} className="flex items-center hover:text-gray-700">
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <Carousel className="w-full">
              <CarouselContent>
                {productImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative">
                      <img
                        src={image}
                        alt={`${product.name} - View ${index + 1}`}
                        className="rounded-lg object-cover w-full h-full"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-500">128 reviews</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-3xl font-bold text-gray-900">${product.price}</p>
              <p className="text-sm text-green-600">In stock</p>
            </div>

            <div className="prose prose-sm text-gray-500">
              <p>{product.description}</p>
            </div>

            {/* Size Selector */}
            {product.sizes && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                      className="w-12 h-12"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button className="flex-1 h-12">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                className="w-12 h-12 flex items-center justify-center"
                onClick={() => setIsWishlist(!isWishlist)}
              >
                <Heart className={`h-5 w-5 ${isWishlist ? 'fill-current text-red-500' : ''}`} />
              </Button>
              <Button
                variant="outline"
                className="w-12 h-12 flex items-center justify-center"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
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