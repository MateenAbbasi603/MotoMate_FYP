'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppointmentDialog from '@/components/Admin/AppointmentDialog';
import {
  ChevronLeft,
  Pencil,
  Calendar,
  Car,
  User,
  Wrench,
  CreditCard,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Mail,
  Phone,
  UserCheck,
  Plus,
  PenTool,
  Loader2,
  CheckCheck,
  ArrowUpRight,
  ShieldCheck,
  CircleCheck,
  Activity,
  Package,
  Banknote,
  Tag,
  Clipboard,
  ChevronRight,
  XCircle,
  BadgeCheck,
  CalendarClock,
  BellRing,
  Receipt,
  ArrowRight,
  Car as CarIcon,
  Settings,
  GaugeCircle,
  ListChecks,
  CircleDashed,
  ReceiptText,
  Printer,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import orderService from '../../../../../../services/orderService';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import invoiceService from '../../../../../../services/invoiceService';
import apiClient from '../../../../services/apiClient';
import WalkInBillModal from '@/components/Admin/WalkInBillModal';
interface InspectionData {
  inspectionId: number;
  scheduledDate: string;
  status: string;
  timeSlot: string;
  bodyCondition: string;
  engineCondition: string;
  electricalCondition: string;
  tireCondition: string;
  brakeCondition: string;
  transmissionCondition?: string;
  interiorCondition: string
  suspensionCondition: string
  description?: string
  notes?: string;
  price?: number;
  serviceId?: number;
  subCategory: string;
  serviceName: string;
}

interface VehicleData {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface ServiceData {
  serviceId: number;
  serviceName: string;
  price: number;
  description: string;
  category: string;
  $id?: string;
  subCategory?: string;
}

interface UserData {
  userId: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  [key: string]: any; // Allow extra fields like isNewUser, username, temporaryPassword
}

interface OrderData {
  orderId: number;
  userId: number;
  serviceId?: number;
  vehicleId?: number;
  status: string;
  orderDate: string;
  totalAmount: number;
  notes?: string;
  includesInspection: boolean;
  invoiceStatus?: string;
  invoiceId?: number;
  user: UserData;
  vehicle: VehicleData;
  service?: ServiceData;
  inspection?: InspectionData;
  paymentMethod: string;
  additionalServices?: ServiceData[] | { $values?: ServiceData[] };
  orderType?: string;
  isWalkIn?: boolean;
}

// Enhanced status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'in progress':
      case 'inprogress':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'awaiting parts':
        return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'completed':
        return <CircleCheck className="h-3.5 w-3.5 mr-1" />;
      case 'pending':
        return <CircleDashed className="h-3.5 w-3.5 mr-1" />;
      case 'cancelled':
        return <XCircle className="h-3.5 w-3.5 mr-1" />;
      case 'in progress':
      case 'inprogress':
        return <Activity className="h-3.5 w-3.5 mr-1" />;
      case 'awaiting parts':
        return <Package className="h-3.5 w-3.5 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Badge className={`flex items-center gap-1 font-medium shadow-sm ${getStatusStyles(status)}`} variant="outline">
      {getStatusIcon(status)}
      {status || 'Unknown'}
    </Badge>
  );
};

