// types/inventoryTypes.ts
export interface InventoryItem {
  toolId: number;
  toolName: string;
  toolType: string;
  condition: string;
  price: number;
  purchaseDate?: string;
  vendorName?: string;
  isActive: boolean;
  totalQuantity: number;
  activeQuantity: number;
  inactiveQuantity: number;
  instances?: ToolInstance[];
}

export interface ToolInstance {
  instanceId: number;
  toolId: number;
  serialNumber: string;
  isActive: boolean;
  createdAt: string;
  lastUpdatedAt?: string;
}

export interface InventoryFormData {
  toolName: string;
  toolType: string;
  quantity: number;
  purchaseDate?: Date;
  condition: string;
  price: number;
  vendorName?: string;
}