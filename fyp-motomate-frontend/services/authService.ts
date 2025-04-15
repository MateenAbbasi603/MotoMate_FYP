// services/authService.ts
import apiClient from './apiClient';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// User type definition
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

// Profile update type
export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  imgUrl?: string;
}

// Password change type
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

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

const authService = {
  // Login user
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', {
      username,
      password
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Register user
  register: async (userData: any) => {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/api/auth/me');
    console.log(response.data);
    
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: UpdateProfileData) => {
    const response = await apiClient.put('/api/auth/update', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordData) => {
    const response = await apiClient.post('/api/auth/change-password', passwordData);
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email: string) => {
    const response = await apiClient.post('/api/auth/reset-password', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/api/auth/reset-password/confirm', {
      token,
      newPassword
    });
    return response.data;
  }
};

export default authService;