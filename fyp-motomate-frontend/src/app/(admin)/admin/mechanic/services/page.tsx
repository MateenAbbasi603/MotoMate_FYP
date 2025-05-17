'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car,
  Calendar,
  Clock,
  Wrench,
  User,
  AlertTriangle,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  Clock1,
  CalendarClock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Package,
  CircleAlert,
  CircleX,
  PlusCircle,
  BarChart3
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ServiceItem {
  transferId: number;
  orderId: number;
  userId: number;
  vehicleId: number;
  serviceId: number;
  mechanicId: number;
  orderDate: string;
  status: string;
  notes: string;
  eta: string | null;
  createdAt: string;
  service: {
    name: string;
    category: string;
    price: number;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  mechanic: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function MechanicServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Stats for dashboard
  const [stats, setStats] = useState({
    inProgress: 0,
    awaitingParts: 0,
    completed: 0,
    total: 0
  });

  // Fetch services
  useEffect(() => {
    fetchServices();
  }, []);

  // Calculate stats when services change
  useEffect(() => {
    calculateStats();
  }, [services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/MechanicServices`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Extract services from the response, handling different formats
      let serviceData: ServiceItem[] = [];

      if (response.data && response.data.$values) {
        // Handle $values array format
        serviceData = response.data.$values;
      } else if (Array.isArray(response.data)) {
        // Handle direct array format
        serviceData = response.data;
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format from server');
        return;
      }

      // In the fetchServices function, after setting the services:
      setServices(serviceData.sort((a, b) => {
        // Sort by created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));
    } catch (err: any) {
      console.error('Error fetching mechanic services:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load services');
      toast.error(err.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const inProgress = services.filter(s => s.status?.toLowerCase() === 'in progress').length;
    const awaitingParts = services.filter(s => s.status?.toLowerCase() === 'awaiting parts').length;
    const completed = services.filter(s => s.status?.toLowerCase() === 'completed').length;

    setStats({
      inProgress,
      awaitingParts,
      completed,
      total: services.length
    });
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
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
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </Badge>
        );
      case 'in progress':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 py-1">
            <Clock1 className="h-3.5 w-3.5" /> In Progress
          </Badge>
        );
      case 'awaiting parts':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 py-1">
            <Package className="h-3.5 w-3.5" /> Awaiting Parts
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 py-1">
            <CircleX className="h-3.5 w-3.5" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1 py-1">
            <CircleAlert className="h-3.5 w-3.5" /> {status || 'Unknown'}
          </Badge>
        );
    }
  };

  // Get customer initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "NA";

    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  // Filter services based on active tab, search and status filter
  const filteredServices = services.filter(service => {
    // Tab filter
    let matchesTab = true;
    if (activeTab === 'in-progress') {
      matchesTab = service.status?.toLowerCase() === 'in progress';
    } else if (activeTab === 'awaiting-parts') {
      matchesTab = service.status?.toLowerCase() === 'awaiting parts';
    } else if (activeTab === 'completed') {
      matchesTab = service.status?.toLowerCase() === 'completed';
    }

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      service.vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
      service.customer?.name?.toLowerCase().includes(searchLower) ||
      `${service.vehicle?.make || ''} ${service.vehicle?.model || ''}`.toLowerCase().includes(searchLower) ||
      service.service?.name?.toLowerCase().includes(searchLower) ||
      service.orderId?.toString().includes(searchLower);

    // Status filter - use 'all' as default to show everything
    const matchesStatus = statusFilter === 'all' ||
      service.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesTab && matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            My Service Assignments
          </h1>
          <p className="text-muted-foreground">
            View and manage all vehicle services assigned to you
          </p>
        </div>
        <Button
          onClick={fetchServices}
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

      {/* Stats Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-50/20 dark:from-blue-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Clock1 className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active service tasks
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-50/20 dark:from-amber-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Awaiting Parts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.awaitingParts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              On hold for parts
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-50/20 dark:from-green-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-purple-50/20 dark:from-purple-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All service tasks
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-background">
              <Wrench className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="gap-2 data-[state=active]:bg-background">
              <Clock1 className="h-4 w-4" />
              In Progress
            </TabsTrigger>
            <TabsTrigger value="awaiting-parts" className="gap-2 data-[state=active]:bg-background">
              <Package className="h-4 w-4" />
              Awaiting Parts
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-background">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by license plate, customer, or service..."
                className="pl-9 shadow-sm w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="shadow-sm">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="awaiting parts">Awaiting Parts</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <Card className="border shadow-sm">
              <CardContent className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p className="text-lg font-medium">Loading services...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fetching your service assignments
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-red-50 border-red-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-700">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <div>
                    <p className="font-medium">Error loading services</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : filteredServices.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                <div className="bg-muted/30 rounded-full p-4 mb-4">
                  <Wrench className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">No services found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? "No services match your search or filter criteria. Try adjusting your filters."
                    : "You don't have any service assignments yet."}
                </p>

                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>
                      Showing {filteredServices.length} of {services.length} service assignments
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow
                          key={service.transferId}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => router.push(`/admin/mechanic/services/${service.transferId}`)}
                        >
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                              #{service.orderId}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{service.service?.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <Badge variant="outline" className="text-xs font-normal bg-secondary/30">
                                {service.service?.category || 'N/A'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="flex items-center cursor-help">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-800 border border-blue-200">
                                    <Car className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {service.vehicle?.make || 'N/A'} {service.vehicle?.model || ''}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
                                        {service.vehicle?.licensePlate || 'N/A'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-72">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">Vehicle Details</h4>
                                  <div className="text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="text-muted-foreground">Make:</div>
                                      <div>{service.vehicle?.make || 'N/A'}</div>
                                      <div className="text-muted-foreground">Model:</div>
                                      <div>{service.vehicle?.model || 'N/A'}</div>
                                      <div className="text-muted-foreground">Year:</div>
                                      <div>{service.vehicle?.year || 'N/A'}</div>
                                      <div className="text-muted-foreground">License:</div>
                                      <div className="font-mono">{service.vehicle?.licensePlate || 'N/A'}</div>
                                    </div>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2 border border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {getInitials(service.customer?.name || '')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{service.customer?.name || 'N/A'}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{service.customer?.phone || 'N/A'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div className="font-medium">{formatDate(service.orderDate)}</div>
                            </div>
                            {service.eta && (
                              <div className="flex items-center mt-1.5">
                                <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                                <div className="text-xs text-amber-700">
                                  ETA: {service.eta}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(service.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/mechanic/services/${service.transferId}`);
                              }}
                            >
                              <span className="mr-1">Details</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}