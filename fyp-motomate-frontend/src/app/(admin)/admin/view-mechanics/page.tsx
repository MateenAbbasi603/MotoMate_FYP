'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, UserCheck, Users, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../../../../AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import { toast } from "sonner";

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
        
        console.log(response.data,"RESPONSE");
        
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

  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "mechanic"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mechanics</h1>
            <p className="text-muted-foreground">
              Manage mechanics, their expertise, and performance.
            </p>
          </div>
          <Button onClick={() => router.push("/admin/users/create")}>
            Add Mechanic
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Mechanics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Services</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Mechanics</CardTitle>
                <CardDescription>
                  Currently active mechanics in your service center.
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
                    {mechanics.map((mechanic) => (
                      <Card key={mechanic.userId} className="overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Wrench className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{mechanic.name}</h3>
                              <p className="text-sm text-muted-foreground">Mechanic</p>
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Email:</span>
                              <span className="font-medium">{mechanic.email}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="font-medium">{mechanic.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                Available
                              </Badge>
                            </div>
                            {mechanic.performance && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Rating:</span>
                                  <span className="font-medium">{mechanic.performance.rating}/5.0</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Completed Jobs:</span>
                                  <span className="font-medium">{mechanic.performance.completedJobs}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="border-t p-4 bg-muted/50 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/admin/users/${mechanic.userId}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No mechanics found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                      There are no mechanics registered in the system yet.
                    </p>
                    <Button onClick={() => router.push("/admin/users/create")}>
                      Add New Mechanic
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Mechanic Performance</CardTitle>
                <CardDescription>
                  Track and analyze mechanic performance metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] animate-pulse bg-gray-200 rounded-md" />
                ) : mechanics.length > 0 ? (
                  <div className="space-y-4">
                    {mechanics.map((mechanic) => (
                      <div key={mechanic.userId} className="p-4 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{mechanic.name}</h3>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {mechanic.performance ? `${mechanic.performance.rating}/5.0` : 'No Rating'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Jobs</p>
                            <p className="font-medium">{mechanic.performance?.totalJobs || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Completed Jobs</p>
                            <p className="font-medium">{mechanic.performance?.completedJobs || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <UserCheck className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                    <p className="mt-2">No performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Services</CardTitle>
                <CardDescription>
                  View all scheduled services by mechanic.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                  <p className="mt-2">Scheduled services would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}