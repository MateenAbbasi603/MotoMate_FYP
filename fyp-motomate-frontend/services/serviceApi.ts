// services/serviceApi.ts
import apiClient from './apiClient';

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
  subCategory:string;
}

// Service creation/update type
export interface ServiceFormData {
  serviceName: string;
  category: 'repair' | 'maintenance' | 'inspection';
  price: number;
  description: string;
  subCategory:string | undefined
}

const serviceApi = {
  // Get all services (accessible to everyone)
  getAllServices: async (): Promise<Service[]> => {
    const response = await apiClient.get('/api/services');
    return response.data;
  },

  // Get service by ID (accessible to everyone)
  getServiceById: async (id: number): Promise<Service> => {
    const response = await apiClient.get(`/api/services/${id}`);
    return response.data;
  },

  // Create new service (admin only)
  createService: async (serviceData: ServiceFormData): Promise<Service> => {
    const response = await apiClient.post('/api/services', serviceData);
    return response.data;
  },

  // Update existing service (admin only)
  updateService: async (id: number, serviceData: ServiceFormData): Promise<Service> => {
    const response = await apiClient.put(`/api/services/${id}`, serviceData);
    return response.data;
  },

  // Delete service (admin only)
  deleteService: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/services/${id}`);
  },

  // Get services by category (accessible to everyone)
  getServicesByCategory: async (category: string): Promise<Service[]> => {
    const response = await apiClient.get(`/api/services/category/${category}`);
    return response.data;
  },
};

export default serviceApi;