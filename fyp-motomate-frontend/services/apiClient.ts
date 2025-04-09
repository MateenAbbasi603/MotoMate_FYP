import axios, { AxiosResponse } from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

// Function to transform response data by removing $ prefix from properties
const transformResponse = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(transformResponse);
  }
  
  if (data && typeof data === 'object') {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Remove $ prefix from keys
      const newKey = key.startsWith('$') ? key.slice(1) : key;
      
      // If the value is 'values' and it's an array, transform its contents
      if (newKey === 'values' && Array.isArray(value)) {
        transformed[newKey] = value.map(transformResponse);
      } else {
        // Recursively transform nested objects/arrays
        transformed[newKey] = transformResponse(value);
      }
    }
    
    // If this object has a 'values' property, return just the values array
    if (transformed.values && Array.isArray(transformed.values)) {
      return transformed.values;
    }
    
    return transformed;
  }
  
  return data;
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
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

// Add response interceptor for data transformation and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Transform the response data
    response.data = transformResponse(response.data);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Transform error response data if it exists
      if (error.response?.data) {
        error.response.data = transformResponse(error.response.data);
      }

      // Handle other errors
      const errorMessage = error.response?.data?.message || 'An error occurred';
      toast.error(errorMessage);
    } else {
      toast.error('An unexpected error occurred');
    }
    return Promise.reject(error);
  }
);

export default apiClient; 