import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

// Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';

// Navigation
import CustomerTabNavigator from './src/navigation/CustomerTabNavigator';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { user, loading } = useAuth();

  console.log('User in AppNavigator:', user);
  console.log('User role in AppNavigator:', user?.role);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        {user ? (
          // Role-based navigation
          user.role?.toLowerCase() === 'customer' ? (
            <Stack.Screen name="CustomerDashboard" component={CustomerTabNavigator} />
          ) : (
            // Admin/Staff navigation (to be implemented)
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
          )
        ) : (
          // Authentication screens
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  CustomerDashboard: undefined;
  ForgotPassword: undefined;
};