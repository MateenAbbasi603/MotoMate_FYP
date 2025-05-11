import axios from 'axios';
import { Notification } from '../types/notifications';

// Create axios instance
const API = axios.create({
    baseURL: 'http://localhost:5177',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Get all notifications for the logged-in user
export const getNotifications = async (): Promise<Notification[]> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await API.get('/api/notifications');
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

// Get only unread notifications
export const getUnreadNotifications = async (): Promise<Notification[]> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await API.get('/api/notifications/unread');
        return response.data;
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        throw error;
    }
};

// Mark a notification as read
export const markNotificationAsRead = async (
    notificationId: number
): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        await API.put(`/api/notifications/${notificationId}/markasread`);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        await API.put('/api/notifications/markallasread');
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

// Delete a notification
export const deleteNotification = async (
    notificationId: number
): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }

        await API.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};