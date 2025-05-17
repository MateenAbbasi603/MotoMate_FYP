"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Loader2,
  Wrench,
  CheckCircle,
  ShieldAlert,
  DollarSign,
  ClipboardList,
  PenLine,
  Plus,
  CircleDashed,
  XCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  subCategory: z.string().optional(),
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

// Category icons
const categoryIcons = {
  repair: <Wrench className="h-5 w-5" />,
  maintenance: <CheckCircle className="h-5 w-5" />,
  inspection: <ShieldAlert className="h-5 w-5" />,
};

// Predefined subcategories for inspections
const predefinedSubcategories = [
  { value: "EngineInspection", label: "Engine Inspection" },
  { value: "TransmissionInspection", label: "Transmission Inspection" },
  { value: "BrakeInspection", label: "Brake Inspection" },
  { value: "ElectricalInspection", label: "Electrical Inspection" },
  { value: "BodyInspection", label: "Body Inspection" },
  { value: "TireInspection", label: "Tire Inspection" },
  { value: "InteriorInspection", label: "Interior Inspection" },
  { value: "SuspensionInspection", label: "Suspension Inspection" },
  { value: "TiresInspection", label: "Tires Inspection" },
];

export default function ServiceForm({ serviceId }: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubcategory, setShowSubcategory] = useState(false);
  const [useCustomSubcategory, setUseCustomSubcategory] = useState(false);
  const [subcategoryTab, setSubcategoryTab] = useState<string>("predefined");

  const router = useRouter();
  const isEditMode = !!serviceId;

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      serviceName: "",
      category: "maintenance",
      subCategory: "",
      price: 0,
      description: "",
    },
  });

  const category = form.watch("category");
  const subCategory = form.watch("subCategory");
  const price = form.watch("price");

  // Update useEffect to show/hide subcategory field based on category
  useEffect(() => {
    if (category === "inspection") {
      setShowSubcategory(true);
    } else {
      setShowSubcategory(false);
      form.setValue("subCategory", "");
      setUseCustomSubcategory(false);
    }
  }, [category, form]);

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
          subCategory: service.subCategory || "",
          price: service.price,
          description: service.description,
        });

        if (service.category === "inspection" && service.subCategory) {
          setShowSubcategory(true);
          // Check if subCategory is one of the predefined ones
          const isPredefined = predefinedSubcategories.some(
            item => item.value === service.subCategory
          );

          setUseCustomSubcategory(!isPredefined);
          setSubcategoryTab(isPredefined ? "predefined" : "custom");
        }
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
        subCategory: showSubcategory ? values.subCategory : "",
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

  const handleSubcategoryTabChange = (value: string) => {
    setSubcategoryTab(value);
    setUseCustomSubcategory(value === "custom");
    form.setValue("subCategory", ""); // Reset subcategory on tab change
  };

  // Category selection card
  const CategoryCard = ({ value, label, icon, selected }: { value: string, label: string, icon: React.ReactNode, selected: boolean }) => (
    <div
      className={`border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all
                ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30 hover:bg-accent/50'}`}
      onClick={() => form.setValue("category", value as "repair" | "maintenance" | "inspection")}
    >
      <div className={`p-2 rounded-full ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center text-xl">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading Service Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-md">
      <CardHeader className="border-b bg-card">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant={isEditMode ? "outline" : "default"} className="mb-2">
              {isEditMode ? "Editing Service" : "New Service"}
            </Badge>
            <CardTitle className="text-2xl font-bold">
              {isEditMode ? "Edit Service" : "Create New Service"}
            </CardTitle>
            <CardDescription className="mt-1.5 text-muted-foreground">
              {isEditMode
                ? "Update service details and pricing information."
                : "Fill in the details to create a new service."}
            </CardDescription>
          </div>
          <div className={`rounded-full p-3 ${isEditMode ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
            {isEditMode ? <PenLine size={24} /> : <Plus size={24} />}
          </div>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <XCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="serviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base font-medium">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Service Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Oil Change"
                          {...field}
                          className="transition-all focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        The name of the service as shown to customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel className="flex items-center text-base font-medium">
                    <Wrench className="h-4 w-4 mr-2" />
                    Category
                  </FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {(["repair", "maintenance", "inspection"] as const).map((cat) => (
                      <CategoryCard
                        key={cat}
                        value={cat}
                        label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                        icon={categoryIcons[cat]}
                        selected={category === cat}
                      />
                    ))}
                  </div>
                  <FormField
                    control={form.control}
                    name="category"
                    render={() => <></>} // Hidden field, handled by cards
                  />
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base font-medium">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Price (PKR)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground pointer-events-none">
                            PKR
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-12 transition-all focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value === "" ? "" : Number(e.target.value));
                            }}
                          />
                        </div>
                      </FormControl>
                      <div className="flex justify-between items-center mt-1">
                        <FormDescription className="text-xs text-muted-foreground">
                          The price of the service in PKR.
                        </FormDescription>
                        <Badge variant="outline" className={`${price > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                          {price > 0 ? `PKR ${price.toFixed(2)}` : 'No price set'}
                        </Badge>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {showSubcategory && (
                  <div className="space-y-4">
                    <FormLabel className="flex items-center text-base font-medium">
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Inspection Subcategory
                    </FormLabel>
                    <Tabs value={subcategoryTab} onValueChange={handleSubcategoryTabChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="predefined" className="flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-2" />
                          Predefined
                        </TabsTrigger>
                        <TabsTrigger value="custom" className="flex items-center">
                          <PenLine className="h-3.5 w-3.5 mr-2" />
                          Custom
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="predefined">
                        <FormField
                          control={form.control}
                          name="subCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger className="transition-all focus-visible:ring-primary/30 focus-visible:ring-offset-2">
                                      <SelectValue placeholder="Select a subcategory" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {predefinedSubcategories.map(item => (
                                      <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormDescription className="text-xs text-muted-foreground">
                                Select a predefined subcategory for this inspection service.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="custom">
                        <FormField
                          control={form.control}
                          name="subCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Enter custom subcategory"
                                  className="transition-all focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-muted-foreground">
                                Enter a custom subcategory for this inspection service.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-base font-medium">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of the service..."
                          className="min-h-32 resize-none transition-all focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center mt-1">
                        <FormDescription className="text-xs text-muted-foreground">
                          A detailed description of what the service includes.
                        </FormDescription>
                        <span className="text-xs text-muted-foreground">
                          {field.value.length} / 500 characters
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>

          <Separator />

          <CardFooter className="p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/services")}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto gap-2 font-medium shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEditMode ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {isEditMode ? "Update Service" : "Create Service"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}