import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import orderService from '../services/order.service';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Package, Clock, CheckCircle, Truck, X, ShoppingBag, 
  ExternalLink, Search, ArrowRight, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestOrderId, setGuestOrderId] = useState('');
  const [showGuestLookup, setShowGuestLookup] = useState(!user);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
      setShowGuestLookup(true);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getUserOrders();

      console.log('User orders:', response);
      setOrders(response || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLookup = async () => {
    if (!guestEmail || !guestOrderId) {
      toast.error('Please enter both your email and order ID');
      return;
    }

    try {
      setLoading(true);
      const response = await orderService.getGuestOrder(guestOrderId, guestEmail);
      
      if (response.order) {
        // Store order in local storage for easier retrieval later
        localStorage.setItem(`order_${guestOrderId}`, JSON.stringify(response.order));
        
        // Redirect to the order confirmation page
        navigate(`/order-confirmation/${guestOrderId}`);
      } else {
        toast.error('No order found for this email and order ID');
      }
    } catch (error) {
      console.error('Error looking up guest order:', error);
      toast.error('No order found for this email and order ID');
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return { 
          icon: <Clock className="w-5 h-5" />, 
          color: 'text-yellow-600 bg-yellow-100', 
          label: 'Pending' 
        };
      case 'processing':
        return { 
          icon: <Package className="w-5 h-5" />, 
          color: 'text-blue-600 bg-blue-100', 
          label: 'Processing' 
        };
      case 'shipped':
        return { 
          icon: <Truck className="w-5 h-5" />, 
          color: 'text-green-600 bg-green-100', 
          label: 'Shipped' 
        };
      case 'delivered':
        return { 
          icon: <CheckCircle className="w-5 h-5" />, 
          color: 'text-green-800 bg-green-100', 
          label: 'Delivered' 
        };
      case 'cancelled':
        return { 
          icon: <X className="w-5 h-5" />, 
          color: 'text-red-600 bg-red-100', 
          label: 'Cancelled' 
        };
      default:
        return { 
          icon: <Package className="w-5 h-5" />, 
          color: 'text-gray-600 bg-gray-100', 
          label: status 
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <Button
            onClick={() => navigate('/shop')}
            variant="outline"
            className="flex items-center"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </div>

        {showGuestLookup && !user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Order Lookup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Not logged in? You can still look up your order with your email and order ID.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                    <Input
                      placeholder="Order ID"
                      value={guestOrderId}
                      onChange={(e) => setGuestOrderId(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleGuestLookup}
                    className="w-full sm:w-auto"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></span>
                        Looking up...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Search className="mr-2 h-4 w-4" />
                        Find My Order
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {user && orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="bg-gray-100 p-4 inline-block rounded-full mb-4">
              <ShoppingBag className="h-12 w-12 text-gray-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-8">
              Your order history will appear here once you make a purchase.
            </p>
            <Button onClick={() => navigate('/shop')}>
              Start Shopping
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {user && orders.map((order, index) => {
              const statusDisplay = getOrderStatusDisplay(order.status);
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          Order #{order._id.slice(-8)}
                        </CardTitle>
                        <div className={`flex items-center ${statusDisplay.color} px-3 py-1 rounded-full`}>
                          {statusDisplay.icon}
                          <span className="ml-2 text-sm font-medium">{statusDisplay.label}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Items</p>
                          <p className="font-medium">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-medium">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-gray-50 flex justify-end">
                      <Button 
                        variant="ghost" 
                        onClick={() => navigate(`/order-confirmation/${order._id}`)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        View Details
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;