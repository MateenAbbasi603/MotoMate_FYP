"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Plus,
  Pencil,
  Trash,
  Search,
  FilterX,
  Loader2,
  Tag,
  AlertCircle,
  DollarSign,
  LayoutGrid,
  List,
  Settings,
  RefreshCcw,
  Info
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import serviceApi, { Service } from "../../../services/serviceApi";

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<string>("grid");

  const router = useRouter();

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
      console.log(data);

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

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      setIsDeleting(true);
      await serviceApi.deleteService(serviceToDelete.serviceId);

      // Update local state to remove the deleted service
      setServices(services.filter(s => s.serviceId !== serviceToDelete.serviceId));
      toast.success("Service deleted successfully");
    } catch (error: any) {
      console.error("Error deleting service:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete service";
      toast.error(errorMessage);
    } finally {
      setServiceToDelete(null);
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  // Function to get badge color based on category
  const getCategoryDetails = (category: string) => {
    switch (category.toLowerCase()) {
      case "repair": 
        return { 
          variant: "destructive" as const, 
          icon: <Wrench className="h-3.5 w-3.5 mr-1" /> 
        };
      case "maintenance": 
        return { 
          variant: "default" as const, 
          icon: <Settings className="h-3.5 w-3.5 mr-1" /> 
        };
      case "inspection": 
        return { 
          variant: "secondary" as const, 
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1" /> 
        };
      default: 
        return { 
          variant: "outline" as const, 
          icon: <Tag className="h-3.5 w-3.5 mr-1" /> 
        };
    }
  };

  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Card key={`skeleton-${index}`} className="overflow-hidden border border-border/50">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-7 w-20 mt-4" />
        </CardContent>
        <CardFooter className="border-t p-4 bg-muted/30 flex justify-end gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </CardFooter>
      </Card>
    ));
  };

  const renderEmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg">
      <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">No services found</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        {searchQuery || categoryFilter !== "all" 
          ? "No services match your current filters." 
          : "There are no services defined in the system yet."
        }
      </p>
      {(searchQuery || categoryFilter !== "all") ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 gap-2"
          onClick={resetFilters}
        >
          <RefreshCcw className="h-4 w-4" />
          Reset filters
        </Button>
      ) : (
        <Button
          onClick={() => router.push("/admin/services/new")}
          className="mt-2 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Your First Service
        </Button>
      )}
    </div>
  );

  const renderGridView = () => {
    if (loading) {
      return renderSkeletons();
    }

    if (filteredServices.length === 0) {
      return renderEmptyState();
    }

    return filteredServices.map((service) => {
      const categoryDetails = getCategoryDetails(service.category);
      
      return (
        <Card 
          key={service.serviceId} 
          className="overflow-hidden border border-border/50 transition-all duration-200 hover:shadow-md hover:border-border group"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl font-bold leading-tight">{service.serviceName}</CardTitle>
              <Badge variant={categoryDetails.variant} className="capitalize flex items-center">
                {categoryDetails.icon}
                {service.category}
              </Badge>
            </div>
            <CardDescription className="flex items-center flex-wrap gap-1 mt-1">
              <span className="text-xs px-2 py-0.5 rounded bg-muted">ID: {service.serviceId}</span>
              
              {service.subCategory && (
                <Badge variant="outline" className="text-xs bg-background">
                  {service.subCategory}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 h-[4.5rem]">
              {service.description || "No description provided"}
            </p>
            
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-primary mr-1" />
              <span className="text-lg font-bold text-primary">
                PKR {service.price.toLocaleString()}
              </span>
            </div>
          </CardContent>
          
          <CardFooter className="border-t bg-muted/30 p-4 flex justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => router.push(`/admin/services/edit/${service.serviceId}`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit service details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <AlertDialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="transition-all duration-200"
                        onClick={() => setServiceToDelete(service)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove this service</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      This will permanently delete the service <span className="font-semibold">"{service.serviceName}"</span> and 
                      remove it from all systems.
                    </p>
                    <p className="text-muted-foreground">
                      This action cannot be undone and may affect existing appointments or orders.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteService}
                    disabled={isDeleting}
                    className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isDeleting ? "Deleting..." : "Delete Service"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      );
    });
  };

  const renderListView = () => {
    if (loading) {
      return (
        <div className="col-span-full space-y-4">
          {Array(6).fill(0).map((_, index) => (
            <Card key={`list-skeleton-${index}`} className="overflow-hidden border border-border/50">
              <div className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 items-start md:items-center justify-between mb-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto mt-2 md:mt-0">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredServices.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="col-span-full space-y-3">
        {filteredServices.map((service) => {
          const categoryDetails = getCategoryDetails(service.category);
          
          return (
            <Card 
              key={service.serviceId} 
              className="overflow-hidden border border-border/50 transition-all duration-200 hover:shadow-md hover:border-border"
            >
              <div className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{service.serviceName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={categoryDetails.variant} className="capitalize flex items-center">
                          {categoryDetails.icon}
                          {service.category}
                        </Badge>
                        
                        {service.subCategory && (
                          <Badge variant="outline" className="text-xs bg-background">
                            {service.subCategory}
                          </Badge>
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                          ID: {service.serviceId}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-primary mr-1" />
                      <span className="text-lg font-bold text-primary">
                        PKR {service.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description || "No description provided"}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={() => router.push(`/admin/services/edit/${service.serviceId}`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="transition-all duration-200"
                        onClick={() => setServiceToDelete(service)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            This will permanently delete the service <span className="font-semibold">"{service.serviceName}"</span> and 
                            remove it from all systems.
                          </p>
                          <p className="text-muted-foreground">
                            This action cannot be undone and may affect existing appointments or orders.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteService}
                          disabled={isDeleting}
                          className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isDeleting ? "Deleting..." : "Delete Service"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workshop's service offerings, pricing, and categories.
          </p>
        </div>
        <Button 
          onClick={() => router.push("/admin/services/new")}
          className="group transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          Add New Service
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
            </SelectContent>
          </Select>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value)}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "w-full"}>
        {viewMode === "grid" ? renderGridView() : renderListView()}
      </div>

      {!loading && filteredServices.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span>
              Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
              {categoryFilter !== "all" && ` in ${categoryFilter} category`}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
          </div>
          
          {(categoryFilter !== "all" || searchQuery) && (
            <Button variant="link" onClick={resetFilters} className="h-auto p-0">
              <RefreshCcw className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}