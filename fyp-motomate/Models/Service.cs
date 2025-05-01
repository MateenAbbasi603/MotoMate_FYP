// Models/Service.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace fyp_motomate.Models
{
 // Models/Service.cs
public class Service
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ServiceId { get; set; }

    [Required]
    [StringLength(100)]
    public string ServiceName { get; set; }

    [Required]
    [StringLength(20)]
    public string Category { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    public string Description { get; set; }
    
    // Add this property to match your database
    public string SubCategory { get; set; }

    // Navigation properties
    [JsonIgnore]
    public virtual ICollection<Appointment> Appointments { get; set; }

    [JsonIgnore]
    public virtual ICollection<Order> Orders { get; set; }

    [JsonIgnore] 
    public virtual ICollection<ServiceHistory> ServiceHistories { get; set; }
}
}