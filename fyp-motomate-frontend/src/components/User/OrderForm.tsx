// Updated OrderForm.tsx with accordion for main categories and subcategory cards

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import {
  Calendar,
  Car,
  ClipboardCheck,
  Wrench,
  ArrowLeft,
  Loader2,
  Clock,
  PlusCircle,
  MinusCircle,
  Info,
  Plus,
  Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import timeSlotService, { TimeSlotInfo } from "../../../services/timeSlotService";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define interfaces for data types
interface Vehicle {
  vehicleId: number;
  userId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  appointments?: any;
  orders?: any;
  serviceHistories?: any;
  user?: any;
}

interface InspectionType {
  serviceId: number;
  serviceName: string;
  category: string;
  price: number;
  description: string;
  subCategory?: string;
}

interface Service {
  serviceId: number;
  serviceName: string;
  category: string;
  price: number;
  description: string;
  subCategory?: string;
}

interface SelectedSubcategory {
  serviceId: number;
  serviceName: string;
  price: number;
  description?: string;
}

// Form schema for order with multiple inspection types and subcategories
const orderFormSchema = z.object({
  vehicleId: z.string().min(1, {
    message: "Please select a vehicle",
  }),
  inspectionDate: z.date({
    required_error: "Inspection date is required",
  }),
  timeSlot: z.string().min(1, {
    message: "Please select a time slot",
  }),
  includeService: z.boolean().default(false),
  serviceId: z.string().optional(),
  additionalServiceIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
  // We'll handle inspections outside the form schema due to their dynamic nature
});

type FormValues = z.infer<typeof orderFormSchema>;

export default function OrderForm() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mainCategories, setMainCategories] = useState<string[]>([]);
  const [subcategoriesByMainCategory, setSubcategoriesByMainCategory] = useState<{[key: string]: Service[]}>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAdditionalServices, setSelectedAdditionalServices] = useState<Service[]>([]);
  const [timeSlotInfos, setTimeSlotInfos] = useState<TimeSlotInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allServices, setAllServices] = useState<Service[]>([]);
  
  // New state for managing selected subcategories
  const [selectedSubcategories, setSelectedSubcategories] = useState<SelectedSubcategory[]>([]);
  
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Set default date to today
  const today = new Date();

  const form = useForm<FormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      includeService: false,
      additionalServiceIds: [],
      notes: "",
      inspectionDate: today,
    },
  });

  // Watch relevant fields
  const includeService = form.watch("includeService");
  const serviceId = form.watch("serviceId");
  const additionalServiceIds = form.watch("additionalServiceIds");
  const inspectionDate = form.watch("inspectionDate");

  // Helper to get auth token from local storage
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch vehicles, services and inspection types when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch user's vehicles
        const vehiclesResponse = await axios.get(`${API_URL}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Handle the nested data structure with $values array
        let vehiclesData = [];
        if (vehiclesResponse.data && vehiclesResponse.data.$values) {
          vehiclesData = vehiclesResponse.data.$values;
        } else if (Array.isArray(vehiclesResponse.data)) {
          vehiclesData = vehiclesResponse.data;
        } else {
          console.error("Invalid vehicles data format:", vehiclesResponse.data);
          toast.error("Failed to load vehicles data");
        }

        setVehicles(vehiclesData);

        // Fetch available services
        const servicesResponse = await axios.get(`${API_URL}/api/services`);

        // Handle potential nested data structure for services too
        let servicesData = [];
        if (servicesResponse.data && servicesResponse.data.$values) {
          servicesData = servicesResponse.data.$values;
        } else if (Array.isArray(servicesResponse.data)) {
          servicesData = servicesResponse.data;
        }

        // Store all services for reference
        setAllServices(servicesData);

        // Filter services by category
        const filteredServices = servicesData.filter(
          (service: Service) => service.category.toLowerCase() !== 'inspection'
        );

        // Get inspection types from services API (where category = inspection)
        const inspectionServices = servicesData.filter(
          (service: Service) => service.category.toLowerCase() === 'inspection'
        );

        // Extract all unique subcategories
        const mainCats:any = [...new Set(inspectionServices.map(
          (service: Service) => service.subCategory || 'General'
        ))];

        // Group subcategories by main category
        const subcategoryMap: {[key: string]: Service[]} = {};
        
        mainCats.forEach(mainCat => {
          // Find all services with this subcategory
          subcategoryMap[mainCat] = inspectionServices.filter(
            service => service.subCategory === mainCat
          );
        });

        setServices(filteredServices);
        setMainCategories(mainCats);
        setSubcategoriesByMainCategory(subcategoryMap);

        // Load initial time slots for today
        fetchAvailableTimeSlotsForDate(today);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load necessary data");

        // If unauthorized, redirect to login
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, API_URL]);

  // Update selected service when serviceId changes
  useEffect(() => {
    if (serviceId) {
      const service = services.find(s => s.serviceId.toString() === serviceId);
      setSelectedService(service || null);
    } else {
      setSelectedService(null);
    }
  }, [serviceId, services]);

  // Update selected additional services when additionalServiceIds changes
  useEffect(() => {
    if (additionalServiceIds && additionalServiceIds.length > 0) {
      const selectedServices = additionalServiceIds.map(id =>
        services.find(s => s.serviceId.toString() === id)
      ).filter(Boolean) as Service[];
      setSelectedAdditionalServices(selectedServices);
    } else {
      setSelectedAdditionalServices([]);
    }
  }, [additionalServiceIds, services]);

  // Function to fetch available time slots for a specific date
  const fetchAvailableTimeSlotsForDate = async (date: Date) => {
    if (!date) return;

    try {
      // Instead of just getting available slots, get full info including counts
      const slots = await timeSlotService.getTimeSlotsInfo(date);
      console.log("Fetched time slots for date:", date, slots);
      setTimeSlotInfos(slots);

      // If current selected time slot is no longer available, clear it
      const currentTimeSlot = form.getValues("timeSlot");
      const isCurrentSlotAvailable = slots.some(
        slot => slot.timeSlot === currentTimeSlot && slot.availableSlots > 0
      );

      if (currentTimeSlot && !isCurrentSlotAvailable) {
        form.setValue("timeSlot", "");
      }
    } catch (error) {
      console.error("Error fetching time slot info for date:", date, error);
      toast.error("Could not load available time slots");
    }
  };

  // Fetch available time slots when inspection date changes
  useEffect(() => {
    if (inspectionDate) {
      setSelectedDate(inspectionDate);
      fetchAvailableTimeSlotsForDate(inspectionDate);
    }
  }, [inspectionDate]);

  // Toggle selection of a subcategory
  const toggleSubcategorySelection = (subcategory: Service) => {
    const isSelected = selectedSubcategories.some(
      item => item.serviceId === subcategory.serviceId
    );

    if (isSelected) {
      // Remove from selection
      setSelectedSubcategories(
        selectedSubcategories.filter(item => item.serviceId !== subcategory.serviceId)
      );
    } else {
      // Add to selection
      setSelectedSubcategories([
        ...selectedSubcategories,
        {
          serviceId: subcategory.serviceId,
          serviceName: subcategory.serviceName,
          price: subcategory.price,
          description: subcategory.description
        }
      ]);
    }
  };

// Updated onSubmit function

const onSubmit = async (values: FormValues) => {
  console.log("Form values:", values);
  
  try {
    // Validate that at least one subcategory is selected
    if (selectedSubcategories.length === 0) {
      toast.error("Please select at least one inspection subcategory");
      return;
    }
    
    setSubmitting(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    // Check if the time slot is still available
    const isSlotAvailable = await timeSlotService.isTimeSlotAvailable(
      values.inspectionDate,
      values.timeSlot
    );

    if (!isSlotAvailable) {
      setError("The selected time slot is no longer available. Please choose another time.");
      toast.error("Time slot is no longer available");
      // Refresh available time slots
      fetchAvailableTimeSlotsForDate(values.inspectionDate);
      form.setValue("timeSlot", "");
      return;
    }

    // Prepare data for API request - use noon time to avoid timezone issues
    const inspectionDateWithNoon = new Date(
      values.inspectionDate.getFullYear(),
      values.inspectionDate.getMonth(),
      values.inspectionDate.getDate(),
      12, 0, 0
    );

    // Get primary inspection (the first selected subcategory)
    const primaryInspection = selectedSubcategories[0];
    
    // Convert additionalServiceIds from strings to numbers
    const additionalServiceIdsAsNumbers = values.additionalServiceIds.map(id => parseInt(id));
    
    // Get all subcategory IDs except the primary one
    const additionalSubcategoryIds = selectedSubcategories
      .slice(1)
      .map(subcategory => subcategory.serviceId);
    
    console.log("Primary inspection:", primaryInspection);
    console.log("Additional services:", additionalServiceIdsAsNumbers);
    console.log("Additional subcategories:", additionalSubcategoryIds);

    // Prepare the final request object
    const orderData = {
      vehicleId: parseInt(values.vehicleId),
      inspectionTypeId: primaryInspection.serviceId,
      subCategory: primaryInspection.serviceName,
      serviceId: values.includeService && values.serviceId ? parseInt(values.serviceId) : null,
      additionalServiceIds: [...additionalServiceIdsAsNumbers, ...additionalSubcategoryIds],
      inspectionDate: inspectionDateWithNoon.toISOString(),
      timeSlot: values.timeSlot,
      notes: values.notes || "",
    };

    console.log("Creating order with data:", orderData);

    try {
      // Call API to create order with inspection
      const response = await axios.post(
        `${API_URL}/api/orders/CreateWithInspection`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        toast.success("Your order has been placed successfully!");
        router.push("/dashboard");
      } else {
        setError(response.data.message || "Failed to create order");
        toast.error(response.data.message || "Failed to create order");
      }
    } catch (apiError: any) {
      console.error("API error details:", apiError);

      if (axios.isAxiosError(apiError)) {
        if (apiError.response) {
          console.error("API error response:", apiError.response.data);

          // Handle specific backend errors
          if (apiError.response.data.error && apiError.response.data.error.includes("entity changes")) {
            setError("There was a problem with the data format. Please check all fields and try again.");
          } else {
            setError(apiError.response.data.message || "Server error occurred");
          }
        } else if (apiError.request) {
          console.error("No response received:", apiError.request);
          setError("No response from server. Please check your connection and try again.");
        } else {
          console.error("Request setup error:", apiError.message);
          setError(`Error setting up the request: ${apiError.message}`);
        }

        toast.error("Failed to create order. See details for more information.");
      } else {
        setError("An unexpected error occurred");
        toast.error("Failed to create order");
      }
    }
  } catch (error) {
    console.error("Form submission error:", error);
    setError("Failed to process your order. Please try again.");
    toast.error("Failed to create order");
  } finally {
    setSubmitting(false);
  }
};
  // Add a service to the additional services list
  const addAdditionalService = (serviceId: string) => {
    const currentIds = form.getValues("additionalServiceIds");

    // Check if service is already in the list
    if (currentIds.includes(serviceId)) {
      toast.error("This service is already added");
      return;
    }

    // Check if it's the same as the main service
    if (form.getValues("serviceId") === serviceId) {
      toast.error("This service is already selected as your main service");
      return;
    }

    form.setValue("additionalServiceIds", [...currentIds, serviceId]);
  };

  // Remove a service from the additional services list
  const removeAdditionalService = (index: number) => {
    const currentIds = form.getValues("additionalServiceIds");
    const newIds = [...currentIds];
    newIds.splice(index, 1);
    form.setValue("additionalServiceIds", newIds);
  };

  // Calculate total based on selected subcategories and services
  const calculateTotal = () => {
    let total = 0;

    // Add cost for all selected subcategories
    if (selectedSubcategories.length > 0) {
      total += selectedSubcategories.reduce((sum, subcategory) => sum + subcategory.price, 0);
    }

    // Add main service price
    if (includeService && selectedService) {
      total += selectedService.price;
    }

    // Add prices of all additional services
    if (selectedAdditionalServices.length > 0) {
      total += selectedAdditionalServices.reduce((sum, service) => sum + service.price, 0);
    }

    return total.toFixed(2);
  };

  // Get available time slots for selection
  const getAvailableTimeSlots = () => {
    return timeSlotInfos.filter(slot => slot.availableSlots > 0);
  };

  // Helper to get badge color based on availability
  const getAvailabilityBadgeColor = (availableSlots: number, totalSlots: number) => {
    if (availableSlots === 0) return "bg-red-500";
    if (availableSlots === 1) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if user has no vehicles
  if (!loading && vehicles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Vehicles Found</CardTitle>
          <CardDescription>
            You need to add a vehicle before you can place an order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Please add a vehicle to your account first.
          </p>
          <Button onClick={() => router.push("/vehicles/add")}>
            <Car className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClipboardCheck className="mr-2 h-6 w-6" />
          Create New Order
        </CardTitle>
        <CardDescription>
          All orders require at least one inspection. You can select multiple inspection types and subcategories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Vehicle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem
                          key={vehicle.vehicleId.toString()}
                          value={vehicle.vehicleId.toString()}
                        >
                          {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="flex items-center">
                    <Car className="mr-1 h-3 w-3" />
                    The vehicle you want serviced
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Inspection Selection Section */}
            <div className="space-y-4 border rounded-md p-4">
              <h3 className="font-medium text-lg">Inspection Selection</h3>
              <p className="text-sm text-muted-foreground">
                Select the inspection types you need. You can add multiple inspections.
              </p>

              {/* Inspection Categories Accordion */}
              <Accordion type="single" collapsible className="w-full">
                {mainCategories.map((categoryName) => (
                  <AccordionItem key={categoryName} value={categoryName}>
                    <AccordionTrigger>
                      {categoryName} Inspections
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {subcategoriesByMainCategory[categoryName] && 
                         subcategoriesByMainCategory[categoryName].map((subcategory) => {
                           // Check if this subcategory is already selected
                           const isSelected = selectedSubcategories.some(
                             item => item.serviceId === subcategory.serviceId
                           );
                           
                           return (
                             <div 
                               key={subcategory.serviceId} 
                               className={`p-4 rounded-md border cursor-pointer ${
                                 isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                               }`}
                               onClick={() => toggleSubcategorySelection(subcategory)}
                             >
                               <div className="flex justify-between items-center">
                                 <div className="flex items-center">
                                   <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                                     isSelected ? 'bg-primary text-white' : 'border border-muted-foreground'
                                   }`}>
                                     {isSelected && <Check className="h-3 w-3" />}
                                   </div>
                                   <h4 className="font-medium">{subcategory.serviceName}</h4>
                                 </div>
                                 <Badge variant="outline">${subcategory.price.toFixed(2)}</Badge>
                               </div>
                               
                               {subcategory.description && (
                                 <p className="text-sm text-muted-foreground mt-2 ml-7">
                                   {subcategory.description}
                                 </p>
                               )}
                             </div>
                           );
                         })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Selected Inspections Summary */}
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium mb-2">Selected Inspections</h4>
                {selectedSubcategories.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSubcategories.map((subcategory) => (
                      <div 
                        key={subcategory.serviceId}
                        className="flex justify-between items-center p-2 rounded-md bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">{subcategory.serviceName}</p>
                        </div>
                        <div className="flex items-center">
                          <Badge className="mr-2">${subcategory.price.toFixed(2)}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubcategorySelection(subcategory as Service);
                            }}
                          >
                            <MinusCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No inspections selected yet</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="inspectionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Inspection Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            // This ensures we fetch time slots immediately when a date is selected
                            if (date) {
                              fetchAvailableTimeSlotsForDate(date);
                            }
                          }}
                          // Allow selection from today onwards, no disabled dates
                          disabled={(date) => date < today}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Choose a date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeSlot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlotInfos.length > 0 ? (
                          timeSlotInfos.map((slot) => (
                            <SelectItem
                              key={slot.timeSlot}
                              value={slot.timeSlot}
                              disabled={slot.availableSlots <= 0}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{slot.timeSlot}</span>
                                <Badge
                                  className={cn(
                                    "ml-2",
                                    slot.availableSlots === 0 ? "bg-red-500" :
                                      slot.availableSlots === 1 ? "bg-yellow-500" :
                                        "bg-green-500"
                                  )}
                                >
                                  {slot.availableSlots}/{slot.totalSlots}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem
                            value="no-slots"
                            disabled
                          >
                            {selectedDate ? "No available slots for this date" : "Select a date first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {selectedDate
                        ? getAvailableTimeSlots().length > 0
                          ? `${getAvailableTimeSlots().length} time slot(s) available`
                          : "No available slots for this date"
                        : "Select a date first"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="includeService"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Add a service to your order
                    </FormLabel>
                    <FormDescription>
                      You can add a service now or wait for inspection results
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {includeService && (
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Service</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                    <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem
                            key={service.serviceId}
                            value={service.serviceId.toString()}
                          >
                            {service.serviceName} - ${service.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="flex items-center">
                      <Wrench className="mr-1 h-3 w-3" />
                      Select main service
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Additional Services Section */}
            {includeService && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>Additional Services</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Service
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                      <div className="p-2">
                        <p className="text-sm font-medium mb-2">Select a service</p>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {services.map((service) => (
                            <Button
                              key={service.serviceId}
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full justify-between"
                              onClick={() => addAdditionalService(service.serviceId.toString())}
                            >
                              <span>{service.serviceName}</span>
                              <span>${service.price.toFixed(2)}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedAdditionalServices.length > 0 ? (
                  <div className="space-y-2 border rounded-md p-3">
                    {selectedAdditionalServices.map((service, index) => (
                      <div
                        key={service.serviceId}
                        className="flex justify-between items-center p-2 rounded-md bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">{service.serviceName}</p>
                          <p className="text-xs text-muted-foreground">${service.price.toFixed(2)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdditionalService(index)}
                        >
                          <MinusCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No additional services selected</p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific concerns or requests?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order Summary */}
            <div className="rounded-md border p-4 mt-6">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2">
                {/* Display selected inspections in summary */}
                {selectedSubcategories.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Selected Inspections:</span>
                      <span></span>
                    </div>
                    {selectedSubcategories.map((subcategory) => (
                      <div key={subcategory.serviceId} className="flex justify-between text-sm pl-2">
                        <span>- {subcategory.serviceName}</span>
                        <span>${subcategory.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}

                {includeService && selectedService && (
                  <div className="flex justify-between text-sm">
                    <span>{selectedService.serviceName}:</span>
                    <span>${selectedService.price.toFixed(2)}</span>
                  </div>
                )}

                {selectedAdditionalServices.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Additional Services:</span>
                      <span></span>
                    </div>
                    {selectedAdditionalServices.map(service => (
                      <div key={service.serviceId} className="flex justify-between text-sm pl-2">
                        <span>- {service.serviceName}</span>
                        <span>${service.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}

                <div className="flex justify-between font-medium pt-2 border-t mt-2">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={submitting}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Place Order
        </Button>
      </CardFooter>
    </Card>
  );
}