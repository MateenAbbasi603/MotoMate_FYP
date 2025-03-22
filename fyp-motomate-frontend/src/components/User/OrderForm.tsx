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
  Loader2 
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

// Define interfaces for data types
interface Vehicle {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface Service {
  serviceId: number;
  serviceName: string;
  category: string;
  price: number;
  description: string;
}

// Form schema for order with mandatory inspection
const orderFormSchema = z.object({
  vehicleId: z.string().min(1, {
    message: "Please select a vehicle",
  }),
  inspectionDate: z.date({
    required_error: "Inspection date is required",
  }).refine(
    (date) => date > new Date(), 
    { message: "Inspection date must be in the future" }
  ),
  includeService: z.boolean().default(false),
  serviceId: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // If includeService is true, serviceId must be provided
    return !data.includeService || (data.includeService && data.serviceId);
  },
  {
    message: "Please select a service",
    path: ["serviceId"],
  }
);

type FormValues = z.infer<typeof orderFormSchema>;

export default function OrderForm() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspectionFee, setInspectionFee] = useState(29.99);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const form = useForm<FormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      includeService: false,
      notes: "",
    },
  });

  // Watch the includeService field to conditionally show service selection
  const includeService = form.watch("includeService");
  const serviceId = form.watch("serviceId");

  // Helper to get auth token from local storage
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch vehicles and services when component mounts
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
        
        // Fetch available services
        const servicesResponse = await axios.get(`${API_URL}/api/services`);
        
        setVehicles(vehiclesResponse.data);
        setServices(servicesResponse.data);
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

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Prepare data for API request
      const orderData = {
        vehicleId: parseInt(values.vehicleId),
        serviceId: values.includeService && values.serviceId ? parseInt(values.serviceId) : null,
        inspectionDate: values.inspectionDate.toISOString(),
        notes: values.notes || "",
      };

      console.log("Creating order with data:", orderData);

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

      toast.success("Your order has been placed successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating order:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.message || "Failed to create order";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError("Failed to create order. Please try again.");
        toast.error("Failed to create order");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total based on inspection fee and selected service
  const calculateTotal = () => {
    let total = inspectionFee;
    if (includeService && selectedService) {
      total += selectedService.price;
    }
    return total.toFixed(2);
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
  if (vehicles.length === 0) {
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
          All orders require a vehicle inspection. You can also add services.
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
                          key={vehicle.vehicleId} 
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
                        onSelect={field.onChange}
                        disabled={(date) => date < addDays(new Date(), 1)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Choose a date for your inspection
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      Select additional service (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <div className="flex justify-between text-sm">
                  <span>Inspection Fee:</span>
                  <span>${inspectionFee.toFixed(2)}</span>
                </div>
                
                {includeService && selectedService && (
                  <div className="flex justify-between text-sm">
                    <span>{selectedService.serviceName}:</span>
                    <span>${selectedService.price.toFixed(2)}</span>
                  </div>
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