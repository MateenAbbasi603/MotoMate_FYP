"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Settings, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthGuard from "../../../../../AuthGuard";
import LogoutButton from "@/components/User/LogoutBtn";

export default function ServicesPage() {
  const router = useRouter();
  
  return (
    <AuthGuard allowedRoles={["super_admin", "admin", "service_agent"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            <p className="text-muted-foreground">
              Manage available services, pricing, and categories.
            </p>
          </div>
          <LogoutButton/>
          <Button>
            Add New Service
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Services</TabsTrigger>
            <TabsTrigger value="repair">Repair</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="inspection">Inspection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Services</CardTitle>
                <CardDescription>
                  Complete list of services offered by your service center.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Sample service cards would go here */}
                  {[
                    { name: "Oil Change", category: "maintenance", price: 49.99 },
                    { name: "Brake Inspection", category: "inspection", price: 29.99 },
                    { name: "Tire Rotation", category: "maintenance", price: 19.99 },
                    { name: "Brake Pad Replacement", category: "repair", price: 149.99 },
                    { name: "Engine Diagnostics", category: "inspection", price: 89.99 },
                    { name: "AC Service", category: "repair", price: 99.99 },
                  ].map((service, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{service.category}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-2xl font-semibold">${service.price}</div>
                        </div>
                      </div>
                      <div className="border-t p-4 bg-muted/50 flex justify-end gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-500">Delete</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other tab contents would be similar */}
          <TabsContent value="repair">
            {/* Repair services content */}
            <Card>
              <CardHeader>
                <CardTitle>Repair Services</CardTitle>
                <CardDescription>
                  All repair services offered at your service center.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Content similar to "all" tab but filtered for repair */}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="maintenance">
            {/* Maintenance services content */}
          </TabsContent>
          
          <TabsContent value="inspection">
            {/* Inspection services content */}
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}