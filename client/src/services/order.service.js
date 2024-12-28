import api from './api';

const orderService = {
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  async getOrder(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  async getUserOrders() {
    const response = await api.get('/orders/user');
    return response.data;
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