
// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Calendar,
  ArrowRight,
  FileText,
  Bell,
  Star,
  ShieldCheck,
  CarFront,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";



import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import orderService from "../../../../services/orderService";
import { getNotifications } from "../../../../services/notificationServices";
import authService from "../../../../services/authService";
import reviewService from "../../../../services/reviewService";
import { Progress } from "@/components/ui/progress";

interface DashboardStatType {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  status?: "success" | "warning" | "error" | "default";
  description?: string;
}

const CustomerDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [workshopRating, setWorkshopRating] = useState<number>(0);

  useEffect(() => {
    
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get current user
        const userData = await authService.getCurrentUser();
        setUser(userData);

        // Get notifications
        const notificationsData = await getNotifications();
        setNotifications(notificationsData.slice(0, 5)); // Display only 5 latest notifications

        // Get recent orders
        const ordersData = await orderService.getAllOrders();
        const filteredOrders = Array.isArray(ordersData)
          ? ordersData.filter((order: any) => order.userId === userData.userId)
          : [];

        setRecentOrders(filteredOrders.slice(0, 3)); // Display only 3 recent orders
        setOrderCount(filteredOrders.length);

        // Get pending reviews
        const { orders: reviewOrders } = await reviewService.getPendingReviews();
        setPendingReviews(reviewOrders);

        // Get workshop rating
        const rating = await reviewService.getWorkshopRating();
        setWorkshopRating(rating.averageRating || 0);

        // Count vehicles
        const vehiclesResponse = await fetch('/api/vehicles', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json();
          setVehicleCount(Array.isArray(vehiclesData) ? vehiclesData.length : 0);
        }

        // Count reviews
        setReviewCount(reviewOrders.length);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  // Define dashboard stats based on loaded data
  const dashboardStats: DashboardStatType[] = [
    {
      title: "Vehicles",
      value: vehicleCount,
      icon: <Car className="h-6 w-6 text-blue-500" />,
      status: "default",
      description: "Registered vehicles"
    },
    {
      title: "Orders",
      value: orderCount,
      icon: <FileText className="h-6 w-6 text-purple-500" />,
      status: "default",
      description: "Total service orders"
    },
    {
      title: "Pending Reviews",
      value: pendingReviews.length,
      icon: <Star className="h-6 w-6 text-amber-500" />,
      status: pendingReviews.length > 0 ? "warning" : "success",
      description: pendingReviews.length > 0 ? "Reviews needed" : "All reviewed"
    },
    {
      title: "Workshop Rating",
      value: workshopRating.toFixed(1),
      icon: <ShieldCheck className="h-6 w-6 text-green-500" />,
      status: "default",
      description: "Out of 5.0"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg mt-6" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'Customer'}
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/new-service')}
          className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          Book a Service
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-full bg-muted">
                  {stat.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>

              {stat.title === "Workshop Rating" && (
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(workshopRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              )}

              {stat.status === "warning" && (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 mt-2">
                  Action needed
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/orders')}
            >
              View All
            </Button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {recentOrders.map((order: any) => (
                <Card key={order.orderId} className="overflow-hidden hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                        <CardDescription>{formatDate(order.orderDate)}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span>{order.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <CarFront className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {order.vehicle
                            ? `${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.year})`
                            : 'Vehicle information not available'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {order.service
                            ? order.service.serviceName
                            : order.includesInspection
                              ? 'Inspection'
                              : 'Service information not available'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-medium">
                            {
                              order.status === 'completed' ? '100%' :
                                order.status === 'in progress' ? '60%' :
                                  order.status === 'pending' ? '20%' : '0%'
                            }
                          </span>
                        </div>
                        <Progress
                          value={
                            order.status === 'completed' ? 100 :
                              order.status === 'in progress' ? 60 :
                                order.status === 'pending' ? 20 : 0
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/orders/${order.orderId}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No orders yet</h3>
                <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                  You haven't placed any service orders yet.
                </p>
                <Button onClick={() => router.push('/dashboard/new-service')}>
                  Book Your First Service
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending Reviews</h2>
            {pendingReviews.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800">
                {pendingReviews.length} pending
              </Badge>
            )}
          </div>

          {pendingReviews.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingReviews.map((review: any) => (
                <Card key={review.orderId} className="overflow-hidden hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{review.orderId}</CardTitle>
                        <CardDescription>{formatDate(review.orderDate)}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <CarFront className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {review.vehicle
                            ? `${review.vehicle.make} ${review.vehicle.model} (${review.vehicle.year})`
                            : 'Vehicle information not available'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {review.service
                            ? review.service.serviceName
                            : 'Service information not available'}
                        </span>
                      </div>
                      {review.mechanic && (
                        <div className="flex items-center text-sm">
                          <Star className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Mechanic: {review.mechanic.name}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/reviews/${review.orderId}`)}
                    >
                      Leave a Review
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No pending reviews</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  You have reviewed all your completed services.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Notifications</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/notifications')}
            >
              View All
            </Button>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <Alert key={notification.notificationId} className="hover:bg-muted/50 transition-colors">
                  <Bell className="h-4 w-4" />
                  <AlertTitle className="text-base font-medium">
                    {notification.status === 'unread' && (
                      <Badge className="bg-blue-100 text-blue-800 mr-2">New</Badge>
                    )}
                    Notification
                  </AlertTitle>
                  <AlertDescription className="mt-1">
                    {notification.message}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(notification.createdAt)}
                    </p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  You have no new notifications at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push('/dashboard/new-service')}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Calendar className="h-8 w-8 text-blue-500 mb-3" />
              <h3 className="font-medium text-center">Book Service</h3>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push('/dashboard/vehicles')}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Car className="h-8 w-8 text-green-500 mb-3" />
              <h3 className="font-medium text-center">My Vehicles</h3>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push('/dashboard/orders')}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <FileText className="h-8 w-8 text-purple-500 mb-3" />
              <h3 className="font-medium text-center">Order History</h3>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push('/dashboard/profile')}>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="font-medium text-center">My Profile</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;