// Controllers/CustomerDashboardController.cs
using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CustomerDashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CustomerDashboardController> _logger;

        public CustomerDashboardController(ApplicationDbContext context, ILogger<CustomerDashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/CustomerDashboard
        [HttpGet]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<CustomerDashboardResponse>> GetCustomerDashboard()
        {
            try
            {
                // Get user ID from token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                _logger.LogInformation("Fetching dashboard data for user ID: {UserId}", userId);

                // Get user information - simple query
                var user = await _context.Users
                    .Where(u => u.UserId == userId)
                    .Select(u => new UserInfoDto
                    {
                        UserId = u.UserId,
                        Name = u.Name,
                        Email = u.Email,
                        Phone = u.Phone,
                        Address = u.Address,
                        ImgUrl = u.imgUrl ?? ""
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Get user's vehicles - simple query
                var vehicles = await _context.Vehicles
                    .Where(v => v.UserId == userId)
                    .Select(v => new VehicleDto
                    {
                        VehicleId = v.VehicleId,
                        Make = v.Make,
                        Model = v.Model,
                        Year = v.Year,
                        LicensePlate = v.LicensePlate,
                        CreatedAt = v.CreatedAt
                    })
                    .ToListAsync();

                // Get user's orders - simple query without any joins
                var orders = await _context.Orders
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                // Build simple order DTOs without related data
                var orderDtos = orders.Select(order => new OrderDto
                {
                    OrderId = order.OrderId,
                    UserId = order.UserId,
                    VehicleId = order.VehicleId,
                    ServiceId = order.ServiceId,
                    IncludesInspection = order.IncludesInspection,
                    OrderDate = order.OrderDate,
                    Status = order.Status,
                    TotalAmount = order.TotalAmount,
                    Notes = order.Notes,
                    Vehicle = null,
                    Service = null,
                    AdditionalServices = new List<ServiceDto1>()
                }).ToList();

                // Calculate basic statistics
                var stats = new DashboardStatsDto
                {
                    TotalOrders = orders.Count,
                    CompletedOrders = orders.Count(o => o.Status.ToLower() == "completed"),
                    PendingOrders = orders.Count(o => o.Status.ToLower() == "pending"),
                    InProgressOrders = orders.Count(o => o.Status.ToLower() == "in progress"),
                    TotalSpent = orders.Sum(o => o.TotalAmount),
                    TotalVehicles = vehicles.Count
                };

                // Get recent orders (last 5)
                var recentOrders = orderDtos.Take(5).ToList();

                var response = new CustomerDashboardResponse
                {
                    Success = true,
                    User = user,
                    Orders = orderDtos,
                    RecentOrders = recentOrders,
                    Vehicles = vehicles,
                    Stats = stats
                };

                _logger.LogInformation("Dashboard data fetched successfully for user ID: {UserId}", userId);
                return new JsonResult(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = true,
                    ReferenceHandler = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching dashboard data");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching dashboard data",
                    error = ex.Message
                });
            }
        }
    }

    // DTOs for the customer dashboard response
    public class CustomerDashboardResponse
    {
        public bool Success { get; set; }
        public UserInfoDto User { get; set; }
        public List<OrderDto> Orders { get; set; }
        public List<OrderDto> RecentOrders { get; set; }
        public List<VehicleDto> Vehicles { get; set; }
        public DashboardStatsDto Stats { get; set; }
    }

    public class UserInfoDto
    {
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string ImgUrl { get; set; }
    }

    public class OrderDto
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
        public int? InvoiceId { get; set; }
        public string InvoiceStatus { get; set; }
        public VehicleDto Vehicle { get; set; }
        public ServiceDto1 Service { get; set; }
        public List<ServiceDto1> AdditionalServices { get; set; } = new List<ServiceDto1>();
    }

    public class VehicleDto
    {
        public int VehicleId { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
        public string LicensePlate { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class ServiceDto1
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }
        public string SubCategory { get; set; }
    }

    public class DashboardStatsDto
    {
        public int TotalOrders { get; set; }
        public int CompletedOrders { get; set; }
        public int PendingOrders { get; set; }
        public int InProgressOrders { get; set; }
        public decimal TotalSpent { get; set; }
        public int TotalVehicles { get; set; }
    }
} 