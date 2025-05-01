// src/components/Admin/SubcategoryForm.tsx

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import serviceApi from "../../../services/serviceApi";

const subcategorySchema = z.object({
  name: z.string().min(3, {
    message: "Subcategory name must be at least 3 characters.",
  }),
  parentCategory: z.string().min(1, {
    message: "Parent category is required",
  }),
});

type SubcategoryFormValues = z.infer<typeof subcategorySchema>;

interface SubcategoryFormProps {
  onSuccess: (subcategory: string) => void;
}

export default function SubcategoryForm({ onSuccess }: SubcategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: "",
      parentCategory: "",
    },
  });

  async function onSubmit(values: SubcategoryFormValues) {
    try {
      setIsSubmitting(true);
      
      // Here we would typically make an API call to save the new subcategory
      // For now, we'll just simulate success and return the new subcategory
      
      // Combine parent category with name to create full subcategory
      const subcategory = `${values.parentCategory}:${values.name}`;
      
      toast.success(`Subcategory "${values.name}" created successfully`);
      onSuccess(subcategory);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create subcategory:", error);
      toast.error("Failed to create subcategory");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add New Subcategory
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Inspection Subcategory</DialogTitle>
          <DialogDescription>
            Add a new subcategory for inspection services.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="parentCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Inspection Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EngineInspection">Engine Inspection</SelectItem>
                      <SelectItem value="TransmissionInspection">Transmission Inspection</SelectItem>
                      <SelectItem value="BrakeInspection">Brake Inspection</SelectItem>
                      <SelectItem value="ElectricalInspection">Electrical Inspection</SelectItem>
                      <SelectItem value="BodyInspection">Body Inspection</SelectItem>
                      <SelectItem value="TireInspection">Tire Inspection</SelectItem>
                      <SelectItem value="InteriorInspection">Interior Inspection</SelectItem>
                      <SelectItem value="SuspensionInspection">Suspension Inspection</SelectItem>
                      <SelectItem value="TiresInspection">Tires Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select which inspection type this subcategory belongs to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Fuel Injector Inspection" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a name for the new subcategory.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Subcategory"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}