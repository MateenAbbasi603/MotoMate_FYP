// Updated Order Model
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using System.Collections.Generic;

namespace fyp_motomate.Models
{
    public class Order
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OrderId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int VehicleId { get; set; }

        // Service ID is optional because some orders might be inspection-only
        public int? ServiceId { get; set; }

        // Flag to indicate if this order includes an inspection
        [Required]
        public bool IncludesInspection { get; set; } = true;

        [Required]
        public DateTime OrderDate { get; set; } = DateTime.Now;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, confirmed, in_progress, completed, cancelled

        [Required]

        public string? OrderType { get; set; } = "Online";


        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        // Make sure this property is annotated correctly to match the database column
        [Column("Notes")]
        public string Notes { get; set; }

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

        // Navigation property to related inspection
        [JsonIgnore]
        public virtual Inspection Inspection { get; set; }

        // Collection of additional services
        [JsonIgnore]
        public ICollection<OrderService> OrderServices { get; set; } = new List<OrderService>();
    }
}