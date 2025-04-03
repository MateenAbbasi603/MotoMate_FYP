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
using fyp_motomate.Models.DTOs;
using System.ComponentModel.DataAnnotations;
using fyp_motomate.Services;
using Microsoft.Data.SqlClient;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITimeSlotService _timeSlotService;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(ApplicationDbContext context, ITimeSlotService timeSlotService, ILogger<OrdersController> logger)
        {
            _context = context;
            _timeSlotService = timeSlotService;
            _logger = logger;
        }

// GET: api/Orders
[HttpGet]
[AllowAnonymous]
public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
{
    // Check if user is authenticated
    if (!User.Identity.IsAuthenticated)
    {
        // For unauthenticated users, return all orders
        return await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Vehicle)
            .Include(o => o.Service)
            .ToListAsync();
    }

    // For authenticated users, safely get the user ID
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
    if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
    {
        return BadRequest(new { message = "User ID not found in token" });
    }

    int userId;
    if (!int.TryParse(userIdClaim.Value, out userId))
    {
        return BadRequest(new { message = "Invalid user ID format" });
    }

    string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

    // If user is a customer, only return their orders
    if (userRole == "customer")
    {
        return await _context.Orders
            .Where(o => o.UserId == userId)
            .Include(o => o.Vehicle)
            .Include(o => o.Service)
            .ToListAsync();
    }
    // If user is staff, return all orders
    else
    {
        return await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Vehicle)
            .Include(o => o.Service)
            .ToListAsync();
    }
}

