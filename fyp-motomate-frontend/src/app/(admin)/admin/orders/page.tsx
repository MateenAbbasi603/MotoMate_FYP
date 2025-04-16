'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  Pencil, 
  MoreHorizontal, 
  RefreshCcw, 
  CreditCard, 
  Plus, 
  Search,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import orderApi from '../../../../../services/orderApi';

// Define TypeScript interfaces for our data
interface Vehicle {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
}

interface Service {
  serviceId: number;
  serviceName: string;
  price: number;
  description: string;
}

interface Order {
  orderId: number;
  userId: number;
  vehicleId: number;
  serviceId?: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  notes?: string;
  includesInspection: boolean;
  user?: User;
  vehicle?: Vehicle;
  service?: Service;
}

interface CombinedInfo {
  user?: User;
  vehicle?: Vehicle;
  service?: Service;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [combinedInfoMap, setCombinedInfoMap] = useState<{[key: string]: CombinedInfo}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const router = useRouter();

  // Fetch orders and combined details
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use orderApi instead of direct axios call
        const ordersData = await orderApi.getAllOrders();
        console.log('Fetched orders:', ordersData);
        
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);

          // Fetch combined details for each unique user, vehicle, and service
          const uniqueDetails = new Set<string>();
          ordersData.forEach((order: Order) => {
            if (order.userId && order.vehicleId && order.serviceId) {
              uniqueDetails.add(`userId=${order.userId}&vehicleId=${order.vehicleId}&serviceId=${order.serviceId}`);
            }
          });

          // Fetch combined details for unique combinations
          const combinedDetailsPromises = Array.from(uniqueDetails).map(async (detailQuery) => {
            try {
              const [userId, vehicleId, serviceId] = detailQuery.split('&').map(param => {
                const [key, value] = param.split('=');
                console.log(key);
                
                return parseInt(value);
              });

              const combinedData = await orderApi.getCombinedDetails(userId, vehicleId, serviceId);
              return {
                query: detailQuery,
                data: combinedData
              };
            } catch (err) {
              console.error(`Failed to fetch combined details for ${detailQuery}:`, err);
              return null;
            }
          });

          const combinedDetailsResults = await Promise.all(combinedDetailsPromises);
          
          // Create a map of combined details
          const infoMap: {[key: string]: CombinedInfo} = {};
          combinedDetailsResults.forEach(result => {
            if (result) {
              infoMap[result.query] = result.data;
            }
          });

          setCombinedInfoMap(infoMap);
        } else {
          console.error('Unexpected orders data format:', ordersData);
          setError('Received invalid data format from server');
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status?.toLowerCase() !== statusFilter) {
      return false;
    }
    
    // Search filter - check various fields
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const combinedInfoQuery = `userId=${order.userId}&vehicleId=${order.vehicleId}&serviceId=${order.serviceId}`;
      const combinedInfo = combinedInfoMap[combinedInfoQuery] || {};
      
      return (
        order.orderId.toString().includes(search) ||
        (order.user?.name || combinedInfo?.user?.name || 'Unknown').toLowerCase().includes(search) ||
        `${order.vehicle?.make || combinedInfo?.vehicle?.make || ''} ${order.vehicle?.model || combinedInfo?.vehicle?.model || ''}`.toLowerCase().includes(search) ||
        (order.service?.serviceName || combinedInfo?.service?.serviceName || 'Custom Service').toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const ordersData = await orderApi.getAllOrders();
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        toast.success('Orders refreshed successfully');
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Failed to refresh orders:', err);
      toast.error('Failed to refresh orders');
      setError('Failed to refresh orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get user, vehicle, or service details
  const getDetails = (order: Order, type: 'user' | 'vehicle' | 'service') => {
    const combinedInfoQuery = `userId=${order.userId}&vehicleId=${order.vehicleId}&serviceId=${order.serviceId}`;
    const combinedInfo = combinedInfoMap[combinedInfoQuery] || {};

    switch (type) {
      case 'user':
        return order.user || combinedInfo.user || { name: 'Unknown', userId: order.userId };
      case 'vehicle':
        return order.vehicle || combinedInfo.vehicle || { make: 'Unknown', model: 'Vehicle', vehicleId: order.vehicleId };
      case 'service':
        return order.service || combinedInfo.service || { serviceName: 'Custom Service', serviceId: order.serviceId };
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="icon">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/admin/orders/create">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-1 items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, customer, vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-start space-x-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Manage customer orders and inspections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableCaption>A list of all orders in the system.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const user :any= getDetails(order, 'user');
                    const vehicle :any= getDetails(order, 'vehicle');
                    const service :any= getDetails(order, 'service');

                    return (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium">#{order.orderId}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          {`${vehicle.make} ${vehicle.model}`}
                        </TableCell>
                        <TableCell>{service.serviceName}</TableCell>
                        <TableCell>
                          {order.orderDate ? format(new Date(order.orderDate), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>${order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.orderId}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.orderId}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Order
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Process Payment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}