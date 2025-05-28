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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AuthGuard from "../../../../../AuthGuard";
import adminService, { DashboardStats } from "@/app/services/adminService";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMechanics: 0,
    totalVehicles: 0,
    totalRevenue: 0,
    activeAppointments: 0,
    completedServices: 0,
    pendingIssues: 0,
    monthlyGrowth: 0,
    mechanicsPerformance: {
      averageRating: 0,
      completionRate: 0,
    },
    vehicleServices: {
      successRate: 0,
    },
    customerSatisfaction: {
      rating: 0,
      responseTime: 0,
      resolutionRate: 0,
    },
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
                    +{stats.monthlyGrowth}% from last month
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
                    +{stats.monthlyGrowth}% growth
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
                    Pending Issues
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
                    <span>Average Rating: {stats.mechanicsPerformance.averageRating.toFixed(1)}/5</span>
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
                    <Badge variant="outline">{stats.customerSatisfaction.rating.toFixed(1)}/5 Rating</Badge>
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
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="h-4 w-4 mr-2" />
                  Manage Mechanics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Financial Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
