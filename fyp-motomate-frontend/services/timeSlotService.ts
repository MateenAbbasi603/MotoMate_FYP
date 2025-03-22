// services/timeSlotService.ts
import axios from 'axios';

export interface TimeSlotInfo {
  timeSlot: string;
  availableSlots: number;
  totalSlots: number;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const timeSlotService = {
  getAvailableTimeSlots: async (date: Date): Promise<string[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const response = await axios.get(`${API_URL}/api/TimeSlots/Available`, {
        params: { date: formattedDate },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        return response.data.availableSlots;
      } else {
        throw new Error(response.data.message || 'Failed to fetch available time slots');
      }
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw error;
    }
  },

  getTimeSlotsInfo: async (date: Date): Promise<TimeSlotInfo[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const response = await axios.get(`${API_URL}/api/TimeSlots/Info`, {
        params: { date: formattedDate },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        return response.data.timeSlotInfos;
      } else {
        throw new Error(response.data.message || 'Failed to fetch time slot information');
      }
    } catch (error) {
      console.error('Error fetching time slot information:', error);
      throw error;
    }
  },

  isTimeSlotAvailable: async (date: Date, timeSlot: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const response = await axios.get(`${API_URL}/api/TimeSlots/IsAvailable`, {
        params: { 
          date: formattedDate,
          timeSlot
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        return response.data.isAvailable;
      } else {
        throw new Error(response.data.message || 'Failed to check time slot availability');
      }
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw error;
    }
  },
  
  getTimeSlotAvailableCount: async (date: Date, timeSlot: string): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const response = await axios.get(`${API_URL}/api/TimeSlots/IsAvailable`, {
        params: { 
          date: formattedDate,
          timeSlot
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        return response.data.availableCount;
      } else {
        throw new Error(response.data.message || 'Failed to get time slot available count');
      }
    } catch (error) {
      console.error('Error getting time slot available count:', error);
      return 0;
    }
  }
};

export default timeSlotService;