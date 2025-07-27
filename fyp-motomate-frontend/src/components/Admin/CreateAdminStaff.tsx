"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

import {
  AtSign,
  Building,
  Check,
  ChevronLeft,
  Loader2,
  Lock,
  Phone,
  Shield,
  User,
  UserCog,
  Wrench,
  AlertCircle,
  BadgeAlert,
  Clock,
  ShieldAlert,
  UserPlus
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Add helper for Pakistan phone formatting
const formatPakPhone = (value: string) => {
  let clean = value.replace(/\D/g, '').slice(0, 10);
  if (clean.length > 0 && clean[0] !== '3') clean = '';
  if (clean.length > 3) {
    return clean.slice(0, 3) + '-' + clean.slice(3);
  }
  return clean;
};

// Staff creation form schema
const staffFormSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters.",
    })
    .max(50, {
      message: "Username must not exceed 50 characters.",
    }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." }),
  role: z.enum(["admin", "mechanic", "finance_officer"], {
    message: "Please select a valid role.",
  }),
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  phone: z.string().optional().refine(
    val => !val || /^3\d{9}$/.test(val),
    { message: 'Enter valid Pakistani mobile (3XXXXXXXXX)' }
  ),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof staffFormSchema>;

// Component to display role information
const RoleInfo = ({ role }: { role: string }) => {
  const roleConfig = {
    admin: {
      icon: <ShieldAlert className="h-10 w-10 text-blue-500" />,
      title: "Administrator",
      description: "Full access to all system features and settings. Can manage users, services, and view all reports.",
      color: "bg-blue-50 border-blue-200 text-blue-700",
    },
    service_agent: {
      icon: <UserCog className="h-10 w-10 text-green-500" />,
      title: "Service Agent",
      description: "Manages customer appointments, orders, and provides customer service. Can view and update service records.",
      color: "bg-green-50 border-green-200 text-green-700",
    },
    mechanic: {
      icon: <Wrench className="h-10 w-10 text-amber-500" />,
      title: "Mechanic",
      description: "Handles vehicle inspections and repairs. Updates service progress and completes assigned work orders.",
      color: "bg-amber-50 border-amber-200 text-amber-700",
    },
    finance_officer: {
      icon: <BadgeAlert className="h-10 w-10 text-purple-500" />,
      title: "Finance Officer",
      description: "Manages billing, invoices, and financial records. Can view and generate financial reports.",
      color: "bg-purple-50 border-purple-200 text-purple-700",
    },
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.admin;

  return (
    <div className={`p-4 rounded-lg border ${config.color} mb-6`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0">{config.icon}</div>
        <div>
          <h3 className="font-medium text-lg mb-1">{config.title}</h3>
          <p className="text-sm opacity-90">{config.description}</p>
        </div>
      </div>
    </div>
  );
};

export default function CreateStaffForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "admin",
      name: "",
      phone: "",
      address: "",
    },
    mode: "onChange",
  });

  // Watch role to show relevant info
  const selectedRole = form.watch("role");
  const fullName = form.watch("name");
  const password = form.watch("password");

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 5);
  };

  // Update password strength when password changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strength = calculatePasswordStrength(e.target.value);
    setPasswordStrength(strength);
    form.setValue("password", e.target.value);
  };

  // Get name initials for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(part => part)
      .map(part => part[0])
      .join('')
      .toUpperCase() || '?';
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

      // Get the authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Submit the form using axios
      const response = await axios.post(
        `${API_URL}/api/auth/admin/create-staff`,
        values,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success(`${values.name} has been added as a ${values.role.replace('_', ' ')}`);
      
      // Reset form
      form.reset();
      
      // Redirect to staff list
      router.push("/admin/users");
    } catch (error) {
      console.error("Staff creation error:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || "Failed to create staff member");
        toast.error(error.response.data.message || "Failed to create staff member");
      } else {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-4 pt-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <UserPlus className="mr-2 h-6 w-6 text-primary" />
                Create Staff Account
              </CardTitle>
              <CardDescription className="mt-1">
                Add a new staff member to the system with appropriate permissions
              </CardDescription>
            </div>
            
            <Button
              variant="outline"
              className="gap-2 self-start"
              onClick={() => router.push("/admin/users")}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Staff List
            </Button>
          </div>
          
          <Separator className="my-4" />
        </CardHeader>
        
        <CardContent className="flex flex-col lg:flex-row gap-8 pb-6">
          <div className="lg:w-1/3">
            <div className="sticky top-6">
              <div className="mb-6 flex justify-center">
                <Avatar className="h-32 w-32 border-4 border-primary/10">
                  <AvatarFallback className="bg-primary/10 text-3xl text-primary">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-medium text-lg">{fullName || "New Staff Member"}</h3>
                  
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-primary" />
                    Role Description
                  </h4>
                  <RoleInfo role={selectedRole} />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    Access Hours
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Staff members have 24/7 access to their assigned sections of the system based on their role permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/3">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <User className="mr-2 h-5 w-5 text-primary" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="John Doe" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Staff Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="pl-9 relative h-10">
                                <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex items-center">
                                  <ShieldAlert className="h-4 w-4 mr-2 text-blue-500" />
                                  Administrator
                                </div>
                              </SelectItem>
                              <SelectItem value="mechanic">
                                <div className="flex items-center">
                                  <Wrench className="h-4 w-4 mr-2 text-amber-500" />
                                  Mechanic
                                </div>
                              </SelectItem>
                              <SelectItem value="finance_officer">
                                <div className="flex items-center">
                                  <BadgeAlert className="h-4 w-4 mr-2 text-purple-500" />
                                  Finance Officer
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            This determines what permissions the staff member will have
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <AtSign className="mr-2 h-5 w-5 text-primary" />
                    Account Credentials
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="johndoe" 
                                className="pl-9" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Username for login (minimum 3 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="john@example.com" 
                                type="email" 
                                className="pl-9" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="password" 
                                className="pl-9" 
                                onChange={handlePasswordChange}
                                value={field.value}
                              />
                            </div>
                          </FormControl>
                          
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Password strength:</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`text-xs ${
                                      passwordStrength < 3 ? 'text-red-500' : 
                                      passwordStrength < 5 ? 'text-amber-500' : 'text-green-500'
                                    }`}>
                                      {passwordStrength === 0 ? 'Very Weak' :
                                       passwordStrength === 1 ? 'Weak' :
                                       passwordStrength === 2 ? 'Fair' :
                                       passwordStrength === 3 ? 'Good' :
                                       passwordStrength === 4 ? 'Strong' : 'Very Strong'}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Password must contain at least:</p>
                                    <ul className="text-xs list-disc pl-4 mt-1">
                                      <li>8 characters</li>
                                      <li>One uppercase letter</li>
                                      <li>One lowercase letter</li>
                                      <li>One number</li>
                                      <li>One special character</li>
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  passwordStrength < 3 ? 'bg-red-500' : 
                                  passwordStrength < 5 ? 'bg-amber-500' : 'bg-green-500'
                                }`} 
                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Phone className="mr-2 h-5 w-5 text-primary" />
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative flex items-center">
                              <span className="flex items-center gap-1 pr-2 border-r border-muted-foreground/20 bg-muted/30 rounded-l-md h-10 px-2">
                                <img src="https://flagcdn.com/w20/pk.png" alt="PK" className="w-4 h-4 rounded-sm" />
                                <span className="text-sm text-muted-foreground font-medium">+92</span>
                              </span>
                              <input
                                type="text"
                                className="pl-2 h-10 flex-1 rounded-r-md border border-muted-foreground/20 focus:outline-none"
                                placeholder="3XX-XXXXXXX"
                                value={formatPakPhone(field.value || '')}
                                onChange={e => {
                                  let clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                                  if (clean.length > 0 && clean[0] !== '3') clean = '';
                                  field.onChange(clean);
                                }}
                                maxLength={11}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">Enter 10 digits after +92, starting with 3</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="123 Main St, City, State" 
                                className="pl-9" 
                                {...field} 
                                value={field.value || ""} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Optional address information
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <Separator />

                <CardFooter className="px-0 pt-2">
                  <div className="flex justify-end w-full gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/admin/users")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Create Staff Member
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}