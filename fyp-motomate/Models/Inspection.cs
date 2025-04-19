using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fyp_motomate.Models
{
    public class Inspection
    {
        [Key]
        public int InspectionId { get; set; }
        
        public int UserId { get; set; }
        
        public int VehicleId { get; set; }
        
        public int ServiceId { get; set; }
        
        public int? OrderId { get; set; }

        public int MechanicId {get;set;}
        
        [Required]
        public DateTime ScheduledDate { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string TimeSlot { get; set; }
        
        [Required]
        [MaxLength(40)]
        public string Status { get; set; }
        
        [Required]
        public string Notes { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; }
        
        public DateTime? CompletedAt { get; set; }
        
        [Required]
        public string EngineCondition { get; set; }
        
        [Required]
        public string TransmissionCondition { get; set; }
        
        [Required]
        public string BrakeCondition { get; set; }
        
        [Required]
        public string ElectricalCondition { get; set; }
        
        [Required]
        public string BodyCondition { get; set; }
        
        [Required]
        public string TireCondition { get; set; } // Note: singular "Tire", not "Tires"
        
        [Required]
        [MaxLength(200)]
        public string InteriorCondition { get; set; } = "Not Inspected Yet";
        
        [Required]
        [MaxLength(200)]
        public string SuspensionCondition { get; set; } = "Not Inspected Yet";
        
        [Required]
        [MaxLength(200)]
        public string TiresCondition { get; set; } = "Not Inspected Yet";
        
        // Navigation properties
        public User User { get; set; }
        public Vehicle Vehicle { get; set; }
        public Service Service { get; set; }
        public Order Order { get; set; }
    }
}