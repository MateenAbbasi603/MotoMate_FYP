"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Wrench,
  Search,
  FilterX,
  Info,
  TagIcon,
  CheckCircle2,
  ShieldCheck,
  CircleDashed,
  ChevronRight,
  AlertCircle,
  Settings,

  BadgeCheck
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
  DialogClose
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "repair": return <Wrench className="h-5 w-5" />;
      case "maintenance": return <Settings className="h-5 w-5" />;
      case "inspection": return <ShieldCheck className="h-5 w-5" />;
      default: return <Wrench className="h-5 w-5" />;
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
        <Card key={`skeleton-${index}`} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-muted-foreground/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-7 w-24 mt-2" />
            </div>
          </CardContent>
          <CardFooter className="border-t p-4 bg-muted/30 flex justify-end gap-2">
            <Skeleton className="h-9 w-28" />
          </CardFooter>
        </Card>
      ));
    }

    if (filteredServices.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 bg-muted/30 rounded-full mb-4">
            <Wrench className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No services found</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : "No services available for the selected filters"}
          </p>
          {(searchQuery || categoryFilter !== "all") && (
            <Button
              variant="outline"
              className="mt-2 group"
              onClick={resetFilters}
            >
              <FilterX className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Reset filters
            </Button>
          )}
        </div>
      );
    }

    return filteredServices.map((service) => (
      <Card
        key={service.serviceId}
        className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-muted-foreground/20"
      >
        <CardHeader className="pb-2 relative">
          <div className="flex justify-between items-start">
            <div className="pr-16"> {/* Add padding to prevent title from going under badge */}
              <CardTitle className="text-lg font-semibold line-clamp-1">{service.serviceName}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                {getCategoryIcon(service.category)}
                <span>{service.category.charAt(0).toUpperCase() + service.category.slice(1)} Service</span>
              </CardDescription>
            </div>
            <Badge
              variant={getCategoryBadgeVariant(service.category)}
              className="capitalize absolute top-4 right-6"
            >
              {service.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/20 p-3 rounded-lg mb-4 min-h-[80px] flex items-center">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {service.description}
            </p>
          </div>
          <div className="flex items-center">
            <TagIcon className="text-primary h-5 w-5 mr-2" />
            <p className="text-xl font-bold">{formatPrice(service.price)}</p>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="p-4 bg-muted/10 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="group transition-all hover:border-primary"
            onClick={() => setSelectedService(service)}
          >
            <Info className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
            View Details
            <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    ));
  };

  // Function to generate benefits based on service category
  const getServiceBenefits = (category: string) => {
    switch (category.toLowerCase()) {
      case "repair":
        return [
          "Restore vehicle performance",
          "Fix critical issues",
          "Prevent further damage",
          "Certified technicians"
        ];
      case "maintenance":
        return [
          "Extend vehicle lifespan",
          "Improve fuel efficiency",
          "Prevent costly repairs",
          "Maintain warranty compliance"
        ];
      case "inspection":
        return [
          "Comprehensive vehicle assessment",
          "Safety verification",
          "Issue identification",
          "Detailed condition report"
        ];
      default:
        return [
          "Professional service",
          "Quality assurance",
          "Expert technicians",
          "Customer satisfaction"
        ];
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">Our Services</h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Browse our complete range of professional automotive services designed to keep your vehicle in optimal condition
          </p>
        </div>

        <Separator className="my-6" />

        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <TabsList className="w-full md:w-auto grid grid-cols-4 md:flex bg-muted/50 p-1 rounded-lg">
              <TabsTrigger
                value="all"
                onClick={() => setCategoryFilter("all")}
                className="font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                All Services
              </TabsTrigger>
              <TabsTrigger
                value="repair"
                onClick={() => setCategoryFilter("repair")}
                className="font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Wrench className="h-4 w-4 mr-1.5 md:inline-block hidden" />
                Repairs
              </TabsTrigger>
              <TabsTrigger
                value="maintenance"
                onClick={() => setCategoryFilter("maintenance")}
                className="font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Settings className="h-4 w-4 mr-1.5 md:inline-block hidden" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger
                value="inspection"
                onClick={() => setCategoryFilter("inspection")}
                className="font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5 md:inline-block hidden" />
                Inspections
              </TabsTrigger>
            </TabsList>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-10 border-muted-foreground/20 focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {Object.entries({ all: "all", repair: "repair", maintenance: "maintenance", inspection: "inspection" }).map(
            ([key, value]) => (
              <TabsContent key={key} value={value} className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderServiceCards()}
                </div>
              </TabsContent>
            )
          )}
        </Tabs>
      </div>

      {/* Service details dialog */}
      {selectedService && (
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  {getCategoryIcon(selectedService.category)}
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedService.serviceName}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    <Badge variant={getCategoryBadgeVariant(selectedService.category)} className="capitalize">
                      {selectedService.category}
                    </Badge>
                    <span>•</span>
                    <span>Service ID: {selectedService.serviceId}</span>
                  </DialogDescription>
                </div>
              </div>
              <Separator className="my-2" />
            </DialogHeader>

            <div className="space-y-6 my-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1.5" />
                  Service Description
                </h4>
                <div className="bg-muted/20 p-4 rounded-lg text-sm">
                  <p>{selectedService.description}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-muted/30 p-4 rounded-lg flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <TagIcon className="h-4 w-4 mr-1.5" />
                    Service Price
                  </h4>
                  <p className="text-2xl font-bold text-primary">{formatPrice(selectedService.price)}</p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <CircleDashed className="h-4 w-4 mr-1.5" />
                    Estimated Duration
                  </h4>
                  <p className="text-lg font-medium">
                    {selectedService.category === "inspection" ? "1-2 hours" :
                      selectedService.category === "maintenance" ? "2-3 hours" : "3-5 hours"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Service Benefits
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getServiceBenefits(selectedService.category).map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 bg-muted/10 p-2 rounded">
                      <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm font-medium">
                    What does this service include?
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-5 list-disc">
                      <li>Comprehensive diagnostics</li>
                      <li>Professional service by certified technicians</li>
                      <li>Industry-standard parts and materials</li>
                      <li>Quality assurance checks</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-sm font-medium">
                    Is there a warranty on this service?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Yes, all our services come with a 30-day satisfaction guarantee. Parts replaced during
                      the service may have separate manufacturer warranties.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-400 text-sm">Important Note</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Service times may vary based on your specific vehicle model and condition. Additional repairs may be recommended after initial inspection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between gap-2 mt-4 pt-4 border-t">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto border-muted-foreground/20"
                      >
                        Close Details
                      </Button>
                    </DialogClose>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close service details window</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setSelectedService(null);
                        toast.info("Please contact our service desk to schedule this service!", {
                          description: "Call us at: +92-336-1800485"
                        });
                      }}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Service Information
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get contact information for this service</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}