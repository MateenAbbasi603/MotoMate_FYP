// Models/DTOs/AuthDTOs.cs
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
}