"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import serviceApi, { ServiceFormData } from "../../../services/serviceApi";


// Service form schema
const serviceFormSchema = z.object({
  serviceName: z.string().min(3, {
    message: "Service name must be at least 3 characters.",
  }).max(100, {
    message: "Service name must be at most 100 characters.",
  }),
  category: z.enum(["repair", "maintenance", "inspection"], {
    message: "Please select a valid category.",
  }),
  price: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().positive({
      message: "Price must be a positive number.",
    })
  ),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description must be at most 500 characters.",
  }),
});

type FormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  serviceId?: number; // Optional for edit mode
}

export default function ServiceForm({ serviceId }: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEditMode = !!serviceId;

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      serviceName: "",
      category: "maintenance",
      price: 0,
      description: "",
    },
  });

  // Fetch service data if in edit mode
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!serviceId) return;
      
      try {
        setIsLoading(true);
        const service = await serviceApi.getServiceById(serviceId);
        
        // Populate form with service data
        form.reset({
          serviceName: service.serviceName,
          category: service.category,
          price: service.price,
          description: service.description,
        });
      } catch (error) {
        console.error("Error fetching service:", error);
        toast.error("Failed to load service data");
        router.push("/admin/services");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceData();
  }, [serviceId, form, router]);

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      const serviceData: ServiceFormData = {
        serviceName: values.serviceName,
        category: values.category,
        price: values.price,
        description: values.description,
      };

      if (isEditMode && serviceId) {
        // Update existing service
        await serviceApi.updateService(serviceId, serviceData);
        toast.success("Service updated successfully");
      } else {
        // Create new service
        await serviceApi.createService(serviceData);
        toast.success("Service created successfully");
      }

      // Redirect back to services list
      router.push("/admin/services");
    } catch (error: any) {
      console.error("Service form submission error:", error);
      const errorMessage = error.response?.data?.message || (isEditMode ? "Failed to update service" : "Failed to create service");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading Service Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Service" : "Create New Service"}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? "Update service details and pricing information." 
            : "Fill in the details to create a new service."}
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
              name="serviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Oil Change" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the service as shown to customers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of service being offered.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="49.99"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value === "" ? "" : Number(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    The price of the service in USD.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the service..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A detailed description of what the service includes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/services")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Services
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Update Service" : "Create Service"}
        </Button>
      </CardFooter>
    </Card>
  );
}