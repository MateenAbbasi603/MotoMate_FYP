"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Loader2,
    AlertCircle,
    ArrowUpRight,
    CheckCircle2,
    Calendar,
    Filter,
    CreditCard,
    Search,
    Download,
    Plus,
    ArrowLeft,
    Printer,
    MoreHorizontal,
    Eye,
    Mail,
    Receipt,
    DollarSign,
    FileText,
    CalendarRange,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    ExternalLink,
    BarChart3,
    Clock,
    Info,
    RefreshCw,
    FilePlus2,
    AlertTriangle,
    FileCheck,
    BanknoteIcon
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    getPayments,
    Payment
} from "@/app/services/financeService";
import { format, parseISO, isAfter, subDays } from "date-fns";
import AuthGuard from "../../../../../../AuthGuard";

interface PaymentFilters {
    method: string;
    dateRange: string;
    search: string;
}

export default function PaymentsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [apiErrors, setApiErrors] = useState<Record<string, any>>({});

    const [filters, setFilters] = useState<PaymentFilters>({
        method: searchParams.get('method') || 'all',
        dateRange: 'all',
        search: ''
    });

    const [selectedTab, setSelectedTab] = useState<string>('recent');
    const [expandedPayment, setExpandedPayment] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                setApiErrors({});

                // Fetch payments from API
                const paymentsData = await getPayments().catch(err => {
                    console.error("Error fetching payments:", err);
                    setApiErrors(prev => ({ ...prev, payments: err }));
                    return [];
                });

                if (Array.isArray(paymentsData) && paymentsData.length > 0) {
                    // Process payments data
                    setPayments(paymentsData);
                }

            } catch (error: any) {
                console.error("Error fetching payments data:", error);
                setError(error?.message || "Failed to load payment data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

    // Format date with time
    const formatDateTime = (dateString: string) => {
        try {
            if (!dateString) return "N/A";

            const date = parseISO(dateString);
            if (isNaN(date.getTime())) {
                return "Invalid date";
            }
            return format(date, 'MMM dd, yyyy - h:mm a');
        } catch (error) {
            console.error("Date formatting error:", error, dateString);
            return "Invalid date";
        }
    };

    // Get payment method icon
    const getPaymentMethodIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'cash':
                return <BanknoteIcon className="h-4 w-4" />;
            case 'credit card':
                return <CreditCard className="h-4 w-4" />;
            case 'bank transfer':
                return <BankIcon className="h-4 w-4" />;
            case 'safepay':
                return <SafePayIcon className="h-4 w-4" />;
            default:
                return <DollarSign className="h-4 w-4" />;
        }
    };

    // Get payment status
    const getPaymentStatus = (payment: Payment) => {
        const isFullPayment = payment.amount >= payment.invoiceTotal;

        if (isFullPayment) {
            return {
                label: "Full Payment",
                icon: <CheckCircle2 className="h-4 w-4" />,
                variant: "success"
            };
        } else {
            return {
                label: "Partial Payment",
                icon: <AlertTriangle className="h-4 w-4" />,
                variant: "warning"
            };
        }
    };

    // Filter payments based on current filters
    const filteredPayments = payments.filter(payment => {
        // Filter by payment method
        const matchesMethod =
            filters.method === "all" ||
            payment.method.toLowerCase() === filters.method.toLowerCase();

        // Filter by search term
        const matchesSearch =
            filters.search === "" ||
            payment.paymentId.toString().includes(filters.search) ||
            payment.invoiceId.toString().includes(filters.search) ||
            (payment.customer?.name && payment.customer.name.toLowerCase().includes(filters.search.toLowerCase()));

        // Filter by date range
        let matchesDateRange = true;
        if (filters.dateRange === "today") {
            matchesDateRange = format(parseISO(payment.paymentDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        } else if (filters.dateRange === "week") {
            const today = new Date();
            const oneWeekAgo = subDays(today, 7);
            const paymentDate = parseISO(payment.paymentDate);
            matchesDateRange = isAfter(paymentDate, oneWeekAgo);
        } else if (filters.dateRange === "month") {
            const today = new Date();
            const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            const paymentDate = parseISO(payment.paymentDate);
            matchesDateRange = isAfter(paymentDate, oneMonthAgo);
        }

        return matchesMethod && matchesSearch && matchesDateRange;
    });

    // Group payments by tab category
    const categorizedPayments = {
        recent: filteredPayments.slice(0, 50), // Latest 50 payments
        highest: [...filteredPayments].sort((a, b) => b.amount - a.amount).slice(0, 30), // Top 30 by amount
        flagged: filteredPayments.filter(p => p.amount < p.invoiceTotal), // Partial payments
    };

    // Group payments by method for statistics
    const paymentMethods = filteredPayments.reduce((acc, payment) => {
        const method = payment.method.toLowerCase();
        if (!acc[method]) {
            acc[method] = {
                count: 0,
                total: 0
            };
        }
        acc[method].count += 1;
        acc[method].total += payment.amount;
        return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Calculate summary statistics
    const paymentStats = {
        total: filteredPayments.length,
        totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
        avgAmount: filteredPayments.length > 0
            ? filteredPayments.reduce((sum, p) => sum + p.amount, 0) / filteredPayments.length
            : 0,
        methodBreakdown: paymentMethods
    };

    // Handle filter changes
    const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleTabChange = (value: string) => {
        setSelectedTab(value);
    };

    // Toggle payment details expansion
    const togglePaymentDetails = (paymentId: number) => {
        setExpandedPayment(prev => prev === paymentId ? null : paymentId);
    };

    // Handle row click to view payment details
    const handleRowClick = (paymentId: number) => {
        // Could navigate to a detailed page, or toggle expansion
        togglePaymentDetails(paymentId);
    };

    // Testing function to check API directly
    const testApi = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Finance/payments`, {
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
                        <h3 className="text-xl font-semibold mb-2">Loading Payments</h3>
                        <p className="text-muted-foreground">Please wait while we retrieve your payment data...</p>
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
                            Error Loading Payments
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
                                <CreditCard className="h-4 w-4" />
                                Test Payments API
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
                            <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
                            <p className="text-muted-foreground">
                                Track, analyze, and manage payment transactions
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" className="gap-2 shadow-sm">
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                        <Button variant="outline" className="gap-2 shadow-sm">
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                        <Button className="gap-2 shadow-sm">
                            <Plus className="h-4 w-4" />
                            Record Payment
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Total Payments</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-bold">{paymentStats.total}</div>
                            <div className="text-sm font-medium text-muted-foreground mt-1">
                                {formatCurrency(paymentStats.totalAmount)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Average Amount</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-bold">{formatCurrency(paymentStats.avgAmount)}</div>
                            <div className="text-sm font-medium text-muted-foreground mt-1">
                                Per transaction
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Popular Method</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {Object.entries(paymentMethods).length > 0 ? (
                                <>
                                    <div className="text-2xl font-bold capitalize">
                                        {Object.entries(paymentMethods)
                                            .sort((a, b) => b[1].count - a[1].count)[0][0]}
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground mt-1">
                                        {Object.entries(paymentMethods)
                                            .sort((a, b) => b[1].count - a[1].count)[0][1].count} transactions
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">-</div>
                                    <div className="text-sm font-medium text-muted-foreground mt-1">
                                        No data available
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground">Partial Payments</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-bold">
                                {filteredPayments.filter(p => p.amount < p.invoiceTotal).length}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground mt-1">
                                Awaiting full payment
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Method Breakdown */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle>Payment Method Breakdown</CardTitle>
                        <CardDescription>
                            Distribution of payments by payment method
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(paymentMethods).length > 0 ? (
                                Object.entries(paymentMethods).map(([method, data]) => {
                                    const percentage = (data.count / paymentStats.total) * 100;
                                    return (
                                        <div key={method} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    {method === 'cash' ? (
                                                        <BanknoteIcon className="h-4 w-4 text-green-600" />
                                                    ) : method === 'credit card' ? (
                                                        <CreditCard className="h-4 w-4 text-blue-600" />
                                                    ) : method === 'bank transfer' ? (
                                                        <BankIcon className="h-4 w-4 text-purple-600" />
                                                    ) : method === 'safepay' ? (
                                                        <SafePayIcon className="h-4 w-4 text-amber-600" />
                                                    ) : (
                                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span className="font-medium capitalize">{method}</span>
                                                </div>
                                                <div className="text-sm">
                                                    {data.count} payments ({percentage.toFixed(1)}%)
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${method === 'cash' ? 'bg-green-600' :
                                                            method === 'credit card' ? 'bg-blue-600' :
                                                                method === 'bank transfer' ? 'bg-purple-600' :
                                                                    method === 'safepay' ? 'bg-amber-600' :
                                                                        'bg-gray-600'
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="text-sm font-medium">
                                                {formatCurrency(data.total)}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    No payment data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

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
                                <TabsTrigger value="recent" className="data-[state=active]:bg-background">
                                    Recent
                                </TabsTrigger>
                                <TabsTrigger value="highest" className="data-[state=active]:bg-background">
                                    Highest Value
                                </TabsTrigger>
                                <TabsTrigger value="flagged" className="data-[state=active]:bg-background">
                                    Partial Payments
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex flex-wrap gap-3">
                                <div className="relative min-w-[200px]">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search payments..."
                                        className="pl-9"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                    />
                                </div>

                                <Select
                                    value={filters.method}
                                    onValueChange={(value) => handleFilterChange('method', value)}
                                >
                                    <SelectTrigger className="min-w-[150px]">
                                        <SelectValue placeholder="Payment Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="credit card">Credit Card</SelectItem>
                                        <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="safepay">Safepay</SelectItem>
                                    </SelectContent>
                                </Select>

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
                            </div>
                        </div>

                        <TabsContent value="recent" className="p-0 m-0">
                            <PaymentTable
                                payments={categorizedPayments.recent}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                                getPaymentMethodIcon={getPaymentMethodIcon}
                                getPaymentStatus={getPaymentStatus}
                                onRowClick={handleRowClick}
                                expandedPayment={expandedPayment}
                                formatDateTime={formatDateTime}
                            />
                        </TabsContent>

                        <TabsContent value="highest" className="p-0 m-0">
                            <PaymentTable
                                payments={categorizedPayments.highest}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                                getPaymentMethodIcon={getPaymentMethodIcon}
                                getPaymentStatus={getPaymentStatus}
                                onRowClick={handleRowClick}
                                expandedPayment={expandedPayment}
                                formatDateTime={formatDateTime}
                            />
                        </TabsContent>

                        <TabsContent value="flagged" className="p-0 m-0">
                            <PaymentTable
                                payments={categorizedPayments.flagged}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                                getPaymentMethodIcon={getPaymentMethodIcon}
                                getPaymentStatus={getPaymentStatus}
                                onRowClick={handleRowClick}
                                expandedPayment={expandedPayment}
                                formatDateTime={formatDateTime}
                            />
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </AuthGuard>
    );
}

// Payment Table Component
interface PaymentTableProps {
    payments: Payment[];
    formatCurrency: (amount: number) => string;
    formatDate: (dateString: string) => string;
    formatDateTime: (dateString: string) => string;
    getPaymentMethodIcon: (method: string) => React.JSX.Element;
    getPaymentStatus: (payment: Payment) => {
        label: string;
        icon: React.JSX.Element;
        variant: string;
    };
    onRowClick: (paymentId: number) => void;
    expandedPayment: number | null;
}

function PaymentTable({
    payments,
    formatCurrency,
    formatDate,
    formatDateTime,
    getPaymentMethodIcon,
    getPaymentStatus,
    onRowClick,
    expandedPayment
}: PaymentTableProps) {
    if (payments.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center rounded-md">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-muted/30 mb-4">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No Payments Found</h3>
                    <p className="text-muted-foreground mb-4">No matching payments found with the current filters</p>
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
                        <TableHead>Payment #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map((payment) => {
                        const status = getPaymentStatus(payment);
                        const isExpanded = expandedPayment === payment.paymentId;

                        return (
                            <React.Fragment key={payment.paymentId}>
                                <TableRow
                                    className={`group cursor-pointer ${isExpanded ? 'bg-muted/30' : ''}`}
                                    onClick={() => onRowClick(payment.paymentId)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4 text-muted-foreground" />
                                            <span>#{payment.paymentId}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{formatDate(payment.paymentDate)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{payment.customer?.name || 'Unknown'}</span>
                                            {payment.customer?.email && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    {payment.customer.email}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/admin/finance/invoices/${payment.invoiceId}`}
                                            className="text-primary hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            #{payment.invoiceId}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(payment.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`flex items-center gap-1 w-fit 
                        ${payment.method.toLowerCase() === 'cash' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    payment.method.toLowerCase() === 'credit card' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        payment.method.toLowerCase() === 'bank transfer' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            payment.method.toLowerCase() === 'safepay' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-gray-50 text-gray-700 border-gray-200'
                                                }`
                                            }
                                        >
                                            {getPaymentMethodIcon(payment.method)}
                                            <span className="capitalize">{payment.method}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={status.variant as any}
                                            className="flex items-center gap-1 w-fit"
                                        >
                                            {status.icon}
                                            <span>{status.label}</span>
                                        </Badge>
                                        {payment.amount < payment.invoiceTotal && (
                                            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                                                {formatCurrency(payment.invoiceTotal - payment.amount)} remaining
                                            </div>
                                        )}
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
                                                    <DropdownMenuItem className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        <span>Send Receipt</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="flex items-center gap-2">
                                                        <FileCheck className="h-4 w-4" />
                                                        <span>Add New Payment</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <span>Void Payment</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {isExpanded && (
                                    <TableRow className="bg-muted/20">
                                        <TableCell colSpan={8} className="p-0">
                                            <div className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                            <Receipt className="h-4 w-4" />
                                                            Payment Details
                                                        </h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Payment ID:</span>
                                                                <span className="font-medium">#{payment.paymentId}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Date & Time:</span>
                                                                <span>{formatDateTime(payment.paymentDate)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Method:</span>
                                                                <span className="capitalize">{payment.method}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Amount:</span>
                                                                <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                                            </div>
                                                            {payment.amount < payment.invoiceTotal && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Invoice Total:</span>
                                                                    <span className="font-medium">{formatCurrency(payment.invoiceTotal)}</span>
                                                                </div>
                                                            )}
                                                            {payment.amount < payment.invoiceTotal && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Remaining:</span>
                                                                    <span className="font-medium text-amber-600">{formatCurrency(payment.invoiceTotal - payment.amount)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                            <FileText className="h-4 w-4" />
                                                            Invoice & Customer
                                                        </h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Invoice:</span>
                                                                <Link
                                                                    href={`/admin/finance/invoices/${payment.invoiceId}`}
                                                                    className="text-primary hover:underline flex items-center gap-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <span>#{payment.invoiceId}</span>
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </Link>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Customer:</span>
                                                                <span>{payment.customer?.name || 'Unknown'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Email:</span>
                                                                <span>{payment.customer?.email || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Phone:</span>
                                                                <span>{payment.customer?.phone || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Status:</span>
                                                                <span className="font-medium">{status.label}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end mt-4 space-x-3">
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        <Printer className="h-4 w-4" />
                                                        Print Receipt
                                                    </Button>
                                                    {payment.amount < payment.invoiceTotal && (
                                                        <Button variant="default" size="sm" className="gap-2">
                                                            <Plus className="h-4 w-4" />
                                                            Add Payment
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
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

const SafePayIcon = ({ className }: { className?: string }) => (
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
        <rect width="16" height="16" x="4" y="4" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4v2" />
        <path d="M4 12h2" />
        <path d="M12 18v2" />
        <path d="M18 12h2" />
    </svg>
);