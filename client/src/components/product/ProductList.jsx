import React from 'react';
import { 
  Pencil, Trash2, TagIcon, ExternalLink, Ticket, AlertTriangle, 
  CheckCircle2, MoreHorizontal, Image, Heart, ShoppingCart, Eye
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useMediaQuery } from "react-responsive";
import { ScrollArea } from "@/components/ui/scroll-area";

const ProductList = ({ 
  products = [], 
  onDeleteProduct,
  onEditProduct,
  onPromote,
  bulkSelectMode = false,
  selectedProducts = [],
  onSelectProduct,
  viewMode = 'table' // 'table' or 'grid'
}) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  // Use provided viewMode prop or fallback to responsive detection
  const displayMode = viewMode || (isMobile ? 'grid' : 'table');
  
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

  const ActionsMenu = ({ product }) => (
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
  );

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product._id} className="overflow-hidden group">
          <div className="relative h-40 bg-gray-100">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0].startsWith('http') 
                  ? product.images[0] 
                  : `${import.meta.env.VITE_API_URL}/${product.images[0]}`}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                  e.target.onerror = null;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            {/* Status badge positioned top-left */}
            <div className="absolute top-2 left-2">
              {getStockBadge(product.stockQuantity)}
            </div>
            
            {/* Discount badge if applicable */}
            {isOnSale(product) && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-red-500">{product.discount.percentage}% OFF</Badge>
              </div>
            )}
            
            {/* Quick actions overlay (appears on hover) */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                variant="default" 
                size="icon" 
                className="rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProduct?.(product);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="default" 
                size="icon" 
                className="rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/product/${product._id}`, '_blank');
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProduct(product._id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            {/* Selection checkbox when in bulk select mode */}
            {bulkSelectMode && (
              <div className="flex justify-end mb-2">
                <Checkbox
                  checked={selectedProducts.includes(product._id)}
                  onCheckedChange={() => onSelectProduct(product._id)}
                  aria-label={`Select ${product.name}`}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-medium truncate">{product.name}</h3>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  {isOnSale(product) ? (
                    <div>
                      <span className="font-bold text-red-600">{formatPrice(getSalePrice(product))}</span>
                      <span className="text-gray-500 line-through text-xs ml-2">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold">{formatPrice(product.price)}</span>
                  )}
                </div>
                <ActionsMenu product={product} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Table View Component
  const TableView = () => (
    <div className="overflow-hidden rounded-md border">
      <ScrollArea className="w-full overflow-auto">
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
                    <div className="flex justify-end">
                      <ActionsMenu product={product} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {products.length === 0 ? (
        <div className="p-8 text-center">
          <Image className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first product to get started.</p>
        </div>
      ) : (
        <>
          {displayMode === 'grid' ? <GridView /> : <TableView />}
        </>
      )}
    </>
  );
};

export default ProductList;