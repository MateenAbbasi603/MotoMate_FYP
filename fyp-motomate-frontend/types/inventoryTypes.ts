// services/types/inventoryTypes.ts

export interface InventoryItem {
    toolId: number;
    toolName: string;
    toolType: string;
    quantity: number;
    purchaseDate?: string; // Optional because it can be null
    condition: string;
    price: number;
    vendorName: string;
  }
  
  export interface InventoryFormData {
    toolName: string;
    toolType: string;
    quantity: number;
    purchaseDate?: string;
    condition: string;
    price: number;
    vendorName: string;
  }