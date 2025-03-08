import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import orderService from '../services/order.service';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Package, Truck, Calendar, ChevronRight, Copy, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/input';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guestEmail, setGuestEmail] = useState('');

  const getUserId = (user) => {
    return user?.user?.id || user?.id || '';
  };


  // Updated useEffect to handle multiple ways of getting the order ID
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        
        // Try multiple sources to get the order ID
        const finalOrderId = orderId || 
                   location.state?.orderId || 
                   new URLSearchParams(location.search).get('orderId') ||
                   localStorage.getItem('lastOrderId') ||
                   localStorage.getItem('lastCompletedOrderId'); // Added for backup
        
        console.log('Final order ID:', finalOrderId);
        
        // If we have order data directly from state, use it
        if (location.state?.order) {
          setOrder(location.state.order);
          // Also cache the order for future reference if we have an ID
          if (finalOrderId) {
            localStorage.setItem(`order_${finalOrderId}`, JSON.stringify(location.state.order));
          }
          setLoading(false);
          return;
        }
        
        // Look for payment success indicators
        const paymentComplete = localStorage.getItem('paymentComplete');
        const fromPayment = location.state?.fromPayment;
        
        // If we have a valid order ID, try to fetch the order
        if (finalOrderId) {
          try {
            // Try to get from localStorage cache first (for both guests and logged-in users)
            const cachedOrderKey = `order_${finalOrderId}`;
            if (localStorage.getItem(cachedOrderKey)) {
              try {
                console.log('Getting order from localStorage:', cachedOrderKey);
                const cachedOrder = JSON.parse(localStorage.getItem(cachedOrderKey));
                if (cachedOrder) {
                  setOrder(cachedOrder);
                  setLoading(false);
                  return;
                }
              } catch (cacheError) {
                console.error('Error parsing cached order:', cacheError);
                // Continue to other methods
              }
            }
            
            // For logged-in users
            if (user && (getUserId(user))) {
              console.log('Fetching order for logged-in user');
              const response = await orderService.getOrder(finalOrderId);
              console.log('Order response:', response);
              
              if (response && (response.order || response.data?.order)) {
                const orderData = response.order || response.data?.order;
                setOrder(orderData);
                setLoading(false);
                return;
              }
            }
            
            // For guest users coming directly from payment
            // Skip email verification if coming from payment or if payment was just completed
            if (fromPayment || paymentComplete) {
              try {
                console.log('Attempting to fetch order directly after payment');
                const response = await orderService.getOrder(finalOrderId);
                
                if (response && (response.order || response.data?.order)) {
                  const orderData = response.order || response.data?.order;
                  setOrder(orderData);
                  
                  // Cache it for future reference
                  localStorage.setItem(`order_${finalOrderId}`, JSON.stringify(orderData));
                  
                  setLoading(false);
                  return;
                }
              } catch (directFetchError) {
                console.error('Error fetching order directly after payment:', directFetchError);
                // Continue to next options
              }
            }
          } catch (fetchError) {
            console.error('Error fetching order for logged-in user:', fetchError);
            // Continue to error state
          }
        }
          
        // If we reach here, we couldn't find the order
        setError('To view this order, please enter the email used during checkout.');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order:', error);
        if (error.response?.status === 404) {
          setError('Order not found. Please check your order number and try again.');
        } else {
          setError('Failed to load order information. Please try again later.');
        }
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, location.state, location.search, user]);

  const handleGuestLookup = async (e) => {
    e.preventDefault();
    
    if (!guestEmail || !guestEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      console.log(`Looking up order ${orderId} with email ${guestEmail}`);
      
      // First, try using the guest order lookup endpoint
      try {
        const response = await orderService.getGuestOrder(orderId, guestEmail);
        console.log('Guest order lookup response:', response);
        
        if (response?.order) {
          setOrder(response.order);
          
          // Cache the order data for future reference
          localStorage.setItem(`order_${orderId}`, JSON.stringify(response.order));
          setError(null);
          return;
        }
      } catch (guestLookupError) {
        console.error('Error with guest order lookup:', guestLookupError);
        // Continue to fallback approach
      }
      
      // Fallback: try fetching the order directly
      try {
        const regularResponse = await orderService.getOrder(orderId);
        console.log('Regular order lookup response:', regularResponse);
        
        if (regularResponse?.order) {
          // Verify the email matches
          const orderEmail = regularResponse.order.email || 
                            regularResponse.order.shippingAddress?.email;
                            
          if (orderEmail && orderEmail.toLowerCase() === guestEmail.toLowerCase()) {
            setOrder(regularResponse.order);
            
            // Cache the order data for future reference
            localStorage.setItem(`order_${orderId}`, JSON.stringify(regularResponse.order));
            setError(null);
            return;
          }
        }
      } catch (regularLookupError) {
        console.error('Error with regular order lookup:', regularLookupError);
      }
      
      // If we reach here, no order was found
      toast.error('No order found for this email and order ID');
    } catch (error) {
      console.error('Error fetching guest order:', error);
      toast.error('No order found for this email and order ID');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    toast.success('Order ID copied to clipboard');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const expectedDeliveryDate = (order) => {
    if (!order) return 'N/A';
    
    if (order.estimatedDeliveryDate) {
      return formatDate(order.estimatedDeliveryDate);
    }
    
    // Calculate estimated delivery date: 3-5 days for standard, 1-2 for express
    const orderDate = new Date(order.createdAt);
    const deliveryDays = order.shippingMethod === 'express' ? 2 : 5;
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(orderDate.getDate() + deliveryDays);
    
    return formatDate(estimatedDate);
  };

  const getOrderStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600 bg-yellow-100', label: 'Pending' };
      case 'processing':
        return { color: 'text-blue-600 bg-blue-100', label: 'Processing' };
      case 'shipped':
        return { color: 'text-green-600 bg-green-100', label: 'Shipped' };
      case 'delivered':
        return { color: 'text-green-800 bg-green-100', label: 'Delivered' };
      case 'cancelled':
        return { color: 'text-red-600 bg-red-100', label: 'Cancelled' };
      default:
        return { color: 'text-gray-600 bg-gray-100', label: status || 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Guest lookup form
  if (error && !user && !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/shop')}
            className="mb-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Retrieve Your Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4 text-center">
                Please enter the email address you used during checkout to view your order information.
              </p>
              <form onSubmit={handleGuestLookup} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full"
                  required
                />
                <Button 
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Find My Order
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find any order with the provided information.</p>
          <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  const statusDisplay = getOrderStatusDisplay(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/shop')}
          className="mb-4 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold">Order Confirmed!</h1>
                  <p className="opacity-80">Thank you for your purchase.</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between mb-6 pb-6 border-b">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm text-gray-500 mb-1">Order Number</p>
                  <div className="flex items-center">
                    <p className="font-semibold">{orderId}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={copyOrderId}
                      className="ml-2 h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mb-4 md:mb-0">
                  <p className="text-sm text-gray-500 mb-1">Order Date</p>
                  <p className="font-semibold">{formatDate(order.createdAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`${statusDisplay.color} px-3 py-1 rounded-full text-sm font-medium`}>
                    {statusDisplay.label}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items && order.items.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center border-b pb-4"
                    >
                      <div className="bg-gray-100 p-3 rounded-lg mr-4">
                        {item.product && item.product.images && item.product.images[0] ? (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name || 'Product'} 
                            className="w-12 h-12 object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || 'Product'}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">${((item.price || 0) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Truck className="w-5 h-5 text-gray-500 mr-2" />
                      <p className="font-medium">{order.shippingMethod === 'express' ? 'Express Shipping' : 'Standard Shipping'}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {order.shippingAddress?.street}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.shippingAddress?.country}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${order.items?.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Shipping</span>
                      <span>${order.shippingCost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Tax</span>
                      <span>${(
                        (order.total || 0) - (
                          (order.items?.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0) || 0) + 
                          (order.shippingCost || 0)
                        )
                      ).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t mt-2">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">${(order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                  <p className="text-blue-800">
                    <span className="font-medium">Estimated Delivery:</span> {expectedDeliveryDate(order)}
                  </p>
                </div>
              </div>
              
              {order.trackingNumber && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                  <p className="font-medium">{order.trackingNumber}</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="bg-gray-50 p-6">
              <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="justify-center sm:justify-start"
                >
                  Print Receipt
                </Button>
                
                {user && (
                  <Button 
                    onClick={() => navigate('/orders')}
                    className="justify-center sm:justify-start flex items-center"
                  >
                    View All Orders
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmation;