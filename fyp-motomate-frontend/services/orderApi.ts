// services/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
      const response = await axios.post(`${API_URL}/api/auth/login`, {
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
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
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
      const response = await axios.get(`${API_URL}/api/vehicles`, {
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
      const response = await axios.get(`${API_URL}/api/vehicles/${id}`, {
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
      const response = await axios.post(`${API_URL}/api/vehicles`, vehicleData, {
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
      const response = await axios.put(`${API_URL}/api/vehicles/${id}`, vehicleData, {
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
      await axios.delete(`${API_URL}/api/vehicles/${id}`, {
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
      const response = await axios.get(`${API_URL}/api/services`);
      return response.data;
    } catch (error) {
      console.error('Get services error:', error);
      throw error;
    }
  },

  getServiceById: async (id: number): Promise<Service> => {
    try {
      const response = await axios.get(`${API_URL}/api/services/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Get service ${id} error:`, error);
      throw error;
    }
  },

  getServicesByCategory: async (category: string): Promise<Service[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/services/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Get services by category ${category} error:`, error);
      throw error;
    }
  },

  // Orders with Inspection
  createOrderWithInspection: async (orderData: CreateOrderRequest): Promise<Order> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/orders/CreateWithInspection`, 
        orderData, 
        {
          headers: {
            ...authHeader(),
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  getUserOrders: async (): Promise<Order[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/orders`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  getOrderById: async (id: number): Promise<Order> => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/${id}`, {
        headers: authHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Get order ${id} error:`, error);
      throw error;
    }
  },

  updateOrder: async (id: number, orderData: UpdateOrderRequest): Promise<Order> => {
    try {
      const response = await axios.put(`${API_URL}/api/orders/${id}`, orderData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json'
        }
      });
      return response.data.order;
    } catch (error) {
      console.error(`Update order ${id} error:`, error);
      throw error;
    }
  },

  cancelOrder: async (id: number, notes?: string): Promise<Order> => {
    try {
      return await orderApi.updateOrder(id, { 
        status: 'cancelled', 
        notes: notes || 'Cancelled by customer'
      });
    } catch (error) {
      console.error(`Cancel order ${id} error:`, error);
      throw error;
    }
  }
};

export default orderApi;