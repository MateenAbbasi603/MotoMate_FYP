"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { useState } from "react";
import Link from "next/link";
import { 
  Eye, 
  EyeOff, 
  Wrench, 
  Shield, 
  ArrowRight,
  Loader2,
  AlertCircle 
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
import { ModeToggle } from "@/components/ModeToggle";

// Define login form validation schema
const loginFormSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

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

// Enhanced Login Form Component
export default function EnhancedLoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://localhost:7105";
      const apiUrl = `${backendUrl}/api/auth/login`;

      console.log("Attempting to call API at:", apiUrl);
      console.log("Login payload:", { username: values.username, password: values.password });

      const response = await axios.post(
        apiUrl,
        {
          username: values.username,
          password: values.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }

        toast.success("Welcome back! Login successful.");

        // Enhanced role-based routing
        if (response.data.user?.role) {
          const role = response.data.user.role;
          switch (role) {
            case "customer":
              router.push("/dashboard");
              break;
            case "super_admin":
            case "admin":
              router.push("/admin/dashboard");
              break;
            case "service_agent":
              router.push("/admin/service-agent");
              break;
            case "mechanic":
              router.push("/admin/mechanic");
              break;
            case "finance_officer":
              router.push("/admin/finances");
              break;
            default:
              router.push("/dashboard");
              break;
          }
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(response.data.message || "Login failed");
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error);

      if (axios.isAxiosError(error)) {
        console.log("Response status:", error.response?.status);
        console.log("Response data:", error.response?.data);

        if (error.response) {
          setError(error.response.data.message || "Invalid username or password");
          toast.error(error.response.data.message || "Invalid username or password");
        } else if (error.request) {
          setError("Unable to connect to server. Please check your connection.");
          toast.error("Unable to connect to server. Please check your connection.");
        } else {
          setError("An unexpected error occurred. Please try again.");
          toast.error("An unexpected error occurred. Please try again.");
        }
      } else {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <MotoMateLogo />
      
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-xl shadow-black/5 relative">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
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
                      placeholder="Enter your username"
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
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium text-foreground">
                      Password
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-red-600 hover:text-red-700 hover:underline underline-offset-4 transition-colors duration-200"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-red-600/25 hover:shadow-red-700/30 disabled:opacity-50" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">
                  New to MotoMate?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
              >
                Create an account
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </form>
        </Form>
      </div>

      <div className="mt-8 text-xs text-muted-foreground text-center text-balance">
        By signing in, you agree to our{" "}
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
