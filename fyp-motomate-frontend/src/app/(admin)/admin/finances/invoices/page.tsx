"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  FileText, 
  Loader2, 
  AlertCircle, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Filter,
  ReceiptText,
  Search,
  ExternalLink,
  Download,
  Plus,
  Clock,
  Calendar,
  ArrowLeft,
  Printer,
  MoreHorizontal,
  Eye,
  Mail,
  FileCog,
  FileX,
  BadgeCheck,
  BarChart3
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getInvoices,
  Invoice
} from "@/app/services/financeService";
import { format, parseISO, isAfter } from "date-fns";
import AuthGuard from "../../../../../../AuthGuard";

interface InvoiceFilters {
  status: string;
  dateRange: string;
  search: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [apiErrors, setApiErrors] = useState<Record<string, any>>({});
  
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: searchParams.get('filter') || 'all',
    dateRange: 'all',
    search: ''
  });
  
  const [selectedTab, setSelectedTab] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setApiErrors({});

        // Fetch invoices from API
        const invoicesData = await getInvoices().catch(err => {
          console.error("Error fetching invoices:", err);
          setApiErrors(prev => ({ ...prev, invoices: err }));
          return [];
        });

        if (Array.isArray(invoicesData) && invoicesData.length > 0) {
          // Add an isOverdue property if it doesn't exist
          const processedInvoices = invoicesData.map(invoice => ({
            ...invoice,
            isOverdue: invoice.isOverdue === undefined ? 
              (invoice.status.toLowerCase() !== 'paid' && 
               invoice.status.toLowerCase() !== 'cancelled' && 
               isAfter(new Date(), parseISO(invoice.dueDate))) : 
              invoice.isOverdue
          }));
          setInvoices(processedInvoices);
        }

      } catch (error: any) {
        console.error("Error fetching invoices data:", error);
        setError(error?.message || "Failed to load invoice data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Update the selected tab when status filter changes
    if (filters.status === 'all' || filters.status === 'pending' || 
        filters.status === 'paid' || filters.status === 'overdue') {
      setSelectedTab(filters.status);
    }
  }, [filters.status]);

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

  // Calculate due days
  const calculateDueDays = (dueDate: string) => {
    try {
      const due = parseISO(dueDate);
      const today = new Date();
      
      if (isNaN(due.getTime())) {
        return null;
      }
      
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.error("Due date calculation error:", error);
      return null;
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

  // Filter invoices based on current filters
  const filteredInvoices = invoices.filter(invoice => {
    // Filter by status
    const matchesStatus = 
      filters.status === "all" || 
      invoice.status.toLowerCase() === filters.status.toLowerCase() ||
      (filters.status === "overdue" && invoice.isOverdue);
    
    // Filter by search term
    const matchesSearch = 
      filters.search === "" || 
      invoice.invoiceId.toString().includes(filters.search) ||
      (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(filters.search.toLowerCase()));
    
    // Filter by date range
    let matchesDateRange = true;
    if (filters.dateRange === "today") {
      matchesDateRange = format(parseISO(invoice.invoiceDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    } else if (filters.dateRange === "week") {
      const today = new Date();
      const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      const invoiceDate = parseISO(invoice.invoiceDate);
      matchesDateRange = isAfter(invoiceDate, oneWeekAgo);
    } else if (filters.dateRange === "month") {
      const today = new Date();
      const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      const invoiceDate = parseISO(invoice.invoiceDate);
      matchesDateRange = isAfter(invoiceDate, oneMonthAgo);
    }
    
    return matchesStatus && matchesSearch && matchesDateRange;
  });

  // Group invoices by status for statistics
  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(invoice => invoice.status.toLowerCase() === "paid").length,
    pending: invoices.filter(invoice => 
      invoice.status.toLowerCase() === "issued" && !invoice.isOverdue).length,
    overdue: invoices.filter(invoice => invoice.isOverdue).length,
    cancelled: invoices.filter(invoice => invoice.status.toLowerCase() === "cancelled").length,
  };

  // Calculate total values
  const totalValues = {
    all: invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    paid: invoices
      .filter(invoice => invoice.status.toLowerCase() === "paid")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    pending: invoices
      .filter(invoice => invoice.status.toLowerCase() === "issued" && !invoice.isOverdue)
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    overdue: invoices
      .filter(invoice => invoice.isOverdue)
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0),
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTabChange = (value: string) => {
    // Update the status filter when tab changes
    handleFilterChange('status', value);
  };

  // Handle row click to view invoice details
  const handleRowClick = (invoiceId: number) => {
    router.push(`/admin/finance/invoices/${invoiceId}`);
  };

  // Testing function to check API directly
  const testApi = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Finance/invoices`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log(`API test:`, data);
      alert(`API response received. Check console for details.`);
    } catch (error) {
      console.error(`API test failed:`, error);
      alert(`API test failed: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] bg-background">
        <div className="bg-card rounded-xl p-8 shadow-md border border-border">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Loading Invoices</h3>
            <p className="text-muted-foreground">Please wait while we retrieve your invoice data...</p>
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
              Error Loading Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-6">{error}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" onClick={testApi} className="gap-2">
                <FileText className="h-4 w-4" />
                Test Invoices API
              </Button>
              <Link href="/admin/finance">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "finance_officer"]}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/admin/finance">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
              <p className="text-muted-foreground">
                View, filter, and manage all invoice records
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            
            <Button variant="outline" className="gap-2 shadow-sm">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{invoiceStats.total}</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">
                {formatCurrency(totalValues.all)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-green-200 dark:border-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                Paid
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{invoiceStats.paid}</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">
                {formatCurrency(totalValues.paid)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{invoiceStats.pending}</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">
                {formatCurrency(totalValues.pending)}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{invoiceStats.overdue}</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">
                {formatCurrency(totalValues.overdue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-sm">
          <Tabs 
            defaultValue={selectedTab} 
            value={selectedTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 border-b gap-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-background">
                  All
                </TabsTrigger>
                <TabsTrigger value="paid" className="data-[state=active]:bg-background">
                  Paid
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-background">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="overdue" className="data-[state=active]:bg-background">
                  Overdue
                </TabsTrigger>
              </TabsList>
              
              <div className="flex flex-wrap gap-3">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search invoices..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(value) => handleFilterChange('dateRange', value)}
                >
                  <SelectTrigger className="min-w-[150px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      More Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem>
                      By Customer
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      By Amount Range
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      By Payment Method
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      Clear All Filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <TabsContent value="all" className="p-0 m-0">
              <InvoiceTable 
                invoices={filteredInvoices}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                calculateDueDays={calculateDueDays}
                getStatusBadge={getStatusBadge}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                onRowClick={handleRowClick}
              />
            </TabsContent>
            
            <TabsContent value="paid" className="p-0 m-0">
              <InvoiceTable 
                invoices={filteredInvoices}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                calculateDueDays={calculateDueDays}
                getStatusBadge={getStatusBadge}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                onRowClick={handleRowClick}
              />
            </TabsContent>
            
            <TabsContent value="pending" className="p-0 m-0">
              <InvoiceTable 
                invoices={filteredInvoices}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                calculateDueDays={calculateDueDays}
                getStatusBadge={getStatusBadge}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                onRowClick={handleRowClick}
              />
            </TabsContent>
            
            <TabsContent value="overdue" className="p-0 m-0">
              <InvoiceTable 
                invoices={filteredInvoices}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                calculateDueDays={calculateDueDays}
                getStatusBadge={getStatusBadge}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                onRowClick={handleRowClick}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AuthGuard>
  );
}

// Invoice Table Component
interface InvoiceTableProps {
  invoices: Invoice[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  calculateDueDays: (dueDate: string) => number | null;
  getStatusBadge: (invoice: Invoice) => string;
  getStatusIcon: (invoice: Invoice) => React.JSX.Element;
  getStatusText: (invoice: Invoice) => string;
  onRowClick: (invoiceId: number) => void;
}

function InvoiceTable({ 
  invoices, 
  formatCurrency, 
  formatDate, 
  calculateDueDays,
  getStatusBadge, 
  getStatusIcon, 
  getStatusText,
  onRowClick
}: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center rounded-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-muted/30 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Invoices Found</h3>
          <p className="text-muted-foreground mb-4">No matching invoices found with the current filters</p>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const dueDays = calculateDueDays(invoice.dueDate);
            return (
              <TableRow 
                key={invoice.invoiceId} 
                className="group cursor-pointer"
                onClick={() => onRowClick(invoice.invoiceId)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                    <span>#{invoice.invoiceId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.customer?.name || 'Unknown'}</span>
                    {invoice.customer?.email && (
                      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {invoice.customer.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDate(invoice.invoiceDate)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDate(invoice.dueDate)}</span>
                    </div>
                    {dueDays !== null && (
                      <span className={`text-xs font-medium ${
                        dueDays < 0 ? 'text-destructive' : 
                        dueDays <= 3 ? 'text-amber-600 dark:text-amber-400' : 
                        'text-muted-foreground'
                      }`}>
                        {dueDays < 0 
                          ? `${Math.abs(dueDays)} days overdue` 
                          : dueDays === 0 
                            ? 'Due today'
                            : `Due in ${dueDays} days`
                        }
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(invoice.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusBadge(invoice) as any} 
                    className="flex items-center gap-1 w-fit"
                  >
                    {getStatusIcon(invoice)}
                    <span>{getStatusText(invoice)}</span>
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}