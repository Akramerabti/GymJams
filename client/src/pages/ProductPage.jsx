// components/ProductPage.js
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
import { useAuth } from '@/stores/authStore';
import  useCartStore from '@/stores/cartStore';

const constructImageUrl = (path) => {
  if (!path) return null;
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
  const [showCopied, setShowCopied] = useState(false);
  const { user, logout, checkAuth } = useAuth();
  const cartStore = useCartStore();

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

  const handleWishlistClick = async () => {
    if (user) {
      setIsWishlist(!isWishlist);
      try {
        await productService.toggleWishlist(user._id, product._id);
      } catch (err) {
        console.error('Error toggling wishlist:', err);
      }
    } else {
      // Redirect to login page or show a login modal
      console.log('User is not logged in');
    }
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  const handleReviewSubmit = async (rating) => {
    if (user) {
      try {
        await productService.addReview(user._id, product._id, rating);
        const updatedProduct = await productService.getProduct(productId);
        setProduct(updatedProduct);
      } catch (err) {
        console.error('Error submitting review:', err);
      }
    } else {
      // Redirect to login page or show a login modal
      console.log('User is not logged in');
    }
  };

  const handleAddToCartClick = async () => {
    await cartStore.addItem({ ...product, id: product._id }, quantity);
    alert('Added to cart');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {!isPreview && (
          <div className="flex mb-4 md:mb-6 items-center text-sm text-gray-500">
            <button onClick={() => window.history.back()} className="flex items-center hover:text-gray-700">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
          {productImages.length > 0 && (
            <div className="flex-1 space-y-4 mt-4 -mx-4 md:mx-0 h-[70vh] md:h-auto">
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
          )}

          <div className="flex-1 space-y-6">
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
                <Button className="flex-1" onClick={handleAddToCartClick}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={handleWishlistClick}>
                  <Heart className={`h-5 w-5 ${isWishlist ? 'text-red-500 fill-current' : ''}`} />
                </Button>
                <Button variant="outline" onClick={handleShareClick}>
                  <Share2 className="h-5 w-5" />
                  {showCopied && <span className="ml-2">Copied</span>}
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

            {user && (
              <div className="mt-6">
                <h2 className="text-xl font-bold">Leave a Review</h2>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 cursor-pointer ${star <= (product.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill={star <= (product.averageRating || 0) ? 'currentColor' : 'none'}
                      onClick={() => handleReviewSubmit(star)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;