'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  ArrowLeft, 
  Edit, 
  Trash, 
  Loader2
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
import { format } from 'date-fns';
import { toast } from 'sonner';

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
}

interface Props {
  params: {
    id: string;
  };
}

export default function UserDetailsPage({ params }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'service_agent': return 'bg-green-100 text-green-800';
      case 'mechanic': return 'bg-yellow-100 text-yellow-800';
      case 'finance_officer': return 'bg-purple-100 text-purple-800';
      case 'customer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
          `${API_URL}/api/Users/${params.id}`,
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
  }, [params.id, router]);

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
        `${API_URL}/api/Users/${params.id}`,
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
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'User not found'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>

        {user.role !== "customer" && user.role !== "super_admin" ? <> 
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
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
                  ) : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div></>:<></>}
       
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription>
                    ID: {user.userId} • Username: {user.username}
                  </CardDescription>
                </div>
                <Badge className={`capitalize ${userRoleBadgeColor(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email Address</p>
                          <p>{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone Number</p>
                          <p>{user.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p>{user.address || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Created At</p>
                          <p>{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="permissions">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="bg-muted/40">
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-md flex items-center">
                            <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                            Role Permissions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <p className="text-sm">
                            As a <strong className="capitalize">{user.role.replace('_', ' ')}</strong>, this user has the following permissions:
                          </p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {user.role === 'super_admin' || user.role === 'admin' ? (
                              <>
                                <li>• Full access to all system modules</li>
                                <li>• Manage users and their permissions</li>
                                <li>• Access to all financial records</li>
                                <li>• Manage system settings</li>
                                <li>• View and edit all orders</li>
                              </>
                            ) : user.role === 'service_agent' ? (
                              <>
                                <li>• View and manage customer information</li>
                                <li>• Create and update service orders</li>
                                <li>• Assign mechanics to jobs</li>
                                <li>• Send service updates to customers</li>
                                <li>• Limited access to financial records</li>
                              </>
                            ) : user.role === 'mechanic' ? (
                              <>
                                <li>• View assigned service orders</li>
                                <li>• Update service status</li>
                                <li>• Submit service completion reports</li>
                                <li>• Access to maintenance history</li>
                                <li>• No access to financial records</li>
                              </>
                            ) : user.role === 'finance_officer' ? (
                              <>
                                <li>• Full access to financial records</li>
                                <li>• Manage invoices and payments</li>
                                <li>• Generate financial reports</li>
                                <li>• Track receivables and payables</li>
                                <li>• Limited access to customer data</li>
                              </>
                            ) : user.role === 'customer' ? (
                              <>
                                <li>• View own profile and vehicle information</li>
                                <li>• Schedule service appointments</li>
                                <li>• Track service status</li>
                                <li>• View service history</li>
                                <li>• Make payments</li>
                              </>
                            ) : (
                              <li>• Custom permissions</li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.imgUrl} />
                  <AvatarFallback className="text-2xl">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription className="capitalize">{user.role.replace('_', ' ')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm mb-1">Account Information</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-muted-foreground">User ID:</div>
                    <div>{user.userId}</div>
                    <div className="text-muted-foreground">Username:</div>
                    <div>{user.username}</div>
                    <div className="text-muted-foreground">Status:</div>
                    <div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
           
          </Card>
        </div>
      </div>
    </div>
  );
}