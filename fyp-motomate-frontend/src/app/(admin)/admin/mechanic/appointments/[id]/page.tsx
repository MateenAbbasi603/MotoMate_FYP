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
import axios from 'axios';
import { toast } from 'sonner';
import authService from '../../../../../../../services/authService';
import { formatLabel } from '@/lib/utils';

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
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
  { value: 'Critical', label: 'Critical' },
  { value: 'Not Inspected', label: 'Not Inspected' },
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
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the authentication token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
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
      }
    };

    fetchData();
  }, [id]);

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      // Fallback to a default format or message
      return 'Invalid date';
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    status = status.toLowerCase();
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'in progress':
      case 'inprogress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
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
      price: `$${service.price.toFixed(2)}`,
      description: service.description || "No description available",
      category: service.category
    };
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
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/mechanic/dashboard')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Appointment Details</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : appointment && order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main appointment info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Appointment #{appointment.appointmentId}</CardTitle>
                    <CardDescription>
                      Order #{order.orderId} • {formatDate(appointment.appointmentDate)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusBadgeStyle(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="order">
                  <TabsList className="mb-4">
                    <TabsTrigger value="order">Order Details</TabsTrigger>
                    {order.includesInspection && order.inspection && (
                      <TabsTrigger value="inspection">Inspection</TabsTrigger>
                    )}
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="order" className="space-y-6">
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
                        {appointment.service ? (
                          <>
                            <h4 className="font-medium text-primary">
                              {formatLabel(appointment.service.serviceName)}
                              {appointment.service.category === "Inspection" &&
                                appointment.service.subCategory &&
                                ` (${appointment.service.subCategory})`}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {appointment.service.description || 'No description available'}
                            </p>
                            <div className="flex justify-between items-center mt-3">
                              <span className="text-sm">Service Category</span>
                              <Badge variant="outline">
                                {appointment.service.category}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm">Service Price</span>
                              <span className="font-medium">PKR {appointment.service.price.toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <h4 className="font-medium text-primary">
                              {appointment.serviceId === null ? "Vehicle Inspection" : "Service"}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {appointment.serviceId === null
                                ? "Standard vehicle inspection service"
                                : "Service details not available"}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm">Service Price</span>
                              <span className="font-medium">Price information not available</span>
                            </div>
                          </>
                        )}

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
                          {order.additionalServices.map((service, index) => (
                            <div key={service.serviceId || index} className="bg-muted/50 p-4 rounded-md mb-2">
                              <h4 className="font-medium text-primary">
                                {service.serviceName}
                                {service.category === "Inspection" &&
                                  service.subCategory &&
                                  ` (${service.subCategory})`}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.description || 'No description available'}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-sm">Service Category</span>
                                <Badge variant="outline">
                                  {service.category}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-sm">Service Price</span>
                                <span className="font-medium">PKR {service.price?.toFixed(2) || '0.00'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {order.includesInspection && order.inspection && (
                    <TabsContent value="inspection" className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-blue-50 rounded-md">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm text-blue-600">Scheduled Date</p>
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

                      {/* Service details for inspection */}
                      {appointment.service && appointment.service.category === "Inspection" && (
                        <div className="p-4 bg-blue-50/60 rounded-md">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-blue-800">
                              Inspection Service Type
                            </h4>
                            <Badge variant="outline" className="bg-white text-blue-800 border-blue-300">
                              {appointment.service.serviceName}
                            </Badge>
                          </div>

                          {appointment.service.subCategory && (
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-blue-800">Focus Area</span>
                              <span className="font-medium text-blue-900">{appointment.service.subCategory}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-blue-800">Inspection Fee</span>
                            <span className="font-medium text-blue-900">PKR {appointment.service.price.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      <h3 className="text-lg font-medium flex items-center mt-4">
                        <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                        Inspection Results
                      </h3>

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
                        <div className="p-3 border rounded-md">
                          <p className="text-sm text-muted-foreground">Transmission Condition</p>
                          <p className="font-medium">{order.inspection.transmissionCondition || 'Not inspected'}</p>
                        </div>
                      </div>

                      {order.inspection.notes && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Inspection Notes</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-md">
                            {order.inspection.notes}
                          </p>
                        </div>
                      )}

                      {order.inspection.status !== 'completed' && appointment.status !== 'completed' && (
                        <Button
                          className="mt-4"
                          onClick={() => setIsReportDialogOpen(true)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Inspection Report
                        </Button>
                      )}
                    </TabsContent>
                  )}

                  <TabsContent value="notes">
                    <div className="p-4 bg-muted/50 rounded-md">
                      <h3 className="font-medium mb-2 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Order Notes
                      </h3>
                      <p className="text-sm">
                        {order.notes || 'No notes available for this order.'}
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-md mt-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Appointment Notes
                      </h3>
                      <p className="text-sm">
                        {appointment.notes || 'No notes available for this appointment.'}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => router.push('/mechanic/dashboard')}
                >
                  Back to Dashboard
                </Button>

                {order.inspection && order.inspection.status !== 'completed' && appointment.status !== 'completed' && (
                  <Button
                    onClick={() => setIsReportDialogOpen(true)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Inspection Report
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Customer info sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer details */}
                <div className="space-y-3">
                  <div className="flex items-start">
                    <UserCheck className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">{order.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        Customer ID: {order.user?.userId || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{order.user?.email || 'No email provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{order.user?.phone || 'No phone provided'}</p>
                    </div>
                  </div>

                  {order.user?.address && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p>{order.user.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <hr />

                {/* Service Summary */}
                {appointment.service && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Service Summary</h3>
                    <div className="p-3 bg-muted/30 rounded-md">
                      <h4 className="text-sm font-medium">
                        {appointment.service.serviceName}
                        {appointment.service.category === "Inspection" &&
                          appointment.service.subCategory &&
                          ` (${appointment.service.subCategory})`}
                      </h4>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-muted-foreground">Service Fee:</span>
                        <span className="font-medium">PKR {appointment.service.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-sm">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="outline" className="text-xs">
                          {appointment.service.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <hr />

                {/* Order timeline */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Order Timeline</h3>
                  <div className="relative border-l-2 pl-4 pb-2 pt-2 border-muted">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-0"></div>
                    <p className="text-sm font-medium">Order Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.orderDate)}
                    </p>
                  </div>

                  {order.includesInspection && order.inspection && (
                    <div className="relative border-l-2 pl-4 pb-2 pt-2 border-muted">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-0"></div>
                      <p className="text-sm font-medium">Inspection Scheduled</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.inspection.scheduledDate)}, {order.inspection.timeSlot}
                      </p>
                    </div>
                  )}

                  <div className="relative border-l-2 pl-4 pb-2 pt-2 border-muted">
                    <div className="absolute w-3 h-3 bg-yellow-500 rounded-full -left-[7px] top-0"></div>
                    <p className="text-sm font-medium">Mechanic Assigned</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>

                  {appointment.status === 'completed' && (
                    <div className="relative border-l-2 pl-4 pb-2 pt-2 border-muted">
                      <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-0"></div>
                      <p className="text-sm font-medium">Service Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date().toISOString())}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-xl text-gray-500 mb-4">Appointment not found</p>
          <Button onClick={() => router.push('/mechanic/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      )}

      {/* Inspection Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Inspection Report</DialogTitle>
            <DialogDescription>
              Fill in the inspection details for the vehicle. This will complete the inspection process.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bodyCondition">Body Condition</Label>
                <Select
                  value={reportFormData.bodyCondition}
                  onValueChange={(value) => handleInputChange('bodyCondition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="engineCondition">Engine Condition</Label>
                <Select
                  value={reportFormData.engineCondition}
                  onValueChange={(value) => handleInputChange('engineCondition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="electricalCondition">Electrical Condition</Label>
                <Select
                  value={reportFormData.electricalCondition}
                  onValueChange={(value) => handleInputChange('electricalCondition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tireCondition">Tire Condition</Label>
                <Select
                  value={reportFormData.tireCondition}
                  onValueChange={(value) => handleInputChange('tireCondition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="brakeCondition">Brake Condition</Label>
                <Select
                  value={reportFormData.brakeCondition}
                  onValueChange={(value) => handleInputChange('brakeCondition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transmissionCondition">Transmission Condition</Label>
                <Select
                  value={reportFormData.transmissionCondition}
                  onValueChange={(value) => handleInputChange('transmissionCondition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Inspection Notes</Label>
              <Textarea
                id="notes"
                value={reportFormData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Provide detailed notes about the inspection findings"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitReport}
              disabled={isSubmittingReport}
            >
              {isSubmittingReport ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}