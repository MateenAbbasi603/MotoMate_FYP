"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Car,
  Pencil,
  Trash2,
  PlusCircle,
  Loader2,
  AlertCircle,
  Info,
  ArrowRight
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your vehicles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-3xl mx-auto shadow-md">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Error Loading Vehicles</AlertTitle>
        <AlertDescription className="mt-2">{error}</AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="text-center p-8 max-w-3xl mx-auto shadow-lg border-dashed">
        <CardHeader>
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-2">
            <Car className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold mt-2">No Vehicles Found</CardTitle>
          <CardDescription className="text-base mt-2">
            You haven't added any vehicles to your account yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 my-4">
            <h3 className="font-medium text-lg mb-2">Why add a vehicle?</h3>
            <ul className="text-left text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Schedule service appointments with correct vehicle details</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Track maintenance history for each of your vehicles</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Receive model-specific maintenance reminders</span>
              </li>
            </ul>
          </div>
          <Button
            onClick={() => router.push("/vehicles/add")}
            size="lg"
            className="mt-4 group transition-all duration-300 hover:shadow-md"
          >
            <PlusCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            Add Your First Vehicle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Vehicles</h1>
          <p className="text-muted-foreground mt-1">Manage and maintain your registered vehicles</p>
        </div>
        <Button
          onClick={() => router.push("/vehicles/add")}
          className="group transition-all duration-300"
          size="lg"
        >
          <PlusCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
          Add New Vehicle
        </Button>
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card
            key={vehicle.vehicleId}
            className="overflow-hidden hover:shadow-md transition-all duration-300 border-muted-foreground/20"
          >
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
                {vehicle.year}
              </Badge>
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                {vehicle.make} {vehicle.model}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center">
                        <Info className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>License: {vehicle.licensePlate}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Vehicle registration plate</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-32 flex items-center justify-center bg-muted/30 rounded-lg my-2">
                <Car className="h-20 w-20 text-primary/70" />
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex justify-between py-4 mt-2">
          
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={() => setVehicleToDelete(vehicle)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-[425px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                    <AlertDialogDescription className="pt-2">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded mb-2">
                        <Car className="h-6 w-6 text-primary" />
                        <span className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                      </div>
                      <p>This will permanently remove this vehicle from your account. Any service history for this vehicle will also be deleted.</p>
                      <p className="mt-2">This action cannot be undone.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteVehicle}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isDeleting ? "Deleting..." : "Delete Vehicle"}
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