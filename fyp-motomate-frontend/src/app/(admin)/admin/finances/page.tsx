"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Filter,
  ReceiptText,
  CalendarRange,
  Download,
  Eye,
  Activity,
  PieChart,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Target,
  TrendingDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import AuthGuard from "../../../../../AuthGuard";
import Link from "next/link";
import {
  getFinancialSummary,
  getMonthlyReport,
  FinancialSummary,
  MonthlyReport
} from "@/app/services/financeService";
import { cn } from "@/lib/utils";

export default function FinanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [apiErrors, setApiErrors] = useState<Record<string, any>>({});

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

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

        const reportData = await getMonthlyReport(parseInt(selectedYear)).catch(err => {
          console.error("Error fetching report:", err);
          setApiErrors(prev => ({ ...prev, report: err }));
          return null;
        });

        if (summaryData) setSummary(summaryData);

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-12 shadow-2xl border border-border/50">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Loading Financial Data
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Analyzing your financial metrics and performance indicators...
                </p>
              </div>
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="border-destructive/30 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/10 dark:to-orange-950/10"></div>
          <CardHeader className="relative bg-destructive/5 border-b border-destructive/20">
            <CardTitle className="flex items-center gap-3 text-destructive">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl">Error Loading Financial Data</h3>
                <p className="text-sm text-destructive/80 font-normal mt-1">
                  Unable to retrieve your financial information
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative pt-8">
            <div className="bg-card/50 rounded-lg p-4 border border-destructive/20 mb-6">
              <p className="text-sm">{error}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => window.location.reload()} className="gap-2 shadow-sm">
                <ArrowUpRight className="h-4 w-4" />
                Retry Loading
              </Button>
              <Button variant="outline" onClick={() => testApi('summary')} className="gap-2">
                <Activity className="h-4 w-4" />
                Test Summary API
              </Button>
              <Button variant="outline" onClick={() => testApi('invoices')} className="gap-2">
                <ReceiptText className="h-4 w-4" />
                Test Invoices API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "finance_officer"]}>
      <div className="space-y-8 pb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border border-border/50">
          <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none"></div>
          <div className="relative p-8 z-10">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      Financial Dashboard
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">
                      Key financial metrics and performance indicators
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Real-time Data</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50 shadow-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Updated {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 z-20 relative">
                <Link href="/admin/finances/invoices" className="relative z-30">
                  <Button
                    variant="outline"
                    className="gap-2 shadow-sm bg-white/95 hover:bg-white dark:bg-gray-800/95 dark:hover:bg-gray-800 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-200 hover:shadow-md"
                  >
                    <ReceiptText className="h-4 w-4" />
                    Manage Invoices
                  </Button>
                </Link>
                <Link href="/admin/finances/payments" className="relative z-30">
                  <Button
                    variant="outline"
                    className="gap-2 shadow-sm bg-white/95 hover:bg-white dark:bg-gray-800/95 dark:hover:bg-gray-800 backdrop-blur-sm border-border/50 hover:border-border transition-all duration-200 hover:shadow-md"
                  >
                    <CreditCard className="h-4 w-4" />
                    View Payments
                  </Button>
                </Link>
                <Link href={"/admin/finances/reports"}
                  className={cn(buttonVariants(), "gap-2 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 transition-all duration-200 hover:shadow-xl relative z-30")}

                >
                  <Sparkles className="h-4 w-4" />
                  Generate Report
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Total Revenue Card */}
          <Card className="relative shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-blue-600/3 to-transparent"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-blue-600">
                    Total Revenue
                  </CardTitle>
                </div>
                <div className="p-1.5 bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 pb-6">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(summary?.totalRevenue ?? 0)}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${summary?.percentageChange && summary.percentageChange > 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : summary?.percentageChange && summary.percentageChange < 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                    {summary?.percentageChange && summary.percentageChange > 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : summary?.percentageChange && summary.percentageChange < 0 ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3" />
                    )}
                    {summary?.percentageChange
                      ? `${Math.abs(summary.percentageChange).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments Card */}
          <Card className="relative shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-amber-600/3 to-transparent"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-amber-600">
                    Pending Payments
                  </CardTitle>
                </div>
                <div className="p-1.5 bg-amber-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 pb-6">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(summary?.pendingPayments ?? 0)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-xs">
                    {summary?.pendingInvoicesCount ?? 0} invoice{summary?.pendingInvoicesCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Invoice Card */}
          <Card className="relative shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-green-600/3 to-transparent"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-green-600">
                    Average Invoice
                  </CardTitle>
                </div>
                <div className="p-1.5 bg-green-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <BarChart3 className="h-3 w-3 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 pb-6">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(summary?.averageInvoice ?? 0)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <CalendarRange className="h-3 w-3" />
                    Last 30 days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Rate Card */}
          <Card className="relative shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-purple-600/3 to-transparent"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                    <PieChart className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-purple-600">
                    Collection Rate
                  </CardTitle>
                </div>
                <div className="p-1.5 bg-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Activity className="h-3 w-3 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 pb-6">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {summary?.totalRevenue && summary?.pendingPayments
                    ? `${(((summary.totalRevenue - summary.pendingPayments) / summary.totalRevenue) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
                <div className="space-y-2">
                  <Progress
                    value={summary?.totalRevenue && summary?.pendingPayments
                      ? ((summary.totalRevenue - summary.pendingPayments) / summary.totalRevenue) * 100
                      : 0
                    }
                    className="h-2"
                  />
                  <span className="text-xs text-muted-foreground">Revenue collected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Report */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-900/20 dark:to-blue-900/10"></div>
          <CardHeader className="relative bg-card/80 backdrop-blur-sm border-b border-border/50">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="space-y-2">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  Monthly Financial Overview
                </CardTitle>
                <CardDescription className="text-base">
                  Detailed breakdown of revenue trends and invoice analytics for {selectedYear}
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-36 bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="gap-2 shadow-sm bg-card/80 backdrop-blur-sm">
                  <Download className="h-4 w-4" />
                  Export
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-card/80 backdrop-blur-sm">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Revenue Only</DropdownMenuItem>
                    <DropdownMenuItem>Include Expenses</DropdownMenuItem>
                    <DropdownMenuItem>Quarterly View</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative p-8">
            {!report || !report.monthlyData || !Array.isArray(report.monthlyData) ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                    <BarChart3 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">No Financial Data Available</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      No financial data found for {selectedYear}. Try selecting a different year or check back later.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {yearOptions.map((year) => (
                      <Button
                        key={year}
                        variant={year === selectedYear ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedYear(year)}
                        className="shadow-sm"
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-6 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Revenue</span>
                      <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {formatCurrency(report.totalRevenue)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 p-6 rounded-xl border border-green-200/50 dark:border-green-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Total Invoices</span>
                      <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {report.invoiceCount}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-6 rounded-xl border border-purple-200/50 dark:border-purple-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg per Invoice</span>
                      <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {report.invoiceCount > 0
                        ? formatCurrency(report.totalRevenue / report.invoiceCount)
                        : formatCurrency(0)
                      }
                    </div>
                  </div>
                </div>

                {/* Enhanced Bar Chart */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Revenue Trends</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        Monthly Revenue
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-card/50 rounded-2xl p-6 border border-border/50">
                    <div className="h-80 w-full">
                      <div className="absolute inset-6 flex items-end justify-between">
                        {report.monthlyData.map((month, index) => {
                          const maxRevenue = Math.max(...report.monthlyData.map(m => m.revenue));
                          const minHeight = 20; // Minimum height in pixels
                          const maxHeight = 280; // Maximum height in pixels (320px - 40px padding)

                          // Calculate height with proper scaling
                          let height;
                          if (maxRevenue === 0) {
                            height = minHeight;
                          } else if (month.revenue === 0) {
                            height = minHeight;
                          } else {
                            // Scale between minHeight and maxHeight
                            const ratio = month.revenue / maxRevenue;
                            height = minHeight + (ratio * (maxHeight - minHeight));
                          }

                          return (
                            <div
                              key={month.month}
                              className="flex flex-col items-center group cursor-pointer flex-1 max-w-[80px]"
                            >
                              <div className="w-full px-1 flex flex-col items-center">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 mb-2 -translate-y-2 group-hover:translate-y-0">
                                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap">
                                    <div className="text-center">
                                      <div className="font-semibold">{month.monthName}</div>
                                      <div>{formatCurrency(month.revenue)}</div>
                                      <div className="text-gray-300 dark:text-gray-600">{month.count} invoices</div>
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                                  </div>
                                </div>

                                {/* Bar */}
                                <div
                                  className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-700 ease-in-out group-hover:from-blue-600 group-hover:to-purple-600 shadow-sm relative overflow-hidden"
                                  style={{ height: `${height}px` }}
                                >
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                                  {/* Value label on bar */}
                                  <div className="absolute top-2 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <span className="text-white text-xs font-semibold drop-shadow-sm">
                                      {month.revenue > 0 ? `${(month.revenue / 1000).toFixed(0)}K` : '0'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Month label */}
                              <div className="mt-3 text-center">
                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                                  {month.monthName.substring(0, 3)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {month.count} inv
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-6 bottom-16 flex flex-col justify-between text-xs text-muted-foreground">
                        {report.monthlyData.length > 0 && (() => {
                          const maxRevenue = Math.max(...report.monthlyData.map(m => m.revenue));
                          const steps = 5;
                          const stepValue = maxRevenue / steps;

                          return Array.from({ length: steps + 1 }, (_, i) => (
                            <div key={i} className="flex items-center">
                              <span className="w-12 text-right pr-2">
                                {stepValue > 0 ? `${((steps - i) * stepValue / 1000).toFixed(0)}K` : '0'}
                              </span>
                              <div className="w-2 h-px bg-border"></div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Revenue Distribution */}
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-blue-600" />
                        Revenue Distribution
                      </CardTitle>
                      <CardDescription>Monthly revenue breakdown and percentages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {report.monthlyData
                          .sort((a, b) => b.revenue - a.revenue)
                          .slice(0, 6)
                          .map((month, index) => {
                            const percentage = report.totalRevenue > 0
                              ? (month.revenue / report.totalRevenue) * 100
                              : 0;

                            return (
                              <div key={month.month} className="flex items-center justify-between group hover:bg-muted/30 rounded-lg p-2 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${index === 0 ? 'from-blue-500 to-purple-500' :
                                    index === 1 ? 'from-green-500 to-blue-500' :
                                      index === 2 ? 'from-purple-500 to-pink-500' :
                                        index === 3 ? 'from-orange-500 to-red-500' :
                                          index === 4 ? 'from-teal-500 to-green-500' :
                                            'from-gray-400 to-gray-500'
                                    }`}></div>
                                  <span className="font-medium">{month.monthName}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(month.revenue)}</div>
                                    <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                                  </div>
                                  <div className="w-16">
                                    <Progress value={percentage} className="h-2" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invoice Analytics */}
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Invoice Analytics
                      </CardTitle>
                      <CardDescription>Monthly invoice counts and trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {report.monthlyData
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 6)
                          .map((month, index) => {
                            const percentage = report.invoiceCount > 0
                              ? (month.count / report.invoiceCount) * 100
                              : 0;
                            const avgInvoiceValue = month.count > 0 ? month.revenue / month.count : 0;

                            return (
                              <div key={month.month} className="flex items-center justify-between group hover:bg-muted/30 rounded-lg p-2 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${index === 0 ? 'from-emerald-500 to-teal-500' :
                                    index === 1 ? 'from-blue-500 to-cyan-500' :
                                      index === 2 ? 'from-violet-500 to-purple-500' :
                                        index === 3 ? 'from-rose-500 to-pink-500' :
                                          index === 4 ? 'from-amber-500 to-orange-500' :
                                            'from-slate-400 to-gray-500'
                                    }`}></div>
                                  <span className="font-medium">{month.monthName}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="font-semibold">{month.count} invoices</div>
                                    <div className="text-xs text-muted-foreground">
                                      Avg: {formatCurrency(avgInvoiceValue)}
                                    </div>
                                  </div>
                                  <div className="w-16">
                                    <Progress value={percentage} className="h-2" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t bg-muted/20 p-6 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Financial report for {selectedYear} • Last updated: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                View Details
              </Button>
              <Button size="sm" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Advanced Analytics
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}