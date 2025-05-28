import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Update this with your actual backend URL
const BASE_URL = ' https://414d-202-47-38-69.ngrok-free.app'; // Android emulator localhost
// const BASE_URL = 'http://localhost:5177'; // iOS simulator localhost

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    userId: number;
    username: string;
    email: string;
    role: string;
    name: string;
    phone: string;
    address: string;
    imgUrl: string;
  };
}

interface TimeSlotInfoResponse {
  timeSlotInfos: {
    timeSlot: string;
    availableSlots: number;
    totalSlots: number;
  }[];
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        console.log(`[ApiService] Making ${config.method?.toUpperCase()} request to: ${config.url}`);
        console.log('[ApiService] Request headers:', config.headers);
        return config;
      },
      (error: AxiosError) => {
        console.error('[ApiService] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('[ApiService] Response received:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      (error: AxiosError) => {
        console.error('[ApiService] Response error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
      return {
        success: true,
        data: response.data,
        message: 'Login successful'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
      return {
        success: true,
        data: response.data,
        message: 'Registration successful'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/auth/me');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user profile'
      };
    }
  }

  // Vehicles endpoints
  async getVehicles(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/vehicles');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get vehicles'
      };
    }
  }

  // Orders endpoints
  async getOrders(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/orders');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get orders'
      };
    }
  }

  async getInvoiceById(orderId: string): Promise<ApiResponse> {
    try {
      console.log('[ApiService] Getting invoice for order:', orderId);
      const response = await this.api.get(`/invoices/order/${orderId}`);
      console.log('[ApiService] Invoice response:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[ApiService] Get invoice error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch invoice'
      };
    }
  }

  async generateInvoice(orderId: number): Promise<ApiResponse> {
    try {
      console.log('[ApiService] Generating invoice for order:', orderId);
      const response = await this.api.post(`/invoices/generate-from-order/${orderId}`);
      console.log('[ApiService] Invoice generated:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[ApiService] Error generating invoice:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to generate invoice'
      };
    }
  }

  async processPayment(invoiceId: number, paymentData: any): Promise<ApiResponse> {
    try {
      console.log('[ApiService] Processing payment for invoice:', invoiceId);
      const response = await this.api.post('/payments/process-safepay', {
        invoiceId: invoiceId,
        transactionId: paymentData.transactionId || `TXN_${Date.now()}`,
        ...paymentData
      });
      console.log('[ApiService] Payment processed:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[ApiService] Error processing payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process payment'
      };
    }
  }

  async getOrderDetails(orderId: number): Promise<ApiResponse> {
    try {
      console.log('[ApiService] Making request to fetch order details for orderId:', orderId);
      const response = await this.api.get(`/orders/${orderId}`);
      console.log('[ApiService] Response data:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[ApiService] Get order details error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch order details'
      };
    }
  }

  // Services endpoints
  async getServices(): Promise<ApiResponse> {
    try {
      console.log('[ApiService] Getting services');
      const response = await this.api.get('/services');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[ApiService] Get services error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get services'
      };
    }
  }

  // Time slots endpoints
  async getTimeSlotsInfo(date: string): Promise<ApiResponse<TimeSlotInfoResponse>> {
    try {
      console.log('[ApiService] Fetching time slots for date:', date);
      const response = await this.api.get(`/time-slots?date=${date}`);
      console.log('[ApiService] Time slots response:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[ApiService] Error fetching time slots:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch time slots'
      };
    }
  }

  // Notifications endpoints
  async getNotifications(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/notifications');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get notifications'
      };
    }
  }

  // Generic GET request
  async get(endpoint: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed'
      };
    }
  }

  // Generic POST request
  async post(endpoint: string, data: any): Promise<ApiResponse> {
    try {
      const response = await this.api.post(endpoint, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed'
      };
    }
  }

  // Orders endpoints
  async createOrder(orderData: any): Promise<ApiResponse> {
    try {
      console.log('[ApiService] Creating order with data:', orderData);
      const response = await this.api.post('/orders', orderData);
      console.log('[ApiService] Order created:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('[ApiService] Error creating order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create order'
      };
    }
  }
}

export const apiService = new ApiService();