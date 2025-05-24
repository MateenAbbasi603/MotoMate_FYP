// services/toolInstanceService.ts
import { ToolInstance } from '../types/inventoryTypes';
import apiClient from './apiClient';

const toolInstanceService = {
  // Update tool instance status (active/inactive)
  updateToolInstanceStatus: async (instanceId: number, isActive: boolean): Promise<ToolInstance> => {
    try {
      const response = await apiClient.put(`/api/Inventory/Instance/${instanceId}`, {
        isActive
      });
      return response.data.instance || response.data; // Handle both response formats
    } catch (error) {
      console.error(`Error updating tool instance status ${instanceId}:`, error);
      throw error;
    }
  }
};

export default toolInstanceService;