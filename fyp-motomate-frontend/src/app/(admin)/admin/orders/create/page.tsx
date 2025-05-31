// app/(dashboard)/admin/walk-in/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertCircle,
  Car,
  ChevronLeft,
  Clock,
  Loader2,
  PlusCircle,
  Search,
  User,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import WalkInBillModal from '@/components/Admin/WalkInBillModal';


// Service type definition
interface Service {
  serviceId: number;
  serviceName: string;
  category: string;
  subCategory?: string;
  price: number;
  description?: string;
}

// User type definition
interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

// Vehicle type definition
interface Vehicle {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  userId: number;
}

interface Mechanic {
  mechanicId: number;
  name: string;
  email: string;
  phone: string;
  currentAppointments: number;
  status: string;
}

// Updated form schema with proper validation for all scenarios
const orderFormSchema = z.object({
  serviceId: z.number().optional(),
  inspectionId: z.number().optional(),
  orderNotes: z.string().optional(),
  includesInspection: z.boolean().default(false),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  inspectionSubCategory: z.string().optional(),
  mechanicId: z.number({
    required_error: "A mechanic must be assigned for walk-in orders"
  }), // Mechanic is required
}).refine((data) => {
  // Must have either a service or inspection (or both)
  return data.serviceId || (data.includesInspection && data.inspectionId);
}, {
  message: "Must select either a service or inspection (or both)",
  path: ["serviceId"]
}).refine((data) => {
  // If includesInspection is true, must have inspectionId
  return !data.includesInspection || data.inspectionId;
}, {
  message: "Inspection type is required when inspection is included",
  path: ["inspectionId"]
});

// Form schema for user creation
const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(5, "Phone number must be at least 5 characters"),
  address: z.string().optional(),
});

// Form schema for vehicle creation
const vehicleFormSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1900, "Year must be at least 1900").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  licensePlate: z.string().min(1, "License plate is required"),
});

