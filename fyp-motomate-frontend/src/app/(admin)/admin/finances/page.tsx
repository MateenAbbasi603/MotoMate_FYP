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
  CalendarRange
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AuthGuard from "../../../../../AuthGuard";
import Link from "next/link";
import {
  getFinancialSummary,
  getMonthlyReport,
  FinancialSummary,
  MonthlyReport
} from "@/app/services/financeService";

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
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "finance_officer"]}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Financial Dashboard</h1>
            <p className="text-muted-foreground">
              Key financial metrics and performance indicators
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/finance/invoices">
              <Button variant="outline" className="gap-2 shadow-sm">
                <ReceiptText className="h-4 w-4" />
                Manage Invoices
              </Button>
            </Link>
            <Link href="/admin/finance/payments">
              <Button variant="outline" className="gap-2 shadow-sm">
                <CreditCard className="h-4 w-4" />
                View Payments
              </Button>
            </Link>
            <Button className="gap-2 shadow-sm">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
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
            <CardFooter className="bg-muted/10 py-2 px-4 border-t">
              <Link href="/admin/finance/invoices?filter=pending" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors w-full flex justify-end items-center gap-1">
                <span>View pending invoices</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardFooter>
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
                  <CalendarRange className="h-3 w-3" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on last 30 days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Report */}
        <Card className="shadow-sm border border-border/50">
          <CardHeader className="bg-card border-b">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Monthly Reports</CardTitle>
                <CardDescription>
                  Monthly breakdown of revenue and invoice analytics
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap gap-3 items-center">
                <div className="w-36">
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger className="bg-card border-border/50 shadow-sm">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" className="gap-2 shadow-sm">
                  <FileText className="h-4 w-4" />
                  Export Report
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Filter</span>
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
          
          <CardContent className="p-4">
            {!report || !report.monthlyData || !Array.isArray(report.monthlyData) ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-muted/30 mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No Report Data Available</h3>
                  <p className="text-muted-foreground mb-4">No financial data available for {selectedYear}</p>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {yearOptions.map((year) => (
                      <Button 
                        key={year} 
                        variant={year === selectedYear ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedYear(year)}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col p-4 bg-muted/20 rounded-lg border border-border/40">
                    <span className="text-sm text-muted-foreground mb-1">Total Revenue</span>
                    <span className="text-2xl font-bold">{formatCurrency(report.totalRevenue)}</span>
                  </div>
                  <div className="flex flex-col p-4 bg-muted/20 rounded-lg border border-border/40">
                    <span className="text-sm text-muted-foreground mb-1">Total Invoices</span>
                    <span className="text-2xl font-bold">{report.invoiceCount}</span>
                  </div>
                  <div className="flex flex-col p-4 bg-muted/20 rounded-lg border border-border/40">
                    <span className="text-sm text-muted-foreground mb-1">Average per Invoice</span>
                    <span className="text-2xl font-bold">
                      {report.invoiceCount > 0
                        ? formatCurrency(report.totalRevenue / report.invoiceCount)
                        : '-'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="relative">
                    <div className="h-64 w-full">
                      <div className="absolute top-0 left-0 right-0 h-64 flex items-end">
                        {report.monthlyData.map((month, index) => {
                          const maxRevenue = Math.max(...report.monthlyData.map(m => m.revenue));
                          const height = maxRevenue ? (month.revenue / maxRevenue) * 100 : 0;
                          
                          return (
                            <div 
                              key={month.month} 
                              className="flex-1 flex flex-col items-center group"
                            >
                              <div className="w-full px-1">
                                <div 
                                  className="w-full bg-primary/80 rounded-t-sm transition-all duration-500 ease-in-out group-hover:bg-primary"
                                  style={{ height: `${height}%` }}
                                >
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium text-center -mt-7">
                                    {formatCurrency(month.revenue)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs mt-2 font-medium">{month.monthName.substring(0, 3)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Monthly Revenue Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {report.monthlyData.map((month) => (
                            <div key={month.month} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span className="text-sm">{month.monthName}</span>
                              </div>
                              <div className="text-sm font-medium">{formatCurrency(month.revenue)}</div>
                              <div className="text-xs text-muted-foreground">
                                {report.totalRevenue > 0 
                                  ? `${((month.revenue / report.totalRevenue) * 100).toFixed(1)}%` 
                                  : '0%'
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Invoice Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {report.monthlyData.map((month) => (
                            <div key={month.month} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-sm">{month.monthName}</span>
                              </div>
                              <div className="text-sm font-medium">{month.count} invoices</div>
                              <div className="text-xs text-muted-foreground">
                                {report.invoiceCount > 0 
                                  ? `${((month.count / report.invoiceCount) * 100).toFixed(1)}%` 
                                  : '0%'
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t p-4 flex justify-between bg-muted/10">
            <div className="text-sm text-muted-foreground">
              Showing financial report for {selectedYear}
            </div>
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              View Detailed Analytics
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}