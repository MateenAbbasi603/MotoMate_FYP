// Models/Inspection.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace fyp_motomate.Models
{
    public class Inspection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InspectionId { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int VehicleId { get; set; }
        
        [Required]
        public int ServiceId { get; set; }
        
        [Required]
        public DateTime ScheduledDate { get; set; }
        
        [Required]
        [StringLength(50)]
        public string TimeSlot { get; set; } = "09:00 AM - 11:00 AM";
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, in_progress, completed, cancelled
        
        public string Notes { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? CompletedAt { get; set; }
        
        // Inspection report details
        public string EngineCondition { get; set; }
        
        public string TransmissionCondition { get; set; }
        
        public string BrakeCondition { get; set; }
        
        public string ElectricalCondition { get; set; }
        
        public string BodyCondition { get; set; }
        
        public string TireCondition { get; set; }
        
        // Link to the order
        public int OrderId { get; set; }
        
        // Foreign key relationships
        [ForeignKey("UserId")]
        [JsonIgnore]
        public virtual User User { get; set; }
        
        [ForeignKey("VehicleId")]
        [JsonIgnore]
        public virtual Vehicle Vehicle { get; set; }
        
        [ForeignKey("ServiceId")]
        [JsonIgnore]
        public virtual Service Service { get; set; }
        
        [ForeignKey("OrderId")]
        [JsonIgnore]
        public virtual Order Order { get; set; }
    }
}