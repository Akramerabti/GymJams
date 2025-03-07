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

      console.log('User orders:', response.data?.orders);
      return response.data?.orders || [];
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      throw error;
    }
  },

  async cancelOrder(orderId) {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  },

  async getOrderTracking(orderId) {
    const response = await api.get(`/orders/${orderId}/tracking`);
    return response.data;
  }
};

export default orderService;