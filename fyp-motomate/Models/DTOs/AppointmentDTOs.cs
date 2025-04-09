using System;
using System.ComponentModel.DataAnnotations;

namespace fyp_motomate.Models.DTOs
{
    public class AppointmentResponseDto
    {
        public int AppointmentId { get; set; }
        public int OrderId { get; set; }
        public int UserId { get; set; }
        public int VehicleId { get; set; }
        public int? ServiceId { get; set; }
        public int MechanicId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string TimeSlot { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }

        // Related entities
        public UserDetailsDto User { get; set; }
        public UserDetailsDto Mechanic { get; set; }
        public VehicleDetailsDto Vehicle { get; set; }
        public ServiceDto Service { get; set; }
    }

    public class MechanicAvailabilityDto
    {
        public int MechanicId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class AppointmentRequest
    {
        [Required]
        public int OrderId { get; set; }

        [Required]
        public int MechanicId { get; set; }

        // These are now optional since they'll be taken from the order's inspection
        public DateTime? AppointmentDate { get; set; }
        public string TimeSlot { get; set; }

        public string Notes { get; set; }
    }

    public class AppointmentUpdateRequest
    {
        public int? MechanicId { get; set; }
        public DateTime? AppointmentDate { get; set; }
        public string TimeSlot { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
    }
}