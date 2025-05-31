// Models/Service.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace fyp_motomate.Models
{
  public class InspectionOrderRequest
{
    [Required]
    public int VehicleId { get; set; }

    [Required]
    public int InspectionTypeId { get; set; }

    public int? ServiceId { get; set; }

    [Required]
    public DateTime InspectionDate { get; set; }

    [Required]
    public string TimeSlot { get; set; }

    public string Notes { get; set; }

    public string paymentMethod { get; set; }
}
}