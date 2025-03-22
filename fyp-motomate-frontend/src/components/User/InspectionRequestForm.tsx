"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Calendar, 
  Car, 
  ClipboardCheck,
  Info,
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
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Vehicle type
interface Vehicle {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

// Form schema for inspection request
const inspectionFormSchema = z.object({
  vehicleId: z.string().min(1, {
    message: "Please select a vehicle",
  }),
  scheduledDate: z.date({
    required_error: "Please select a date for the inspection",
  }).refine(
    (date) => date > new Date(), 
    { message: "Inspection date must be in the future" }
  ),
  notes: z.string().optional(),
  addService: z.boolean().default(false),
  serviceId: z.string().optional(),
});

type FormValues = z.infer<typeof inspectionFormSchema>;

// Mock function - Replace with actual API call
const fetchVehicles = async (): Promise<Vehicle[]> => {
  // In a real app, this would be an API call
  return [
    { vehicleId: 1, make: "Toyota", model: "Camry", year: 2018, licensePlate: "ABC123" },
    { vehicleId: 2, make: "Honda", model: "Civic", year: 2020, licensePlate: "XYZ789" },
    { vehicleId: 3, make: "Ford", model: "F-150", year: 2019, licensePlate: "DEF456" },
  ];
};

// Mock function - Replace with actual API call
const fetchServices = async () => {
  // In a real app, this would be an API call
  return [
    { serviceId: 1, serviceName: "Oil Change", category: "maintenance", price: 49.99 },
    { serviceId: 2, serviceName: "Brake Inspection", category: "inspection", price: 29.99 },
    { serviceId: 3, serviceName: "Tire Rotation", category: "maintenance", price: 19.99 },
  ];
};

export default function InspectionRequestForm() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      notes: "",
      addService: false,
    },
  });

  // Watch the addService field to conditionally show service selection
  const addService = form.watch("addService");

  // Fetch vehicles and services when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const vehiclesData = await fetchVehicles();
        const servicesData = await fetchServices();
        
        setVehicles(vehiclesData);
        setServices(servicesData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load your vehicles");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      setError(null);

      console.log("Submitting inspection request:", values);

      // Format data for API request
      const requestData = {
        vehicleId: parseInt(values.vehicleId),
        scheduledDate: values.scheduledDate.toISOString(),
        notes: values.notes || "",
      };

      // If adding a service, include in order creation
      if (values.addService && values.serviceId) {
        console.log("Including service:", values.serviceId);
        // Logic for adding a service would go here
      }

      // In a real app, this would be an API call
      // await api.createInspection(requestData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("Inspection request submitted successfully");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting inspection request:", error);
      setError("Failed to submit inspection request. Please try again.");
      toast.error("Failed to submit inspection request");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClipboardCheck className="mr-2 h-6 w-6" />
          Schedule Vehicle Inspection
        </CardTitle>
        <CardDescription>
          Book an inspection for your vehicle. This is required before any service.
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
                    The vehicle you want inspected
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledDate"
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
                        disabled={(date:any) => date < new Date()}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please include any specific concerns or issues with your vehicle"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any specific issues you'd like us to check?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addService"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Pre-select a service along with inspection
                    </FormLabel>
                    <FormDescription>
                      You can add a service now or wait for inspection results
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {addService && (
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
                            {service.serviceName} - ${service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This service will be added to your order after inspection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
          Request Inspection
        </Button>
      </CardFooter>
    </Card>
  );
}