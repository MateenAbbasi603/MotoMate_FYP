using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fyp_motomate.Models
{
    public class OrderService
    {
        [Key]
        public int OrderServiceId { get; set; }
        
        [Required]
        public int OrderId { get; set; }
        
        [Required]
        public int ServiceId { get; set; }
        
        [Required]
        public DateTime AddedAt { get; set; }
        
        public string Notes { get; set; }
        
        // Navigation properties
        [ForeignKey("OrderId")]
        public Order Order { get; set; }
        
        [ForeignKey("ServiceId")]
        public Service Service { get; set; }
    }
}