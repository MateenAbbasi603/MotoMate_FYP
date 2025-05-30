﻿// Models/User.cs
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

        [StringLength(255)]
        public string imgUrl { get; set; }

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

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

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

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime UpdatedAt { get; set; } = DateTime.Now;

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

        public DateTime CreatedAt { get; set; } = DateTime.Now;

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
    //     public DateTime OrderDate { get; set; } =DateTime.Now;

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

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        public string VendorName { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        // Navigation property for tool instances
        public virtual ICollection<ToolInstance> Instances { get; set; } = new List<ToolInstance>();
    }

    public class ToolInstance
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InstanceId { get; set; }

        [Required]
        public int ToolId { get; set; }

        [Required]
        [StringLength(50)]
        public string SerialNumber { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? LastUpdatedAt { get; set; }

        [ForeignKey("ToolId")]
        public virtual Inventory Tool { get; set; }
    }

    public class Review
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReviewId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int UserId { get; set; }

        // Review type can be "Workshop" or "Mechanic"
        [Required]
        [StringLength(20)]
        public string ReviewType { get; set; } = "Workshop";

        // Optional mechanic ID (only required for mechanic reviews)
        public int? MechanicId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        public string Comments { get; set; }

        public DateTime ReviewDate { get; set; } = DateTime.Now;

        // Foreign key relationships
        [ForeignKey("OrderId")]
        [JsonIgnore]
        public Order Order { get; set; }

        [ForeignKey("UserId")]
        [JsonIgnore]
        public User User { get; set; }

        [ForeignKey("MechanicId")]
        [JsonIgnore]
        public User Mechanic { get; set; }
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

        public DateTime CreatedAt { get; set; } = DateTime.Now;

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

        // New property
        public int? OrderId { get; set; }

        public int TotalJobs { get; set; } = 0;

        public int CompletedJobs { get; set; } = 0;

        [Column(TypeName = "decimal(3,2)")]
        public decimal Rating { get; set; } = 0;

        // Foreign key relationships
        [ForeignKey("MechanicId")]
        [JsonIgnore]
        public User Mechanic { get; set; }

        [ForeignKey("OrderId")]
        [JsonIgnore]
        public Order Order { get; set; }
    }


    public class Invoice
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InvoiceId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int UserId { get; set; }

        public int? AppointmentId { get; set; }

        public int? MechanicId { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal SubTotal { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TaxRate { get; set; } = 18.0m; // Default tax rate of 18%

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TaxAmount { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        public DateTime InvoiceDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } // issued, paid, overdue, cancelled

        public string Notes { get; set; }

        // Navigation properties
        [ForeignKey("OrderId")]
        [JsonIgnore]
        public Order Order { get; set; }

        [ForeignKey("UserId")]
        [JsonIgnore]
        public User User { get; set; }

        [ForeignKey("MechanicId")]
        [JsonIgnore]
        public User Mechanic { get; set; }

        [ForeignKey("AppointmentId")]
        [JsonIgnore]
        public Appointment Appointment { get; set; }

        public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();

        [JsonIgnore]
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
    public class InvoiceItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InvoiceItemId { get; set; }

        [Required]
        public int InvoiceId { get; set; }

        [Required]
        [StringLength(200)]
        public string Description { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal UnitPrice { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalPrice { get; set; }

        // Navigation properties
        [ForeignKey("InvoiceId")]
        [JsonIgnore]
        public Invoice Invoice { get; set; }
    }
    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentId { get; set; }

        [Required]
        public int InvoiceId { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; } = DateTime.Now;

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(20)]
        public string Method { get; set; }

        [StringLength(100)]
        public string ReceivedBy { get; set; } = "Admin";

        // Foreign key relationship
        [ForeignKey("InvoiceId")]
        public Invoice Invoice { get; set; }
    }
}