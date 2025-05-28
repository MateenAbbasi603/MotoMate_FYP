// services/orderService.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Order service functions
export const orderService = {
  // Get all orders
  getAllOrders: async () => {
    try {
      const response = await apiClient.get('/api/Orders');
      
      
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (id:any) => {
    try {
      const response = await apiClient.get(`/api/Orders/${id}`);
      console.log(response.data ,"GET ORDER DETAILS");
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },

  // Update order
  updateOrder: async (id: number, orderData: any) => {
    try {
      // Ensure notes is an empty string if undefined/null
      const dataToUpdate = {
        ...orderData,
        notes: orderData.notes || ''
      };
      
      const response = await apiClient.put(`/api/Orders/${id}`, dataToUpdate);
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw error;
    }
  },

  // Delete order
  deleteOrder: async (id:any) => {
    try {
      const response = await apiClient.delete(`/api/Orders/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      throw error;
    }
  },

  // Create order with inspection
  createOrderWithInspection: async (orderData:any) => {
    try {
      const response = await apiClient.post('/api/Orders/CreateWithInspection', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order with inspection:', error);
      throw error;
    }
  }
};

export default orderService;