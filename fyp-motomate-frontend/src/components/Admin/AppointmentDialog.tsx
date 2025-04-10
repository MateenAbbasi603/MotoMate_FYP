// AppointmentDialog.jsx
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Clock } from "lucide-react";
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5177';

export default function AppointmentDialog({ 
  isOpen, 
  onClose, 
  order,
  onAppointmentCreated
}:{isOpen:boolean, onClose:()=>void, order:any, onAppointmentCreated:(appointment:any)=>void}) {
  const [mechanicId, setMechanicId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);
  
  // Extract date and time slot from the order
// console.log(order,"order");


  const inspectionDate = order?.inspection?.scheduledDate;
  const timeSlot = order?.inspection?.timeSlot;
  
  // Format date for display
  const formattedDate = inspectionDate ? format(new Date(inspectionDate), 'MMMM d, yyyy') : 'N/A';

  // Get available mechanics for the inspection date and time slot
  useEffect(() => {
    const fetchAvailableMechanics = async () => {
      if (!isOpen || !inspectionDate || !timeSlot) return;
      
      try {
        setLoadingMechanics(true);
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to continue');
          return;
        }

        const response = await axios.get(
          `${API_URL}/api/Appointments/mechanics/available?date=${format(new Date(inspectionDate), 'yyyy-MM-dd')}&timeSlot=${timeSlot}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Extract mechanics from response
        let mechanicsData = [];
        if (response.data && Array.isArray(response.data)) {
          mechanicsData = response.data;
        } else if (response.data && response.data.$values) {
          mechanicsData = response.data.$values;
        }
        
        setMechanics(mechanicsData);
      } catch (error) {
        console.error('Error fetching available mechanics:', error);
        toast.error('Failed to fetch available mechanics');
      } finally {
        setLoadingMechanics(false);
      }
    };

    fetchAvailableMechanics();
  }, [isOpen, inspectionDate, timeSlot]);

  const handleSubmit = async () => {
    if (!mechanicId) {
      toast.error('Please select a mechanic');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to continue');
        return;
      }

      const appointmentData = {
        orderId: order.orderId,
        mechanicId: parseInt(mechanicId),
        notes: notes,
        TimeSlot: timeSlot,
        // Note: We don't need to send date and time slot as they'll be 
        // taken from the order's inspection in the backend
      };

      const response = await axios.post(
        `${API_URL}/api/Appointments`,
        appointmentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Mechanic assigned successfully');
      onAppointmentCreated(response.data);
      onClose();
    } catch (error:any) {
      console.error('Error assigning mechanic:', error);
      toast.error(error.response?.data?.message || 'Failed to assign mechanic');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMechanicId("");
    setNotes("");
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Mechanic to Order</DialogTitle>
          <DialogDescription>
            Assign a mechanic to perform the service for this order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Display the already scheduled date and time */}
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              <Label className="text-blue-600">Scheduled Date:</Label>
              <span className="ml-2 font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              <Label className="text-blue-600">Time Slot:</Label>
              <span className="ml-2 font-medium">{timeSlot || 'N/A'}</span>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="mechanic">Select Mechanic</Label>
            <Select 
              value={mechanicId}
              onValueChange={setMechanicId}
              disabled={loadingMechanics}
            >
              <SelectTrigger id="mechanic">
                <SelectValue placeholder={loadingMechanics ? "Loading..." : "Select a mechanic"} />
              </SelectTrigger>
              <SelectContent>
                {loadingMechanics ? (
                  <SelectItem value="loading" disabled>
                    Loading mechanics...
                  </SelectItem>
                ) : mechanics.length > 0 ? (
                  mechanics.map((mechanic:any) => (
                    <SelectItem 
                      key={mechanic.mechanicId} 
                      value={mechanic.mechanicId.toString()}
                      disabled={!mechanic.isAvailable}
                    >
                      {mechanic.name} {!mechanic.isAvailable ? "(Not Available)" : ""}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-mechanics" disabled>
                    No mechanics available for this time slot
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !mechanicId}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Mechanic"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}