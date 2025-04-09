// Models/User.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace fyp_motomate.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string Username { get; set; }

        [Required]
        [StringLength(255)]
        public string Password { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        [StringLength(20)]
        public string Role { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(20)]
        public string Phone { get; set; }

        [StringLength(255)]
        public string Address { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Vehicle> Vehicles { get; set; }
        public ICollection<Appointment> CustomerAppointments { get; set; }
        public ICollection<Appointment> MechanicAppointments { get; set; }
        public ICollection<Order> Orders { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public ICollection<Notification> Notifications { get; set; }
        public ICollection<ServiceHistory> ServiceHistories { get; set; }
        public MechanicsPerformance MechanicPerformance { get; set; }
                public virtual ICollection<Inspection> Inspections { get; set; }

    }

    public class Vehicle
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VehicleId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string Make { get; set; }

        [Required]
        [StringLength(50)]
        public string Model { get; set; }

        [Required]
        public int Year { get; set; }

        [Required]
        [StringLength(20)]
        public string LicensePlate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key relationship
        [ForeignKey("UserId")]
        public User User { get; set; }

        // Navigation properties
        public ICollection<Appointment> Appointments { get; set; }
        public ICollection<Order> Orders { get; set; }
        public ICollection<ServiceHistory> ServiceHistories { get; set; }
    }

    // public class Service
    // {
    //     [Key]
    //     [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    //     public int ServiceId { get; set; }

    //     [Required]
    //     [StringLength(100)]
    //     public string ServiceName { get; set; }

    //     [Required]
    //     [StringLength(20)]
    //     public string Category { get; set; }

    //     [Required]
    //     [Column(TypeName = "decimal(10,2)")]
    //     public decimal Price { get; set; }

    //     public string Description { get; set; }

    //     // Navigation properties
    //     public ICollection<Appointment> Appointments { get; set; }
    //     public ICollection<Order> Orders { get; set; }
    //     public ICollection<ServiceHistory> ServiceHistories { get; set; }
    // }

    public class Appointment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AppointmentId { get; set; }
    
    [Required]
    public int OrderId { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    [Required]
    public int VehicleId { get; set; }
    
    public int? ServiceId { get; set; }
    
    [Required]
    public int MechanicId { get; set; }
    
    [Required]
    public DateTime AppointmentDate { get; set; }
    
    [Required]
    [StringLength(20)]
    public string TimeSlot { get; set; }
    
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = "scheduled"; // scheduled, in_progress, completed, cancelled
    
    public string Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Foreign key relationships
    [ForeignKey("OrderId")]
    [JsonIgnore]
    public virtual Order Order { get; set; }
    
    [ForeignKey("UserId")]
    [JsonIgnore]
    public virtual User User { get; set; } // Renamed from User to Customer for DbContext compatibility
    
    [ForeignKey("VehicleId")]
    [JsonIgnore]
    public virtual Vehicle Vehicle { get; set; }
    
    [ForeignKey("ServiceId")]
    [JsonIgnore]
    public virtual Service Service { get; set; }
    
    [ForeignKey("MechanicId")]
    [JsonIgnore]
    public virtual User Mechanic { get; set; }
    
    // Navigation properties
    [JsonIgnore]
    public virtual Invoice Invoice { get; set; } // Added this
    
    [JsonIgnore]
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>(); // Added this
}

    // public class Order
    // {
    //     [Key]
    //     [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    //     public int OrderId { get; set; }

    //     [Required]
    //     public int UserId { get; set; }

    //     [Required]
    //     public int VehicleId { get; set; }

    //     [Required]
    //     public int ServiceId { get; set; }

    //     [Required]
    //     public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    //     [Required]
    //     [StringLength(20)]
    //     public string Status { get; set; }

    //     [Required]
    //     [Column(TypeName = "decimal(10,2)")]
    //     public decimal TotalAmount { get; set; }

    //     // Foreign key relationships
    //     [ForeignKey("UserId")]
    //     public User User { get; set; }

    //     [ForeignKey("VehicleId")]
    //     public Vehicle Vehicle { get; set; }

    //     [ForeignKey("ServiceId")]
    //     public Service Service { get; set; }
    // }

    public class Inventory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ToolId { get; set; }

        [Required]
        [StringLength(100)]
        public string ToolName { get; set; }

        [Required]
        [StringLength(50)]
        public string ToolType { get; set; }

        [Required]
        public int Quantity { get; set; }

        public DateTime? PurchaseDate { get; set; }

        [Required]
        [StringLength(20)]
        public string Condition { get; set; }
    }

    public class Review
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReviewId { get; set; }

        [Required]
        public int AppointmentId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        public string Comments { get; set; }

        public DateTime ReviewDate { get; set; } = DateTime.UtcNow;

        // Foreign key relationships
        [ForeignKey("AppointmentId")]
        public Appointment Appointment { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }
    }

    public class Notification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int NotificationId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public string Message { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "unread";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key relationship
        [ForeignKey("UserId")]
        public User User { get; set; }
    }

    public class ServiceHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int HistoryId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int VehicleId { get; set; }

        [Required]
        public int ServiceId { get; set; }

        [Required]
        public DateTime AppointmentDate { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; }

        // Foreign key relationships
        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("VehicleId")]
        public Vehicle Vehicle { get; set; }

        [ForeignKey("ServiceId")]
        public Service Service { get; set; }
    }

    public class MechanicsPerformance
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PerformanceId { get; set; }

        [Required]
        public int MechanicId { get; set; }

        public int TotalJobs { get; set; } = 0;

        public int CompletedJobs { get; set; } = 0;

        [Column(TypeName = "decimal(3,2)")]
        public decimal Rating { get; set; } = 0;

        // Foreign key relationship
        [ForeignKey("MechanicId")]
        public User Mechanic { get; set; }
    }

    public class Invoice
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InvoiceId { get; set; }

        [Required]
        public int AppointmentId { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;

        // Foreign key relationship
        [ForeignKey("AppointmentId")]
        public Appointment Appointment { get; set; }

        // Navigation properties
        public ICollection<Payment> Payments { get; set; }
    }

    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentId { get; set; }

        [Required]
        public int InvoiceId { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(20)]
        public string Method { get; set; }

        // Foreign key relationship
        [ForeignKey("InvoiceId")]
        public Invoice Invoice { get; set; }
    }
}