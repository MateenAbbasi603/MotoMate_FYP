'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import {
  ChevronLeft,
  Calendar as CalendarIcon2,
  Car,
  User,
  Wrench,
  CreditCard,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  Clock4,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarIcon,
  Package,
  CircleCheck,
  MapPin,
  RefreshCw,
  BarChart,
  ArrowRight,
  LucideInbox,
  Settings,
  History,
  ShieldCheck,
  HeartPulse,
  ArrowRightCircle,
  InfoIcon
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ServiceDetailPage({
  params
}: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [selectedAmPm, setSelectedAmPm] = useState<string>("PM");

  // Fetch service details
  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/MechanicServices/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("Service data:", response.data);
      setService(response.data);
    } catch (err: any) {
      console.error('Error fetching service details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load service details');
      toast.error('Failed to load service details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'N/A';
    }
  };

  // Get customer initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "NA";

    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';

    switch (statusLower) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 py-1.5">
            <CircleCheck className="h-3.5 w-3.5" /> Completed
          </Badge>
        );
      case 'in progress':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 py-1.5">
            <Clock4 className="h-3.5 w-3.5" /> In Progress
          </Badge>
        );
      case 'awaiting parts':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 py-1.5">
            <Package className="h-3.5 w-3.5" /> Awaiting Parts
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 py-1.5">
            <XCircle className="h-3.5 w-3.5" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1 py-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> {status || 'Unknown'}
          </Badge>
        );
    }
  };

  // Calculate status progress
  const calculateStatusProgress = () => {
    const status = service?.order?.status?.toLowerCase() || '';

    switch (status) {
      case 'in progress':
        return 33;
      case 'awaiting parts':
        return 66;
      case 'completed':
        return 100;
      default:
        return 10;
    }
  };

  // Format date and time as a string
  const getFormattedETA = (): string | null => {
    if (!selectedDate || selectedHour === null || selectedMinute === null) {
      return null;
    }

    // Format the date as DD/MM/YYYY
    const day = selectedDate.getDate();
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    // Format the time with AM/PM
    let hour = selectedHour;
    if (selectedAmPm === "PM" && hour < 12) {
      hour += 12;
    } else if (selectedAmPm === "AM" && hour === 12) {
      hour = 0;
    }

    // Format as DD/MM/YYYY HH:MM AM/PM
    return `${day}/${month}/${year} ${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedAmPm}`;
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    // For non-completed statuses, require date and time
    if (selectedStatus !== 'completed' &&
      (!selectedDate || selectedHour === null || selectedMinute === null)) {
      toast.error('Please select both date and time for estimated completion');
      return;
    }

    try {
      setUpdatingStatus(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      // Get formatted ETA
      const formattedETA = selectedStatus !== 'completed' ? getFormattedETA() : null;

      const payload = {
        status: selectedStatus,
        notes: statusNotes,
        eta: formattedETA
      };

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/MechanicServices/${id}/update-status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.success) {
        toast.success(`Status updated to ${selectedStatus}`);

        // Update local state
        setService({
          ...service,
          transferService: {
            ...service.transferService,
            status: selectedStatus,
            eta: formattedETA
          },
          order: {
            ...service.order,
            status: selectedStatus
          }
        });

        // Reset form
        setSelectedStatus('');
        setStatusNotes('');
        setSelectedDate(undefined);
        setSelectedHour(null);
        setSelectedMinute(null);
        setSelectedAmPm("PM");
        setStatusDialogOpen(false);
      } else {
        toast.error(response.data?.message || 'Failed to update status');
      }
    } catch (err: any) {
      console.error('Error updating service status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Set default values for quick status updates
  const handleQuickStatusUpdate = (status: string, notes: string) => {
    setSelectedStatus(status);
    setStatusNotes(notes);

    // Set default date and time based on status
    if (status !== 'completed') {
      const today = new Date();
      if (status === 'in progress') {
        // Default to 3 days from now
        setSelectedDate(addDays(today, 3));
      } else if (status === 'awaiting parts') {
        // Default to 7 days from now
        setSelectedDate(addDays(today, 7));
      }

      // Default time to 5:00 PM
      setSelectedHour(5);
      setSelectedMinute(0);
      setSelectedAmPm("PM");
    } else {
      // Clear date and time for completed status
      setSelectedDate(undefined);
      setSelectedHour(null);
      setSelectedMinute(null);
    }

    setStatusDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full shadow-sm hover:shadow"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Service Details</h1>
            <p className="text-muted-foreground">
              Manage and update service information
            </p>
          </div>
        </div>

        <Button
          onClick={fetchServiceDetails}
          disabled={refreshing}
          variant="outline"
          className="gap-2 shadow-sm"
        >
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      ) : service ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main service info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/20">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2 border border-primary/20">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        Order #{service.order.orderId}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>Assigned on {formatDate(service.transferService.createdAt)}</span>
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(service.order.status)}
                </div>
              </CardHeader>

              <CardContent className="pb-1">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Service Progress</p>
                  <div className="space-y-2">
                    <Progress value={calculateStatusProgress()} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>In Progress</span>
                      <span>Awaiting Parts</span>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid grid-cols-3 h-auto p-1">
                    <TabsTrigger value="details" className="py-2.5 data-[state=active]:bg-background">
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="vehicle" className="py-2.5 data-[state=active]:bg-background">
                      <Car className="h-4 w-4 mr-2" />
                      Vehicle
                    </TabsTrigger>
                    <TabsTrigger value="action" className="py-2.5 data-[state=active]:bg-background">
                      <Settings className="h-4 w-4 mr-2" />
                      Actions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-5">
                    {/* Service Details */}
                    <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <Wrench className="mr-2 h-5 w-5 text-primary" />
                        Service Information
                      </h3>
                      <div className="bg-background p-4 rounded-lg border shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-primary">
                              {service.service.serviceName || 'Service information not available'}
                            </h4>
                            {service.transferService?.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.transferService.notes}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="font-normal">
                            {service.service?.category || 'Unknown category'}
                          </Badge>
                        </div>

                        {service.service && (
                          <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Service Price</span>
                            {/* <Badge className="bg-green-50 text-green-700 border-green-200">
                              PKR {service.service.price?.toFixed(2) || '0.00'}
                            </Badge> */}
                          </div>
                        )}
                      </div>

                      {service.additionalServices &&
                        service.additionalServices.$values &&
                        service.additionalServices.$values
                          .filter((additional: any) => additional.category.toLowerCase() !== 'inspection')
                          .map((additional: any, idx: number) => (
                            <div key={`additional-service-${idx}`} className="bg-background p-4 rounded-lg border shadow-sm mt-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-primary">
                                    {additional.serviceName || 'Service information not available'}
                                  </h4>
                                </div>
                                <Badge variant="outline" className="font-normal">
                                  {additional.category || 'Unknown category'}
                                </Badge>
                              </div>

                              <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Service Price</span>
                                {/* <Badge className="bg-green-50 text-green-700 border-green-200">
                                  PKR {additional.price?.toFixed(2) || '0.00'}
                                </Badge> */}
                              </div>
                            </div>
                          ))}

                      {service.transferService.eta && (
                        <div className="mt-4 bg-amber-50 p-3 rounded-md border border-amber-200 flex items-center">
                          <Clock className="h-4 w-4 text-amber-600 mr-2" />
                          <div>
                            <span className="text-sm text-amber-800 font-medium">Estimated Completion:</span>
                            <span className="text-sm text-amber-700 ml-2">{service.transferService.eta}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Notes */}
                    {service.order.notes && (
                      <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                        <h3 className="text-lg font-medium flex items-center mb-3">
                          <FileText className="mr-2 h-5 w-5 text-primary" />
                          Order Notes
                        </h3>
                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <p className="text-sm whitespace-pre-line">
                            {service.order.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Service History */}
                    <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <History className="mr-2 h-5 w-5 text-primary" />
                        Service Timeline
                      </h3>

                      <div className="relative border-l-2 border-muted pl-6 pb-2 pt-2 space-y-4 ml-2">
                        <div className="relative">
                          <div className="absolute w-3 h-3 bg-primary rounded-full -left-[25px] top-1.5 border-2 border-background"></div>
                          <p className="text-sm font-medium">Order Assigned</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(service.transferService.createdAt)}
                          </p>
                        </div>

                        {service.order.status === 'in progress' && (
                          <div className="relative">
                            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[25px] top-1.5 border-2 border-background"></div>
                            <p className="text-sm font-medium">Service Started</p>
                            <p className="text-xs text-muted-foreground">
                              Work in progress
                            </p>
                          </div>
                        )}

                        {service.order.status === 'awaiting parts' && (
                          <div className="relative">
                            <div className="absolute w-3 h-3 bg-amber-500 rounded-full -left-[25px] top-1.5 border-2 border-background"></div>
                            <p className="text-sm font-medium">Awaiting Parts</p>
                            <p className="text-xs text-muted-foreground">
                              Pending parts delivery
                            </p>
                          </div>
                        )}

                        {service.order.status === 'completed' && (
                          <div className="relative">
                            <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[25px] top-1.5 border-2 border-background"></div>
                            <p className="text-sm font-medium">Service Completed</p>
                            <p className="text-xs text-muted-foreground">
                              Successfully finished
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="vehicle" className="mt-4 space-y-5">
                    {/* Vehicle Information */}
                    <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <Car className="mr-2 h-5 w-5 text-primary" />
                        Vehicle Information
                      </h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 border border-blue-200">
                              <Car className="h-4 w-4" />
                            </div>
                            <h4 className="font-medium">{service.vehicle?.make} {service.vehicle?.model}</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Year</p>
                              <p className="font-medium">{service.vehicle?.year || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">License Plate</p>
                              <Badge variant="outline" className="font-mono bg-blue-50 text-blue-700 border-blue-200">
                                {service.vehicle?.licensePlate || 'N/A'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="bg-background p-4 rounded-lg border shadow-sm">
                          <h4 className="font-medium mb-2 flex items-center">
                            <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                            Service Details
                          </h4>

                          <div className="space-y-2 mt-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Amount</span>
                              {/* <span className="font-medium">
                                PKR {service.order?.totalAmount?.toFixed(2) || '0.00'}
                              </span> */}
                            </div>

                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Order Date</span>
                              <span className="font-medium">
                                {formatDate(service.order?.orderDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Inspection Details (if available) */}
                      {service.inspection && (
                        <div className="mt-4 bg-blue-50/60 p-4 rounded-lg border border-blue-200 shadow-sm">
                          <h4 className="font-medium mb-3 flex items-center text-blue-800">
                            <ClipboardCheck className="h-4 w-4 mr-2 text-blue-700" />
                            Inspection Results
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {service.inspection.engineCondition && (
                              <div className="bg-white/80 p-3 rounded-md border border-blue-100">
                                <p className="text-xs text-blue-600 mb-1 flex items-center">
                                  <HeartPulse className="h-3.5 w-3.5 mr-1" /> Engine
                                </p>
                                <p className="font-medium text-sm text-blue-900">
                                  {service.inspection.engineCondition}
                                </p>
                              </div>
                            )}

                            {service.inspection.electricalCondition && (
                              <div className="bg-white/80 p-3 rounded-md border border-blue-100">
                                <p className="text-xs text-blue-600 mb-1 flex items-center">
                                  <AlertCircle className="h-3.5 w-3.5 mr-1" /> Electrical
                                </p>
                                <p className="font-medium text-sm text-blue-900">
                                  {service.inspection.electricalCondition}
                                </p>
                              </div>
                            )}

                            {service.inspection.brakeCondition && (
                              <div className="bg-white/80 p-3 rounded-md border border-blue-100">
                                <p className="text-xs text-blue-600 mb-1 flex items-center">
                                  <Clock4 className="h-3.5 w-3.5 mr-1" /> Brakes
                                </p>
                                <p className="font-medium text-sm text-blue-900">
                                  {service.inspection.brakeCondition}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="action" className="mt-4 space-y-5">
                    {/* Quick actions */}
                    <div className="bg-muted/20 rounded-xl border p-4 shadow-sm">
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <Settings className="mr-2 h-5 w-5 text-primary" />
                        Update Service Status
                      </h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Button
                          variant={service.order.status === 'in progress' ? 'default' : 'outline'}
                          className="w-full justify-start shadow-sm h-auto py-3"
                          disabled={service.order.status === 'in progress'}
                          onClick={() => handleQuickStatusUpdate('in progress', 'Service work started')}
                        >
                          <div className="flex flex-col items-start">
                            <div className="flex items-center">
                              <Clock4 className="mr-2 h-4 w-4 text-blue-600" />
                              <span className="font-medium">Mark as In Progress</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              Service work is actively being performed
                            </p>
                          </div>
                        </Button>

                        <Button
                          variant={service.order.status === 'awaiting parts' ? 'default' : 'outline'}
                          className="w-full justify-start shadow-sm h-auto py-3"
                          disabled={service.order.status === 'awaiting parts'}
                          onClick={() => handleQuickStatusUpdate('awaiting parts', 'Waiting for parts to arrive')}
                        >
                          <div className="flex flex-col items-start">
                            <div className="flex items-center">
                              <Package className="mr-2 h-4 w-4 text-amber-600" />
                              <span className="font-medium">Mark as Awaiting Parts</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              Service is on hold waiting for parts
                            </p>
                          </div>
                        </Button>

                        <Button
                          variant={service.order.status === 'completed' ? 'default' : 'outline'}
                          className="w-full justify-start shadow-sm h-auto py-3"
                          disabled={service.order.status === 'completed'}
                          onClick={() => handleQuickStatusUpdate('completed', 'Service has been completed successfully')}
                        >
                          <div className="flex flex-col items-start">
                            <div className="flex items-center">
                              <CircleCheck className="mr-2 h-4 w-4 text-green-600" />
                              <span className="font-medium">Mark as Completed</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              Service work has been finished
                            </p>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start shadow-sm h-auto py-3"
                          onClick={() => setStatusDialogOpen(true)}
                        >
                          <div className="flex flex-col items-start">
                            <div className="flex items-center">
                              <Settings className="mr-2 h-4 w-4 text-slate-600" />
                              <span className="font-medium">Custom Status Update</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              Set a custom status with notes
                            </p>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3 bg-primary/10 border border-primary/20">
                    <AvatarFallback className="text-primary font-medium">
                      {getInitials(service.customer?.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{service.customer?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">Customer</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {service.customer?.email && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </div>
                      <a href={`mailto:${service.customer.email}`} className="text-primary hover:underline">
                        {service.customer.email}
                      </a>
                    </div>
                  )}

                  {service.customer?.phone && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="mr-2 h-4 w-4" />
                        Phone
                      </div>
                      <a href={`tel:${service.customer.phone}`} className="hover:underline">
                        {service.customer.phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="pt-3 pb-3">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => router.push(`/admin/customers/${service.customer?.userId}`)}>
                  View Customer Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>

         

            {/* Quick Actions */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <ArrowRightCircle className="mr-2 h-5 w-5 text-primary" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4 shadow-sm"
                  onClick={() => router.push(`/admin/orders/${service.order?.orderId}`)}
                >
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">View Order Details</span>
                    <span className="text-xs text-muted-foreground">Order #{service.order?.orderId}</span>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4 shadow-sm"
                  onClick={() => router.push(`/admin/dashboard`)}
                >
                  <BarChart className="mr-2 h-4 w-4 text-primary" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Dashboard</span>
                    <span className="text-xs text-muted-foreground">Return to overview</span>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border shadow-sm py-8">
          <CardContent className="flex flex-col items-center justify-center text-center pt-6">
            <LucideInbox className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">Service Not Found</CardTitle>
            <CardDescription className="max-w-md mb-6">
              The service with ID {id} could not be found or may have been deleted.
            </CardDescription>
            <Button onClick={() => router.push('/admin/services')}>
              Return to Services
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Service Status</DialogTitle>
            <DialogDescription>
              Change the current status and provide any relevant notes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="awaiting parts">Awaiting Parts</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedStatus && selectedStatus !== 'completed' && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Estimated Completion Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label>Estimated Completion Time</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Select value={selectedHour?.toString()} onValueChange={(value) => setSelectedHour(parseInt(value))}>
                      <SelectTrigger id="hour">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedMinute?.toString()} onValueChange={(value) => setSelectedMinute(parseInt(value))}>
                      <SelectTrigger id="minute">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 4 }, (_, i) => i * 15).map((minute) => (
                          <SelectItem key={minute} value={minute.toString()}>
                            {minute.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedAmPm} onValueChange={setSelectedAmPm}>
                      <SelectTrigger id="ampm">
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any relevant details about this status update..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              className="gap-2"
              disabled={updatingStatus || !selectedStatus}
            >
              {updatingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}