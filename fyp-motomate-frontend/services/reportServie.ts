import apiClient from "./apiClient";

export interface GenerateReportRequest {
  reportType: 'Weekly' | 'Monthly' | 'Yearly';
  reportCategory: 'Sales' | 'SalesWithTax' | 'SalesWithoutTax' | 'Inventory';
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface ReportSummary {
  reportId: number;
  reportName: string;
  reportType: string;
  reportCategory: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalTax: number;
  netRevenue: number;
  totalInvoices: number;
  generatedAt: string;
  generatedByName: string;
}

export interface DetailedReport extends ReportSummary {
  totalItems: number;
  inventoryValue: number;
  notes?: string;
  reportData: any;
}

export interface ReportsResponse {
  reports: ReportSummary[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// Get all reports with pagination
export const getReports = async (page = 1, pageSize = 10): Promise<ReportsResponse> => {
  const response = await apiClient.get(`/api/Reports?page=${page}&pageSize=${pageSize}`);
  return response.data;
};

// Get detailed report by ID
export const getReportById = async (id: number): Promise<DetailedReport> => {
  const response = await apiClient.get(`/api/Reports/${id}`);
  return response.data;
};

// Generate new report
export const generateReport = async (request: GenerateReportRequest): Promise<DetailedReport> => {
  const response = await apiClient.post('/api/Reports/generate', request);
  return response.data;
};

// Delete report
export const deleteReport = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/Reports/${id}`);
};

// Helper function to get date ranges for quick selection
export const getDateRanges = () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  endOfYear.setHours(23, 59, 59, 999);

  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(startOfWeek.getDate() - 7);
  const lastWeekEnd = new Date(endOfWeek);
  lastWeekEnd.setDate(endOfWeek.getDate() - 7);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);

  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
  lastYearEnd.setHours(23, 59, 59, 999);

  return {
    thisWeek: { start: startOfWeek, end: endOfWeek },
    thisMonth: { start: startOfMonth, end: endOfMonth },
    thisYear: { start: startOfYear, end: endOfYear },
    lastWeek: { start: lastWeekStart, end: lastWeekEnd },
    lastMonth: { start: lastMonthStart, end: lastMonthEnd },
    lastYear: { start: lastYearStart, end: lastYearEnd }
  };
};

// Format date for API
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount);
};