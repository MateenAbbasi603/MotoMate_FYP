'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  Trash,
  Loader2,
  User,
  UserCog,
  Wrench,
  BadgeAlert,
  ShieldAlert,
  ClipboardList,
  Clock,
  History,
  Building,
  Check,
  XCircle,
  FileText,
  Pencil,
  Key,
  LogOut,
  Lock,
  CreditCard
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserDetails {
  userId: number;
  username: string;
  email: string;
  role: string;
  name: string;
  phone: string | null;
  address: string | null;
  imgUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

type Activity = {
  id: number;
  action: string;
  timestamp: string;
  details: string;
  icon: React.ReactNode;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function UserDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for recent activities
  const [recentActivities, setRecentActivities] = useState<Activity[]>([
    {
      id: 1,
      action: "Logged in",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: "Last login from 192.168.1.1",
      icon: <LogOut className="h-4 w-4 text-blue-500" />
    },
    {
      id: 2,
      action: "Password changed",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      details: "Password was reset",
      icon: <Key className="h-4 w-4 text-amber-500" />
    },
    {
      id: 3,
      action: "Updated profile",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      details: "Changed contact information",
      icon: <Pencil className="h-4 w-4 text-green-500" />
    }
  ]);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
          title: 'Super Administrator'
        };
      case 'admin':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <ShieldCheck className="h-5 w-5 text-blue-500" />,
          title: 'Administrator'
        };
      case 'service_agent':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <UserCog className="h-5 w-5 text-green-500" />,
          title: 'Service Agent'
        };
      case 'mechanic':
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Wrench className="h-5 w-5 text-amber-500" />,
          title: 'Mechanic'
        };
      case 'finance_officer':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <BadgeAlert className="h-5 w-5 text-purple-500" />,
          title: 'Finance Officer'
        };
      case 'customer':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <User className="h-5 w-5 text-gray-500" />,
          title: 'Customer'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <User className="h-5 w-5 text-gray-500" />,
          title: role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

        // Fetch user data from the Users API endpoint
        const response = await axios.get(
          `${API_URL}/api/Users/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Check if we got user data back
        if (response.data) {
          setUser(response.data);
        } else {
          setError('User details not found');
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setError('Failed to load user details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, router]);

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

      await axios.delete(
        `${API_URL}/api/Users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading user details...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle className="flex items-center">
            <XCircle className="h-4 w-4 mr-2" />
            Error
          </AlertTitle>
          <AlertDescription>{error || 'User not found'}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push('/admin/users')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Staff List
        </Button>
      </div>
    );
  }

  const roleConfig = getRoleConfig(user.role);

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/users')}
            className="w-10 h-10 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {roleConfig.icon}
              <span>{user.name}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage staff member details
            </p>
          </div>
        </div>

        {user.role !== "super_admin" && user.role !== "customer" && (
          <div className="flex">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash className="h-4 w-4" />
                  Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user
                    &quot;{user.name}&quot; and remove their data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteUser}
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : "Delete User"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div>
          <Card className="shadow-sm border-0">
            <CardHeader className="text-center pt-6 pb-3">
              <div className="flex justify-center mb-4">
                <Avatar className="h-32 w-32 border-4 border-primary/10 shadow">
                  <AvatarImage src={user.imgUrl} alt={user.name} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <Badge variant="outline" className={`mt-1 py-1 px-3 gap-1.5 font-medium ${roleConfig.color}`}>
                {roleConfig.icon}
                <span>{roleConfig.title}</span>
              </Badge>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    Account Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-medium">#{user.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Username:</span>
                      <span className="font-medium">@{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center text-muted-foreground">
                    <Lock className="h-4 w-4 mr-2" />
                    Security Status
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>2FA Setup</span>
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          Not Enabled
                        </Badge>
                      </div>
                      <Progress value={0} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Password Strength</span>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                          Medium
                        </Badge>
                      </div>
                      <Progress value={60} className="h-1.5" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Login
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span>{formatTime(recentActivities[0]?.timestamp || user.lastLogin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>Karachi, PK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Device:</span>
                      <span>Chrome / Windows</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex justify-center">
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled
                onClick={() => toast.info("Edit functionality not implemented yet")}
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <Tabs defaultValue="overview" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="overview" className="rounded-md">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="rounded-md">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Permissions
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-md">
                    <History className="h-4 w-4 mr-2" />
                    Activity
                  </TabsTrigger>
                </TabsList>

                <CardContent className="pt-6">
                  <TabsContent value="overview" className="space-y-6 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="shadow-none border bg-muted/20">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-md flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-primary" />
                            Contact Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start">
                              <Mail className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm text-muted-foreground">Email Address</p>
                                <p className="font-medium">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Phone className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm text-muted-foreground">Phone Number</p>
                                <p className="font-medium">{user.phone || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">{user.address || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-none border bg-muted/20">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-md flex items-center">
                            <Building className="h-4 w-4 mr-2 text-primary" />
                            Employment Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start">
                              <UserCog className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm text-muted-foreground">Position</p>
                                <p className="font-medium">{roleConfig.title}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Calendar className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm text-muted-foreground">Start Date</p>
                                <p className="font-medium">{formatDate(user.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <CreditCard className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm text-muted-foreground">Department</p>
                                <p className="font-medium">
                                  {user.role === 'mechanic' ? 'Service Department' :
                                    user.role === 'service_agent' ? 'Customer Service' :
                                      user.role === 'finance_officer' ? 'Finance Department' :
                                        'Administration'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="shadow-none border bg-muted/20">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-md flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          Additional Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <p className="text-muted-foreground">
                          This staff member has been with MotoMate since {formatDate(user.createdAt)}.
                          {user.role === 'mechanic' && ' They are specialized in vehicle diagnostics and repairs.'}
                          {user.role === 'service_agent' && ' They handle customer inquiries and service scheduling.'}
                          {user.role === 'finance_officer' && ' They manage financial records and invoicing.'}
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="permissions" className="m-0">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-none border bg-muted/20">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-md flex items-center">
                              <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                              {roleConfig.title} Permissions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <p className="text-sm text-muted-foreground mb-3">
                              As a <span className="font-medium">{roleConfig.title}</span>, this user has the following permissions:
                            </p>
                            <div className="space-y-2">
                              {user.role === 'super_admin' || user.role === 'admin' ? (
                                <>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-blue-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Full access to all system modules</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-blue-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Manage users and their permissions</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-blue-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Access to all financial records</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-blue-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Manage system settings</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-blue-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>View and edit all orders</span>
                                  </Badge>
                                </>
                              ) : user.role === 'service_agent' ? (
                                <>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-green-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>View and manage customer information</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-green-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Create and update service orders</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-green-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Assign mechanics to jobs</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-green-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Send service updates to customers</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-green-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Limited access to financial records</span>
                                  </Badge>
                                </>
                              ) : user.role === 'mechanic' ? (
                                <>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-amber-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>View assigned service orders</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-amber-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Update service status</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-amber-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Submit service completion reports</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-amber-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Access to maintenance history</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-amber-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>No access to financial records</span>
                                  </Badge>
                                </>
                              ) : user.role === 'finance_officer' ? (
                                <>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-purple-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Full access to financial records</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-purple-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Full access to financial records</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-purple-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Manage invoices and payments</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-purple-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Generate financial reports</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-purple-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Track receivables and payables</span>
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center w-full justify-start gap-2 p-2 bg-purple-50">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span>Limited access to customer data</span>
                                  </Badge>
                                </>
                              ) : (
                                <p className="text-muted-foreground italic">Custom permissions</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="shadow-none border bg-muted/20">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-md flex items-center">
                              <Key className="h-4 w-4 mr-2 text-primary" />
                              System Access
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <ClipboardList className="h-4 w-4 mr-2 text-primary" />
                                  <span>Dashboard</span>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="bg-green-100 text-green-800">
                                        Full Access
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Can view and interact with all dashboard elements</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <UserCog className="h-4 w-4 mr-2 text-primary" />
                                  <span>User Management</span>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      {user.role === 'super_admin' || user.role === 'admin' ? (
                                        <Badge variant="outline" className="bg-green-100 text-green-800">
                                          Full Access
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-red-100 text-red-800">
                                          No Access
                                        </Badge>
                                      )}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        {user.role === 'super_admin' || user.role === 'admin'
                                          ? 'Can create, update, and delete users'
                                          : 'Cannot access user management features'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <Wrench className="h-4 w-4 mr-2 text-primary" />
                                  <span>Service Management</span>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      {user.role === 'super_admin' || user.role === 'admin' || user.role === 'service_agent' || user.role === 'mechanic' ? (
                                        <Badge variant="outline" className="bg-green-100 text-green-800">
                                          {user.role === 'mechanic' ? 'Limited Access' : 'Full Access'}
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                                          Read Only
                                        </Badge>
                                      )}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        {user.role === 'mechanic'
                                          ? 'Can view and update assigned services'
                                          : user.role === 'service_agent' || user.role === 'admin' || user.role === 'super_admin'
                                            ? 'Can create, update, and manage all services'
                                            : 'Can only view service records'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <BadgeAlert className="h-4 w-4 mr-2 text-primary" />
                                  <span>Finance Module</span>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      {user.role === 'super_admin' || user.role === 'admin' || user.role === 'finance_officer' ? (
                                        <Badge variant="outline" className="bg-green-100 text-green-800">
                                          Full Access
                                        </Badge>
                                      ) : user.role === 'service_agent' ? (
                                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                                          Limited Access
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-red-100 text-red-800">
                                          No Access
                                        </Badge>
                                      )}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        {user.role === 'finance_officer' || user.role === 'admin' || user.role === 'super_admin'
                                          ? 'Can view and manage all financial records'
                                          : user.role === 'service_agent'
                                            ? 'Can view invoices but cannot edit financial records'
                                            : 'No access to financial information'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="shadow-none border bg-muted/20">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-md flex items-center">
                            <ShieldAlert className="h-4 w-4 mr-2 text-primary" />
                            Role Description
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="space-y-2">
                            <p className="text-sm">
                              {user.role === 'super_admin'
                                ? 'As a Super Administrator, this user has unlimited access to all system functions and can manage all aspects of the application, including system settings, user management, and critical configurations. This is the highest level of access in the system.'
                                : user.role === 'admin'
                                  ? 'As an Administrator, this user has broad access to most system functions including user management, service configuration, and reporting. They can manage staff accounts and oversee day-to-day operations.'
                                  : user.role === 'service_agent'
                                    ? 'As a Service Agent, this user handles customer interaction, service scheduling, and appointment management. They can create and update service orders, assign mechanics, and provide customer support throughout the service process.'
                                    : user.role === 'mechanic'
                                      ? 'As a Mechanic, this user focuses on vehicle inspection and service execution. They can update service statuses, add notes, and mark services as complete. Their access is limited to their assigned work orders.'
                                      : user.role === 'finance_officer'
                                        ? 'As a Finance Officer, this user manages all financial aspects of the system including invoicing, payment processing, and financial reporting. They have limited access to service details but full access to financial records.'
                                        : 'Custom role with specific permissions.'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="m-0">
                    <div className="space-y-6">
                      <Card className="shadow-none border bg-muted/20">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-md flex items-center">
                            <History className="h-4 w-4 mr-2 text-primary" />
                            Recent Activity
                          </CardTitle>
                          <CardDescription>
                            Latest actions performed by this user
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                              {recentActivities.map((activity, index) => (
                                <div key={activity.id} className="relative pl-6 pb-8 last:pb-0">
                                  {index < recentActivities.length - 1 && (
                                    <div className="absolute left-2.5 top-3 w-[1px] h-full bg-border"></div>
                                  )}
                                  <div className="absolute left-0 top-1 bg-white rounded-full p-1 border">
                                    {activity.icon}
                                  </div>
                                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-medium">{activity.action}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {getTimeAgo(activity.timestamp)}
                                      </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm mt-1">
                                      {activity.details}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-none border bg-muted/20">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-md flex items-center">
                              <Wrench className="h-4 w-4 mr-2 text-primary" />
                              Service Activity
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            {user.role === 'mechanic' ? (
                              <div className="space-y-2">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-muted-foreground">Completed Services</span>
                                  <Badge variant="outline" className="bg-green-100 text-green-800">24 services</Badge>
                                </div>
                                <Progress value={80} className="h-2" />

                                <div className="flex justify-between mb-1 mt-4">
                                  <span className="text-sm text-muted-foreground">Average Completion Time</span>
                                  <Badge variant="outline">2.5 hours</Badge>
                                </div>
                                <Progress value={65} className="h-2" />

                                <div className="flex justify-between mb-1 mt-4">
                                  <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                                  <Badge variant="outline" className="bg-green-100 text-green-800">4.8/5</Badge>
                                </div>
                                <Progress value={95} className="h-2" />
                              </div>
                            ) : user.role === 'service_agent' ? (
                              <div className="space-y-2">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-muted-foreground">Created Orders</span>
                                  <Badge variant="outline" className="bg-green-100 text-green-800">38 orders</Badge>
                                </div>
                                <Progress value={75} className="h-2" />

                                <div className="flex justify-between mb-1 mt-4">
                                  <span className="text-sm text-muted-foreground">Customer Interactions</span>
                                  <Badge variant="outline">56 interactions</Badge>
                                </div>
                                <Progress value={85} className="h-2" />

                                <div className="flex justify-between mb-1 mt-4">
                                  <span className="text-sm text-muted-foreground">Response Time</span>
                                  <Badge variant="outline" className="bg-green-100 text-green-800">15 minutes</Badge>
                                </div>
                                <Progress value={90} className="h-2" />
                              </div>
                            ) : user.role === 'finance_officer' ? (
                              <div className="space-y-2">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-muted-foreground">Processed Invoices</span>
                                  <Badge variant="outline" className="bg-green-100 text-green-800">124 invoices</Badge>
                                </div>
                                <Progress value={88} className="h-2" />

                                <div className="flex justify-between mb-1 mt-4">
                                  <span className="text-sm text-muted-foreground">Payment Processing</span>
                                  <Badge variant="outline">97% on time</Badge>
                                </div>
                                <Progress value={97} className="h-2" />

                                <div className="flex justify-between mb-1 mt-4">
                                  <span className="text-sm text-muted-foreground">Reports Generated</span>
                                  <Badge variant="outline" className="bg-green-100 text-green-800">15 reports</Badge>
                                </div>
                                <Progress value={70} className="h-2" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-24">
                                <p className="text-muted-foreground text-sm">No service metrics available for this role</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="shadow-none border bg-muted/20">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-md flex items-center">
                              <LogOut className="h-4 w-4 mr-2 text-primary" />
                              Login History
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="space-y-3">
                              {[1, 2, 3, 4].map((_, i) => (
                                <div key={i} className="flex justify-between p-2 bg-white rounded-md shadow-sm border">
                                  <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${i === 0 ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
                                    <div className="text-sm">
                                      <p className="font-medium">
                                        {i === 0 ? 'Current Session' : `Login Session ${i}`}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {i === 0 ? 'Chrome on Windows' : `${i === 1 ? 'Safari on iOS' : i === 2 ? 'Chrome on Android' : 'Firefox on Windows'}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right text-xs">
                                    <p>{formatDate(new Date(Date.now() - i * 86400000).toISOString())}</p>
                                    <p className="text-muted-foreground">{formatTime(new Date(Date.now() - i * 86400000).toISOString())}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </CardHeader>

            <Separator />

          </Card>
        </div>
      </div>
    </div>
  );
}