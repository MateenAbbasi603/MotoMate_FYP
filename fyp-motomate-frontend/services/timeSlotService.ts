// services/timeSlotService.ts
import apiClient from './apiClient';

export interface TimeSlotInfo {
  timeSlot: string;
  availableSlots: number;
  totalSlots: number;
}

export const timeSlotService = {
  getAvailableTimeSlots: async (date: Date): Promise<string[]> => {
    const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const response = await apiClient.get('/api/TimeSlots/Available', {
      params: { date: formattedDate }
    });

    if (response.data.success) {
      return response.data.availableSlots;
    } else {
      throw new Error(response.data.message || 'Failed to fetch available time slots');
    }
  },

  getTimeSlotsInfo: async (date: Date): Promise<TimeSlotInfo[]> => {
    const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const response = await apiClient.get('/api/TimeSlots/Info', {
      params: { date: formattedDate }
    });

    if (response.data.success) {
      return response.data.timeSlotInfos;
    } else {
      throw new Error(response.data.message || 'Failed to fetch time slot information');
    }
  },

  isTimeSlotAvailable: async (date: Date, timeSlot: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const response = await apiClient.get('/api/TimeSlots/IsAvailable', {
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
      
      const response = await apiClient.get('/api/TimeSlots/IsAvailable', {
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