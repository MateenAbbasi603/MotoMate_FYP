import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from './src/services/apiService';


interface User {
  userId: number;
  username: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  address?: string;
  imgUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

interface SignupData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // Set the token in API service
        apiService.setAuthToken(token);
        
        // Get user profile
        const response = await apiService.getCurrentUser();
        if (response.success) {
          setUser(response.data);
        } else {
          // Token is invalid, remove it
          await SecureStore.deleteItemAsync('authToken');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await SecureStore.deleteItemAsync('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiService.login({ username, password });
      
      if (response.success && response.data) {
        // Store token securely
        await SecureStore.setItemAsync('authToken', response.data.token);
        
        // Set token in API service
        apiService.setAuthToken(response.data.token);
        
        // Set user data
        setUser(response.data.user);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.message || 'Login failed' 
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Network error occurred' 
      };
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      const response = await apiService.register({
        username: userData.username,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        email: userData.email,
        name: userData.name,
        phone: userData.phone || '',
        address: userData.address || '',
        role: 'customer'
      });
      
      if (response.success && response.data) {
        // Store token securely
        await SecureStore.setItemAsync('authToken', response.data.token);
        
        // Set token in API service
        apiService.setAuthToken(response.data.token);
        
        // Set user data
        setUser(response.data.user);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.message || 'Registration failed' 
        };
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Network error occurred' 
      };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      apiService.removeAuthToken();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout
    }}>
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