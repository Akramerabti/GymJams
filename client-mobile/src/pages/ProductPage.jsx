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
  Check
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
import useCartStore from '@/stores/cartStore';
import { motion, AnimatePresence } from 'framer-motion';

const constructImageUrl = (path) => {
  if (!path) return null;
  
  // If it's already a full URL (including Supabase URLs), return as is
  if (path.startsWith('http')) {
    return path;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
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
  const [isAdded, setIsAdded] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(null);
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { user, logout, checkAuth } = useAuth();
  const cartStore = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        //('productId:', productId);
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
      <div className="min-h-screen flex items-center justify-center mt-10">
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
        await productService.toggleWishlist(user.user.id || user.id, product.id);
      } catch (err) {
        console.error('Error toggling wishlist:', err);
      }
    } else {
      setShowLoginDialog(true);
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
     
      const userId = user.user.id || user.id;
      const alreadyRated = product.ratedBy && product.ratedBy.includes(userId);
      try {
        await productService.addReview(product.id, { userId, rating });
        const updatedProduct = await productService.getProduct(productId);
        setProduct(updatedProduct);
      } catch (err) {
        console.error('Error submitting review:', err);
      }
    } else {
      setShowLoginDialog(true);
    }
  };

  const handleAddToCartClick = async () => {
    // Create a product object with the required properties
    const productToAdd = { 
      ...product, 
      id: product.id,
      quantity: quantity
    };
    
    // Add the item to the cart
    await cartStore.addItem(productToAdd, quantity);
    
    // Show the animation
    setIsAdded(true);
    
    // Reset after animation
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-25">
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
                    className={`h-5 w-5 cursor-pointer ${star <= (hoveredRating !== null ? hoveredRating : (product.averageRating || 0)) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill={star <= (hoveredRating !== null ? hoveredRating : (product.averageRating || 0)) ? 'currentColor' : 'none'}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => {
                      if (user) {
                        handleReviewSubmit(star);
                        setShowReviewSuccess(true);
                        setTimeout(() => setShowReviewSuccess(false), 2000);
                      } else {
                        setShowLoginDialog(true);
                      }
                    }}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-500">{hoveredRating !== null ? `${hoveredRating} / 5` : `${product.averageRating || 0} / 5`}</span>

              </div>
              <span className="text-sm text-gray-500">({product.ratings?.length || 0} reviews)</span>
              {showReviewSuccess && (
                <div className="text-green-600 text-sm ml-2">Review added!</div>
              )}
              {showLoginDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-80 flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-2">Login Required</h3>
                    <p className="text-gray-600 mb-4">You must be logged in to perform this action.</p>
                    <Button onClick={() => window.location.href = '/login'} className="w-full mb-2">Login</Button>
                    <Button variant="outline" onClick={() => setShowLoginDialog(false)} className="w-full">Nevermind</Button>
                  </div>
                </div>
              )}
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
                <motion.button
                  className={`flex-1 flex items-center justify-center px-4 py-2 font-medium text-white rounded-md ${isAdded ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  whileTap={{ scale: 0.95 }}
                  disabled={isAdded}
                  onClick={handleAddToCartClick}
                >
                  <AnimatePresence mode="wait">
                    {isAdded ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90, opacity: 0 }}
                        animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.3, type: "spring" }}
                        className="flex items-center justify-center"
                      >
                        <Check className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="cart"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        <span>Add to Cart</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
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
                <span>Free shipping on orders over $150</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RefreshCw className="h-5 w-5" />
                <span>30-day return policy</span>
              </div>
            </div>

           


          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;