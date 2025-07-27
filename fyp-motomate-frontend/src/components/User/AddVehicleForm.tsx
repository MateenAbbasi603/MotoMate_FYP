"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import {
  Car,
  ArrowLeft,
  Loader2,
  ChevronRight,
  CalendarIcon,
  KeyRound,
  BadgeInfo
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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Info } from "lucide-react";

// Form schema
const vehicleFormSchema = z.object({
  make: z.string().min(1, {
    message: "Make is required",
  }),
  model: z.string().min(1, {
    message: "Model is required",
  }),
  year: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({
      required_error: "Year is required",
      invalid_type_error: "Year must be a number",
    })
      .min(1900, { message: "Year must be 1900 or later" })
      .max(new Date().getFullYear() + 1, { message: `Year must be ${new Date().getFullYear() + 1} or earlier` })
  ),
  licensePlate: z.string().min(1, {
    message: "License plate is required",
  }),
});

type FormValues = z.infer<typeof vehicleFormSchema>;

export default function AddVehicleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const form = useForm<FormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      make: "",
      model: "",
      licensePlate: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push("/login");
        return;
      }

      // Call API to create vehicle
      const response = await axios.post(
        `${API_URL}/api/vehicles`,
        values,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.status !== 201) {
        throw new Error("Failed to add vehicle");
      }
      // Show success message and redirect

      toast.success("Vehicle added successfully!");
      router.push("/vehicles");
    } catch (error) {
      console.error("Error adding vehicle:", error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.message || "Failed to add vehicle";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError("An unexpected error occurred");
        toast.error("Failed to add vehicle");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to vehicles
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Add New Vehicle</h1>
        <p className="text-muted-foreground">Register your vehicle details to get started with our services</p>
      </div>

      <Card className="shadow-md border-muted-foreground/20">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription className="mt-1">
                Enter details about your vehicle to help us provide better service
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Make
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The manufacturer of your vehicle (e.g. Toyota, Honda)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Toyota"
                            {...field}
                            className="pl-8 focus-visible:ring-primary/50"
                          />
                          <BadgeInfo className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Brand name of your vehicle
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Model
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The specific model of your vehicle (e.g. Camry, Civic)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Camry"
                            {...field}
                            className="pl-8 focus-visible:ring-primary/50"
                          />
                          <Car className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Specific model variant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        Year
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The manufacturing year (1900-{new Date().getFullYear() + 1})</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder={new Date().getFullYear().toString()}
                            {...field}
                            className="pl-8 focus-visible:ring-primary/50"
                            onChange={(e) => {
                              field.onChange(e.target.value === "" ? "" : Number(e.target.value));
                            }}
                          />
                          <CalendarIcon className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Year your vehicle was manufactured
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        License Plate
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Your vehicle registration number</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="ABC-123"
                            {...field}
                            className="pl-8 uppercase focus-visible:ring-primary/50"
                          />
                          <KeyRound className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Registration number as shown on your plate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Why do we need your vehicle details?</h4>
                    <p className="text-muted-foreground text-sm mt-1">
                      This information helps us provide accurate service recommendations and maintenance schedules specific to your vehicle.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-between py-4 bg-muted/10">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-muted-foreground/30"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="min-w-[140px] group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                Add Vehicle
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}