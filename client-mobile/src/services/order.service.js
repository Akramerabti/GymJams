import api from './api';

const orderService = {
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  },

  async getOrder(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch order details for ID ${orderId}:`, error);
      throw error;
    }
  },

  async getGuestOrder(orderId, email) {
    if (!orderId || !email) {
      throw new Error('Order ID and email are required');
    }
    
    try {
      const response = await api.post('/orders/guest/lookup', {
        orderId,
        email
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch guest order:', error);
      throw error;
    }
  },

  async getUserOrders() {
    try {
      const response = await api.get('/orders');
      //('User orders response:', response.data);
      return response.data?.orders || [];
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      throw error;
    }
  },

  async cancelOrder(orderId) {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Failed to cancel order ${orderId}:`, error);
      throw error;
    }
  },

  async getOrderTracking(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}/tracking`);
      //('Order tracking response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to get tracking for order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Add this method for updating an existing order
  async updateOrder(orderId, orderData) {
    try {
      const response = await api.put(`/orders/${orderId}`, orderData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update order ${orderId}:`, error);
      throw error;
    }
  },
  
  // Add this method for processing payment
  async processPayment(paymentIntentId) {
    try {
      const response = await api.post('/orders/payment', { paymentIntentId });
      return response.data;
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw error;
    }
  }
};

export default orderService;