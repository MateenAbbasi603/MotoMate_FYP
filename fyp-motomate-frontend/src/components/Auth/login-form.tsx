"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

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
import Link from "next/link";
import { useState } from "react";

// Define login form validation schema - updated to use username instead of email
const loginFormSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define your form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Define a submit handler with debugging
  async function onSubmit(values: LoginFormValues) {
    try {
      setIsSubmitting(true);
      setError(null);
  
      // Get backend URL with fallback for testing
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const apiUrl = `${backendUrl}/api/auth/login`;
  
      console.log("Attempting to call API at:", apiUrl);
      console.log("Login payload:", { username: values.username, password: values.password });
  
      // Submit the form using axios
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
        // Store token in localStorage
        localStorage.setItem("token", response.data.token);
        
        // Store user data if needed
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
  
        toast.success("Login successful!");
  
        // Redirect based on user role for more specific routing
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
              router.push("/admin/service-agent"); // Service agents directly to services page
              break;
            case "mechanic":
              router.push("/admin/mechanic"); // Mechanics directly to mechanic page
              break;
            case "finance_officer":
              router.push("/admin/finances"); // Finance officers directly to finance page
              break;
            default:
              router.push("/dashboard");
              break;
          }
          console.log("Redirecting to:", `/admin/${role}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(response.data.message || "Login failed");
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error);
  
      // Handle error
      if (axios.isAxiosError(error)) {
        console.log("Response status:", error.response?.status);
        console.log("Response data:", error.response?.data);
  
        if (error.response) {
          // Server returned an error response
          setError(error.response.data.message || "Invalid username or password");
          toast.error(error.response.data.message || "Invalid username or password");
        } else if (error.request) {
          // No response received
          setError("No response from server. Please try again later.");
          toast.error("No response from server. Please try again later.");
        } else {
          // Error setting up the request
          setError("Error setting up request. Please try again.");
          toast.error("Error setting up request. Please try again.");
        }
      } else {
        // Non-Axios error
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Login with your Username & Password
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="yourusername"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline underline-offset-4"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </Form>
      </div>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}