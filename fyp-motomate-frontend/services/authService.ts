// services/authService.ts
import axios from 'axios';

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
}

// Profile update type
export interface UpdateProfileData {
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
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
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: authHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData: UpdateProfileData): Promise<any> => {
    try {
      const response = await axios.put(`${API_URL}/api/auth/update`, userData, {
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordData): Promise<any> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/change-password`,
        passwordData,
        {
          headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<any> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/reset-password`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  // Log out user
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};

export default authService;