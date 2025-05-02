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
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import axios from 'axios';
import { formatLabel } from '@/lib/utils';

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
  const router = useRouter();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the authentication token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
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

        console.log(response.data);

        let appointmentsData: AppointmentData[] = [];
        if (response.data && Array.isArray(response.data)) {
          appointmentsData = response.data;
        } else if (response.data && response.data.$values) {
          appointmentsData = response.data.$values;
        }

        setAppointments(appointmentsData);
      } catch (err: any) {
        console.error('Failed to fetch appointments:', err);
        setError(err.response?.data?.message || 'Failed to load appointments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Filter appointments based on active tab
  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === 'upcoming') {
      return appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate >= today && appointment.status.toLowerCase() !== 'completed';
      });
    } else if (activeTab === 'completed') {
      return appointments.filter(appointment =>
        appointment.status.toLowerCase() === 'completed'
      );
    } else {
      return appointments;
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    status = status.toLowerCase();
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'in progress':
      case 'inprogress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };


  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Wrench className="mr-2 h-6 w-6 text-primary" />
        Mechanic Dashboard
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming Appointments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <h2 className="text-xl font-medium mb-4">Your Upcoming Appointments</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
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
                  className="overflow-hidden hover:border-primary transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/mechanic/appointments/${appointment.appointmentId}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        Appointment #{appointment.appointmentId}
                      </CardTitle>
                      <Badge className={getStatusBadgeStyle(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Order #{appointment.orderId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Appointment Details</h3>
                        </div>
                        <p className="text-sm mb-1">
                          <span className="text-muted-foreground">Date:</span> {formatDate(appointment.appointmentDate)}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Time:</span> {appointment.timeSlot}
                        </p>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <Car className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Vehicle</h3>
                        </div>
                        <p className="text-sm mb-1">
                          {appointment.vehicle.make} {appointment.vehicle.model} ({appointment.vehicle.year})
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">License:</span> {appointment.vehicle.licensePlate}
                        </p>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <User className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Customer</h3>
                        </div>
                        <p className="text-sm mb-1">{appointment.user.name}</p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Phone:</span> {appointment.user.phone}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 pt-3">
                    <div className="w-full flex justify-between items-center">
                      {appointment.service ? (
                        <div>
                          <p className="text-sm font-medium">
                            {formatLabel(appointment.service.serviceName)}
                            {appointment.service.category === "Inspection" &&
                              appointment.service.subCategory &&
                              ` (${appointment.service.subCategory})`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${appointment.service.price.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">Vehicle Inspection</p>
                          <p className="text-sm text-muted-foreground">Service details unavailable</p>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="gap-1">
                        View Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 rounded-md">
              <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No upcoming appointments</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You dont have any upcoming appointments scheduled at the moment.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <h2 className="text-xl font-medium mb-4">Completed Appointments</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
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
                  className="overflow-hidden hover:border-primary transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/mechanic/appointments/${appointment.appointmentId}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        Appointment #{appointment.appointmentId}
                      </CardTitle>
                      <Badge className={getStatusBadgeStyle(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Completed on {formatDate(appointment.appointmentDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Order Details</h3>
                        </div>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Order #:</span> {appointment.orderId}
                        </p>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <Car className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Vehicle</h3>
                        </div>
                        <p className="text-sm mb-1">
                          {appointment.vehicle.make} {appointment.vehicle.model} ({appointment.vehicle.year})
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">License:</span> {appointment.vehicle.licensePlate}
                        </p>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <User className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Customer</h3>
                        </div>
                        <p className="text-sm mb-1">{appointment.user.name}</p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Phone:</span> {appointment.user.phone}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 pt-3">
                    <div className="w-full flex justify-between items-center">
                      {appointment.service ? (
                        <div>
                          <p className="text-sm font-medium">
                            {formatLabel(appointment.service.serviceName)}
                            {appointment.service.category === "Inspection" &&
                              appointment.service.subCategory &&
                              ` (${appointment.service.subCategory})`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${appointment.service.price.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">Vehicle Inspection</p>
                          <p className="text-sm text-muted-foreground">Service details unavailable</p>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="gap-1">
                        View Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 rounded-md">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No completed appointments</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You dont have any completed appointments yet.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <h2 className="text-xl font-medium mb-4">All Appointments</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
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
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <Card
                  key={appointment.appointmentId}
                  className="overflow-hidden hover:border-primary transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/mechanic/appointments/${appointment.appointmentId}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        Appointment #{appointment.appointmentId}
                      </CardTitle>
                      <Badge className={getStatusBadgeStyle(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Order #{appointment.orderId} • {formatDate(appointment.appointmentDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Time Slot</h3>
                        </div>
                        <p className="text-sm">
                          {appointment.timeSlot}
                        </p>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <Car className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Vehicle</h3>
                        </div>
                        <p className="text-sm mb-1">
                          {appointment.vehicle.make} {appointment.vehicle.model} ({appointment.vehicle.year})
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">License:</span> {appointment.vehicle.licensePlate}
                        </p>
                      </div>

                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="flex items-center mb-2">
                          <User className="h-4 w-4 mr-2 text-primary" />
                          <h3 className="font-medium">Customer</h3>
                        </div>
                        <p className="text-sm mb-1">{appointment.user.name}</p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Phone:</span> {appointment.user.phone}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 pt-3">
                    <div className="w-full flex justify-between items-center">
                      {appointment.service ? (
                        <div>
                          <p className="text-sm font-medium">
                            {formatLabel(appointment.service.serviceName)}
                            {appointment.service.category === "Inspection" &&
                              appointment.service.subCategory &&
                              ` (${appointment.service.subCategory})`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${appointment.service.price.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">Vehicle Inspection</p>
                          <p className="text-sm text-muted-foreground">Service details unavailable</p>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="gap-1">
                        View Details <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-muted/30 rounded-md">
              <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No appointments found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You dont have any appointments assigned to you yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}