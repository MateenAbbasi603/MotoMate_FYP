"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  Star,
  Wrench,
  Car,
  User,
  Phone,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface MechanicData {
  success: boolean;
  mechanic: {
    mechanicId: number;
    name: string;
    email: string;
    phone: string;
    imgUrl: string;
  };
  stats: {
    todayAppointments: number;
    weeklyAppointments: number;
    completedThisWeek: number;
    totalCompleted: number;
    rating: number;
    activeServices: number;
  };
  todaySchedule: Array<{
    appointmentId: number;
    timeSlot: string;
    customerName: string;
    vehicleInfo: string;
    licensePlate: string;
    serviceName: string;
    status: string;
    notes: string;
  }>;
  upcomingAppointments: Array<{
    appointmentId: number;
    date: string;
    timeSlot: string;
    customerName: string;
    vehicleInfo: string;
    licensePlate: string;
    serviceName: string;
    status: string;
  }>;
  activeServices: Array<{
    transferId: number;
    orderId: number;
    customerName: string;
    vehicleInfo: string;
    licensePlate: string;
    serviceName: string;
    status: string;
    eta: string;
    notes: string;
  }>;
}

export default function MechanicDashboard() {
  const [data, setData] = useState<MechanicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);
  const token = localStorage.getItem('token');


  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/mechanic`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result,"DAHSSS AKLS AOLK");
        
        setData(result);
      } else {
        toast.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      scheduled: "bg-blue-100 text-blue-800",
      "in progress": "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-gray-100 text-gray-800",
      "awaiting parts": "bg-orange-100 text-orange-800",
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">Unable to fetch dashboard data</p>
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {data.mechanic.name}
          </h1>
          <p className="text-gray-600">Here's your schedule and current work</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.todayAppointments}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.weeklyAppointments}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalCompleted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.rating}/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.todaySchedule.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.todaySchedule.map((appointment) => (
                  <div key={appointment.appointmentId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{appointment.timeSlot}</span>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{appointment.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-500" />
                        <span>{appointment.vehicleInfo} ({appointment.licensePlate})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-500" />
                        <span>{appointment.serviceName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Active Services ({data.stats.activeServices})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.activeServices.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No active services</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.activeServices.map((service) => (
                  <div key={service.transferId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Order #{service.orderId}</span>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{service.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-500" />
                        <span>{service.vehicleInfo} ({service.licensePlate})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-500" />
                        <span>{service.serviceName}</span>
                      </div>
                      {service.eta && service.eta !== "Not set" && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>ETA: {service.eta}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      {data.upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.upcomingAppointments.map((appointment) => (
                <div key={appointment.appointmentId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{appointment.date}</span>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{appointment.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{appointment.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span>{appointment.vehicleInfo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}