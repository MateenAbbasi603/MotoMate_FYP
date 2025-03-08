"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

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
import authService, { UpdateProfileData, User } from "../../../services/authService";
import axios from "axios";

// Profile update schema
const profileFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function ProfileForm({ user, setUser }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: user.email || "",
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      setIsSubmitting(true);
      
      // Prepare data for update
      const updateData: UpdateProfileData = {};
      
      // Only include fields that have changed
      if (values.email !== user.email) updateData.email = values.email;
      if (values.name !== user.name) updateData.name = values.name;
      if (values.phone !== user.phone) updateData.phone = values.phone;
      if (values.address !== user.address) updateData.address = values.address;
      
      // If no changes, show message and return
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes detected");
        return;
      }

      // Call the API to update profile
      const response = await authService.updateProfile(updateData);
      
      // Update the user state with new values
      setUser({
        ...user,
        ...updateData
      });
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Failed to update profile");
      } else {
        toast.error("An error occurred while updating your profile");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} />
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
                <Input {...field} value={field.value || ""} />
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
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}