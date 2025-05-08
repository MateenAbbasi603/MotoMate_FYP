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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import {
  ChevronLeft,
  Calendar,
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
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
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
  const [estimatedDays, setEstimatedDays] = useState<string>('');

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
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Format date and time
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy h:mm a');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
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

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdatingStatus(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const payload = {
        status: selectedStatus,
        notes: statusNotes,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : undefined
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
            eta: selectedStatus.toLowerCase() === 'completed' ? null : response.data.eta
          },
          order: {
            ...service.order,
            status: selectedStatus
          }
        });
        
        // Reset form
        setSelectedStatus('');
        setStatusNotes('');
        setEstimatedDays('');
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
                              value={selectedStatus || ""}
                              onValueChange={setSelectedStatus || ''}
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
                            <div className="grid gap-2">
                              <Label htmlFor="estimatedDays">Estimated Days to Completion</Label>
                              <Input
                                id="estimatedDays"
                                type="number"
                                min="1"
                                value={estimatedDays}
                                onChange={(e) => setEstimatedDays(e.target.value)}
                                placeholder="Enter number of days"
                              />
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
                            disabled={updatingStatus || !selectedStatus}
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

              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Service Details</TabsTrigger>
                    {service.inspection && (
                      <TabsTrigger value="inspection">Inspection Results</TabsTrigger>
                    )}
                    <TabsTrigger value="notes">Notes</TabsTrigger>
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
                            {service.vehicle ? `${service.vehicle.make} ${service.vehicle.model}` : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Year</p>
                          <p className="font-medium">{service.vehicle?.year || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">License Plate</p>
                          <p className="font-medium">{service.vehicle?.licensePlate || 'N/A'}</p>
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
                          {service.service?.serviceName || 'Custom Service'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.service?.description || 'No description available'}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm">Service Price</span>
                          <span className="font-medium">${service.service?.price?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      {/* Additional Services */}
                      {service.additionalServices && service.additionalServices.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Additional Services</h4>
                          {service.additionalServices.map((additionalService: any, index: number) => (
                            <div key={additionalService.serviceId || index} className="bg-muted/50 p-4 rounded-md mb-2">
                              <h4 className="font-medium text-primary">
                                {additionalService.serviceName}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {additionalService.description || 'No description available'}
                              </p>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-sm">Service Price</span>
                                <span className="font-medium">${additionalService.price?.toFixed(2) || '0.00'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ETA info */}
                    {service.transferService.eta && (
                      <div className="bg-blue-50 p-4 rounded-md">
                        <div className="flex items-center mb-2">
                          <Clock className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium text-blue-700">Estimated Completion</h3>
                        </div>
                        <p className="text-blue-700">
                          This service is estimated to be completed by {formatDate(service.transferService.eta)}.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {service.inspection && (
                    <TabsContent value="inspection" className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-blue-50 rounded-md">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm text-blue-600">Inspection Date</p>
                            <p className="font-medium">{formatDate(service.inspection.scheduledDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm text-blue-600">Time Slot</p>
                            <p className="font-medium">{service.inspection.timeSlot || 'Not specified'}</p>
                          </div>
                        </div>
                        {getStatusBadge(service.inspection.status)}
                      </div>

                      <h3 className="text-lg font-medium flex items-center mt-4">
                        <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                        Inspection Results
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3">
                        {service.inspection.engineCondition && (
                          <div className="p-3 border rounded-md">
                            <p className="text-sm text-muted-foreground">Engine Condition</p>
                            <p className="font-medium">{service.inspection.engineCondition}</p>
                          </div>
                        )}
                        {service.inspection.transmissionCondition && (
                          <div className="p-3 border rounded-md">
                            <p className="text-sm text-muted-foreground">Transmission Condition</p>
                            <p className="font-medium">{service.inspection.transmissionCondition}</p>
                          </div>
                        )}
                        {service.inspection.brakeCondition && (
                          <div className="p-3 border rounded-md">
                            <p className="text-sm text-muted-foreground">Brake Condition</p>
                            <p className="font-medium">{service.inspection.brakeCondition}</p>
                          </div>
                        )}
                        {service.inspection.electricalCondition && (
                          <div className="p-3 border rounded-md">
                            <p className="text-sm text-muted-foreground">Electrical Condition</p>
                            <p className="font-medium">{service.inspection.electricalCondition}</p>
                          </div>
                        )}
                        {service.inspection.bodyCondition && (
                          <div className="p-3 border rounded-md">
                            <p className="text-sm text-muted-foreground">Body Condition</p>
                            <p className="font-medium">{service.inspection.bodyCondition}</p>
                          </div>
                        )}
                        {service.inspection.tireCondition && (
                          <div className="p-3 border rounded-md">
                            <p className="text-sm text-muted-foreground">Tire Condition</p>
                            <p className="font-medium">{service.inspection.tireCondition}</p>
                          </div>
                        )}
                      </div>

                      {service.inspection.notes && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Inspection Notes</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-md">
                            {service.inspection.notes}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  )}

                  <TabsContent value="notes">
                    <div className="p-4 bg-muted/50 rounded-md">
                      <h3 className="font-medium mb-2 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Service Notes
                      </h3>
                      <p className="text-sm whitespace-pre-wrap">
                        {service.transferService.notes || 'No notes available for this service.'}
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-md mt-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Order Notes
                      </h3>
                      <p className="text-sm whitespace-pre-wrap">
                        {service.order.notes || 'No notes available for this order.'}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => router.back()}>
                  Back to Services
                </Button>
                <Button onClick={() => setStatusDialogOpen(true)}>
                  Update Status
                </Button>
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
                      onClick={() => {
                        setSelectedStatus('in progress');
                        setStatusNotes('Service work started');
                        setEstimatedDays('3');
                        setStatusDialogOpen(true);
                      }}
                    >
                      <Clock4 className="mr-2 h-4 w-4" />
                      Mark as In Progress
                    </Button>
                    
                    <Button 
                      variant={service.order.status === 'awaiting parts' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      disabled={service.order.status === 'awaiting parts'}
                      onClick={() => {
                        setSelectedStatus('awaiting parts');
                        setStatusNotes('Waiting for parts to arrive');
                        setEstimatedDays('7');
                        setStatusDialogOpen(true);
                      }}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Mark as Awaiting Parts
                    </Button>
                    
                    <Button 
                      variant={service.order.status === 'completed' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      disabled={service.order.status === 'completed'}
                      onClick={() => {
                        setSelectedStatus('completed');
                        setStatusNotes('Service work completed successfully');
                        setEstimatedDays('');
                        setStatusDialogOpen(true);
                      }}
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