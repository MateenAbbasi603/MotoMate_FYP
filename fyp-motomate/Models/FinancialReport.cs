using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fyp_motomate.Models
{
    public class FinancialReport
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReportId { get; set; }

        [Required]
        [StringLength(100)]
        public string ReportName { get; set; }

        [Required]
        [StringLength(50)]
        public string ReportType { get; set; } // Weekly, Monthly, Yearly

        [Required]
        [StringLength(50)]
        public string ReportCategory { get; set; } // Sales, SalesWithTax, SalesWithoutTax, Inventory

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalRevenue { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalTax { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal NetRevenue { get; set; }

        public int TotalInvoices { get; set; }

        public int TotalItems { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal InventoryValue { get; set; }

        public string ReportData { get; set; } // JSON data for detailed breakdown

        [Required]
        public int GeneratedBy { get; set; }

        [Required]
        public DateTime GeneratedAt { get; set; } = DateTime.Now;

        [StringLength(500)]
        public string Notes { get; set; }

        // Navigation properties
        [ForeignKey("GeneratedBy")]
        public User GeneratedByUser { get; set; }
    }

    // DTOs for report generation
    public class GenerateReportRequest
    {
        [Required]
        public string ReportType { get; set; } // Weekly, Monthly, Yearly

        [Required]
        public string ReportCategory { get; set; } // Sales, SalesWithTax, SalesWithoutTax, Inventory

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public string Notes { get; set; }
    }

    public class ReportSummaryDto
    {
        public int ReportId { get; set; }
        public string ReportName { get; set; }
        public string ReportType { get; set; }
        public string ReportCategory { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalTax { get; set; }
        public decimal NetRevenue { get; set; }
        public int TotalInvoices { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string GeneratedByName { get; set; }
    }

    public class DetailedReportDto
    {
        public int ReportId { get; set; }
        public string ReportName { get; set; }
        public string ReportType { get; set; }
        public string ReportCategory { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalTax { get; set; }
        public decimal NetRevenue { get; set; }
        public int TotalInvoices { get; set; }
        public int TotalItems { get; set; }
        public decimal InventoryValue { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string GeneratedByName { get; set; }
        public string Notes { get; set; }
        public object ReportData { get; set; } // Parsed JSON data
    }
}