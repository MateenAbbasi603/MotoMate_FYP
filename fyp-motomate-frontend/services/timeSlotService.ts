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
    try {
      // Make sure we're only passing the date portion to avoid timezone issues
      const dateISO = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0 // Set to noon to avoid timezone issues
      ).toISOString();
      
      console.log("Fetching time slots for date ISO:", dateISO);
      console.log("Date object being used:", date);

      const formattedDate = dateISO.split('T')[0]; // Format as YYYY-MM-DD

      console.log(`Requesting time slots for date: ${formattedDate}`);
      
      const response = await apiClient.get('/api/TimeSlots/Info', {
        params: { date: formattedDate }
      });

      if (response.data.success) {
        // Add extra logging to inspect the response
        console.log("Time slots data received:", response.data);
        return response.data.timeSlotInfos;
      } else {
        throw new Error(response.data.message || 'Failed to fetch time slot information');
      }
    } catch (error) {
      console.error("Error in getTimeSlotsInfo:", error);
      return []; // Return empty array instead of throwing to avoid disrupting the UI
    }
  },

  isTimeSlotAvailable: async (date: Date, timeSlot: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Make sure we're only passing the date portion to avoid timezone issues
      const dateISO = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0 // Set to noon to avoid timezone issues
      ).toISOString();
      
      const formattedDate = dateISO.split('T')[0]; // Format as YYYY-MM-DD

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

      // Make sure we're only passing the date portion to avoid timezone issues
      const dateISO = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0 // Set to noon to avoid timezone issues
      ).toISOString();
      
      const formattedDate = dateISO.split('T')[0]; // Format as YYYY-MM-DD

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