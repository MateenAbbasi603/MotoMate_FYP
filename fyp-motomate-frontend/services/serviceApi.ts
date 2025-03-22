// services/serviceApi.ts
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

// Service type definition
export interface Service {
  serviceId: number;
  serviceName: string;
  category: 'repair' | 'maintenance' | 'inspection';
  price: number;
  description: string;
}

// Service creation/update type
export interface ServiceFormData {
  serviceName: string;
  category: 'repair' | 'maintenance' | 'inspection';
  price: number;
  description: string;
}

const serviceApi = {
  // Get all services (accessible to everyone)
  getAllServices: async (): Promise<Service[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/services`);
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Get service by ID (accessible to everyone)
  getServiceById: async (id: number): Promise<Service> => {
    try {
      const response = await axios.get(`${API_URL}/api/services/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching service ${id}:`, error);
      throw error;
    }
  },

  // Create new service (admin only)
  createService: async (serviceData: ServiceFormData): Promise<Service> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/services`,
        serviceData,
        {
          headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  // Update existing service (admin only)
  updateService: async (id: number, serviceData: ServiceFormData): Promise<Service> => {
    try {
      const response = await axios.put(
        `${API_URL}/api/services/${id}`,
        serviceData,
        {
          headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.service;
    } catch (error) {
      console.error(`Error updating service ${id}:`, error);
      throw error;
    }
  },

  // Delete service (admin only)
  deleteService: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/api/services/${id}`, {
        headers: authHeader(),
      });
    } catch (error) {
      console.error(`Error deleting service ${id}:`, error);
      throw error;
    }
  },

  // Get services by category (accessible to everyone)
  getServicesByCategory: async (category: string): Promise<Service[]> => {
    try {
      const response = await axios.get(
        `${API_URL}/api/services/category/${category}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching services in category ${category}:`, error);
      throw error;
    }
  },
};

export default serviceApi;