import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, Package, Truck, Coins } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '../services/api';
import orderService from '../services/order.service';
import { useAuth } from '../stores/authStore';
import { usePoints } from '../hooks/usePoints';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { balance, fetchPoints } = usePoints();

  // Parse URL parameters for points info
  const searchParams = new URLSearchParams(location.search);
  const pointsUsed = parseInt(searchParams.get('pointsUsed')) || 0;
  const pointsDiscount = parseFloat(searchParams.get('pointsDiscount')) || 0;
  
  // Parse URL parameters for payment success
  const paymentSuccess = searchParams.get('success') === 'true';

  // Mark order as ready to display
  useEffect(() => {
    // Set a flag in localStorage to prevent redirect after payment success
    localStorage.setItem('paymentComplete', 'true');
    
    // Clean up on component unmount
    return () => {
      localStorage.removeItem('paymentComplete');
    };
  }, []);

  // Clear the cart if payment was successful
  useEffect(() => {
    // Remove from sessionStorage/localStorage any items related to the cart
    if (paymentSuccess) {
      localStorage.removeItem('cart-storage');
      sessionStorage.removeItem('checkoutData');
    }
  }, [paymentSuccess]);

  // Refresh points balance if user is logged in
  useEffect(() => {
    if (user) {
      fetchPoints();
    }
  }, [user, fetchPoints]);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let orderData;
        
        // If user is logged in, fetch order from user orders
        if (user) {
          orderData = await orderService.getOrder(orderId);
        } else {
          // If guest checkout, try to find order by ID and email (if available)
          const email = localStorage.getItem('guestEmail');
          if (email) {
            try {
              orderData = await orderService.getGuestOrder(orderId, email);
            } catch (err) {
              console.error('Guest order lookup failed:', err);
              // If guest lookup fails, we'll still show generic confirmation
            }
          }
        }

        // If we have order data, update it
        if (orderData) {
          setOrder(orderData);
        }

      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Failed to fetch order details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, user]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate estimated delivery date
  const getEstimatedDelivery = () => {
    const today = new Date();
    if (order?.shippingMethod === 'express') {
      // 1-2 business days
      const estimatedDate = new Date(today);
      estimatedDate.setDate(today.getDate() + 2);
      return formatDate(estimatedDate);
    } else {
      // 3-5 business days
      const estimatedDate = new Date(today);
      estimatedDate.setDate(today.getDate() + 5);
      return formatDate(estimatedDate);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading order confirmation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="bg-green-50 border-b">
            <div className="flex items-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
              <CardTitle>Order Confirmation</CardTitle>
            </div>
            <CardDescription>
              {order ? `Order #${order._id.substring(order._id.length - 8).toUpperCase()} has been placed successfully!` : 'Your order has been placed successfully!'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Order Details */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
                  <p className="text-green-800">
                    Thank you for your order! We'll send you a confirmation email with your order details shortly.
                  </p>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                  
                  {order ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Package className="h-5 w-5 text-gray-500 mr-2" />
                            <h4 className="font-medium">Order Details</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Order Number:</span> #{order._id.substring(order._id.length - 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Date:</span> {formatDate(order.createdAt)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span> {order.status}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Truck className="h-5 w-5 text-gray-500 mr-2" />
                            <h4 className="font-medium">Shipping Details</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Method:</span> {order.shippingMethod === 'express' ? 'Express (1-2 days)' : 'Standard (3-5 days)'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Estimated Delivery:</span> {getEstimatedDelivery()}
                          </p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Items</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {order.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {item.product ? item.product.name : 'Product'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                      ${item.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                      {item.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                      ${(item.price * item.quantity).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Order Totals */}
                      <div className="mt-6 flex justify-end">
                        <div className="w-full max-w-xs">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal</span>
                              <span>${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Shipping</span>
                              <span>${order.shippingCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Tax</span>
                              <span>${order.tax.toFixed(2)}</span>
                            </div>
                            
                            {/* Show points discount if available */}
                            {(order.pointsUsed > 0 || pointsUsed > 0) && (
                              <div className="flex justify-between text-sm text-green-600">
                                <span className="flex items-center">
                                  <Coins className="h-4 w-4 mr-1" />
                                  Points Discount ({order.pointsUsed || pointsUsed})
                                </span>
                                <span>-${(order.pointsDiscount || pointsDiscount).toFixed(2)}</span>
                              </div>
                            )}
                            
                            <div className="border-t border-gray-200 pt-2 mt-2">
                              <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span>${order.total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Generic confirmation when order details aren't available
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600">
                        Your order has been placed successfully. 
                        {pointsUsed > 0 && (
                          <span className="flex items-center text-green-600 mt-2">
                            <Coins className="h-4 w-4 mr-1" />
                            You used {pointsUsed} points for a ${pointsDiscount.toFixed(2)} discount
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Shipping Address */}
                {order && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p className="text-sm">{order.shippingAddress.address}</p>
                      {order.shippingAddress.apartment && <p className="text-sm">{order.shippingAddress.apartment}</p>}
                      <p className="text-sm">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                      <p className="text-sm">{order.shippingAddress.country}</p>
                    </div>
                  </div>
                )}

                {/* Points earned notification for logged in users */}
                {user && (
                  <div className="mt-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center">
                        <Coins className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <h4 className="font-medium text-blue-800">Rewards Update</h4>
                          <p className="text-sm text-blue-700">
                            {order?.pointsUsed > 0 ? 
                              `You used ${order.pointsUsed} points to save ${order.pointsDiscount.toFixed(2)} on this order.` :
                              pointsUsed > 0 ?
                              `You used ${pointsUsed} points to save ${pointsDiscount.toFixed(2)} on this order.` :
                              'Purchase points have been added to your account.'}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            Your current balance: <span className="font-semibold">{balance} points</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/orders')}
                  >
                    View Orders
                  </Button>
                  <Button
                    onClick={() => navigate('/shop')}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmation;