'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, 
  UserCheck, 
  Users, 
  AlertCircle, 
  Mail, 
  Phone, 
  Star, 
  CheckCircle, 
  Calendar, 
  Activity,
  Briefcase,
  LineChart
} from "lucide-react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../../../../AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Mechanic {
  userId: number;
  name: string;
  email: string;
  phone: string;
  performance?: {
    totalJobs: number;
    completedJobs: number;
    rating: number;
  };
}

export default function MechanicsPage() {
  const router = useRouter();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("Authentication required");
        }
        
        // Fetch mechanics from API
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Users/mechanics`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log(response.data, "RESPONSE");
        
        // Handle potential nested data structure
        let mechanicsData = [];
        if (response.data && response.data.$values) {
          mechanicsData = response.data.$values;
        } else if (Array.isArray(response.data)) {
          mechanicsData = response.data;
        } else {
          console.error("Unexpected data format:", response.data);
          mechanicsData = [];
        }
        
        setMechanics(mechanicsData);
      } catch (err) {
        console.error("Failed to fetch mechanics:", err);
        setError("Failed to load mechanics data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMechanics();
  }, []);

  const getAvailabilityStatus = (mechanic: Mechanic) => {
    // Simulate availability based on total jobs
    // In a real app, you'd use actual availability data
    const totalJobs = mechanic.performance?.totalJobs || 0;
    if (totalJobs > 10) return { status: "Busy", variant: "destructive" as const };
    if (totalJobs > 5) return { status: "Moderate", variant: "warning" as const };
    return { status: "Available", variant: "success" as const };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const totalStars = 5;
    
    return (
      <div className="flex items-center gap-1">
        <span className="font-medium text-sm mr-1">{rating.toFixed(1)}</span>
        {Array(fullStars).fill(0).map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {Array(totalStars - fullStars - (hasHalfStar ? 1 : 0)).fill(0).map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "mechanic"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mechanics</h1>
            <p className="text-muted-foreground mt-1">
              Manage mechanics, their expertise, and performance metrics.
            </p>
          </div>
          <Button onClick={() => router.push("/admin/users/create")} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Add Mechanic</span>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span>Active Mechanics</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Scheduled Services</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <CardTitle>Active Mechanics</CardTitle>
                </div>
                <CardDescription>
                  Currently active mechanics in your service center with their contact details and status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((id) => (
                      <Card key={id} className="overflow-hidden animate-pulse">
                        <div className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                            <div>
                              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                              <div className="h-3 w-16 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            <div className="h-3 w-full bg-gray-200 rounded"></div>
                            <div className="h-3 w-full bg-gray-200 rounded"></div>
                            <div className="h-3 w-full bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : mechanics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mechanics.map((mechanic) => {
                      const availability = getAvailabilityStatus(mechanic);
                      return (
                        <Card key={mechanic.userId} className="overflow-hidden border-l-4 hover:shadow-md transition-shadow duration-200" style={{ borderLeftColor: 
                          availability.variant === 'success' ? '#10b981' : 
                          availability.variant === 'warning' ? '#f59e0b' : 
                          '#ef4444'
                        }}>
                          <div className="p-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-14 w-14 bg-primary/10 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {getInitials(mechanic.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium text-lg">{mechanic.name}</h3>
                                <Badge variant={availability.variant === 'success' ? 'outline' : 'secondary'} className={`
                                  ${availability.variant === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    availability.variant === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                    'bg-red-50 text-red-700 border-red-200'}
                                `}>
                                  {availability.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm overflow-hidden text-ellipsis">{mechanic.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{mechanic.phone || 'Not provided'}</span>
                              </div>
                              
                              {mechanic.performance && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-400" />
                                    <div className="flex-1">
                                      {renderStarRating(mechanic.performance.rating)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <div className="flex-1">
                                      <div className="flex justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">Completed Jobs</span>
                                        <span className="text-xs font-medium">{mechanic.performance.completedJobs}/{mechanic.performance.totalJobs}</span>
                                      </div>
                                      <Progress 
                                        value={(mechanic.performance.completedJobs / Math.max(1, mechanic.performance.totalJobs)) * 100} 
                                        className="h-2"
                                      />
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <CardFooter className="bg-muted/20 px-6 py-3 flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="transition-all hover:bg-primary hover:text-primary-foreground"
                              onClick={() => router.push(`/admin/users/${mechanic.userId}`)}
                            >
                              View Profile
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No mechanics found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      There are no mechanics registered in the system yet. Add a mechanic to get started.
                    </p>
                    <Button 
                      onClick={() => router.push("/admin/users/create")}
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      <span>Add New Mechanic</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle>Mechanic Performance</CardTitle>
                </div>
                <CardDescription>
                  Track and analyze mechanic performance metrics including completion rates and customer satisfaction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((id) => (
                      <div key={id} className="p-4 border rounded-md animate-pulse">
                        <div className="flex justify-between items-center mb-4">
                          <div className="h-5 w-32 bg-gray-200 rounded"></div>
                          <div className="h-5 w-16 bg-gray-200 rounded"></div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : mechanics.length > 0 ? (
                  <div className="space-y-4">
                    {mechanics.map((mechanic) => (
                      <Card key={mechanic.userId} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(mechanic.name)}
                                </AvatarFallback>
                              </Avatar>
                              <h3 className="font-medium">{mechanic.name}</h3>
                            </div>
                            {mechanic.performance && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                Rating: {mechanic.performance.rating.toFixed(1)}/5.0
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-muted/30 rounded-md">
                              <div className="flex items-center gap-2 mb-1">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Total Jobs</span>
                              </div>
                              <p className="text-2xl font-bold">{mechanic.performance?.totalJobs || 0}</p>
                            </div>
                            
                            <div className="p-3 bg-muted/30 rounded-md">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Completed</span>
                              </div>
                              <p className="text-2xl font-bold">{mechanic.performance?.completedJobs || 0}</p>
                            </div>
                            
                            <div className="p-3 bg-muted/30 rounded-md">
                              <div className="flex items-center gap-2 mb-1">
                                <LineChart className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">Completion Rate</span>
                              </div>
                              <p className="text-2xl font-bold">
                                {mechanic.performance 
                                  ? `${Math.round((mechanic.performance.completedJobs / Math.max(1, mechanic.performance.totalJobs)) * 100)}%` 
                                  : '0%'
                                }
                              </p>
                            </div>
                          </div>
                          
                          {mechanic.performance && (
                            <div className="mt-4">
                              <div className="mb-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Completion Progress</span>
                                  <span className="text-sm font-medium">
                                    {mechanic.performance.completedJobs}/{mechanic.performance.totalJobs}
                                  </span>
                                </div>
                                <Progress 
                                  value={(mechanic.performance.completedJobs / Math.max(1, mechanic.performance.totalJobs)) * 100} 
                                  className="h-2 mt-1"
                                />
                              </div>
                              
                              <div className="mt-3">
                                <div className="mb-1 text-sm text-muted-foreground">Customer Satisfaction</div>
                                {renderStarRating(mechanic.performance.rating)}
                              </div>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="bg-muted/20 pt-2 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/admin/users/${mechanic.userId}`)}
                            className="gap-1 text-xs"
                          >
                            <LineChart className="h-3 w-3" />
                            <span>Detailed Analytics</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border rounded-lg bg-muted/10">
                    <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No performance data available</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Once mechanics complete their assignments, performance metrics will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled">
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Scheduled Services</CardTitle>
                </div>
                <CardDescription>
                  View all upcoming and ongoing service appointments assigned to mechanics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No scheduled services found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    There are no active or upcoming service appointments scheduled with mechanics.
                  </p>
                  <Button 
                    onClick={() => router.push("/admin/appointments/create")}
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Schedule New Appointment</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}