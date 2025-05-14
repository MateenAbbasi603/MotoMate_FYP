"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, FileText, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthGuard from "../../../../../AuthGuard";
import {
  getFinancialSummary,
  getInvoices,
  getPayments,
  getMonthlyReport,
  FinancialSummary,
  Invoice,
  Payment,
  MonthlyReport
} from "@/app/services/financeService";
import { format, parseISO } from "date-fns";

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [apiErrors, setApiErrors] = useState<Record<string, any>>({});

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Log the API URL for debugging
  useEffect(() => {
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setApiErrors({});

        // Fetch data from API
        const summaryData = await getFinancialSummary().catch(err => {
          console.error("Error fetching summary:", err);
          setApiErrors(prev => ({ ...prev, summary: err }));
          return null;
        });

        const invoicesData = await getInvoices().catch(err => {
          console.error("Error fetching invoices:", err);
          setApiErrors(prev => ({ ...prev, invoices: err }));
          return [];
        });

        const paymentsData = await getPayments().catch(err => {
          console.error("Error fetching payments:", err);
          setApiErrors(prev => ({ ...prev, payments: err }));
          return [];
        });

        const reportData = await getMonthlyReport(parseInt(selectedYear)).catch(err => {
          console.error("Error fetching report:", err);
          setApiErrors(prev => ({ ...prev, report: err }));
          return null;
        });

        console.log("Fetched data:", { summaryData, invoicesData, paymentsData, reportData });

        if (summaryData) setSummary(summaryData);
        if (Array.isArray(invoicesData) && invoicesData.length > 0) setInvoices(invoicesData);
        if (Array.isArray(paymentsData) && paymentsData.length > 0) setPayments(paymentsData);

        // Check if reportData has the expected structure
        if (reportData && reportData.monthlyData && Array.isArray(reportData.monthlyData)) {
          setReport(reportData);
        } else if (reportData) {
          console.log("Report data has unexpected format:", reportData);

          // If monthlyData is not an array, create a compatible structure
          if (reportData.monthlyData && !Array.isArray(reportData.monthlyData)) {
            const fixedReport = {
              ...reportData,
              monthlyData: Object.entries(reportData.monthlyData).map(([key, value]: [string, any]) => ({
                month: parseInt(key),
                monthName: new Date(parseInt(selectedYear), parseInt(key) - 1, 1).toLocaleString('default', { month: 'long' }),
                revenue: value.revenue || 0,
                count: value.count || 0
              }))
            };
            setReport(fixedReport);
          }
        }

      } catch (error: any) {
        console.error("Error fetching finance data:", error);
        setError(error?.message || "Failed to load financial data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // Format number as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  // Format date safely
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A";

      // Check if it's already in a readable format (like "2025-05-13")
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Parse YYYY-MM-DD format
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      // Try to parse with parseISO if it's an ISO date string
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error("Date formatting error:", error, dateString);
      return "Invalid date";
    }
  };
  // Get status badge variant
  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.status === "paid") return "default";
    if (invoice.isOverdue || invoice.status === "overdue") return "destructive";
    if (invoice.status === "cancelled") return "secondary";
    return "secondary";
  };

  // Get status text
  const getStatusText = (invoice: Invoice) => {
    if (invoice.status === "paid") return "Paid";
    if (invoice.isOverdue) return "Overdue";
    return invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  // Testing function to check API directly
  const testApi = async (endpoint: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Finance/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log(`API test (${endpoint}):`, data);
      alert(`API response received. Check console for details.`);
    } catch (error) {
      console.error(`API test failed (${endpoint}):`, error);
      alert(`API test failed: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="mb-6">
          <Button onClick={() => window.location.reload()} className="mr-2">Retry</Button>
          <Button variant="outline" onClick={() => testApi('summary')} className="mr-2">Test Summary API</Button>
          <Button variant="outline" onClick={() => testApi('invoices')}>Test Invoices API</Button>
        </div>

        {Object.keys(apiErrors).length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-2">API Errors</h3>
            <div className="p-4 bg-gray-100 rounded-md overflow-auto max-h-[400px] text-xs">
              <pre>{JSON.stringify(apiErrors, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "finance_officer"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
            <p className="text-muted-foreground">
              View and manage financial data, invoices, and payment records.
            </p>
          </div>
          <div>
            <Button variant="outline" onClick={() => testApi('summary')} className="mr-2">Test API</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue ?? 0)}</div>
              <p className="text-xs text-muted-foreground">
                {summary?.percentageChange
                  ? `${summary.percentageChange > 0 ? '+' : ''}${summary.percentageChange.toFixed(1)}% from last month`
                  : 'No previous data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary?.pendingPayments ?? 0)}</div>
              <p className="text-xs text-muted-foreground">
                {summary?.pendingInvoicesCount ?? 0} invoices awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary?.averageInvoice ?? 0)}</div>
              <p className="text-xs text-muted-foreground">
                Based on last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="reports">Financial Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>
                  View and manage the latest 20 invoices in the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center border rounded-md">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2">No invoices found in the system</p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>Tax</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.invoiceId}>
                            <TableCell className="font-medium">#{invoice.invoiceId}</TableCell>
                            <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                            <TableCell>
                              {formatDate(invoice.dueDate)}
                              {invoice.isOverdue && (
                                <span className="ml-2 text-destructive">
                                  <AlertCircle className="h-4 w-4 inline" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{invoice.customer?.name || 'Unknown'}</TableCell>
                            <TableCell>{formatCurrency(invoice.subTotal)}</TableCell>
                            <TableCell>{formatCurrency(invoice.taxAmount)} ({invoice.taxRate}%)</TableCell>
                            <TableCell className="font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(invoice)}>
                                {getStatusText(invoice)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Records</CardTitle>
                <CardDescription>
                  Track the latest 20 payment transactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center border rounded-md">
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2">No payment records found</p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.paymentId}>
                            <TableCell className="font-medium">#{payment.paymentId}</TableCell>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>{payment.customer.name}</TableCell>
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>#{payment.invoiceId}</TableCell>
                            <TableCell>
                              <Badge variant={payment.amount >= payment.invoiceTotal ? "default" : "secondary"}>
                                {payment.amount >= payment.invoiceTotal ? "Full Payment" : "Partial"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Financial Reports</CardTitle>
                  <CardDescription>
                    Monthly breakdown of revenue for selected year.
                  </CardDescription>
                </div>
                <div className="w-36">
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {!report || !report.monthlyData || !Array.isArray(report.monthlyData) ? (
                  <div className="h-[300px] flex items-center justify-center border rounded-md">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2">No financial report data available for {selectedYear}</p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Invoices</TableHead>
                          <TableHead>Avg. per Invoice</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.monthlyData.map((month) => (
                          <TableRow key={month.month}>
                            <TableCell className="font-medium">{month.monthName}</TableCell>
                            <TableCell>{formatCurrency(month.revenue)}</TableCell>
                            <TableCell>{month.count}</TableCell>
                            <TableCell>
                              {month.count > 0
                                ? formatCurrency(month.revenue / month.count)
                                : '-'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-bold">Total</TableCell>
                          <TableCell className="font-bold">{formatCurrency(report.totalRevenue)}</TableCell>
                          <TableCell className="font-bold">{report.invoiceCount}</TableCell>
                          <TableCell className="font-bold">
                            {report.invoiceCount > 0
                              ? formatCurrency(report.totalRevenue / report.invoiceCount)
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}