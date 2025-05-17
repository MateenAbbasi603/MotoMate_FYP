'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  Calendar,
  Clock,
  Car,
  User,
  ClipboardCheck,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HourglassIcon,
  PhoneCall,
  Mail,
  MapPin,
  CalendarClock,
  MessageSquare,
  Activity,
  ShieldCheck,
  BellRing,
  Wallet,
  FilterIcon,
  SearchIcon,
  RefreshCw,
  Timer,
  PieChart,
  ArrowUp,
  ArrowDown,
  BarChart3,
  FilterX
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import axios from 'axios';
import { formatLabel } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AppointmentData {
  appointmentId: number;
  orderId: number;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  notes: string;
  serviceId: number | null;
  user: {
    userId: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  vehicle: {
    vehicleId: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  service: {
    serviceId: number;
    serviceName: string;
    price: number;
    description: string;
    category: string;
    subCategory?: string;
  };
}

export default function MechanicDashboard() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Stats for dashboard
  const [stats, setStats] = useState({
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    weeklyLoad: 0
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      calculateStats();
    }
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Appointments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      let appointmentsData: AppointmentData[] = [];
      if (response.data && Array.isArray(response.data)) {
        appointmentsData = response.data;
      } else if (response.data && response.data.$values) {
        appointmentsData = response.data.$values;
      }

      // Sort by date, most recent first
      appointmentsData.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

      setAppointments(appointmentsData);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError(err.response?.data?.message || 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count today's appointments
    const todayAppointments = appointments.filter(appointment => {
      const appDate = new Date(appointment.appointmentDate);
      return isSameDay(appDate, today);
    }).length;
    
    // Count upcoming appointments (excluding today)
    const upcomingAppointments = appointments.filter(appointment => {
      const appDate = new Date(appointment.appointmentDate);
      appDate.setHours(0, 0, 0, 0);
      return appDate > today && appointment.status.toLowerCase() !== 'completed';
    }).length;
    
    // Count completed appointments
    const completedAppointments = appointments.filter(appointment =>
      appointment.status.toLowerCase() === 'completed'
    ).length;
    
    // Calculate weekly load (appointments in the next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const weeklyLoad = appointments.filter(appointment => {
      const appDate = new Date(appointment.appointmentDate);
      appDate.setHours(0, 0, 0, 0);
      return appDate >= today && appDate <= nextWeek && appointment.status.toLowerCase() !== 'completed';
    }).length;
    
    setStats({
      todayAppointments,
      upcomingAppointments,
      completedAppointments,
      weeklyLoad
    });
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'EEE, MMMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Filter appointments based on active tab and filters
  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = [...appointments];
    
    // Apply tab filters
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate >= today && appointment.status.toLowerCase() !== 'completed';
      });
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(appointment =>
        appointment.status.toLowerCase() === 'completed'
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => 
        appointment.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(appointment =>
        appointment.user.name.toLowerCase().includes(query) ||
        appointment.vehicle.make.toLowerCase().includes(query) ||
        appointment.vehicle.model.toLowerCase().includes(query) ||
        appointment.vehicle.licensePlate.toLowerCase().includes(query) ||
        (appointment.service?.serviceName.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  // Get status badge style and icon
  const getStatusBadge = (status: string) => {
    status = status.toLowerCase();
    
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            <CalendarClock className="h-3.5 w-3.5" />
            Scheduled
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </Badge>
        );
      case 'in progress':
      case 'inprogress':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
            <Activity className="h-3.5 w-3.5" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
            <HourglassIcon className="h-3.5 w-3.5" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  // Get the date badge style
  const getDateBadge = (dateString: string) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    
    // Reset time parts for comparison
    appointmentDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate.getTime() === today.getTime()) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3.5 w-3.5" />
          Today
        </Badge>
      );
    } else if (appointmentDate.getTime() < today.getTime()) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200">
          <Calendar className="h-3.5 w-3.5" />
          {format(appointmentDate, 'MMM d')}
        </Badge>
      );
    } else {
      // Calculate days difference
      const diffTime = Math.abs(appointmentDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3) {
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <Calendar className="h-3.5 w-3.5" />
            In {diffDays} day{diffDays > 1 ? 's' : ''}
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <Calendar className="h-3.5 w-3.5" />
            {format(appointmentDate, 'MMM d')}
          </Badge>
        );
      }
    }
  };

  // Get customer initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "NA";
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-8 w-8 text-primary" />
            Mechanic Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your appointments and scheduled services
          </p>
        </div>
        <Button onClick={fetchAppointments} disabled={refreshing} className="gap-2 shadow-sm">
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="shadow-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-50/20 dark:from-blue-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled for today
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-50/20 dark:from-amber-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Future scheduled work
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-50/20 dark:from-green-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed Services
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.completedAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-purple-50/20 dark:from-purple-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Weekly Workload
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.weeklyLoad}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Appointments this week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="upcoming" className="gap-2 data-[state=active]:bg-background">
              <HourglassIcon className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-background">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-background">
              <ClipboardCheck className="h-4 w-4" />
              All
            </TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                className="pl-9 shadow-sm w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px] shadow-sm">
                <FilterIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="completed" className="space-y-6 mt-0">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">Completed Appointments</h2>
    
    {!loading && getFilteredAppointments().length > 0 && (
      <div className="text-sm text-muted-foreground">
        {getFilteredAppointments().length} appointment{getFilteredAppointments().length !== 1 ? 's' : ''}
      </div>
    )}
  </div>

  {loading ? (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="overflow-hidden shadow-sm border border-border/50">
          <div className="p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  ) : getFilteredAppointments().length > 0 ? (
    <div className="space-y-4">
      {getFilteredAppointments().map((appointment) => (
        <Card
          key={appointment.appointmentId}
          className="overflow-hidden shadow-sm border border-border/50 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
          onClick={() => router.push(`/admin/mechanic/appointments/${appointment.appointmentId}`)}
        >
          <CardHeader className="pb-3 bg-muted/10">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 rounded-full p-2 border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Appointment #{appointment.appointmentId}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span>Order #{appointment.orderId}</span>
                    <span>•</span>
                    <span>Completed on {formatDate(appointment.appointmentDate)}</span>
                  </CardDescription>
                </div>
              </div>

              {getStatusBadge(appointment.status)}
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                <div className="flex items-center mb-3">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">Time Slot</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {appointment.timeSlot}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                <div className="flex items-center mb-3">
                  <Car className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">Vehicle</h3>
                </div>
                <p className="text-sm font-medium mb-1">
                  {appointment.vehicle.make} {appointment.vehicle.model} ({appointment.vehicle.year})
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {appointment.vehicle.licensePlate}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                <div className="flex items-center mb-3">
                  <User className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">Customer</h3>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(appointment.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{appointment.user.name}</p>
                    <p className="text-xs text-muted-foreground">{appointment.user.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/5 border-t pt-4 pb-4">
            <div className="w-full flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/5 p-2 rounded-full">
                  {appointment.service?.category === "Inspection" ? (
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Wrench className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {appointment.service 
                      ? formatLabel(appointment.service.serviceName)
                      : "Vehicle Inspection"}
                    {appointment.service?.category === "Inspection" &&
                      appointment.service.subCategory &&
                      ` (${appointment.service.subCategory})`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.service
                      ? `PKR ${appointment.service.price.toFixed(2)}`
                      : "Service details unavailable"}
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="gap-1 shadow-sm">
                View Details <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  ) : (
    <Card className="overflow-hidden shadow-sm border border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-muted/30 rounded-full p-4 mb-4">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No completed appointments</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {searchQuery || statusFilter !== 'all'
            ? "No appointments match your search or filter criteria."
            : "You don't have any completed appointments at the moment."}
        </p>
        
        {(searchQuery || statusFilter !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="gap-2"
          >
            <FilterX className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </CardContent>
    </Card>
  )}
</TabsContent>
        <TabsContent value="upcoming" className="space-y-6 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
            
            {!loading && getFilteredAppointments().length > 0 && (
              <div className="text-sm text-muted-foreground">
                {getFilteredAppointments().length} appointment{getFilteredAppointments().length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden shadow-sm border border-border/50">
                  <div className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : getFilteredAppointments().length > 0 ? (
            <div className="space-y-4">
              {getFilteredAppointments().map((appointment) => (
                <Card
                  key={appointment.appointmentId}
                  className="overflow-hidden shadow-sm border border-border/50 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/mechanic/appointments/${appointment.appointmentId}`)}
                >
                  <CardHeader className="pb-3 bg-muted/10">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-full p-2 border border-primary/20">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Appointment #{appointment.appointmentId}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span>Order #{appointment.orderId}</span>
                            <span>•</span>
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        {getDateBadge(appointment.appointmentDate)}
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center mb-3">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Time Slot</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {appointment.timeSlot}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center mb-3">
                          <Car className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Vehicle</h3>
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {appointment.vehicle.make} {appointment.vehicle.model} ({appointment.vehicle.year})
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {appointment.vehicle.licensePlate}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center mb-3">
                          <User className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Customer</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(appointment.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{appointment.user.name}</p>
                            <p className="text-xs text-muted-foreground">{appointment.user.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/5 border-t pt-4 pb-4">
                    <div className="w-full flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-full">
                          {appointment.service?.category === "Inspection" ? (
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Wrench className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {appointment.service 
                              ? formatLabel(appointment.service.serviceName)
                              : "Vehicle Inspection"}
                            {appointment.service?.category === "Inspection" &&
                              appointment.service.subCategory &&
                              ` (${appointment.service.subCategory})`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.service
                              ? `PKR ${appointment.service.price.toFixed(2)}`
                              : "Service details unavailable"}
                          </p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="gap-1 shadow-sm">
                        View Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden shadow-sm border border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                <div className="bg-muted/30 rounded-full p-4 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">No completed appointments</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? "No appointments match your search or filter criteria."
                    : "You don't have any completed appointments at the moment."}
                </p>
                
                {(searchQuery || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6 mt-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Appointments</h2>
            
            {!loading && getFilteredAppointments().length > 0 && (
              <div className="text-sm text-muted-foreground">
                {getFilteredAppointments().length} appointment{getFilteredAppointments().length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden shadow-sm border border-border/50">
                  <div className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : getFilteredAppointments().length > 0 ? (
            <div className="space-y-4">
              {getFilteredAppointments().map((appointment) => (
                <Card
                  key={appointment.appointmentId}
                  className="overflow-hidden shadow-sm border border-border/50 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/mechanic/appointments/${appointment.appointmentId}`)}
                >
                  <CardHeader className="pb-3 bg-muted/10">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 border ${
                          appointment.status.toLowerCase() === 'completed' 
                            ? 'bg-green-100 border-green-200' 
                            : 'bg-primary/10 border-primary/20'
                        }`}>
                          {appointment.status.toLowerCase() === 'completed' 
                            ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                            : <Wrench className="h-5 w-5 text-primary" />
                          }
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Appointment #{appointment.appointmentId}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span>Order #{appointment.orderId}</span>
                            <span>•</span>
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        {getDateBadge(appointment.appointmentDate)}
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center mb-3">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Time Slot</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {appointment.timeSlot}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center mb-3">
                          <Car className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Vehicle</h3>
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {appointment.vehicle.make} {appointment.vehicle.model} ({appointment.vehicle.year})
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {appointment.vehicle.licensePlate}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-muted/10 p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center mb-3">
                          <User className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Customer</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(appointment.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{appointment.user.name}</p>
                            <p className="text-xs text-muted-foreground">{appointment.user.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/5 border-t pt-4 pb-4">
                    <div className="w-full flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-full">
                          {appointment.service?.category === "Inspection" ? (
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Wrench className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {appointment.service 
                              ? formatLabel(appointment.service.serviceName)
                              : "Vehicle Inspection"}
                            {appointment.service?.category === "Inspection" &&
                              appointment.service.subCategory &&
                              ` (${appointment.service.subCategory})`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appointment.service
                              ? `PKR ${appointment.service.price.toFixed(2)}`
                              : "Service details unavailable"}
                          </p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="gap-1 shadow-sm">
                        View Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden shadow-sm border border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                <div className="bg-muted/30 rounded-full p-4 mb-4">
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">No appointments found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? "No appointments match your search or filter criteria."
                    : "You don't have any appointments in the system yet."}
                </p>
                
                {(searchQuery || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}