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
  CardFooter,
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
  DropdownMenuGroup,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Eye,
  Pencil,
  MoreHorizontal,
  RefreshCcw,
  CreditCard,
  Plus,
  Search,
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Wrench,
  ActivitySquare,
  ChevronDown,
  Filter,
  RotateCcw,
  Loader2,
  Calendar,
  ArrowUpDown,
  Store,
  Globe,
  Banknote,
  Receipt,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import orderApi from '../../../../../services/orderApi';
import invoiceService from '../../../../../services/invoiceService';

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
  invoiceStatus?: string;
  invoiceId?: number;
  orderType?: string; // Added property for order type
}

interface CombinedInfo {
  user?: User;
  vehicle?: Vehicle;
  service?: Service;
}

// Status badge component with improved styles
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'in progress':
      case 'inprogress':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5 mr-1" />;
      case 'cancelled':
        return <XCircle className="h-3.5 w-3.5 mr-1" />;
      case 'in progress':
      case 'inprogress':
        return <ActivitySquare className="h-3.5 w-3.5 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Badge className={`flex items-center shadow-sm ${getStatusStyles(status)}`} variant="outline">
      {getStatusIcon(status)}
      {status || 'Unknown'}
    </Badge>
  );
};

// Invoice status badge component
const InvoiceStatusBadge = ({ status }: { status?: string }) => {
  if (!status) return null;

  const getStatusStyles = (status: string) => {
    status = status?.toLowerCase() || '';
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
      case 'issued':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  return (
    <Badge className={`text-xs ${getStatusStyles(status)}`} variant="outline">
      {status === 'issued' ? 'Invoice Issued' : status === 'paid' ? 'Paid' : status}
    </Badge>
  );
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [combinedInfoMap, setCombinedInfoMap] = useState<{ [key: string]: CombinedInfo }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all'); // Added order type filter
  const [processingOrder, setProcessingOrder] = useState<number | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState<number | null>(null);
  const [transferringService, setTransferringService] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('orderDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const router = useRouter();

  // Fetch orders and combined details
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use orderApi instead of direct axios call
      const ordersData = await orderApi.getAllOrders();

      if (Array.isArray(ordersData)) {
        setOrders(ordersData);

        // Fetch combined details for each unique user, vehicle combination
        // Note: serviceId is now optional for inspection-only orders
        const uniqueDetails = new Set<string>();
        ordersData.forEach((order: Order) => {
          if (order.userId && order.vehicleId) {
            // Create key with or without serviceId
            const key = order.serviceId
              ? `userId=${order.userId}&vehicleId=${order.vehicleId}&serviceId=${order.serviceId}`
              : `userId=${order.userId}&vehicleId=${order.vehicleId}`;
            uniqueDetails.add(key);
          }
        });

        // Fetch combined details for unique combinations
        const combinedDetailsPromises = Array.from(uniqueDetails).map(async (detailQuery) => {
          try {
            const params = new URLSearchParams(detailQuery);
            const userId = parseInt(params.get('userId') || '0');
            const vehicleId = parseInt(params.get('vehicleId') || '0');
            const serviceId = params.get('serviceId') ? parseInt(params.get('serviceId')!) : undefined;

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
        const infoMap: { [key: string]: CombinedInfo } = {};
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

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to desc for new field
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status?.toLowerCase() !== statusFilter) {
      return false;
    }

    // Order type filter
    if (orderTypeFilter === 'online' && order.orderType !== 'Online') {
      return false;
    }
    if (orderTypeFilter === 'walkin' && order.orderType !== 'Walk-In') {
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

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === 'orderDate') {
      const dateA = new Date(a.orderDate || 0).getTime();
      const dateB = new Date(b.orderDate || 0).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'orderId') {
      return sortDirection === 'asc' ? a.orderId - b.orderId : b.orderId - a.orderId;
    } else if (sortField === 'totalAmount') {
      return sortDirection === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
    }
    return 0;
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
  const getDetails = (order: any, type: 'user' | 'vehicle' | 'service') => {
    // Create the correct key for looking up combined info
    const combinedInfoQuery = order.serviceId
      ? `userId=${order.userId}&vehicleId=${order.vehicleId}&serviceId=${order.serviceId}`
      : `userId=${order.userId}&vehicleId=${order.vehicleId}`;

    const combinedInfo = combinedInfoMap[combinedInfoQuery] || {};

    switch (type) {
      case 'user':
        return order.user || combinedInfo.user || { name: 'Unknown', userId: order.userId };
      case 'vehicle':
        return order.vehicle || combinedInfo.vehicle || { make: 'Unknown', model: 'Vehicle', vehicleId: order.vehicleId };
      case 'service':
        // For inspection-only orders, return a default service name
        if (!order.serviceId && order.includesInspection) {
          return { serviceName: 'Inspection Only', serviceId: null };
        }
        return order.service || combinedInfo.service || { serviceName: 'Custom Service', serviceId: order.serviceId };
    }
  };

  // Handle Transfer to Service
  const handleTransferToService = async (order: Order) => {
    try {
      setTransferringService(order.orderId);

      // First check if the order has an appointment with a mechanic
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please log in again to continue");
        return;
      }

      // Call the API to transfer the service
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Orders/${order.orderId}/transfer-to-service`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to transfer service');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Service successfully transferred to mechanic');
        fetchOrders(); // Refresh the orders list
      } else {
        toast.error(data.message || 'Failed to transfer service');
      }
    } catch (err: any) {
      console.error('Error transferring service:', err);
      toast.error(err.message || 'Failed to transfer service');
    } finally {
      setTransferringService(null);
    }
  };

  // Handle Generate Invoice
  const handleGenerateInvoice = async (orderId: number) => {
    try {
      setGeneratingInvoice(orderId);
      const response = await invoiceService.generateFromOrder(orderId.toString());

      if (response.success) {
        toast.success(response.isExisting ? 'Invoice already exists' : 'Invoice generated successfully');
        router.push(`/admin/invoices/${response.invoice.invoiceId}`);
      } else {
        toast.error(response.message || 'Failed to generate invoice');
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setGeneratingInvoice(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all workshop orders</p>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleRefresh} variant="outline" size="icon" disabled={loading} className="h-10 w-10">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh orders</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button asChild className="gap-2">
            <Link href="/admin/orders/create">
              <Plus className="h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2 bg-muted/40 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, customer, vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-muted/50">
              <Filter className="h-3.5 w-3.5 mr-1" />
              Status
            </Badge>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px] bg-muted/40">
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

          {/* New order type filter */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-muted/50">
              <Store className="h-3.5 w-3.5 mr-1" />
              Order Type
            </Badge>
            <Select
              value={orderTypeFilter}
              onValueChange={setOrderTypeFilter}
            >
              <SelectTrigger className="w-[180px] bg-muted/40">
                <SelectValue placeholder="Filter by order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="walkin">Walk-In</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters button */}
          {(statusFilter !== 'all' || orderTypeFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10"
              onClick={() => {
                setStatusFilter('all');
                setOrderTypeFilter('all');
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <Card className="shadow-sm border-muted">
        <CardHeader className="border-b bg-muted/30 pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-xl font-semibold">All Orders</CardTitle>
              <CardDescription>
                Manage customer orders and inspections
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
              </Badge>
              {statusFilter !== 'all' && (
                <Badge className="font-normal">
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Badge>
              )}
              {orderTypeFilter !== 'all' && (
                <Badge className="font-normal">
                  Type: {orderTypeFilter.charAt(0).toUpperCase() + orderTypeFilter.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-350px)]">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0">
                  <TableRow>
                    <TableHead className="cursor-pointer w-[100px]" onClick={() => handleSort('orderId')}>
                      <div className="flex items-center">
                        Order ID
                        {sortField === 'orderId' && (
                          <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('orderDate')}>
                      <div className="flex items-center">
                        Date
                        {sortField === 'orderDate' && (
                          <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('totalAmount')}>
                      <div className="flex items-center justify-end">
                        Amount
                        {sortField === 'totalAmount' && (
                          <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Type</TableHead>

                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => {
                      const user = getDetails(order, 'user');
                      const vehicle = getDetails(order, 'vehicle');
                      const service = getDetails(order, 'service');

                      return (
                        <TableRow key={order.orderId} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>#{order.orderId}</span>
                              <div className="flex flex-wrap gap-1 mt-1">

                                {order.invoiceStatus && (
                                  <InvoiceStatusBadge status={order.invoiceStatus} />
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {user.email || 'No email'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs">
                                {vehicle.make?.[0] || '?'}
                              </div>
                              <div className="flex flex-col">
                                <span>{`${vehicle.make} ${vehicle.model}`}</span>
                                <span className="text-xs text-muted-foreground">{vehicle.year || ''}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!order.serviceId && order.includesInspection ? (
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                  <span className="text-blue-700 font-medium">Inspection Only</span>
                                </div>
                              ) : (
                                <div className="max-w-[160px] truncate" title={service.serviceName}>
                                  {service.serviceName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>
                                {order.orderDate ? format(parseISO(order.orderDate), 'MMM dd, yyyy') : 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            PKR {order.totalAmount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>
                            {order.orderType && (
                              <Badge className={order.orderType === "Walk-In" ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-blue-100 text-blue-800 border-blue-200"} variant="outline">
                                {order.orderType === 'Walk-In' ? (
                                  <Store className="h-3 w-3 mr-1" />
                                ) : (
                                  <Globe className="h-3 w-3 mr-1" />
                                )}
                                {order.orderType}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuGroup>
                                  <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.orderId}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>

                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                {/* Add Transfer to Service option if order is in progress */}
                                {order.status === 'in progress' && (
                                  <DropdownMenuItem
                                    onClick={() => handleTransferToService(order)}
                                    disabled={transferringService === order.orderId}
                                  >
                                    {transferringService === order.orderId ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Wrench className="mr-2 h-4 w-4" />
                                    )}
                                    Transfer to Service
                                  </DropdownMenuItem>
                                )}

                                {/* Add Generate Invoice option if order is completed and not paid */}
                                {order.status === 'completed' && order.invoiceStatus !== 'paid' && (
                                  <DropdownMenuItem
                                    onClick={() => handleGenerateInvoice(order.orderId)}
                                    disabled={generatingInvoice === order.orderId}
                                  >
                                    {generatingInvoice === order.orderId ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <FileText className="mr-2 h-4 w-4" />
                                    )}
                                    {order.invoiceStatus ? 'View Invoice' : 'Generate Invoice'}
                                  </DropdownMenuItem>
                                )}

                                {/* Process Payment option */}
                                {(order.invoiceStatus === 'issued' || order.invoiceStatus === 'overdue') && (
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/admin/invoices/${order.invoiceId}/payment`)}
                                    disabled={processingOrder === order.orderId}
                                  >
                                    {processingOrder === order.orderId ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <CreditCard className="mr-2 h-4 w-4" />
                                    )}
                                    Process Payment
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-52 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="rounded-full bg-muted p-3">
                            <CalendarClock className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium text-lg">No orders found</h3>
                          <p className="text-muted-foreground">
                            {searchTerm || statusFilter !== 'all' || orderTypeFilter !== 'all'
                              ? 'Try changing your search or filter criteria'
                              : 'Start by creating a new order'}
                          </p>
                          {(searchTerm || statusFilter !== 'all' || orderTypeFilter !== 'all') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setOrderTypeFilter('all');
                              }}
                            >
                              <RotateCcw className="mr-2 h-3.5 w-3.5" />
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
        {/* <CardFooter className="border-t p-4 bg-muted/20 flex-shrink-0 ">
          <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
            <div>
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
            <div className="flex items-center gap-2">
              <span>Sorted by:</span>
              <Badge variant="outline" className="font-normal">
                {sortField === 'orderId'
                  ? 'Order ID'
                  : sortField === 'orderDate'
                    ? 'Date'
                    : 'Amount'} ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
              </Badge>
            </div>
          </div>
        </CardFooter> */}
      </Card>
    </div>
  );
}