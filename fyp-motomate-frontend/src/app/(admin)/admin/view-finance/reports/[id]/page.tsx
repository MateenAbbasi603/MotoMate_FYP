"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft,
    FileText,
    Calendar,
    User,
    Download,
    Printer,
    Receipt,
    Package,
    DollarSign,
    TrendingUp,
    Loader2,
    AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Link from "next/link";
import {
    getReportById,
    formatCurrency,
    DetailedReport
} from "../../../../../../../services/reportServie";
import AuthGuard from "../../../../../../../AuthGuard";

export default function ReportDetailPage() {
    const [report, setReport] = useState<DetailedReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const params = useParams();
    const reportId = parseInt(params.id as string);

    useEffect(() => {
        if (reportId) {
            fetchReport();
        }
    }, [reportId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const reportData = await getReportById(reportId);
            setReport(reportData);
        } catch (error: any) {
            setError(error?.message || "Failed to fetch report");
            toast.error(error?.message || "Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!report) return;
        const logoUrl = typeof window !== 'undefined' ? window.location.origin + '/motomate-logo.png' : '/motomate-logo.png';
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        // Extract the main report sections from the DOM for printing
        const reportContent = document.getElementById('report-content');
        let notesCard = '';
        let taxCard = '';
        let breakdownCards = '';
        if (reportContent) {
            // Try to extract Notes, Tax Analysis, and Breakdown sections by their headings
            const nodes = Array.from(reportContent.querySelectorAll('h4, h3, h2, .card, .bg-blue-50, .bg-gradient-to-br, table'));
            let currentCard = '';
            let currentTitle = '';
            nodes.forEach((node, idx) => {
                if (node.tagName === 'H4' || node.tagName === 'H3' || node.tagName === 'H2') {
                    if (currentCard) {
                        // Prevent duplicate notes: skip if currentTitle is 'Notes'
                        if (currentTitle.toLowerCase() !== 'notes') {
                            breakdownCards += `<div class='card'><div class='card-title'>${currentTitle}</div>${currentCard}</div>`;
                        }
                        currentCard = '';
                    }
                    currentTitle = node.textContent || '';
                } else {
                    currentCard += node.outerHTML;
                }
                // If last node, flush
                if (idx === nodes.length - 1 && currentCard) {
                    if (currentTitle.toLowerCase() !== 'notes') {
                        breakdownCards += `<div class='card'><div class='card-title'>${currentTitle}</div>${currentCard}</div>`;
                    }
                }
            });
            // Try to find notes
            const notesDiv = reportContent.querySelector('.bg-blue-50');
            if (notesDiv) {
                notesCard = `<div class='card'><div class='card-title'>Notes</div>${notesDiv.innerHTML}</div>`;
                // Remove the notesDiv from the DOM before extracting breakdownCards
                notesDiv.parentNode?.removeChild(notesDiv);
            }
            // Remove all cards with 'Notes' as the title from breakdownCards (case-insensitive)
            breakdownCards = breakdownCards.replace(/<div class='card'><div class='card-title'>\s*Notes\s*<\/div>[\s\S]*?<\/div>/gi, '');
            // Do NOT add any Notes card to breakdownCards at all
            // Try to find tax analysis
            const taxDiv = Array.from(reportContent.querySelectorAll('.card-title')).find(el => el.textContent?.toLowerCase().includes('tax analysis'));
            if (taxDiv && taxDiv.parentElement) {
                taxCard = `<div class='card'>${taxDiv.parentElement.innerHTML}</div>`;
            }
        }
        printWindow.document.write(`
            <html>
                <head>
                    <title>${report.reportName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; background: #f6f7fb; color: #222; }
                        .header { text-align: center; margin-bottom: 30px; padding: 24px 0 12px 0; background: #fff; border-bottom: 1px solid #e5e7eb; }
                        .logo { height: 48px; width: 48px; object-fit: contain; margin-bottom: 8px; }
                        .title { font-size: 2rem; font-weight: bold; margin-bottom: 4px; }
                        .subtitle { color: #2563eb; font-size: 1rem; margin-bottom: 2px; }
                        .section { margin: 24px auto; max-width: 900px; }
                        .card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; margin-bottom: 24px; padding: 24px; border: 1px solid #e5e7eb; }
                        .card-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #1e293b; }
                        .card-desc { color: #64748b; font-size: 0.95rem; margin-bottom: 16px; }
                        .summary-grid { display: flex; flex-wrap: wrap; gap: 18px; margin-bottom: 12px; }
                        .summary-item { flex: 1 1 180px; background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; }
                        .summary-label { color: #64748b; font-size: 0.95rem; }
                        .summary-value { font-size: 1.3rem; font-weight: bold; color: #1e293b; }
                        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
                        th { background: #f3f4f6; font-weight: 600; }
                        .total { font-weight: bold; background: #f1f5f9; }
                        .footer { margin-top: 40px; text-align: center; color: #888; font-size: 13px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class='header'>
                        <img src='${logoUrl}' class='logo' alt='MotoMate Logo' />
                        <div class='title'>${report.reportName}</div>
                        <div class='subtitle'>${report.reportType} - ${report.reportCategory}</div>
                        <div style='font-size:13px;'>Generated on ${new Date(report.generatedAt).toLocaleDateString()} by ${report.generatedByName}</div>
                    </div>
                    <div class='section'>
                        <div class='card'>
                            <div class='card-title'>Report Overview</div>
                            <div class='summary-grid'>
                                <div class='summary-item'><div class='summary-label'>Report Type</div><div class='summary-value'>${report.reportType}</div></div>
                                <div class='summary-item'><div class='summary-label'>Category</div><div class='summary-value'>${report.reportCategory}</div></div>
                                <div class='summary-item'><div class='summary-label'>Period</div><div class='summary-value'>${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}</div></div>
                                <div class='summary-item'><div class='summary-label'>Generated</div><div class='summary-value'>${new Date(report.generatedAt).toLocaleDateString()}</div></div>
                            </div>
                            ${report.notes ? `<div class='card-desc'>${report.notes}</div>` : ''}
                        </div>
                        <div class='card'>
                            <div class='card-title'>Financial Summary</div>
                            <div class='summary-grid'>
                                <div class='summary-item'><div class='summary-label'>Total Revenue</div><div class='summary-value'>${formatCurrency(report.totalRevenue)}</div></div>
                                ${report.totalTax > 0 ? `<div class='summary-item'><div class='summary-label'>Total Tax</div><div class='summary-value'>${formatCurrency(report.totalTax)}</div></div>` : ''}
                                <div class='summary-item'><div class='summary-label'>Net Revenue</div><div class='summary-value'>${formatCurrency(report.netRevenue)}</div></div>
                                <div class='summary-item'><div class='summary-label'>${report.reportCategory.toLowerCase() === 'inventory' ? 'Inventory Value' : 'Total Invoices'}</div><div class='summary-value'>${report.reportCategory.toLowerCase() === 'inventory' ? formatCurrency(report.inventoryValue) : report.totalInvoices}</div></div>
                            </div>
                        </div>
                        ${notesCard}
                        ${taxCard}
                        ${breakdownCards}
                    </div>
                    <div class='footer'>Powered by MotoMate | Printed on ${new Date().toLocaleString()}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const handleDownload = () => {
        // Create a printable version
        const printContent = document.getElementById('report-content');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
          <html>
            <head>
              <title>${report?.reportName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { margin: 20px 0; }
                .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .table th { background-color: #f2f2f2; }
                .total { font-weight: bold; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    const getReportIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'sales':
            case 'saleswithtax':
            case 'saleswithouttax':
                return <Receipt className="h-5 w-5" />;
            case 'inventory':
                return <Package className="h-5 w-5" />;
            default:
                return <FileText className="h-5 w-5" />;
        }
    };

    const renderReportData = () => {
        if (!report?.reportData) return null;

        const data = report.reportData;

        switch (report.reportCategory.toLowerCase()) {
            case 'sales':
                return (
                    <div className="space-y-6">
                        {/* Summary */}
                        {data.Summary && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-muted/20 p-4 rounded-lg">
                                            <div className="text-sm text-muted-foreground">Average Invoice Value</div>
                                            <div className="text-2xl font-bold">{formatCurrency(data.Summary.AverageInvoiceValue)}</div>
                                        </div>
                                        <div className="bg-muted/20 p-4 rounded-lg">
                                            <div className="text-sm text-muted-foreground">Effective Tax Rate</div>
                                            <div className="text-2xl font-bold">{data.Summary.TaxRate?.toFixed(1) || 0}%</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Invoice Breakdown */}
                        {data.InvoiceBreakdown && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Invoice Breakdown</CardTitle>
                                    <CardDescription>Detailed breakdown of all invoices in this period</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Invoice ID</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead className="text-right">Subtotal</TableHead>
                                                    <TableHead className="text-right">Tax</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.InvoiceBreakdown.map((invoice: any) => (
                                                    <TableRow key={invoice.InvoiceId}>
                                                        <TableCell className="font-medium">#{invoice.InvoiceId}</TableCell>
                                                        <TableCell>{new Date(invoice.InvoiceDate).toLocaleDateString()}</TableCell>
                                                        <TableCell>{invoice.CustomerName}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(invoice.SubTotal)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(invoice.TaxAmount)}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(invoice.TotalAmount)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={invoice.Status === 'paid' ? 'default' : 'secondary'}>
                                                                {invoice.Status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            case 'saleswithtax':
                return (
                    <div className="space-y-6">
                        {/* Tax Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Tax Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-muted/20 p-4 rounded-lg">
                                        <div className="text-sm text-muted-foreground">Total Tax Collected</div>
                                        <div className="text-2xl font-bold">{formatCurrency(data.TotalTaxCollected)}</div>
                                    </div>
                                    <div className="bg-muted/20 p-4 rounded-lg">
                                        <div className="text-sm text-muted-foreground">Effective Tax Rate</div>
                                        <div className="text-2xl font-bold">{data.EffectiveTaxRate?.toFixed(1) || 0}%</div>
                                    </div>
                                    <div className="bg-muted/20 p-4 rounded-lg">
                                        <div className="text-sm text-muted-foreground">Invoices with Tax</div>
                                        <div className="text-2xl font-bold">{data.InvoicesWithTax}</div>
                                        <div className="text-xs text-muted-foreground">
                                            vs {data.InvoicesWithoutTax} without tax
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tax Breakdown */}
                        {data.TaxBreakdown && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Tax Rate Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tax Rate</TableHead>
                                                    <TableHead className="text-right">Invoice Count</TableHead>
                                                    <TableHead className="text-right">Subtotal</TableHead>
                                                    <TableHead className="text-right">Tax Amount</TableHead>
                                                    <TableHead className="text-right">Total Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.TaxBreakdown.map((tax: any, index: number) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{tax.TaxRate}%</TableCell>
                                                        <TableCell className="text-right">{tax.InvoiceCount}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(tax.SubTotal)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(tax.TaxAmount)}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(tax.TotalAmount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            case 'saleswithouttax':
                return (
                    <div className="space-y-6">
                        {/* Summary */}
                        {data.Summary && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Summary (Excluding Tax)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-muted/20 p-4 rounded-lg">
                                            <div className="text-sm text-muted-foreground">Average Invoice Value</div>
                                            <div className="text-2xl font-bold">{formatCurrency(data.Summary.AverageInvoiceValue)}</div>
                                        </div>
                                        <div className="bg-muted/20 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                            <div className="text-sm text-amber-700">Note</div>
                                            <div className="text-sm text-amber-600">{data.Summary.Note}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Invoice Breakdown */}
                        {data.InvoiceBreakdown && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Invoice Breakdown (Excluding Tax)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Invoice ID</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead className="text-right">Subtotal</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.InvoiceBreakdown.map((invoice: any) => (
                                                    <TableRow key={invoice.InvoiceId}>
                                                        <TableCell className="font-medium">#{invoice.InvoiceId}</TableCell>
                                                        <TableCell>{new Date(invoice.InvoiceDate).toLocaleDateString()}</TableCell>
                                                        <TableCell>{invoice.CustomerName}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(invoice.SubTotal)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={invoice.Status === 'paid' ? 'default' : 'secondary'}>
                                                                {invoice.Status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            case 'inventory':
                return (
                    <div className="space-y-6">
                        {/* Summary */}
                        {data.Summary && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Inventory Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-muted/20 p-4 rounded-lg">
                                            <div className="text-sm text-muted-foreground">Total Items</div>
                                            <div className="text-2xl font-bold">{data.Summary.TotalItems}</div>
                                        </div>
                                        <div className="bg-muted/20 p-4 rounded-lg">
                                            <div className="text-sm text-muted-foreground">Total Value</div>
                                            <div className="text-2xl font-bold">{formatCurrency(data.Summary.TotalValue)}</div>
                                        </div>
                                        <div className="bg-muted/20 p-4 rounded-lg">
                                            <div className="text-sm text-muted-foreground">Average Item Value</div>
                                            <div className="text-2xl font-bold">{formatCurrency(data.Summary.AverageItemValue)}</div>
                                        </div>
                                    </div>

                                    {/* Items by Condition */}
                                    {data.Summary.ItemsByCondition && (
                                        <div className="mt-6">
                                            <h4 className="font-medium mb-3">Items by Condition</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {data.Summary.ItemsByCondition.map((condition: any, index: number) => (
                                                    <div key={index} className="bg-muted/10 p-3 rounded text-center">
                                                        <div className="text-lg font-bold">{condition.Count}</div>
                                                        <div className="text-sm capitalize text-muted-foreground">{condition.Condition}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Inventory Breakdown */}
                        {data.InventoryBreakdown && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Inventory Items</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tool Name</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead className="text-right">Quantity</TableHead>
                                                    <TableHead className="text-right">Unit Price</TableHead>
                                                    <TableHead className="text-right">Total Value</TableHead>
                                                    <TableHead>Condition</TableHead>
                                                    <TableHead>Purchase Date</TableHead>
                                                    <TableHead>Vendor</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.InventoryBreakdown.map((item: any) => (
                                                    <TableRow key={item.ToolId}>
                                                        <TableCell className="font-medium">{item.ToolName}</TableCell>
                                                        <TableCell>{item.ToolType}</TableCell>
                                                        <TableCell className="text-right">{item.Quantity}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.Price)}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(item.TotalValue)}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    item.Condition === 'Excellent' ? 'default' :
                                                                        item.Condition === 'Good' ? 'secondary' : 'outline'
                                                                }
                                                            >
                                                                {item.Condition}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{item.PurchaseDate}</TableCell>
                                                        <TableCell>{item.VendorName}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            default:
                return (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center text-muted-foreground">
                                No detailed data available for this report type
                            </div>
                        </CardContent>
                    </Card>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="bg-card rounded-xl p-8 shadow-md border">
                    <div className="flex flex-col items-center text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Loading Report</h3>
                        <p className="text-muted-foreground">Please wait while we load the report details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="p-8">
                <Card className="border-destructive/20">
                    <CardHeader className="bg-destructive/10 border-b border-destructive/20">
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Error Loading Report
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="mb-6">{error || "Report not found"}</p>
                        <div className="flex gap-3">
                            <Link href="/admin/finance/reports">
                                <Button variant="outline">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Reports
                                </Button>
                            </Link>
                            <Button onClick={fetchReport}>
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <AuthGuard allowedRoles={["super_admin", "admin", "finance_officer"]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex items-start gap-4">
                        <Link href="/admin/finance/reports">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                                {getReportIcon(report.reportCategory)}
                                {report.reportName}
                            </h1>
                            <p className="text-muted-foreground">
                                Generated on {new Date(report.generatedAt).toLocaleDateString()} by {report.generatedByName}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 no-print">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        
                    </div>
                </div>

                {/* Report Content */}
                <div id="report-content" className="space-y-6">
                    {/* Report Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Report Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-muted/20 p-4 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Report Type</div>
                                    <div className="font-semibold">{report.reportType}</div>
                                </div>
                                <div className="bg-muted/20 p-4 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Category</div>
                                    <div className="font-semibold">
                                        {report.reportCategory === 'SalesWithTax' ? 'Sales + Tax' :
                                            report.reportCategory === 'SalesWithoutTax' ? 'Sales - Tax' :
                                                report.reportCategory}
                                    </div>
                                </div>
                                <div className="bg-muted/20 p-4 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Period</div>
                                    <div className="font-semibold">
                                        {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="bg-muted/20 p-4 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Generated</div>
                                    <div className="font-semibold">{new Date(report.generatedAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            {report.notes && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">Notes</h4>
                                    <p className="text-blue-700 text-sm">{report.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Financial Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                                    <div className="text-sm text-blue-600 mb-1">Total Revenue</div>
                                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(report.totalRevenue)}</div>
                                </div>

                                {report.totalTax > 0 && (
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                                        <div className="text-sm text-green-600 mb-1">Total Tax</div>
                                        <div className="text-2xl font-bold text-green-900">{formatCurrency(report.totalTax)}</div>
                                    </div>
                                )}

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                                    <div className="text-sm text-purple-600 mb-1">Net Revenue</div>
                                    <div className="text-2xl font-bold text-purple-900">{formatCurrency(report.netRevenue)}</div>
                                </div>

                                {report.reportCategory.toLowerCase() === 'inventory' ? (
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                                        <div className="text-sm text-orange-600 mb-1">Inventory Value</div>
                                        <div className="text-2xl font-bold text-orange-900">{formatCurrency(report.inventoryValue)}</div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
                                        <div className="text-sm text-gray-600 mb-1">Total Invoices</div>
                                        <div className="text-2xl font-bold text-gray-900">{report.totalInvoices}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Report Data */}
                    {renderReportData()}
                </div>
            </div>
        </AuthGuard>
    );
}