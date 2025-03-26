import React from 'react';
import { 
  Pencil, Trash2, TagIcon, ExternalLink, Ticket, AlertTriangle, 
  CheckCircle2, MoreHorizontal, Image
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';

const ProductList = ({ 
  products = [], 
  onDeleteProduct,
  onEditProduct,
  onPromote,
  bulkSelectMode = false,
  selectedProducts = [],
  onSelectProduct
}) => {
  
  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Check if product is on sale
  const isOnSale = (product) => {
    if (!product.discount || !product.discount.percentage) return false;
    
    try {
      const startDate = new Date(product.discount.startDate);
      const endDate = new Date(product.discount.endDate);
      const now = new Date();
      
      return product.discount.percentage > 0 && 
             startDate <= now && 
             endDate >= now;
    } catch (e) {
      return false;
    }
  };

  // Calculate sale price
  const getSalePrice = (product) => {
    if (!isOnSale(product)) return product.price;
    
    const discount = product.discount.percentage / 100;
    return product.price * (1 - discount);
  };

  // Get sale dates as formatted string
  const getSaleDates = (product) => {
    if (!isOnSale(product)) return '';
    
    try {
      const startDate = format(new Date(product.discount.startDate), 'MMM d, yyyy');
      const endDate = format(new Date(product.discount.endDate), 'MMM d, yyyy');
      return `${startDate} - ${endDate}`;
    } catch (e) {
      return '';
    }
  };

  // Get stock status badge
  const getStockBadge = (quantity) => {
    if (quantity <= 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    } else if (quantity <= 5) {
      return (
        <Badge variant="warning" className="bg-amber-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock ({quantity})
        </Badge>
      );
    } else {
      return (
        <Badge variant="success" className="bg-green-500 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          In Stock ({quantity})
        </Badge>
      );
    }
  };

  // Display image thumbnail
  const getThumbnail = (product) => {
    // Choose the first image if available
    if (product.images && product.images.length > 0) {
      const imagePath = product.images[0];
      
      // Handle different image path formats
      const imageUrl = imagePath.startsWith('http') 
        ? imagePath 
        : `${import.meta.env.VITE_API_URL}/${imagePath}`;
      
      return (
        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-image.jpg';
              e.target.onerror = null;
            }}
          />
        </div>
      );
    }
    
    // Fallback to placeholder
    return (
      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
        <Image className="h-6 w-6 text-gray-400" />
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {bulkSelectMode && (
              <TableHead style={{ width: '40px' }}></TableHead>
            )}
            <TableHead style={{ width: '60px' }}></TableHead>
            <TableHead className="min-w-[150px]">Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={bulkSelectMode ? 7 : 6} className="h-24 text-center">
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product._id} className="group">
                {bulkSelectMode && (
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product._id)}
                      onCheckedChange={() => onSelectProduct(product._id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  {getThumbnail(product)}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    {product.name}
                    {product.featured && (
                      <Badge variant="secondary" className="ml-2">Featured</Badge>
                    )}
                  </div>
                  {isOnSale(product) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        {product.discount.percentage}% OFF
                      </Badge>
                      <span className="ml-2 text-gray-500">{getSaleDates(product)}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">
                  {isOnSale(product) ? (
                    <div>
                      <span className="font-medium">{formatPrice(getSalePrice(product))}</span>
                      <span className="text-gray-500 line-through text-xs ml-2">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  ) : (
                    formatPrice(product.price)
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {getStockBadge(product.stockQuantity)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="invisible group-hover:visible flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEditProduct?.(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPromote?.(product._id)}>
                          <TagIcon className="mr-2 h-4 w-4" />
                          Add Promotion
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/product/${product._id}`, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Product
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteProduct(product._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductList;