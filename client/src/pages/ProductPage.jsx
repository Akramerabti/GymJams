import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { formatCurrency } from '@/utils/formatters';
import productService from '@/services/product.service';

const constructImageUrl = (path) => {
  if (!path) return '/placeholder-image.jpg';
  return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}${path}`;
};

const ProductPage = ({ isPreview = false }) => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlist, setIsWishlist] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log('productId:', productId);
        const productData = await productService.getProduct(productId);
        setProduct(productData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">Error loading product: {error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Product not found.</p>
      </div>
    );
  }

  const productImages = [
    ...(product.imageUrls || []).map((url) => constructImageUrl(url)),
    constructImageUrl(product.imageUrl),
  ].filter(Boolean);

  if (productImages.length === 0) {
    productImages.push('/placeholder-image.jpg');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {!isPreview && (
          <div className="hidden md:flex mb-6 items-center text-sm text-gray-500">
            <button onClick={() => window.history.back()} className="flex items-center hover:text-gray-700">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
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

          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${star <= (product.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill={star <= (product.averageRating || 0) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product.ratings?.length || 0} reviews)</span>
            </div>

            <p className="text-gray-700">{product.description}</p>

            <div className="space-y-4">
              <div className="text-2xl font-bold">
                {product.discount && product.discount.percentage ? (
                  <>
                    <span className="text-red-500">{formatCurrency(product.price * (1 - product.discount.percentage / 100))}</span>
                    <span className="text-gray-500 line-through ml-2">{formatCurrency(product.price)}</span>
                  </>
                ) : (
                  <span>{formatCurrency(product.price)}</span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <Button className="flex-1" onClick={() => alert('Added to cart')}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={() => setIsWishlist(!isWishlist)}>
                  <Heart className={`h-5 w-5 ${isWishlist ? 'text-red-500 fill-current' : ''}`} />
                </Button>
                <Button variant="outline" onClick={() => alert('Shared')}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Truck className="h-5 w-5" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RefreshCw className="h-5 w-5" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-5 w-5" />
                <span>2-year warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;