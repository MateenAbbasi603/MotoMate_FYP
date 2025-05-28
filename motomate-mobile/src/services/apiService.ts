import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Update API URL based on platform
const API_URL = Platform.select({
  android: 'https://26cd-202-47-38-69.ngrok-free.app',
  ios: 'https://26cd-202-47-38-69.ngrok-free.app',
  default: 'https://26cd-202-47-38-69.ngrok-free.app'
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

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  fullError?: any;
}

export interface UpdateProfileData {
  imgUrl?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
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
    console.log('[apiService] Making request to:', config.url);
    console.log('[apiService] Request method:', config.method);
    console.log('[apiService] Request headers:', JSON.stringify(config.headers, null, 2));
    return config;
  },
  (error) => {
    console.error('[apiService] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling and data processing
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('[apiService] Response received for:', response.config.url);
    console.log('[apiService] Response status:', response.status);
    // Process the response data to handle .NET serialization
    response.data = processNetResponse(response.data);
    return response;
  },
  (error) => {
    console.error('[apiService] Response error for:', error.config?.url);
    if (error.code === 'ECONNABORTED') {
      console.error('[apiService] Request timeout');
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }
    if (!error.response) {
      console.error('[apiService] Network Error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection and ensure the backend server is running.'));
    }
    console.error('[apiService] API Error:', error.response?.data || error.message);
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

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse> {
    try {
      console.log('[apiService] Updating profile with data:', data);
      // For image updates, we need to ensure we're sending a different value
      if (data.imgUrl) {
        // Add a timestamp to ensure the URL is different
        data.imgUrl = `${data.imgUrl}?t=${Date.now()}`;
      }
      const response = await axiosInstance.put('/api/auth/update', data);
      console.log('[apiService] Profile update response:', response.data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('[apiService] Profile update error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
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
      console.log('[apiService] Creating order with data:', JSON.stringify(orderData, null, 2));
      
      // Ensure we have the required fields
      if (!orderData.vehicleId || !orderData.inspectionTypeId || !orderData.subCategory || !orderData.timeSlot) {
        return {
          success: false,
          message: 'Missing required fields: vehicleId, inspectionTypeId, subCategory, or timeSlot'
        };
      }

      // Format the date to match backend expectations
      if (orderData.inspectionDate) {
        const date = new Date(orderData.inspectionDate);
        // Set to noon to avoid timezone issues
        date.setHours(12, 0, 0, 0);
        orderData.inspectionDate = date.toISOString();
      }

      // First, check if the time slot is still available
      const formattedDate = orderData.inspectionDate.split('T')[0];
      const timeSlotsResponse = await this.getTimeSlotsInfo(formattedDate);
      
      if (!timeSlotsResponse.success) {
        return {
          success: false,
          message: 'Failed to verify time slot availability'
        };
      }

      const selectedTimeSlot = timeSlotsResponse.timeSlotInfos.find(
        (slot: { timeSlot: string; availableSlots: number }) => slot.timeSlot === orderData.timeSlot
      );

      if (!selectedTimeSlot || selectedTimeSlot.availableSlots <= 0) {
        return {
          success: false,
          message: 'Selected time slot is no longer available'
        };
      }

      // Prepare the order data exactly as in the web app
      const orderPayload = {
        vehicleId: parseInt(orderData.vehicleId),
        inspectionTypeId: orderData.inspectionTypeId,
        subCategory: orderData.subCategory,
        serviceId: orderData.serviceId ? parseInt(orderData.serviceId) : null,
        additionalServiceIds: orderData.additionalServiceIds ? orderData.additionalServiceIds.map((id: string | number) => parseInt(id.toString())) : [],
        inspectionDate: orderData.inspectionDate,
        timeSlot: orderData.timeSlot,
        notes: orderData.notes || "",
        paymentMethod: orderData.paymentMethod,
        orderType: orderData.paymentMethod === 'online' ? 'Online' : 'Cash',
        totalAmount: orderData.totalAmount || 0,
        includesInspection: true
      };

      console.log('[apiService] Sending order payload:', JSON.stringify(orderPayload, null, 2));

      // Create the order with all services
      const response = await axiosInstance.post('/api/orders/CreateWithInspection', orderPayload);

      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message || 'Failed to create order'
        };
      }

      return { 
        success: true, 
        data: response.data,
        orderId: response.data.orderId 
      };
    } catch (error: any) {
      console.error('[apiService] Response error for: /api/orders', error);
      
      if (error.response && error.response.data) {
        console.error('[apiService] API Error:', error.response.data);
        return { 
          success: false, 
          message: error.response.data.message || 'An error occurred while creating the order',
          error: error.response.data
        };
      }
      
      return {
        success: false,
        message: 'Network error or server unreachable',
        error: error
      };
    }
  }

  async getOrderDetails(orderId: number) {
    try {
      console.log('[apiService] Starting getOrderDetails for orderId:', orderId);
      console.log('[apiService] Current auth token:', this.token ? 'Present' : 'Missing');
      
      const response = await axiosInstance.get(`/api/orders/${orderId}`);
      console.log('[apiService] Order details response received');
      console.log('[apiService] Response data:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        console.error('[apiService] No data received in order details response');
        return {
          success: false,
          message: 'No data received from server'
        };
      }

      return { 
        success: true, 
        data: response.data 
      };
    } catch (error: any) {
      console.error('[apiService] Get order details error:', error.message);
      console.error('[apiService] Error stack:', error?.stack);
      if (error.response) {
        console.error('[apiService] Error response data:', error.response.data);
        console.error('[apiService] Error response status:', error.response.status);
      }
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

  async getInvoiceById(orderId: string) {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        return { success: false, message: 'Authentication token not found' };
      }

      const response = await axiosInstance.get(
        `/api/Invoices/customer/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('[apiService] Invoice response:', response.data);

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('[apiService] Get invoice error:', error.message);
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

  async getTimeSlotsInfo(date: string) {
    try {
      const response = await axiosInstance.get(`/api/TimeSlots/Info?date=${date}`);
      return { 
        success: true, 
        timeSlotInfos: response.data.timeSlotInfos || [] 
      };
    } catch (error: any) {
      console.error('Get time slots error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch time slots'
      };
    }
  }
}

export const apiService = new ApiService();