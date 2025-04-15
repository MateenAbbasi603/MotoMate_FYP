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
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../../../../services/apiClient';

interface OrderDetailProps {
  params: {
    id: string;
  };
}

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

export default function OrderDetailPage({ params }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(`/api/orders/${id}`);
        
        if (response.data) {
          setOrder(response.data);
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

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
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
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Order Details</TabsTrigger>
                  {order.includesInspection && order.inspection && (
                    <TabsTrigger value="inspection">Inspection</TabsTrigger>
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
                        <span className="font-medium">${service.price?.toFixed(2) || '0.00'}</span>
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
                  <span>${order.service?.price?.toFixed(2) || '0.00'}</span>
                </div>

                {order.includesInspection && order.inspection && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Inspection Fee</span>
                    <span>${order.inspection.price?.toFixed(2) || '0.00'}</span>
                  </div>
                )}

                {order.additionalServices && order.additionalServices.length > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Additional Services</span>
                    <span>
                      ${order.additionalServices
                        .reduce((sum: number, service: any) => sum + (parseFloat(service.price) || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 font-medium">
                  <span>Total Amount</span>
                  <span>${order.totalAmount?.toFixed(2) || '0.00'}</span>
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
</div>
);
}