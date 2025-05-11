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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChevronLeft,
  Car,
  Wrench,
  Calendar,
  Clock,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  User,
  Phone,
  Mail,
  DollarSign,
  ReceiptText,
  Printer,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../../../../services/apiClient';

interface OrderData {
  orderId: number;
  userId: number;
  vehicleId: number;
  serviceId?: number;
  includesInspection: boolean;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes?: string;
  user?: any;
  vehicle?: any;
  service?: any;
  inspection?: any;
  additionalServices?: any[];
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function OrderDetailPage({
  params
}: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [currentTab, setCurrentTab] = useState('details');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/api/orders/${id}`);

        console.log(response.data);

        if (response.data) {
          setOrder(response.data);

          // If order is completed, check for invoice
          if (response.data.status.toLowerCase() === 'completed') {
            checkForInvoice(response.data.orderId);
          }
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error(`Failed to fetch order ${id}:`, err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  // Check if an invoice exists for this order
  const checkForInvoice = async (orderId: number) => {
    try {
      setLoadingInvoice(true);
      const response = await apiClient.get(`/api/Invoices/customer/${orderId}`);

      if (response.data.success) {
        setInvoice(response.data);
        console.log("Invoice found:", response.data);
      }
    } catch (error) {
      console.error('Error checking for invoice:', error);
      // We'll silently fail here since this is just a check
    } finally {
      setLoadingInvoice(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Print invoice
  const handlePrintInvoice = () => {
    // Create a printable version
    const printContent = document.getElementById('invoice-printable');
    const originalContent = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore event handlers
    }
  };

  // View Invoice button handler
  const handleViewInvoice = () => {
    setCurrentTab('invoice');
    const invoiceTab = document.querySelector('[data-value="invoice"]') as HTMLElement;
    if (invoiceTab) {
      invoiceTab.click();
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'in progress':
      case 'inprogress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
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

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Order Details</h1>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Order not found'}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Order #{order.orderId}</CardTitle>
                  <CardDescription>
                    Placed on {formatDate(order.orderDate)}
                  </CardDescription>
                </div>
                <Badge className={getStatusBadgeStyle(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="details" value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Order Details</TabsTrigger>
                  {order.includesInspection && order.inspection && (
                    <TabsTrigger value="inspection">Inspection</TabsTrigger>
                  )}
                  {invoice && (
                    <TabsTrigger value="invoice" data-value="invoice">Invoice</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  {/* Vehicle info */}
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Car className="mr-2 h-5 w-5 text-primary" />
                      Vehicle Information
                    </h3>
                    <div className="bg-muted/50 p-4 rounded-md grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Make & Model</p>
                        <p className="font-medium">
                          {order.vehicle ? `${order.vehicle.make} ${order.vehicle.model}` : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Year</p>
                        <p className="font-medium">{order.vehicle?.year || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">License Plate</p>
                        <p className="font-medium">{order.vehicle?.licensePlate || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service info */}
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Wrench className="mr-2 h-5 w-5 text-primary" />
                      Service Information
                    </h3>
                    <div className="bg-muted/50 p-4 rounded-md">
                      <h4 className="font-medium text-primary">
                        {order.service?.serviceName || 'Custom Service'}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.service?.description || 'No description available'}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm">Service Price</span>
                        <span className="font-medium">PKR {order.service?.price?.toFixed(2) || '0.00'}</span>
                      </div>

                      {order.includesInspection && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">Includes Inspection</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-800">
                            Yes
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Additional Services */}
                    {order.additionalServices && order.additionalServices.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Additional Services</h4>
                        {order.additionalServices.map((service: any, index: number) => (
                          <div key={service.serviceId || index} className="bg-muted/50 p-4 rounded-md mb-2">
                            <h4 className="font-medium text-primary">
                              {service.serviceName}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description || 'No description available'}
                            </p>
                            <div className="flex justify-between items-center mt-3">
                              <span className="text-sm">Service Price</span>
                              <span className="font-medium">PKR {service.price?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment info */}
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <DollarSign className="mr-2 h-5 w-5 text-primary" />
                      Payment Information
                    </h3>
                    <div className="bg-muted/50 p-4 rounded-md">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span>Main Service</span>
                        <span>PKR {order.service?.price?.toFixed(2) || '0.00'}</span>
                      </div>

                      {order.includesInspection && order.inspection && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span>Inspection Fee</span>
                          <span>PKR {order.inspection.price?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}

                      {order.additionalServices && order.additionalServices.length > 0 && (
                        <div className="flex justify-between items-center py-2 border-b">
                          <span>Additional Services</span>
                          <span>
                            PKR {order.additionalServices
                              .reduce((sum: number, service: any) => sum + (parseFloat(service.price) || 0), 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 font-medium">
                        <span>Total Amount</span>
                        <span>PKR {order.totalAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes section */}
                  {order.notes && (
                    <div className="p-4 bg-muted/50 rounded-md">
                      <h3 className="font-medium mb-2 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Order Notes
                      </h3>
                      <p className="text-sm">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                {order.includesInspection && order.inspection && (
                  <TabsContent value="inspection" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-blue-50 rounded-md">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-blue-600">Inspection Date</p>
                          <p className="font-medium">{formatDate(order.inspection.scheduledDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-blue-600">Time Slot</p>
                          <p className="font-medium">{order.inspection.timeSlot || 'Not specified'}</p>
                        </div>
                      </div>
                      <Badge className={getStatusBadgeStyle(order.inspection.status)}>
                        {order.inspection.status}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-medium flex items-center mt-4">
                      <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                      Inspection Results
                    </h3>

                    {order.inspection.status === 'completed' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="p-3 border rounded-md">
                          <p className="text-sm text-muted-foreground">Body Condition</p>
                          <p className="font-medium">{order.inspection.bodyCondition || 'Not inspected'}</p>
                        </div>
                        <div className="p-3 border rounded-md">
                          <p className="text-sm text-muted-foreground">Engine Condition</p>
                          <p className="font-medium">{order.inspection.engineCondition || 'Not inspected'}</p>
                        </div>
                        <div className="p-3 border rounded-md">
                          <p className="text-sm text-muted-foreground">Electrical Condition</p>
                          <p className="font-medium">{order.inspection.electricalCondition || 'Not inspected'}</p>
                        </div>
                        <div className="p-3 border rounded-md">
                          <p className="text-sm text-muted-foreground">Tire Condition</p>
                          <p className="font-medium">{order.inspection.tireCondition || 'Not inspected'}</p>
                        </div>
                        <div className="p-3 border rounded-md">
                          <p className="text-sm text-muted-foreground">Brake Condition</p>
                          <p className="font-medium">{order.inspection.brakeCondition || 'Not inspected'}</p>
                        </div>
                        {order.inspection.transmissionCondition && (
                          <div className="p-3 border rounded-md">
                            <p className="text-sm text-muted-foreground">Transmission Condition</p>
                            <p className="font-medium">{order.inspection.transmissionCondition}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-muted/30 rounded-md text-center">
                        <p className="text-muted-foreground">
                          {order.inspection.status === 'pending'
                            ? 'Your vehicle inspection is scheduled but has not been completed yet.'
                            : order.inspection.status === 'in progress'
                              ? 'Your vehicle is currently being inspected.'
                              : `Inspection status: ${order.inspection.status}`}
                        </p>
                      </div>
                    )}

                    {order.inspection.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Inspection Notes</h4>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">
                          {order.inspection.notes}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                )}

                {invoice && (
                  <TabsContent value="invoice">
                    <div className="p-4 bg-white rounded-md border border-gray-200 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium flex items-center">
                          <ReceiptText className="mr-2 h-5 w-5 text-primary" />
                          Invoice #{invoice.invoice.invoiceId}
                        </h3>
                        <Badge className={getStatusBadgeStyle(invoice.invoice.status)}>
                          {invoice.invoice.status}
                        </Badge>
                      </div>

                      {/* Invoice Details */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="text-sm font-medium mb-2 flex items-center">
                              <User className="h-4 w-4 mr-2 text-primary" />
                              Customer Information
                            </h3>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Name:</span> {invoice.customer?.name || 'N/A'}</p>
                              <p><span className="font-medium">Email:</span> {invoice.customer?.email || 'N/A'}</p>
                              <p><span className="font-medium">Phone:</span> {invoice.customer?.phone || 'N/A'}</p>
                              {invoice.customer?.address && (
                                <p><span className="font-medium">Address:</span> {invoice.customer.address}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div className="bg-gray-50 p-4 rounded-md">
                              <h3 className="text-sm font-medium mb-2">Invoice Information</h3>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between mb-1">
                                  <span>Issue Date:</span>
                                  <span>{formatDate(invoice.invoice.invoiceDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Due Date:</span>
                                  <span className={invoice.invoice.status === 'overdue' ? 'text-red-500 font-medium' : ''}>
                                    {formatDate(invoice.invoice.dueDate)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setInvoiceDialogOpen(true)}
                              >
                                <ReceiptText className="mr-2 h-4 w-4" />
                                View Full Invoice
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Invoice Summary */}
                        <div>
                          <h3 className="text-sm font-medium mb-2">Summary</h3>
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-4 py-2">Description</th>
                                  <th className="text-right px-4 py-2">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t">
                                  <td className="px-4 py-2">Subtotal</td>
                                  <td className="px-4 py-2 text-right">
                                    PKR {typeof invoice?.invoice?.subTotal === 'number'
                                      ? invoice.invoice.subTotal.toFixed(2)
                                      : parseFloat(invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount || '0').toFixed(2)}
                                  </td>
                                </tr>
                                <tr className="border-t">
                                  <td className="px-4 py-2">
                                    Tax ({invoice?.invoice?.taxRate ? `${invoice.invoice.taxRate}%` : '18%'})
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    PKR {typeof invoice?.invoice?.taxAmount === 'number'
                                      ? invoice.invoice.taxAmount.toFixed(2)
                                      : (parseFloat(invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount || '0') * 0.18).toFixed(2)}
                                  </td>
                                </tr>
                                <tr className="border-t font-medium">
                                  <td className="px-4 py-2">Total</td>
                                  <td className="px-4 py-2 text-right">
                                    PKR {typeof invoice?.invoice?.totalAmount === 'number'
                                      ? invoice.invoice.totalAmount.toFixed(2)
                                      : parseFloat(invoice?.invoice?.totalAmount || '0').toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Pay Now Button (if not paid) */}
                        {invoice.invoice.status !== 'paid' && (
                          <Button
                            variant="default"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => router.push(`/invoice/pay/${invoice.invoice.invoiceId}`)}

                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.push('/orders')}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>

              {order.status === 'pending' && (
                <Button variant="destructive" size="sm">
                  Cancel Order
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="mr-2 h-5 w-5 text-primary" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  <Badge className={getStatusBadgeStyle(order.status)}>
                    {order.status}
                  </Badge>
                </div>

                {/* Invoice section - Show if invoice exists */}
                {invoice && (
                  <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium flex items-center text-primary">
                        <ReceiptText className="mr-2 h-4 w-4" />
                        Invoice #{invoice.invoice.invoiceId}
                      </h3>
                      <Badge className={getStatusBadgeStyle(invoice.invoice.status)}>
                        {invoice.invoice.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2 mb-2">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold">
                        PKR {typeof invoice?.invoice?.totalAmount === 'number'
                          ? invoice.invoice.totalAmount.toFixed(2)
                          : parseFloat(invoice?.invoice?.totalAmount || '0').toFixed(2)}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground mb-4">
                      <div className="flex justify-between mb-1">
                        <span>Issue Date:</span>
                        <span>{formatDate(invoice.invoice.invoiceDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span className={invoice.invoice.status === 'overdue' ? 'text-red-500 font-medium' : ''}>
                          {formatDate(invoice.invoice.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={handleViewInvoice}
                      >
                        <ReceiptText className="mr-2 h-4 w-4" />
                        View Full Invoice
                      </Button>

                      {invoice.invoice.status !== 'paid' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => router.push(`/invoice/pay/${invoice.invoice.invoiceId}`)}

                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Status timeline */}
                <div className="space-y-4">
                  <div className="relative border-l-2 pl-4 pb-2 pt-1 border-green-500">
                    <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-2"></div>
                    <p className="text-sm font-medium">Order Placed</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.orderDate)}
                    </p>
                  </div>

                  {order.includesInspection && order.inspection && (
                    <div className={`relative border-l-2 pl-4 pb-2 pt-1 ${order.inspection.status === 'pending' ? 'border-yellow-500' : order.inspection.status === 'completed' ? 'border-green-500' : order.inspection.status === 'in progress' ? 'border-blue-500' : 'border-gray-500'}`}>
                      <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-2 ${order.inspection.status === 'pending' ? 'bg-yellow-500' : order.inspection.status === 'completed' ? 'bg-green-500' : order.inspection.status === 'in progress' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                      <p className="text-sm font-medium">Inspection {order.inspection.status === 'completed' ? 'Completed' : order.inspection.status === 'in progress' ? 'In Progress' : 'Scheduled'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.inspection.scheduledDate)}
                      </p>
                    </div>
                  )}

                  {order.status === 'completed' && (
                    <div className="relative border-l-2 pl-4 pb-2 pt-1 border-green-500">
                      <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-2"></div>
                      <p className="text-sm font-medium">Order Completed</p>
                      <p className="text-xs text-muted-foreground">
                        Your order has been completed
                      </p>
                    </div>
                  )}

                  {invoice && (
                    <div className="relative border-l-2 pl-4 pb-2 pt-1 border-blue-500">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-2"></div>
                      <p className="text-sm font-medium">Invoice Issued</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(invoice.invoice.invoiceDate)}
                      </p>
                    </div>
                  )}

                  {invoice && invoice.invoice.status === 'paid' && (
                    <div className="relative border-l-2 pl-4 pb-2 pt-1 border-green-500">
                      <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-2"></div>
                      <p className="text-sm font-medium">Payment Received</p>
                      <p className="text-xs text-muted-foreground">
                        Thank you for your payment
                      </p>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="relative border-l-2 pl-4 pb-2 pt-1 border-red-500">
                      <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-2"></div>
                      <p className="text-sm font-medium">Order Cancelled</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact information */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm">+1 (234) 567-8900</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm">support@motomate.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Full Dialog */}
      {invoice && (
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Invoice #{invoice.invoice.invoiceId}</span>
                <Badge className={getStatusBadgeStyle(invoice.invoice.status)}>
                  {invoice.invoice.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Issued on {formatDate(invoice.invoice.invoiceDate)}
              </DialogDescription>
            </DialogHeader>

            <div id="invoice-printable" className="p-4">
              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    Customer Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {invoice.customer?.name || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {invoice.customer?.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {invoice.customer?.phone || 'N/A'}</p>
                    {invoice.customer?.address && (
                      <p><span className="font-medium">Address:</span> {invoice.customer.address}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Car className="h-4 w-4 mr-2 text-primary" />
                    Vehicle Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Make & Model:</span>
                      {invoice.vehicle ? `${invoice.vehicle.make} ${invoice.vehicle.model}` : 'N/A'}
                    </p>
                    <p><span className="font-medium">Year:</span> {invoice.vehicle?.year || 'N/A'}</p>
                    <p><span className="font-medium">License Plate:</span> {invoice.vehicle?.licensePlate || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Service Details</h3>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2">Description</th>
                        <th className="text-center px-4 py-2">Qty</th>
                        <th className="text-right px-4 py-2">Unit Price</th>
                        <th className="text-right px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(() => {
                        // Get invoice items
                        let items = [];

                        if (invoice?.invoice?.invoiceItems?.$values) {
                          items = invoice.invoice.invoiceItems.$values;
                        } else if (invoice?.invoiceItems?.$values) {
                          items = invoice.invoiceItems.$values;
                        }

                        if (items.length > 0) {
                          return items.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2">{item.description}</td>
                              <td className="px-4 py-2 text-center">{item.quantity}</td>
                              <td className="px-4 py-2 text-right">
                                PKR {typeof item.unitPrice === 'number'
                                  ? item.unitPrice.toFixed(2)
                                  : parseFloat(item.unitPrice || '0').toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                PKR {typeof item.totalPrice === 'number'
                                  ? item.totalPrice.toFixed(2)
                                  : parseFloat(item.totalPrice || '0').toFixed(2)}
                              </td>
                            </tr>
                          ));
                        } else {
                          return (
                            <tr>
                              <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                                No items found
                              </td>
                            </tr>
                          );
                        }
                      })()}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-medium">Subtotal</td>
                        <td className="px-4 py-2 text-right">
                          PKR {typeof invoice?.invoice?.subTotal === 'number'
                            ? invoice.invoice.subTotal.toFixed(2)
                            : parseFloat(invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount || '0').toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-medium">
                          Tax ({invoice?.invoice?.taxRate ? `${invoice.invoice.taxRate}%` : '18%'})
                        </td>
                        <td className="px-4 py-2 text-right">
                          PKR {typeof invoice?.invoice?.taxAmount === 'number'
                            ? invoice.invoice.taxAmount.toFixed(2)
                            : (parseFloat(invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount || '0') * 0.18).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={3} className="px-4 py-2 text-right">Total Amount</td>
                        <td className="px-4 py-2 text-right">
                          PKR {typeof invoice?.invoice?.totalAmount === 'number'
                            ? invoice.invoice.totalAmount.toFixed(2)
                            : parseFloat(invoice?.invoice?.totalAmount || '0').toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Notes</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">
                    {invoice.invoice.notes || 'No notes provided.'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Payment Terms</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">
                    Due on {formatDate(invoice.invoice.dueDate)}
                  </p>
                  {invoice.mechanic && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Service Performed By</h3>
                      <p className="text-sm bg-gray-50 p-3 rounded-md">
                        {invoice.mechanic.name} - {invoice.mechanic.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-gray-500 text-xs mt-6">
                <p>Thank you for choosing MotoMate Auto Services</p>
                <p>For any queries regarding this invoice, please contact us.</p>
              </div>
            </div>

            <DialogFooter className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrintInvoice}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>

              <Button
                variant="outline"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>

              {invoice.invoice.status !== 'paid' && (
                <Button
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => router.push(`/invoice/pay/${invoice.invoice.invoiceId}`)}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}