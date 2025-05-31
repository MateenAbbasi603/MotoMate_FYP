// services/adminService.ts - Update to handle $values arrays
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

export interface MechanicsPerformance {
    averageRating: number;
    completionRate: number;
}

export interface VehicleServices {
    successRate: number;
}

export interface CustomerSatisfaction {
    rating: number;
    responseTime: number;
    resolutionRate: number;
}

export interface DashboardStats {
    totalUsers: number;
    totalMechanics: number;
    totalVehicles: number;
    totalRevenue: number;
    activeAppointments: number;
    completedServices: number;
    pendingIssues: number;
    monthlyGrowth: number;
    mechanicsPerformance: MechanicsPerformance;
    vehicleServices: VehicleServices;
    customerSatisfaction: CustomerSatisfaction;
}

export interface RecentOrder {
    orderId: number;
    customerName: string;
    customerEmail: string;
    vehicleInfo: string;
    licensePlate: string;
    serviceName: string;
    status: string;
    amount: number;
    orderDate: string;
    includesInspection: boolean;
}

export interface UpcomingAppointment {
    appointmentId: number;
    customerName: string;
    mechanicName: string;
    vehicleInfo: string;
    licensePlate: string;
    serviceName: string;
    appointmentDate: string;
    timeSlot: string;
    status: string;
}

export interface TopMechanic {
    mechanicId: number;
    name: string;
    phone: string;
    completedJobs: number;
    totalJobs: number;
    rating: number;
}

export interface RecentInvoice {
    invoiceId: number;
    customerName: string;
    amount: number;
    status: string;
    invoiceDate: string;
    dueDate: string;
}

export interface FinancialSummary {
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    pendingPayments: number;
    totalInvoices: number;
    paidInvoices: number;
    paymentRate: number;
}

export interface SystemStats {
    totalServices: number;
    totalInspections: number;
    activeUsers: number;
    staffMembers: number;
}

export interface AdminDashboardResponse {
    success: boolean;
    stats: DashboardStats;
    recentActivities: {
        orders: RecentOrder[];
        appointments: UpcomingAppointment[];
        invoices: RecentInvoice[];
    };
    topMechanics: TopMechanic[];
    financialSummary: FinancialSummary;
    systemStats: SystemStats;
}

class AdminDashboardService {
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };
    }

    // Helper function to extract arrays from $values structure
    private extractArray(data: any): any[] {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && data.$values && Array.isArray(data.$values)) {
            return data.$values;
        }
        return [];
    }

    async getDashboardStats(): Promise<AdminDashboardResponse> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/Dashboard/admin`,
                this.getAuthHeaders()
            );

            console.log('Raw admin dashboard response:', response.data);

            // Handle the response and extract arrays from $values if needed
            const data = response.data;

            // Process the response to handle $values arrays
            const processedData: AdminDashboardResponse = {
                success: data.success,
                stats: data.stats,
                recentActivities: {
                    orders: this.extractArray(data.recentActivities?.orders),
                    appointments: this.extractArray(data.recentActivities?.appointments),
                    invoices: this.extractArray(data.recentActivities?.invoices)
                },
                topMechanics: this.extractArray(data.topMechanics),
                financialSummary: data.financialSummary,
                systemStats: data.systemStats
            };

            console.log('Processed admin dashboard data:', processedData);
            return processedData;
        } catch (error: any) {
            console.error('Error fetching admin dashboard:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            throw error;
        }
    }
}

const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;