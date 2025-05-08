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
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "mechanic,admin,super_admin")]
    public class MechanicServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MechanicServicesController> _logger;

        public MechanicServicesController(ApplicationDbContext context, ILogger<MechanicServicesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/MechanicServices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetMechanicServices()
        {
            try
            {
                // Get current user ID from claims
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int mechanicId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isAdmin = userRole == "admin" || userRole == "super_admin";

                // Base query - admins can see all, mechanics only see their own
                IQueryable<TransferToService> query = _context.TransferToServices
                    .Include(t => t.Order)
                    .Include(t => t.Service)
                    .Include(t => t.Vehicle)
                    .Include(t => t.User)
                    .Include(t => t.Mechanic);

                if (!isAdmin)
                {
                    query = query.Where(t => t.MechanicId == mechanicId);
                }

                var transferredServices = await query.ToListAsync();

                // Map to response DTO
                var results = transferredServices.Select(t => new
                {
                    transferId = t.TransferId,
                    orderId = t.OrderId,
                    userId = t.UserId,
                    vehicleId = t.VehicleId,
                    serviceId = t.ServiceId,
                    mechanicId = t.MechanicId,
                    orderDate = t.OrderDate,
                    status = t.Order?.Status,
                    notes = t.Notes,
                    eta = t.ETA,
                    createdAt = t.CreatedAt,
                    // Include related entity details
                    service = new
                    {
                        name = t.Service?.ServiceName,
                        category = t.Service?.Category,
                        price = t.Service?.Price
                    },
                    vehicle = new
                    {
                        make = t.Vehicle?.Make,
                        model = t.Vehicle?.Model,
                        year = t.Vehicle?.Year,
                        licensePlate = t.Vehicle?.LicensePlate
                    },
                    customer = new
                    {
                        name = t.User?.Name,
                        email = t.User?.Email,
                        phone = t.User?.Phone
                    },
                    mechanic = new
                    {
                        name = t.Mechanic?.Name,
                        email = t.Mechanic?.Email,
                        phone = t.Mechanic?.Phone
                    }
                }).ToList();

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting mechanic services");
                return StatusCode(500, new { message = "An error occurred while retrieving mechanic services", error = ex.Message });
            }
        }

        // GET: api/MechanicServices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetServiceDetail(int id)
        {
            try
            {
                // Get current user ID from claims
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int mechanicId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isAdmin = userRole == "admin" || userRole == "super_admin";

                // Get the transfer service by ID
                var transferService = await _context.TransferToServices
                    .Include(t => t.Order)
                    .Include(t => t.Service)
                    .Include(t => t.Vehicle)
                    .Include(t => t.User)
                    .Include(t => t.Mechanic)
                    .FirstOrDefaultAsync(t => t.TransferId == id);

                if (transferService == null)
                {
                    return NotFound(new { message = "Service not found" });
                }

                // Check if non-admin user has access to this service
                if (!isAdmin && transferService.MechanicId != mechanicId)
                {
                    return Forbid();
                }

                // Get the order with detailed information
                var order = await _context.Orders
                    .Include(o => o.Inspection)
                    .Include(o => o.Service)
                    .Include(o => o.Vehicle)
                    .Include(o => o.User)
                    .FirstOrDefaultAsync(o => o.OrderId == transferService.OrderId);

                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                // Get additional services
                var additionalServices = await _context.OrderServices
                    .Where(os => os.OrderId == order.OrderId)
                    .Include(os => os.Service)
                    .Select(os => new
                    {
                        serviceId = os.ServiceId,
                        serviceName = os.Service.ServiceName,
                        category = os.Service.Category,
                        price = os.Service.Price,
                        description = os.Service.Description
                    })
                    .ToListAsync();

                // Combine all information into a detailed response
                var result = new
                {
                    transferService = new
                    {
                        transferId = transferService.TransferId,
                        orderId = transferService.OrderId,
                        status = order.Status,
                        notes = transferService.Notes,
                        eta = transferService.ETA,
                        createdAt = transferService.CreatedAt,
                    },
                    order = new
                    {
                        orderId = order.OrderId,
                        orderDate = order.OrderDate,
                        status = order.Status,
                        totalAmount = order.TotalAmount,
                        notes = order.Notes,
                        includesInspection = order.IncludesInspection
                    },
                    service = new
                    {
                        serviceId = order.Service?.ServiceId,
                        serviceName = order.Service?.ServiceName,
                        category = order.Service?.Category,
                        price = order.Service?.Price,
                        description = order.Service?.Description
                    },
                    vehicle = new
                    {
                        vehicleId = order.Vehicle?.VehicleId,
                        make = order.Vehicle?.Make,
                        model = order.Vehicle?.Model,
                        year = order.Vehicle?.Year,
                        licensePlate = order.Vehicle?.LicensePlate
                    },
                    customer = new
                    {
                        userId = order.User?.UserId,
                        name = order.User?.Name,
                        email = order.User?.Email,
                        phone = order.User?.Phone,
                        address = order.User?.Address
                    },
                    inspection = order.Inspection != null ? new
                    {
                        inspectionId = order.Inspection.InspectionId,
                        scheduledDate = order.Inspection.ScheduledDate,
                        timeSlot = order.Inspection.TimeSlot,
                        status = order.Inspection.Status,
                        engineCondition = order.Inspection.EngineCondition,
                        transmissionCondition = order.Inspection.TransmissionCondition,
                        brakeCondition = order.Inspection.BrakeCondition,
                        electricalCondition = order.Inspection.ElectricalCondition,
                        bodyCondition = order.Inspection.BodyCondition,
                        tireCondition = order.Inspection.TireCondition,
                        notes = order.Inspection.Notes
                    } : null,
                    additionalServices = additionalServices
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting service detail for ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving service details", error = ex.Message });
            }
        }

        // PUT: api/MechanicServices/5/update-status
        [HttpPut("{id}/update-status")]
        public async Task<IActionResult> UpdateServiceStatus(int id, [FromBody] UpdateServiceStatusRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request?.Status))
                {
                    return BadRequest(new { message = "Status is required" });
                }

                // Validate status value
                var allowedStatuses = new[] { "awaiting parts", "in progress", "completed" };
                if (!allowedStatuses.Contains(request.Status.ToLower()))
                {
                    return BadRequest(new { message = $"Status must be one of: {string.Join(", ", allowedStatuses)}" });
                }

                // Get current user ID from claims
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int mechanicId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isAdmin = userRole == "admin" || userRole == "super_admin";

                // Get the transfer service by ID
                var transferService = await _context.TransferToServices
                    .Include(t => t.Order)
                    .FirstOrDefaultAsync(t => t.TransferId == id);

                if (transferService == null)
                {
                    return NotFound(new { message = "Service not found" });
                }

                // Check if non-admin user has access to this service
                if (!isAdmin && transferService.MechanicId != mechanicId)
                {
                    return Forbid();
                }

                // Get the associated order
                var order = await _context.Orders.FindAsync(transferService.OrderId);
                if (order == null)
                {
                    return NotFound(new { message = "Order not found" });
                }

                // Update order status
                order.Status = request.Status.ToLower();
                
                // Add notes if provided
                if (!string.IsNullOrEmpty(request.Notes))
                {
                    transferService.Notes += $"\n[{DateTime.Now}] Status updated to '{request.Status}': {request.Notes}";
                    order.Notes += $"\n[{DateTime.Now}] Service status updated to '{request.Status}': {request.Notes}";
                }
                else
                {
                    transferService.Notes += $"\n[{DateTime.Now}] Status updated to '{request.Status}'";
                    order.Notes += $"\n[{DateTime.Now}] Service status updated to '{request.Status}'";
                }

                // If completing the service, set completion date
                if (request.Status.ToLower() == "completed")
                {
                    transferService.ETA = null;
                }
                else if (request.EstimatedDays.HasValue && request.EstimatedDays.Value > 0)
                {
                    // Update ETA if provided and not completing
                    transferService.ETA = DateTime.Now.AddDays(request.EstimatedDays.Value);
                }

                // Create notification for customer about status update
                var notification = new Notification
                {
                    UserId = order.UserId,
                    Message = $"Your service status has been updated to '{request.Status}'" + 
                              (request.EstimatedDays.HasValue && request.Status.ToLower() != "completed" 
                                ? $" and is estimated to be done in {request.EstimatedDays.Value} days." 
                                : "."),
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    success = true, 
                    message = $"Service status updated to '{request.Status}'",
                    status = request.Status,
                    eta = transferService.ETA
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating service status for ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating service status", error = ex.Message });
            }
        }
    }

    public class UpdateServiceStatusRequest
    {
        public string Status { get; set; }
        public string Notes { get; set; }
        public int? EstimatedDays { get; set; }
    }
}