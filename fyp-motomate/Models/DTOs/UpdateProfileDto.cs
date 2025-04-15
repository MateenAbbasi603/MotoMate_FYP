using System.ComponentModel.DataAnnotations;

namespace fyp_motomate.Models.DTOs
{
    public class UpdateProfileDto
    {
        // Make all properties nullable to allow partial updates
        public string? Email { get; set; }
        
        public string? Name { get; set; }
        
        public string? Phone { get; set; }
        
        public string? Address { get; set; }
        
        public string? imgUrl { get; set; }
    }
}