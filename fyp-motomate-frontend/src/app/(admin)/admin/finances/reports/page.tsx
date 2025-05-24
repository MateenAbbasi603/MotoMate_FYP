"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  FileText, 
  Plus, 
  Eye, 
  Trash2, 
  Download, 
  Filter,
  Calendar,
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  Package,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Link from "next/link";
import { deleteReport, formatDateForAPI, generateReport, GenerateReportRequest, getDateRanges, getReports, ReportSummary } from "../../../../../../services/reportServie";
import AuthGuard from "../../../../../../AuthGuard";
import { formatCurrency } from "@/utils/formatters";


export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Form state for generating reports
  const [reportForm, setReportForm] = useState<GenerateReportRequest>({
    reportType: 'Monthly',
    reportCategory: 'Sales',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const dateRanges = getDateRanges();

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

  const handleGenerateReport = async () => {
    if (!reportForm.startDate || !reportForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    try {
      setGenerating(true);
      await generateReport(reportForm);
      toast.success("Report generated successfully");
      setShowGenerateDialog(false);
      fetchReports();
      // Reset form
      setReportForm({
        reportType: 'Monthly',
        reportCategory: 'Sales',
        startDate: '',
        endDate: '',
        notes: ''
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      await deleteReport(id);
      toast.success("Report deleted successfully");
      fetchReports();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete report");
    }
  };

  const handleQuickDateSelect = (range: string) => {
    const ranges = getDateRanges();
    let selectedRange;

    switch (range) {
      case 'thisWeek':
        selectedRange = ranges.thisWeek;
        setReportForm(prev => ({ ...prev, reportType: 'Weekly' }));
        break;
      case 'lastWeek':
        selectedRange = ranges.lastWeek;
        setReportForm(prev => ({ ...prev, reportType: 'Weekly' }));
        break;
      case 'thisMonth':
        selectedRange = ranges.thisMonth;
        setReportForm(prev => ({ ...prev, reportType: 'Monthly' }));
        break;
      case 'lastMonth':
        selectedRange = ranges.lastMonth;
        setReportForm(prev => ({ ...prev, reportType: 'Monthly' }));
        break;
      case 'thisYear':
        selectedRange = ranges.thisYear;
        setReportForm(prev => ({ ...prev, reportType: 'Yearly' }));
        break;
      case 'lastYear':
        selectedRange = ranges.lastYear;
        setReportForm(prev => ({ ...prev, reportType: 'Yearly' }));
        break;
      default:
        return;
    }

    setReportForm(prev => ({
      ...prev,
      startDate: formatDateForAPI(selectedRange.start),
      endDate: formatDateForAPI(selectedRange.end)
    }));
  };

  const getReportCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sales':
      case 'saleswithtax':
      case 'saleswithouttax':
        return <Receipt className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getReportCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sales':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'saleswithtax':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'saleswithouttax':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'inventory':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || report.reportCategory.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="bg-card rounded-xl p-8 shadow-md border">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Loading Reports</h3>
            <p className="text-muted-foreground">Please wait while we retrieve your reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "finance_officer"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Financial Reports</h1>
            <p className="text-muted-foreground">
              Generate and manage comprehensive financial reports
            </p>
          </div>

          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogDescription>
                  Create a new financial report with custom parameters
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Quick Date Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quick Date Selection</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateSelect('thisWeek')}
                      className="text-xs"
                    >
                      This Week
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateSelect('lastWeek')}
                      className="text-xs"
                    >
                      Last Week
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateSelect('thisMonth')}
                      className="text-xs"
                    >
                      This Month
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateSelect('lastMonth')}
                      className="text-xs"
                    >
                      Last Month
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateSelect('thisYear')}
                      className="text-xs"
                    >
                      This Year
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuickDateSelect('lastYear')}
                      className="text-xs"
                    >
                      Last Year
                    </Button>
                  </div>
                </div>

                {/* Report Type */}
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select 
                    value={reportForm.reportType} 
                    onValueChange={(value: any) => setReportForm(prev => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Category */}
                <div>
                  <Label htmlFor="reportCategory">Report Category</Label>
                  <Select 
                    value={reportForm.reportCategory} 
                    onValueChange={(value: any) => setReportForm(prev => ({ ...prev, reportCategory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sales">Sales Report</SelectItem>
                      <SelectItem value="SalesWithTax">Sales With Tax</SelectItem>
                      <SelectItem value="SalesWithoutTax">Sales Without Tax</SelectItem>
                      <SelectItem value="Inventory">Inventory Valuation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={reportForm.startDate}
                      onChange={(e) => setReportForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={reportForm.endDate}
                      onChange={(e) => setReportForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes for this report..."
                    value={reportForm.notes}
                    onChange={(e) => setReportForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateReport} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filter Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search reports by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="saleswithtax">Sales With Tax</SelectItem>
                  <SelectItem value="saleswithouttax">Sales Without Tax</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
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
                            <Link href={`/admin/finances/reports/${report.reportId}`}>
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
      </div>
    </AuthGuard>
  );
}