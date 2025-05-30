'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  FilterX,
  Loader2,
  AlertTriangle,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  ArrowUpDown,
  Tag,
  Warehouse,
  Clock,
  BadgeDollarSign,
  Store,
  FileBarChart,
  ArrowUpCircle,
  ShoppingBag,
  Database,
  Filter,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CircleSlash,
  Sparkles,
  MoreHorizontal,
  PlusCircle,
  RefreshCw,
  EyeIcon,
  ToggleLeft,
  ToggleRight,
  ListTree,
  Power
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { InventoryFormData, InventoryItem, ToolInstance } from '../../../../../types/inventoryTypes';
import inventoryService from '../../../../../services/inventoryService';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toolInstanceService from '../../../../../services/toolInstanceService';

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
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [inventoryToDeactivate, setInventoryToDeactivate] = useState<InventoryItem | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [updatingInstance, setUpdatingInstance] = useState<number | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    categories: 0,
    inactiveItems: 0
  });

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
    filterAndSortInventory();
  }, [inventory, searchQuery, typeFilter, conditionFilter, statusFilter, sortBy, sortDirection]);

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
      form.setValue('quantity', editingInventory.totalQuantity);
      if (editingInventory.purchaseDate) {
        form.setValue('purchaseDate', new Date(editingInventory.purchaseDate));
      }
      form.setValue('condition', editingInventory.condition);
      form.setValue('price', editingInventory.price);
      form.setValue('vendorName', editingInventory.vendorName || '');
    }
  }, [editingInventory, form]);

  // Calculate stats whenever inventory changes
  useEffect(() => {
    if (inventory.length > 0) {
      calculateStats();
    }
  }, [inventory]);

  const calculateStats = () => {
    const totalItems = inventory.reduce((sum, item) => sum + item.totalQuantity, 0);
    const activeItems = inventory.reduce((sum, item) => sum + item.activeQuantity, 0);
    const inactiveItems = inventory.reduce((sum, item) => sum + item.inactiveQuantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.totalQuantity), 0);
    const lowStock = inventory.filter(item => item.activeQuantity < 3).length;
    const uniqueCategories = new Set(inventory.map(item => item.toolType)).size;

    setStats({
      totalItems,
      totalValue,
      lowStock,
      categories: uniqueCategories,
      inactiveItems
    });
  };

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
  
  const fetchInventoryDetails = async (toolId: number) => {
    try {
      const detailedItem = await inventoryService.getInventoryById(toolId);
      setSelectedInventory(detailedItem);
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch inventory details:', error);
      toast.error('Failed to load tool details');
    }
  };

  const filterAndSortInventory = () => {
    let filtered = [...inventory];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item =>
        item.toolType.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // Apply condition filter
    if (conditionFilter !== 'all') {
      filtered = filtered.filter(item =>
        item.condition.toLowerCase() === conditionFilter.toLowerCase()
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(item => item.activeQuantity > 0);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(item => item.inactiveQuantity > 0);
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.toolName.toLowerCase().includes(query) ||
        item.toolType.toLowerCase().includes(query) ||
        (item.vendorName && item.vendorName.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.toolName.localeCompare(b.toolName);
          break;
        case 'type':
          comparison = a.toolType.localeCompare(b.toolType);
          break;
        case 'quantity':
          comparison = a.totalQuantity - b.totalQuantity;
          break;
        case 'active':
          comparison = a.activeQuantity - b.activeQuantity;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'condition':
          comparison = a.condition.localeCompare(b.condition);
          break;
        default:
          comparison = a.toolName.localeCompare(b.toolName);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredInventory(filtered);
  };

  const handleDeactivateInventory = async () => {
    if (!inventoryToDeactivate) return;

    try {
      setIsDeactivating(true);
      await inventoryService.toggleInventoryActive(inventoryToDeactivate.toolId);

      // Update local state - mark as inactive
      setInventory(prevInventory =>
        prevInventory.map(item => 
          item.toolId === inventoryToDeactivate.toolId 
          ? { 
              ...item, 
              isActive: false,
              activeQuantity: 0,
              inactiveQuantity: item.totalQuantity
            } 
          : item
        )
      );

      toast.success('Inventory item deactivated successfully');
    } catch (error) {
      console.error('Error deactivating inventory item:', error);
      toast.error('Failed to deactivate inventory item');
    } finally {
      setInventoryToDeactivate(null);
      setIsDeactivating(false);
    }
  };
  
  const toggleToolInstanceStatus = async (instanceId: number, currentStatus: boolean) => {
    try {
      setUpdatingInstance(instanceId);
      await toolInstanceService.updateToolInstanceStatus(instanceId, !currentStatus);
      
      // Update the selected inventory
      if (selectedInventory && selectedInventory.instances) {
        const updatedInstances = selectedInventory.instances.map(instance => 
          instance.instanceId === instanceId 
          ? { ...instance, isActive: !currentStatus } 
          : instance
        );
        
        // Update active/inactive counts
        const activeCount = updatedInstances.filter(i => i.isActive).length;
        const inactiveCount = updatedInstances.length - activeCount;
        
        setSelectedInventory({
          ...selectedInventory,
          instances: updatedInstances,
          activeQuantity: activeCount,
          inactiveQuantity: inactiveCount
        });
        
        // Also update in the main inventory list
        setInventory(prev => 
          prev.map(item => 
            item.toolId === selectedInventory.toolId 
            ? {
                ...item,
                activeQuantity: activeCount,
                inactiveQuantity: inactiveCount
              }
            : item
          )
        );
      }
      
      const newStatus = !currentStatus ? 'active' : 'inactive';
      toast.success(`Tool instance marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating tool instance status:', error);
      toast.error('Failed to update tool instance status');
    } finally {
      setUpdatingInstance(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setConditionFilter('all');
    setStatusFilter('all');
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
          { ...formattedData, isActive: editingInventory.isActive }
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
    return [...new Set(types)].sort();
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get condition badge styling
  const getConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Sparkles className="h-3 w-3 mr-1" />
          New
        </Badge>;
      case 'good':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Good
        </Badge>;
      case 'fair':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Fair
        </Badge>;
      case 'poor':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Poor
        </Badge>;
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  // Get stock level indicator
  const getStockIndicator = (activeQuantity: number, inactiveQuantity: number) => {
    const totalQuantity = activeQuantity + inactiveQuantity;
    
    if (activeQuantity <= 0) {
      return <Badge variant="destructive" className="flex items-center gap-1 font-medium">
        <CircleSlash className="h-3 w-3" />
        All Inactive
      </Badge>;
    } else if (activeQuantity < 3) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 font-medium">
        <AlertCircle className="h-3 w-3" />
        Low Stock ({activeQuantity}/{totalQuantity})
      </Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 font-medium">
        <CheckCircle2 className="h-3 w-3" />
        In Stock ({activeQuantity}/{totalQuantity})
      </Badge>;
    }
  };

  // Toggle sort direction when clicking on the same sort option
  const handleSortChange = (value: string) => {
    if (value === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortDirection('asc');
    }
  };

  // Render inventory cards
  const renderInventoryCards = () => {
    if (loading) {
      return Array(6).fill(0).map((_, index) => (
        <Card key={`skeleton-${index}`} className="overflow-hidden border border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
          <CardFooter className="border-t p-4 bg-muted/30 flex justify-end gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
          </CardFooter>
        </Card>
      ));
    }

    if (filteredInventory.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg border border-border/50">
          <div className="bg-background rounded-full p-3 mb-4">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No inventory items found</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            {(searchQuery || typeFilter !== 'all' || conditionFilter !== 'all' || statusFilter !== 'all')
              ? "No items match your current search criteria and filters."
              : "There are no items in your inventory system yet."}
          </p>

          {(searchQuery || typeFilter !== 'all' || conditionFilter !== 'all' || statusFilter !== 'all') ? (
            <Button
              variant="outline"
              className="gap-2"
              onClick={resetFilters}
            >
              <FilterX className="h-4 w-4" />
              Reset filters
            </Button>
          ) : (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add First Tool
            </Button>
          )}
        </div>
      );
    }

    if (view === 'grid') {
      return filteredInventory.map((item) => (
        <Card key={item.toolId} className="overflow-hidden border border-border/40 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{item.toolName}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                  {item.toolType}
                </CardDescription>
              </div>
              {getConditionBadge(item.condition)}
            </div>
          </CardHeader>

          <CardContent className="pb-6">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex items-center">
                <Warehouse className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-xs text-muted-foreground">Active/Total</p>
                  <p className="font-medium">{item.activeQuantity}/{item.totalQuantity}</p>
                </div>
              </div>

              <div className="flex items-center">
                <BadgeDollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-xs text-muted-foreground">Price per Unit</p>
                  <p className="font-medium">{formatCurrency(item.price)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                <div>
                  <p className="text-xs text-muted-foreground">Purchase Date</p>
                  <p className="text-sm">{formatDate(item.purchaseDate)}</p>
                </div>
              </div>

              {item.vendorName && (
                <div className="flex items-center">
                  <Store className="h-4 w-4 text-muted-foreground mr-2" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vendor</p>
                    <p className="text-sm">{item.vendorName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              {getStockIndicator(item.activeQuantity, item.inactiveQuantity)}
            </div>
          </CardContent>

          <CardFooter className="border-t p-4 bg-muted/20 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInventoryDetails(item.toolId)}
              className="gap-1 h-9"
            >
              <EyeIcon className="h-4 w-4" />
              View Details
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingInventory(item);
                setIsDialogOpen(true);
              }}
              className="gap-1 h-9"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                {/* <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setInventoryToDeactivate(item)}
                  className="gap-1 h-9"
                >
                  <Power className="h-4 w-4" />
                  Deactivate
                </Button> */}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will deactivate all instances of "{item.toolName}".
                    Deactivated tools won't appear in regular inventory counts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivateInventory}
                    disabled={isDeactivating}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ));
    } else {
      // List view
      return (
        <Card className="col-span-full overflow-hidden border border-border/40 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium flex items-center"
                      onClick={() => handleSortChange('name')}
                    >
                      Tool Name
                      {sortBy === 'name' && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        />
                      )}
                    </Button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium flex items-center"
                      onClick={() => handleSortChange('type')}
                    >
                      Type
                      {sortBy === 'type' && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        />
                      )}
                    </Button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Condition</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium flex items-center ml-auto"
                      onClick={() => handleSortChange('active')}
                    >
                      Active/Total
                      {sortBy === 'active' && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        />
                      )}
                    </Button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium flex items-center ml-auto"
                      onClick={() => handleSortChange('price')}
                    >
                      Price
                      {sortBy === 'price' && (
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                        />
                      )}
                    </Button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInventory.map((item) => (
                  <tr key={item.toolId} className="hover:bg-muted/20">
                    <td className="px-4 py-3 align-middle">
                      <div className="font-medium">{item.toolName}</div>
                      {item.vendorName && (
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <Store className="h-3 w-3 mr-1" />
                          {item.vendorName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">{item.toolType}</td>
                    <td className="px-4 py-3 align-middle">{getConditionBadge(item.condition)}</td>
                    <td className="px-4 py-3 align-middle text-right font-medium">{item.activeQuantity}/{item.totalQuantity}</td>
                    <td className="px-4 py-3 align-middle text-right font-medium">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3 align-middle text-right">{getStockIndicator(item.activeQuantity, item.inactiveQuantity)}</td>
                    <td className="px-4 py-3 align-middle text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => fetchInventoryDetails(item.toolId)}
                            className="gap-2"
                          >
                            <EyeIcon className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingInventory(item);
                              setIsDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setInventoryToDeactivate(item)}
                            className="text-destructive focus:text-destructive gap-2"
                          >
                            <Power className="h-4 w-4" />
                            Deactivate All
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialog>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will deactivate all instances of "{item.toolName}".
                              Deactivated tools won't appear in regular inventory counts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeactivateInventory}
                              disabled={isDeactivating}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      );
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage tools, equipment, and supplies for your workshop
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Add New Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader className="space-y-1">
              <DialogTitle>{editingInventory ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
              <DialogDescription>
                {editingInventory
                  ? 'Update the details of the existing tool in your inventory.'
                  : 'Enter the details of the new tool to add to your inventory.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
                <div className="grid grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="toolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tool Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Wrench Set" {...field} className="shadow-sm" />
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
                          <Input placeholder="Hand Tool" {...field} className="shadow-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
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
                            className="shadow-sm"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                        {editingInventory && (
                          <FormDescription>
                            Adding more will create new instances
                          </FormDescription>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Unit</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-muted-foreground">Rs</span>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="pl-7 shadow-sm"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
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
                            <SelectTrigger className="shadow-sm">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="New" className="flex items-center">
                              <div className="flex items-center">
                                <Sparkles className="h-4 w-4 text-green-500 mr-2" />
                                <span>New</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Good">
                              <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2" />
                                <span>Good</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Fair">
                              <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                                <span>Fair</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Poor">
                              <div className="flex items-center">
                                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                <span>Poor</span>
                              </div>
                            </SelectItem>
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
                                  "pl-3 text-left font-normal shadow-sm",
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
                        <Input
                          placeholder="Supplier Inc."
                          {...field}
                          value={field.value || ''}
                          className="shadow-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="shadow-sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="shadow-sm gap-2">
                    {editingInventory ? (
                      <>
                        <Pencil className="h-4 w-4" />
                        Update Tool
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4" />
                        Add Tool
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tool Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-1">
            <DialogTitle className="flex items-center">
              {selectedInventory?.toolName}
              <Badge variant="outline" className="ml-3">
                {selectedInventory?.toolType}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Manage individual instances of this tool
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 grid grid-cols-2 gap-5">
            <div>
              <Label className="text-sm text-muted-foreground">Purchase Date</Label>
              <p className="text-sm font-medium">{selectedInventory?.purchaseDate ? formatDate(selectedInventory.purchaseDate) : 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Condition</Label>
              <div className="mt-1">
                {selectedInventory && getConditionBadge(selectedInventory.condition)}
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Price per Unit</Label>
              <p className="text-sm font-medium">{selectedInventory ? formatCurrency(selectedInventory.price) : 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Vendor</Label>
              <p className="text-sm font-medium">{selectedInventory?.vendorName || 'N/A'}</p>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="font-medium text-sm mb-2">
              Tool Instances ({selectedInventory?.activeQuantity || 0} active of {selectedInventory?.totalQuantity || 0} total)
            </h3>
            
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInventory?.instances?.map((instance) => (
                    <TableRow key={instance.instanceId}>
                      <TableCell className="font-mono text-xs">
                        {instance.serialNumber}
                      </TableCell>
                      <TableCell>
                        {instance.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <CircleSlash className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(instance.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleToolInstanceStatus(instance.instanceId, instance.isActive)}
                          disabled={updatingInstance === instance.instanceId}
                          className="h-8 gap-1"
                        >
                          {updatingInstance === instance.instanceId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : instance.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-red-500" />
                          )}
                          {instance.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!selectedInventory?.instances?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No instances found for this tool
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="shadow-sm"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEditingInventory(selectedInventory);
                setIsDetailsDialogOpen(false);
                setIsDialogOpen(true);
              }}
              className="shadow-sm gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border border-border/40 overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-50/20 dark:from-blue-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {filteredInventory.length} unique tools
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/40 overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-50/20 dark:from-green-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <BadgeDollarSign className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current inventory valuation
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/40 overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-50/20 dark:from-amber-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items with active count below 3
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/40 overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-purple-50/20 dark:from-purple-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique tool categories
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border border-border/40 overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-red-50 to-red-50/20 dark:from-red-950/20 dark:to-transparent">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <CircleSlash className="h-4 w-4" />
              Inactive Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.inactiveItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items marked as inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="shadow-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-grow">
            <div className="relative flex-grow maxw-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                className="pl-9 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px] shadow-sm">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
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

              <Select
                value={conditionFilter}
                onValueChange={setConditionFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px] shadow-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px] shadow-sm">
                  <Power className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Has Inactive</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || typeFilter !== 'all' || conditionFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetFilters}
                  className="shadow-sm h-10 w-10"
                  title="Reset filters"
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[150px] shadow-sm">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="quantity">Total Quantity</SelectItem>
                <SelectItem value="active">Active Quantity</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="condition">Condition</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="shadow-sm h-10 w-10"
              title={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
              />
            </Button>

            <div className="border-l border-border/50 pl-2 flex items-center gap-2">
              <Button
                variant={view === 'grid' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setView('grid')}
                className="shadow-sm h-10 w-10"
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setView('list')}
                className="shadow-sm h-10 w-10"
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {!loading && filteredInventory.length > 0 && (
          <div className="flex justify-between items-center px-1">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{filteredInventory.length}</span> of <span className="font-medium">{inventory.length}</span> items
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchInventory}
              className="text-muted-foreground gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        )}
      </div>

      <div className={`grid gap-6 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {renderInventoryCards()}
      </div>
    </div>
  );
}