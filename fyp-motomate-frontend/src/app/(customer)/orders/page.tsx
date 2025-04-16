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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Eye,
  Plus,
  Car,
  Wrench,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import apiClient from '../../../../services/apiClient';

// Interface for the basic order data returned by the API
interface BasicOrderData {
  id?: string;
  orderId: number;
  userId: number;
  vehicleId: number;
  serviceId?: number | null;
  includesInspection: boolean;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes?: string;
}

// Interface for vehicle data
interface VehicleData {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

// Interface for service data
interface ServiceData {
  serviceId: number;
  serviceName: string;
  category: string;
  price: number;
  description: string;
}

// Interface for enriched order data with vehicle and service details
interface EnrichedOrderData extends BasicOrderData {
  vehicle?: VehicleData;
  service?: ServiceData;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Function to fetch vehicle details by ID
  const fetchVehicleDetails = async (vehicleId: number): Promise<VehicleData | null> => {
    try {
      const response = await apiClient.get(`/api/vehicles/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch vehicle ${vehicleId}:`, error);
      return null;
    }
  };

  // Function to fetch service details by ID
  const fetchServiceDetails = async (serviceId: number): Promise<ServiceData | null> => {
    try {
      const response = await apiClient.get(`/api/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch service ${serviceId}:`, error);
      return null;
    }
  };

  // Function to fetch combined details
  const fetchCombinedDetails = async (userId: number, vehicleId: number, serviceId?: number | null) => {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId.toString());
      params.append('vehicleId', vehicleId.toString());
      if (serviceId) {
        params.append('serviceId', serviceId.toString());
      }

