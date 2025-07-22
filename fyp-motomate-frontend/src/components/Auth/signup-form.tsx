// components/Auth/enhanced-signup-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import Link from "next/link";
import { 
  Eye, 
  EyeOff, 
  Wrench, 
  Shield, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Upload,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Flag
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ModeToggle";

// Enhanced schema with phone validation for exactly 11 digits
const formSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters.",
    })
    .max(50, {
      message: "Username must not exceed 50 characters.",
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    }),
  confirmPassword: z
    .string()
    .min(1, { message: "Confirm password is required" }),
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(100, {
      message: "Name must not exceed 100 characters.",
    }),
  phone: z
    .string()
    .optional()
    .or(z.literal("")) // Allow empty string
    .transform(val => { // Transform to digits only for validation, handle undefined
      if (val === undefined || val === null || val === "") return "";
      return val.replace(/\D/g, '');
    })
    .refine(val => val === "" || /^3\d{9}$/.test(val), { // Validate the digits-only string
      message: "Phone number must be 10 digits, starting with 3.",
    }),
  address: z.string().max(255, {
    message: "Address must not exceed 255 characters.",
  }).optional(),
  imgUrl: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

// Logo Component
function MotoMateLogo() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
          <Wrench className="w-6 h-6 text-red-600 dark:text-red-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <Shield className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
          MotoMate
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          Auto Workshop Management
        </p>
      </div>
    </div>
  );
}

// Enhanced Signup Form Component
export default function EnhancedSignupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      name: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      imgUrl: "",
      
    },
  });

  // Mock image upload handler (replace with your actual upload logic)
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock upload - in real app, upload to your service
      const mockUrl = URL.createObjectURL(file);
      setUploadedImage(mockUrl);
      form.setValue("imgUrl", mockUrl);
      toast.success("Image uploaded successfully!");
    }
  }, [form]);

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      // Format data to match your .NET API expectations
      const requestData = {
        username: values.username,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: "customer",
        name: values.name,
        phone: values.phone ? '+92' + values.phone.replace(/\D/g, '') : "", // Add +92 and remove dash for backend
        address: values.address || "",
        imgUrl: values.imgUrl || "",
      };

      console.log("Submitting registration:", requestData);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:7105";
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("Registration response:", data);

      if (data.success) {
        toast.success("Account created successfully! Please login to continue.");
        router.push("/login");
      } else {
        setError(data.message || "Failed to create account");
        toast.error(data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Unable to connect to server. Please check your connection.");
      toast.error("Unable to connect to server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <MotoMateLogo />
      
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-xl shadow-black/5 relative">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Create your account
          </h2>
          <p className="text-sm text-muted-foreground">
            Join MotoMate to manage your vehicle services
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Profile Image Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <FormLabel className="text-sm font-medium text-foreground mb-2 block">
                  Profile Picture (Optional)
                </FormLabel>
                <div className="mb-4 relative">
                  <Avatar className="w-20 h-20 mx-auto border-2 border-border/50">
                    <AvatarImage src={uploadedImage} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary/90">
                      {form.watch("name")?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="w-6 h-6  bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
                {uploadedImage && (
                  <p className="text-xs text-green-600 font-medium">Image uploaded successfully</p>
                )}
              </div>
            </div>

            {/* Form Fields in Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="h-11 px-4 rounded-lg border-border/50 bg-background/50 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe123"
                        className="h-11 px-4 rounded-lg border-border/50 bg-background/50 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      className="h-11 px-4 rounded-lg border-border/50 bg-background/50 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          
                          <div className="w-4 h-4 rounded-sm overflow-hidden">
                            <img 
                              src="https://flagcdn.com/w20/pk.png" 
                              alt="Pakistan Flag" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">+92</span>
                        </div>
                        <Input
                          type="tel"
                          placeholder="3XXXXXXXXX"
                          maxLength={11}
                          className="h-11 pl-16 pr-4 rounded-lg border-border/50 bg-background/50 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Allow only digits initially
                            let formattedValue = value;

                            // Ensure the number starts with '3' if not empty
                            if (formattedValue.length > 0 && !formattedValue.startsWith('3')) {
                              formattedValue = ''; // Clear input if it doesn't start with 3
                            }

                            // Insert dash after the 4th digit (index 3) if input starts with 3 and has more than 3 digits
                            if (formattedValue.startsWith('3') && formattedValue.length > 3 && !formattedValue.includes('-')) {
                                formattedValue = formattedValue.slice(0, 4) + '-' + formattedValue.slice(4);
                            }
                            
                            // Limit total characters to match the format 3XX-XXXXXXX (12 characters including the initial 3 and dash)
                            formattedValue = formattedValue.slice(0, 12);

                            // Update the form state with the formatted value
                            field.onChange(formattedValue);
                          }}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Enter 10-digit Pakistani mobile number starting with 3
                    </p>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main Street, Karachi"
                        className="h-11 px-4 rounded-lg border-border/50 bg-background/50 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create password"
                          className="h-11 px-4 pr-11 rounded-lg border-border/50 bg-background/50 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-foreground">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          className="h-11 px-4 pr-11 rounded-lg border-border/50 bg-background/50 transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-red-600/25 hover:shadow-red-700/30 disabled:opacity-50" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
              >
                Sign in instead
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </form>
        </Form>
      </div>

      <div className="mt-8 text-xs text-muted-foreground text-center text-balance">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-red-600 hover:text-red-700 hover:underline underline-offset-4 transition-colors duration-200">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-red-600 hover:text-red-700 hover:underline underline-offset-4 transition-colors duration-200">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}