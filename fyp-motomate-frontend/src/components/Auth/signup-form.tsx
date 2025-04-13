"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { useState, useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Updated schema to match our .NET API requirements
const formSchema = z.object({
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
    .min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z
    .string()
    .min(1, { message: "Confirm password is required" }),
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  imgUrl: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export function SignupForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Handle successful upload from Cloudinary widget
  const handleUploadSuccess = useCallback((result: any) => {
    const imageUrl = result.info.secure_url;
    setUploadedImage(imageUrl);
    form.setValue("imgUrl", imageUrl);
    toast.success("Image uploaded successfully!");
  }, [form]);

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      // If image was uploaded, make sure it's in the values
      if (uploadedImage && !values.imgUrl) {
        values.imgUrl = uploadedImage;
      }

      // Format data to match our .NET API expectations
      const requestData = {
        username: values.username,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        role: "customer", // Fixed role as customer for regular registration
        name: values.name,
        phone: values.phone || "",
        address: values.address || "",
        imgUrl: values.imgUrl || "",
      };

      console.log("Submitting registration:", requestData);
      console.log("API URL:", `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`);

      // Submit the form using axios
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Registration successful:", response.data);
      
      if (response.data.success) {
        // Save token if you want to automatically log in the user
        // localStorage.setItem('token', response.data.token);
        
        toast.success("Account created successfully!");
        router.push("/login");
      } else {
        setError(response.data.message || "Failed to create account");
        toast.error(response.data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error("API response error:", error.response.data);
        setError(error.response.data.message || "Failed to create account");
        toast.error(error.response.data.message || "Failed to create account");
      } else {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Profile Image Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <FormLabel className="block mb-2">Profile Picture</FormLabel>
            <div className="mb-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src={uploadedImage} />
                <AvatarFallback>{form.watch("name")?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>

            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default_preset"}
              onSuccess={handleUploadSuccess}
              options={{
                maxFiles: 1,
                resourceType: "image",
                sources: ["local", "camera"],
              }}
            >
              {({ open }) => (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => open()}
                  className="mb-2"
                >
                  {uploadedImage ? "Change Image" : "Upload Image"}
                </Button>
              )}
            </CldUploadWidget>
            {uploadedImage && (
              <p className="text-sm text-green-600">Image uploaded successfully</p>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
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
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="1234567890" {...field} />
              </FormControl>
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
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden field for image URL */}
        <input type="hidden" {...form.register("imgUrl")} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}