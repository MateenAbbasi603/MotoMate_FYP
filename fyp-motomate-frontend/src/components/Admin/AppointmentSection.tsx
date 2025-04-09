import { Button } from "react-day-picker";


export const AppointmentSection = ({ appointment, loadingAppointment }:any) => {
    if (loadingAppointment) {
      return (
        <div className="flex items-center justify-center p-4 bg-muted/50 rounded-md">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <p>Loading appointment information...</p>
        </div>
      );
    }
    
    if (!appointment) {
      return (
        <div className="p-4 bg-muted/50 rounded-md">
          <p className="text-muted-foreground">No mechanic has been assigned to this order yet.</p>
          <Button 
            onClick={() => setIsAppointmentDialogOpen(true)} 
            className="mt-3"
            variant="outline"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Assign Mechanic
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-blue-50 rounded-md">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Appointment Date</p>
              <p className="font-medium">{formatDate(appointment.appointmentDate)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600">Time Slot</p>
              <p className="font-medium">{appointment.timeSlot}</p>
            </div>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        
        <div className="bg-muted/50 p-4 rounded-md">
          <h4 className="font-medium mb-3 flex items-center">
            <UserCheck className="mr-2 h-4 w-4 text-primary" />
            Assigned Mechanic
          </h4>
          {appointment.mechanic ? (
            <div className="space-y-2">
              <p className="font-medium">{appointment.mechanic.name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{appointment.mechanic.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{appointment.mechanic.phone}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Mechanic information not available</p>
          )}
          
          {appointment.notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-1">Appointment Notes</p>
              <p className="text-sm">{appointment.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  