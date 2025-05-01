using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace fyp_motomate.Models.DTOs
{
    // Request DTOs
    public class OrderRequest
    {
        public int UserId { get; set; }
        public int VehicleId { get; set; }
        public int? ServiceId { get; set; }
        public bool IncludesInspection { get; set; } = true;
        public DateTime? InspectionDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; }
    }

    public class OrderUpdateRequest
    {
        public string Status { get; set; }
        public int? ServiceId { get; set; }
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; }
    }

    // Response DTOs
    public class UserDetailsDto
    {
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
    }

    public class VehicleDetailsDto
    {
        public int VehicleId { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
        public string LicensePlate { get; set; }
    }

    public class ServiceDto
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }

        public string SubCategory { get; set; }

    }

    public class InspectionDetailsDto
    {
        public int InspectionId { get; set; }
        public int ServiceId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Status { get; set; }

        public string ServiceName { get; set; }
        public string SubCategory { get; set; }

        public string TimeSlot { get; set; }
        public string BodyCondition { get; set; }
        public string EngineCondition { get; set; }
        public string ElectricalCondition { get; set; }
        public string TireCondition { get; set; }
        public string BrakeCondition { get; set; }
        public string TransmissionCondition { get; set; }
        public string Notes { get; set; }
        public decimal? Price { get; set; }
    }

    public class OrderResponseDto
    {
        public int OrderId { get; set; }
        public int UserId { get; set; }
        public int VehicleId { get; set; }
        public int? ServiceId { get; set; }
        public bool IncludesInspection { get; set; }
        public DateTime OrderDate { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; }

        // Related entities
        public UserDetailsDto User { get; set; }
        public VehicleDetailsDto Vehicle { get; set; }
        public ServiceDto Service { get; set; }
        public InspectionDetailsDto Inspection { get; set; }
        public List<ServiceDto> AdditionalServices { get; set; } = new List<ServiceDto>();
    }
}