"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, UserCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../../../../AuthGuard";

export default function MechanicsPage() {
  const router = useRouter();
  
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((id) => (
                    <Card key={id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">Mike Mechanic {id}</h3>
                            <p className="text-sm text-muted-foreground">Engine Specialist</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="font-medium text-green-600">Available</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Rating:</span>
                            <span className="font-medium">4.8/5.0</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Completed Jobs:</span>
                            <span className="font-medium">{id * 24}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t p-4 bg-muted/50 flex justify-end">
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </Card>
                  ))}
                </div>
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
                <div className="h-[300px] flex items-center justify-center border rounded-md">
                  <div className="text-center">
                    <UserCheck className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2">Performance metrics would be displayed here</p>
                  </div>
                </div>
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
                <div className="h-[300px] flex items-center justify-center border rounded-md">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2">Scheduled services would be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}