export default function CreateWalkInOrderPage() {
  const router = useRouter();

  // State management
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [inspectionServices, setInspectionServices] = useState<Service[]>([]);
  const [regularServices, setRegularServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Service | null>(null);
  const [userSearchDialogOpen, setUserSearchDialogOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billData, setBillData] = useState<any>(null);

  // Form setup
  const orderForm = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderNotes: "",
      includesInspection: false,
      totalAmount: 0,
      mechanicId: undefined,
    },
  });

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const vehicleForm = useForm<z.infer<typeof vehicleFormSchema>>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      licensePlate: "",
    },
  });

  // Load mechanics
  useEffect(() => {
    const fetchAvailableMechanics = async () => {
      try {
        setLoadingMechanics(true);
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error("Authentication token not found. Please log in again.");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/MechanicServices/available`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        let mechanicsData: Mechanic[] = [];
        if (response.data && response.data.$values) {
          mechanicsData = response.data.$values;
        } else if (Array.isArray(response.data)) {
          mechanicsData = response.data;
        } else {
          toast.error("Invalid mechanics data format received from server");
          return;
        }

        setMechanics(mechanicsData);
      } catch (err: any) {
        console.error('Error fetching available mechanics:', err);
        toast.error(err.response?.data?.message || 'Failed to load available mechanics');
      } finally {
        setLoadingMechanics(false);
      }
    };

    fetchAvailableMechanics();
  }, []);

  // Handle mechanic selection
  const handleMechanicSelect = (mechanicId: string) => {
    const mechanic = mechanics.find(m => m.mechanicId === parseInt(mechanicId));
    setSelectedMechanic(mechanic || null);
    if (mechanic) {
      orderForm.setValue('mechanicId', mechanic.mechanicId);
    }
  };

  // Load services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error("Authentication token not found. Please log in again.");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Services`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        let servicesData: Service[] = [];
        if (response.data && response.data.$values) {
          servicesData = response.data.$values;
        } else if (Array.isArray(response.data)) {
          servicesData = response.data;
        } else {
          toast.error("Invalid services data format received from server");
          return;
        }

        setServices(servicesData);

        const inspections = servicesData.filter(
          service => service.category.toLowerCase() === 'inspection'
        );
        const regular = servicesData.filter(
          service => service.category.toLowerCase() !== 'inspection'
        );

        setInspectionServices(inspections);
        setRegularServices(regular);
      } catch (err: any) {
        console.error('Error fetching services:', err);
        toast.error(err.response?.data?.message || 'Failed to load services');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Update price calculation for all scenarios
  useEffect(() => {
    const servicePrice = selectedService?.price || 0;
    const inspectionPrice = selectedInspection?.price || 0;

    let total = 0;

    // Add service price if service is selected
    if (selectedService) {
      total += servicePrice;
    }

    // Add inspection price if inspection is included and selected
    if (orderForm.watch('includesInspection') && selectedInspection) {
      total += inspectionPrice;
    }

    orderForm.setValue('totalAmount', total);

    // Update form values
    if (selectedService) {
      orderForm.setValue('serviceId', selectedService.serviceId);
    } else {
      orderForm.setValue('serviceId', undefined);
    }

    if (selectedInspection && orderForm.watch('includesInspection')) {
      orderForm.setValue('inspectionId', selectedInspection.serviceId);
      orderForm.setValue('inspectionSubCategory', selectedInspection.subCategory);
    } else {
      orderForm.setValue('inspectionId', undefined);
      orderForm.setValue('inspectionSubCategory', undefined);
    }
  }, [selectedService, selectedInspection, orderForm.watch('includesInspection')]);

  // Handle service selection
  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.serviceId === parseInt(serviceId));
    setSelectedService(service || null);
  };

  // Handle inspection selection
  const handleInspectionSelect = (serviceId: string) => {
    const inspection = inspectionServices.find(s => s.serviceId === parseInt(serviceId));
    setSelectedInspection(inspection || null);
  };

  // Handle inspection toggle
  const handleInspectionToggle = (checked: boolean) => {
    orderForm.setValue('includesInspection', checked);
    if (!checked) {
      setSelectedInspection(null);
    }
  };

  // Handle user search
  const searchUsers = async () => {
    if (!userSearchTerm) {
      toast.error("Please enter a search term");
      return;
    }

    try {
      setSearchingUsers(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Users/search?term=${userSearchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      let usersData: User[] = [];
      if (response.data && response.data.$values) {
        usersData = response.data.$values;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      } else {
        toast.error("Invalid user data format received from server");
        return;
      }

      setFoundUsers(usersData);
    } catch (err: any) {
      console.error('Error searching users:', err);
      toast.error(err.response?.data?.message || 'Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  // Handle user selection
  const selectUser = (user: User) => {
    setSelectedUser(user);
    setUserSearchDialogOpen(false);
    fetchUserVehicles(user.userId);
  };

  // Fetch user vehicles
  const fetchUserVehicles = async (userId: number) => {
    try {
      setLoadingVehicles(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Vehicles/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      let vehiclesData: Vehicle[] = [];
      if (response.data && response.data.$values) {
        vehiclesData = response.data.$values;
      } else if (Array.isArray(response.data)) {
        vehiclesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (response.data.vehicleId) {
          vehiclesData = [response.data];
        } else if (response.data.data && Array.isArray(response.data.data)) {
          vehiclesData = response.data.data;
        } else {
          console.error("Unexpected vehicle data format:", response.data);
          toast.error("Received unexpected vehicle data format from server");
          return;
        }
      } else {
        console.error("Invalid vehicle data format:", response.data);
        toast.error("Invalid vehicle data format received from server");
        return;
      }

      vehiclesData = vehiclesData.filter(vehicle => {
        return vehicle && typeof vehicle === 'object' &&
          vehicle.vehicleId !== undefined &&
          vehicle.make !== undefined;
      });

      setUserVehicles(vehiclesData);
    } catch (err: any) {
      console.error('Error fetching user vehicles:', err);
      toast.error(err.response?.data?.message || 'Failed to load user vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Create new user
  const createUser = async (data: z.infer<typeof userFormSchema>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const nameParts = data.name.split(' ');
      let username = '';
      if (nameParts.length > 1) {
        username = (nameParts[0][0] + nameParts[nameParts.length - 1]).toLowerCase();
      } else {
        username = data.name.toLowerCase();
      }
      username += Math.floor(Math.random() * 1000);

      const password = `${username}${Math.floor(Math.random() * 100)}!`;

      const payload = {
        username,
        password,
        confirmPassword: password,
        email: data.email,
        role: "customer",
        name: data.name,
        phone: data.phone,
        address: data.address || "",
        imgUrl: ""
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/auth/register`,
        payload
      );

      if (response.data && response.data.success) {
        toast.success(`User created successfully. Username: ${username}, Password: ${password}`);
        setSelectedUser(response.data.user);
        setAddUserDialogOpen(false);
        setAddVehicleDialogOpen(true);
      } else {
        toast.error(response.data?.message || 'Failed to create user');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Create new vehicle
  const createVehicle = async (data: z.infer<typeof vehicleFormSchema>) => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const payload = {
        make: data.make,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        userId: selectedUser.userId
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Vehicles`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        toast.success('Vehicle added successfully');
        setSelectedVehicle(response.data);
        setAddVehicleDialogOpen(false);
        fetchUserVehicles(selectedUser.userId);
      } else {
        toast.error('Failed to add vehicle');
      }
    } catch (err: any) {
      console.error('Error creating vehicle:', err);
      toast.error(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  // Fixed submit order for all scenarios
  const submitOrder = async (data: z.infer<typeof orderFormSchema>) => {
    if (!selectedUser) {
      setUserSearchDialogOpen(true);
      toast.error("Please select a customer first");
      return;
    }

    if (!selectedVehicle) {
      toast.error("Please select a vehicle");
      return;
    }

    // SCENARIO VALIDATION:
    const hasService = !!data.serviceId;
    const hasInspection = data.includesInspection && !!data.inspectionId;

    if (!hasService && !hasInspection) {
      toast.error("Please select at least one service or inspection");
      return;
    }

    if (data.includesInspection && !data.inspectionId) {
      toast.error("Please select an inspection type when inspection is included");
      return;
    }

    // Add mechanic validation check
    if (!data.mechanicId) {
      toast.error("Please select a mechanic for the walk-in order");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const payload = {
        userId: selectedUser.userId,
        vehicleId: selectedVehicle.vehicleId,
        serviceId: data.serviceId || null,
        includesInspection: data.includesInspection,
        inspectionTypeId: data.includesInspection ? data.inspectionId : null,
        inspectionSubCategory: data.includesInspection ? data.inspectionSubCategory : "",
        totalAmount: data.totalAmount,
        notes: data.orderNotes || "",
        mechanicId: data.mechanicId || null
      };

      console.log('Submitting payload:', payload);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177'}/api/Orders/walkin`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        let successMessage = 'Walk-in order created successfully';
        if (payload.includesInspection && payload.serviceId) {
          successMessage += ' with inspection and service';
        } else if (payload.includesInspection) {
          successMessage += ' with inspection only';
        } else {
          successMessage += ' with service only';
        }

        if (payload.mechanicId) {
          successMessage += ' and mechanic assigned';
        }

        toast.success(successMessage);

        // Set bill data and show modal instead of immediate navigation
        setBillData(response.data);
        setShowBillModal(true);
      } else {
        toast.error('Failed to create walk-in order');
      }
    } catch (err: any) {
      console.error('Error creating walk-in order:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create walk-in order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add handler for bill modal close
  const handleBillModalClose = () => {
    setShowBillModal(false);

    // Navigate based on order type after bill is closed
    if (billData) {
      if (!orderForm.watch('includesInspection') && orderForm.watch('serviceId')) {
        // Service only - go to mechanic services
        router.push('/admin/mechanic-services');
      } else {
        // Inspection or both - go to orders
        router.push('/admin/orders');
      }
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Create Walk-In Order</h1>
      </div>

      <Form {...orderForm}>
        <form onSubmit={orderForm.handleSubmit(submitOrder)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Walk-In Order Details</CardTitle>
                  <CardDescription>
                    Create a new walk-in order for a customer. Select service only, inspection only, or both.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="service">
                    <TabsList className="mb-4">
                      <TabsTrigger value="service">Service</TabsTrigger>
                      {orderForm.watch('includesInspection') && (
                        <TabsTrigger value="inspection">Inspection</TabsTrigger>
                      )}
                      <TabsTrigger value="mechanic">Mechanic</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="service" className="space-y-4">
                      {/* Service Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Checkbox
                            id="includesInspection"
                            checked={orderForm.watch('includesInspection')}
                            onCheckedChange={handleInspectionToggle}
                          />
                          <label
                            htmlFor="includesInspection"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Include Inspection
                          </label>
                        </div>

                        <div className="mt-6">
                          <FormField
                            control={orderForm.control}
                            name="serviceId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Select Service {!orderForm.watch('includesInspection') ? '(Required)' : '(Optional)'}
                                </FormLabel>
                                <Select
                                  disabled={loadingServices}
                                  value={selectedService ? selectedService.serviceId.toString() : ""}
                                  onValueChange={handleServiceSelect}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a service" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {loadingServices ? (
                                      <SelectItem value="loading" disabled>
                                        Loading services...
                                      </SelectItem>
                                    ) : regularServices.length === 0 ? (
                                      <SelectItem value="none" disabled>
                                        No services available
                                      </SelectItem>
                                    ) : (
                                      regularServices.map((service) => (
                                        <SelectItem
                                          key={service.serviceId}
                                          value={service.serviceId.toString()}
                                        >
                                          {service.serviceName} - Rs {service.price.toFixed(2)}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  {orderForm.watch('includesInspection')
                                    ? "You can select a service, an inspection, or both"
                                    : "Service is required if inspection is not selected"
                                  }
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Display selected service details */}
                          {selectedService && (
                            <div className="bg-muted p-4 rounded-md mt-4">
                              <h3 className="font-medium text-primary">
                                {selectedService.serviceName}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {selectedService.description || 'No description available'}
                              </p>
                              <div className="flex justify-between items-center mt-3">
                                <span className="text-sm">Service Price</span>
                                <span className="font-medium">Rs {selectedService.price.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="inspection">
                      <div className="space-y-2">
                        <FormField
                          control={orderForm.control}
                          name="inspectionId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Inspection Type (Required when inspection is included)</FormLabel>
                              <Select
                                disabled={loadingServices}
                                value={selectedInspection ? selectedInspection.serviceId.toString() : ""}
                                onValueChange={handleInspectionSelect}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an inspection type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {loadingServices ? (
                                    <SelectItem value="loading" disabled>
                                      Loading inspection types...
                                    </SelectItem>
                                  ) : inspectionServices.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                      No inspection types available
                                    </SelectItem>
                                  ) : (
                                    inspectionServices.map((service) => (
                                      <SelectItem
                                        key={service.serviceId}
                                        value={service.serviceId.toString()}
                                      >
                                        {service.serviceName} - Rs {service.price.toFixed(2)}
                                        {service.subCategory ? ` (${service.subCategory})` : ''}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Display selected inspection details */}
                        {selectedInspection && (
                          <div className="bg-muted p-4 rounded-md mt-4">
                            <h3 className="font-medium text-primary">
                              {selectedInspection.serviceName}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedInspection.description || 'No description available'}
                            </p>
                            {selectedInspection.subCategory && (
                              <p className="text-sm mt-1">
                                <span className="text-muted-foreground">Type:</span> {selectedInspection.subCategory}
                              </p>
                            )}
                            <div className="flex justify-between items-center mt-3">
                              <span className="text-sm">Inspection Price</span>
                              <span className="font-medium">Rs {selectedInspection.price.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="mechanic">
                      <div className="space-y-2">
                        <FormField
                          control={orderForm.control}
                          name="mechanicId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Available Mechanic (Required)</FormLabel>
                              <Select
                                disabled={loadingMechanics}
                                value={selectedMechanic ? selectedMechanic.mechanicId.toString() : ""}
                                onValueChange={handleMechanicSelect}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a mechanic" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {loadingMechanics ? (
                                    <SelectItem value="loading" disabled>
                                      Loading mechanics...
                                    </SelectItem>
                                  ) : mechanics.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                      No mechanics available
                                    </SelectItem>
                                  ) : (
                                    mechanics.map((mechanic) => (
                                      <SelectItem
                                        key={mechanic.mechanicId}
                                        value={mechanic.mechanicId.toString()}
                                        disabled={mechanic.status === "Busy"}
                                      >
                                        {mechanic.name} - {mechanic.status}
                                        {mechanic.status === "Available" ?
                                          ` (${mechanic.currentAppointments}/3 appointments)` :
                                          " (Too many active appointments)"}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                A mechanic must be assigned for all walk-in orders. Mechanics can have up to 3 active appointments at a time.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Display selected mechanic details */}
                        {selectedMechanic && (
                          <div className="bg-muted p-4 rounded-md mt-4">
                            <h3 className="font-medium text-primary">
                              {selectedMechanic.name}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="text-sm">{selectedMechanic.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="text-sm">{selectedMechanic.phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Current Workload</p>
                                <p className="text-sm">{selectedMechanic.currentAppointments}/3 active appointments</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge
                                  variant="outline"
                                  className={
                                    selectedMechanic.status === "Available"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {selectedMechanic.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="notes">
                      <FormField
                        control={orderForm.control}
                        name="orderNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add any notes about this walk-in order"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Add any additional information or special instructions for this order.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                  <Button variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Walk-In Order'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Sidebar */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Customer</h3>
                    {selectedUser ? (
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="font-medium">{selectedUser.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{selectedUser.email}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setUserSearchDialogOpen(true)}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Find Customer
                      </Button>
                    )}
                  </div>

                  {/* Vehicle Info */}
                  {selectedUser && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Vehicle</h3>
                      {selectedVehicle ? (
                        <div className="bg-muted p-3 rounded-md">
                          <div className="flex items-center">
                            <Car className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="font-medium">
                              {selectedVehicle.make} {selectedVehicle.model}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedVehicle.year} • {selectedVehicle.licensePlate}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {loadingVehicles ? (
                            <div className="flex items-center justify-center p-3 bg-muted rounded-md">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm">Loading vehicles...</span>
                            </div>
                          ) : userVehicles.length > 0 ? (
                            <div className="space-y-2">
                              {userVehicles.map((vehicle) => (
                                <div
                                  key={vehicle.vehicleId || Math.random()}
                                  className="flex items-center justify-between p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80"
                                  onClick={() => setSelectedVehicle(vehicle)}
                                >
                                  <div>
                                    <div className="flex items-center">
                                      <Car className="h-4 w-4 text-muted-foreground mr-2" />
                                      <span className="font-medium">
                                        {vehicle.make || 'Unknown'} {vehicle.model || ''}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {vehicle.year || 'N/A'} • {vehicle.licensePlate || 'No Plate'}
                                    </p>
                                  </div>
                                  <Button size="sm" variant="ghost">
                                    Select
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No vehicles found</p>
                          )}
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setAddVehicleDialogOpen(true)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Vehicle
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mechanic Info */}
                  {selectedMechanic && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Assigned Mechanic</h3>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex items-center">
                          <Wrench className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="font-medium">{selectedMechanic.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Status: {selectedMechanic.status}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Price Summary</h3>
                    <div className="space-y-2 bg-muted p-3 rounded-md">
                      {selectedService && (
                        <div className="flex justify-between">
                          <span className="text-sm">Service</span>
                          <span>Rs {selectedService.price.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedInspection && orderForm.watch('includesInspection') && (
                        <div className="flex justify-between">
                          <span className="text-sm">Inspection</span>
                          <span>Rs {selectedInspection.price.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Total</span>
                        <span>Rs {orderForm.watch('totalAmount').toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Type Indicator */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Order Type</h3>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-800">Walk-In Order</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        {orderForm.watch('includesInspection') && selectedService
                          ? "Service + Inspection"
                          : orderForm.watch('includesInspection')
                            ? "Inspection Only"
                            : "Service Only"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* User Search Dialog */}
      <Dialog open={userSearchDialogOpen} onOpenChange={setUserSearchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find Customer</DialogTitle>
            <DialogDescription>
              Search for an existing customer by name, email, or phone number
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mb-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="searchTerm" className="sr-only">
                Search
              </Label>
              <Input
                id="searchTerm"
                placeholder="Search by name, email, or phone"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchUsers();
                  }
                }}
              />
            </div>
            <Button onClick={searchUsers} disabled={searchingUsers}>
              {searchingUsers ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-72 overflow-y-auto">
            {searchingUsers ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <p>Searching...</p>
              </div>
            ) : foundUsers.length > 0 ? (
              <div className="space-y-2">
                {foundUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80"
                    onClick={() => selectUser(user)}
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.phone}</div>
                    </div>
                    <Button size="sm" variant="ghost">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            ) : userSearchTerm ? (
              <div className="text-center p-4">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="sm:w-auto w-full"
              onClick={() => {
                setUserSearchDialogOpen(false);
                setAddUserDialogOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Customer
            </Button>
            <Button
              variant="outline"
              onClick={() => setUserSearchDialogOpen(false)}
              className="sm:w-auto w-full sm:mt-0 mt-2"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Enter the customer's details to create a new account
            </DialogDescription>
          </DialogHeader>

          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(createUser)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter customer's address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddUserDialogOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Customer'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Dialog */}
      <Dialog open={addVehicleDialogOpen} onOpenChange={setAddVehicleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
            <DialogDescription>
              Enter the vehicle details for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <Form {...vehicleForm}>
            <form onSubmit={vehicleForm.handleSubmit(createVehicle)} className="space-y-4">
              <FormField
                control={vehicleForm.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={vehicleForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Corolla" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={vehicleForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2023"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={vehicleForm.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddVehicleDialogOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Vehicle'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bill Modal */}
      {showBillModal && billData && (
        <WalkInBillModal
          isOpen={showBillModal}
          onClose={handleBillModalClose}
          orderData={billData}
        />
      )}
    </div>
  );
}