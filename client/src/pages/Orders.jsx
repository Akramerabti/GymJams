// Orders.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ordersService from '../services/order.service.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const orders = await ordersService.getOrders(user.user._id);
      setOrders(orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to fetch orders. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Orders  & Purchases</h1>
        {orders.map((order) => (
          <Card key={order._id} className="mb-4">
            <CardHeader>
              <CardTitle>Order #{order._id}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Status: {order.status}</p>
              <p>Total: ${order.total}</p>
              <Button
                variant="outline"
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Orders;