using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace fyp_motomate.Models
{
    public class TransferToService
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TransferId { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int VehicleId { get; set; }
        
        [Required]
        public int ServiceId { get; set; }
        
        [Required]
        public int OrderId { get; set; }
        
        [Required]
        public DateTime OrderDate { get; set; }
        
        [Required]
        public int MechanicId { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; }
        
        public string Notes { get; set; }
        
        public string? ETA { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        // Navigation properties
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
        
        [ForeignKey("MechanicId")]
        [JsonIgnore]
        public virtual User Mechanic { get; set; }
    }
}