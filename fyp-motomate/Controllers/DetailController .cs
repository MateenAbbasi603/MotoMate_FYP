using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using fyp_motomate.Data;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DetailController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DetailController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class CombinedDetailsDto
        {
            public DetailUserDto? User { get; set; }
            public DetailVehicleDto? Vehicle { get; set; }
            public DetailServiceDto? Service { get; set; }
        }

        // Renamed from UserDetailsDto to DetailUserDto to avoid conflict
        public class DetailUserDto
        {
            [Required]
            public int UserId { get; set; }

            [Required]
            [StringLength(100)]
            public string Username { get; set; } = string.Empty;

            [Required]
            [EmailAddress]
            [StringLength(100)]
            public string Email { get; set; } = string.Empty;

            [Required]
            [StringLength(100)]
            public string Name { get; set; } = string.Empty;

            [Required]
            [StringLength(20)]
            public string Role { get; set; } = string.Empty;

            [StringLength(20)]
            public string? Phone { get; set; }
        }

        public class DetailVehicleDto
        {
            [Required]
            public int VehicleId { get; set; }

            [Required]
            [StringLength(50)]
            public string Make { get; set; } = string.Empty;

            [Required]
            [StringLength(50)]
            public string Model { get; set; } = string.Empty;

            [Required]
            [Range(1900, 2100)]
            public int Year { get; set; }

            [Required]
            [StringLength(20)]
            public string LicensePlate { get; set; } = string.Empty;
        }

        public class DetailServiceDto
        {
            [Required]
            public int ServiceId { get; set; }

            [Required]
            [StringLength(100)]
            public string ServiceName { get; set; } = string.Empty;

            [Required]
            [StringLength(20)]
            public string Category { get; set; } = string.Empty;

            [Required]
            [Range(0, double.MaxValue)]
            public decimal Price { get; set; }

            [StringLength(500)]
            public string? Description { get; set; }
        }

        /// <summary>
        /// Fetches combined details for User, Vehicle, and Service
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="serviceId">Service ID</param>
        /// <returns>Combined details DTO</returns>
        [HttpGet("combined-details")]
        [Authorize]
        [AllowAnonymous]
        public async Task<ActionResult<CombinedDetailsDto>> GetCombinedDetails(
            [FromQuery] int? userId, 
            [FromQuery] int? vehicleId, 
            [FromQuery] int? serviceId)
        {
            // Check if any ID is provided
            if (!userId.HasValue && !vehicleId.HasValue && !serviceId.HasValue)
            {
                return BadRequest("At least one ID (User, Vehicle, or Service) must be provided");
            }

            // Initialize the response object
            var combinedDetails = new CombinedDetailsDto();

            try 
            {
                // Fetch User details if UserId is provided
                if (userId.HasValue)
                {
                    combinedDetails.User = await FetchUserDetails(userId.Value);
                }

                // Fetch Vehicle details if VehicleId is provided
                if (vehicleId.HasValue)
                {
                    combinedDetails.Vehicle = await FetchVehicleDetails(vehicleId.Value);
                }

                // Fetch Service details if ServiceId is provided
                if (serviceId.HasValue)
                {
                    combinedDetails.Service = await FetchServiceDetails(serviceId.Value);
                }

                return Ok(combinedDetails);
            }
            catch (InvalidOperationException ex)
            {
                // Handle specific not found scenarios
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                // Log the exception (you would typically use a logging framework)
                return StatusCode(500, "An unexpected error occurred");
            }
        }

        private async Task<DetailUserDto> FetchUserDetails(int userId)
        {
            var user = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new DetailUserDto
                {
                    UserId = u.UserId,
                    Username = u.Username,
                    Email = u.Email,
                    Name = u.Name,
                    Role = u.Role,
                    Phone = u.Phone
                })
                .FirstOrDefaultAsync();

            return user ?? throw new InvalidOperationException($"User with ID {userId} not found");
        }

        private async Task<DetailVehicleDto> FetchVehicleDetails(int vehicleId)
        {
            var vehicle = await _context.Vehicles
                .Where(v => v.VehicleId == vehicleId)
                .Select(v => new DetailVehicleDto
                {
                    VehicleId = v.VehicleId,
                    Make = v.Make,
                    Model = v.Model,
                    Year = v.Year,
                    LicensePlate = v.LicensePlate
                })
                .FirstOrDefaultAsync();

            return vehicle ?? throw new InvalidOperationException($"Vehicle with ID {vehicleId} not found");
        }

        private async Task<DetailServiceDto> FetchServiceDetails(int serviceId)
        {
            var service = await _context.Services
                .Where(s => s.ServiceId == serviceId)
                .Select(s => new DetailServiceDto
                {
                    ServiceId = s.ServiceId,
                    ServiceName = s.ServiceName,
                    Category = s.Category,
                    Price = s.Price,
                    Description = s.Description
                })
                .FirstOrDefaultAsync();

            return service ?? throw new InvalidOperationException($"Service with ID {serviceId} not found");
        }
    }
}