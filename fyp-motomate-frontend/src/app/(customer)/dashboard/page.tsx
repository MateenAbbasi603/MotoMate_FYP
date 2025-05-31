"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Calendar,
  ArrowRight,
  FileText,
  TrendingUp,
  ShieldCheck,
  CarFront,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Package,
  Activity,
  Plus,
  Eye,
  Gauge,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import authService from "../../../../services/authService";
import dashboardService, { CustomerDashboardResponse, Order, DashboardStats, UserInfo, Vehicle } from "../../../../services/dashboardService";

const CustomerDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<CustomerDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching dashboard data...");
        const data = await dashboardService.getCustomerDashboard();
        console.log("Dashboard data received:", data);
        
        setDashboardData(data);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setError(error.response?.data?.message || "Failed to load dashboard data");
        
        // If unauthorized, redirect to login
        if (error.response?.status === 401) {
          authService.logout();
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in progress':
        return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 100;
      case 'in progress':
        return 65;
      case 'pending':
        return 25;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('PKR', 'Rs ');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No dashboard data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, orders, recentOrders, vehicles, stats } = dashboardData;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, <span className="font-medium">{user?.name || 'Customer'}</span>
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/new-service')}
          className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Book New Service
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-blue-700">Total Orders</CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalOrders}</div>
            <p className="text-xs text-blue-600 mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.completedOrders}</div>
            <p className="text-xs text-green-600 mt-1">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-purple-700">Total Spent</CardTitle>
              <div className="p-2 rounded-full bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-purple-600 mt-1">Total expenditure</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-amber-700">My Vehicles</CardTitle>
              <div className="p-2 rounded-full bg-amber-100">
                <Car className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.totalVehicles}</div>
            <p className="text-xs text-amber-600 mt-1">Registered vehicles</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold">Recent Orders</CardTitle>
                  <CardDescription className="mt-1">Your latest service requests and their status</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/orders')}
                  className="shrink-0"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order: Order) => (
                  <div
                    key={order.orderId}
                    className="p-4 rounded-lg border hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Order #{order.orderId}</h4>
                          <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} border`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.vehicle && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CarFront className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{order.vehicle.make} {order.vehicle.model} ({order.vehicle.year}) - {order.vehicle.licensePlate}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Wrench className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {order.service ? order.service.serviceName : 
                           order.includesInspection ? 'Vehicle Inspection' : 'Service'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Amount: <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span></span>
                        {order.invoiceStatus && (
                          <Badge variant="outline" className="text-xs">
                            Invoice: {order.invoiceStatus}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{getProgressValue(order.status)}%</span>
                      </div>
                      <Progress
                        value={getProgressValue(order.status)}
                        className="h-2"
                      />
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/orders/${order.orderId}`)}
                        className="text-xs"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-gray-100 w-fit mx-auto mb-4">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-6">Start by booking your first service with us</p>
                  <Button
                    onClick={() => router.push('/dashboard/new-service')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Book Your First Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service Statistics & Quick Actions */}
        <div className="space-y-6">
          {/* Service Statistics */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Service Statistics</CardTitle>
              <CardDescription>Overview of your service history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Completed</span>
                  </div>
                  <span className="font-bold text-green-900">{stats.completedOrders}</span>
               </div>

               <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                 <div className="flex items-center space-x-3">
                   <Wrench className="h-5 w-5 text-blue-600" />
                   <span className="font-medium text-blue-900">In Progress</span>
                 </div>
                 <span className="font-bold text-blue-900">{stats.inProgressOrders}</span>
               </div>

               <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                 <div className="flex items-center space-x-3">
                   <Clock className="h-5 w-5 text-yellow-600" />
                   <span className="font-medium text-yellow-900">Pending</span>
                 </div>
                 <span className="font-bold text-yellow-900">{stats.pendingOrders}</span>
               </div>

               <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                 <div className="flex items-center space-x-3">
                   <Gauge className="h-5 w-5 text-purple-600" />
                   <span className="font-medium text-purple-900">Inspections</span>
                 </div>
                 <span className="font-bold text-purple-900">{stats.activeInspections}</span>
               </div>
             </div>

             <Separator className="my-4" />

             <div className="text-center">
               <p className="text-sm text-gray-600 mb-2">Total Service Value</p>
               <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
             </div>
           </CardContent>
         </Card>

         {/* Quick Actions */}
         <Card className="border-0 shadow-lg">
           <CardHeader>
             <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
             <CardDescription>Common tasks and shortcuts</CardDescription>
           </CardHeader>
           <CardContent className="space-y-3">
             <Button
               onClick={() => router.push('/dashboard/new-service')}
               className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
               size="lg"
             >
               <Calendar className="mr-3 h-5 w-5" />
               Book New Service
             </Button>

             <Button
               onClick={() => router.push('/dashboard/vehicles')}
               variant="outline"
               className="w-full justify-start hover:bg-green-50 hover:border-green-200"
               size="lg"
             >
               <Car className="mr-3 h-5 w-5 text-green-600" />
               Manage Vehicles
             </Button>

             <Button
               onClick={() => router.push('/dashboard/orders')}
               variant="outline"
               className="w-full justify-start hover:bg-purple-50 hover:border-purple-200"
               size="lg"
             >
               <FileText className="mr-3 h-5 w-5 text-purple-600" />
               Order History
             </Button>

             <Button
               onClick={() => router.push('/dashboard/profile')}
               variant="outline"
               className="w-full justify-start hover:bg-amber-50 hover:border-amber-200"
               size="lg"
             >
               <Settings className="mr-3 h-5 w-5 text-amber-600" />
               Account Settings
             </Button>
           </CardContent>
         </Card>
       </div>
     </div>
   </div>
 );
};

export default CustomerDashboard;