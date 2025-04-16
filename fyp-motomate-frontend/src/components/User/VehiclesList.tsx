"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Car, 
  Pencil, 
  Trash, 
  Plus,
  Loader2,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import apiClient from '../../../services/apiClient';

interface Vehicle {
  vehicleId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

export default function VehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();

  // Fetch user's vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get('/api/vehicles');
        console.log('Fetched vehicles:', response.data);
        
        if (Array.isArray(response.data)) {
          setVehicles(response.data);
        } else {
          console.error('Unexpected data format:', response.data);
          setError('Received invalid data format from server');
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setError("Failed to load your vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    try {
      setIsDeleting(true);
      
      await apiClient.delete(`/api/vehicles/${vehicleToDelete.vehicleId}`);
      
      // Update local state
      setVehicles(vehicles.filter(v => v.vehicleId !== vehicleToDelete.vehicleId));
      toast.success("Vehicle deleted successfully");
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Failed to delete vehicle");
    } finally {
      setVehicleToDelete(null);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="text-center p-6">
        <CardHeader>
          <CardTitle>No Vehicles Found</CardTitle>
          <CardDescription>
            You have not added any vehicles yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="mb-4">
            Add your first vehicle to get started with our services.
          </p>
          <Button onClick={() => router.push("/vehicles/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Vehicles</h1>
        <Button onClick={() => router.push("/vehicles/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.vehicleId}>
            <CardHeader>
              <CardTitle>{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
              <CardDescription>License: {vehicle.licensePlate}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-16 flex items-center justify-center">
                <Car className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/vehicles/edit/${vehicle.vehicleId}`)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setVehicleToDelete(vehicle)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your {vehicle.year} {vehicle.make} {vehicle.model}. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteVehicle}
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
        ))}
      </div>
    </div>
  );
}