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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  Calendar,
  Clock,
  Car,
  User,
  ChevronLeft,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  MapPin,
  Mail,
  Phone,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Activity,
  PencilRuler,
  MoreHorizontal,
  ThumbsUp,
  HeartPulse,
  BadgeCheck,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import axios from 'axios';
import { toast } from 'sonner';
import authService from '../../../../../../../services/authService';
import { formatLabel, cn } from '@/lib/utils';

interface AppointmentData {
  appointmentId: number;
  orderId: number;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  notes: string;
  mechanicId: number;
  serviceId: number | null;
  user: {
    userId: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  vehicle: {
    vehicleId: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  service: {
    serviceId: number;
    serviceName: string;
    price: number;
    description: string;
    category: string;
    subCategory?: string;
  } | null;
}

interface OrderData {
  orderId: number;
  userId: number;
  vehicleId?: number;
  status: string;
  orderDate: string;
  totalAmount: number;
  notes?: string;
  includesInspection: boolean;
  user: {
    userId: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  vehicle: {
    vehicleId: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  service?: {
    serviceId: number;
    serviceName: string;
    price: number;
    description: string;
    category: string;
    subCategory?: string;
  };
  inspection?: {
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
    notes?: string;
    price?: number;
    serviceId?: number;
  };
  additionalServices?: Array<{
    serviceId: number;
    serviceName: string;
    price: number;
    description: string;
    category: string;
    subCategory?: string;
  }>;
}

interface InspectionReportFormData {
  bodyCondition: string;
  engineCondition: string;
  electricalCondition: string;
  tireCondition: string;
  brakeCondition: string;
  transmissionCondition: string;
  notes: string;
  mechanicId: number
}

const conditionOptions = [
  { value: 'Excellent', label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'Good', label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' },
  { value: 'Fair', label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { value: 'Poor', label: 'Poor', color: 'text-orange-600', bg: 'bg-orange-100' },
  { value: 'Critical', label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' },
  { value: 'Not Inspected', label: 'Not Inspected', color: 'text-gray-600', bg: 'bg-gray-100' },
];

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function MechanicAppointmentDetail({
  params
}: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [order, setOrder] = useState<OrderData | any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [reportFormData, setReportFormData] = useState<InspectionReportFormData>({
    bodyCondition: '',
    engineCondition: '',
    electricalCondition: '',
    tireCondition: '',
    brakeCondition: '',
    transmissionCondition: '',
    notes: '',
    mechanicId: 0
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);

      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

      // Fetch appointment details
      const appointmentResponse = await axios.get(
        `${API_URL}/api/Appointments/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log("Appointment data:", appointmentResponse.data);

      if (appointmentResponse.data) {
        setAppointment(appointmentResponse.data);
      }

      const user = await authService.getCurrentUser();

      // Fetch order details if orderId is available
      if (appointmentResponse.data && appointmentResponse.data.orderId) {
        const orderResponse = await axios.get(
          `${API_URL}/api/Orders/${appointmentResponse.data.orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log("Order data:", orderResponse.data);

        if (orderResponse.data) {
          setOrder(orderResponse.data);

          // Initialize report form data if inspection exists
          if (orderResponse.data.inspection) {
            setReportFormData({
              bodyCondition: orderResponse.data.inspection.bodyCondition || '',
              engineCondition: orderResponse.data.inspection.engineCondition || '',
              electricalCondition: orderResponse.data.inspection.electricalCondition || '',
              tireCondition: orderResponse.data.inspection.tireCondition || '',
              brakeCondition: orderResponse.data.inspection.brakeCondition || '',
              transmissionCondition: orderResponse.data.inspection.transmissionCondition || '',
              notes: orderResponse.data.inspection.notes || '',
              mechanicId: user.userId // Set mechanic ID from the logged-in user
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch appointment details:', err);
      setError(err.response?.data?.message || 'Failed to load appointment details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Get status badge style and icon
  const getStatusBadge = (status: string) => {
    status = status.toLowerCase();

    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 py-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Scheduled
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 py-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Cancelled
          </Badge>
        );
      case 'in progress':
      case 'inprogress':
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 py-1.5">
            <Activity className="h-3.5 w-3.5" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 py-1.5">
            <Clock className="h-3.5 w-3.5" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  // Get condition badge style
  const getConditionBadge = (condition: string) => {
    if (!condition) return null;

    const conditionOption = conditionOptions.find(
      option => option.value.toLowerCase() === condition.toLowerCase()
    );

    if (!conditionOption) return condition;

    return (
      <Badge variant="outline" className={`${conditionOption.bg} ${conditionOption.color} border-0`}>
        {conditionOption.label}
      </Badge>
    );
  };

  // Get customer initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "NA";

    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  // Helper for safely accessing service info
  const getServiceInfo = (service: any) => {
    if (!service) {
      return {
        name: "Service information unavailable",
        price: "N/A",
        description: "No details available",
        category: "Unknown"
      };
    }

    return {
      name: service.serviceName +
        (service.category === "Inspection" &&
          service.subCategory ?
          ` (${service.subCategory})` : ""),
      price: `PKR ${service.price.toFixed(2)}`,
      description: service.description || "No description available",
      category: service.category
    };
  };

  // Calculate inspection report progress
  const calculateReportProgress = () => {
    if (!order?.inspection) return 0;

    const fields = [
      order.inspection.bodyCondition,
      order.inspection.engineCondition,
      order.inspection.electricalCondition,
      order.inspection.tireCondition,
      order.inspection.brakeCondition,
      order.inspection.transmissionCondition
    ];

    const completedFields = fields.filter(field =>
      field && field !== 'Not Inspected' && field !== 'Not Inspected Yet'
    ).length;

    return Math.round((completedFields / fields.length) * 100);
  };

  // Handle input change for report form
  const handleInputChange = (field: keyof InspectionReportFormData, value: string) => {
    setReportFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle submit inspection report
  const handleSubmitReport = async () => {
    try {
      setIsSubmittingReport(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

      // Find the inspection ID from the order data
      const inspectionId = order?.inspection?.inspectionId;

      if (!inspectionId) {
        toast.error('Inspection ID not found. Cannot submit report.');
        return;
      }

      console.log("Submitting report data:", reportFormData);

      // Submit the inspection report update
      await axios.post(
        `${API_URL}/api/Inspections/${inspectionId}/report`,
        reportFormData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update appointment status to completed
      await axios.put(
        `${API_URL}/api/Appointments/${id}`,
        {
          status: 'completed',
          notes: "Done Job",
          timeSlot: appointment?.timeSlot,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update local state
      if (appointment) {
        setAppointment({
          ...appointment,
          status: 'completed'
        });
      }

      if (order && order.inspection) {
        setOrder({
          ...order,
          inspection: {
            ...order.inspection,
            ...reportFormData,
            status: 'completed'
          }
        });
      }

      toast.success('Inspection report submitted successfully');
      setIsReportDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to submit inspection report:', err);
      toast.error(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/mechanic/dashboard')}
            className="rounded-full shadow-sm hover:shadow"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Appointment Details</h1>
            <p className="text-muted-foreground">View and manage appointment information</p>
          </div>
        </div>

        <Button onClick={fetchData} disabled={refreshing} variant="outline" className="gap-2">
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 shadow-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-8 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-[160px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : appointment && order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main appointment info */}
          <div className="lg:col-span-2">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/20">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2 border border-primary/20">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        Appointment #{appointment.appointmentId}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>Order #{order.orderId}</span>
                        <span>•</span>
                        <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 py-1.5">
                      {appointment.timeSlot}
                    </Badge>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="order" className="w-full">
                  <TabsList className="mb-6 grid grid-cols-3 h-auto p-1">
                    <TabsTrigger value="order" className="py-2.5 data-[state=active]:bg-background">
                      <FileText className="h-4 w-4 mr-2" />
                      Order Details
                    </TabsTrigger>
                    {order.includesInspection && order.inspection && (
                      <TabsTrigger value="inspection" className="py-2.5 data-[state=active]:bg-background">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Inspection
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="notes" className="py-2.5 data-[state=active]:bg-background">
                      <FileText className="h-4 w-4 mr-2" />
                      Notes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="order" className="space-y-6 mt-0">
                    {/* Vehicle info */}
                    <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <Car className="mr-2 h-5 w-5 text-primary" />
                        Vehicle Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <p className="text-sm text-muted-foreground">Make & Model</p>
                          <p className="font-medium mt-1">
                            {order.vehicle ? `${order.vehicle.make} ${order.vehicle.model}` : 'Unknown'}
                          </p>
                        </div>
                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <p className="text-sm text-muted-foreground">Year</p>
                          <p className="font-medium mt-1">{order.vehicle?.year || 'N/A'}</p>
                        </div>
                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <p className="text-sm text-muted-foreground">License Plate</p>
                          <p className="font-medium mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono">
                              {order.vehicle?.licensePlate || 'N/A'}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Service info */}
                    <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <Wrench className="mr-2 h-5 w-5 text-primary" />
                        Inspection Information
                      </h3>

                      

                      {order.inspection && order.inspection.serviceName && (
                        <div className="bg-background p-4 rounded-lg border mb-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-primary flex items-center">
                                <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                                {formatLabel(order.inspection.serviceName)}
                                {order.inspection.subCategory && ` (${order.inspection.subCategory})`}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {order.inspection.notes || 'No description available'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Category</span>
                            <Badge variant="outline" className="font-normal">
                              Inspection
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Additional Services */}
                      {order.additionalServices && order.additionalServices.$values && order.additionalServices.$values.length > 0 && (
                        <div>
                          {/* Filter inspection services */}
                          {(() => {
                            const inspectionServices = order.additionalServices.$values.filter(
                              (service: any) => service.category.toLowerCase() === "inspection"
                            );

                            if (inspectionServices.length === 0) {
                              return null;
                            }

                            return (
                              <>
                                <h4 className="text-base font-medium mb-2 flex items-center">
                                  <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                                  Additional Inspection Services
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {inspectionServices.map((service: any, index: number) => (
                                    <div key={service.serviceId || index} className="bg-background p-4 rounded-lg border shadow-sm">
                                      <div className="flex justify-between items-start">
                                        <h5 className="font-medium text-blue-700">
                                          {service.serviceName}
                                          {service.subCategory && ` (${service.subCategory})`}
                                        </h5>
                                        {/* <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                          PKR {service.price?.toFixed(2) || '0.00'}
                                        </Badge> */}
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1 mb-2">
                                        {service.description || 'No description available'}
                                      </p>
                                      <div className="pt-2 border-t flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Inspection Type</span>
                                        <Badge variant="outline" className="text-xs bg-blue-50/50 text-blue-700">
                                          {service.subCategory || 'General'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {order.includesInspection && order.inspection && (
                    <TabsContent value="inspection" className="space-y-5 mt-0">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-50/30 dark:from-blue-900/20 dark:to-blue-900/5 rounded-xl border border-blue-200 p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm text-blue-600 font-medium">Scheduled Date</p>
                              <p className="font-semibold text-blue-800">
                                {formatDate(order.inspection.scheduledDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm text-blue-600 font-medium">Time Slot</p>
                              <p className="font-semibold text-blue-800">
                                {order.inspection.timeSlot || 'Not specified'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div>
                              <p className="text-sm text-blue-600 font-medium mb-1">Status</p>
                              {getStatusBadge(order.inspection.status)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Service details for inspection */}
                      {appointment.service && appointment.service.category === "Inspection" && (
                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-50/30 dark:from-indigo-900/20 dark:to-indigo-900/5 rounded-xl border border-indigo-200 p-5 shadow-sm">
                          <div className="flex items-center mb-4">
                            <ShieldCheck className="h-5 w-5 text-indigo-600 mr-2" />
                            <h3 className="font-medium text-lg text-indigo-800">
                              Inspection Service Details
                            </h3>
                          </div>

                          <div className="bg-white/80 dark:bg-background/80 rounded-lg border border-indigo-100 p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-indigo-700">
                                {appointment.service.serviceName}
                              </h4>
                              {/* <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                                PKR {appointment.service.price.toFixed(2)}
                              </Badge> */}
                            </div>

                            {appointment.service.subCategory && (
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-sm text-indigo-600">Focus Area</span>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                  {appointment.service.subCategory}
                                </Badge>
                              </div>
                            )}

                            {appointment.service.description && (
                              <div className="mt-3 pt-3 border-t border-indigo-100">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {appointment.service.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-white dark:bg-background rounded-xl border p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium flex items-center">
                            <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                            Inspection Results
                          </h3>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Completion:</span>
                            <div className="w-36 flex items-center gap-2">
                              <Progress value={calculateReportProgress()} className="h-2" />
                              <span className="text-xs font-medium">{calculateReportProgress()}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-muted/20 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                            <div className="flex items-center mb-2">
                              <HeartPulse className="h-4 w-4 mr-2 text-red-600" />
                              <h4 className="font-medium">Engine Condition</h4>
                            </div>
                            <div className="mt-1">
                              {getConditionBadge(order.inspection.engineCondition) ||
                                <span className="text-muted-foreground text-sm">Not inspected</span>}
                            </div>
                          </div>

                          <div className="bg-muted/20 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                            <div className="flex items-center mb-2">
                              <Activity className="h-4 w-4 mr-2 text-yellow-600" />
                              <h4 className="font-medium">Transmission Condition</h4>
                            </div>
                            <div className="mt-1">
                              {getConditionBadge(order.inspection.transmissionCondition) ||
                                <span className="text-muted-foreground text-sm">Not inspected</span>}
                            </div>
                          </div>

                          <div className="bg-muted/20 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                            <div className="flex items-center mb-2">
                              <BadgeCheck className="h-4 w-4 mr-2 text-green-600" />
                              <h4 className="font-medium">Body Condition</h4>
                            </div>
                            <div className="mt-1">
                              {getConditionBadge(order.inspection.bodyCondition) ||
                                <span className="text-muted-foreground text-sm">Not inspected</span>}
                            </div>
                          </div>

                          <div className="bg-muted/20 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                            <div className="flex items-center mb-2">
                              <PencilRuler className="h-4 w-4 mr-2 text-blue-600" />
                              <h4 className="font-medium">Electrical Condition</h4>
                            </div>
                            <div className="mt-1">
                              {getConditionBadge(order.inspection.electricalCondition) ||
                                <span className="text-muted-foreground text-sm">Not inspected</span>}
                            </div>
                          </div>

                          <div className="bg-muted/20 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                            <div className="flex items-center mb-2">
                              <MoreHorizontal className="h-4 w-4 mr-2 text-purple-600" />
                              <h4 className="font-medium">Brake Condition</h4>
                            </div>
                            <div className="mt-1">
                              {getConditionBadge(order.inspection.brakeCondition) ||
                                <span className="text-muted-foreground text-sm">Not inspected</span>}
                            </div>
                          </div>

                          <div className="bg-muted/20 p-4 rounded-lg border hover:shadow-sm transition-shadow">
                            <div className="flex items-center mb-2">
                              <ThumbsUp className="h-4 w-4 mr-2 text-orange-600" />
                              <h4 className="font-medium">Tire Condition</h4>
                            </div>
                            <div className="mt-1">
                              {getConditionBadge(order.inspection.tireCondition) ||
                                <span className="text-muted-foreground text-sm">Not inspected</span>}
                            </div>
                          </div>
                        </div>

                        {order.inspection.notes && (
                          <div className="mt-6">
                            <div className="flex items-start">
                              <FileText className="h-4 w-4 mr-2 mt-0.5 text-slate-500" />
                              <div>
                                <h4 className="font-medium mb-2">Inspection Notes</h4>
                                <div className="bg-muted/20 p-4 rounded-lg border">
                                  <p className="text-sm text-muted-foreground">
                                    {order.inspection.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {order.inspection.status !== 'completed' && appointment.status !== 'completed' && (
                          <div className="mt-6 flex justify-center">
                            <Button
                              size="lg"
                              className="gap-2 shadow-sm"
                              onClick={() => setIsReportDialogOpen(true)}
                            >
                              <FileText className="h-4 w-4" />
                              Generate Inspection Report
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="notes" className="space-y-5 mt-0">
                    <div className="bg-muted/20 rounded-xl border p-5 shadow-sm">
                      <h3 className="font-medium mb-4 flex items-center text-lg">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        Order Notes
                      </h3>
                      <div className="bg-background p-4 rounded-lg border shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          {order.notes || 'No notes available for this order.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/20 rounded-xl border p-5 shadow-sm">
                      <h3 className="font-medium mb-4 flex items-center text-lg">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        Appointment Notes
                      </h3>
                      <div className="bg-background p-4 rounded-lg border shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          {appointment.notes || 'No notes available for this appointment.'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  className="gap-2 shadow-sm"
                  onClick={() => router.push('/mechanic/dashboard')}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>

                {order.inspection && order.inspection.status !== 'completed' && appointment.status !== 'completed' && (
                  <Button
                    className="gap-2 shadow-sm"
                    onClick={() => setIsReportDialogOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    Generate Inspection Report
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Customer info sidebar */}
          <div>
            <Card className="border shadow-sm overflow-hidden sticky top-6">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/20 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-5">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(order.user?.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{order.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      Customer ID: {order.user?.userId || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/20 p-3 rounded-lg border flex items-start gap-3">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{order.user?.email || 'No email provided'}</p>
                    </div>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-lg border flex items-start gap-3">
                    <Phone className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{order.user?.phone || 'No phone provided'}</p>
                    </div>
                  </div>

                  {order.user?.address && (
                    <div className="bg-muted/20 p-3 rounded-lg border flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="text-sm">{order.user.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-5" />

                
                {/* Order timeline */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    Order Timeline
                  </h3>
                  <div className="space-y-1">
                    <div className="relative border-l-2 pl-4 pb-5 pt-1 border-muted">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-0"></div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="text-sm font-medium">Order Created</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(order.orderDate)}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Order was created in the system</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {order.includesInspection && order.inspection && (
                      <div className="relative border-l-2 pl-4 pb-5 pt-1 border-muted">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-0"></div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <p className="text-sm font-medium">Inspection Scheduled</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(order.inspection.scheduledDate)}, {order.inspection.timeSlot}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Vehicle inspection was scheduled</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}

                    <div className="relative border-l-2 pl-4 pb-5 pt-1 border-muted">
                      <div className="absolute w-3 h-3 bg-amber-500 rounded-full -left-[7px] top-0"></div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="text-sm font-medium">Mechanic Assigned</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(appointment.appointmentDate)}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mechanic was assigned to this service</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {appointment.status === 'completed' && (
                      <div className="relative border-l-2 pl-4 pb-5 pt-1 border-muted">
                        <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-0"></div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <p className="text-sm font-medium">Service Completed</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(new Date().toISOString())}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Service was successfully completed</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>

                {order.inspection && order.inspection.status !== 'completed' && appointment.status !== 'completed' && (
                  <>
                    <Separator className="my-5" />
                    <Button
                      className="w-full gap-2 mt-2 shadow-sm"
                      onClick={() => setIsReportDialogOpen(true)}
                    >
                      <FileText className="h-4 w-4" />
                      Generate Report
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Appointment not found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              The appointment you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button
              onClick={() => router.push('/mechanic/dashboard')}
              className="gap-2 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Inspection Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Generate Inspection Report
            </DialogTitle>
            <DialogDescription>
              Complete the inspection details for the vehicle to finalize the service.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bodyCondition" className="text-sm font-medium">Body Condition</Label>
                <Select
                  value={reportFormData.bodyCondition}
                  onValueChange={(value) => handleInputChange('bodyCondition', value)}
                >
                  <SelectTrigger id="bodyCondition" className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className={cn("flex items-center gap-2", option.color)}>
                        <span className={cn("h-2 w-2 rounded-full", option.bg)}></span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineCondition" className="text-sm font-medium">Engine Condition</Label>
                <Select
                  value={reportFormData.engineCondition}
                  onValueChange={(value) => handleInputChange('engineCondition', value)}
                >
                  <SelectTrigger id="engineCondition" className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className={cn("flex items-center gap-2", option.color)}>
                        <span className={cn("h-2 w-2 rounded-full", option.bg)}></span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="electricalCondition" className="text-sm font-medium">Electrical Condition</Label>
                <Select
                  value={reportFormData.electricalCondition}
                  onValueChange={(value) => handleInputChange('electricalCondition', value)}
                >
                  <SelectTrigger id="electricalCondition" className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className={cn("flex items-center gap-2", option.color)}>
                        <span className={cn("h-2 w-2 rounded-full", option.bg)}></span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tireCondition" className="text-sm font-medium">Tire Condition</Label>
                <Select
                  value={reportFormData.tireCondition}
                  onValueChange={(value) => handleInputChange('tireCondition', value)}
                >
                  <SelectTrigger id="tireCondition" className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className={cn("flex items-center gap-2", option.color)}>
                        <span className={cn("h-2 w-2 rounded-full", option.bg)}></span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brakeCondition" className="text-sm font-medium">Brake Condition</Label>
                <Select
                  value={reportFormData.brakeCondition}
                  onValueChange={(value) => handleInputChange('brakeCondition', value)}
                >
                  <SelectTrigger id="brakeCondition" className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className={cn("flex items-center gap-2", option.color)}>
                        <span className={cn("h-2 w-2 rounded-full", option.bg)}></span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmissionCondition" className="text-sm font-medium">Transmission Condition</Label>
                <Select
                  value={reportFormData.transmissionCondition}
                  onValueChange={(value) => handleInputChange('transmissionCondition', value)}
                >
                  <SelectTrigger id="transmissionCondition" className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className={cn("flex items-center gap-2", option.color)}>
                        <span className={cn("h-2 w-2 rounded-full", option.bg)}></span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Inspection Notes</Label>
              <Textarea
                id="notes"
                value={reportFormData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Provide detailed notes about the inspection findings"
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
              className="shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={isSubmittingReport}
              className="gap-2 shadow-sm"
            >
              {isSubmittingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}