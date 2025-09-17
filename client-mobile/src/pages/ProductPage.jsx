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

// Predefined colors for display
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

function constructImageUrl(imageObj) {
  if (!imageObj) return '';
  
  // Handle new format with url and color properties
  if (typeof imageObj === 'object' && imageObj.url) {
    const url = imageObj.url;
    if (url.startsWith('http')) {
      return url;
    }
    const apiUrl = import.meta.env.VITE_API_URL;
    return `${apiUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
  
  // Handle old format (direct string URLs)
  if (typeof imageObj === 'string') {
    if (imageObj.startsWith('http')) {
      return imageObj;
    }
    const apiUrl = import.meta.env.VITE_API_URL;
    return `${apiUrl.replace(/\/$/, '')}/${imageObj.replace(/^\//, '')}`;
  }
  
  return '';
}

const ProductPage = ({ isPreview = false }) => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
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
        const productData = await productService.getProduct(productId);
        setProduct(productData);
        
        // Set default selected color to the first available color
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0]);
        }
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

  // Filter images based on selected color or show all if no color selected
  const getFilteredImages = () => {
    if (!product.imageUrls || product.imageUrls.length === 0) {
      return [];
    }

    if (!selectedColor) {
      // Show all images if no color is selected
      return product.imageUrls.map(constructImageUrl).filter(Boolean);
    }

    // Filter images for selected color, fallback to images without color assignment
    const colorSpecificImages = product.imageUrls
      .filter(img => img.color === selectedColor || img.color === null)
      .map(constructImageUrl)
      .filter(Boolean);

    // If no images found for this color, show all images
    return colorSpecificImages.length > 0 ? colorSpecificImages : 
           product.imageUrls.map(constructImageUrl).filter(Boolean);
  };

  const productImages = getFilteredImages();

  if (productImages.length === 0) {
    productImages.push('/placeholder-image.jpg');
  }

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

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
    const productToAdd = { 
      ...product, 
      id: product.id,
      selectedColor,
      quantity: quantity
    };
    
    await cartStore.addItem(productToAdd, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const getColorHex = (colorName) => {
    const colorInfo = PREDEFINED_COLORS.find(c => c.name === colorName);
    return colorInfo?.hex || '#ccc';
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-15">
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
                          onError={(e) => {
                            console.error('Image failed to load:', image);
                            e.target.src = '/placeholder-image.jpg';
                          }}
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
                <span className="ml-2 text-sm text-gray-500">
                  {hoveredRating !== null ? `${hoveredRating} / 5` : `${product.averageRating || 0} / 5`}
                </span>
              </div>
              <span className="text-sm text-gray-500">({product.ratings?.length || 0} reviews)</span>
              {showReviewSuccess && (
                <div className="text-green-600 text-sm ml-2">Review added!</div>
              )}
            </div>

            <p className="text-gray-700">{product.description}</p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  Color: {selectedColor && <span className="text-gray-600">{selectedColor}</span>}
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`w-12 h-12 rounded-full border-2 transition-all relative ${
                        selectedColor === color 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: getColorHex(color) }}
                      title={color}
                    >
                      {selectedColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

        {/* Login Dialog */}
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
    </div>
  );
};

export default ProductPage;