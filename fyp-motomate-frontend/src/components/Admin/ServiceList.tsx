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
  Loader2
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

import serviceApi, { Service } from "../../../services/serviceApi";

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case "repair": return "destructive";
      case "maintenance": return "default";
      case "inspection": return "secondary";
      default: return "outline";
    }
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
            Service ID: {service.serviceId}
            {service.subCategory && (
              <span className="ml-2 text-sm">
                | Subcategory: <Badge variant="outline">{service.subCategory}</Badge>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {service.description}
          </p>
          <p className="text-xl font-bold">PKR {(service.price)}</p>
        </CardContent>
        <CardFooter className="border-t p-4 bg-muted/50 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
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
                onClick={() => setServiceToDelete(service)}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the service &quot;{service.serviceName}&quot;.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteService}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage services, pricing, and categories.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/services/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Service
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderServiceCards()}
      </div>
    </div>
  );
}