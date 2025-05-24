// services/api.ts
import apiClient from './apiClient';



// Helper to get auth token from local storage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper to configure request with auth header
const authHeader = (): Record<string, string> => {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Type definitions
export interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  name: string;
  phone: string | null;
  address: string | null;
  imgUrl: string | null;
}

export interface Vehicle {
  vehicleId: number;
  userId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  serviceId: number;
  serviceName: string;
  category: string;
  price: number;
  description: string;
}

export interface Inspection {
  inspectionId: number;
  userId: number;
  vehicleId: number;
  scheduledDate: string;
  status: string;
  notes: string;
  createdAt: string;
  completedAt: string | null;
  engineCondition: string | null;
  transmissionCondition: string | null;
  brakeCondition: string | null;
  electricalCondition: string | null;
  bodyCondition: string | null;
  tireCondition: string | null;
}

export interface Order {
  orderId: number;
  userId: number;
  vehicleId: number;
  serviceId: number | null;
  inspectionId: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes: string;
  vehicle?: Vehicle;
  service?: Service;
  inspection?: Inspection;
}

// Request types
export interface CreateOrderRequest {
  vehicleId: number;
  serviceId?: number | null;
  inspectionDate: string;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: string;
  serviceId?: number;
  totalAmount?: number;
  notes?: string;
}

const orderApi = {
  // Authentication
  login: async (username: string, password: string): Promise<any> => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (userData: any): Promise<any> => {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/api/auth/me', {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // Vehicles
  getUserVehicles: async (): Promise<Vehicle[]> => {
    try {
      const response = await apiClient.get('/api/vehicles', {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Get vehicles error:', error);
      throw error;
    }
  },

  getVehicleById: async (id: number): Promise<Vehicle> => {
    try {
      const response = await apiClient.get(`/api/vehicles/${id}`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Get vehicle ${id} error:`, error);
      throw error;
    }
  },

  createVehicle: async (vehicleData: any): Promise<Vehicle> => {
    try {
      const response = await apiClient.post('/api/vehicles', vehicleData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Create vehicle error:', error);
      throw error;
    }
  },

  updateVehicle: async (id: number, vehicleData: any): Promise<Vehicle> => {
    try {
      const response = await apiClient.put(`/api/vehicles/${id}`, vehicleData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Update vehicle ${id} error:`, error);
      throw error;
    }
  },

  deleteVehicle: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/vehicles/${id}`, {
        headers: authHeader()
      });
    } catch (error) {
      console.error(`Delete vehicle ${id} error:`, error);
      throw error;
    }
  },

  // Services
  getAllServices: async (): Promise<Service[]> => {
    try {
      const response = await apiClient.get('/api/services');
      return response.data;
    } catch (error) {
      console.error('Get services error:', error);
      throw error;
    }
  },

  getServiceById: async (id: number): Promise<Service> => {
    try {
      const response = await apiClient.get(`/api/services/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Get service ${id} error:`, error);
      throw error;
    }
  },

  getServicesByCategory: async (category: string): Promise<Service[]> => {
    try {
      const response = await apiClient.get(`/api/services/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Get services by category ${category} error:`, error);
      throw error;
    }
  },

  // Orders
  getAllOrders: async () => {
    const response = await apiClient.get('/api/orders');
    return response.data;
  },

  getOrderById: async (id: number) => {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: any) => {
    const response = await apiClient.post('/api/orders', orderData);
    return response.data;
  },

  updateOrder: async (id: number, orderData: any) => {
    const response = await apiClient.put(`/api/orders/${id}`, orderData);
    return response.data;
  },

  deleteOrder: async (id: number) => {
    await apiClient.delete(`/api/orders/${id}`);
  },

  // Orders with Inspection
  createOrderWithInspection: async (orderData: any) => {
    const response = await apiClient.post('/api/orders/CreateWithInspection', orderData);
    return response.data;
  },

  getUserOrders: async () => {
    const response = await apiClient.get('/api/orders/user');
    return response.data;
  },

  // Combined details
  getCombinedDetails: async (userId: number, vehicleId: number, serviceId?: number | null) => {
    const params = new URLSearchParams();
    params.append('userId', userId.toString());
    params.append('vehicleId', vehicleId.toString());

    // Only add serviceId if it's a valid number (not null, undefined, or 0)
    if (serviceId && serviceId > 0) {
      params.append('serviceId', serviceId.toString());
    }

    const response = await apiClient.get(`/api/Detail/combined-details?${params}`);
    console.log(response.data);
    
    return response.data;
  }
};

export default orderApi;