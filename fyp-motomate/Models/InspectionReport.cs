using System;

namespace fyp_motomate.Models
{
    public class InspectionReport
    {
        public int InspectionReportId { get; set; }
        public int OrderId { get; set; }
        public int ServiceId { get; set; } // The specific inspection subtype
        public int MechanicId { get; set; }
        public string ReportData { get; set; } // JSON or structured fields
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}
