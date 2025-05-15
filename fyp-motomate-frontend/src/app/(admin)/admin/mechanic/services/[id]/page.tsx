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
  CalendarIcon
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
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
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

        console.log("LOG ", response.data);

        setService(response.data);
      } catch (err: any) {
        console.error('Error fetching service details:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load service details');
        toast.error('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    // Handle date string directly
    return dateString;
  };

  // Format date and time for display
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    // Handle date string directly
    return dateString;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';

    switch (statusLower) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'awaiting parts':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Awaiting Parts</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">{status || 'Unknown'}</Badge>;
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
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Service Details</h1>
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
      ) : service ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main service info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Order #{service.order.orderId}</CardTitle>
                    <CardDescription>
                      Service assigned on {formatDate(service.transferService.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(service.order.status)}

                    {/* Status update dialog */}
                    <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>Update Status</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Service Status</DialogTitle>
                          <DialogDescription>
                            Change the current status of this service order and provide any relevant notes.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={selectedStatus}
                              onValueChange={(value) => setSelectedStatus(value)}
                            >
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
                                <Label>Estimated Completion Date & Time</Label>

                                {/* Date Picker */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {selectedDate ? (
                                        format(selectedDate, "MM/dd/yyyy")
                                      ) : (
                                        <span>Select date</span>
                                      )}
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

                                {/* Time Picker */}
                                <div className="mt-4">
                                  <Label>Time</Label>
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    {/* Hour Selection */}
                                    <Select
                                      value={selectedHour?.toString() || ""}
                                      onValueChange={(value) => setSelectedHour(parseInt(value))}
                                    >
                                      <SelectTrigger>
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

                                    {/* Minute Selection */}
                                    <Select
                                      value={selectedMinute?.toString() || ""}
                                      onValueChange={(value) => setSelectedMinute(parseInt(value))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Minute" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                          <SelectItem key={minute} value={minute.toString()}>
                                            {minute.toString().padStart(2, '0')}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>

                                    {/* AM/PM Selection */}
                                    <Select
                                      value={selectedAmPm}
                                      onValueChange={setSelectedAmPm}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="AM">AM</SelectItem>
                                        <SelectItem value="PM">PM</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Preview of selected date and time */}
                                {selectedDate && selectedHour !== null && selectedMinute !== null && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    Selected: {getFormattedETA()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Add any notes about this status update"
                              value={statusNotes}
                              onChange={(e) => setStatusNotes(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setStatusDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateStatus}
                            disabled={
                              updatingStatus ||
                              !selectedStatus ||
                              (selectedStatus !== 'completed' &&
                                (!selectedDate || selectedHour === null || selectedMinute === null))
                            }
                          >
                            {updatingStatus ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Update Status'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer details */}
                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">{service.customer?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        Customer ID: {service.customer?.userId || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{service.customer?.email || 'No email provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{service.customer?.phone || 'No phone provided'}</p>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Status tracking */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Status Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${service.order.status === 'in progress' || service.order.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <Clock4 className="h-4 w-4 text-white" />
                      </div>
                      <p className={`text-sm ${service.order.status === 'in progress' || service.order.status === 'completed' ? 'font-medium' : 'text-muted-foreground'}`}>
                        In Progress
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${service.order.status === 'awaiting parts' ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <p className={`text-sm ${service.order.status === 'awaiting parts' ? 'font-medium' : 'text-muted-foreground'}`}>
                        Awaiting Parts
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${service.order.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <p className={`text-sm ${service.order.status === 'completed' ? 'font-medium' : 'text-muted-foreground'}`}>
                        Completed
                      </p>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Quick actions */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setStatusDialogOpen(true)}
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Update Status
                    </Button>

                    <Button
                      variant={service.order.status === 'in progress' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      disabled={service.order.status === 'in progress'}
                      onClick={() => handleQuickStatusUpdate('in progress', 'Service work started')}
                    >
                      <Clock4 className="mr-2 h-4 w-4" />
                      Mark as In Progress
                    </Button>

                    <Button
                      variant={service.order.status === 'awaiting parts' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      disabled={service.order.status === 'awaiting parts'}
                      onClick={() => handleQuickStatusUpdate('awaiting parts', 'Waiting for parts to arrive')}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Mark as Awaiting Parts
                    </Button>

                    <Button
                      variant={service.order.status === 'completed' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      disabled={service.order.status === 'completed'}
                      onClick={() => handleQuickStatusUpdate('completed', 'Service work completed successfully')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-xl text-gray-500 mb-4">Service not found</p>
          <Button onClick={() => router.push('/admin/mechanic/services')}>
            Back to Services
          </Button>
        </div>
      )}
    </div>
  );
}