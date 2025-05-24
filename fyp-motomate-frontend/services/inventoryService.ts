// services/inventoryService.ts
import { InventoryFormData, InventoryItem } from '../types/inventoryTypes';
import apiClient from './apiClient';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const inventoryService = {
  // Get all inventory items
  getAllInventory: async (): Promise<InventoryItem[]> => {
    try {
      const response = await apiClient.get('/api/Inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Get a specific inventory item by ID
  getInventoryById: async (id: number): Promise<InventoryItem> => {
    try {
      const response = await apiClient.get(`/api/Inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory item ${id}:`, error);
      throw error;
    }
  },

  // Create a new inventory item
  createInventory: async (inventoryData: InventoryFormData): Promise<InventoryItem> => {
    try {
      const response = await apiClient.post('/api/Inventory', inventoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  // Update an existing inventory item
  updateInventory: async (id: number, inventoryData: any): Promise<InventoryItem> => {
    try {
      const response = await apiClient.put(`/api/Inventory/${id}`, {
        toolId: id,
        ...inventoryData
      });
      return response.data.inventory || response.data; // Handle both response formats
    } catch (error) {
      console.error(`Error updating inventory item ${id}:`, error);
      throw error;
    }
  },
  
  // Toggle inventory active/inactive status
  toggleInventoryActive: async (id: number): Promise<InventoryItem> => {
    try {
      const response = await apiClient.put(`/api/Inventory/ToggleActive/${id}`, {});
      return response.data;
    } catch (error) {
      console.error(`Error toggling inventory item status ${id}:`, error);
      throw error;
    }
  },

  // This is now just marking it as inactive, not actually deleting
  deleteInventory: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/Inventory/${id}`);
    } catch (error) {
      console.error(`Error deactivating inventory item ${id}:`, error);
      throw error;
    }
  }
};

export default inventoryService;