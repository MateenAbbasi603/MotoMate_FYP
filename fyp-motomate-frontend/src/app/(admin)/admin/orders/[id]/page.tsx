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
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [isDialogMounted, setIsDialogMounted] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);



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
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Payments/process-cash-payment`,
        { invoiceId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        toast.success("Cash payment processed successfully");

        // Update the order and invoice status in the UI
        setOrder({
          ...order,
          invoiceStatus: 'paid'
        });

        // Refresh page data
        router.refresh();
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
        setInvoiceId(response.invoice.invoiceId);

        // Update the order state with payment method and invoice status
        setOrder({
          ...order,
          paymentMethod: response.paymentMethod || order.paymentMethod || 'online',
          invoiceStatus: response.invoice.status,
          invoiceId: response.invoice.invoiceId
        });

        // Redirect to the invoice page if not cash payment
        if (response.paymentMethod !== 'cash') {
          router.push(`/admin/invoices/${response.invoice.invoiceId}`);
        }
      } else {
        toast.error(response.message || 'Failed to generate invoice');
      }
    } catch (error:any) {
      console.error('Error generating invoice:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to generate invoice';
      toast.error(errorMessage);

      // Show more detailed error in console for debugging
      if (error.response?.data?.innerError) {
        console.error('Inner error:', error.response.data.innerError);
      }
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleTransferToService = async () => {
    if (!order || !appointment || !appointment.mechanic) {
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

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Orders/${order.orderId}/transfer-to-service`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        toast.success("Service successfully transferred to mechanic");

        // Update the order status
        if (order && response.data.order) {
          setOrder({
            ...order,
            status: response.data.order.status
          });
        }

        // Refresh page data after successful transfer
        router.refresh();
      } else {
        toast.error(response.data?.message || "Failed to transfer service");
      }
    } catch (error: any) {
      console.error('Error transferring service:', error);
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

  // Fetch order and services
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Call both API requests in parallel
        const [orderData, servicesResponse] = await Promise.all([
          orderService.getOrderById(id),
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Services`)
        ]);

        // Process order data
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

        setOrder(enhancedOrder);

        // Fetch appointment data if the order exists
        if (enhancedOrder.orderId) {
          fetchAppointmentData(enhancedOrder.orderId);
        }

        // Process services data
        let servicesData = [];
        if (servicesResponse.data && servicesResponse.data.$values) {
          // If data is in $values array format
          servicesData = servicesResponse.data.$values;
        } else if (Array.isArray(servicesResponse.data)) {
          // If data is directly an array
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

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      await orderService.updateOrder(order.orderId, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update order status:', err);
      toast.error('Failed to update order status');
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

    return servicePrice + inspectionPrice + additionalServicesTotal;
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

      // Get the authentication token from localStorage
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
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Fetch the full order details after adding the service to ensure we have all data
      const updatedOrderData = await orderService.getOrderById(id);

      if (!updatedOrderData) {
        toast.error('Failed to retrieve updated order information');
        return;
      }

      // Make sure we have the complete user, vehicle, and services data
      let enhancedOrder = { ...updatedOrderData };

      // Normalize additionalServices
      enhancedOrder.additionalServices = normalizeAdditionalServices(enhancedOrder);

      if (updatedOrderData.userId && updatedOrderData.vehicleId) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';
          const combinedResponse = await axios.get(
            `${API_URL}/api/Detail/combined-details?userId=${updatedOrderData.userId}&vehicleId=${updatedOrderData.vehicleId}${updatedOrderData.serviceId ? `&serviceId=${updatedOrderData.serviceId}` : ''}`
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

      // If there's a newly added service from the response, make sure it's in the additionalServices
      if (response.data.addedService) {
        let addedService = response.data.addedService;

        // Remove any $id property if present (just to be safe)
        if (addedService.$id) {
          const { $id, ...serviceData } = addedService;
          addedService = serviceData;
        }

        const additionalServices = Array.isArray(enhancedOrder.additionalServices)
          ? enhancedOrder.additionalServices
          : [];

        // Check if this service already exists in the additionalServices array
        const existingIndex = additionalServices.findIndex(
          (s: any) => s.serviceId === addedService.serviceId
        );

        if (existingIndex === -1) {
          // Add it if it doesn't already exist
          enhancedOrder.additionalServices = [...additionalServices, addedService];
        }
      }

      setOrder(enhancedOrder);

      // Reset form
      setSelectedServiceId('');
      setServiceNotes('');
      setIsDialogOpen(false);

      toast.success('Service added to order successfully');
    } catch (err: any) {
      console.error('Failed to add service to order:', err);
      if (err.response?.status === 401) {
        toast.error('You are not authorized to perform this action. Please log in again.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to add service to order');
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

  const fetchAppointmentData = async (orderId: string) => {
    try {
      setLoadingAppointment(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Orders/${orderId}/appointment`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data) {
        setAppointment(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching appointment data:', error);
      // If we get a 404, it means there's no appointment yet - this is normal
      if (error.response && error.response.status !== 404) {
        toast.error('Failed to load appointment data');
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

    return (
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setSelectedServiceId('');
          setServiceNotes('');
        }
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add Additional Service</DialogTitle>
            <DialogDescription>
              Select a service to add to this order
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

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
                      {!isInspectionOnlyOrder() && order.includesInspection && order.inspection && (
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

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                                {(() => {
                                  const subCategory = order.inspection?.subCategory?.toLowerCase();

                                  switch (subCategory) {
                                    case 'bodyinspection':
                                      return (
                                        <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                          <p className="text-sm text-muted-foreground font-medium mb-1">Body Condition</p>
                                          <p className="font-medium">{order.inspection?.bodyCondition || 'Not inspected'}</p>
                                        </div>
                                      );
                                    case 'brakeinspection':
                                      return (
                                        <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                          <p className="text-sm text-muted-foreground font-medium mb-1">Brake Condition</p>
                                          <p className="font-medium">{order.inspection?.brakeCondition || 'Not inspected'}</p>
                                        </div>
                                      );
                                    case 'engineinspection':
                                      return (
                                        <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                          <p className="text-sm text-muted-foreground font-medium mb-1">Engine Condition</p>
                                          <p className="font-medium">{order.inspection?.engineCondition || 'Not inspected'}</p>
                                        </div>
                                      );
                                    case 'transmissioninspection':
                                      return (
                                        <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                          <p className="text-sm text-muted-foreground font-medium mb-1">Transmission Condition</p>
                                          <p className="font-medium">{order.inspection?.transmissionCondition || 'Not inspected'}</p>
                                        </div>
                                      );
                                    case 'electricalinspection':
                                      return (
                                        <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                          <p className="text-sm text-muted-foreground font-medium mb-1">Electrical Condition</p>
                                          <p className="font-medium">{order.inspection?.electricalCondition || 'Not inspected'}</p>
                                        </div>
                                      );
                                    case 'tireinspection':
                                      return (
                                        <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                          <p className="text-sm text-muted-foreground font-medium mb-1">Tire Condition</p>
                                          <p className="font-medium">{order.inspection?.tireCondition || 'Not inspected'}</p>
                                        </div>
                                      );
                                    case 'interiorinspection':
                                      return (
                                        <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                          <p className="text-sm text-muted-foreground font-medium mb-1">Interior Condition</p>
                                          <p className="font-medium">{order.inspection?.interiorCondition || 'Not inspected'}</p>
                                        </div>
                                      );
                                    case 'suspensioninspection':
                                      return (
                                        <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                          <p className="text-sm text-muted-foreground font-medium mb-1">Suspension Condition</p>
                                          <p className="font-medium">{order.inspection?.suspensionCondition || 'Not inspected'}</p>
                                        </div>
                                      );
                                    default:
                                      return (
                                        <>
                                          <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                            <p className="text-sm text-muted-foreground font-medium mb-1">Overall Condition</p>
                                            <p className="font-medium">Inspection pending</p>
                                          </div>
                                        </>
                                      );
                                  }
                                })()}
                              </div>

                              {order.inspection?.notes && (
                                <div className="mt-6 pt-4 border-t">
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Inspection Notes
                                  </h4>
                                  <div className="bg-white p-4 rounded-lg border border-muted">
                                    <p className="text-sm italic">{order.inspection.notes}</p>
                                  </div>
                                </div>
                              )}
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

                          <div className="flex justify-between items-center pt-3 font-semibold">
                            <span className="text-lg">Total Amount</span>
                            <span className="text-lg text-primary">PKR {order.totalAmount?.toFixed(2) || calculateTotalAmount().toFixed(2)}</span>

                          </div>
                          <div className="flex justify-between items-center pt-3 font-semibold">
                            <span className="text-lg"></span>

                            <Badge>Exclusive of 18% SST</Badge>

                          </div>


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

                    {!isInspectionOnlyOrder() && order.includesInspection && order.inspection && (
                      <TabsContent value="inspection" className="mt-0 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-muted/30 rounded-lg border border-muted shadow-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Scheduled Date</p>
                              <p className="font-medium">{formatDate(order.inspection.scheduledDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm text-muted-foreground">Time Slot</p>
                              <p className="font-medium">{order.inspection.timeSlot || 'Not specified'}</p>
                            </div>
                          </div>
                          <StatusBadge status={order.inspection.status} />
                        </div>

                        {/* Inspection type and subcategory */}
                        <div className="bg-muted/20 p-4 rounded-lg border border-muted shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-full">
                              {getInspectionCategoryIcon(order.inspection.subCategory)}
                            </div>
                            <div>
                              <h3 className="font-medium">{order.inspection.subCategory}</h3>
                              <p className="text-sm text-muted-foreground">{order.inspection.serviceName}</p>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <p className="text-sm font-medium mb-4 flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-primary" />
                            Inspection Results
                          </p>

                          {/* Dynamic rendering of condition fields based on subCategory */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                            {(() => {
                              const subCategory = order.inspection.subCategory?.toLowerCase();

                              // Specific conditions based on subCategory
                              switch (subCategory) {
                                case 'bodyinspection':
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Body Condition</p>
                                        <p className="font-medium">{order.inspection.bodyCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  );
                                case 'transmissioninspection':
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Transmission Condition</p>
                                        <p className="font-medium">{order.inspection.transmissionCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  );
                                case 'suspensioninspection':
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Suspension Condition</p>
                                        <p className="font-medium">{order.inspection.suspensionCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  )
                                case 'brakeinspection':
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Brake Condition</p>
                                        <p className="font-medium">{order.inspection.brakeCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  );
                                case 'tireinspection':
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Tire Condition</p>
                                        <p className="font-medium">{order.inspection.tireCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  );
                                case 'electricalinspection':
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Electrical Condition</p>
                                        <p className="font-medium">{order.inspection.electricalCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  );
                                case 'interiorinspection':
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Interior Condition</p>
                                        <p className="font-medium">{order.inspection.interiorCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  );
                                case 'fullvehicleinspection':
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Body Condition</p>
                                        <p className="font-medium">{order.inspection.bodyCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Engine Condition</p>
                                        <p className="font-medium">{order.inspection.engineCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Electrical Condition</p>
                                        <p className="font-medium">{order.inspection.electricalCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Tire Condition</p>
                                        <p className="font-medium">{order.inspection.tireCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Brake Condition</p>
                                        <p className="font-medium">{order.inspection.brakeCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Transmission Condition</p>
                                        <p className="font-medium">{order.inspection.transmissionCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Interior Condition</p>
                                        <p className="font-medium">{order.inspection.interiorCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Suspension Condition</p>
                                        <p className="font-medium">{order.inspection.suspensionCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  );
                                default:
                                  // Default case when subCategory doesn't match or is undefined
                                  return (
                                    <>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Body Condition</p>
                                        <p className="font-medium">{order.inspection.bodyCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Engine Condition</p>
                                        <p className="font-medium">{order.inspection.engineCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Electrical Condition</p>
                                        <p className="font-medium">{order.inspection.electricalCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Tire Condition</p>
                                        <p className="font-medium">{order.inspection.tireCondition || 'Not inspected'}</p>
                                      </div>
                                      <div className="p-4 border border-muted rounded-lg shadow-sm bg-white">
                                        <p className="text-sm text-muted-foreground font-medium mb-1">Brake Condition</p>
                                        <p className="font-medium">{order.inspection.brakeCondition || 'Not inspected'}</p>
                                      </div>
                                    </>
                                  );
                              }
                            })()}
                          </div>

                          {order.inspection.notes && (
                            <div className="mt-6 pt-4 border-t">
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Inspection Notes
                              </h4>
                              <div className="bg-white p-4 rounded-lg border border-muted">
                                <p className="text-sm italic">{order.inspection.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
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

                {/* Quick actions */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start shadow-sm"
                      asChild
                    >
                      <Link href={`/admin/users/${order.user?.userId}`}>
                        <User className="mr-2 h-4 w-4" />
                        View Customer Profile
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start shadow-sm"
                      asChild
                    >
                      <Link href={`/admin/orders/create?userId=${order.user?.userId}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Order
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Key actions based on order state - Hide transfer for inspection-only orders */}
                {!isInspectionOnlyOrder() && appointment && appointment.mechanic && order.service && order.serviceId &&
                  (!order.invoiceStatus || order.invoiceStatus.toLowerCase() !== 'paid') && (
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
                        Assign the mechanic from inspection to perform the service work
                      </p>
                    </div>
                  )}



                {/* Invoice generation section
                {order && order.status.toLowerCase() === 'completed' && (
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Invoice Management
                    </h3>
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
                          {invoiceId ? 'View Invoice' : 'Generate Invoice'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {invoiceId ? 'View the generated invoice' : 'Create a detailed invoice from this order'}
                    </p>
                  </div>
                )} */}


                {/* Invoice generation and payment handling section */}
                {order && order.status.toLowerCase() === 'completed' && (
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Invoice Management
                    </h3>

                    {/* Show Generate Invoice or View Invoice button */}
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
                          {invoiceId ? 'View Invoice' : 'Generate Invoice'}
                        </>
                      )}
                    </Button>

                    {/* Show Receive Payment button for cash invoices - modified condition */}
                    {invoiceId &&
                      ((order.paymentMethod && order.paymentMethod === 'cash') ||
                        (order.invoiceStatus &&
                          (order.invoiceStatus === 'pending_cash' || order.invoiceStatus === 'pending'))) && (
                        <Button
                          className="w-full mt-2 shadow-sm"
                          variant="outline"
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
                      )}

                    <p className="text-xs text-muted-foreground">
                      {invoiceId
                        ? ((order.paymentMethod === 'cash' || order.invoiceStatus === 'pending_cash')
                          ? 'View the invoice or process cash payment'
                          : 'View the generated invoice')
                        : 'Create a detailed invoice from this order'
                      }
                    </p>
                  </div>
                )}
                {/* Status update */}
                <div className="pt-4 border-t space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    Update Status
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate('in progress')}
                      disabled={order.status === 'in progress'}
                      className="shadow-sm"
                      variant={order.status === 'in progress' ? 'outline' : 'secondary'}
                    >
                      <Activity className="mr-1.5 h-3.5 w-3.5" />
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={order.status === 'completed'}
                      variant={order.status === 'completed' ? 'outline' : 'default'}
                      className="shadow-sm"
                    >
                      <CircleCheck className="mr-1.5 h-3.5 w-3.5" />
                      Completed
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate('pending')}
                      disabled={order.status === 'pending'}
                      variant={order.status === 'pending' ? 'outline' : 'secondary'}
                      className="shadow-sm"
                    >
                      <CircleDashed className="mr-1.5 h-3.5 w-3.5" />
                      Pending
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={order.status === 'cancelled'}
                      variant={order.status === 'cancelled' ? 'outline' : 'destructive'}
                      className="shadow-sm"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Cancelled
                    </Button>
                  </div>
                </div>

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

            {/* Additional info cards can be added here */}
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