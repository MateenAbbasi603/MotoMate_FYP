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
  ArrowRight,
  CalendarClock,
  Calendar,
  CircleDollarSign,
  MoreHorizontal,
  Clock,
  Filter,
  ArchiveX,
  ShieldAlert,
  ShieldCheck,
  PanelLeft,
  CheckCircle2,
  Timer,
  CalendarX,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
            const enrichedOrder: any = { ...order };
            console.log('Enriching order:', order.orderId);
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
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40';
      case 'in progress':
      case 'inprogress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-900/40';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'cancelled':
        return <CalendarX className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'in progress':
      case 'inprogress':
        return <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <CalendarClock className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
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

  // Get service icon based on service name
  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('inspection')) {
      return <ShieldCheck className="h-5 w-5 text-primary" />;
    } else if (name.includes('repair')) {
      return <Wrench className="h-5 w-5 text-primary" />;
    } else if (name.includes('maintenance')) {
      return <PanelLeft className="h-5 w-5 text-primary" />;
    } else {
      return <Wrench className="h-5 w-5 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="text-muted-foreground mt-1">View and manage your service orders</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-12 w-full max-w-md mb-8" />

        <div className="space-y-6">
          {[1, 2, 3].map((_, index) => (
            <Card key={index} className="overflow-hidden border-muted-foreground/20">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="space-y-1.5">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end bg-muted/20 border-t">
                <Skeleton className="h-9 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="text-muted-foreground mt-1">View and manage your service orders</p>
          </div>
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>

        <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="mb-2">Error Loading Orders</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="flex justify-end mt-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground mt-1">View and manage your service orders</p>
        </div>
        <Button asChild className="group">
          <Link href="/orders/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            New Order
          </Link>
        </Button>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="all" className="w-full">
        <div className="mb-6 bg-muted/40 p-1 rounded-lg max-w-md">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
            >
              Completed
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all">
          {orders.length === 0 ? (
            <Card className="text-center py-12 px-6 max-w-3xl mx-auto border-dashed">
              <CardContent className="flex flex-col items-center justify-center pt-6">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold mb-2">No Orders Found</CardTitle>
                <CardDescription className="text-base max-w-md mx-auto mb-6">
                  You haven't placed any orders yet. Start by creating a new order or scheduling a service.
                </CardDescription>

                <div className="bg-muted/30 rounded-lg p-6 w-full max-w-md mb-6">
                  <h3 className="font-medium text-lg mb-3">Benefits of Our Services</h3>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Professional automotive maintenance and repairs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Comprehensive vehicle inspections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Digital service tracking and history</span>
                    </li>
                  </ul>
                </div>

                <Button asChild size="lg" className="group">
                  <Link href="/orders/new">
                    <Plus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Place Your First Order
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card
                  key={order.orderId}
                  className="overflow-hidden border-muted-foreground/20 hover:shadow-md transition-all duration-300 group"
                  onClick={() => router.push(`/orders/${order.orderId}`)}
                >
                  <CardHeader className="pb-3 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-1.5">
                          <span>Order #{order.orderId}</span>
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Placed on {formatDate(order.orderDate)}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadgeStyle(order.status)}>
                          <span className="flex items-center gap-1.5">
                            {getStatusIcon(order.status)}
                            <span>{order.status}</span>
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center mb-2">
                          <Car className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Vehicle</h3>
                        </div>
                        <div className="space-y-1">
                          {order.vehicle ? (
                            <>
                              <p className="text-sm font-medium">{order.vehicle.make} {order.vehicle.model}</p>
                              <p className="text-xs text-muted-foreground">{order.vehicle.year} • {order.vehicle.licensePlate}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">Vehicle ID: {order.vehicleId}</p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center mb-2">
                          {getServiceIcon(getServiceDisplayName(order))}
                          <h3 className="font-medium ml-2">Service</h3>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-1">{getServiceDisplayName(order)}</p>
                          {order.includesInspection && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mt-1">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Includes Inspection
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center mb-2">
                          <CircleDollarSign className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Payment</h3>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            PKR {order.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.status === 'completed' ? 'Paid' : 'Pending payment'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <Separator className="mb-0" />
                  <CardFooter className="flex items-center justify-end pt-3 pb-3 bg-muted/10 group-hover:bg-muted/20 transition-colors">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 group-hover:text-primary transition-colors"
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {["pending", "active", "completed"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            {orders.filter(order => {
              const status = order.status.toLowerCase();
              if (tabValue === "pending") return status === "pending";
              if (tabValue === "active") return status === "in progress" || status === "inprogress";
              if (tabValue === "completed") return status === "completed";
              return false;
            }).length === 0 ? (
              <Card className="text-center p-8">
                <CardContent className="pt-6 flex flex-col items-center">
                  <div className="bg-muted/50 rounded-full p-4 mb-4">
                    {tabValue === "pending" ? (
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    ) : tabValue === "active" ? (
                      <Timer className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-lg font-medium mb-2">No {tabValue} orders found</p>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    {tabValue === "pending"
                      ? "You don't have any pending orders awaiting service at the moment."
                      : tabValue === "active"
                        ? "You don't have any orders currently in progress."
                        : "You don't have any completed service orders yet."}
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/orders/new">Create a New Order</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders
                  .filter(order => {
                    const status = order.status.toLowerCase();
                    if (tabValue === "pending") return status === "pending";
                    if (tabValue === "active") return status === "in progress" || status === "inprogress";
                    if (tabValue === "completed") return status === "completed";
                    return false;
                  })
                  .map((order) => (
                    <Card
                      key={order.orderId}
                      className="overflow-hidden border-muted-foreground/20 hover:shadow-md transition-all duration-300 group"
                      onClick={() => router.push(`/orders/${order.orderId}`)}
                    >
                      <CardHeader className="pb-3 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl flex items-center gap-1.5">
                              <span>Order #{order.orderId}</span>
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Placed on {formatDate(order.orderDate)}</span>
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeStyle(order.status)}>
                              <span className="flex items-center gap-1.5">
                                {getStatusIcon(order.status)}
                                <span>{order.status}</span>
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center mb-2">
                              <Car className="h-4 w-4 mr-2 text-primary" />
                              <h3 className="font-medium">Vehicle</h3>
                            </div>
                            <div className="space-y-1">
                              {order.vehicle ? (
                                <>
                                  <p className="text-sm font-medium">{order.vehicle.make} {order.vehicle.model}</p>
                                  <p className="text-xs text-muted-foreground">{order.vehicle.year} • {order.vehicle.licensePlate}</p>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">Vehicle ID: {order.vehicleId}</p>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center mb-2">
                              {getServiceIcon(getServiceDisplayName(order))}
                              <h3 className="font-medium ml-2">Service</h3>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium line-clamp-1">{getServiceDisplayName(order)}</p>
                              {order.includesInspection && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mt-1">
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Includes Inspection
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center mb-2">
                              <CircleDollarSign className="h-4 w-4 mr-2 text-primary" />
                              <h3 className="font-medium">Payment</h3>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                PKR {order.totalAmount.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.status === 'completed' ? 'Paid' : 'Pending payment'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <Separator className="mb-0" />
                      <CardFooter className="flex items-center justify-end pt-3 pb-3 bg-muted/10 group-hover:bg-muted/20 transition-colors">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 group-hover:text-primary transition-colors"
                        >
                          <span>View Details</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}