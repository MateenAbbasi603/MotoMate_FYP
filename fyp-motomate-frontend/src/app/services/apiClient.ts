import axios, { AxiosResponse } from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

// Function to transform response data by removing $ prefix from properties
const transformResponse = (data: any): any => {
  // ... existing code ...
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  },
  withCredentials: true, // Enable sending cookies in cross-origin requests
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage only on client side
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

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Handle unauthorized access
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient; 