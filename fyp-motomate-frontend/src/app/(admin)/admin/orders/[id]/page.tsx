'use client';

import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  Pencil, 
  Calendar, 
  Car, 
  User,  
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
  PenTool
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import orderService from '../../../../../../services/orderService';

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
  notes?: string;
}

interface VehicleData {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface ServiceData {
  serviceName: string;
  price: number;
  description: string;
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
  status: string;
  orderDate: string;
  totalAmount: number;
  notes?: string;
  includesInspection: boolean;
  user: UserData;
  vehicle: VehicleData;
  service?: ServiceData;
  inspection?: InspectionData;
}

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = (status: string) => {
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

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { id } = params;

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error(`Failed to fetch order ${id}:`, err);
        setError('Failed to load order details. Please try again.');
        
        // Set sample data for development if API fails
        setOrder({
          orderId: parseInt(id),
          userId: 1,
          status: 'pending',
          orderDate: new Date().toISOString(),
          totalAmount: 199.99,
          notes: 'Customer requested special attention to the brakes',
          includesInspection: true,
          user: { 
            userId: 1,
            name: 'John Doe', 
            email: 'john@example.com', 
            phone: '555-123-4567',
            address: '123 Main St, Anytown, CA 90210'
          },
          vehicle: { 
            make: 'Toyota', 
            model: 'Camry',
            year: 2020,
            licensePlate: 'ABC123' 
          },
          service: { 
            serviceName: 'Oil Change',
            price: 69.99,
            description: 'Full synthetic oil change with filter replacement'
          },
          inspection: {
            inspectionId: 1,
            scheduledDate: new Date().toISOString(),
            status: 'pending',
            timeSlot: '10:00 AM - 12:00 PM',
            bodyCondition: 'Good',
            engineCondition: 'Fair',
            electricalCondition: 'Good',
            tireCondition: 'Good',
            brakeCondition: 'Needs attention'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  // Format dates
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy h:mm a');
    } catch (e) {
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
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Order Details</h1>
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
      ) : order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main order info */}
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
                  <StatusBadge status={order.status} />
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Order Details</TabsTrigger>
                    {order.includesInspection && order.inspection && (
                      <TabsTrigger value="inspection">Inspection</TabsTrigger>
                    )}
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-6">
                    {/* Service info */}
                    <div>
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <PenTool className="mr-2 h-5 w-5 text-primary" />
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
                          <span className="font-medium">${order.service?.price?.toFixed(2) || '0.00'}</span>
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
                    </div>
                    
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
                    
                    {/* Payment info */}
                    <div>
                      <h3 className="text-lg font-medium flex items-center mb-3">
                        <CreditCard className="mr-2 h-5 w-5 text-primary" />
                        Payment Information
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-md">
                        <div className="flex justify-between items-center pb-2 border-b">
                          <span>Service Fee</span>
                          <span>${order.service?.price?.toFixed(2) || '0.00'}</span>
                        </div>
                        {order.includesInspection && (
                          <div className="flex justify-between items-center py-2 border-b">
                            <span>Inspection Fee</span>
                            <span>$29.99</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 font-medium">
                          <span>Total Amount</span>
                          <span>${order.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
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
                        <StatusBadge status={order.inspection.status} />
                      </div>
                      
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
                  </TabsContent>
                </Tabs>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => router.back()}>
                  Back to Orders
                </Button>
                <Button onClick={() => router.push(`/admin/orders/${order.orderId}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Order
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
                
<hr/>                
                {/* Quick actions */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/admin/users/${order.user?.userId}`}>
                        <User className="mr-2 h-4 w-4" />
                        View Customer Profile
                      </Link>
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/admin/orders/create?userId=${order.user?.userId}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Order
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <hr/>                
                
                {/* Status update */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Update Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusUpdate('in progress')}
                      disabled={order.status === 'in progress'}
                      className="w-full"
                    >
                      In Progress
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={order.status === 'completed'}
                      variant="default"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Completed
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusUpdate('pending')}
                      disabled={order.status === 'pending'}
                      variant="outline"
                      className="w-full"
                    >
                      Pending
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={order.status === 'cancelled'}
                      variant="destructive"
                      className="w-full"
                    >
                      Cancelled
                    </Button>
                  </div>
                </div>
                
                {/* Order timeline */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Order Timeline</h3>
                  <div className="relative border-l-2 pl-4 pb-2 pt-2 border-muted">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-0"></div>
                    <p className="text-sm font-medium">Order Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.orderDate)}
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
                  
                  {order.status === 'completed' && (
                    <div className="relative border-l-2 pl-4 pb-2 pt-2 border-muted">
                      <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-0"></div>
                      <p className="text-sm font-medium">Order Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(new Date().toISOString())}
                      </p>
                    </div>
                  )}
                  
                  {order.status === 'cancelled' && (
                    <div className="relative border-l-2 pl-4 pb-2 pt-2 border-muted">
                      <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-0"></div>
                      <p className="text-sm font-medium">Order Cancelled</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(new Date().toISOString())}
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
          <p className="text-xl text-gray-500 mb-4">Order not found</p>
          <Button onClick={() => router.push('/admin/orders')}>
            Back to Orders
          </Button>
        </div>
      )}
    </div>
  );
}