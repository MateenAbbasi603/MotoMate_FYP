// app/admin/invoices/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ChevronLeft,
    Printer,
    Download,
    Check,
    Clock,
    FileText,
    User,
    Car,
    Calendar,
    CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import invoiceService from '../../../../../../services/invoiceService';


type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default function InvoiceDetailPage({
    params
}: PageProps) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Format dates
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMMM dd, yyyy');
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Invalid date';
        }
    };

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);
                const response = await invoiceService.getInvoiceById(id);

                if (response.success) {
                    setInvoice(response);
                } else {
                    setError('Failed to load invoice details');
                }
            } catch (err) {
                console.error(`Failed to fetch invoice ${id}:`, err);
                setError('Failed to load invoice details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id]);

    // Handle printing the invoice
    const handlePrint = () => {
        window.print();
    };

    // Add printInvoice function for printable invoice
    const handlePrintInvoice = () => {
        if (!invoice) return;
        const logoUrl = `${window.location.origin}/motomate-logo.png`;
        // Prepare invoice data
        const invoiceData = invoice.invoice;
        const customer = invoice.customer || {};
        const vehicle = invoice.vehicle || {};
        const mechanic = invoice.mechanic || {};
        // Get invoice items
        let items = [];
        if (invoiceData?.invoiceItems?.$values && Array.isArray(invoiceData.invoiceItems.$values)) {
            items = invoiceData.invoiceItems.$values;
        } else if (invoice?.invoiceItems?.$values && Array.isArray(invoice.invoiceItems.$values)) {
            items = invoice.invoiceItems.$values;
        }
        // Fallback: if no items, show empty row
        if (!items.length) {
            items = [{ description: 'No items found', quantity: '', unitPrice: '', totalPrice: '' }];
        }
        // Subtotal, tax, total
        const subtotal = typeof invoiceData?.subTotal === 'number'
            ? invoiceData.subTotal
            : parseFloat(invoiceData?.subTotal || invoiceData?.totalAmount || '0');
        const tax = typeof invoiceData?.taxAmount === 'number'
            ? invoiceData.taxAmount
            : subtotal * 0.18;
        const total = typeof invoiceData?.totalAmount === 'number'
            ? invoiceData.totalAmount
            : subtotal + tax;
        // Print HTML
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${invoiceData.invoiceId}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #fff; margin: 0; padding: 0; }
            .header-row { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
            .logo { height: 48px; width: 48px; object-fit: contain; }
            .invoice-title { font-size: 2rem; font-weight: bold; color: #1e293b; letter-spacing: 1px; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 18px; }
            .info-section { width: 48%; background: #f9fafb; border-radius: 8px; padding: 16px 18px; border: 1px solid #e5e7eb; }
            .info-title { font-size: 15px; font-weight: 600; color: #2563eb; margin-bottom: 10px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 7px; font-size: 14px; }
            .info-label { color: #6b7280; font-weight: 500; }
            .info-value { color: #1e293b; font-weight: 600; text-align: right; max-width: 200px; }
            .section-title { font-size: 1.1rem; font-weight: 600; color: #1e293b; margin: 24px 0 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
            th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: 600; color: #374151; font-size: 14px; border-bottom: 2px solid #e5e7eb; }
            td { font-size: 14px; }
            .footer { margin-top: 30px; text-align: right; color: #64748b; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header-row">
            <img src="${logoUrl}" class="logo" alt="MotoMate Logo" />
            <span class="invoice-title">INVOICE</span>
          </div>
          <div class="info-grid">
            <div class="info-section">
              <div class="info-title">Customer Information</div>
              <div class="info-row"><span class="info-label">Name</span><span class="info-value">${customer.name || ''}</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-value">${customer.email || ''}</span></div>
              <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${customer.phone || ''}</span></div>
              <div class="info-row"><span class="info-label">Address</span><span class="info-value">${customer.address || ''}</span></div>
            </div>
            <div class="info-section">
              <div class="info-title">Vehicle Information</div>
              <div class="info-row"><span class="info-label">Make & Model</span><span class="info-value">${vehicle.make || ''} ${vehicle.model || ''}</span></div>
              <div class="info-row"><span class="info-label">Year</span><span class="info-value">${vehicle.year || ''}</span></div>
              <div class="info-row"><span class="info-label">License Plate</span><span class="info-value">${vehicle.licensePlate || ''}</span></div>
            </div>
          </div>
          <div class="section-title">Service Details</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.description || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.quantity || ''}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Rs ${(item.unitPrice || 0).toFixed(2)}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Rs ${(item.totalPrice || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <th colspan="3" style="text-align:right">Subtotal</th>
                <td style="text-align:right">Rs ${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <th colspan="3" style="text-align:right">Tax (18%)</th>
                <td style="text-align:right">Rs ${tax.toFixed(2)}</td>
              </tr>
              <tr>
                <th colspan="3" style="text-align:right">Total Amount</th>
                <td style="text-align:right">Rs ${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="section-title">Notes</div>
          <div style="background:#f9fafb;padding:12px 18px;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:18px;">${invoiceData.notes || 'No notes provided.'}</div>
          <div class="section-title">Payment Information</div>
          <div class="info-section" style="width:350px;margin-bottom:18px;">
            <div class="info-row"><span class="info-label">Status</span><span class="info-value">${invoiceData.status || ''}</span></div>
            <div class="info-row"><span class="info-label">Due Date</span><span class="info-value">${formatDate(invoiceData.dueDate)}</span></div>
            <div class="info-row"><span class="info-label">Payment Method</span><span class="info-value">${invoiceData.paymentMethod || ''}</span></div>
          </div>
          ${mechanic.name ? `<div class="section-title">Service Performed By</div><div class="info-section" style="width:350px;"><div class="info-row"><span class="info-label">Name</span><span class="info-value">${mechanic.name}</span></div><div class="info-row"><span class="info-label">Contact</span><span class="info-value">${mechanic.phone || ''}</span></div></div>` : ''}
          <div class="footer">Generated by MotoMate | ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popups to print the invoice');
            return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    // Status badge component
    const StatusBadge = ({ status }: { status: string }) => {
        const getStatusStyles = (status: string) => {
            status = status?.toLowerCase() || '';
            switch (status) {
                case 'paid':
                    return 'bg-green-100 text-green-800 hover:bg-green-100';
                case 'issued':
                    return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
                case 'overdue':
                    return 'bg-red-100 text-red-800 hover:bg-red-100';
                default:
                    return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
            }
        };

        return (
            <Badge className={getStatusStyles(status)} variant="outline">
                {status || 'Unknown'}
            </Badge>
        );
    };

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center gap-2 mb-6">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">Invoice Details</h1>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded-md text-red-800">
                    <p>{error}</p>
                    <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
                </div>
            ) : invoice ? (
                <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto print:shadow-none">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-bold">Invoice #{invoice.invoice.invoiceId}</h2>
                            <div className="mt-2 flex items-center gap-4">
                                <StatusBadge status={invoice.invoice.status} />
                                <p className="text-sm text-gray-600">Order #{invoice.invoice.orderId}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Issue Date</div>
                            <div className="font-medium">{formatDate(invoice.invoice.invoiceDate)}</div>
                            <div className="text-sm text-gray-600 mt-2">Due Date</div>
                            <div className="font-medium">{formatDate(invoice.invoice.dueDate)}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Customer Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium flex items-center mb-3">
                                <User className="mr-2 h-5 w-5 text-primary" />
                                Customer Information
                            </h3>
                            <div className="space-y-2">
                                <p><span className="font-medium">Name:</span> {invoice.customer?.name}</p>
                                <p><span className="font-medium">Email:</span> {invoice.customer?.email}</p>
                                <p><span className="font-medium">Phone:</span> {invoice.customer?.phone}</p>
                                {invoice.customer?.address && (
                                    <p><span className="font-medium">Address:</span> {invoice.customer.address}</p>
                                )}
                            </div>
                        </div>

                        {/* Vehicle Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium flex items-center mb-3">
                                <Car className="mr-2 h-5 w-5 text-primary" />
                                Vehicle Information
                            </h3>
                            <div className="space-y-2">
                                <p><span className="font-medium">Make & Model:</span> {invoice.vehicle ? `${invoice.vehicle.make} ${invoice.vehicle.model}` : 'N/A'}</p>
                                <p><span className="font-medium">Year:</span> {invoice.vehicle?.year || 'N/A'}</p>
                                <p><span className="font-medium">License Plate:</span> {invoice.vehicle?.licensePlate || 'N/A'}</p>
                            </div>
                        </div>
                    </div>


                    {/* Line Items */}
                    <div className="mb-8">
                        <h3 className="text-lg font-medium mb-4">Service Details</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-gray-600">Description</th>
                                        <th className="text-center px-4 py-3 text-gray-600">Qty</th>
                                        <th className="text-right px-4 py-3 text-gray-600">Unit Price</th>
                                        <th className="text-right px-4 py-3 text-gray-600">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(() => {
                                        // Get invoice items from the nested structure
                                        let items = [];

                                        // Try to get items from invoice.invoiceItems.$values
                                        if (invoice?.invoice?.invoiceItems?.$values &&
                                            Array.isArray(invoice.invoice.invoiceItems.$values)) {
                                            items = invoice.invoice.invoiceItems.$values;
                                        }
                                        // Fall back to invoiceItems.$values if available
                                        else if (invoice?.invoiceItems?.$values &&
                                            Array.isArray(invoice.invoiceItems.$values)) {
                                            items = invoice.invoiceItems.$values;
                                        }

                                        if (items.length > 0) {
                                            return items.map((item: any, index: any) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">{item.description}</td>
                                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        Rs {typeof item.unitPrice === 'number'
                                                            ? item.unitPrice.toFixed(2)
                                                            : parseFloat(item.unitPrice || '0').toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        Rs {typeof item.totalPrice === 'number'
                                                            ? item.totalPrice.toFixed(2)
                                                            : parseFloat(item.totalPrice || '0').toFixed(2)}
                                                    </td>
                                                </tr>
                                            ));
                                        } else {
                                            return (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-3 text-center text-gray-500">No items found</td>
                                                </tr>
                                            );
                                        }
                                    })()}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right font-medium">Subtotal</td>
                                        <td className="px-4 py-3 text-right">
                                            Rs {typeof invoice?.invoice?.subTotal === 'number'
                                                ? invoice.invoice.subTotal.toFixed(2)
                                                : parseFloat(invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount || '0').toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right font-medium">
                                            Tax ({invoice?.invoice?.taxRate ? `${invoice.invoice.taxRate}%` : '18%'})
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            Rs {typeof invoice?.invoice?.taxAmount === 'number'
                                                ? invoice.invoice.taxAmount.toFixed(2)
                                                : (parseFloat(invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount || '0') * 0.18).toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr className="font-bold">
                                        <td colSpan={3} className="px-4 py-3 text-right">Total Amount</td>
                                        <td className="px-4 py-3 text-right">
                                            Rs {typeof invoice?.invoice?.totalAmount === 'number'
                                                ? invoice.invoice.totalAmount.toFixed(2)
                                                : parseFloat(invoice?.invoice?.totalAmount || '0').toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Notes & Payment Terms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-lg font-medium mb-2">Notes</h3>
                            <p className="text-gray-600">{invoice.invoice.notes || 'No notes provided.'}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2">Payment Terms</h3>
                            <p className="text-gray-600">Due on {formatDate(invoice.invoice.dueDate)}</p>
                        </div>
                    </div>

                    {/* Mechanic Information */}
                    {invoice.mechanic && (
                        <div className="mb-8">
                            <h3 className="text-lg font-medium mb-2">Service Performed By</h3>
                            <p className="text-gray-600">{invoice.mechanic.name} - {invoice.mechanic.phone}</p>
                        </div>
                    )}

                    {/* Invoice Footer */}
                    <div className="text-center text-gray-500 text-sm mt-8">
                        <p>Thank you for choosing MotoMate Auto Services</p>
                        <p>For any queries regarding this invoice, please contact us.</p>
                    </div>

                    {/* Actions (visible only on screen, not when printing) */}
                    <div className="mt-8 print:hidden">
                        <div className="flex justify-end gap-4">
                            <Button variant="outline" className='cursor-pointer' onClick={() => router.push(`/admin/orders/${invoice.invoice.orderId}`)}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Order
                            </Button>
                            <Button variant="outline" onClick={handlePrintInvoice}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Invoice
                            </Button>
                            
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-xl text-gray-500 mb-4">Invoice not found</p>
                    <Button onClick={() => router.push('/admin/orders')}>
                        Back to Orders
                    </Button>
                </div>
            )}
        </div>
    );
}