      const response = await apiClient.get(`/api/Detail/combined-details?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch combined details:', error);
      return null;
    }
  };

  // Fetch orders and enrich with additional data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch basic order data
        const response = await apiClient.get('/api/orders');
        console.log('API Response for orders:', response.data);
        
        let basicOrders: BasicOrderData[] = [];
        if (Array.isArray(response.data)) {
          basicOrders = response.data;
        } else if (response.data && response.data.$values) {
          basicOrders = response.data.$values;
        } else {
          console.error('Unexpected data format:', response.data);
          setError('Received invalid data format from server');
          return;
        }

        // Enrich each order with vehicle and service details
        const enrichedOrders: EnrichedOrderData[] = await Promise.all(
          basicOrders.map(async (order) => {
            const enrichedOrder: any = { ...order } ;
            console.log('Enriching order:', order.orderId );
            console.log(enrichedOrder);
            
            

            try {
              // Try to fetch combined details first (more efficient)
              const combinedDetails = await fetchCombinedDetails(
                order.userId, 
                order.vehicleId, 
                order.serviceId || undefined
              );

              if (combinedDetails) {
                enrichedOrder.vehicle = combinedDetails.vehicle;
                enrichedOrder.service = combinedDetails.service;
              } else {
                // Fallback to individual fetches if combined details fail
                if (order.vehicleId) {
                  enrichedOrder.vehicle = await fetchVehicleDetails(order.vehicleId);
                }
                
                if (order.serviceId) {
                  enrichedOrder.service = await fetchServiceDetails(order.serviceId);
                }
              }
            } catch (detailsError) {
              console.error(`Error enriching order ${order.orderId}:`, detailsError);
            }

            return enrichedOrder;
          })
        );

        setOrders(enrichedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
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

  // Extract service name for display
  const getServiceDisplayName = (order: EnrichedOrderData): string => {
    if (order.service?.serviceName) {
      return order.service.serviceName;
    }
    
    if (order.includesInspection) {
      return 'Inspection Service';
    }
    
    // Extract service name from notes
    if (order.notes && order.notes.includes('Additional service added:')) {
      const match = order.notes.match(/Additional service added: ([^.]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Service details unavailable';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {orders.length === 0 ? (
            <Card className="text-center p-6">
              <CardHeader>
                <CardTitle>No Orders Found</CardTitle>
                <CardDescription>
                  You havent placed any orders yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="mb-4">
                  Start by creating a new order or scheduling a service.
                </p>
                <Button asChild>
                  <Link href="/orders/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Place Your First Order
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card 
                  key={order.orderId} 
                  className="hover:border-primary transition-all cursor-pointer"
                  onClick={() => router.push(`/orders/${order.orderId}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                      <Badge className={getStatusBadgeStyle(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Placed on {formatDate(order.orderDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <Car className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Vehicle</h3>
                        </div>
                        <p className="text-sm mb-1">
                          {order.vehicle 
                            ? `${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.year})`
                            : `Vehicle ID: ${order.vehicleId}`}
                        </p>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <Wrench className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Service</h3>
                        </div>
                        <p className="text-sm">
                          {getServiceDisplayName(order)}
                        </p>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Details</h3>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">Total:</span> ${order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-2">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {/* Filter orders by pending status */}
          {orders.filter(order => order.status.toLowerCase() === 'pending').length === 0 ? (
            <Card className="text-center p-6">
              <CardContent>
                <p className="text-muted-foreground">No pending orders found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders
                .filter(order => order.status.toLowerCase() === 'pending')
                .map((order) => (
                  <Card 
                    key={order.orderId} 
                    className="hover:border-primary transition-all cursor-pointer"
                    onClick={() => router.push(`/orders/${order.orderId}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                        <Badge className={getStatusBadgeStyle(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Placed on {formatDate(order.orderDate)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <Car className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Vehicle</h3>
                          </div>
                          <p className="text-sm mb-1">
                            {order.vehicle 
                              ? `${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.year})`
                              : `Vehicle ID: ${order.vehicleId}`}
                          </p>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <Wrench className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Service</h3>
                          </div>
                          <p className="text-sm">
                            {getServiceDisplayName(order)}
                          </p>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Details</h3>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">Total:</span> ${order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end pt-2">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {/* Filter orders by in progress status */}
          {orders.filter(order => 
            order.status.toLowerCase() === 'in progress' || 
            order.status.toLowerCase() === 'inprogress'
          ).length === 0 ? (
            <Card className="text-center p-6">
              <CardContent>
                <p className="text-muted-foreground">No active orders found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders
                .filter(order => 
                  order.status.toLowerCase() === 'in progress' || 
                  order.status.toLowerCase() === 'inprogress'
                )
                .map((order) => (
                  <Card 
                    key={order.orderId} 
                    className="hover:border-primary transition-all cursor-pointer"
                    onClick={() => router.push(`/orders/${order.orderId}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                        <Badge className={getStatusBadgeStyle(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Placed on {formatDate(order.orderDate)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <Car className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Vehicle</h3>
                          </div>
                          <p className="text-sm mb-1">
                            {order.vehicle 
                              ? `${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.year})`
                              : `Vehicle ID: ${order.vehicleId}`}
                          </p>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <Wrench className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Service</h3>
                          </div>
                          <p className="text-sm">
                            {getServiceDisplayName(order)}
                          </p>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Details</h3>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">Total:</span> ${order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end pt-2">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {/* Filter orders by completed status */}
          {orders.filter(order => order.status.toLowerCase() === 'completed').length === 0 ? (
            <Card className="text-center p-6">
              <CardContent>
                <p className="text-muted-foreground">No completed orders found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders
                .filter(order => order.status.toLowerCase() === 'completed')
                .map((order) => (
                  <Card 
                    key={order.orderId} 
                    className="hover:border-primary transition-all cursor-pointer"
                    onClick={() => router.push(`/orders/${order.orderId}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                        <Badge className={getStatusBadgeStyle(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Placed on {formatDate(order.orderDate)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <Car className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Vehicle</h3>
                          </div>
                          <p className="text-sm mb-1">
                            {order.vehicle 
                              ? `${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.year})`
                              : `Vehicle ID: ${order.vehicleId}`}
                          </p>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <Wrench className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Service</h3>
                          </div>
                          <p className="text-sm">
                            {getServiceDisplayName(order)}
                          </p>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-2">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            <h3 className="font-medium">Details</h3>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">Total:</span> ${order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end pt-2">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}