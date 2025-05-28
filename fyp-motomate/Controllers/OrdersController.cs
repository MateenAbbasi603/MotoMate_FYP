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
        public async Task<ActionResult<object>> GetOrder(int id)
        {
            try
            {
                // Fetch the order with all related entities
                var order = await _context.Orders
                    .Include(o => o.User)    // Include customer information
                    .Include(o => o.Vehicle) // Include vehicle information
                    .Include(o => o.Service) // Include service information
                    .Include(o => o.Inspection) // Include inspection if exists
                        .ThenInclude(i => i.Service) // Include the inspection service for price
                    .Include(o => o.OrderServices) // Include additional services
                        .ThenInclude(os => os.Service)
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

                // Check if invoice exists for this order and get its status
                var invoice = await _context.Invoices
                    .Where(i => i.OrderId == id)
                    .FirstOrDefaultAsync();

                string invoiceStatus = "none";
                int? invoiceId = null;

                if (invoice != null)
                {
                    invoiceStatus = invoice.Status;
                    invoiceId = invoice.InvoiceId;
                }

                // Map to DTO to prevent circular references
                var orderDto = new OrderResponseDto
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
                    InvoiceStatus = invoiceStatus,
                    InvoiceId = invoiceId
                };

                // Add user info if available
                if (order.User != null)
                {
                    orderDto.User = new UserDetailsDto
                    {
                        UserId = order.User.UserId,
                        Name = order.User.Name,
                        Email = order.User.Email,
                        Phone = order.User.Phone,
                        Address = order.User.Address
                    };
                }

                // Add vehicle info if available
                if (order.Vehicle != null)
                {
                    orderDto.Vehicle = new VehicleDetailsDto
                    {
                        VehicleId = order.Vehicle.VehicleId,
                        Make = order.Vehicle.Make,
                        Model = order.Vehicle.Model,
                        Year = order.Vehicle.Year,
                        LicensePlate = order.Vehicle.LicensePlate
                    };
                }

                // Add service info if available
                if (order.Service != null)
                {
                    orderDto.Service = new ServiceDto
                    {
                        ServiceId = order.Service.ServiceId,
                        ServiceName = order.Service.ServiceName,
                        Category = order.Service.Category,
                        Price = order.Service.Price,
                        Description = order.Service.Description,
                        SubCategory = order.Service.SubCategory ?? "" // Null coalescing operator
                    };
                }

                // Add inspection info if available
                if (order.Inspection != null)
                {
                    decimal inspectionPrice = 0;
                    if (order.Inspection.Service != null)
                    {
                        inspectionPrice = order.Inspection.Service.Price;
                    }

                    orderDto.Inspection = new InspectionDetailsDto
                    {
                        InspectionId = order.Inspection.InspectionId,
                        ServiceId = order.Inspection.ServiceId,
                        ServiceName = order.Inspection.Service?.ServiceName,
                        SubCategory = order.Inspection.Service?.SubCategory,
                        ScheduledDate = order.Inspection.ScheduledDate,
                        Status = order.Inspection.Status,
                        TimeSlot = order.Inspection.TimeSlot,
                        BodyCondition = order.Inspection.BodyCondition,
                        EngineCondition = order.Inspection.EngineCondition,
                        ElectricalCondition = order.Inspection.ElectricalCondition,
                        TireCondition = order.Inspection.TireCondition,
                        BrakeCondition = order.Inspection.BrakeCondition,
                        TransmissionCondition = order.Inspection.TransmissionCondition,
                        Notes = order.Inspection.Notes,
                        Price = inspectionPrice
                    };
                }

                // Add additional services if available
                if (order.OrderServices != null && order.OrderServices.Any())
                {
                    orderDto.AdditionalServices = order.OrderServices
                        .Select(os => new ServiceDto
                        {
                            ServiceId = os.Service.ServiceId,
                            ServiceName = os.Service.ServiceName,
                            Category = os.Service.Category,
                            Price = os.Service.Price,
                            Description = os.Service.Description,
                            SubCategory = os.Service.SubCategory ?? "" // Null coalescing operator
                        })
                        .ToList();
                }
                else
                {
                    orderDto.AdditionalServices = new List<ServiceDto>();
                }

                return Ok(orderDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching the order", error = ex.Message });
            }
        }

        // POST: api/Orders
        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder([FromBody] OrderRequest request)
        {
            try
            {
                _logger.LogInformation("Creating order with request: {Request}", request);

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
                    OrderDate = DateTime.Now,
                    Status = "pending",
                    TotalAmount = request.TotalAmount,
                    Notes = request.Notes,
                    OrderType = request.OrderType ?? "Online"
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // If order includes inspection, create it
                if (request.IncludesInspection)
                {
                    // Get the default inspection service if not explicitly provided
                    var inspectionServiceId = request.InspectionTypeId ?? 1; // Use provided ID or default

                    // Log inspection details
                    _logger.LogInformation("Creating inspection with service ID: {ServiceId}, SubCategory: {SubCategory}",
                        inspectionServiceId, request.SubCategory);

                    var inspection = new Inspection
                    {
                        UserId = request.UserId,
                        VehicleId = request.VehicleId,
                        ServiceId = inspectionServiceId,
                        SubCategory = request.SubCategory ?? "General Inspection", // Provide default value
                        OrderId = order.OrderId,
                        ScheduledDate = request.InspectionDate ?? DateTime.Now.AddDays(1),
                        Status = "pending",
                        Notes = request.Notes ?? "",
                        CreatedAt = DateTime.Now,
                        TimeSlot = request.TimeSlot ?? "09:00 AM - 11:00 AM",
                        EngineCondition = "Not Inspected Yet",
                        TransmissionCondition = "Not Inspected Yet",
                        BrakeCondition = "Not Inspected Yet",
                        ElectricalCondition = "Not Inspected Yet",
                        BodyCondition = "Not Inspected Yet",
                        TireCondition = "Not Inspected Yet",
                        InteriorCondition = "Not Inspected Yet",
                        SuspensionCondition = "Not Inspected Yet",
                        TiresCondition = "Not Inspected Yet",
                        MechanicId = 0 // Default value
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
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(notification);

                // Create a notification for admins/service agents
                var staffNotification = new Notification
                {
                    // Assuming there's an admin user with ID 1
                    UserId = 1,
                    Message = $"New order received from user ID {order.UserId}",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(staffNotification);

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetOrder), new { id = order.OrderId }, order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order with request: {Request}", request);
                return StatusCode(500, new { message = "An error occurred while creating the order", error = ex.Message });
            }
        }

        // POST: api/Orders/walkin
        [HttpPost("walkin")]
        [Authorize(Roles = "super_admin,admin,service_agent")]
        public async Task<ActionResult<Order>> CreateWalkInOrder([FromBody] WalkInOrderRequest request)
        {
            try
            {
                // Validate request - must have either service OR inspection (or both)
                if (!request.IncludesInspection && !request.ServiceId.HasValue)
                {
                    return BadRequest(new { message = "Order must include either an inspection or a service" });
                }

                // Check if user exists
                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                {
                    return BadRequest(new { message = "User not found" });
                }

                // Verify vehicle exists
                var vehicle = await _context.Vehicles.FindAsync(request.VehicleId);
                if (vehicle == null)
                {
                    return BadRequest(new { message = "Vehicle not found" });
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

                // Validate inspection service if included
                if (request.IncludesInspection && request.InspectionTypeId.HasValue)
                {
                    var inspectionService = await _context.Services.FindAsync(request.InspectionTypeId.Value);
                    if (inspectionService == null)
                    {
                        return BadRequest(new { message = "Inspection type not found" });
                    }

                    if (inspectionService.Category.ToLower() != "inspection")
                    {
                        return BadRequest(new { message = "The selected service is not an inspection type" });
                    }
                }

                // Validate mechanic if provided
                if (request.MechanicId.HasValue)
                {
                    var mechanic = await _context.Users.FirstOrDefaultAsync(u =>
                        u.UserId == request.MechanicId.Value && u.Role.ToLower() == "mechanic");

                    if (mechanic == null)
                    {
                        return BadRequest(new { message = "Selected mechanic not found" });
                    }

                    // Check mechanic availability
                    var currentAppointments = await _context.Appointments
                        .CountAsync(a => a.MechanicId == request.MechanicId.Value &&
                                  (a.Status == "scheduled" || a.Status == "in progress"));

                    if (currentAppointments >= 3) // Threshold of 3 concurrent appointments
                    {
                        return BadRequest(new { message = "Selected mechanic is currently busy with too many appointments" });
                    }
                }

                // Create order
                var order = new Order
                {
                    UserId = request.UserId,
                    VehicleId = request.VehicleId,
                    ServiceId = request.ServiceId,
                    IncludesInspection = request.IncludesInspection,
                    OrderDate = DateTime.Now,
                    Status = "pending",
                    TotalAmount = request.TotalAmount,
                    Notes = request.Notes ?? "",
                    OrderType = "Walk-In"
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // SCENARIO 1: Only Inspection (IncludesInspection = true, ServiceId = null)
                if (request.IncludesInspection && !request.ServiceId.HasValue && request.InspectionTypeId.HasValue)
                {
                    // Create inspection
                    var inspection = new Inspection
                    {
                        UserId = request.UserId,
                        VehicleId = request.VehicleId,
                        ServiceId = request.InspectionTypeId.Value,
                        SubCategory = request.InspectionSubCategory,
                        OrderId = order.OrderId,
                        ScheduledDate = DateTime.Now,
                        Status = "pending",
                        Notes = request.Notes ?? "",
                        CreatedAt = DateTime.Now,
                        TimeSlot = "Walk-In",
                        MechanicId = request.MechanicId ?? 0,
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

                    // Create appointment only if mechanic is assigned and inspection is included
                    if (request.MechanicId.HasValue)
                    {
                        var appointment = new Appointment
                        {
                            OrderId = order.OrderId,
                            UserId = request.UserId,
                            VehicleId = request.VehicleId,
                            ServiceId = null, // No service, only inspection
                            MechanicId = request.MechanicId.Value,
                            AppointmentDate = DateTime.Now,
                            TimeSlot = "Walk-In",
                            Status = "scheduled",
                            Notes = "Walk-in inspection appointment",
                            CreatedAt = DateTime.Now
                        };

                        _context.Appointments.Add(appointment);
                        await _context.SaveChangesAsync();

                        // Update order status since mechanic is assigned
                        order.Status = "in progress";
                        await _context.SaveChangesAsync();
                    }
                }

                // SCENARIO 2: Only Service (IncludesInspection = false, ServiceId has value)
                else if (!request.IncludesInspection && request.ServiceId.HasValue)
                {
                    // Create appointment only if mechanic is assigned
                    if (request.MechanicId.HasValue)
                    {
                        var appointment = new Appointment
                        {
                            OrderId = order.OrderId,
                            UserId = request.UserId,
                            VehicleId = request.VehicleId,
                            ServiceId = request.ServiceId,
                            MechanicId = request.MechanicId.Value,
                            AppointmentDate = DateTime.Now,
                            TimeSlot = "Walk-In",
                            Status = "scheduled",
                            Notes = "Walk-in service appointment",
                            CreatedAt = DateTime.Now
                        };

                        _context.Appointments.Add(appointment);
                        await _context.SaveChangesAsync();

                        // Update order status since mechanic is assigned
                        order.Status = "in progress";
                        await _context.SaveChangesAsync();
                    }
                }

                // SCENARIO 3: Both Inspection and Service (IncludesInspection = true, ServiceId has value)
                else if (request.IncludesInspection && request.ServiceId.HasValue && request.InspectionTypeId.HasValue)
                {
                    // Create inspection
                    var inspection = new Inspection
                    {
                        UserId = request.UserId,
                        VehicleId = request.VehicleId,
                        ServiceId = request.InspectionTypeId.Value,
                        SubCategory = request.InspectionSubCategory,
                        OrderId = order.OrderId,
                        ScheduledDate = DateTime.Now,
                        Status = "pending",
                        Notes = request.Notes ?? "",
                        CreatedAt = DateTime.Now,
                        TimeSlot = "Walk-In",
                        MechanicId = request.MechanicId ?? 0,
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

                    // Create appointment only if mechanic is assigned
                    if (request.MechanicId.HasValue)
                    {
                        var appointment = new Appointment
                        {
                            OrderId = order.OrderId,
                            UserId = request.UserId,
                            VehicleId = request.VehicleId,
                            ServiceId = request.ServiceId, // Main service
                            MechanicId = request.MechanicId.Value,
                            AppointmentDate = DateTime.Now,
                            TimeSlot = "Walk-In",
                            Status = "scheduled",
                            Notes = "Walk-in appointment with inspection and service",
                            CreatedAt = DateTime.Now
                        };

                        _context.Appointments.Add(appointment);
                        await _context.SaveChangesAsync();

                        // Update order status since mechanic is assigned
                        order.Status = "in progress";
                        await _context.SaveChangesAsync();
                    }
                }

                // Create notifications based on scenarios
                if (request.MechanicId.HasValue)
                {
                    // Create notification for mechanic
                    var mechanicNotification = new Notification
                    {
                        UserId = request.MechanicId.Value,
                        Message = $"You have been assigned to a walk-in order #{order.OrderId}" +
                                 (request.IncludesInspection && request.ServiceId.HasValue ? " (inspection + service)" :
                                  request.IncludesInspection ? " (inspection only)" : " (service only)"),
                        Status = "unread",
                        CreatedAt = DateTime.Now
                    };

                    _context.Notifications.Add(mechanicNotification);
                }

                // Create customer notification
                var customerNotification = new Notification
                {
                    UserId = order.UserId,
                    Message = "Your walk-in order has been placed successfully" +
                              (request.MechanicId.HasValue ? " and a mechanic has been assigned" : ""),
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(customerNotification);

                // Create a notification for admins/service agents
                var staffNotification = new Notification
                {
                    UserId = 1, // Assuming there's an admin user with ID 1
                    Message = $"New walk-in order received from user ID {order.UserId}" +
                              (request.MechanicId.HasValue ? $", assigned to mechanic ID {request.MechanicId}" : "") +
                              (request.IncludesInspection && request.ServiceId.HasValue ? " (inspection + service)" :
                               request.IncludesInspection ? " (inspection only)" : " (service only)"),
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(staffNotification);

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetOrder), new { id = order.OrderId }, order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating walk-in order");
                return StatusCode(500, new { message = "An error occurred while creating the walk-in order", error = ex.Message });
            }
        }
        // POST: api/Orders/5/transfer-to-service
        [HttpPost("{id}/transfer-to-service")]
        [Authorize(Roles = "super_admin,admin,service_agent")]
        public async Task<IActionResult> TransferToService(int id)
        {
            try
            {
                // Get the order with related data
                var order = await _context.Orders
                    .Include(o => o.Inspection)
                    .Include(o => o.Service)
                    .Include(o => o.Vehicle)
                    .FirstOrDefaultAsync(o => o.OrderId == id);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found" });
                }

                // Check if the order includes a service
                if (!order.ServiceId.HasValue)
                {
                    return BadRequest(new { success = false, message = "Order does not include a service to transfer" });
                }

                // Check if there's an inspection
                if (order.Inspection == null)
                {
                    return BadRequest(new { success = false, message = "No inspection found for this order" });
                }

                // Look for an appointment related to this inspection to find a mechanic
                var inspectionAppointment = await _context.Appointments
                    .FirstOrDefaultAsync(a => a.OrderId == id);

                if (inspectionAppointment == null || inspectionAppointment.MechanicId <= 0)
                {
                    // No appointment found, try to look for mechanic directly in the inspection
                    if (order.Inspection.MechanicId <= 0)
                    {
                        return BadRequest(new { success = false, message = "No mechanic has been assigned to this inspection yet" });
                    }
                }

                // Determine which mechanic ID to use (from appointment or inspection)
                int mechanicId = (inspectionAppointment != null && inspectionAppointment.MechanicId > 0)
                    ? inspectionAppointment.MechanicId
                    : order.Inspection.MechanicId;

                // Check if transfer already exists
                var existingTransfer = await _context.TransferToServices
                    .FirstOrDefaultAsync(t => t.OrderId == id);

                if (existingTransfer != null)
                {
                    // Update existing transfer record
                    existingTransfer.MechanicId = mechanicId;
                    existingTransfer.Status = "transferred";
                    existingTransfer.Notes += $"\nUpdated on {DateTime.Now}: Reassigned to mechanic (ID: {mechanicId})";
                    existingTransfer.ETA = "";
                }
                else
                {
                    // Create new transfer record
                    var transfer = new TransferToService
                    {
                        OrderId = order.OrderId,
                        UserId = order.UserId,
                        VehicleId = order.VehicleId,
                        ServiceId = order.ServiceId.Value,
                        MechanicId = mechanicId,
                        OrderDate = DateTime.Now,
                        Status = "transferred",
                        Notes = $"Service transferred to mechanic ID: {mechanicId} who performed the inspection.",
                        CreatedAt = DateTime.Now
                    };

                    _context.TransferToServices.Add(transfer);
                }

                // Update order status
                order.Status = "in progress";
                order.Notes += $"\nTransferred to service on {DateTime.Now}. Assigned to mechanic ID: {mechanicId}.";

                // Create notifications
                var customerNotification = new Notification
                {
                    UserId = order.UserId,
                    Message = $"Your service has been scheduled with the same mechanic who performed your inspection.",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };

                var mechanicNotification = new Notification
                {
                    UserId = mechanicId,
                    Message = $"You have been assigned to perform service for Order #{order.OrderId} following your inspection.",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };

                _context.Notifications.AddRange(customerNotification, mechanicNotification);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Service successfully transferred to the inspection mechanic",
                    order = new
                    {
                        orderId = order.OrderId,
                        status = order.Status,
                        mechanicId = mechanicId,
                        eta = DateTime.Now.AddDays(3).ToString("yyyy-MM-dd")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error transferring service for order {OrderId}", id);
                return StatusCode(500, new { success = false, message = "An error occurred while transferring the service", error = ex.Message });
            }
        }

        // Other controller methods...

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

                // Calculate total amount
                decimal totalAmount = inspectionService.Price;
                _logger.LogInformation("Base inspection price: {Price}", totalAmount);

                // Validate primary service if provided
                if (request.ServiceId.HasValue)
                {
                    var service = await _context.Services.FindAsync(request.ServiceId.Value);
                    if (service == null)
                    {
                        _logger.LogWarning("Primary service not found: {ServiceId}", request.ServiceId.Value);
                        return BadRequest(new { success = false, message = "Primary service not found" });
                    }

                    // Add service price to total
                    totalAmount += service.Price;
                    _logger.LogInformation("Added primary service price: {Price}, New total: {Total}", service.Price, totalAmount);
                }

                // Validate additional services if provided
                List<Service> additionalServices = new List<Service>();
                if (request.AdditionalServiceIds != null && request.AdditionalServiceIds.Any())
                {
                    foreach (var serviceId in request.AdditionalServiceIds)
                    {
                        var service = await _context.Services.FindAsync(serviceId);
                        if (service == null)
                        {
                            _logger.LogWarning("Additional service not found: {ServiceId}", serviceId);
                            return BadRequest(new { success = false, message = $"Additional service with ID {serviceId} not found" });
                        }

                        // Add service price to total
                        totalAmount += service.Price;
                        additionalServices.Add(service);
                        _logger.LogInformation("Added additional service price: {Price}, New total: {Total}", service.Price, totalAmount);
                    }
                }

                // Check if the time slot is available
                bool isSlotAvailable = await _timeSlotService.IsTimeSlotAvailableAsync(request.InspectionDate, request.TimeSlot);
                if (!isSlotAvailable)
                {
                    _logger.LogWarning("Time slot not available: {Date} {TimeSlot}", request.InspectionDate, request.TimeSlot);
                    return BadRequest(new
                    {
                        success = false,
                        message = "The selected time slot is no longer available. Please choose a different time."
                    });
                }

                _logger.LogInformation("Time slot is available: {Date} {TimeSlot}", request.InspectionDate, request.TimeSlot);

                // Create order and inspection without using transactions
                try
                {
                    // Create order first
                    var order = new Order
                    {
                        UserId = userId,
                        VehicleId = request.VehicleId,
                        ServiceId = request.ServiceId,
                        IncludesInspection = true,
                        OrderDate = DateTime.Now,
                        Status = "pending",
                        TotalAmount = totalAmount,
                        Notes = request.Notes ?? ""
                    };

                    _logger.LogInformation("Creating order");
                    _context.Orders.Add(order);
                    await _context.SaveChangesAsync();

                    int orderId = order.OrderId;
                    _logger.LogInformation("Order created with ID: {OrderId}", orderId);

                    // Add additional services as OrderService entries
                    if (additionalServices.Any())
                    {
                        foreach (var service in additionalServices)
                        {
                            var orderService = new OrderService
                            {
                                OrderId = orderId,
                                ServiceId = service.ServiceId,
                                AddedAt = DateTime.Now,
                                Notes = service.Category.ToLower() == "inspection"
                                    ? "Added as subcategory inspection during order creation"
                                    : "Added during order creation"
                            };
                            _context.OrderServices.Add(orderService);
                        }
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Added {Count} additional services to order", additionalServices.Count);
                    }

                    // If order was created successfully, create the inspection
                    var inspection = new Inspection
                    {
                        UserId = userId,
                        VehicleId = request.VehicleId,
                        ServiceId = request.InspectionTypeId,
                        SubCategory = request.SubCategory ?? inspectionService.ServiceName, // Use service name as fallback
                        OrderId = orderId,
                        ScheduledDate = request.InspectionDate.Date, // Use .Date to strip the time component
                        TimeSlot = request.TimeSlot ?? "09:00 AM - 11:00 AM",
                        Status = "pending",
                        Notes = request.Notes ?? "",
                        CreatedAt = DateTime.Now,
                        EngineCondition = "Not Inspected Yet",
                        TransmissionCondition = "Not Inspected Yet",
                        BrakeCondition = "Not Inspected Yet",
                        ElectricalCondition = "Not Inspected Yet",
                        BodyCondition = "Not Inspected Yet",
                        TireCondition = "Not Inspected Yet",
                        InteriorCondition = "Not Inspected Yet",
                        SuspensionCondition = "Not Inspected Yet",
                        TiresCondition = "Not Inspected Yet",
                        MechanicId = 0 // Default value
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
                        CreatedAt = DateTime.Now
                    };

                    var staffNotification = new Notification
                    {
                        UserId = 1, // Admin or service manager
                        Message = $"New inspection scheduled for vehicle {vehicle.Make} {vehicle.Model} on {request.InspectionDate.ToString("yyyy-MM-dd")} at {request.TimeSlot}",
                        Status = "unread",
                        CreatedAt = DateTime.Now
                    };

                    _context.Notifications.AddRange(userNotification, staffNotification);
                    await _context.SaveChangesAsync();

                    return CreatedAtAction(
                        nameof(GetOrder),
                        new { id = orderId },
                        new
                        {
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

                    return StatusCode(500, new
                    {
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

                return StatusCode(500, new
                {
                    success = false,
                    message = "An unexpected error occurred",
                    error = detailedError
                });
            }
        }

        // All other controller methods would remain the same...
    }

    public class WalkInOrderRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int VehicleId { get; set; }

        public int? ServiceId { get; set; }

        public int? InspectionTypeId { get; set; }

        public string InspectionSubCategory { get; set; }


        public bool IncludesInspection { get; set; }

        [Required]
        public decimal TotalAmount { get; set; }

        public string Notes { get; set; }

        public int? MechanicId { get; set; } // Added mechanic ID

    }

    // Update the DTOs to include the SubCategory field
    public class OrderRequest
    {
        public int UserId { get; set; }
        public int VehicleId { get; set; }
        public int? ServiceId { get; set; }
        public bool IncludesInspection { get; set; }
        public DateTime? InspectionDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; }
        public string TimeSlot { get; set; }
        public int? InspectionTypeId { get; set; }
        public string SubCategory { get; set; }
        public string OrderType { get; set; }
    }

    public class InspectionOrderRequest
    {
        [Required]
        public int VehicleId { get; set; }

        [Required]
        public int InspectionTypeId { get; set; }

        public int? ServiceId { get; set; }

        public string SubCategory { get; set; }

        public List<int> AdditionalServiceIds { get; set; } = new List<int>();

        public List<int> AdditionalSubcategoryIds { get; set; } = new List<int>();

        [Required]
        public DateTime InspectionDate { get; set; }

        [Required]
        public string TimeSlot { get; set; }

        public string Notes { get; set; }
    }

    // Other DTO classes remain the same...
}