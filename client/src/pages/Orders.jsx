import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, PackageOpen, AlertTriangle, ExternalLink, Coins } from 'lucide-react';
import orderService from '../services/order.service';
import { useAuth } from '../stores/authStore';

const OrderItem = ({ order, onViewDetails }) => {
  // Function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Determine status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2">
              <PackageOpen className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold text-lg">Order #{order._id.substring(order._id.length - 8).toUpperCase()}</h3>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Placed on {formatDate(order.createdAt)}
            </div>
            <div className="mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getStatusBadge(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="text-right">
              <div className="text-gray-500 text-sm">Total</div>
              <div className="font-bold text-lg">${order.total.toFixed(2)}</div>
              {order.pointsUsed > 0 && (
                <div className="flex items-center justify-end text-green-600 text-xs">
                  <Coins className="h-3 w-3 mr-1" />
                  <span>{order.pointsUsed} points saved ${order.pointsDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => onViewDetails(order._id)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 border-t pt-4">
          <div className="text-sm text-gray-500 mb-2">Items</div>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div className="flex items-center">
                  <span className="font-medium">
                    {item.quantity} x {item.product ? item.product.name : 'Product'}
                  </span>
                </div>
                <div>${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  // Function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Order #{order._id.substring(order._id.length - 8).toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Order Information</h3>
            <p className="text-sm py-1">
              <span className="font-medium">Date Placed:</span> {formatDate(order.createdAt)}
            </p>
            <p className="text-sm py-1">
              <span className="font-medium">Status:</span>{' '}
              <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase 
                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-800' : 
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'}`}>
                {order.status}
              </span>
            </p>
            <p className="text-sm py-1">
              <span className="font-medium">Payment Status:</span>{' '}
              <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase 
                ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' : 
                  'bg-red-100 text-red-800'}`}>
                {order.paymentStatus}
              </span>
            </p>
            {order.trackingNumber && (
              <p className="text-sm py-2">
                <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
              </p>
            )}
          </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">Shipping Information</h3>
              <p className="text-sm">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p className="text-sm">{order.shippingAddress.address}</p>
              {order.shippingAddress.apartment && (
                <p className="text-sm">{order.shippingAddress.apartment}</p>
              )}
              <p className="text-sm">
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.zipCode}
              </p>
              <p className="text-sm">{order.shippingAddress.country}</p>
              <p className="text-sm mt-2">
                <span className="font-medium">Shipping Method:</span>{' '}
                {order.shippingMethod === 'express'
                  ? 'Express Shipping (1-2 business days)'
                  : 'Standard Shipping (3-5 business days)'}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Items</h3>
            <div className="border rounded-lg overflow-hidden">
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

          <div className="border-t pt-6">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-sm">Subtotal</span>
                  <span className="text-sm font-medium">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm">Shipping</span>
                  <span className="text-sm font-medium">${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm">Tax</span>
                  <span className="text-sm font-medium">${order.tax.toFixed(2)}</span>
                </div>
                
                {/* Points discount section */}
                {order.pointsUsed > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span className="text-sm flex items-center">
                      <Coins className="h-4 w-4 mr-1" />
                      Points Discount ({order.pointsUsed})
                    </span>
                    <span className="text-sm font-medium">-${order.pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
                  <span className="text-base font-medium">Total</span>
                  <span className="text-base font-bold">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch orders
        const response = await orderService.getUserOrders();
        
        // Sort by most recent first
        const sortedOrders = response.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleViewOrderDetails = (orderId) => {
    const order = orders.find(order => order._id === orderId);
    setSelectedOrder(order);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In to View Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Please sign in to view your order history.
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/login?redirect=/orders')}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PackageOpen className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6 text-center">
                Looks like you haven't placed any orders yet.
              </p>
              <Button onClick={() => navigate('/shop')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderItem 
                key={order._id} 
                order={order} 
                onViewDetails={handleViewOrderDetails}
              />
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default Orders;