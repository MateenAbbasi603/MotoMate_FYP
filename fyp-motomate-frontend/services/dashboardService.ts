// services/dashboardService.ts
import axios from 'axios';

const API_BASE_URL =`${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

export interface UserInfo {
  userId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  imgUrl: string;
}

export interface Vehicle {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  createdAt?: string;
}

export interface Service {
  serviceId: number;
  serviceName: string;
  category: string;
  price: number;
  description: string;
  subCategory: string;
}



export interface Order {
  orderId: number;
  userId: number;
  vehicleId: number;
  serviceId?: number;
  includesInspection: boolean;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes: string;
  invoiceId?: number;
  invoiceStatus?: string;
  vehicle?: Vehicle;
  service?: Service;
  additionalServices: Service[];
}

export interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  totalSpent: number;
  totalVehicles: number;
}

export interface CustomerDashboardResponse {
  success: boolean;
  user: UserInfo;
  orders: Order[];
  recentOrders: Order[];
  vehicles: Vehicle[];
  stats: DashboardStats;
}

class DashboardService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  async getCustomerDashboard(): Promise<CustomerDashboardResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/CustomerDashboard`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customer dashboard:', error);
      throw error;
    }
  }
}

const dashboardService = new DashboardService();
export default dashboardService;