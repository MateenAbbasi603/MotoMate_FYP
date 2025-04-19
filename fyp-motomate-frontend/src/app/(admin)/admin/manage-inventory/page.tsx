'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Pencil,
  Trash,
  Search,
  FilterX,
  Loader2,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { InventoryFormData, InventoryItem } from '../../../../../types/inventoryTypes';
import inventoryService from '../../../../../services/inventoryService';


// Inventory form schema
const inventoryFormSchema = z.object({
  toolName: z.string().min(1, { message: 'Tool name is required' }),
  toolType: z.string().min(1, { message: 'Tool type is required' }),
  quantity: z.number().int().positive({ message: 'Quantity must be a positive number' }),
  purchaseDate: z.date().optional(),
  condition: z.string().min(1, { message: 'Condition is required' }),
  price: z.number().nonnegative({ message: 'Price must be a non-negative number' }),
  vendorName: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export default function ManageInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [inventoryToDelete, setInventoryToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      toolName: '',
      toolType: '',
      quantity: 1,
      condition: 'New',
      price: 0,
      vendorName: '',
    },
  });

  // Fetch inventory items
  useEffect(() => {
    fetchInventory();
  }, []);

  // Update filtered inventory when filters change
  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, typeFilter]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset();
      setEditingInventory(null);
    }
  }, [isDialogOpen, form]);

  // Set form values when editing an inventory item
  useEffect(() => {
    if (editingInventory) {
      form.setValue('toolName', editingInventory.toolName);
      form.setValue('toolType', editingInventory.toolType);
      form.setValue('quantity', editingInventory.quantity);
      if (editingInventory.purchaseDate) {
        form.setValue('purchaseDate', new Date(editingInventory.purchaseDate));
      }
      form.setValue('condition', editingInventory.condition);
      form.setValue('price', editingInventory.price);
      form.setValue('vendorName', editingInventory.vendorName || '');
    }
  }, [editingInventory, form]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await inventoryService.getAllInventory();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setError('Failed to load inventory items');
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.toolType.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.toolName.toLowerCase().includes(query) ||
        item.toolType.toLowerCase().includes(query) ||
        item.vendorName?.toLowerCase().includes(query)
      );
    }

    setFilteredInventory(filtered);
  };

  const handleDeleteInventory = async () => {
    if (!inventoryToDelete) return;

    try {
      setIsDeleting(true);
      await inventoryService.deleteInventory(inventoryToDelete.toolId);

      // Update local state
      setInventory(prevInventory => 
        prevInventory.filter(item => item.toolId !== inventoryToDelete.toolId)
      );
      
      toast.success('Inventory item deleted successfully');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast.error('Failed to delete inventory item');
    } finally {
      setInventoryToDelete(null);
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
  };

  const onSubmit = async (values: InventoryFormValues) => {
    try {
      setError(null);
      
      const formattedData: any = {
        ...values,
        purchaseDate: values.purchaseDate ? values.purchaseDate.toISOString() : undefined
      };

      if (editingInventory) {
        // Update existing inventory item
        const updatedItem = await inventoryService.updateInventory(
          editingInventory.toolId,
          formattedData
        );
        
        setInventory(prev => 
          prev.map(item => 
            item.toolId === editingInventory.toolId ? updatedItem : item
          )
        );
        
        toast.success('Inventory item updated successfully');
      } else {
        // Create new inventory item
        const newItem = await inventoryService.createInventory(formattedData);
        setInventory(prev => [...prev, newItem]);
        toast.success('Inventory item created successfully');
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving inventory item:', error);
      toast.error('Failed to save inventory item');
    }
  };

  // Get unique tool types for filtering
  const getUniqueToolTypes = (): string[] => {
    const types = inventory.map(item => item.toolType);
    return [...new Set(types)];
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Render inventory cards
  const renderInventoryCards = () => {
    if (loading) {
      return Array(6).fill(0).map((_, index) => (
        <Card key={`skeleton-${index}`} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full mb-2" />
            <Skeleton className="h-7 w-1/3" />
          </CardContent>
          <CardFooter className="border-t p-4 bg-muted/50 flex justify-end gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
          </CardFooter>
        </Card>
      ));
    }

    if (filteredInventory.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No inventory items found</h3>
          {(searchQuery || typeFilter !== 'all') && (
            <Button
              variant="outline"
              className="mt-2"
              onClick={resetFilters}
            >
              <FilterX className="h-4 w-4 mr-2" />
              Reset filters
            </Button>
          )}
        </div>
      );
    }

    return filteredInventory.map((item) => (
      <Card key={item.toolId} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{item.toolName}</CardTitle>
            <Badge className="capitalize">
              {item.condition}
            </Badge>
          </div>
          <CardDescription>
            Type: {item.toolType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Quantity:</span>
              <span className="font-medium">{item.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="font-medium">${item.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Purchase Date:</span>
              <span className="text-sm">{formatDate(item.purchaseDate)}</span>
            </div>
            {item.vendorName && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vendor:</span>
                <span className="text-sm">{item.vendorName}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 bg-muted/50 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingInventory(item);
              setIsDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setInventoryToDelete(item)}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the tool "{item.toolName}".
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteInventory}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage tools, equipment, and supplies for your workshop.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingInventory ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
              <DialogDescription>
                {editingInventory 
                  ? 'Update the details of the existing tool in your inventory.' 
                  : 'Enter the details of the new tool to add to your inventory.'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="toolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tool Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Wrench Set" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="toolType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tool Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Hand Tool" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Fair">Fair</SelectItem>
                            <SelectItem value="Poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Purchase Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier Inc." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingInventory ? 'Update Tool' : 'Add Tool'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {getUniqueToolTypes().map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderInventoryCards()}
      </div>
    </div>
  );
}