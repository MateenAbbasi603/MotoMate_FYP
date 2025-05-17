// app/services/financeService.ts
import axios from "axios";

// Make sure API_URL has a fallback in case environment variable is undefined
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5177";

console.log("API URL:", API_URL);

export interface FinancialSummary {
  totalRevenue: number;
  pendingPayments: number;
  pendingInvoicesCount: number;
  averageInvoice: number;
  percentageChange: number;
}

export interface Invoice {
  invoiceId: number;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  orderId: number;
  notes?: string;
  paidAmount: number;
  itemsCount: number;
  isOverdue: boolean;
}

export interface Payment {
  paymentId: number;
  paymentDate: string;
  amount: number;
  method: string;
  invoiceId: number;
  invoiceTotal: number;
  customer: {
    name: string;
    email: string;
    phone:string
  };
}

export interface MonthlyReport {
  year: number;
  totalRevenue: number;
  invoiceCount: number;
  monthlyData: {
    month: number;
    monthName: string;
    revenue: number;
    count: number;
  }[];
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : { Authorization: '' };
};

// Helper function to extract values from API response
const extractValues = <T>(response: any): T[] => {
  // Check if the response has the $values format
  if (response && response.$values) {
    return response.$values as T[];
  } 
  
  // If response is already an array
  if (Array.isArray(response)) {
    return response as T[];
  }
  
  // If not properly formatted, return empty array
  console.warn("Unexpected response format:", response);
  return [];
};

export const getFinancialSummary = async (): Promise<FinancialSummary> => {
  try {
    console.log(`Calling API: ${API_URL}/api/Finance/summary`);
    const headers = getAuthHeaders();
    console.log("Using headers:", headers);
    
    const response = await fetch(`${API_URL}/api/Finance/summary`, {
      headers
    });
    
    if (!response.ok) {
      console.error("API error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Financial summary response:", data);
    return data;
  } catch (error: any) {
    console.error("Error fetching financial summary:", error);
    throw error;
  }
};

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    console.log(`Calling API: ${API_URL}/api/Finance/invoices`);
    const headers = getAuthHeaders();
    
    const response = await fetch(`${API_URL}/api/Finance/invoices`, {
      headers
    });
    
    if (!response.ok) {
      console.error("API error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Invoices response:", data);
    return extractValues<Invoice>(data);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

export const getPayments = async (): Promise<Payment[]> => {
  try {
    console.log(`Calling API: ${API_URL}/api/Finance/payments`);
    const headers = getAuthHeaders();
    
    const response = await fetch(`${API_URL}/api/Finance/payments`, {
      headers
    });
    
    if (!response.ok) {
      console.error("API error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Payments response:", data);
    return extractValues<Payment>(data);
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    throw error;
  }
};

export const getMonthlyReport = async (year?: number): Promise<MonthlyReport> => {
  try {
    const url = year 
      ? `${API_URL}/api/Finance/reports/monthly?year=${year}` 
      : `${API_URL}/api/Finance/reports/monthly`;
    
    console.log(`Calling API: ${url}`);
    const headers = getAuthHeaders();
    
    const response = await fetch(url, {
      headers
    });
    
    if (!response.ok) {
      console.error("API error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Monthly report response:", data);
    
    // Handle the case where monthlyData has $values format
    if (data && data.monthlyData && data.monthlyData.$values) {
      data.monthlyData = data.monthlyData.$values;
    }
    
    // Ensure the monthlyData is properly formatted with month names
    if (data && data.monthlyData && Array.isArray(data.monthlyData)) {
      // Ensure each month entry has a proper month name
      data.monthlyData = data.monthlyData.map((item: { month: number; monthName?: string; revenue: number; count: number }) => {
        if (!item.monthName || item.monthName === "Invalid Date") {
          const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          return {
            ...item,
            monthName: monthNames[item.month - 1] || `Month ${item.month}`
          };
        }
        return item;
      });
    }
    
    return data;
  } catch (error: any) {
    console.error("Error fetching monthly report:", error);
    throw error;
  }
};