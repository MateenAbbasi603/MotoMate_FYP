import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/apiService';
import { AxiosError } from 'axios';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await apiService.getCurrentUser();
        if (response.success) {
          setUser(response.data);
        } else {
          await SecureStore.deleteItemAsync('token');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login...');

      const response = await apiService.login({ username, password });

      if (response.success && response.data?.token) {
        await SecureStore.setItemAsync('token', response.data.token);
        const userResponse = await apiService.getCurrentUser();
        if (userResponse.success) {
          setUser(userResponse.data);
          return { success: true };
        } else {
          await SecureStore.deleteItemAsync('token');
          setUser(null);
          return { success: false, message: userResponse.message || 'Failed to fetch user data after login' };
        }
      } else {
         return { 
          success: false, 
          message: response.message || 'Login failed. Please check your credentials.' 
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
       if (error.message?.includes('Network error')) {
        return { 
          success: false, 
          message: 'Unable to connect to server. Please ensure the backend server is running and accessible.' 
        };
      }
      // Handle Axios error structure and other potential errors
      const axiosError = error as AxiosError<{ message?: string }>;
      return { 
        success: false, 
        message: axiosError.response?.data?.message || error.message || 'An unexpected error occurred' 
      };
    }
  };

  const signup = async (userData: any) => {
    try {
       console.log('Attempting registration...');

      const response = await apiService.register(userData);
      if (response.success) {
        return { success: true };
      }
       return { success: false, message: response.message || 'Registration failed. Please try again.' };
    } catch (error: any) {
      console.error('Signup error:', error);
       if (error.message?.includes('Network error')) {
        return { 
          success: false, 
          message: 'Unable to connect to server. Please ensure the backend server is running and accessible.' 
        };
      }
       // Handle Axios error structure and other potential errors
       const axiosError = error as AxiosError<{ message?: string }>;
      return { 
        success: false, 
        message: axiosError.response?.data?.message || error.message || 'An unexpected error occurred' 
      };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 