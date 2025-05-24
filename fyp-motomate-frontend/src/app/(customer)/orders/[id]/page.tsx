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
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  CheckCircle2,
  Timer,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  CircleDot,
  ArrowUpRight,
  CircleCheck,
  ClipboardList,
  Building,
  CalendarCheck,
  CircleDashed,
  CalendarX,
  FileCheck,
  TimerOff,
  Receipt,
  BadgeCheck,
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
      console.log(response.data);
      

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

  // Format time
  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch (e) {
      return timeString; // Return original string if it's not a date
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
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40';
      case 'in progress':
      case 'inprogress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40';
      case 'issued':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-900/40';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'cancelled':
        return <CalendarX className="h-5 w-5" />;
      case 'in progress':
      case 'inprogress':
        return <Timer className="h-5 w-5" />;
      case 'paid':
        return <Receipt className="h-5 w-5" />;
      case 'issued':
        return <FileCheck className="h-5 w-5" />;
      case 'overdue':
        return <TimerOff className="h-5 w-5" />;
      default:
        return <CircleDashed className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <Skeleton className="h-8 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-muted-foreground/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <Skeleton className="h-8 w-36 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-28" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full max-w-md mb-6" />
                <div className="space-y-8">
                  <div>
                    <Skeleton className="h-6 w-40 mb-3" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-6 w-40 mb-3" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
            <p className="text-muted-foreground">View your service order information</p>
          </div>
        </div>
        
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="mb-2">Error Loading Order</AlertTitle>
          <AlertDescription>{error || 'Order not found'}</AlertDescription>
          <div className="flex justify-end mt-4">
            <Button onClick={() => router.push('/orders')} variant="outline">
              Back to Orders
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center gap-3 mb-8">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push('/orders')}
          className="h-9 w-9 rounded-full"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order #{order.orderId}</h1>
          <p className="text-muted-foreground">Placed on {formatDate(order.orderDate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <Card className="border-muted-foreground/20 overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-start justify-between bg-muted/30">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusBadgeStyle(order.status) + " capitalize"}>
                    <span className="flex items-center gap-1.5">
                      {getStatusIcon(order.status)}
                      <span>{order.status}</span>
                    </span>
                  </Badge>
                  {invoice && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                      <Receipt className="h-3 w-3 mr-1" />
                      Invoice Available
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">Service Order</CardTitle>
                <CardDescription>
                  Reference ID: {order.orderId}
                </CardDescription>
              </div>
              
              <div className="flex flex-col items-end mt-0.5">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold">PKR {order.totalAmount.toFixed(2)}</span>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <Tabs defaultValue="details" value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-6 p-1 rounded-lg bg-muted/40">
                  <TabsTrigger 
                    value="details" 
                    className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Order Details
                  </TabsTrigger>
                  {order.includesInspection && order.inspection && (
                    <TabsTrigger 
                      value="inspection" 
                      className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Inspection Results
                    </TabsTrigger>
                  )}
                  {invoice && (
                    <TabsTrigger 
                      value="invoice" 
                      data-value="invoice"
                      className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <ReceiptText className="h-4 w-4 mr-2" />
                      Invoice
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="space-y-8">
                  {/* Vehicle info */}
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-4">
                      <Car className="mr-2 h-5 w-5 text-primary" />
                      Vehicle Information
                    </h3>
                    <div className="bg-muted/30 p-5 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-5 hover:bg-muted/40 transition-colors">
                      {order.vehicle && (
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                            <Car className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-lg font-medium">{order.vehicle.make} {order.vehicle.model}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="rounded-md font-normal">
                                {order.vehicle.year}
                              </Badge>
                              <Badge variant="outline" className="rounded-md font-normal uppercase">
                                {order.vehicle.licensePlate}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col justify-between h-full space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Registration No.</span>
                          <span className="font-medium">{order.vehicle?.licensePlate || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Model Year</span>
                          <span className="font-medium">{order.vehicle?.year || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Vehicle ID</span>
                          <span className="font-medium">{order.vehicleId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service info */}
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-4">
                      <Wrench className="mr-2 h-5 w-5 text-primary" />
                      Service Information
                    </h3>
                    <div className="bg-muted/30 p-5 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                          {order.service?.category?.toLowerCase() === 'inspection' ? (
                            <ShieldCheck className="h-6 w-6 text-primary" />
                          ) : order.service?.category?.toLowerCase() === 'repair' ? (
                            <Wrench className="h-6 w-6 text-primary" />
                          ) : (
                            <ClipboardCheck className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-primary">
                            {order.service?.serviceName || 'Custom Service'}
                          </h4>
                          <p className="text-muted-foreground mt-1">
                            {order.service?.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Service Category</span>
                        <Badge className="capitalize">
                          {order.service?.category || 'Service'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm font-medium">Service Price</span>
                        <span className="font-medium">PKR {order.service?.price?.toFixed(2) || '0.00'}</span>
                      </div>

                      {order.includesInspection && (
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm font-medium">Includes Inspection</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Yes
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Additional Services */}
                    {order.additionalServices && order.additionalServices.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3 flex items-center">
                          <ClipboardList className="h-4 w-4 mr-2 text-primary" />
                          Additional Services
                        </h4>
                        <div className="space-y-3">
                          {order.additionalServices.map((service: any, index: number) => (
                            <div key={service.serviceId || index} className="bg-muted/30 p-4 rounded-lg hover:bg-muted/40 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-primary">
                                    {service.serviceName}
                                  </h5>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {service.description || 'No description available'}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="font-medium">PKR {service.price?.toFixed(2) || '0.00'}</span>
                                  <Badge variant="outline" className="mt-1 capitalize text-xs">
                                    {service.category || 'service'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment info */}
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-4">
                      <DollarSign className="mr-2 h-5 w-5 text-primary" />
                      Payment Summary
                    </h3>
                    <div className="bg-muted/30 p-5 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex justify-between items-center pb-3 border-b">
                        <span>Main Service</span>
                        <span>PKR {order.service?.price?.toFixed(2) || '0.00'}</span>
                      </div>

                      {order.includesInspection && order.inspection && (
                        <div className="flex justify-between items-center py-3 border-b">
                          <span>Inspection Fee</span>
                          <span>PKR {order.inspection.price?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}

                      {order.additionalServices && order.additionalServices.length > 0 && (
                        <div className="flex justify-between items-center py-3 border-b">
                          <span>Additional Services</span>
                          <span>
                            PKR {order.additionalServices
                              .reduce((sum: number, service: any) => sum + (parseFloat(service.price) || 0), 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 font-medium text-lg">
                        <span>Total Amount</span>
                        <span className="text-primary">PKR {order.totalAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                      
                      {invoice && (
                        <div className="mt-4 pt-4 border-t border-dashed">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Payment Status</span>
                            <Badge 
                              className={
                                invoice.invoice.status === 'paid' ? 
                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }
                            >
                              {invoice.invoice.status === 'paid' ? (
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Paid</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </Badge>
                          </div>
                          {invoice.invoice.status !== 'paid' && (
                            <Button
                              variant="default"
                              className="w-full mt-3 bg-green-600 hover:bg-green-700"
                              onClick={() => router.push(`/invoice/pay/${invoice.invoice.invoiceId}`)}
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Pay Now
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes section */}
                  {order.notes && (
                    <div className="bg-muted/30 p-5 rounded-lg hover:bg-muted/40 transition-colors">
                      <h3 className="font-medium mb-3 flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        Order Notes
                      </h3>
                      <p className="text-muted-foreground">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                {order.includesInspection && order.inspection && (
                  <TabsContent value="inspection" className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                          <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Inspection Date</p>
                          <p className="font-medium text-blue-900 dark:text-blue-300">{formatDate(order.inspection.scheduledDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                          <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Time Slot</p>
                          <p className="font-medium text-blue-900 dark:text-blue-300">{order.inspection.timeSlot || 'Not specified'}</p>
                        </div>
                      </div>
                      <Badge className={getStatusBadgeStyle(order.inspection.status) + " capitalize"}>
                        <span className="flex items-center gap-1.5">
                          {getStatusIcon(order.inspection.status)}
                          <span>{order.inspection.status}</span>
                        </span>
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium flex items-center mb-4">
                        <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                        Inspection Results
                      </h3>

                      {order.inspection.status === 'completed' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                            <p className="text-sm text-muted-foreground mb-1">Body Condition</p>
                            <p className="font-medium flex items-center gap-1.5">
                              <CircleDot className="h-3.5 w-3.5 text-primary" />
                              {order.inspection.bodyCondition || 'Not inspected'}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                            <p className="text-sm text-muted-foreground mb-1">Engine Condition</p>
                            <p className="font-medium flex items-center gap-1.5">
                              <CircleDot className="h-3.5 w-3.5 text-primary" />
                              {order.inspection.engineCondition || 'Not inspected'}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                            <p className="text-sm text-muted-foreground mb-1">Electrical Condition</p>
                            <p className="font-medium flex items-center gap-1.5">
                              <CircleDot className="h-3.5 w-3.5 text-primary" />
                              {order.inspection.electricalCondition || 'Not inspected'}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                            <p className="text-sm text-muted-foreground mb-1">Tire Condition</p>
                            <p className="font-medium flex items-center gap-1.5">
                            <CircleDot className="h-3.5 w-3.5 text-primary" />
                            {order.inspection.tireCondition || 'Not inspected'}
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                          <p className="text-sm text-muted-foreground mb-1">Brake Condition</p>
                          <p className="font-medium flex items-center gap-1.5">
                            <CircleDot className="h-3.5 w-3.5 text-primary" />
                            {order.inspection.brakeCondition || 'Not inspected'}
                          </p>
                        </div>
                        {order.inspection.transmissionCondition && (
                          <div className="p-4 border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                            <p className="text-sm text-muted-foreground mb-1">Transmission Condition</p>
                            <p className="font-medium flex items-center gap-1.5">
                              <CircleDot className="h-3.5 w-3.5 text-primary" />
                              {order.inspection.transmissionCondition}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg text-center">
                        {order.inspection.status === 'pending' ? (
                          <>
                            <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h4 className="text-lg font-medium mb-2">Inspection Scheduled</h4>
                            <p className="text-muted-foreground max-w-md">
                              Your vehicle inspection is scheduled but has not been completed yet.
                              We'll notify you once the inspection is complete.
                            </p>
                          </>
                        ) : order.inspection.status === 'in progress' ? (
                          <>
                            <div className="mb-4 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                              <Timer className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="text-lg font-medium mb-2">Inspection In Progress</h4>
                            <p className="text-muted-foreground max-w-md">
                              Your vehicle is currently being inspected by our technicians.
                              Results will be available soon.
                            </p>
                          </>
                        ) : order.inspection.status === 'cancelled' ? (
                          <>
                            <div className="mb-4 bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                              <CalendarX className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h4 className="text-lg font-medium mb-2">Inspection Cancelled</h4>
                            <p className="text-muted-foreground max-w-md">
                              This inspection was cancelled. Please contact customer service
                              if you need to reschedule.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="mb-4 bg-muted p-3 rounded-full">
                              <CircleDashed className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-medium mb-2">Inspection Status: {order.inspection.status}</h4>
                            <p className="text-muted-foreground max-w-md">
                              The current status of your inspection is {order.inspection.status}.
                            </p>
                          </>
                        )}
                      </div>
                    )}
   </div>
                    {order.inspection.notes && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          Inspection Notes
                        </h4>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-muted-foreground whitespace-pre-line">
                            {order.inspection.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}

                {invoice && (
                  <TabsContent value="invoice">
                    <div className="p-6 bg-white dark:bg-muted rounded-lg border border-muted-foreground/20 shadow-sm mb-4">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <ReceiptText className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">Invoice #{invoice.invoice.invoiceId}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(invoice.invoice.invoiceDate)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusBadgeStyle(invoice.invoice.status) + " capitalize px-3 py-1.5"}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(invoice.invoice.status)}
                            <span>{invoice.invoice.status}</span>
                          </span>
                        </Badge>
                      </div>

                      {/* Invoice Details */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="text-sm font-medium mb-3 flex items-center">
                              <User className="h-4 w-4 mr-2 text-primary" />
                              Customer Information
                            </h3>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Name</span>
                                <span className="font-medium">{invoice.customer?.name || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Email</span>
                                <span className="font-medium">{invoice.customer?.email || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Phone</span>
                                <span className="font-medium">{invoice.customer?.phone || 'N/A'}</span>
                              </div>
                              {invoice.customer?.address && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Address</span>
                                  <span className="font-medium text-right max-w-[200px]">{invoice.customer.address}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="text-sm font-medium mb-3">Invoice Information</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Issue Date</span>
                                <span className="font-medium">{formatDate(invoice.invoice.invoiceDate)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Due Date</span>
                                <span className={
                                  invoice.invoice.status === 'overdue' 
                                    ? 'text-red-500 font-medium' 
                                    : 'font-medium'
                                }>
                                  {formatDate(invoice.invoice.dueDate)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Order ID</span>
                                <span className="font-medium">{invoice.invoice.orderId}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <Badge variant="outline" className={
                                  invoice.invoice.status === 'paid'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : invoice.invoice.status === 'overdue'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                }>
                                  {invoice.invoice.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Invoice Summary */}
                        <div>
                          <h3 className="text-sm font-medium mb-3">Summary</h3>
                          <div className="border rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/40">
                                <tr>
                                  <th className="text-left p-3 font-medium">Description</th>
                                  <th className="text-right p-3 font-medium">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                <tr>
                                  <td className="p-3">Subtotal</td>
                                  <td className="p-3 text-right">
                                    PKR {typeof invoice?.invoice?.subTotal === 'number'
                                      ? invoice.invoice.subTotal.toFixed(2)
                                      : parseFloat(invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount || '0').toFixed(2)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="p-3">
                                    Tax ({invoice?.invoice?.taxRate ? `${invoice.invoice.taxRate}%` : '18%'})
                                  </td>
                                  <td className="p-3 text-right">
                                    PKR {typeof invoice?.invoice?.taxAmount === 'number'
                                      ? invoice.invoice.taxAmount.toFixed(2)
                                      : (parseFloat(invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount || '0') * 0.18).toFixed(2)}
                                  </td>
                                </tr>
                                <tr className="bg-muted/20">
                                  <td className="p-3 font-semibold">Total</td>
                                  <td className="p-3 text-right font-semibold text-primary">
                                    PKR {typeof invoice?.invoice?.totalAmount === 'number'
                                      ? invoice.invoice.totalAmount.toFixed(2)
                                      : parseFloat(invoice?.invoice?.totalAmount || '0').toFixed(2)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Invoice Actions */}
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 border-muted-foreground/20"
                            onClick={() => setInvoiceDialogOpen(true)}
                          >
                            <ReceiptText className="mr-2 h-4 w-4" />
                            View Full Invoice
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="flex-1 border-muted-foreground/20"
                            onClick={handlePrintInvoice}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="flex-1 border-muted-foreground/20"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>

                        {/* Pay Now Button (if not paid) */}
                        {invoice.invoice.status !== 'paid' && (
                          <Button
                            variant="default"
                            className="w-full bg-green-600 hover:bg-green-700 mt-3"
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

            <CardFooter className="flex justify-between pt-4 border-t bg-muted/10">
              <Button
                variant="outline"
                onClick={() => router.push('/orders')}
                className="border-muted-foreground/20 hover:border-muted-foreground/40"
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
        <div>
          <div className="space-y-6 sticky top-6">
            <Card className="border-muted-foreground/20 overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <FileCheck className="mr-2 h-5 w-5 text-primary" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">
                {/* Status info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Status</span>
                    <Badge className={getStatusBadgeStyle(order.status) + " capitalize"}>
                      {order.status}
                    </Badge>
                  </div>

                  {/* Invoice section - Show if invoice exists */}
                  {invoice && (
                    <div className="p-4 rounded-lg border border-muted-foreground/20 bg-muted/10 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium flex items-center text-primary">
                          <ReceiptText className="mr-2 h-4 w-4" />
                          Invoice #{invoice.invoice.invoiceId}
                        </h3>
                        <Badge className={getStatusBadgeStyle(invoice.invoice.status) + " capitalize"}>
                          {invoice.invoice.status}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center text-sm pt-2 mb-2">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-primary">
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
                          variant="outline"
                          size="sm"
                          className="w-full group border-muted-foreground/20"
                          onClick={handleViewInvoice}
                        >
                          <ReceiptText className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                          <span className="group-hover:text-primary transition-colors">View Full Invoice</span>
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
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-4">Order Timeline</h4>
                    <div className="space-y-0">
                      <div className="relative border-l-2 pl-4 pb-6 border-green-500">
                        <div className="absolute w-4 h-4 bg-green-500 rounded-full -left-[9px] top-0 ring-4 ring-green-50 dark:ring-green-900/20"></div>
                        <p className="text-sm font-medium">Order Placed</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.orderDate)}
                        </p>
                      </div>

                      {order.includesInspection && order.inspection && (
                        <div className={`relative border-l-2 pl-4 pb-6 
                          ${order.inspection.status === 'pending' 
                            ? 'border-yellow-500' 
                            : order.inspection.status === 'completed' 
                              ? 'border-green-500' 
                              : order.inspection.status === 'in progress' 
                                ? 'border-blue-500' 
                                : 'border-gray-300'}`}>
                          <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-0 ring-4
                            ${order.inspection.status === 'pending' 
                              ? 'bg-yellow-500 ring-yellow-50 dark:ring-yellow-900/20' 
                              : order.inspection.status === 'completed' 
                                ? 'bg-green-500 ring-green-50 dark:ring-green-900/20' 
                                : order.inspection.status === 'in progress' 
                                  ? 'bg-blue-500 ring-blue-50 dark:ring-blue-900/20' 
                                  : 'bg-gray-300 ring-gray-50 dark:ring-gray-900/20'}`}>
                          </div>
                          <p className="text-sm font-medium">
                            Inspection {order.inspection.status === 'completed' 
                              ? 'Completed' 
                              : order.inspection.status === 'in progress' 
                                ? 'In Progress' 
                                : 'Scheduled'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.inspection.scheduledDate)}
                          </p>
                        </div>
                      )}

                      {order.status === 'completed' && (
                        <div className="relative border-l-2 pl-4 pb-6 border-green-500">
                          <div className="absolute w-4 h-4 bg-green-500 rounded-full -left-[9px] top-0 ring-4 ring-green-50 dark:ring-green-900/20"></div>
                          <p className="text-sm font-medium">Order Completed</p>
                          <p className="text-xs text-muted-foreground">
                            Your order has been completed
                          </p>
                        </div>
                      )}

                      {invoice && (
                        <div className="relative border-l-2 pl-4 pb-6 border-blue-500">
                          <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-[9px] top-0 ring-4 ring-blue-50 dark:ring-blue-900/20"></div>
                          <p className="text-sm font-medium">Invoice Issued</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(invoice.invoice.invoiceDate)}
                          </p>
                        </div>
                      )}

                      {invoice && invoice.invoice.status === 'paid' && (
                        <div className="relative border-l-2 pl-4 pb-6 border-green-500">
                          <div className="absolute w-4 h-4 bg-green-500 rounded-full -left-[9px] top-0 ring-4 ring-green-50 dark:ring-green-900/20"></div>
                          <p className="text-sm font-medium">Payment Received</p>
                          <p className="text-xs text-muted-foreground">
                            Thank you for your payment
                          </p>
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="relative border-l-2 pl-4 pb-6 border-red-500">
                          <div className="absolute w-4 h-4 bg-red-500 rounded-full -left-[9px] top-0 ring-4 ring-red-50 dark:ring-red-900/20"></div>
                          <p className="text-sm font-medium">Order Cancelled</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact information */}
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-sm mb-4 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-primary" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start group">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 mr-3 group-hover:text-primary transition-colors" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">+1 (234) 567-8900</p>
                      </div>
                    </div>
                    <div className="flex items-start group">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 mr-3 group-hover:text-primary transition-colors" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">support@motomate.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Invoice Full Dialog */}
      {invoice && (
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ReceiptText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Invoice #{invoice.invoice.invoiceId}</DialogTitle>
                    <DialogDescription>
                      Issued on {formatDate(invoice.invoice.invoiceDate)}
                    </DialogDescription>
                  </div>
                </div>
                <Badge className={getStatusBadgeStyle(invoice.invoice.status) + " capitalize"}>
                  {invoice.invoice.status}
                </Badge>
              </div>
            </DialogHeader>

            <div id="invoice-printable" className="p-4">
              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{invoice.customer?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{invoice.customer?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{invoice.customer?.phone || 'N/A'}</span>
                    </div>
                    {invoice.customer?.address && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address</span>
                        <span className="font-medium text-right max-w-[200px]">{invoice.customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Car className="h-4 w-4 mr-2 text-primary" />
                    Vehicle Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Make & Model</span>
                      <span className="font-medium">
                        {invoice.vehicle ? `${invoice.vehicle.make} ${invoice.vehicle.model}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Year</span>
                      <span className="font-medium">{invoice.vehicle?.year || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License Plate</span>
                      <span className="font-medium">{invoice.vehicle?.licensePlate || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>


{/* Invoice Items Table */}
<div className="mb-6">
  <h3 className="text-sm font-medium mb-3">Service Details</h3>
  <div className="border rounded-lg overflow-hidden shadow-sm">
    <table className="w-full text-sm">
      <thead className="bg-muted/30">
        <tr>
          <th className="text-left p-3 font-medium">Description</th>
          <th className="text-center p-3 font-medium">Qty</th>
          <th className="text-right p-3 font-medium">Unit Price</th>
          <th className="text-right p-3 font-medium">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {(() => {
          // Get invoice items - handle different response structures
          let items = [];

          // Check different possible structures for invoice items
          if (invoice?.invoiceItems && Array.isArray(invoice.invoiceItems)) {
            items = invoice.invoiceItems;
          } else if (invoice?.invoice?.invoiceItems && Array.isArray(invoice.invoice.invoiceItems)) {
            items = invoice.invoice.invoiceItems;
          } else if (invoice?.invoiceItems?.$values) {
            items = invoice.invoiceItems.$values;
          } else if (invoice?.invoice?.invoiceItems?.$values) {
            items = invoice.invoice.invoiceItems.$values;
          }

          console.log('Invoice items found:', items); // Debug log

          if (items && items.length > 0) {
            return items.map((item: any, index: number) => (
              <tr key={item.invoiceItemId || index} className="hover:bg-muted/10">
                <td className="px-4 py-3">{item.description || 'Service Item'}</td>
                <td className="px-4 py-3 text-center">{item.quantity || 1}</td>
                <td className="px-4 py-3 text-right">
                  PKR {typeof item.unitPrice === 'number'
                    ? item.unitPrice.toFixed(2)
                    : parseFloat(item.unitPrice || '0').toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  PKR {typeof item.totalPrice === 'number'
                    ? item.totalPrice.toFixed(2)
                    : parseFloat(item.totalPrice || '0').toFixed(2)}
                </td>
              </tr>
            ));
          } else {
            // If no invoice items found, show order services instead
            let fallbackItems = [];
            
            // Try to get services from order data
            if (invoice?.order?.service) {
              fallbackItems.push({
                description: invoice.order.service.serviceName || 'Main Service',
                quantity: 1,
                unitPrice: invoice.order.service.price || 0,
                totalPrice: invoice.order.service.price || 0
              });
            }

            // Add inspection if available
            if (invoice?.order?.inspection?.price) {
              fallbackItems.push({
                description: `Inspection - ${invoice.order.inspection.serviceName || 'Vehicle Inspection'}`,
                quantity: 1,
                unitPrice: invoice.order.inspection.price,
                totalPrice: invoice.order.inspection.price
              });
            }

            // Add additional services if available
            if (invoice?.order?.additionalServices && Array.isArray(invoice.order.additionalServices)) {
              invoice.order.additionalServices.forEach((service: any) => {
                fallbackItems.push({
                  description: service.serviceName || 'Additional Service',
                  quantity: 1,
                  unitPrice: service.price || 0,
                  totalPrice: service.price || 0
                });
              });
            }

            if (fallbackItems.length > 0) {
              return fallbackItems.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-muted/10">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    PKR {typeof item.unitPrice === 'number'
                      ? item.unitPrice.toFixed(2)
                      : parseFloat(item.unitPrice || '0').toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    PKR {typeof item.totalPrice === 'number'
                      ? item.totalPrice.toFixed(2)
                      : parseFloat(item.totalPrice || '0').toFixed(2)}
                  </td>
                </tr>
              ));
            } else {
              return (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No service details available</p>
                      <p className="text-xs text-muted-foreground">
                        Invoice items may not have been generated properly
                      </p>
                    </div>
                  </td>
                </tr>
              );
            }
          }
        })()}
      </tbody>
      <tfoot className="bg-muted/20">
        <tr>
          <td colSpan={3} className="px-4 py-3 text-right font-medium">Subtotal</td>
          <td className="px-4 py-3 text-right font-medium">
            PKR {(() => {
              const subtotal = invoice?.invoice?.subTotal || invoice?.invoice?.totalAmount;
              if (typeof subtotal === 'number') {
                return subtotal.toFixed(2);
              }
              // Calculate subtotal from total if not available
              const total = parseFloat(invoice?.invoice?.totalAmount || '0');
              const calculatedSubtotal = total / 1.18; // Assuming 18% tax
              return calculatedSubtotal.toFixed(2);
            })()}
          </td>
        </tr>
        <tr>
          <td colSpan={3} className="px-4 py-3 text-right font-medium">
            Tax ({invoice?.invoice?.taxRate ? `${invoice.invoice.taxRate}%` : '18%'})
          </td>
          <td className="px-4 py-3 text-right font-medium">
            PKR {(() => {
              const taxAmount = invoice?.invoice?.taxAmount;
              if (typeof taxAmount === 'number') {
                return taxAmount.toFixed(2);
              }
              // Calculate tax from total if not available
              const total = parseFloat(invoice?.invoice?.totalAmount || '0');
              const calculatedTax = total - (total / 1.18);
              return calculatedTax.toFixed(2);
            })()}
          </td>
        </tr>
        <tr className="border-t-2">
          <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total Amount</td>
          <td className="px-4 py-3 text-right font-semibold text-primary">
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
                <h3 className="text-sm font-medium mb-3">Notes</h3>
                <div className="bg-muted/30 p-4 rounded-lg min-h-[100px]">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {invoice.invoice.notes || 'No notes provided.'}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">Payment Information</h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge 
                      className={
                        invoice.invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : invoice.invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }
                    >
                      {invoice.invoice.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className={
                      invoice.invoice.status === 'overdue' 
                        ? 'font-medium text-red-600 dark:text-red-400' 
                        : 'font-medium'
                    }>
                      {formatDate(invoice.invoice.dueDate)}
                    </span>
                  </div>
                  {invoice.mechanic && (
                    <div className="pt-3 mt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Service Performed By</p>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium">{invoice.mechanic.name}</span>
                      </div>
                      {invoice.mechanic.phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm">{invoice.mechanic.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t pt-4 mt-6">
              <div className="flex items-center justify-center mb-2">
                <BadgeCheck className="h-5 w-5 text-primary mr-2" />
                <h4 className="font-medium">Thank you for choosing MotoMate Auto Services</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                For any queries regarding this invoice, please contact our customer service.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-wrap sm:flex-nowrap gap-3 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1 border-muted-foreground/20 hover:border-primary/30"
              onClick={handlePrintInvoice}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>

            <Button
              variant="outline"
              className="flex-1 border-muted-foreground/20 hover:border-primary/30"
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