// Invoice status badge component
const InvoiceStatusBadge = ({ status }: { status?: string }) => {
  if (!status) return null;

  const getStatusStyles = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
      case 'issued':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'paid':
        return <Banknote className="h-3.5 w-3.5 mr-1" />;
      case 'issued':
        return <ReceiptText className="h-3.5 w-3.5 mr-1" />;
      case 'overdue':
        return <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Badge className={`flex items-center gap-1 shadow-sm ${getStatusStyles(status)}`} variant="outline">
      {getStatusIcon(status)}
      {status}
    </Badge>
  );
};

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [serviceNotes, setServiceNotes] = useState<string>('');
  const [isAddingService, setIsAddingService] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [isTransferringService, setIsTransferringService] = useState<boolean>(false);
  const [serviceTransferred, setServiceTransferred] = useState<boolean>(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [isDialogMounted, setIsDialogMounted] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [inspectionReports, setInspectionReports] = useState<any[]>([]);
  const [mechanicInfo, setMechanicInfo] = useState<{ name: string; phone: string } | null>(null);
  const [loadingMechanic, setLoadingMechanic] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Helper function to check if this is an inspection-only order
  const isInspectionOnlyOrder = (): boolean => {
    return Boolean(!order?.service && !order?.serviceId && order?.includesInspection && order?.inspection);
  };

  const handleProcessCashPayment = async () => {
    if (!order || !invoiceId) return;

    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please log in again to continue");
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Payments/process-safepay`,
        {
          invoiceId,
          transactionId: `CASH_${Date.now()}` // Generate a cash transaction ID
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        toast.success("Cash payment processed successfully");

        // Update the order state to reflect payment received
        setOrder({
          ...order,
          invoiceStatus: 'paid'
        });
      } else {
        toast.error(response.data?.message || "Failed to process payment");
      }
    } catch (error: any) {
      console.error('Error processing cash payment:', error);
      toast.error(error.response?.data?.message || "Failed to process payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!order) return;

    try {
      setGeneratingInvoice(true);
      const response = await invoiceService.generateFromOrder(order.orderId.toString());

      if (response.success) {
        toast.success(response.isExisting ? 'Invoice already exists' : 'Invoice generated successfully');

        // Set the invoice ID to trigger the button change
        setInvoiceId(response.invoice.invoiceId);

        // Update the order state with invoice information
        setOrder({
          ...order,
          paymentMethod: order.paymentMethod || 'Cash',
          invoiceStatus: response.invoice.status,
          invoiceId: response.invoice.invoiceId
        });

        // Only redirect for online payments
        if (order.paymentMethod !== 'Cash' && order.paymentMethod !== 'cash') {
          router.push(`/admin/invoices/${response.invoice.invoiceId}`);
        }
      } else {
        toast.error(response.message || 'Failed to generate invoice');
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to generate invoice';
      toast.error(errorMessage);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleTransferToService = async () => {
    if (!order || !appointment || !appointment.mechanic) {
      console.error('Transfer validation failed:', {
        hasOrder: !!order,
        hasAppointment: !!appointment,
        hasMechanic: !!appointment?.mechanic
      });
      toast.error("Cannot transfer: No mechanic assigned to inspection");
      return;
    }

    try {
      setIsTransferringService(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please log in again to continue");
        return;
      }

      console.log('Attempting to transfer service for order:', order.orderId);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Orders/${order.orderId}/transfer-to-service`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Transfer response:', response.data);

      if (response.data && response.data.success) {
        toast.success("Service successfully transferred to mechanic");

        // Update the order status
        if (order && response.data.order) {
          setOrder({
            ...order,
            status: response.data.order.status
          });
        }

        // Mark service as transferred to hide the button
        setServiceTransferred(true);

        // Refresh page data after successful transfer
        router.refresh();
      } else {
        toast.error(response.data?.message || "Failed to transfer service");
      }
    } catch (error: any) {
      console.error('Error transferring service:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || "Failed to transfer service");
    } finally {
      setIsTransferringService(false);
    }
  };



  // Helper function to normalize additionalServices
  const normalizeAdditionalServices = (orderData: OrderData): ServiceData[] => {
    if (!orderData.additionalServices) {
      return [];
    }

    // If it's an object with $values property
    if (typeof orderData.additionalServices === 'object' &&
      !Array.isArray(orderData.additionalServices) &&
      orderData.additionalServices.$values) {
      return orderData.additionalServices.$values;
    }

    // If it's already an array
    if (Array.isArray(orderData.additionalServices)) {
      return orderData.additionalServices;
    }

    // Default to empty array
    return [];
  };

  // Update the useEffect that fetches order data
useEffect(() => {
  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Call both API requests in parallel
      const [orderResponse, servicesResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Orders/${id}`),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Services`)
      ]);

      // Process order data from the updated response format
      const orderData = orderResponse.data.order;
      const appointmentData = orderResponse.data.appointment;

      if (!orderData) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      // Initialize order with the data we have
      let enhancedOrder = {
        ...orderData,
        paymentMethod: orderData.paymentMethod || 'online'
      };

      // Normalize additionalServices
      const normalizedAdditionalServices = normalizeAdditionalServices(enhancedOrder);
      enhancedOrder.additionalServices = normalizedAdditionalServices;

      // Set appointment data if it exists
      if (appointmentData) {
        console.log('Setting appointment data:', appointmentData);
        setAppointment(appointmentData);
      } else {
        console.log('No appointment data found for this order');
        setAppointment(null);
      }

      // If the order details don't include user or vehicle data, fetch it separately
      if ((!enhancedOrder.user || !enhancedOrder.vehicle) && orderData.userId && orderData.vehicleId) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';
          const combinedResponse = await axios.get(
            `${API_URL}/api/Detail/combined-details?userId=${orderData.userId}&vehicleId=${orderData.vehicleId}${orderData.serviceId ? `&serviceId=${orderData.serviceId}` : ''}`
          );

          // Update order with combined details
          enhancedOrder = {
            ...enhancedOrder,
            user: combinedResponse.data.user || enhancedOrder.user,
            vehicle: combinedResponse.data.vehicle || enhancedOrder.vehicle,
            service: combinedResponse.data.service || enhancedOrder.service
          };
        } catch (combinedErr) {
          console.error('Failed to fetch combined details:', combinedErr);
        }
      }

      // If the order includes an inspection but doesn't have price info, fetch the inspection service details
      if (enhancedOrder.includesInspection && enhancedOrder.inspection && !enhancedOrder.inspection.price) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';
          const inspectionServiceId = enhancedOrder.inspection.serviceId || orderData.inspection?.serviceId;

          if (inspectionServiceId) {
            const inspectionServiceResponse = await axios.get(
              `${API_URL}/api/Services/${inspectionServiceId}`
            );

            // Update the inspection with the service price
            enhancedOrder = {
              ...enhancedOrder,
              inspection: {
                ...enhancedOrder.inspection,
                price: inspectionServiceResponse.data.price
              }
            };
          }
        } catch (serviceErr) {
          console.error('Failed to fetch inspection service details:', serviceErr);
        }
      }

      // Set invoiceId if it exists in the order
      if (enhancedOrder.invoiceId) {
        setInvoiceId(enhancedOrder.invoiceId);
      }

      setOrder(enhancedOrder);

      // Process services data
      let servicesData = [];
      if (servicesResponse.data && servicesResponse.data.$values) {
        servicesData = servicesResponse.data.$values;
      } else if (Array.isArray(servicesResponse.data)) {
        servicesData = servicesResponse.data;
      } else {
        console.error("Invalid services data format:", servicesResponse.data);
        toast.error("Failed to load services data");
      }

      // Filter out inspection services
      const nonInspectionServices = servicesData.filter(
        (service: ServiceData) => service.category.toLowerCase() !== 'inspection'
      );

      setServices(nonInspectionServices);
    } catch (err) {
      console.error(`Failed to fetch order ${id} or services:`, err);
      setError('Failed to load order details. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);

useEffect(() => {
  if (order?.orderId) {
    fetchInspectionReports();
  }
}, [order?.orderId]);

const fetchInspectionReports = async () => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';
    if (!order?.orderId) return;
    const response = await axios.get(
      `${API_URL}/api/Inspections/report/order/${order.orderId}`
    );
    let reports = response.data;
    if (reports && reports.$values) reports = reports.$values;
    setInspectionReports(Array.isArray(reports) ? reports : []);
  } catch (err) {
    setInspectionReports([]);
  }
};

  // Format dates
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM dd, yyyy h:mm a');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Calculate total amount including inspection fee
  const calculateTotalAmount = () => {
    const servicePrice = order?.service?.price || 0;
    const inspectionPrice = order?.includesInspection ? order.inspection?.price || 0 : 0;

    // Calculate additional services total
    let additionalServicesTotal = 0;
    if (order?.additionalServices && Array.isArray(order.additionalServices)) {
      additionalServicesTotal = order.additionalServices.reduce(
        (sum, service) => sum + (service.price || 0), 0
      );
    }

    const subtotal = servicePrice + inspectionPrice + additionalServicesTotal;
    // Add 18% SST to the subtotal
    const totalWithTax = subtotal * 1.18;

    return totalWithTax;
  };



  // Handle adding a service to the order
  const handleAddService = useCallback(async () => {
    if (!selectedServiceId) {
      toast.error('Please select a service');
      return;
    }

    try {
      setIsAddingService(true);
      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/Orders/${id}/add-service`,
        {
          serviceId: parseInt(selectedServiceId),
          notes: serviceNotes
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.addedService) {
        // Update the order state with the new service
        const updatedAdditionalServices = [
          ...(Array.isArray(order?.additionalServices) ? order.additionalServices : []),
          response.data.addedService
        ];

        setOrder(prevOrder => ({
          ...prevOrder!,
          additionalServices: updatedAdditionalServices,
          status: response.data.updatedOrder.status,
          totalAmount: response.data.updatedOrder.totalAmount,
          notes: response.data.updatedOrder.notes
        }));

        // Reset form
        setSelectedServiceId('');
        setServiceNotes('');
        setIsDialogOpen(false);

        toast.success('Service added to order successfully');
      } else {
        toast.error('Failed to add service to order');
      }
    } catch (err: any) {
      console.error('Failed to add service to order:', err);

      // Handle specific validation errors
      if (err.response?.status === 400) {
        const errorMessage = err.response.data?.message;
        if (errorMessage?.includes('invoice has already been generated')) {
          toast.error('Cannot add services: Invoice already generated');
          // Update the order state to reflect invoice status
          setOrder(prevOrder => ({
            ...prevOrder!,
            invoiceStatus: err.response.data.invoiceStatus || 'issued',
            invoiceId: err.response.data.invoiceId
          }));
        } else {
          toast.error(errorMessage || 'Cannot add this service to the order');
        }
      } else if (err.response?.status === 401) {
        toast.error('You are not authorized to perform this action. Please log in again.');
      } else if (err.response?.status === 404) {
        toast.error('Order or service not found');
      } else {
        toast.error('Failed to add service to order');
      }
    } finally {
      setIsAddingService(false);
    }
  }, [selectedServiceId, serviceNotes, id, order]);

  // Check if additionalServices is an array and has items
  const hasAdditionalServices = (): boolean => {
    return Array.isArray(order?.additionalServices) && order.additionalServices.length > 0;
  };

  // Get additional services array safely
  const getAdditionalServices = (): ServiceData[] => {
    if (Array.isArray(order?.additionalServices)) {
      return order.additionalServices;
    }
    return [];
  };

  const fetchAppointmentData = async (orderId: number) => {
    try {
      setLoadingAppointment(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
  
      console.log(`Fetching appointment data for order ${orderId}`);
  
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Orders/${orderId}/appointment`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
  
      if (response.data) {
        console.log('Appointment data received:', response.data);
        setAppointment(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching appointment data:', error);
      // Only show error toast for non-404 errors
      if (error.response && error.response.status !== 404) {
        console.error('Failed to load appointment data');
      }
      // For 404, set appointment to null but don't show error
      if (error.response && error.response.status === 404) {
        console.log('No appointment found for this order');
        setAppointment(null);
      }
    } finally {
      setLoadingAppointment(false);
    }
  };

  const handleAppointmentCreated = (newAppointment: any) => {
    setAppointment(newAppointment);

    // Update the order status if not already updated
    if (order && order.status === 'pending') {
      setOrder({
        ...order,
        status: 'in progress'
      });
    }

    toast.success('Mechanic assigned successfully');
  };

  const hasNonInspectionServices = (): boolean => {
    if (!Array.isArray(order?.additionalServices)) return false;

    return order.additionalServices.some(
      service => service.category.toLowerCase() !== 'inspection'
    );
  };

  // Check if there are any inspection services
  const hasInspectionServices = (): boolean => {
    if (!Array.isArray(order?.additionalServices)) return false;

    return order.additionalServices.some(
      service => service.category.toLowerCase() === 'inspection'
    );
  };

  // Helper function to get inspection category icon
  const getInspectionCategoryIcon = (category?: string) => {
    if (!category) return <ShieldCheck className="h-4 w-4 text-blue-600" />;

    const categoryLower = category.toLowerCase();

    switch (categoryLower) {
      case 'bodyinspection': return <Car className="h-4 w-4 text-blue-600" />;
      case 'engineinspection': return <Settings className="h-4 w-4 text-orange-600" />;
      case 'transmissioninspection': return <Settings className="h-4 w-4 text-purple-600" />;
      case 'brakeinspection': return <GaugeCircle className="h-4 w-4 text-red-600" />;
      case 'electricalinspection': return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'tireinspection': return <CircleDashed className="h-4 w-4 text-green-600" />;
      case 'suspensioninspection': return <Package className="h-4 w-4 text-indigo-600" />;
      case 'interiorinspection': return <Car className="h-4 w-4 text-amber-600" />;
      default: return <ShieldCheck className="h-4 w-4 text-blue-600" />;
    }
  };

  // Component for appointment section
  const AppointmentSection = ({ appointment, loadingAppointment }: any) => {
    if (loadingAppointment) {
      return (
        <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border border-muted shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
          <p>Loading appointment information...</p>
        </div>
      );
    }

    if (!appointment) {
      return (
        <div className="p-6 bg-muted/30 rounded-lg border border-muted shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">No Mechanic Assigned</h3>
          </div>
          <p className="text-muted-foreground mb-4">No mechanic has been assigned to this order yet. Assigning a mechanic will update the order status to 'In Progress'.</p>
          <Button
            onClick={() => setIsAppointmentDialogOpen(true)}
            className="w-full"
            variant="outline"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Assign Mechanic
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Appointment Date</p>
              <p className="font-medium">{formatDate(appointment.appointmentDate)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Time Slot</p>
              <p className="font-medium">{appointment.timeSlot}</p>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="bg-muted/20 p-4 rounded-lg border border-muted shadow-sm">
          <h4 className="font-medium mb-3 flex items-center">
            <UserCheck className="mr-2 h-4 w-4 text-primary" />
            Assigned Mechanic
          </h4>
          {appointment.mechanic ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                  {appointment.mechanic.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{appointment.mechanic.name}</p>
                  <p className="text-sm text-muted-foreground">Mechanic</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p>{appointment.mechanic.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{appointment.mechanic.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Mechanic information not available</p>
          )}

          {appointment.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium flex items-center gap-2 mb-1">
                <Clipboard className="h-4 w-4 text-muted-foreground" />
                Appointment Notes
              </p>
              <p className="text-sm bg-muted/30 p-3 rounded-md italic">
                "{appointment.notes}"
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AddServiceDialog = () => {
    // Filter out services that are already in the order
    const availableServices = services.filter(service => {
      // Don't show if it's the main service
      if (order?.serviceId === service.serviceId) {
        return false;
      }

      // Don't show if it's already in additional services
      const additionalServices = getAdditionalServices();
      return !additionalServices.some(addedService => addedService.serviceId === service.serviceId);
    });

    // Check if invoice exists
    const hasInvoice = Boolean(order?.invoiceId && order?.invoiceStatus);

    return (
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setSelectedServiceId('');
          setServiceNotes('');
        }
      }}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shadow-sm"
            disabled={hasInvoice}
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add Additional Service</DialogTitle>
            <DialogDescription>
              {hasInvoice
                ? "Cannot add services to this order. An invoice has already been generated."
                : "Select a service to add to this order"
              }
            </DialogDescription>
          </DialogHeader>

          {hasInvoice ? (
            <div className="py-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Invoice Already Generated</AlertTitle>
                <AlertDescription>
                  You cannot add additional services to this order because an invoice has already been generated.
                  {order?.invoiceId && (
                    <div className="mt-2">
                      <Button variant="link" asChild className="p-0 h-auto">
                        <Link href={`/admin/invoices/${order.invoiceId}`}>
                          View Invoice #{order.invoiceId} →
                        </Link>
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="service">Service</Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                >
                  <SelectTrigger id="service" className="w-full">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.length > 0 ? (
                      availableServices.map((service) => (
                        <SelectItem key={service.serviceId} value={service.serviceId.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{service.serviceName}</span>
                            <Badge variant="outline" className="ml-2 bg-muted/30">
                              PKR {service.price?.toFixed(2) || '0.00'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-services" disabled>
                        No additional services available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Add any specific requirements or details"
                  className="min-h-24"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {hasInvoice ? 'Close' : 'Cancel'}
            </Button>
            {!hasInvoice && (
              <Button
                onClick={handleAddService}
                disabled={isAddingService || !selectedServiceId || availableServices.length === 0}
                className="gap-2"
              >
                {isAddingService ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Service
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Helper to get all customer-selected inspections (main + additional)
  const getSelectedInspections = () => {
    if (!order) return [];
    const additionalServices = Array.isArray(order.additionalServices)
      ? order.additionalServices
      : (order.additionalServices?.$values || []);
    const inspectionServices = additionalServices.filter(
      (service: any) => service.category?.toLowerCase() === 'inspection'
    );
    return [
      ...(order.inspection ? [order.inspection] : []),
      ...inspectionServices
    ];
  };

  const handlePrintInspectionReport = () => {
    if (!order) return;
    const logoUrl = `${window.location.origin}/motomate-logo.png`;
    const selectedInspections = getSelectedInspections();
    const inspectionRows = selectedInspections.map((inspection: any) => {
      const reportsForService = inspectionReports
        .filter((r: any) => r.serviceId === inspection.serviceId && r.orderId === order.orderId)
        .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      const report = reportsForService[0];
      let reportData: any = {};
      try {
        reportData = report?.reportData ? JSON.parse(report.reportData) : {};
      } catch {}
      let resultClass = '', icon = '';
      switch ((reportData.result || '').toLowerCase()) {
        case 'excellent':
          resultClass = 'color:#166534;background:#dcfce7;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '✔️';
          break;
        case 'good':
          resultClass = 'color:#15803d;background:#bbf7d0;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '👍';
          break;
        case 'fair':
          resultClass = 'color:#92400e;background:#fef08a;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '🟡';
          break;
        case 'poor':
          resultClass = 'color:#b91c1c;background:#fee2e2;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '⚠️';
          break;
        case 'critical':
          resultClass = 'color:#fff;background:#b91c1c;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '❌';
          break;
        default:
          resultClass = 'color:#374151;background:#f3f4f6;border-radius:6px;padding:2px 10px;font-weight:600;';
          icon = '';
      }
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${inspection.serviceName}${inspection.subCategory ? ` <span style='font-size:12px;color:#2563eb;'>(${inspection.subCategory})</span>` : ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;"><span style='${resultClass}'>${icon} ${reportData.result || 'Not Inspected Yet'}</span></td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${reportData.notes || 'No notes provided'}</td>
        </tr>
      `;
    }).join('');
    // Mechanic info: prefer appointment.mechanic, fallback to mechanicInfo state
    const mechanicName = appointment?.mechanic?.name || mechanicInfo?.name || '-';
    const mechanicPhone = appointment?.mechanic?.phone || mechanicInfo?.phone || '-';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MOTOMATE INSPECTION REPORT</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #fff; margin: 0; padding: 0; }
            .header-row { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
            .logo { height: 48px; width: 48px; object-fit: contain; }
            .report-title { font-size: 2rem; font-weight: bold; color: #1e293b; letter-spacing: 1px; }
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
            <span class="report-title">MOTOMATE INSPECTION REPORT</span>
          </div>
          <div class="info-grid">
            <div class="info-section">
              <div class="info-title">Vehicle Information</div>
              <div class="info-row"><span class="info-label">Make & Model</span><span class="info-value">${order?.vehicle?.make || ''} ${order?.vehicle?.model || ''}</span></div>
              <div class="info-row"><span class="info-label">Year</span><span class="info-value">${order?.vehicle?.year || ''}</span></div>
              <div class="info-row"><span class="info-label">License Plate</span><span class="info-value">${order?.vehicle?.licensePlate || ''}</span></div>
            </div>
            <div class="info-section">
              <div class="info-title">Customer Information</div>
              <div class="info-row"><span class="info-label">Name</span><span class="info-value">${order?.user?.name || ''}</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-value">${order?.user?.email || ''}</span></div>
              <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${order?.user?.phone || ''}</span></div>
            </div>
          </div>
          <div class="section-title">Inspection Results</div>
          <table>
            <thead>
              <tr>
                <th>Inspection</th>
                <th>Result</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${inspectionRows}
            </tbody>
          </table>
          <div class="section-title">Mechanic Information</div>
          <div class="info-section" style="width: 350px;">
            <div class="info-row"><span class="info-label">Name</span><span class="info-value">${mechanicName}</span></div>
            <div class="info-row"><span class="info-label">Contact</span><span class="info-value">${mechanicPhone}</span></div>
          </div>
          <div class="footer">Generated by MotoMate | ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Fetch mechanic info when inspectionReports are loaded
  useEffect(() => {
    const fetchMechanic = async () => {
      if (inspectionReports.length > 0 && inspectionReports[0].mechanicId) {
        setLoadingMechanic(true);
        try {
          const response = await apiClient.get(`/api/Users/${inspectionReports[0].mechanicId}`);
          if (response.data && response.data.name) {
            setMechanicInfo({ name: response.data.name, phone: response.data.phone || '-' });
          } else if (response.data && response.data.user && response.data.user.name) {
            setMechanicInfo({ name: response.data.user.name, phone: response.data.user.phone || '-' });
          } else {
            setMechanicInfo({ name: '-', phone: '-' });
          }
        } catch {
          setMechanicInfo({ name: '-', phone: '-' });
        } finally {
          setLoadingMechanic(false);
        }
      }
    };
    fetchMechanic();
  }, [inspectionReports]);

  const handlePrintReceipt = () => {
    if (!order) return;
    const logoUrl = `${window.location.origin}/motomate-logo.png`;
    // Prepare receipt rows for services/inspections
    const serviceRows = [];
    if (order.service) {
      serviceRows.push(`<tr><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>${order.service.serviceName}</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Service</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>PKR ${order.service.price?.toFixed(2) || '0.00'}</td></tr>`);
    }
    if (order.includesInspection && order.inspection) {
      serviceRows.push(`<tr><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>${order.inspection.serviceName}${order.inspection.subCategory ? ` <span style='font-size:12px;color:#2563eb;'>(${order.inspection.subCategory})</span>` : ''}</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>Inspection</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>PKR ${order.inspection.price?.toFixed(2) || '0.00'}</td></tr>`);
    }
    if (Array.isArray(order.additionalServices)) {
      order.additionalServices.forEach((service) => {
        serviceRows.push(`<tr><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>${service.serviceName}${service.subCategory ? ` <span style='font-size:12px;color:#2563eb;'>(${service.subCategory})</span>` : ''}</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>${service.category}</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>PKR ${service.price?.toFixed(2) || '0.00'}</td></tr>`);
      });
    }
    // Calculate totals
    const servicePrice = order?.service?.price || 0;
    const inspectionPrice = order?.includesInspection ? order.inspection?.price || 0 : 0;
    const additionalServicesPrice = Array.isArray(order.additionalServices) ? order.additionalServices.reduce((sum, s) => sum + (s.price || 0), 0) : 0;
    const subtotal = servicePrice + inspectionPrice + additionalServicesPrice;
    const taxAmount = subtotal * 0.18;
    const totalWithTax = subtotal + taxAmount;
    // Mechanic info: prefer appointment.mechanic, fallback to mechanicInfo state
    const mechanicName = appointment?.mechanic?.name || mechanicInfo?.name || '-';
    const mechanicPhone = appointment?.mechanic?.phone || mechanicInfo?.phone || '-';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MOTOMATE WALK-IN RECEIPT</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @page { margin: 1cm; size: A4; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #fff; margin: 0; padding: 0; }
            .header-row { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
            .logo { height: 48px; width: 48px; object-fit: contain; }
            .report-title { font-size: 2rem; font-weight: bold; color: #1e293b; letter-spacing: 1px; }
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
            <span class="report-title">MOTOMATE WALK-IN RECEIPT</span>
          </div>
          <div class="info-grid">
            <div class="info-section">
              <div class="info-title">Customer Information</div>
              <div class="info-row"><span class="info-label">Name</span><span class="info-value">${order?.user?.name || ''}</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-value">${order?.user?.email || ''}</span></div>
              <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${order?.user?.phone || ''}</span></div>
            </div>
            <div class="info-section">
              <div class="info-title">Vehicle Information</div>
              <div class="info-row"><span class="info-label">Make & Model</span><span class="info-value">${order?.vehicle?.make || ''} ${order?.vehicle?.model || ''}</span></div>
              <div class="info-row"><span class="info-label">Year</span><span class="info-value">${order?.vehicle?.year || ''}</span></div>
              <div class="info-row"><span class="info-label">License Plate</span><span class="info-value">${order?.vehicle?.licensePlate || ''}</span></div>
            </div>
          </div>
          <div class="section-title">Order Details</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${serviceRows.join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="text-align:right;padding:8px 12px;font-weight:600;">Subtotal</td>
                <td style="padding:8px 12px;font-weight:600;">PKR ${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align:right;padding:8px 12px;font-weight:600;">SST (18%)</td>
                <td style="padding:8px 12px;font-weight:600;">PKR ${taxAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="2" style="text-align:right;padding:8px 12px;font-weight:700;font-size:16px;">Total</td>
                <td style="padding:8px 12px;font-weight:700;font-size:16px;">PKR ${totalWithTax.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="section-title">Mechanic Information</div>
          <div class="info-section" style="width: 350px;">
            <div class="info-row"><span class="info-label">Name</span><span class="info-value">${mechanicName}</span></div>
            <div class="info-row"><span class="info-label">Contact</span><span class="info-value">${mechanicPhone}</span></div>
          </div>
          <div class="footer">Generated by MotoMate | ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Helper to build WalkInBillModal data from order object
  const getWalkInBillData = () => {
    if (!order) return { order: {}, userInfo: {}, billDetails: {} };
    // Safely access possible extra fields on user
    const user: any = order.user || {};
    return {
      order: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        status: order.status,
        OrderType: order.orderType,
      },
      userInfo: {
        isNewUser: user.isNewUser || false,
        userId: user.userId,
        username: user.username || '',
        temporaryPassword: user.temporaryPassword || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      },
      billDetails: {
        orderDate: order.orderDate,
        vehicle: {
          make: order.vehicle?.make,
          model: order.vehicle?.model,
          year: order.vehicle?.year,
          licensePlate: order.vehicle?.licensePlate,
        },
        services: {
          mainService: order.service ? {
            name: order.service.serviceName,
            price: order.service.price
          } : null,
          inspection: order.inspection ? {
            name: order.inspection.serviceName,
            subCategory: order.inspection.subCategory,
            price: order.inspection.price
          } : null
        },
        mechanic: appointment?.mechanic ? {
          name: appointment.mechanic.name,
          phone: appointment.mechanic.phone
        } : mechanicInfo ? {
          name: mechanicInfo.name,
          phone: mechanicInfo.phone
        } : { name: '-', phone: '-' }
      }
    };
  };

  const isWalkInOrder = order && (
    (typeof order.orderType === 'string' && order.orderType.trim() === 'Walk-In') ||
    (!order.orderType && order.paymentMethod === 'Cash' && order.status === 'in progress')
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header section with back button and title */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Order #{order?.orderId}</h1>
            {order && <StatusBadge status={order.status} />}
            {order?.invoiceStatus && <InvoiceStatusBadge status={order.invoiceStatus} />}
            {/* Show inspection-only badge */}
            {order && isInspectionOnlyOrder() && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200" variant="outline">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Inspection Only
              </Badge>
            )}
          </div>
          {order && (
            <p className="text-muted-foreground mt-1">
              Placed on {formatDate(order.orderDate)}
            </p>
          )}
        </div>
        {/* Print/View Receipt button for walk-in orders */}
        {isWalkInOrder && (
          <div className="flex-1 flex justify-end">
            <Button variant="outline" className="gap-2" onClick={() => setShowReceiptModal(true)}>
              <Printer className="h-4 w-4" />
              View Receipt
            </Button>
            <WalkInBillModal
              isOpen={showReceiptModal}
              onClose={() => setShowReceiptModal(false)}
              orderData={getWalkInBillData()}
            />
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      ) : order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-card py-6 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {isInspectionOnlyOrder() ? (
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {isInspectionOnlyOrder() ? 'Inspection Details' : 'Order Details'}
                      </CardTitle>
                      <CardDescription>
                        {isInspectionOnlyOrder()
                          ? 'Vehicle inspection information and status'
                          : 'Details about services, vehicle and payment'
                        }
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AddServiceDialog />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Tabs defaultValue="details" className="w-full">
                  <div className="px-6 pt-4 border-b">
                    <TabsList className={`grid w-full ${isInspectionOnlyOrder() ? 'grid-cols-3' : 'grid-cols-4'}`}>
                      <TabsTrigger value="details" className="flex items-center gap-2">
                        {isInspectionOnlyOrder() ? (
                          <>
                            <ShieldCheck className="h-4 w-4" />
                            Inspection
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4" />
                            Order Info
                          </>
                        )}
                      </TabsTrigger>
                      {order.includesInspection && (
                        <TabsTrigger value="inspection" className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Inspection
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="notes" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes
                      </TabsTrigger>
                      <TabsTrigger value="appointment" className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Mechanic
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    <TabsContent value="details" className="space-y-8 mt-0">
                      {/* Vehicle info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Car className="h-5 w-5 text-primary" />
                          Vehicle Information
                        </h3>
                        <div className="bg-muted/20 p-6 rounded-lg border border-muted shadow-sm flex flex-col md:flex-row gap-8">
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                              <CarIcon className="h-10 w-10" />
                            </div>
                            <p className="text-lg font-medium">
                              {order.vehicle ? `${order.vehicle.make} ${order.vehicle.model}` : 'Unknown'}
                            </p>
                            <p className="text-muted-foreground">{order.vehicle?.year || 'N/A'}</p>
                          </div>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Make</p>
                              <p className="font-medium">{order.vehicle?.make || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Model</p>
                              <p className="font-medium">{order.vehicle?.model || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Year</p>
                              <p className="font-medium">{order.vehicle?.year || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">License Plate</p>
                              <p className="font-medium">{order.vehicle?.licensePlate || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conditional rendering based on order type */}
                      {isInspectionOnlyOrder() ? (
                        /* Inspection-only order: Show inspection details in main section */
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                            Inspection Information
                          </h3>

                          {/* Inspection date and time */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-blue-600">Scheduled Date</p>
                                <p className="font-medium">{formatDate(order.inspection?.scheduledDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-blue-600">Time Slot</p>
                                <p className="font-medium">{order.inspection?.timeSlot || 'Not specified'}</p>
                              </div>
                            </div>
                            <StatusBadge status={order.inspection?.status || 'pending'} />
                          </div>

                          {/* Inspection type and details */}
                          <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-200 shadow-sm">
                            <div className="flex items-start gap-4">
                              <div className="bg-blue-100 p-2 rounded-full">
                                {getInspectionCategoryIcon(order.inspection?.subCategory)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-lg text-blue-700">
                                  {order.inspection?.serviceName || 'Inspection Service'}
                                </h4>
                                {order.inspection?.subCategory && (
                                  <Badge variant="outline" className="mt-2 mb-3 bg-blue-50 text-blue-700 border-blue-200">
                                    {order.inspection.subCategory}
                                  </Badge>
                                )}

                                <div className="flex justify-between items-center py-2 border-t border-blue-200 mt-4">
                                  <span className="font-medium">Inspection Fee</span>
                                  <span className="font-medium text-blue-700">
                                    PKR {order.inspection?.price?.toFixed(2) || '0.00'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {getAdditionalServices().filter(service =>
                            service.category.toLowerCase() === 'inspection'
                          ).map((service, index) => (
                            <div key={service.serviceId || index} className="bg-blue-50/50 p-6 rounded-lg border border-blue-200 shadow-sm">
                              <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-2 rounded-full">
                                  {getInspectionCategoryIcon(service.subCategory)}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-lg text-blue-700">
                                    {service.serviceName}
                                  </h4>
                                  {service.subCategory && (
                                    <Badge variant="outline" className="mt-2 mb-3 bg-blue-50 text-blue-700 border-blue-200">
                                      {service.subCategory}
                                    </Badge>
                                  )}
                                  {service.description && (
                                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                                      {service.description}
                                    </p>
                                  )}

                                  <div className="flex justify-between items-center py-2 border-t border-blue-200 mt-4">
                                    <span className="font-medium">Inspection Fee</span>
                                    <span className="font-medium text-blue-700">
                                      PKR {service.price?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Inspection results if available */}
                          {order.inspection?.status !== 'pending' && (
                            <div className="bg-muted/20 p-4 rounded-lg border border-muted shadow-sm">
                              <p className="text-sm font-medium mb-4 flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-primary" />
                                Inspection Results
                              </p>

                              <div className="space-y-4">
                                {getSelectedInspections().length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {getSelectedInspections().map((inspection: any, idx: number) => {
                                      // Find the most recent matching report for this inspection and order
                                      const reportsForService = inspectionReports
                                        .filter((r: any) => r.serviceId === inspection.serviceId && r.orderId === order.orderId)
                                        .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
                                      const report = reportsForService[0];
                                      let reportData: any = {};
                                      try {
                                        reportData = report?.reportData ? JSON.parse(report.reportData) : {};
                                      } catch {}
                                      // Determine result style and icon for on-page display
                                      let resultClass = '', icon = '';
                                      switch ((reportData.result || '').toLowerCase()) {
                                        case 'excellent':
                                          resultClass = 'bg-green-100 text-green-800 border-green-200';
                                          icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
                                          break;
                                        case 'good':
                                          resultClass = 'bg-green-50 text-green-600 border-green-100';
                                          icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 9l-3 3-2-2"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 19V6"/></svg>';
                                          break;
                                        case 'fair':
                                          resultClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                          icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>';
                                          break;
                                        case 'poor':
                                          resultClass = 'bg-red-100 text-red-700 border-red-200';
                                          icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>';
                                          break;
                                        case 'critical':
                                          resultClass = 'bg-red-700 text-white border-red-700';
                                          icon = '<svg style="width:1em;height:1em;vertical-align:-0.15em;margin-right:4px;display:inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
                                          break;
                                        default:
                                          resultClass = 'bg-gray-100 text-gray-700 border-gray-200';
                                          icon = '';
                                      }
                                      return (
                                        <div key={inspection.serviceId || inspection.inspectionId || idx} className="p-4 border rounded-lg shadow-sm hover:border-primary/50 transition-colors bg-muted/20">
                                          <div className="flex items-center mb-2">
                                            <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                                            <h4 className="font-medium">{inspection.serviceName}</h4>
                                          </div>
                                          {inspection.subCategory && (
                                            <div className="mt-1">
                                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {inspection.subCategory}
                                              </Badge>
                                            </div>
                                          )}
                                          <div className="mt-1">
                                            <span className={`inline-flex items-center border px-2 py-1 rounded-md font-semibold text-sm ${resultClass}`} dangerouslySetInnerHTML={{__html: icon + (reportData.result || 'Not Inspected Yet')}} />
                                          </div>
                                          <div className="mt-1">
                                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                              Notes: {reportData.notes || 'No notes provided'}
                                            </Badge>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-4 border rounded-lg shadow-sm bg-muted/20 text-muted-foreground">
                                    No inspections selected by customer.
                                  </div>
                                )}
                                {/* Print Inspection Report Button */}
                                <div className="flex justify-end mt-4">
                                  <Button variant="outline" className="gap-2" onClick={handlePrintInspectionReport}>
                                    <Printer className="h-4 w-4" />
                                    Print Inspection Report
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular order: Show service information */
                        <>
                          {/* Service Information section */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                              <PenTool className="h-5 w-5 text-primary" />
                              Service Information
                            </h3>
                            <div className="bg-muted/20 p-6 rounded-lg border border-muted shadow-sm">
                              <div className="flex items-start gap-4">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <Wrench className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-lg text-primary">
                                    {order.service?.serviceName || 'Custom Service'}
                                  </h4>
                                  <p className="text-muted-foreground mt-1 mb-3">
                                    {order.service?.description || 'No description available'}
                                  </p>

                                  <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant="secondary" className="gap-1">
                                      <Tag className="h-3.5 w-3.5" />
                                      {order.service?.category || 'Service'}
                                    </Badge>
                                    {order.includesInspection && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Includes Inspection
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex justify-between items-center py-2 border-t">
                                    <span className="font-medium">Service Price</span>
                                    <span className="font-medium text-primary">
                                      PKR {order.service?.price?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>


                            {/* Show only non-inspection additional services here */}
                            {hasNonInspectionServices() && (
                              <div className="mt-4 space-y-4">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Plus className="h-4 w-4 text-primary" />
                                  Additional Services
                                </h4>

                                <div className="grid gap-3">
                                  {getAdditionalServices().filter(service =>
                                    service.category.toLowerCase() !== 'inspection'
                                  ).map((service, index) => (
                                    <div
                                      key={service.serviceId || index}
                                      className="bg-muted/20 p-4 rounded-md border border-muted shadow-sm flex justify-between items-start"
                                    >
                                      <div className="flex items-start gap-3 flex-1">
                                        <div className="bg-primary/10 p-1.5 rounded-full shrink-0 mt-1">
                                          <Wrench className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                          <h5 className="font-medium text-primary">
                                            {service.serviceName}
                                          </h5>
                                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {service.description || 'No description available'}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="ml-2 shrink-0 shadow-sm">
                                        PKR {service.price?.toFixed(2) || '0.00'}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Completely separate Inspection Services section */}
                          {hasInspectionServices() && (
                            <div className="space-y-4 mt-8">
                              <h3 className="text-lg font-medium flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                Inspection Services
                              </h3>
                              {order.includesInspection && order.inspection && (
                                <div
                                  key={order.serviceId}
                                  className="bg-blue-50/50 p-4 rounded-md border border-blue-200 shadow-sm flex justify-between items-start"
                                >
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="bg-blue-100 p-1.5 rounded-full shrink-0 mt-1">
                                      {getInspectionCategoryIcon(order?.service?.subCategory)}
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-blue-700">
                                        {order.inspection.serviceName}
                                      </h5>
                                      {order.inspection.subCategory && (
                                        <Badge variant="outline" className="mt-1 mb-1 bg-blue-50 text-blue-700 border-blue-200">
                                          {order.inspection.subCategory}
                                        </Badge>
                                      )}
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {order.inspection.description || 'No description available'}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="ml-2 shrink-0 shadow-sm bg-blue-50 text-blue-700 border-blue-200">
                                    PKR {order.inspection.price?.toFixed(2) || '0.00'}
                                  </Badge>
                                </div>
                              )}
                              <div className="grid gap-3">
                                {getAdditionalServices().filter(service =>
                                  service.category.toLowerCase() === 'inspection'
                                ).map((service, index) => (
                                  <div
                                    key={service.serviceId || index}
                                    className="bg-blue-50/50 p-4 rounded-md border border-blue-200 shadow-sm flex justify-between items-start"
                                  >
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="bg-blue-100 p-1.5 rounded-full shrink-0 mt-1">
                                        {getInspectionCategoryIcon(service.subCategory)}
                                      </div>
                                      <div>
                                        <h5 className="font-medium text-blue-700">
                                          {service.serviceName}
                                        </h5>
                                        {service.subCategory && (
                                          <Badge variant="outline" className="mt-1 mb-1 bg-blue-50 text-blue-700 border-blue-200">
                                            {service.subCategory}
                                          </Badge>
                                        )}
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                          {service.description || 'No description available'}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="ml-2 shrink-0 shadow-sm bg-blue-50 text-blue-700 border-blue-200">
                                      PKR {service.price?.toFixed(2) || '0.00'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {isInspectionOnlyOrder() && hasAdditionalServices() && (
                        <div className="space-y-4 mt-6">
                          <h4 className="font-medium flex items-center gap-2">
                            <Plus className="h-4 w-4 text-primary" />
                            Additional Services
                          </h4>
                          <div className="grid gap-3">
                            {getAdditionalServices()
                              .filter(service => service.category.toLowerCase() !== 'inspection') // Filter out inspection services
                              .map((service, index) => (
                                <div
                                  key={service.serviceId || index}
                                  className="bg-muted/20 border-muted p-4 rounded-md border shadow-sm flex justify-between items-start"
                                >
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="bg-primary/10 p-1.5 rounded-full shrink-0 mt-1">
                                      <Wrench className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <h5 className="font-medium text-primary">
                                        {service.serviceName}
                                      </h5>
                                      {service.subCategory && (
                                        <Badge variant="outline" className="mt-1 mb-1 bg-muted/30">
                                          {service.subCategory}
                                        </Badge>
                                      )}
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {service.description || 'No description available'}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="ml-2 shrink-0 shadow-sm">
                                    PKR {service.price?.toFixed(2) || '0.00'}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                          {/* Show message if no non-inspection additional services */}
                          {getAdditionalServices().filter(service => service.category.toLowerCase() !== 'inspection').length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">
                              <p className="text-sm">No additional services added yet.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Payment Information
                        </h3>
                        <div className="bg-muted/20 p-6 rounded-lg border border-muted shadow-sm">
                          {!isInspectionOnlyOrder() && (
                            <div className="flex justify-between items-center pb-3 border-b">
                              <span>Main Service Fee</span>
                              <span>PKR {order.service?.price?.toFixed(2) || '0.00'}</span>
                            </div>
                          )}

                          {order.includesInspection && order.inspection && (
                            <div className={`flex justify-between items-center ${!isInspectionOnlyOrder() ? 'py-3 border-b' : 'pb-3 border-b'}`}>
                              <span>{isInspectionOnlyOrder() ? 'Inspection Fee' : 'Inspection Fee'}</span>
                              <span>PKR {order.inspection.price?.toFixed(2) || '0.00'}</span>
                            </div>
                          )}

                          {hasAdditionalServices() && (
                            <div className="flex justify-between items-center py-3 border-b">
                              <span>Additional Services</span>
                              <span>PKR {getAdditionalServices().reduce((sum, service) => sum + (service.price || 0), 0).toFixed(2)}</span>
                            </div>
                          )}

                          {/* Calculate subtotal */}
                          {(() => {
                            const servicePrice = order?.service?.price || 0;
                            const inspectionPrice = order?.includesInspection ? order.inspection?.price || 0 : 0;
                            const additionalServicesPrice = getAdditionalServices().reduce((sum, service) => sum + (service.price || 0), 0);
                            const subtotal = servicePrice + inspectionPrice + additionalServicesPrice;
                            const taxAmount = subtotal * 0.18;
                            const totalWithTax = subtotal + taxAmount;

                            return (
                              <>
                                <div className="flex justify-between items-center pt-3 pb-3 border-b">
                                  <span className="font-medium">Subtotal</span>
                                  <span className="font-medium">PKR {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b">
                                  <span>SST (18%)</span>
                                  <span>PKR {taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 font-semibold">
                                  <span className="text-lg">Total Amount</span>
                                  <span className="text-lg text-primary">PKR {totalWithTax.toFixed(2)}</span>
                                </div>
                              </>
                            );
                          })()}

                          {/* Invoice status if any */}
                          {order.invoiceStatus && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-muted-foreground" />
                                  <span>Invoice Status</span>
                                </div>
                                <InvoiceStatusBadge status={order.invoiceStatus} />
                              </div>
                              {order.invoiceId && (
                                <Button
                                  variant="link"
                                  asChild
                                  className="mt-2 p-0 h-auto"
                                >
                                  <Link href={`/admin/invoices/${order.invoiceId}`} className="flex items-center gap-1">
                                    <span>View Invoice</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {order.includesInspection && (
                      <TabsContent value="inspection" className="mt-0 space-y-6">
                        {/* Inspection Results */}
                        <div className="bg-muted/20 p-6 rounded-lg border border-muted shadow-sm">
                          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                            <ListChecks className="h-5 w-5 text-primary" />
                            Inspection Results
                          </h3>
                          
                          <div className="grid gap-4">
                            {getSelectedInspections().map((inspection: any, index: number) => {
                              // Get inspection report data for this service
                              const reportsForService = inspectionReports
                                .filter((r: any) => r.serviceId === inspection.serviceId && r.orderId === order.orderId)
                                .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
                              const report = reportsForService[0];
                              let reportData: any = {};
                              try {
                                reportData = report?.reportData ? JSON.parse(report.reportData) : {};
                              } catch {}
                              
                              return (
                                <div
                                  key={inspection.serviceId || index}
                                  className="bg-white p-4 rounded-lg border border-muted shadow-sm"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="bg-blue-50 p-2 rounded-full shrink-0 mt-1">
                                      {getInspectionCategoryIcon(inspection.subCategory)}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-primary mb-2">
                                        {inspection.serviceName}
                                      </h4>
                                      <div className="flex flex-wrap gap-2 mb-2">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                          {inspection.subCategory || 'Inspection'}
                                        </Badge>
                                        {reportData.result && (
                                          <Badge 
                                            variant="outline" 
                                            className={
                                              reportData.result.toLowerCase() === 'excellent' ? 'bg-green-50 text-green-700 border-green-200' :
                                              reportData.result.toLowerCase() === 'good' ? 'bg-green-50 text-green-600 border-green-200' :
                                              reportData.result.toLowerCase() === 'fair' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                              reportData.result.toLowerCase() === 'poor' ? 'bg-red-50 text-red-700 border-red-200' :
                                              reportData.result.toLowerCase() === 'critical' ? 'bg-red-50 text-red-800 border-red-200' :
                                              'bg-gray-50 text-gray-700 border-gray-200'
                                            }
                                          >
                                            {reportData.result}
                                          </Badge>
                                        )}
                                      </div>
                                      {(reportData.notes || inspection.notes) && (
                                        <div className="text-sm text-muted-foreground bg-gray-50 px-3 py-2 rounded-md">
                                          Notes: {reportData.notes || inspection.notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {getSelectedInspections().length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <ShieldCheck className="h-12 w-12 mx-auto mb-2 text-muted" />
                              <p>No inspections selected for this order.</p>
                            </div>
                          )}
                        </div>

                        {/* Print Inspection Report Button */}
                        {getSelectedInspections().length > 0 && (
                          <div className="flex justify-center">
                            <Button
                              size="lg"
                              className="gap-2 shadow-sm"
                              onClick={handlePrintInspectionReport}
                            >
                              <Printer className="h-4 w-4" />
                              Print Inspection Report
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    )}

                    <TabsContent value="notes" className="mt-0">
                      <div className="p-6 bg-muted/20 rounded-lg border border-muted shadow-sm min-h-[200px]">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Order Notes
                        </h3>
                        {order.notes ? (
                          <div className="bg-white p-4 rounded-lg border border-muted">
                            <p className="whitespace-pre-line">{order.notes}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mb-2 text-muted" />
                            <p>No notes available for this order.</p>
                            <Button
                              variant="link"
                              className="mt-2"
                              asChild
                            >
                              <Link href={`/admin/orders/${order.orderId}/edit`}>
                                Add notes
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="appointment" className="mt-0">
                      <AppointmentSection
                        appointment={appointment}
                        loadingAppointment={loadingAppointment}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width on large screens */}
          <div className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-card py-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Customer Information</CardTitle>
                    <CardDescription>
                      Details about the customer
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Customer details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-medium flex-shrink-0">
                      {order.user?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-lg">{order.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        Customer ID: {order.user?.userId || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 bg-muted/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p>{order.user?.email || 'No email provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p>{order.user?.phone || 'No phone provided'}</p>
                      </div>
                    </div>

                    {order.user?.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p>{order.user.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Transfer to Service button - Enhanced logic with detailed debugging */}
                {(() => {
                  const showTransferButton = () => {
                    // Enhanced debugging
                    const debugInfo = {
                      isInspectionOnlyOrder: isInspectionOnlyOrder(),
                      orderServiceId: order?.serviceId,
                      orderIncludesInspection: order?.includesInspection,
                      inspectionExists: !!order?.inspection,
                      inspectionStatus: order?.inspection?.status,
                      appointmentExists: !!appointment,
                      mechanicExists: !!appointment?.mechanic,
                      mechanicId: appointment?.mechanic?.userId,
                      orderStatus: order?.status,
                      additionalServices: getAdditionalServices(),
                      hasNonInspectionAdditionalServices: getAdditionalServices().some(
                        service => service.category.toLowerCase() !== 'inspection'
                      ),
                      serviceTransferred: serviceTransferred,
                      hasInvoice: !!(order?.invoiceId && order?.invoiceStatus)
                    };

                    console.log('Transfer button debug info:', debugInfo);

                    // Don't show if invoice is generated
                    if (debugInfo.hasInvoice) {
                      console.log('Transfer button hidden: Invoice already generated');
                      return false;
                    }

                    // Don't show if already transferred
                    if (serviceTransferred) {
                      console.log('Transfer button hidden: Service already transferred');
                      return false;
                    }

                    // Don't show if no appointment or mechanic
                    if (!debugInfo.appointmentExists || !debugInfo.mechanicExists) {
                      console.log('Transfer button hidden: No appointment or mechanic assigned');
                      return false;
                    }

                    // Don't show if inspection not completed
                    if (debugInfo.inspectionStatus?.toLowerCase() !== 'completed') {
                      console.log('Transfer button hidden: Inspection not completed');
                      return false;
                    }

                    // Don't show if order already completed
                    if (debugInfo.orderStatus === 'completed') {
                      console.log('Transfer button hidden: Order already completed');
                      return false;
                    }

                    // FOR INSPECTION-ONLY ORDERS
                    if (debugInfo.isInspectionOnlyOrder) {
                      const hasServicesToTransfer = debugInfo.hasNonInspectionAdditionalServices;
                      console.log('Inspection-only order - has services to transfer:', hasServicesToTransfer);
                      return hasServicesToTransfer;
                    }

                    // FOR REGULAR ORDERS (with main service)
                    if (!debugInfo.isInspectionOnlyOrder &&
                      debugInfo.orderServiceId &&
                      debugInfo.orderIncludesInspection &&
                      debugInfo.inspectionExists) {
                      console.log('Regular order with main service and inspection - showing transfer button');
                      return true;
                    }

                    console.log('Transfer button hidden: No matching conditions');
                    return false;
                  };

                  const shouldShow = showTransferButton();
                  console.log('Final transfer button decision:', shouldShow);

                  return shouldShow && (
                    <div className="pt-4 border-t space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        Service Assignment
                      </h3>
                      <Button
                        className="w-full shadow-sm"
                        variant="default"
                        onClick={handleTransferToService}
                        disabled={isTransferringService}
                      >
                        {isTransferringService ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Transferring...
                          </>
                        ) : (
                          <>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Transfer to Service
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Transfer the mechanic from inspection to perform the service work
                      </p>
                    </div>
                  );
                })()}


                {/* Invoice Management Section */}
                {order && order.status.toLowerCase() === 'completed' && (
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Invoice Management
                    </h3>

                    {/* Show Generate Invoice button when no invoice exists */}
                    {!invoiceId ? (
                      <Button
                        className="w-full shadow-sm"
                        variant="default"
                        onClick={handleGenerateInvoice}
                        disabled={generatingInvoice}
                      >
                        {generatingInvoice ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Invoice
                          </>
                        )}
                      </Button>
                    ) : (
                      // Show appropriate button based on payment method and status
                      <>
                        {order.paymentMethod?.toLowerCase() === 'cash' && order.invoiceStatus !== 'paid' ? (
                          // Show Receive Cash Payment button for unpaid cash orders
                          <Button
                            className="w-full shadow-sm"
                            variant="default"
                            onClick={handleProcessCashPayment}
                            disabled={processingPayment}
                          >
                            {processingPayment ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Banknote className="mr-2 h-4 w-4 text-green-600" />
                                Receive Cash Payment
                              </>
                            )}
                          </Button>
                        ) : order.invoiceStatus === 'paid' ? (
                          // Show status for paid invoices
                          <Button
                            className="w-full shadow-sm"
                            variant="outline"
                            disabled
                          >
                            <CheckCheck className="mr-2 h-4 w-4 text-green-600" />
                            Payment Received
                          </Button>
                        ) : (
                          // Show View Invoice button for online payments
                          <Button
                            className="w-full shadow-sm"
                            variant="outline"
                            asChild
                          >
                            <Link href={`/admin/invoices/${invoiceId}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Invoice
                            </Link>
                          </Button>
                        )}
                      </>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {!invoiceId
                        ? 'Create a detailed invoice from this order'
                        : order.paymentMethod?.toLowerCase() === 'cash' && order.invoiceStatus !== 'paid'
                          ? 'Click when cash payment is received from customer'
                          : order.invoiceStatus === 'paid'
                            ? 'Payment has been successfully processed'
                            : 'View the generated invoice details'
                      }
                    </p>
                  </div>
                )}

                {/* Order timeline */}
                <div className="pt-4 border-t space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    {isInspectionOnlyOrder() ? 'Inspection Timeline' : 'Order Timeline'}
                  </h3>
                  <ScrollArea className="h-[180px] pr-3">
                    <div className="relative ml-2">
                      <div className="relative border-l-2 border-muted">
                        <div className="pl-4 pb-6 relative">
                          <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-0 shadow-sm"></div>
                          <div className="bg-muted/20 p-3 rounded-lg shadow-sm border border-muted">
                            <p className="text-sm font-medium">
                              {isInspectionOnlyOrder() ? 'Inspection Scheduled' : 'Order Created'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(order.orderDate)}
                            </p>
                          </div>
                        </div>

                        {order.includesInspection && order.inspection && (
                          <div className="pl-4 pb-6 relative">
                            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-0 shadow-sm"></div>
                            <div className="bg-blue-50 p-3 rounded-lg shadow-sm border border-blue-200">
                              <p className="text-sm font-medium">
                                {isInspectionOnlyOrder() ? 'Inspection Date' : 'Inspection Scheduled'}
                              </p>
                              <p className="text-xs text-blue-700">
                                {formatDate(order.inspection.scheduledDate)}, {order.inspection.timeSlot}
                              </p>
                            </div>
                          </div>
                        )}

                        {appointment && (
                          <div className="pl-4 pb-6 relative">
                            <div className="absolute w-3 h-3 bg-violet-500 rounded-full -left-[7px] top-0 shadow-sm"></div>
                            <div className="bg-violet-50 p-3 rounded-lg shadow-sm border border-violet-200">
                              <p className="text-sm font-medium">Mechanic Assigned</p>
                              <p className="text-xs text-violet-700">
                                {appointment.mechanic?.name}
                              </p>
                            </div>
                          </div>
                        )}

                        {order.status === 'completed' && (
                          <div className="pl-4 pb-6 relative">
                            <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-0 shadow-sm"></div>
                            <div className="bg-green-50 p-3 rounded-lg shadow-sm border border-green-200">
                              <p className="text-sm font-medium">
                                {isInspectionOnlyOrder() ? 'Inspection Completed' : 'Order Completed'}
                              </p>
                              <p className="text-xs text-green-700">
                                {formatDateTime(new Date().toISOString())}
                              </p>
                            </div>
                          </div>
                        )}

                        {order.status === 'cancelled' && (
                          <div className="pl-4 pb-6 relative">
                            <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-0 shadow-sm"></div>
                            <div className="bg-red-50 p-3 rounded-lg shadow-sm border border-red-200">
                              <p className="text-sm font-medium">
                                {isInspectionOnlyOrder() ? 'Inspection Cancelled' : 'Order Cancelled'}
                              </p>
                              <p className="text-xs text-red-700">
                                {formatDateTime(new Date().toISOString())}
                              </p>
                            </div>
                          </div>
                        )}

                        {order.invoiceStatus && (
                          <div className="pl-4 relative">
                            <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-0 shadow-sm"></div>
                            <div className="bg-emerald-50 p-3 rounded-lg shadow-sm border border-emerald-200">
                              <p className="text-sm font-medium">Invoice {order.invoiceStatus}</p>
                              <p className="text-xs text-emerald-700">
                                Invoice #{order.invoiceId}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="shadow-md border-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Order not found</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              The order you're looking for either doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/admin/orders')} className="gap-2 shadow-sm">
              <ChevronLeft className="h-4 w-4" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AppointmentDialog for mechanic assignment */}
      {order && (
        <AppointmentDialog
          isOpen={isAppointmentDialogOpen}
          onClose={() => setIsAppointmentDialogOpen(false)}
          order={order}
          onAppointmentCreated={handleAppointmentCreated}
        />
      )}
    </div>
  );
}