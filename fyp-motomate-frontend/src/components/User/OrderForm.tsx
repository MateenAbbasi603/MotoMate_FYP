// Enhanced OrderForm.tsx with modern UI and fixed subcategory handling

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
  Check,
  GanttChart,
  Banknote,
  CalendarIcon,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

// Add these imports to your existing OrderForm.tsx imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, Wallet } from "lucide-react";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, isBefore } from "date-fns";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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
});

type FormValues = z.infer<typeof orderFormSchema>;

export default function OrderForm() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mainCategories, setMainCategories] = useState<string[]>([]);
  const [subcategoriesByMainCategory, setSubcategoriesByMainCategory] = useState<{ [key: string]: Service[] }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAdditionalServices, setSelectedAdditionalServices] = useState<Service[]>([]);
  const [timeSlotInfos, setTimeSlotInfos] = useState<TimeSlotInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [formStep, setFormStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'online' | null>(null);

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
  const vehicleId = form.watch("vehicleId");
  const timeSlot = form.watch("timeSlot");

  // Helper to get auth token from local storage
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Modified useEffect to not auto-advance when selecting inspections
  useEffect(() => {
    let progress = 0;

    if (vehicleId) progress += 20;
    if (selectedSubcategories.length > 0) progress += 20;
    if (inspectionDate) progress += 20;
    if (timeSlot) progress += 20;
    if (includeService && serviceId) progress += 20;
    else if (!includeService) progress += 20;

    setFormProgress(progress);

    // Only auto-advance from vehicle selection to inspection selection
    // Do not add any other auto-advancement logic here
    if (vehicleId && formStep === 0) {
      setFormStep(1);
    }
  }, [vehicleId, selectedSubcategories, inspectionDate, timeSlot, serviceId, includeService, formStep]);

  // Then ensure the toggle function doesn't change form steps
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

    // DO NOT set the form step here
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
        const mainCats: any = [...new Set(inspectionServices.map(
          (service: Service) => service.subCategory || 'General'
        ))];

        // Group subcategories by main category
        const subcategoryMap: { [key: string]: Service[] } = {};

        mainCats.forEach((mainCat: string) => {
          // Find all services with this subcategory
          subcategoryMap[mainCat] = inspectionServices.filter(
            (service: Service) => service.subCategory === mainCat
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



  const onSubmit = async (values: FormValues) => {
    try {
      // Validate that at least one subcategory is selected
      if (selectedSubcategories.length === 0) {
        toast.error("Please select at least one inspection subcategory");
        setFormStep(1);
        return;
      }

      // Show payment method selection dialog first
      setShowPaymentDialog(true);
    } catch (error) {
      console.error("Form submission error:", error);
      setError("Failed to process your order. Please try again.");
      toast.error("Failed to create order");
    }
  };

  // Add this new function to handle the actual order creation
  const handleOrderCreation = async (paymentMethod: 'cash' | 'online') => {
    try {
      setSubmitting(true);
      setError(null);
      setShowPaymentDialog(false);

      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const values = form.getValues();

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
        setFormStep(2);
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

      // Prepare the final request object with payment method
      const orderData = {
        vehicleId: parseInt(values.vehicleId),
        inspectionTypeId: primaryInspection.serviceId,
        subCategory: primaryInspection.serviceName,
        serviceId: values.includeService && values.serviceId ? parseInt(values.serviceId) : null,
        additionalServiceIds: [...additionalServiceIdsAsNumbers, ...additionalSubcategoryIds],
        inspectionDate: inspectionDateWithNoon.toISOString(),
        timeSlot: values.timeSlot,
        notes: values.notes || "",
        paymentMethod: paymentMethod, // Add payment method to the request
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

          // Different redirect based on payment method
          if (paymentMethod === 'cash') {
            // For cash payments, redirect to order details page
            router.push(`/orders/${response.data.orderId}`);
          } else {
            // For online payments, redirect to dashboard (existing flow)
            router.push("/dashboard");
          }
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
      setSelectedPaymentMethod(null);
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
      <Card className="max-w-4xl mx-auto shadow-lg border-0">
        <CardHeader className="bg-muted/40 rounded-t-xl">
          <CardTitle className="flex items-center">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
            <span className="text-xl">Loading Order Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-8">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/4 bg-muted animate-pulse rounded-md" />
                <div className="h-12 bg-muted animate-pulse rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if user has no vehicles
  if (!loading && vehicles.length === 0) {
    return (
      <Card className="max-w-lg mx-auto shadow-lg border-0">
        <CardHeader className="bg-muted/20 rounded-t-xl">
          <CardTitle className="flex items-center text-xl">
            <Car className="mr-2 h-6 w-6 text-primary" />
            No Vehicles Found
          </CardTitle>
          <CardDescription className="text-base">
            You need to add a vehicle before you can place an order.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 px-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
              <Car className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-8 max-w-md">
              Before you can schedule a service or inspection, we need information about your vehicle. Please add your vehicle details first.
            </p>
            <Button
              onClick={() => router.push("/vehicles/add")}
              size="lg"
              className="gap-2 px-6"
            >
              <Car className="h-5 w-5" />
              Add Your Vehicle
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-2xl">
            <ClipboardCheck className="mr-3 h-7 w-7 text-primary" />
            Create New Order
          </CardTitle>
          <Badge variant="outline" className="px-3 py-1.5 text-sm bg-white/80">
            <GanttChart className="h-4 w-4 mr-1.5 text-primary" />
            <span>{formStep === 0 ? "Vehicle Selection" :
              formStep === 1 ? "Inspection Selection" :
                formStep === 2 ? "Schedule Appointment" :
                  "Additional Services"}</span>
          </Badge>
        </div>
        <CardDescription className="text-base mt-2">
          Schedule your vehicle inspection and optional services
        </CardDescription>
        <Progress value={formProgress} className="h-1.5 mt-4" />
      </CardHeader>
      <CardContent className="pt-8 px-8">
        {error && (
          <Alert variant="destructive" className="mb-8 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Vehicle Selection */}
            <div className={formStep === 0 ? "block" : "hidden"}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Car className="h-5 w-5 mr-2 text-primary" />
                Select Your Vehicle
              </h3>
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel className="text-base">Which vehicle needs service?</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setFormStep(1);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem
                            key={vehicle.vehicleId.toString()}
                            value={vehicle.vehicleId.toString()}
                            className="py-3"
                          >
                            <div className="flex items-center">
                              <Car className="h-4 w-4 mr-2 text-primary" />
                              <span className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                              <Badge variant="outline" className="ml-2">{vehicle.licensePlate}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-sm flex items-center mt-2">
                      <Car className="mr-1.5 h-3.5 w-3.5" />
                      The vehicle you want serviced
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  className="px-6"
                  disabled={!vehicleId}
                  onClick={() => vehicleId && setFormStep(1)}
                >
                  Continue
                </Button>
              </div>
            </div>

            {/* Step 2: Inspection Selection */}
            <div className={formStep === 1 ? "block" : "hidden"}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                  Inspection Selection
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormStep(0)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>

              <div className="bg-muted/20 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  Select the inspection types you need. Each vehicle inspection includes a detailed report of your vehicle's condition.
                </p>
              </div>

              {/* Inspection Categories Accordion */}
              <Accordion
                type="single"
                collapsible
                className="w-full border rounded-lg overflow-hidden"
                defaultValue={mainCategories[0]}
              >
                {mainCategories.map((categoryName) => (
                  <AccordionItem key={categoryName} value={categoryName} className="border-0 border-b last:border-0">
                    <AccordionTrigger className="hover:bg-muted/30 px-4 py-3 text-base font-medium">
                      {categoryName} Inspections
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subcategoriesByMainCategory[categoryName] &&
                          subcategoriesByMainCategory[categoryName].map((subcategory) => {
                            // Check if this subcategory is already selected
                            const isSelected = selectedSubcategories.some(
                              item => item.serviceId === subcategory.serviceId
                            );

                            return (
                              <div
                                key={subcategory.serviceId}
                                className={`p-4 rounded-md border cursor-pointer transition-all ${isSelected
                                  ? 'bg-primary/5 border-primary shadow-sm'
                                  : 'hover:bg-accent hover:border-accent'
                                  }`}
                                onClick={() => toggleSubcategorySelection(subcategory)}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${isSelected
                                      ? 'bg-primary text-white'
                                      : 'border border-muted-foreground'
                                      }`}>
                                      {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    <h4 className="font-medium">{subcategory.serviceName}</h4>
                                  </div>
                                  <Badge
                                    variant={isSelected ? "default" : "outline"}
                                    className={isSelected ? "bg-primary" : ""}
                                  >
                                    PKR {subcategory.price.toFixed(2)}
                                  </Badge>
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
              <div className="border rounded-lg mt-6 overflow-hidden">
                <div className="bg-muted/20 px-4 py-3 border-b">
                  <h4 className="font-medium">Selected Inspections</h4>
                </div>
                <div className="p-4">
                  {selectedSubcategories.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSubcategories.map((subcategory) => (
                        <div
                          key={subcategory.serviceId}
                          className="flex justify-between items-center p-3 rounded-md bg-muted/30"
                        >
                          <div>
                            <p className="font-medium text-sm">{subcategory.serviceName}</p>
                          </div>
                          <div className="flex items-center">
                            <Badge className="mr-2">PKR {subcategory.price.toFixed(2)}</Badge>
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
                    <div className="text-center py-6">
                      <div className="rounded-full bg-muted/30 p-3 inline-flex mb-3">
                        <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">No inspections selected yet</p>
                      <p className="text-xs text-muted-foreground">Please select at least one inspection type</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormStep(0)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={selectedSubcategories.length === 0}
                  onClick={() => selectedSubcategories.length > 0 && setFormStep(2)}
                >
                  Continue
                </Button>
              </div>
            </div>

            {/* Step 3: Schedule Appointment */}
            <div className={formStep === 2 ? "block" : "hidden"}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Schedule Your Appointment
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormStep(1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>

              <div className="bg-muted/20 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  Choose a convenient date and time for your inspection. Available time slots are shown in green.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="inspectionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-base mb-2">Inspection Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal h-12 border-muted-foreground/20",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MMMM d, yyyy")
                              ) : (
                                <span>Select a date</span>
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
                              // Fetch time slots immediately when a date is selected
                              if (date) {
                                fetchAvailableTimeSlotsForDate(date);
                              }
                            }}
                            disabled={(date) => isBefore(date, today) || isBefore(date, new Date(today.setHours(0, 0, 0, 0)))}
                            initialFocus
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="flex items-center text-sm mt-2">
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        Select your preferred date
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
                      <FormLabel className="text-base mb-2">Time Slot</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-muted-foreground/20">
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
                                className="py-3"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{slot.timeSlot}</span>
                                  </div>
                                  <Badge
                                    className={cn(
                                      "ml-2",
                                      slot.availableSlots === 0 ? "bg-red-500" :
                                        slot.availableSlots === 1 ? "bg-amber-500" :
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
                              className="py-3 text-center"
                            >
                              {selectedDate ? "No available slots for this date" : "Select a date first"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription className="flex items-center text-sm mt-2">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
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

              <div className="flex justify-end space-x-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={!timeSlot}
                  onClick={() => timeSlot && setFormStep(3)}
                >
                  Continue
                </Button>
              </div>
            </div>

            {/* Step 4: Additional Services */}
            <div className={formStep === 3 ? "block" : "hidden"}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-primary" />
                  Additional Services
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormStep(2)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>

              <FormField
                control={form.control}
                name="includeService"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base">
                        Add a service to your order
                      </FormLabel>
                      <FormDescription className="text-sm">
                        You can add a service now or wait for inspection results
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {includeService && (
                <div className="mt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Select Primary Service</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 border-muted-foreground/20">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem
                                key={service.serviceId}
                                value={service.serviceId.toString()}
                                className="py-3"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{service.serviceName}</span>
                                  <Badge variant="outline">PKR {service.price.toFixed(2)}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="flex items-center text-sm mt-2">
                          <Wrench className="mr-1.5 h-3.5 w-3.5" />
                          Select your main service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Services Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base">Additional Services</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Add Service
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="end">
                          <div className="p-2">
                            <p className="text-sm font-medium p-2 border-b">Select a service</p>
                            <div className="max-h-64 overflow-y-auto">
                              {services.map((service) => (
                                <Button
                                  key={service.serviceId}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-between py-3 px-3 h-auto"
                                  onClick={() => addAdditionalService(service.serviceId.toString())}
                                >
                                  <span className="text-left">{service.serviceName}</span>
                                  <Badge variant="outline">PKR {service.price.toFixed(2)}</Badge>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {selectedAdditionalServices.length > 0 ? (
                      <div className="space-y-2 border rounded-lg p-3">
                        {selectedAdditionalServices.map((service, index) => (
                          <div
                            key={service.serviceId}
                            className="flex justify-between items-center p-3 rounded-md bg-muted/30"
                          >
                            <div>
                              <p className="font-medium text-sm">{service.serviceName}</p>
                              <p className="text-xs text-muted-foreground">PKR {service.price.toFixed(2)}</p>
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
                      <div className="text-center py-4 bg-muted/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">No additional services selected</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-base">Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific concerns or requests?"
                        className="resize-none min-h-24 border-muted-foreground/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Order Summary */}
              <div className="rounded-lg border mt-8 overflow-hidden">
                <div className="bg-muted/20 px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-medium flex items-center">
                    <Banknote className="mr-2 h-4 w-4 text-primary" />
                    Order Summary
                  </h3>
                  <Badge variant="secondary" className="font-medium text-base px-3 py-1">
                    PKR {calculateTotal()}
                  </Badge>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {/* Display selected inspections in summary */}
                    {selectedSubcategories.length > 0 && (
                      <>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Selected Inspections:</span>
                          <span></span>
                        </div>
                        {selectedSubcategories.map((subcategory) => (
                          <div key={subcategory.serviceId} className="flex justify-between text-sm pl-2">
                            <span className="text-muted-foreground">• {subcategory.serviceName}</span>
                            <span>PKR {subcategory.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {includeService && selectedService && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm font-medium">
                          <span>Primary Service:</span>
                          <span></span>
                        </div>
                        <div className="flex justify-between text-sm pl-2">
                          <span className="text-muted-foreground">• {selectedService.serviceName}</span>
                          <span>PKR {selectedService.price.toFixed(2)}</span>
                        </div>
                      </>
                    )}

                    {selectedAdditionalServices.length > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm font-medium">
                          <span>Additional Services:</span>
                          <span></span>
                        </div>
                        {selectedAdditionalServices.map(service => (
                          <div key={service.serviceId} className="flex justify-between text-sm pl-2">
                            <span className="text-muted-foreground">• {service.serviceName}</span>
                            <span>PKR {service.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    <Separator />
                    <div className="flex justify-between font-medium pt-2">
                      <span>Total:</span>
                      <span className="text-primary text-lg">PKR {calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setFormStep(2)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={submitting}
                  className="gap-2 px-6"
                  size="lg"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ClipboardCheck className="h-5 w-5" />
                  )}
                  Place Order
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Select Payment Method
            </DialogTitle>
            <DialogDescription>
              How would you like to pay for this service?
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
              className="h-16 flex-col gap-2"
              onClick={() => setSelectedPaymentMethod('cash')}
            >
              <Wallet className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Cash Payment</p>
                <p className="text-xs text-muted-foreground">Pay at the workshop</p>
              </div>
            </Button>

            <Button
              variant={selectedPaymentMethod === 'online' ? 'default' : 'outline'}
              className="h-16 flex-col gap-2"
              onClick={() => setSelectedPaymentMethod('online')}
            >
              <CreditCard className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Online Payment</p>
                <p className="text-xs text-muted-foreground">Pay now with card</p>
              </div>
            </Button>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                setSelectedPaymentMethod(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedPaymentMethod && handleOrderCreation(selectedPaymentMethod)}
              disabled={!selectedPaymentMethod || submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}