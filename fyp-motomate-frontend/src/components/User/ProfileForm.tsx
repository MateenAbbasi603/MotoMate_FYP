"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
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
  phone: z.string().optional().refine(
    val => !val || /^3\d{9}$/.test(val),
    { message: 'Enter valid Pakistani mobile (3XXXXXXXXX)' }
  ),
  address: z.string().optional(),
  imgUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export default function ProfileForm({ user, setUser }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(user.imgUrl || null);
  const [updatedFields, setUpdatedFields] = useState<Record<string, boolean>>({});

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: user.email || "",
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      imgUrl: user.imgUrl || "",
    },
  });

  // Track changed fields
  const trackFieldChange = (field: string, value: any) => {
    const originalValue = user[field as keyof User];
    const hasChanged = value !== originalValue;
    
    setUpdatedFields(prev => ({
      ...prev,
      [field]: hasChanged
    }));
  };

  // Handle successful image upload
  const handleUploadSuccess = (result: any) => {
    const secureUrl = result.info.secure_url;
    setUploadedImage(secureUrl);
    form.setValue("imgUrl", secureUrl);
    trackFieldChange("imgUrl", secureUrl);
    toast.success("Image uploaded successfully");
  };

  // Handle image update separately
  const handleUpdateImage = async () => {
    if (!uploadedImage || uploadedImage === user.imgUrl) {
      toast.info("No image changes detected");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updateData: UpdateProfileData = {
        imgUrl: uploadedImage
      };

      const response = await authService.updateProfile(updateData);
      
      // Check the 'success' property from the API response data
      if (response && response.success) {
         // The API might return the updated user object, use it if available
         const updatedUserFromApi = response.user; // Assuming the updated user is in response.user

         if (updatedUserFromApi) {
             setUser(updatedUserFromApi);
         } else { // Fallback if API doesn't return full user
             setUser(prev => prev ? {...prev, imgUrl: uploadedImage} : null);
         }

         toast.success("Profile picture updated successfully");
         setUpdatedFields(prev => ({...prev, imgUrl: false}));
      } else {
         console.error("Profile image update API call reported failure or returned unexpected format.", response);
         // Use the message from the backend if available, otherwise a generic error
         const errorMessage = response?.message || "Failed to update profile picture.";
         toast.error(errorMessage);
         // You might want to revert uploadedImage state if update failed
         // setUploadedImage(user.imgUrl || null);
      }

    } catch (error) {
      console.error("Profile image update error caught:", error);
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle API errors
  const handleApiError = (error: any) => {
    if (axios.isAxiosError(error) && error.response) {
      toast.error(error.response.data.message || "Failed to update profile");
    } else {
      toast.error("An error occurred while updating your profile");
    }
  };

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

       // Check the 'success' property from the API response data for the main form submit
      if (response && response.success) {
           // The API might return the updated user object, use it if available
           const updatedUserFromApi = response.user; // Assuming the updated user is in response.user

           if (updatedUserFromApi) {
               setUser(updatedUserFromApi);
           } else { // Fallback if API doesn't return full user
               // Update the user state with new values from the form if no user object returned
               setUser(prev => prev ? {...prev, ...updateData} : null);
           }

           toast.success("Profile updated successfully");
           // Reset updated fields tracking based on the form's current values
           // This might require re-initializing the form or complex state management
           // For simplicity now, we'll just assume successful update clears tracked changes
            setUpdatedFields({});

      } else {
         console.error("Profile update API call reported failure or returned unexpected format.", response);
          const errorMessage = response?.message || "Failed to update profile.";
          toast.error(errorMessage);
      }

    } catch (error) {
      console.error("Profile update error:", error);
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper for Pakistan phone formatting
  const formatPakPhone = (value: string) => {
    let clean = value.replace(/\D/g, '').slice(0, 10);
    if (clean.length > 0 && clean[0] !== '3') clean = '';
    if (clean.length > 3) {
      return clean.slice(0, 3) + '-' + clean.slice(3);
    }
    return clean;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage src={uploadedImage || ""} alt={user.name || "User"} />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-center gap-2">
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
            
            {uploadedImage !== user.imgUrl && (
              <Button 
                type="button" 
                onClick={handleUpdateImage}
                disabled={isSubmitting}
                size="sm"
              >
                {isSubmitting ? "Saving..." : "Save Profile Picture"}
              </Button>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    trackFieldChange("email", e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
              {updatedFields.email && (
                <p className="text-xs text-amber-500">This field has been changed</p>
              )}
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
                <Input 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    trackFieldChange("name", e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
              {updatedFields.name && (
                <p className="text-xs text-amber-500">This field has been changed</p>
              )}
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
                      trackFieldChange("phone", clean);
                    }}
                    maxLength={11}
                  />
                </div>
              </FormControl>
              <FormMessage />
              {updatedFields.phone && (
                <p className="text-xs text-amber-500">This field has been changed</p>
              )}
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
                <Input 
                  {...field} 
                  value={field.value || ""} 
                  onChange={(e) => {
                    field.onChange(e);
                    trackFieldChange("address", e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
              {updatedFields.address && (
                <p className="text-xs text-amber-500">This field has been changed</p>
              )}
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