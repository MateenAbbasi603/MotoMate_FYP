// Data/ApplicationDbContext.cs
using fyp_motomate.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System;

namespace fyp_motomate.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Inventory> Inventory { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ServiceHistory> ServiceHistories { get; set; }
        public DbSet<MechanicsPerformance> MechanicsPerformances { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Inspection> Inspections { get; set; }
        public DbSet<OrderService> OrderServices { get; set; }

        public DbSet<TransferToService> TransferToServices { get; set; }


        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(warnings =>
                warnings.Ignore(RelationalEventId.PendingModelChangesWarning));

            base.OnConfiguring(optionsBuilder);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<TransferToService>()
                .HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TransferToService>()
                .HasOne(t => t.Mechanic)
                .WithMany()
                .HasForeignKey(t => t.MechanicId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure unique constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Vehicle>()
                .HasIndex(v => v.LicensePlate)
                .IsUnique();

            // Configure enum-like constraints
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Service>()
                .Property(s => s.Category)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Appointment>()
                .Property(a => a.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Order>()
                .Property(o => o.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Inventory>()
                .Property(i => i.Condition)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Notification>()
                .Property(n => n.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<ServiceHistory>()
                .Property(sh => sh.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Method)
                .HasConversion<string>()
                .HasMaxLength(20);

            // Configure Inspection Status constraint
            modelBuilder.Entity<Inspection>()
                .Property(i => i.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            // Configure user relationships
            modelBuilder.Entity<User>()
                .HasMany(u => u.Vehicles)
                .WithOne(v => v.User)
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.CustomerAppointments)
                .WithOne(a => a.User)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Mechanic)
                .WithMany(u => u.MechanicAppointments)
                .HasForeignKey(a => a.MechanicId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Orders)
                .WithOne(o => o.User)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Reviews)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Notifications)
                .WithOne(n => n.User)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.ServiceHistories)
                .WithOne(sh => sh.User)
                .HasForeignKey(sh => sh.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasOne(u => u.MechanicPerformance)
                .WithOne(mp => mp.Mechanic)
                .HasForeignKey<MechanicsPerformance>(mp => mp.MechanicId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure vehicle relationships
            modelBuilder.Entity<Vehicle>()
                .HasMany(v => v.Appointments)
                .WithOne(a => a.Vehicle)
                .HasForeignKey(a => a.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Vehicle>()
                .HasMany(v => v.Orders)
                .WithOne(o => o.Vehicle)
                .HasForeignKey(o => o.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Vehicle>()
                .HasMany(v => v.ServiceHistories)
                .WithOne(sh => sh.Vehicle)
                .HasForeignKey(sh => sh.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure service relationships
            modelBuilder.Entity<Service>()
                .HasMany(s => s.Appointments)
                .WithOne(a => a.Service)
                .HasForeignKey(a => a.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Service>()
                .HasMany(s => s.Orders)
                .WithOne(o => o.Service)
                .HasForeignKey(o => o.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Service>()
                .HasMany(s => s.ServiceHistories)
                .WithOne(sh => sh.Service)
                .HasForeignKey(sh => sh.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure appointment relationships
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Invoice)
                .WithOne(i => i.Appointment)
                .HasForeignKey<Invoice>(i => i.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Appointment>()
                .HasMany(a => a.Reviews)
                .WithOne(r => r.Appointment)
                .HasForeignKey(r => r.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Invoice>()
                .HasMany(i => i.Payments)
                .WithOne(p => p.Invoice)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Order entity
            modelBuilder.Entity<Order>(entity =>
            {
                // Primary Key
                entity.HasKey(e => e.OrderId);

                // Properties
                entity.Property(e => e.Notes)
                    .HasColumnName("Notes")
                    .IsRequired(false);

                entity.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("pending");

                entity.Property(e => e.OrderDate)
                    .IsRequired()
                    .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(e => e.IncludesInspection)
                    .IsRequired()
                    .HasDefaultValue(true);

                entity.Property(e => e.TotalAmount)
                    .IsRequired()
                    .HasColumnType("decimal(10,2)");

                // Make ServiceId nullable in Order
                entity.Property(o => o.ServiceId)
                    .IsRequired(false);

                // Relationships - only define the user and vehicle relationships here,
                // since Service is already defined above and we want to avoid duplication
                entity.HasOne(d => d.User)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Orders_Users_UserId");

                entity.HasOne(d => d.Vehicle)
                    .WithMany(p => p.Orders)
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Orders_Vehicles_VehicleId");
            });

            // Configure Inspection entity
            modelBuilder.Entity<Inspection>(entity =>
            {
                // Primary Key
                entity.HasKey(e => e.InspectionId);

                // Configure User relationship (to prevent UserId1 shadow property)
                entity.HasOne(i => i.User)
                    .WithMany(u => u.Inspections)
                    .HasForeignKey(i => i.UserId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_Inspections_Users_UserId");

                // Configure Vehicle relationship
                entity.HasOne(i => i.Vehicle)
                    .WithMany()
                    .HasForeignKey(i => i.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_Inspections_Vehicles_VehicleId");

                // Configure Service relationship if your Inspection has one
                entity.HasOne(i => i.Service)
                    .WithMany()
                    .HasForeignKey(i => i.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_Inspections_Services_ServiceId");

                // Configure Order relationship - ONE relationship definition
                entity.HasOne(i => i.Order)
                    .WithOne(o => o.Inspection)
                    .HasForeignKey<Inspection>(i => i.OrderId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_Inspections_Orders_OrderId");
            });

            // Seed super admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    Username = "superadmin",
                    Password = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Email = "superadmin@example.com",
                    Role = "super_admin",
                    Name = "Super Admin",
                    Phone = "+1234567890",
                    Address = "Admin Headquarters",
                    imgUrl = "https://ui-avatars.com/api/?name=Super+Admin&background=random",
                    CreatedAt = new DateTime(2023, 1, 1),
                    UpdatedAt = new DateTime(2023, 1, 1)
                }
            );

            // Configure OrderService relationship
            modelBuilder.Entity<OrderService>()
                .HasOne(os => os.Order)
                .WithMany(o => o.OrderServices)
                .HasForeignKey(os => os.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderService>()
                .HasOne(os => os.Service)
                .WithMany()
                .HasForeignKey(os => os.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}