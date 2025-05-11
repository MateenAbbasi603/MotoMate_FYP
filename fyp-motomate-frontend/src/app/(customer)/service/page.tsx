"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Wrench, 
  Search,
  FilterX,
  Calendar,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import serviceApi, { Service } from "../../../../services/serviceApi";


export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Update filtered services when filters change
  useEffect(() => {
    filterServices();
  }, [services, searchQuery, categoryFilter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await serviceApi.getAllServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(service => 
        service.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.serviceName.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredServices(filtered);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  // Function to get badge color based on category
  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case "repair": return "destructive";
      case "maintenance": return "default";
      case "inspection": return "secondary";
      default: return "outline";
    }
  };

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
    }).format(price);
  };

  const renderServiceCards = () => {
    if (loading) {
      return Array(6).fill(0).map((_, index) => (
        <Card key={`skeleton-${index}`} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full mb-2" />
            <Skeleton className="h-7 w-1/3" />
          </CardContent>
          <CardFooter className="border-t p-4 bg-muted/50 flex justify-end gap-2">
            <Skeleton className="h-9 w-16" />
          </CardFooter>
        </Card>
      ));
    }

    if (filteredServices.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No services found</h3>
          {(searchQuery || categoryFilter !== "all") && (
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={resetFilters}
            >
              <FilterX className="h-4 w-4 mr-2" />
              Reset filters
            </Button>
          )}
        </div>
      );
    }

    return filteredServices.map((service) => (
      <Card key={service.serviceId} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{service.serviceName}</CardTitle>
            <Badge variant={getCategoryBadgeVariant(service.category)} className="capitalize">
              {service.category}
            </Badge>
          </div>
          <CardDescription>
            {service.category.charAt(0).toUpperCase() + service.category.slice(1)} Service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {service.description}
          </p>
          <p className="text-xl font-bold">{formatPrice(service.price)}</p>
        </CardContent>
        <CardFooter className="border-t p-4 bg-muted/50 flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedService(service)}
          >
            <Info className="h-4 w-4 mr-1" />
            Details
          </Button>
          <Button 
            variant="default" 
            size="sm"
            // This would link to booking page in a real implementation
            onClick={() => toast.info("Booking functionality coming soon!")}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Book Now
          </Button>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Our Services</h1>
          <p className="text-muted-foreground mt-2">
            Browse our complete range of automotive services
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="all" onClick={() => setCategoryFilter("all")}>All Services</TabsTrigger>
            <TabsTrigger value="repair" onClick={() => setCategoryFilter("repair")}>Repairs</TabsTrigger>
            <TabsTrigger value="maintenance" onClick={() => setCategoryFilter("maintenance")}>Maintenance</TabsTrigger>
            <TabsTrigger value="inspection" onClick={() => setCategoryFilter("inspection")}>Inspections</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderServiceCards()}
            </div>
          </TabsContent>
          
          <TabsContent value="repair" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderServiceCards()}
            </div>
          </TabsContent>
          
          <TabsContent value="maintenance" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderServiceCards()}
            </div>
          </TabsContent>
          
          <TabsContent value="inspection" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderServiceCards()}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Service details dialog */}
      {selectedService && (
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedService.serviceName}</span>
                <Badge variant={getCategoryBadgeVariant(selectedService.category)} className="capitalize">
                  {selectedService.category}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Service details and booking information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{selectedService.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Price</h4>
                <p className="text-xl font-bold">{formatPrice(selectedService.price)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Service ID</h4>
                <p className="text-sm">{selectedService.serviceId}</p>
              </div>
            </div>
            <DialogFooter className="flex space-x-2 sm:space-x-0">
              <Button variant="outline" onClick={() => setSelectedService(null)}>Close</Button>
              <Button onClick={() => toast.info("Booking functionality coming soon!")}>
                <Calendar className="h-4 w-4 mr-2" />
                Book This Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}