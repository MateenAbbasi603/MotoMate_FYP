import apiClient from './apiClient';

export interface DashboardStats {
  totalUsers: number;
  totalMechanics: number;
  totalVehicles: number;
  totalRevenue: number;
  activeAppointments: number;
  completedServices: number;
  pendingIssues: number;
  monthlyGrowth: number;
  mechanicsPerformance: {
    averageRating: number;
    completionRate: number;
  };
  vehicleServices: {
    successRate: number;
  };
  customerSatisfaction: {
    rating: number;
    responseTime: number;
    resolutionRate: number;
  };
}

const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/api/admin/dashboard/stats');
    return response.data;
  },
};

export default adminService; 