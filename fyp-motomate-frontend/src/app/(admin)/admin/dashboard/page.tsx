"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Car,
  Wrench,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Activity,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  FileText,
  Settings,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "../../../../../AuthGuard";
import { toast } from "sonner";
import adminDashboardService, { AdminDashboardResponse } from "../../../../../services/adminDashboardService";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching admin dashboard data...");
      const data = await adminDashboardService.getDashboardStats();
      console.log("Admin dashboard data received:", data);
      
      setDashboardData(data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.response?.data?.message || "Failed to load dashboard data");
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('PKR', 'Rs ');
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
      <AuthGuard>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-4 h-96 w-full rounded-lg" />
            <Skeleton className="col-span-3 h-96 w-full rounded-lg" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error Loading Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={fetchDashboardData} 
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!dashboardData) {
    return (
      <AuthGuard>
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No dashboard data available</p>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  const { stats, recentActivities, topMechanics, financialSummary, systemStats } = dashboardData;

  return (
    <AuthGuard>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 Days
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users Card */}
          <Card className="relative shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-blue-600/3 to-transparent"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-blue-600">
                    Total Users
                  </CardTitle>
                </div>
                <div className="p-1.5 bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="h-3 w-3 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 pb-6">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}% from last month
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue Card */}
          <Card className="relative shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-green-600/3 to-transparent"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-green-600">
                    Total Revenue
                  </CardTitle>
                </div>
                <div className="p-1.5 bg-green-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 pb-6">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}% growth
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Appointments Card */}
          <Card className="relative shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-purple-600/3 to-transparent"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-purple-600">
                    Active Appointments
                  </CardTitle>
                </div>
                <div className="p-1.5 bg-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Activity className="h-3 w-3 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 pb-6">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.activeAppointments}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                    In progress
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Issues Card */}
          <Card className="relative shadow-lg border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-orange-600/3 to-transparent"></div>
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-orange-600">
                    Pending Orders
                  </CardTitle>
                </div>
                <div className="p-1.5 bg-orange-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowDownRight className="h-3 w-3 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative pt-0 pb-6">
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.pendingIssues}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                    Needs attention
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>
                Key metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Mechanics Performance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Mechanics Performance</span>
                    </div>
                    <Badge variant="outline">{stats.totalMechanics} Active</Badge>
                  </div>
                  <Progress value={stats.mechanicsPerformance.completionRate} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Average Rating: {stats.mechanicsPerformance.averageRating}/5</span>
                    <span>Completion Rate: {stats.mechanicsPerformance.completionRate}%</span>
                  </div>
                </div>

                {/* Vehicle Services */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Vehicle Services</span>
                    </div>
                    <Badge variant="outline">{stats.totalVehicles} Registered</Badge>
                  </div>
                  <Progress value={stats.vehicleServices.successRate} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Services Completed: {stats.completedServices}</span>
                    <span>Success Rate: {stats.vehicleServices.successRate}%</span>
                  </div>
                </div>

                {/* Customer Satisfaction */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Customer Satisfaction</span>
                    </div>
                    <Badge variant="outline">{stats.customerSatisfaction.rating}/5 Rating</Badge>
                  </div>
                  <Progress value={stats.customerSatisfaction.resolutionRate} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Response Time: {stats.customerSatisfaction.responseTime} min</span>
                    <span>Resolution Rate: {stats.customerSatisfaction.resolutionRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest orders and appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              {recentActivities.orders && recentActivities.orders.length > 0 ? (
                 recentActivities.orders.slice(0, 5).map((order:any) => (
                   <div key={order.orderId} className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-gray-50">
                     <div className="p-2 bg-blue-100 rounded-lg">
                       <FileText className="h-4 w-4 text-blue-600" />
                     </div>
                     <div className="flex-1 space-y-1">
                       <p className="text-sm font-medium leading-none">
                         Order #{order.orderId}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {order.customerName} - {order.vehicleInfo}
                       </p>
                       <div className="flex items-center gap-2">
                         <Badge variant="outline" className="text-xs">
                           {order.status}
                         </Badge>
                         <span className="text-xs text-muted-foreground">
                           {formatCurrency(order.amount)}
                         </span>
                       </div>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-6">
                   <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No recent orders</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </div>

       {/* Additional Analytics */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {/* Top Mechanics */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Wrench className="h-5 w-5 text-blue-600" />
               Top Mechanics
             </CardTitle>
             <CardDescription>
               Best performing mechanics this month
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {topMechanics && topMechanics.length > 0 ? (
                 topMechanics.map((mechanic:any, index:any) => (
                   <div key={mechanic.mechanicId} className="flex items-center space-x-4">
                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                       {index + 1}
                     </div>
                     <div className="flex-1 space-y-1">
                       <p className="text-sm font-medium leading-none">
                         {mechanic.name}
                       </p>
                       <div className="flex items-center gap-2">
                         <span className="text-xs text-muted-foreground">
                           {mechanic.completedJobs} jobs completed
                         </span>
                         <Badge variant="outline" className="text-xs">
                           {mechanic.rating}/5 ⭐
                         </Badge>
                       </div>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-6">
                   <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No mechanic data available</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>

         {/* Financial Summary */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <DollarSign className="h-5 w-5 text-green-600" />
               Financial Summary
             </CardTitle>
             <CardDescription>
               Revenue and payment overview
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">This Month</span>
                   <span className="font-semibold">{formatCurrency(financialSummary.thisMonthRevenue)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">Last Month</span>
                   <span className="font-semibold">{formatCurrency(financialSummary.lastMonthRevenue)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">Pending Payments</span>
                   <span className="font-semibold text-orange-600">{formatCurrency(financialSummary.pendingPayments)}</span>
                 </div>
               </div>
               
               <div className="pt-4 border-t">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-sm text-muted-foreground">Payment Rate</span>
                   <span className="font-semibold">{financialSummary.paymentRate}%</span>
                 </div>
                 <Progress value={financialSummary.paymentRate} className="h-2" />
                 <div className="flex justify-between text-xs text-muted-foreground mt-1">
                   <span>Paid: {financialSummary.paidInvoices}</span>
                   <span>Total: {financialSummary.totalInvoices}</span>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>

         {/* System Statistics */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <BarChart3 className="h-5 w-5 text-purple-600" />
               System Stats
             </CardTitle>
             <CardDescription>
               Platform usage statistics
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <Wrench className="h-4 w-4 text-blue-600" />
                   <span className="text-sm">Total Services</span>
                 </div>
                 <span className="font-semibold">{systemStats.totalServices}</span>
               </div>
               
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <Eye className="h-4 w-4 text-green-600" />
                   <span className="text-sm">Total Inspections</span>
                 </div>
                 <span className="font-semibold">{systemStats.totalInspections}</span>
               </div>
               
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <Users className="h-4 w-4 text-purple-600" />
                   <span className="text-sm">Active Customers</span>
                 </div>
                 <span className="font-semibold">{systemStats.activeUsers}</span>
               </div>
               
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <Settings className="h-4 w-4 text-orange-600" />
                   <span className="text-sm">Staff Members</span>
                 </div>
                 <span className="font-semibold">{systemStats.staffMembers}</span>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>

       {/* Recent Activities Table */}
       <div className="grid gap-4 md:grid-cols-2">
         {/* Recent Appointments */}
         {/* <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Calendar className="h-5 w-5 text-blue-600" />
               Upcoming Appointments
             </CardTitle>
             <CardDescription>
               Next scheduled appointments
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {recentActivities.appointments && recentActivities.appointments.length > 0 ? (
                 recentActivities.appointments.slice(0, 5).map((appointment:any) => (
                   <div key={appointment.appointmentId} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                     <div className="space-y-1">
                       <p className="text-sm font-medium">
                         {appointment.customerName}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {appointment.vehicleInfo} - {appointment.mechanicName}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {formatDate(appointment.appointmentDate)} at {appointment.timeSlot}
                       </p>
                     </div>
                     <Badge variant="outline" className="text-xs">
                       {appointment.status}
                     </Badge>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-6">
                   <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card> */}

         {/* Recent Invoices */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <FileText className="h-5 w-5 text-green-600" />
               Recent Invoices
             </CardTitle>
             <CardDescription>
               Latest billing activity
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {recentActivities.invoices && recentActivities.invoices.length > 0 ? (
                 recentActivities.invoices.slice(0, 5).map((invoice:any) => (
                   <div key={invoice.invoiceId} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                     <div className="space-y-1">
                       <p className="text-sm font-medium">
                         Invoice #{invoice.invoiceId}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {invoice.customerName}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {formatDate(invoice.invoiceDate)}
                       </p>
                     </div>
                     <div className="text-right space-y-1">
                       <p className="text-sm font-semibold">
                         {formatCurrency(invoice.amount)}
                       </p>
                       <Badge 
                         variant="outline" 
                         className={`text-xs ${
                           invoice.status === 'paid' 
                             ? 'bg-green-50 text-green-700 border-green-200' 
                             : 'bg-orange-50 text-orange-700 border-orange-200'
                         }`}
                       >
                         {invoice.status}
                       </Badge>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-6">
                   <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-muted-foreground">No recent invoices</p>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   </AuthGuard>
 );
}