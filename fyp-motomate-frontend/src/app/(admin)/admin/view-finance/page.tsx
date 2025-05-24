"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Clock,
  XCircle,
  BarChart3,
  CalendarRange,
  ArrowUp,
  ArrowDown,
  Filter,
  ReceiptText,
  BadgeCheck,
  CreditCard as CreditCardIcon,
  ExternalLink,
  Search,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Landmark,
  BarChart,
  PercentIcon,
  BarChart2,
  Eye,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AuthGuard from "../../../../../AuthGuard";
import Link from "next/link";
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
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { getReports } from "../../../../../services/reportServie";
import { toast } from "sonner";

// Add these interfaces to your file
interface Report {
  reportId: number;
  reportName: string;
  reportType: string;
  reportCategory: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalTax: number;
  totalInvoices: number;
  generatedAt: string;
  generatedByName: string;
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [apiErrors, setApiErrors] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const searchParams = useSearchParams();
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsSearchTerm, setReportsSearchTerm] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const activeTab = searchParams.get('tab') || 'active';


  const handleTabChange = (value: string) => {
    // Update the URL with the new tab value
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getReports(currentPage, 10);
      setReports(response.reports);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };
  // Add these helper functions for the reports

  // Function to filter reports based on search term and category
  const filteredReports = reports.filter(report => {
    const matchesSearch =
      reportsSearchTerm === "" ||
      report.reportName.toLowerCase().includes(reportsSearchTerm.toLowerCase()) ||
      report.reportType.toLowerCase().includes(reportsSearchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" ||
      report.reportCategory.toLowerCase() === filterCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Function to get color styling based on report category
  const getReportCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'revenue':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900';
      case 'saleswithtax':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
      case 'saleswithouttax':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900';
      case 'tax':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
      case 'expense':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  // Function to get appropriate icon based on report category
  const getReportCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'revenue':
        return <ChevronUp className="h-3 w-3" />;
      case 'saleswithtax':
        return <BarChart className="h-3 w-3" />;
      case 'saleswithouttax':
        return <BarChart2 className="h-3 w-3" />;
      case 'tax':
        return <PercentIcon className="h-3 w-3" />;
      case 'expense':
        return <ChevronDown className="h-3 w-3" />;
      default:
        return <Landmark className="h-3 w-3" />;
    }
  };

  // Function to handle report deletion
  const handleDeleteReport = (reportId: number) => {
    // In production, you would call your API to delete the report
    // For now, we'll just update the state
    setReports(reports.filter(report => report.reportId !== reportId));

    // Recalculate total pages
    const updatedReports = reports.filter(report => report.reportId !== reportId);
    setTotalPages(Math.ceil(updatedReports.length / ITEMS_PER_PAGE));

    // If current page is now empty, go to previous page
    const lastItemOnPage = currentPage * ITEMS_PER_PAGE;
    if (lastItemOnPage > updatedReports.length && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

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
      currency: 'PKR',
      maximumFractionDigits: 0
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
    const status = invoice.status?.toLowerCase();

    if (status === "paid") return "success";
    if (invoice.isOverdue || status === "overdue") return "destructive";
    if (status === "issued") return "warning";
    if (status === "cancelled") return "secondary";
    return "secondary";
  };

  // Get status icon
  const getStatusIcon = (invoice: Invoice) => {
    const status = invoice.status?.toLowerCase();

    if (status === "paid") return <CheckCircle2 className="h-4 w-4" />;
    if (invoice.isOverdue || status === "overdue") return <AlertCircle className="h-4 w-4" />;
    if (status === "issued") return <FileText className="h-4 w-4" />;
    if (status === "cancelled") return <XCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
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

  // Filter invoices by search term and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      searchTerm === "" ||
      invoice.invoiceId.toString().includes(searchTerm) ||
      (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === "all" ||
      invoice.status.toLowerCase() === filterStatus.toLowerCase() ||
      (filterStatus === "overdue" && invoice.isOverdue);

    return matchesSearch && matchesStatus;
  });

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
      <div className="flex flex-col items-center justify-center h-[50vh] bg-background">
        <div className="bg-card rounded-xl p-8 shadow-md border border-border">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Loading Financial Data</h3>
            <p className="text-muted-foreground">Please wait while we retrieve your financial information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="border-destructive/20">
          <CardHeader className="bg-destructive/10 border-b border-destructive/20">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Financial Data
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-6">{error}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => testApi('summary')} className="gap-2">
                <FileText className="h-4 w-4" />
                Test Summary API
              </Button>
              <Button variant="outline" onClick={() => testApi('invoices')} className="gap-2">
                <ReceiptText className="h-4 w-4" />
                Test Invoices API
              </Button>
            </div>
          </CardContent>
        </Card>

        {Object.keys(apiErrors).length > 0 && (
          <Card className="mt-6 border-muted">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-base">API Error Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                <div className="p-4 text-xs">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(apiErrors, null, 2)}</pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "finance_officer"]}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Financial Management</h1>
            <p className="text-muted-foreground">
              Monitor revenue, track payments, and analyze financial performance
            </p>
          </div>
        
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border border-border/50 overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-50/20 dark:from-blue-950/20 dark:to-transparent">
              <CardTitle className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-bold mb-1">{formatCurrency(summary?.totalRevenue ?? 0)}</div>
              <div className="flex items-center">
                <div className={`mr-2 p-1 rounded-full ${summary?.percentageChange && summary.percentageChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {summary?.percentageChange && summary.percentageChange > 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.percentageChange
                    ? `${summary.percentageChange > 0 ? '+' : ''}${Math.abs(summary.percentageChange).toFixed(1)}% from last month`
                    : 'No previous data'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-border/50 overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-50/20 dark:from-amber-950/20 dark:to-transparent">
              <CardTitle className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-bold mb-1">{formatCurrency(summary?.pendingPayments ?? 0)}</div>
              <div className="flex items-center">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {summary?.pendingInvoicesCount ?? 0} invoice{summary?.pendingInvoicesCount !== 1 ? 's' : ''}
                </Badge>
                <p className="text-xs text-muted-foreground ml-2">
                  awaiting payment
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-border/50 overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-50/20 dark:from-green-950/20 dark:to-transparent">
              <CardTitle className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Average Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-bold mb-1">{formatCurrency(summary?.averageInvoice ?? 0)}</div>
              <div className="flex items-center">
                <div className="p-1 rounded-full bg-green-100 text-green-700 mr-2">
                  <Calendar className="h-3 w-3" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on last 30 days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="invoices" value={activeTab}
          onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="invoices" className="gap-2 data-[state=active]:bg-background">
                <ReceiptText className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2 data-[state=active]:bg-background">
                <CreditCardIcon className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-background">
                <BarChart3 className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-0 mt-0">
            <Card className="shadow-sm border border-border/50">
              <CardHeader className="bg-card border-b">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Recent Invoices</CardTitle>
                    <CardDescription>
                      View and manage the latest invoices in the system
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="relative w-[240px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search invoices..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px] gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {invoices.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center border-t rounded-md">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-muted/30 mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">No Invoices Found</h3>
                      <p className="text-muted-foreground mb-4">No invoices are currently in the system</p>
                      <Button variant="outline" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Create New Invoice
                      </Button>
                    </div>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center border-t rounded-md">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-muted/30 mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">No Matching Invoices</h3>
                      <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
                      <Button variant="outline" onClick={() => { setSearchTerm(""); setFilterStatus("all"); }}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-right">Tax</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.invoiceId} className="group cursor-pointer">
                            <TableCell className="font-medium">
                              #{invoice.invoiceId}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{formatDate(invoice.invoiceDate)}</span>
                                <span className="text-xs text-muted-foreground">
                                  Due: {formatDate(invoice.dueDate)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{invoice.customer?.name || 'Unknown'}</span>
                              {invoice.customer?.email && (
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {invoice.customer.email}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(invoice.subTotal)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end">
                                <span>{formatCurrency(invoice.taxAmount)}</span>
                                <span className="text-xs text-muted-foreground">({invoice.taxRate}%)</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(invoice.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1 w-fit shadow-sm
                                  ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                    invoice.isOverdue ? 'bg-red-50 text-red-700 border-red-200' :
                                      invoice.status === 'issued' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        invoice.status === 'cancelled' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                          'bg-blue-50 text-blue-700 border-blue-200'
                                  }`
                                }
                              >
                                {getStatusIcon(invoice)}
                                <span>{getStatusText(invoice)}</span>
                              </Badge>
                              {invoice.isOverdue && !invoice.status?.toLowerCase().includes('paid') && (
                                <div className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Overdue
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>

              {filteredInvoices.length > 0 && (
                <CardFooter className="border-t p-4 flex justify-between bg-muted/10">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredInvoices.length} of {invoices.length} invoices
                  </div>
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    View All Invoices
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-0 mt-0">
            <Card className="shadow-sm border border-border/50">
              <CardHeader className="bg-card border-b">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Payment Records</CardTitle>
                    <CardDescription>
                      Track the latest payment transactions
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <CalendarRange className="h-4 w-4" />
                          <span>This Month</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Today</DropdownMenuItem>
                        <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
                        <DropdownMenuItem>This Month</DropdownMenuItem>
                        <DropdownMenuItem>Last Month</DropdownMenuItem>
                        <DropdownMenuItem>All Time</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {payments.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center border-t rounded-md">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-muted/30 mb-4">
                        <CreditCardIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">No Payment Records</h3>
                      <p className="text-muted-foreground mb-4">No payment records have been recorded yet</p>
                      <Button variant="outline" className="gap-2">
                        <CreditCardIcon className="h-4 w-4" />
                        Record New Payment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead>Payment #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.paymentId} className="group cursor-pointer">
                            <TableCell className="font-medium">
                              #{payment.paymentId}
                            </TableCell>
                            <TableCell>
                              {formatDate(payment.paymentDate)}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{payment.customer.name}</span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1 w-fit shadow-sm 
                                  ${payment.method === 'Cash' ? 'bg-green-50 text-green-700 border-green-200' :
                                    payment.method === 'Credit Card' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      payment.method === 'Bank Transfer' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        'bg-gray-50 text-gray-700 border-gray-200'
                                  }`
                                }
                              >
                                {payment.method === 'Cash' ?
                                  <DollarSign className="h-3 w-3" /> :
                                  payment.method === 'Credit Card' ?
                                    <CreditCardIcon className="h-3 w-3" /> :
                                    <BankIcon className="h-3 w-3" />
                                }
                                <span>{payment.method}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Link href={`/admin/invoices/${payment.invoiceId}`} className="text-primary hover:underline">
                                #{payment.invoiceId}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1 w-fit shadow-sm
                                  ${payment.amount >= payment.invoiceTotal ?
                                    'bg-green-50 text-green-700 border-green-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`
                                }
                              >
                                {payment.amount >= payment.invoiceTotal ?
                                  <BadgeCheck className="h-3 w-3" /> :
                                  <PartialIcon className="h-3 w-3" />
                                }
                                <span>{payment.amount >= payment.invoiceTotal ? "Full Payment" : "Partial"}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>

              {payments.length > 0 && (
                <CardFooter className="border-t p-4 flex justify-between bg-muted/10">
                  <div className="text-sm text-muted-foreground">
                    Showing {payments.length} payment records
                  </div>
                  <Button variant="outline" className="gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    View All Payments
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-0 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Reports
                </CardTitle>
                <CardDescription>
                  View and manage all generated financial reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-muted/30 mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No Reports Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || filterCategory !== 'all' ?
                        'No reports match your current filters' :
                        'Generate your first financial report to get started'
                      }
                    </p>
                    {!searchTerm && filterCategory === 'all' && (
                      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate First Report
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Invoices</TableHead>
                          <TableHead>Generated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report) => (
                          <TableRow key={report.reportId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{report.reportName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {report.reportType} Report
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${getReportCategoryColor(report.reportCategory)} font-medium`}
                              >
                                <span className="flex items-center gap-1">
                                  {getReportCategoryIcon(report.reportCategory)}
                                  {report.reportCategory === 'SalesWithTax' ? 'Sales + Tax' :
                                    report.reportCategory === 'SalesWithoutTax' ? 'Sales - Tax' :
                                      report.reportCategory}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{new Date(report.startDate).toLocaleDateString()}</div>
                                <div className="text-muted-foreground">
                                  to {new Date(report.endDate).toLocaleDateString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">{formatCurrency(report.totalRevenue)}</div>
                              {report.totalTax > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Tax: {formatCurrency(report.totalTax)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">{report.totalInvoices}</div>
                              <div className="text-sm text-muted-foreground">invoices</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{new Date(report.generatedAt).toLocaleDateString()}</div>
                                <div className="text-muted-foreground">
                                  by {report.generatedByName}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link href={`/admin/view-finance/reports/${report.reportId}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteReport(report.reportId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>

              {/* Pagination */}
              {totalPages > 1 && (
                <CardFooter className="border-t flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

// Helper icon components
const BankIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="10" width="18" height="8" rx="2" />
    <rect x="7" y="18" width="10" height="3" />
    <rect x="10" y="21" width="4" height="1" />
    <path d="M12 7V6" />
    <path d="M12 4V3" />
    <path d="m4 10 8-7 8 7" />
  </svg>
);

const PartialIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v20" />
    <path d="M16 20H8" />
    <path d="M16 13.5c-.3-1.5-2-2.5-4-2.5-3 0-5 2-5 6 0 .5 0 1 .1 1.5" />
    <path d="M16 16c1 1 2 1 3 1" />
  </svg>
);