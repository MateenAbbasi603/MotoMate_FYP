import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Update API URL based on platform
const API_URL = Platform.select({
  android: 'https://d071-202-47-38-69.ngrok-free.app',
  ios: 'https://d071-202-47-38-69.ngrok-free.app',
  default: 'https://d071-202-47-38-69.ngrok-free.app'
});

// Create axios instance with custom config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});


export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  imgUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
// Helper function to process .NET response with $values
const processNetResponse = (data: any) => {
  // If it's an object with $values property, extract the array
  if (data && typeof data === 'object' && data.$values && Array.isArray(data.$values)) {
    return data.$values.map((item: any) => processNetResponseItem(item));
  }

  // If it's an array, process each item
  if (Array.isArray(data)) {
    return data.map((item: any) => processNetResponseItem(item));
  }

  // If it's a single object, process it
  if (data && typeof data === 'object') {
    return processNetResponseItem(data);
  }

  return data;
};

// Helper function to clean individual items (remove $id, $ref, etc.)
const processNetResponseItem = (item: any) => {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const cleanItem: any = {};

  for (const [key, value] of Object.entries(item)) {
    // Skip .NET serialization properties
    if (key.startsWith('$')) {
      continue;
    }

    // Recursively process nested objects/arrays
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        cleanItem[key] = value.map(processNetResponseItem);
      } else if (value && typeof value === 'object' && '$values' in value && Array.isArray((value as any).$values)) {
        cleanItem[key] = processNetResponse(value);
      } else {
        cleanItem[key] = processNetResponseItem(value);
      }
    } else {
      cleanItem[key] = value;
    }
  }

  return cleanItem;
};

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    // console.log('Making request to:', config.url);
    // console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling and data processing
axiosInstance.interceptors.response.use(
  (response) => {
    // console.log('Response received:', response.status);
    // Process the response data to handle .NET serialization
    response.data = processNetResponse(response.data);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection and ensure the backend server is running.'));
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

class ApiService {
  private token: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    this.token = null;
    delete axiosInstance.defaults.headers.common['Authorization'];
  }

  async login(credentials: { username: string; password: string }) {
    try {
      // console.log('Attempting login to:', `${API_URL}/api/auth/login`);

      const response = await axiosInstance.post('/api/auth/login', credentials);
      // console.log('Login response status:', response.status);
      // console.log('Login response data:', response.data);

      if (response.data.token || response.data.success) {
        const token = response.data.token;
        if (token) {
          this.setAuthToken(token);
        }
        return { success: true, data: response.data };
      }
      return { success: false, message: "Login failed" };
    } catch (error: any) {
      console.error('Login error:', error.message);
      if (error.message.includes('Network error')) {
        return {
          success: false,
          message: 'Unable to connect to server. Please ensure the backend server is running and accessible.'
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  }

  async updateProfile  (userData: UpdateProfileData){
    const response = await axiosInstance.put('/api/auth/update', userData);
    return response.data;
  }


  async register(userData: any) {
    try {
      // console.log('Attempting registration to:', `${API_URL}/api/auth/register`);
      // console.log('With data:', userData);

      const response = await axiosInstance.post('/api/auth/register', userData);
      // console.log('Registration response:', response.data);

      if (response.data.token || response.data.success) {
        const token = response.data.token;
        if (token) {
          this.setAuthToken(token);
        }
        return { success: true, data: response.data };
      }
      return { success: false, message: "Registration failed" };
    } catch (error: any) {
      console.error('Registration error:', error.message);
      if (error.message.includes('Network error')) {
        return {
          success: false,
          message: 'Unable to connect to server. Please ensure the backend server is running and accessible.'
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  }

  async getCurrentUser() {
    try {
      const response = await axiosInstance.get('/api/auth/me');
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Get user error:', error.message);
      if (error.message.includes('Network error')) {
        return {
          success: false,
          message: 'Unable to connect to server. Please ensure the backend server is running and accessible.'
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user data'
      };
    }
  }

  // Orders
  async getOrders() {
    try {
      const response = await axiosInstance.get('/api/orders');
      // console.log('Orders response (processed):', response.data);

      // The response is already processed by the interceptor
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Get orders error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch orders'
      };
    }
  }

  async createOrder(orderData: any) {
    try {
      const response = await axiosInstance.post('/api/orders', orderData);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Create order error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create order'
      };
    }
  }

  async getOrderDetails(orderId: number) {
    try {
      const response = await axiosInstance.get(`/api/orders/${orderId}`);
      console.log(response.data ,"ORDER DETAILS");
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Get order details error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch order details'
      };
    }
  }

  // Vehicles
  async getVehicles() {
    try {
      const response = await axiosInstance.get('/api/vehicles');
      // console.log('Vehicles response (processed):', response.data);

      // The response is already processed by the interceptor
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Get vehicles error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch vehicles'
      };
    }
  }

  async addVehicle(vehicleData: any) {
    try {
      const response = await axiosInstance.post('/api/vehicles', vehicleData);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Add vehicle error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add vehicle'
      };
    }
  }

  async deleteVehicle(vehicleId: number) {
    try {
      const response = await axiosInstance.delete(`/api/vehicles/${vehicleId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Delete vehicle error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete vehicle'
      };
    }
  }

  // Services
  async getServices() {
    try {
      const response = await axiosInstance.get('/api/services');
      // console.log('Services response (processed):', response.data);

      // The response is already processed by the interceptor
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Get services error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch services'
      };
    }
  }

  // Notifications
  async getNotifications() {
    try {
      const response = await axiosInstance.get('/api/notifications');
      // console.log('Notifications response (processed):', response.data);

      // The response is already processed by the interceptor
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Get notifications error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch notifications'
      };
    }
  }

  async getInvoiceById(invoiceId: string) {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        return { success: false, message: 'Authentication token not found' };
      }

      const response = await axiosInstance.get(
        `/api/Invoices/${invoiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // console.log(response.data ,"getInvoiceById");


      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Get invoice error:', error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch invoice' 
      };
    }
  }

  async changePassword (passwordData: ChangePasswordData){
    const response = await axiosInstance.post('/api/auth/change-password', passwordData);
    return response.data;
  }

  async testConnection() {
    try {
      // console.log('Testing connection to:', `${API_URL}/api/auth/test`);
      const response = await axiosInstance.get('/api/auth/test');
      // console.log('Test response:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Connection test error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to connect to server',
        error: error
      };
    }
  }
}

export const apiService = new ApiService();