// GET: api/Orders/5
[HttpGet("{id}")]
[AllowAnonymous]
public async Task<ActionResult<Order>> GetOrder(int id)
{
    // Fetch the order with all related entities
    var order = await _context.Orders
        .Include(o => o.User)    // Include customer information
        .Include(o => o.Vehicle) // Include vehicle information
        .Include(o => o.Service) // Include service information
        .Include(o => o.Inspection) // Include inspection if exists
        .FirstOrDefaultAsync(o => o.OrderId == id);

    if (order == null)
    {
        return NotFound(new { message = "Order not found" });
    }

    // Check authentication and permissions if needed
    if (User.Identity.IsAuthenticated)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && !string.IsNullOrEmpty(userIdClaim.Value))
        {
            if (int.TryParse(userIdClaim.Value, out int userId))
            {
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // If user is a customer, they can only view their own orders
                if (userRole == "customer" && order.UserId != userId)
                {
                    return Forbid();
                }
            }
        }
    }

    return order;
}
        
        
        // POST: api/Orders
        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder([FromBody] OrderRequest request)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Validate request
            if (!request.IncludesInspection && !request.ServiceId.HasValue)
            {
                return BadRequest(new { message = "Order must include either an inspection or a service" });
            }

            // If customer is making the request, use their ID
            if (userRole == "customer")
            {
                request.UserId = userId;
            }
            // Otherwise, verify the user exists
            else if (!await _context.Users.AnyAsync(u => u.UserId == request.UserId))
            {
                return BadRequest(new { message = "User not found" });
            }

            // Verify vehicle exists and belongs to user
            var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
            if (vehicle == null)
            {
                return BadRequest(new { message = "Vehicle not found" });
            }

            if (userRole == "customer" && vehicle.UserId != userId)
            {
                return BadRequest(new { message = "Vehicle does not belong to the user" });
            }

            // Validate service if provided
            if (request.ServiceId.HasValue)
            {
                var service = await _context.Services.FindAsync(request.ServiceId.Value);
                if (service == null)
                {
                    return BadRequest(new { message = "Service not found" });
                }
            }

            // Create order
            var order = new Order
            {
                UserId = request.UserId,
                VehicleId = request.VehicleId,
                ServiceId = request.ServiceId,
                IncludesInspection = request.IncludesInspection,
                OrderDate = DateTime.UtcNow,
                Status = "pending",
                TotalAmount = request.TotalAmount,
                Notes = request.Notes
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // If order includes inspection, create it
            if (request.IncludesInspection && request.InspectionDate.HasValue)
            {
                var inspection = new Inspection
                {
                    UserId = request.UserId,
                    VehicleId = request.VehicleId,
                    ServiceId = 1, // Default service ID for inspection - adjust as needed
                    ScheduledDate = request.InspectionDate.Value,
                    Status = "pending",
                    Notes = request.Notes ?? "",
                    CreatedAt = DateTime.UtcNow,
                    OrderId = order.OrderId,
                    TimeSlot = "09:00 AM - 11:00 AM",
                    EngineCondition = "Not Inspected Yet",
                    TransmissionCondition = "Not Inspected Yet",
                    BrakeCondition = "Not Inspected Yet",
                    ElectricalCondition = "Not Inspected Yet",
                    BodyCondition = "Not Inspected Yet",
                    TireCondition = "Not Inspected Yet", 
                    InteriorCondition = "Not Inspected Yet",
                    SuspensionCondition = "Not Inspected Yet",
                    TiresCondition = "Not Inspected Yet"
                };

                _context.Inspections.Add(inspection);
                await _context.SaveChangesAsync();
            }

            // Create notification
            var notification = new Notification
            {
                UserId = order.UserId,
                Message = "Your order has been placed successfully",
                Status = "unread",
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            // Create a notification for admins/service agents
            var staffNotification = new Notification
            {
                // Assuming there's an admin user with ID 1
                UserId = 1,
                Message = $"New order received from user ID {order.UserId}",
                Status = "unread",
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(staffNotification);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrder), new { id = order.OrderId }, order);
        }

        // POST: api/Orders/CreateWithInspection
        [HttpPost("CreateWithInspection")]
        public async Task<ActionResult<object>> CreateOrderWithInspection([FromBody] InspectionOrderRequest request)
        {
            try
            {
                _logger.LogInformation("CreateOrderWithInspection started with request: {@Request}", request);
                
                // Validate request
                if (request == null)
                {
                    _logger.LogWarning("Request is null");
                    return BadRequest(new { success = false, message = "Invalid request data" });
                }

                if (request.VehicleId <= 0)
                {
                    _logger.LogWarning("Invalid vehicle ID: {VehicleId}", request.VehicleId);
                    return BadRequest(new { success = false, message = "Valid vehicle ID is required" });
                }

                if (request.InspectionTypeId <= 0)
                {
                    _logger.LogWarning("Invalid inspection type ID: {InspectionTypeId}", request.InspectionTypeId);
                    return BadRequest(new { success = false, message = "Valid inspection type ID is required" });
                }

                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                _logger.LogInformation("User ID: {UserId}, Role: {UserRole}", userId, userRole);

                // Verify vehicle exists and belongs to user
                var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
                if (vehicle == null)
                {
                    _logger.LogWarning("Vehicle not found: {VehicleId}", request.VehicleId);
                    return BadRequest(new { success = false, message = "Vehicle not found" });
                }

                if (userRole == "customer" && vehicle.UserId != userId)
                {
                    _logger.LogWarning("Vehicle does not belong to user. VehicleUserId: {VehicleUserId}, UserId: {UserId}", vehicle.UserId, userId);
                    return BadRequest(new { success = false, message = "Vehicle does not belong to the user" });
                }

                // Validate inspection service
                var inspectionService = await _context.Services.FindAsync(request.InspectionTypeId);
                if (inspectionService == null)
                {
                    _logger.LogWarning("Inspection type not found: {InspectionTypeId}", request.InspectionTypeId);
                    return BadRequest(new { success = false, message = "Inspection type not found" });
                }

                if (inspectionService.Category.ToLower() != "inspection")
                {
                    _logger.LogWarning("Service is not an inspection type. Category: {Category}", inspectionService.Category);
                    return BadRequest(new { success = false, message = "The selected service is not an inspection type" });
                }

                // Calculate total amount
                decimal totalAmount = inspectionService.Price;
                _logger.LogInformation("Base inspection price: {Price}", totalAmount);

                // Validate additional service if provided
                if (request.ServiceId.HasValue)
                {
                    var service = await _context.Services.FindAsync(request.ServiceId.Value);
                    if (service == null)
                    {
                        _logger.LogWarning("Additional service not found: {ServiceId}", request.ServiceId.Value);
                        return BadRequest(new { success = false, message = "Additional service not found" });
                    }

                    // Make sure we don't add another inspection service
                    if (service.Category.ToLower() == "inspection")
                    {
                        _logger.LogWarning("Cannot add multiple inspection services");
                        return BadRequest(new { success = false, message = "Cannot add multiple inspection services" });
                    }

                    // Add service price to total
                    totalAmount += service.Price;
                    _logger.LogInformation("Added service price: {Price}, New total: {Total}", service.Price, totalAmount);
                }

                // Check if the time slot is available
                bool isSlotAvailable = await _timeSlotService.IsTimeSlotAvailableAsync(request.InspectionDate, request.TimeSlot);
                if (!isSlotAvailable)
                {
                    _logger.LogWarning("Time slot not available: {Date} {TimeSlot}", request.InspectionDate, request.TimeSlot);
                    return BadRequest(new { 
                        success = false, 
                        message = "The selected time slot is no longer available. Please choose a different time." 
                    });
                }

                _logger.LogInformation("Time slot is available: {Date} {TimeSlot}", request.InspectionDate, request.TimeSlot);

                // Create order and inspection without using transactions
                // This simplifies the process and avoids execution strategy issues
                try
                {
                    // Create order first
                    var order = new Order
                    {
                        UserId = userId,
                        VehicleId = request.VehicleId,
                        ServiceId = request.ServiceId,
                        IncludesInspection = true,
                        OrderDate = DateTime.UtcNow,
                        Status = "pending",
                        TotalAmount = totalAmount,
                        Notes = request.Notes ?? ""
                    };

                    _logger.LogInformation("Creating order");
                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync();
                    
                    int orderId = order.OrderId;
                    _logger.LogInformation("Order created with ID: {OrderId}", orderId);
                    
                    // If order was created successfully, create the inspection
                    var inspection = new Inspection
                    {
                        UserId = userId,
                        VehicleId = request.VehicleId,
                        ServiceId = request.InspectionTypeId,
                        OrderId = orderId, // Use the orderId directly
                        ScheduledDate = request.InspectionDate,
                        TimeSlot = request.TimeSlot ?? "09:00 AM - 11:00 AM",
                        Status = "pending",
                        Notes = request.Notes ?? "",
                        CreatedAt = DateTime.UtcNow,
                        EngineCondition = "Not Inspected Yet",
                        TransmissionCondition = "Not Inspected Yet",
                        BrakeCondition = "Not Inspected Yet",
                        ElectricalCondition = "Not Inspected Yet",
                        BodyCondition = "Not Inspected Yet",
                        TireCondition = "Not Inspected Yet",
                        InteriorCondition = "Not Inspected Yet",
                        SuspensionCondition = "Not Inspected Yet",
                        TiresCondition = "Not Inspected Yet"
                    };

                    _logger.LogInformation("Creating inspection with OrderId: {OrderId}", inspection.OrderId);
                    _context.Inspections.Add(inspection);
                    await _context.SaveChangesAsync();
                    
                    int inspectionId = inspection.InspectionId;
                    _logger.LogInformation("Inspection created with ID: {InspectionId}", inspectionId);
                    
                    // Create notifications
                    var userNotification = new Notification
                    {
                        UserId = userId,
                        Message = $"Your inspection appointment has been scheduled for {request.InspectionDate.ToString("yyyy-MM-dd")} at {request.TimeSlot}",
                        Status = "unread",
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    var staffNotification = new Notification
                    {
                        UserId = 1, // Admin or service manager
                        Message = $"New inspection scheduled for vehicle {vehicle.Make} {vehicle.Model} on {request.InspectionDate.ToString("yyyy-MM-dd")} at {request.TimeSlot}",
                        Status = "unread",
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    _context.Notifications.AddRange(userNotification, staffNotification);
                    await _context.SaveChangesAsync();
                    
                    return CreatedAtAction(
                        nameof(GetOrder), 
                        new { id = orderId }, 
                        new { 
                            success = true, 
                            message = "Order created successfully", 
                            orderId = orderId,
                            inspectionId = inspectionId
                        }
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating order or inspection");
                    
                    // Get detailed error information
                    var detailedError = ex.Message;
                    var innerEx = ex.InnerException;
                    while (innerEx != null)
                    {
                        detailedError += " | Inner Exception: " + innerEx.Message;
                        innerEx = innerEx.InnerException;
                    }
                    
                    return StatusCode(500, new { 
                        success = false, 
                        message = "Error creating order or inspection", 
                        error = detailedError
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception in CreateOrderWithInspection");
                
                var detailedError = ex.Message;
                var innerEx = ex.InnerException;
                while (innerEx != null)
                {
                    detailedError += " | Inner Exception: " + innerEx.Message;
                    innerEx = innerEx.InnerException;
                }
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "An unexpected error occurred", 
                    error = detailedError
                });
            }
        }

        // POST: api/Orders/DirectSQL (Fallback method if EF approach doesn't work)
        [HttpPost("DirectSQL")]
        public async Task<ActionResult<object>> CreateOrderWithInspectionDirectSQL([FromBody] InspectionOrderRequest request)
        {
            try
            {
                _logger.LogInformation("CreateOrderWithInspectionDirectSQL started");
                
                // Perform same validations as in the other method
                // (vehicle, user, service validation, etc.)
                
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                
                // Create order using Entity Framework
                var order = new Order
                {
                    UserId = userId,
                    VehicleId = request.VehicleId,
                    ServiceId = request.ServiceId,
                    IncludesInspection = true,
                    OrderDate = DateTime.UtcNow,
                    Status = "pending",
                    TotalAmount = 100.00m, // Set appropriate amount
                    Notes = request.Notes ?? ""
                };
                
                _context.Orders.Add(order);
                await _context.SaveChangesAsync();
                
                int orderId = order.OrderId;
                
                // Create inspection using direct SQL
                string sql = @"
                INSERT INTO Inspections (
                    UserId, VehicleId, ServiceId, OrderId, ScheduledDate, TimeSlot, 
                    Status, Notes, CreatedAt, EngineCondition, TransmissionCondition, 
                    BrakeCondition, ElectricalCondition, BodyCondition, TireCondition, 
                    InteriorCondition, SuspensionCondition, TiresCondition
                ) 
                VALUES (
                    @UserId, @VehicleId, @ServiceId, @OrderId, @ScheduledDate, @TimeSlot, 
                    @Status, @Notes, @CreatedAt, @EngineCondition, @TransmissionCondition, 
                    @BrakeCondition, @ElectricalCondition, @BodyCondition, @TireCondition, 
                    @InteriorCondition, @SuspensionCondition, @TiresCondition
                );
                SELECT SCOPE_IDENTITY();";
                
                var parameters = new SqlParameter[]
                {
                    new SqlParameter("@UserId", userId),
                    new SqlParameter("@VehicleId", request.VehicleId),
                    new SqlParameter("@ServiceId", request.InspectionTypeId),
                    new SqlParameter("@OrderId", orderId),
                    new SqlParameter("@ScheduledDate", request.InspectionDate),
                    new SqlParameter("@TimeSlot", request.TimeSlot ?? "09:00 AM - 11:00 AM"),
                    new SqlParameter("@Status", "pending"),
                    new SqlParameter("@Notes", request.Notes ?? ""),
                    new SqlParameter("@CreatedAt", DateTime.UtcNow),
                    new SqlParameter("@EngineCondition", "Not Inspected Yet"),
                    new SqlParameter("@TransmissionCondition", "Not Inspected Yet"),
                    new SqlParameter("@BrakeCondition", "Not Inspected Yet"),
                    new SqlParameter("@ElectricalCondition", "Not Inspected Yet"),
                    new SqlParameter("@BodyCondition", "Not Inspected Yet"),
                    new SqlParameter("@TireCondition", "Not Inspected Yet"),
                    new SqlParameter("@InteriorCondition", "Not Inspected Yet"),
                    new SqlParameter("@SuspensionCondition", "Not Inspected Yet"),
                    new SqlParameter("@TiresCondition", "Not Inspected Yet")
                };
                
                var result = await _context.Database.ExecuteSqlRawAsync(sql, parameters);
                
                return Ok(new {
                    success = true,
                    message = "Order with inspection created successfully using direct SQL",
                    orderId = orderId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CreateOrderWithInspectionDirectSQL");
                return StatusCode(500, new {
                    success = false,
                    message = "An error occurred",
                    error = ex.Message
                });
            }
        }

        // PUT: api/Orders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrder(int id, [FromBody] OrderUpdateRequest request)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            // Check permissions
            if (userRole == "customer")
            {
                if (order.UserId != userId)
                {
                    return Forbid();
                }

                // Customers can only cancel orders or update notes
                if (request.Status == "cancelled")
                {
                    order.Status = "cancelled";
                }

                if (!string.IsNullOrEmpty(request.Notes))
                {
                    order.Notes = request.Notes;
                }
            }
            else
            {
                // Staff can update all fields
                if (!string.IsNullOrEmpty(request.Status))
                {
                    order.Status = request.Status;
                }

                if (!string.IsNullOrEmpty(request.Notes))
                {
                    order.Notes = request.Notes;
                }

                if (request.TotalAmount > 0)
                {
                    order.TotalAmount = request.TotalAmount;
                }

                // Update service if provided
                if (request.ServiceId.HasValue)
                {
                    var service = await _context.Services.FindAsync(request.ServiceId.Value);
                    if (service == null)
                    {
                        return BadRequest(new { message = "Service not found" });
                    }
                    order.ServiceId = request.ServiceId;
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrderExists(id))
                {
                    return NotFound(new { message = "Order not found" });
                }
                else
                {
                    throw;
                }
            }

            // Create notification about the update
            var notification = new Notification
            {
                UserId = order.UserId,
                Message = $"Your order status has been updated to {order.Status}",
                Status = "unread",
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order updated successfully", order });
        }

        // DELETE: api/Orders/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            // Only allow deleting of cancelled or pending orders
            if (order.Status != "cancelled" && order.Status != "pending")
            {
                return BadRequest(new { message = "Only cancelled or pending orders can be deleted" });
            }

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order deleted successfully" });
        }

        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.OrderId == id);
        }
    }

    // DTOs
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
    }
    
    public class OrderUpdateRequest
    {
        public string Status { get; set; }
        public string Notes { get; set; }
        public decimal TotalAmount { get; set; }
        public int? ServiceId { get; set; }
    }
    
    public class OrderRequest
    {
        public int UserId { get; set; }
        
        [Required]
        public int VehicleId { get; set; }
        
        public int? ServiceId { get; set; }
        
        [Required]
        public bool IncludesInspection { get; set; }
        
        public DateTime? InspectionDate { get; set; }
        
        [Required]
        public decimal TotalAmount { get; set; }
        
        public string Notes { get; set; }
    }
}