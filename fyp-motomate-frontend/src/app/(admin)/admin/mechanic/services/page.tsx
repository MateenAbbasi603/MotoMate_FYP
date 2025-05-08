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
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Changed from '' to 'all'

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
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
        
        setServices(serviceData);
      } catch (err: any) {
        console.error('Error fetching mechanic services:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load services');
        toast.error(err.response?.data?.message || 'Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

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

  // Filter services based on search and status filter
  const filteredServices = services.filter(service => {
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
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Service Assignments</h1>
          <p className="text-muted-foreground">
            View and manage all services assigned to you
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by license plate, customer, or service..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              {/* Fixed the Select component by using 'all' instead of empty string */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="awaiting parts">Awaiting Parts</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>Loading services...</p>
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No services found</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm || statusFilter !== 'all'
                ? "Try adjusting your filters to find services"
                : "You don't have any service assignments yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
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
                  <TableRow key={service.transferId}>
                    <TableCell className="font-medium">#{service.orderId}</TableCell>
                    <TableCell>
                      <div className="font-medium">{service.service?.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{service.service?.category || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {service.vehicle?.make || 'N/A'} {service.vehicle?.model || ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {service.vehicle?.year || 'N/A'} • {service.vehicle?.licensePlate || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{service.customer?.name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{service.customer?.phone || 'N/A'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="font-medium">{formatDate(service.orderDate)}</div>
                      </div>
                      {service.eta && (
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div className="text-xs text-muted-foreground">
                            ETA: {formatDate(service.eta)}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/admin/mechanic/services/${service.transferId}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}