import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { Eye, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useCartStore from '@/stores/cartStore'; 
import { useTheme } from '@/contexts/ThemeContext'; // <-- Add this import

const ProductGrid = ({ products = [], onProductClick }) => {
  const cartStore = useCartStore(); 
  const { darkMode } = useTheme(); // <-- Use the theme context
  const constructImageUrl = (path) => {
    if (!path) return '/placeholder-image.jpg';
    return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}${path}`;
  };

  const sortedProducts = [...products].sort((a, b) => {
    const getPriority = (p) => {
      if (p.featured && p.preOrder) return 3;
      if (p.preOrder) return 2;
      if (p.featured) return 1;
      return 0;
    };
    const priorityDiff = getPriority(b) - getPriority(a);
    if (priorityDiff !== 0) return priorityDiff;

    return a.name.localeCompare(b.name);
  });

  const getPrice = (product) => {
    if (
      product.discount &&
      product.discount.percentage &&
      new Date(product.discount.startDate) <= new Date() &&
      new Date(product.discount.endDate) >= new Date()
    ) {
      const discountAmount = (product.price * product.discount.percentage) / 100;
      return {
        original: product.price,
        discounted: product.price - discountAmount,
        hasDiscount: true,
        percentage: product.discount.percentage,
      };
    }
    return { original: product.price, hasDiscount: false };
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const productToAdd = {
      ...product,
      id: product._id,
      quantity: 1, 
    };
    cartStore.addItem(productToAdd); 
  };

  return (
    <div className="grid grid-cols-2  xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {sortedProducts.map((product) => {
        const price = getPrice(product);
        const isOutOfStock = product.stockQuantity === 0;
        const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

        // Add animated glow effect if featured
        const featuredGlow = product.featured
          ? "featured-glow"
          : "";

        return (
          <Card 
            key={product._id} 
            className={`group relative overflow-hidden bg-white rounded-lg shadow-sm transition-all duration-300 cursor-pointer ${featuredGlow}`}
            onClick={() => onProductClick(product._id)}
          >
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              <img
                src={constructImageUrl(product.imageUrls?.[0])}
                alt={product.name}
                className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
              />
              
              {/* Quick action buttons - visible on hover */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-white hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductClick(product._id);
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Quick View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-white hover:bg-gray-100"
                        disabled={isOutOfStock}
                        onClick={(e) => handleAddToCart(e, product)} // Add to cart logic
                      >
                        <ShoppingCart className="h-4 w-4 text-gray-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Status badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {price.hasDiscount && (
                  <Badge variant="destructive" className="px-2 py-1 text-xs bg-red-500">
                    {price.percentage}% OFF
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge variant="secondary" className="px-2 py-1 text-xs bg-gray-800 text-white">
                    Out of Stock
                  </Badge>
                )}
                {lowStock && (
                  <Badge variant="warning" className="px-2 py-1 text-xs bg-amber-500 text-white">
                    Low Stock
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-4 sm:p-4 bg-white">
              <h3 className={`font-medium text-sm sm:text-base mb-1 line-clamp-1 ${
                darkMode ? 'text-white' : 'text-black'
              }`}>
                {product.name}
              </h3>
<div className="flex gap-2 pt-1 mb-1 -ml-1">
  {product.preOrder && (
    <span
      className="
        inline-flex items-center rounded-full
        bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500
        px-2 py-0.5 
        text-[7px] sm:text-[8px] md:text-xs lg:text-xs
        font-bold uppercase tracking-wider text-amber-900
        border border-amber-900
        shadow
        transition-all duration-30
      "
    >
      Pre-order
    </span>
  )}
</div>
              <div className="flex items-baseline gap-2 mb-1">
                {price.hasDiscount ? (
                  <>
                    <span className="text-base sm:text-lg font-bold text-red-600">
                      {formatCurrency(price.discounted)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                      {formatCurrency(price.original)}
                    </span>
                  </>
                ) : (
                  <span className="text-base sm:text-lg pt-1 font-bold text-gray-900">
                    {formatCurrency(price.original)}
                  </span>
                )}
              </div>
              {lowStock && (
                <p className="text-xs text-amber-600">
                  Only {product.stockQuantity} left
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {products.length === 0 && (
        <div className="col-span-full">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="h-16 w-16 text-gray-300 mb-4">
              <ShoppingCart className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No products found
            </h3>
            <p className="text-sm text-gray-500 text-center">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;