using fyp_motomate.Data;
using fyp_motomate.Models;
using fyp_motomate.Models.DTOs;
using fyp_motomate.Services;
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
    // [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAppointmentService _appointmentService;
        private readonly ILogger<AppointmentsController> _logger;

        public AppointmentsController(
            ApplicationDbContext context,
            IAppointmentService appointmentService,
            ILogger<AppointmentsController> logger)
        {
            _context = context;
            _appointmentService = appointmentService;
            _logger = logger;
        }

        // GET: api/Appointments
        [HttpGet]
        [Authorize(Roles = "super_admin,admin,service_agent,mechanic")]
        public async Task<ActionResult<IEnumerable<AppointmentResponseDto>>> GetAppointments()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
                {
                    return BadRequest(new { message = "User ID not found in token" });
                }

                int userId;
                if (!int.TryParse(userIdClaim.Value, out userId))
                {
                    return BadRequest(new { message = "Invalid user ID format" });
                }

                IQueryable<Appointment> query = _context.Set<Appointment>()
                    .Include(a => a.User)
                    .Include(a => a.Vehicle)
                    .Include(a => a.Service)
                    .Include(a => a.Mechanic)
                    .Include(a => a.Order)
                       .ThenInclude(o => o.Inspection) // Include inspection details
                                   .ThenInclude(i => i.Service); // Make sure the inspection's service is loaded



                // Filter based on user role
                if (userRole.ToLower() == "mechanic")
                {
                    // Mechanics can only see their own appointments
                    query = query.Where(a => a.MechanicId == userId);
                }

                var appointments = await query.ToListAsync();

                // Map to DTOs
                var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
                {
                    AppointmentId = a.AppointmentId,
                    OrderId = a.OrderId,
                    UserId = a.UserId,
                    VehicleId = a.VehicleId,
                    ServiceId = a.ServiceId,
                    MechanicId = a.MechanicId,
                    AppointmentDate = a.AppointmentDate,
                    TimeSlot = a.TimeSlot,
                    Status = a.Status,
                    Notes = a.Notes,
                    CreatedAt = a.CreatedAt,




                    // Map related entities
                    User = a.User != null ? new UserDetailsDto
                    {
                        UserId = a.User.UserId,
                        Name = a.User.Name,
                        Email = a.User.Email,
                        Phone = a.User.Phone,
                        Address = a.User.Address
                    } : null,

                    Mechanic = a.Mechanic != null ? new UserDetailsDto
                    {
                        UserId = a.Mechanic.UserId,
                        Name = a.Mechanic.Name,
                        Email = a.Mechanic.Email,
                        Phone = a.Mechanic.Phone
                    } : null,

                    Vehicle = a.Vehicle != null ? new VehicleDetailsDto
                    {
                        VehicleId = a.Vehicle.VehicleId,
                        Make = a.Vehicle.Make,
                        Model = a.Vehicle.Model,
                        Year = a.Vehicle.Year,
                        LicensePlate = a.Vehicle.LicensePlate
                    } : null,

                    // If service is not available, try to get inspection service details
                    Service = a.Service != null ? new ServiceDto
                    {
                        ServiceId = a.Service.ServiceId,
                        ServiceName = a.Service.ServiceName,
                        Category = a.Service.Category,
                        Price = a.Service.Price,
                        Description = a.Service.Description
                    } : a.Order?.Inspection?.Service != null ? new ServiceDto
                    {
                        ServiceId = a.Order.Inspection.Service.ServiceId,
                        ServiceName = a.Order.Inspection.Service.SubCategory,
                        Category = "Inspection",
                        SubCategory = a.Order.Inspection.Service.ServiceName,
                        Price = a.Order.Inspection.Service.Price,
                        Description = a.Order.Inspection.Service.Description
                    } : new ServiceDto
                    {
                        ServiceId = 0,
                        ServiceName = "Inspection",
                        Category = "Inspection",
                        Price = 0,
                        Description = "Vehicle inspection service"
                    }
                }).ToList();

                return Ok(appointmentDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving appointments");
                return StatusCode(500, new { message = "An error occurred while retrieving appointments", error = ex.Message });
            }
        }



        // GET: api/Appointments/5
        [HttpGet("{id}")]
        [Authorize(Roles = "super_admin,admin,service_agent,mechanic")]
        public async Task<ActionResult<AppointmentResponseDto>> GetAppointment(int id)
        {
            try
            {
                var appointment = await _context.Set<Appointment>()
                    .Include(a => a.User)
                    .Include(a => a.Vehicle)
                    .Include(a => a.Service)
                    .Include(a => a.Mechanic)
                    .Include(a => a.Order)
                        .ThenInclude(o => o.Inspection) // Include inspection details
                            .ThenInclude(i => i.Service) // Make sure the inspection's service is loaded
                    .FirstOrDefaultAsync(a => a.AppointmentId == id);

                if (appointment == null)
                {
                    return NotFound(new { message = "Appointment not found" });
                }

                // Check permissions
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userIdClaim != null && !string.IsNullOrEmpty(userIdClaim.Value))
                {
                    if (int.TryParse(userIdClaim.Value, out int userId))
                    {
                        // Mechanics can only view their own appointments
                        if (userRole.ToLower() == "mechanic" && appointment.MechanicId != userId)
                        {
                            return Forbid();
                        }
                    }
                }

                // Map to DTO
                var appointmentDto = new AppointmentResponseDto
                {
                    AppointmentId = appointment.AppointmentId,
                    OrderId = appointment.OrderId,
                    UserId = appointment.UserId,
                    VehicleId = appointment.VehicleId,
                    ServiceId = appointment.ServiceId,
                    MechanicId = appointment.MechanicId,
                    AppointmentDate = appointment.AppointmentDate,
                    TimeSlot = appointment.TimeSlot,
                    Status = appointment.Status,
                    Notes = appointment.Notes,
                    CreatedAt = appointment.CreatedAt,

                    // Map related entities
                    User = appointment.User != null ? new UserDetailsDto
                    {
                        UserId = appointment.User.UserId,
                        Name = appointment.User.Name,
                        Email = appointment.User.Email,
                        Phone = appointment.User.Phone,
                        Address = appointment.User.Address
                    } : null,

                    Mechanic = appointment.Mechanic != null ? new UserDetailsDto
                    {
                        UserId = appointment.Mechanic.UserId,
                        Name = appointment.Mechanic.Name,
                        Email = appointment.Mechanic.Email,
                        Phone = appointment.Mechanic.Phone
                    } : null,

                    Vehicle = appointment.Vehicle != null ? new VehicleDetailsDto
                    {
                        VehicleId = appointment.Vehicle.VehicleId,
                        Make = appointment.Vehicle.Make,
                        Model = appointment.Vehicle.Model,
                        Year = appointment.Vehicle.Year,
                        LicensePlate = appointment.Vehicle.LicensePlate
                    } : null,

                    // If service is not available, try to get inspection service details
                    Service = appointment.Service != null ? new ServiceDto
                    {
                        ServiceId = appointment.Service.ServiceId,
                        ServiceName = appointment.Service.ServiceName,
                        Category = appointment.Service.Category,
                        Price = appointment.Service.Price,
                        Description = appointment.Service.Description
                    } : appointment.Order?.Inspection?.Service != null ? new ServiceDto
                    {
                        ServiceId = appointment.Order.Inspection.Service.ServiceId,
                        ServiceName = appointment.Order.Inspection.Service.SubCategory,
                        Category = "Inspection",
                        SubCategory = appointment.Order.Inspection.Service.ServiceName,
                        Price = appointment.Order.Inspection.Service.Price,
                        Description = appointment.Order.Inspection.Service.Description
                    } : new ServiceDto
                    {
                        ServiceId = 0,
                        ServiceName = "Inspection",
                        Category = "Inspection",
                        Price = 0,
                        Description = "Vehicle inspection service"
                    }
                };

                // Return just the DTO directly, not wrapped in any additional object
                return Ok(appointmentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving appointment {AppointmentId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the appointment", error = ex.Message });
            }
        }

        // POST: api/Appointments
        [HttpPost]
        [Authorize(Roles = "super_admin,admin,service_agent")]
        public async Task<ActionResult<AppointmentResponseDto>> CreateAppointment([FromBody] AppointmentRequest request)
        {
            try
            {
                // Validate request
                if (request == null || request.OrderId <= 0 || request.MechanicId <= 0)
                {
                    return BadRequest(new { message = "Invalid request data. Order ID and Mechanic ID are required." });
                }

                // Check if order exists
                var order = await _context.Orders
                    .Include(o => o.User)
                    .Include(o => o.Vehicle)
                    .Include(o => o.Service)
                    .Include(o => o.Inspection) // Include the inspection to get date/time
                    .FirstOrDefaultAsync(o => o.OrderId == request.OrderId);

                if (order == null)
                {
                    return BadRequest(new { message = "Order not found" });
                }

                // Get the date and time slot from the inspection
                DateTime appointmentDate;
                string timeSlot;

                if (order.Inspection != null)
                {
                    // Use the inspection's date and time slot
                    appointmentDate = order.Inspection.ScheduledDate;
                    timeSlot = order.Inspection.TimeSlot;
                }
                else if (request.AppointmentDate != default && !string.IsNullOrEmpty(request.TimeSlot))
                {
                    // If no inspection, but date and time provided in request, use those
                    appointmentDate = request.AppointmentDate.Value;
                    timeSlot = request.TimeSlot;
                }
                else
                {
                    return BadRequest(new
                    {
                        message = "No inspection found for this order and no date/time provided in request"
                    });
                }

                // First, check if an appointment already exists for this order
                var existingAppointment = await _context.Appointments
                    .FirstOrDefaultAsync(a => a.OrderId == request.OrderId);

                if (existingAppointment != null)
                {
                    return BadRequest(new { message = "An appointment already exists for this order" });
                }

                // Check if mechanic exists and is available (only check against OTHER appointments, not this order's inspection)
                bool isMechanicAvailable = await _context.Appointments
                    .Where(a => a.MechanicId == request.MechanicId &&
                           a.AppointmentDate.Date == appointmentDate.Date &&
                           a.TimeSlot == timeSlot &&
                           a.Status != "cancelled" &&
                           a.OrderId != request.OrderId)
                    .CountAsync() == 0;

                if (!isMechanicAvailable)
                {
                    return BadRequest(new
                    {
                        message = "Mechanic is not available for the selected date and time slot"
                    });
                }

                // Create appointment
                var appointment = new Appointment
                {
                    OrderId = request.OrderId,
                    UserId = order.UserId,
                    VehicleId = order.VehicleId,
                    ServiceId = order.ServiceId,
                    MechanicId = request.MechanicId,
                    AppointmentDate = appointmentDate,
                    TimeSlot = timeSlot,
                    Status = "scheduled",
                    Notes = request.Notes ?? "",
                    CreatedAt = DateTime.Now
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                // Update order status
                order.Status = "in progress";
                await _context.SaveChangesAsync();

                // Create notifications
                var customerNotification = new Notification
                {
                    UserId = order.UserId,
                    Message = $"A mechanic has been assigned to your order. Appointment scheduled for {appointmentDate.ToString("yyyy-MM-dd")} at {timeSlot}",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };

                var mechanicNotification = new Notification
                {
                    UserId = request.MechanicId,
                    Message = $"You have been assigned to Order #{order.OrderId}. Appointment scheduled for {appointmentDate.ToString("yyyy-MM-dd")} at {timeSlot}",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };

                _context.Notifications.AddRange(customerNotification, mechanicNotification);
                await _context.SaveChangesAsync();

                // Get mechanic details
                var mechanic = await _context.Users.FindAsync(request.MechanicId);

                // Map to response DTO
                var appointmentDto = new AppointmentResponseDto
                {
                    AppointmentId = appointment.AppointmentId,
                    OrderId = appointment.OrderId,
                    UserId = appointment.UserId,
                    VehicleId = appointment.VehicleId,
                    ServiceId = appointment.ServiceId,
                    MechanicId = appointment.MechanicId,
                    AppointmentDate = appointment.AppointmentDate,
                    TimeSlot = appointment.TimeSlot,
                    Status = appointment.Status,
                    Notes = appointment.Notes,
                    CreatedAt = appointment.CreatedAt,

                    // Map related entities
                    User = order.User != null ? new UserDetailsDto
                    {
                        UserId = order.User.UserId,
                        Name = order.User.Name,
                        Email = order.User.Email,
                        Phone = order.User.Phone,
                        Address = order.User.Address
                    } : null,

                    Mechanic = mechanic != null ? new UserDetailsDto
                    {
                        UserId = mechanic.UserId,
                        Name = mechanic.Name,
                        Email = mechanic.Email,
                        Phone = mechanic.Phone
                    } : null,

                    Vehicle = order.Vehicle != null ? new VehicleDetailsDto
                    {
                        VehicleId = order.Vehicle.VehicleId,
                        Make = order.Vehicle.Make,
                        Model = order.Vehicle.Model,
                        Year = order.Vehicle.Year,
                        LicensePlate = order.Vehicle.LicensePlate
                    } : null,

                    Service = order.Service != null ? new ServiceDto
                    {
                        ServiceId = order.Service.ServiceId,
                        ServiceName = order.Service.ServiceName,
                        Category = order.Service.Category,
                        Price = order.Service.Price,
                        Description = order.Service.Description
                    } : null
                };

                return CreatedAtAction(nameof(GetAppointment), new { id = appointment.AppointmentId }, appointmentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating appointment");
                return StatusCode(500, new { message = "An error occurred while creating the appointment", error = ex.Message });
            }
        }


        // PUT: api/Appointments/5
        [HttpPut("{id}")]
        [Authorize(Roles = "super_admin,admin,service_agent,mechanic")]
        public async Task<IActionResult> UpdateAppointment(int id, [FromBody] AppointmentUpdateRequest request)
        {
            try
            {
                var appointment = await _context.Set<Appointment>().FindAsync(id);
                if (appointment == null)
                {
                    return NotFound(new { message = "Appointment not found" });
                }

                // Check permissions
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userIdClaim != null && !string.IsNullOrEmpty(userIdClaim.Value))
                {
                    if (int.TryParse(userIdClaim.Value, out int userId))
                    {
                        // Mechanics can only update appointments assigned to them
                        if (userRole.ToLower() == "mechanic" && appointment.MechanicId != userId)
                        {
                            return Forbid();
                        }
                    }
                }

                // Update status if provided
                if (!string.IsNullOrEmpty(request.Status))
                {
                    appointment.Status = request.Status;

                    // If completing an inspection appointment, update the order status accordingly
                    if (request.Status.ToLower() == "completed")
                    {
                        var order = await _context.Orders
                            .Include(o => o.Inspection)
                            .Include(o => o.OrderServices)
                            .FirstOrDefaultAsync(o => o.OrderId == appointment.OrderId);

                        if (order != null)
                        {
                            // Check if this is an inspection-only order
                            bool isInspectionOnlyOrder = !order.ServiceId.HasValue && order.IncludesInspection;

                            // Check if there are any non-inspection additional services
                            bool hasNonInspectionServices = order.OrderServices.Any(os =>
                                _context.Services.Any(s => s.ServiceId == os.ServiceId && s.Category.ToLower() != "inspection"));

                            // If inspection-only with no additional non-inspection services, mark order as completed
                            if (isInspectionOnlyOrder && !hasNonInspectionServices)
                            {
                                order.Status = "completed";
                            }
                            else if (hasNonInspectionServices)
                            {
                                // If there are non-inspection services, keep order in progress for service transfer
                                order.Status = "in progress";
                            }

                            // Create notification for customer
                            var notification = new Notification
                            {
                                UserId = appointment.UserId,
                                Message = isInspectionOnlyOrder && !hasNonInspectionServices
                                    ? "Your inspection has been completed"
                                    : "Your inspection has been completed. Service work will be scheduled next.",
                                Status = "unread",
                                CreatedAt = DateTime.Now
                            };

                            _context.Notifications.Add(notification);
                        }
                    }
                }

                // Update notes if provided
                if (!string.IsNullOrEmpty(request.Notes))
                {
                    appointment.Notes = request.Notes;
                }

                // Update time slot if provided (for mechanics, this should be optional)
                if (!string.IsNullOrEmpty(request.TimeSlot) && userRole.ToLower() != "mechanic")
                {
                    appointment.TimeSlot = request.TimeSlot;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Appointment updated successfully",
                    appointmentId = appointment.AppointmentId,
                    status = appointment.Status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating appointment {AppointmentId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the appointment", error = ex.Message });
            }
        }



        // DELETE: api/Appointments/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            try
            {
                var appointment = await _context.Set<Appointment>().FindAsync(id);
                if (appointment == null)
                {
                    return NotFound(new { message = "Appointment not found" });
                }

                // Only allow deleting scheduled or cancelled appointments
                if (appointment.Status != "scheduled" && appointment.Status != "cancelled")
                {
                    return BadRequest(new { message = "Only scheduled or cancelled appointments can be deleted" });
                }

                _context.Set<Appointment>().Remove(appointment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Appointment deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting appointment {AppointmentId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the appointment", error = ex.Message });
            }
        }

        // Add this method to your AppointmentsController.cs

        // GET: api/Appointments/mechanics/available
        [HttpGet("mechanics/available")]
        [Authorize(Roles = "super_admin,admin,service_agent")]
        public async Task<ActionResult<IEnumerable<MechanicAvailabilityDto>>> GetAvailableMechanics(
            [FromQuery] DateTime date,
            [FromQuery] string timeSlot,
            [FromQuery] int? orderId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(timeSlot))
                {
                    return BadRequest(new { message = "Time slot is required" });
                }

                // Get all mechanics
                var mechanics = await _context.Users
                    .Where(u => u.Role.ToLower() == "mechanic")
                    .ToListAsync();

                if (!mechanics.Any())
                {
                    return Ok(new List<MechanicAvailabilityDto>());
                }

                // Check which mechanics are already booked for this time slot
                // Exclude appointments for the current order if orderId is provided
                var bookedMechanicIds = await _context.Appointments
                    .Where(a => a.AppointmentDate.Date == date.Date &&
                           a.TimeSlot == timeSlot &&
                           a.Status != "cancelled" &&
                           (orderId == null || a.OrderId != orderId))
                    .Select(a => a.MechanicId)
                    .ToListAsync();

                // Create availability DTOs
                var mechanicAvailability = mechanics.Select(m => new MechanicAvailabilityDto
                {
                    MechanicId = m.UserId,
                    Name = m.Name,
                    Email = m.Email,
                    Phone = m.Phone,
                    IsAvailable = !bookedMechanicIds.Contains(m.UserId)
                }).ToList();

                return Ok(mechanicAvailability);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available mechanics for date {Date} and time slot {TimeSlot}", date, timeSlot);
                return StatusCode(500, new { message = "An error occurred while retrieving available mechanics", error = ex.Message });
            }
        }


        // GET: api/Appointments/timeslots/available
        [HttpGet("timeslots/available")]
        [Authorize(Roles = "super_admin,admin,service_agent")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableTimeSlots([FromQuery] DateTime date, [FromQuery] int? mechanicId = null)
        {
            try
            {
                var availableTimeSlots = await _appointmentService.GetAvailableTimeSlotsAsync(date, mechanicId);

                return Ok(availableTimeSlots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available time slots for date {Date} and mechanic {MechanicId}", date, mechanicId);
                return StatusCode(500, new { message = "An error occurred while retrieving available time slots", error = ex.Message });
            }
        }

        // GET: api/Appointments/mechanic/{mechanicId}/schedule
        [HttpGet("mechanic/{mechanicId}/schedule")]
        [Authorize(Roles = "super_admin,admin,service_agent,mechanic")]
        public async Task<ActionResult<IEnumerable<AppointmentResponseDto>>> GetMechanicSchedule(int mechanicId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Validate mechanic access
                if (userIdClaim != null && !string.IsNullOrEmpty(userIdClaim.Value))
                {
                    if (int.TryParse(userIdClaim.Value, out int userId))
                    {
                        // Mechanics can only view their own schedule
                        if (userRole.ToLower() == "mechanic" && mechanicId != userId)
                        {
                            return Forbid();
                        }
                    }
                }

                // Set default date range if not provided
                DateTime start = startDate ?? DateTime.Now.Date;
                DateTime end = endDate ?? start.AddDays(30);

                // Validate date range
                if (end < start)
                {
                    return BadRequest(new { message = "End date cannot be before start date" });
                }

                // Get mechanic's appointments
                var appointments = await _context.Set<Appointment>()
                    .Include(a => a.User)
                    .Include(a => a.Vehicle)
                    .Include(a => a.Service)
                    .Include(a => a.Order)
                    .Where(a => a.MechanicId == mechanicId &&
                           a.AppointmentDate >= start &&
                           a.AppointmentDate <= end)
                    .OrderBy(a => a.AppointmentDate)
                    .ThenBy(a => a.TimeSlot)
                    .ToListAsync();

                // Map to DTOs
                var appointmentDtos = appointments.Select(a => new AppointmentResponseDto
                {
                    AppointmentId = a.AppointmentId,
                    OrderId = a.OrderId,
                    UserId = a.UserId,
                    VehicleId = a.VehicleId,
                    ServiceId = a.ServiceId,
                    MechanicId = a.MechanicId,
                    AppointmentDate = a.AppointmentDate,
                    TimeSlot = a.TimeSlot,
                    Status = a.Status,
                    Notes = a.Notes,
                    CreatedAt = a.CreatedAt,

                    // Map related entities
                    User = a.User != null ? new UserDetailsDto
                    {
                        UserId = a.User.UserId,
                        Name = a.User.Name,
                        Email = a.User.Email,
                        Phone = a.User.Phone,
                        Address = a.User.Address
                    } : null,

                    Vehicle = a.Vehicle != null ? new VehicleDetailsDto
                    {
                        VehicleId = a.Vehicle.VehicleId,
                        Make = a.Vehicle.Make,
                        Model = a.Vehicle.Model,
                        Year = a.Vehicle.Year,
                        LicensePlate = a.Vehicle.LicensePlate
                    } : null,

                    Service = a.Service != null ? new ServiceDto
                    {
                        ServiceId = a.Service.ServiceId,
                        ServiceName = a.Service.ServiceName,
                        Category = a.Service.Category,
                        Price = a.Service.Price,
                        Description = a.Service.Description
                    } : null
                }).ToList();

                return Ok(appointmentDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving schedule for mechanic {MechanicId}", mechanicId);
                return StatusCode(500, new { message = "An error occurred while retrieving the mechanic's schedule", error = ex.Message });
            }
        }

        // POST: api/Appointments/order/{orderId}/check-availability
        [HttpPost("order/{orderId}/check-availability")]
        [Authorize(Roles = "super_admin,admin,service_agent")]
        public async Task<ActionResult<object>> CheckMechanicAvailability(int orderId, [FromBody] AppointmentRequest request)
        {
            try
            {
                // Check if mechanic exists and is available
                bool isMechanicAvailable = await _appointmentService.IsMechanicAvailableAsync(
                    request.MechanicId, request.AppointmentDate.Value, request.TimeSlot);

                return Ok(new
                {
                    isAvailable = isMechanicAvailable,
                    message = isMechanicAvailable
                        ? "Mechanic is available for the selected date and time slot"
                        : "Mechanic is not available for the selected date and time slot"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking mechanic availability for orderId {OrderId}", orderId);
                return StatusCode(500, new { message = "An error occurred while checking mechanic availability", error = ex.Message });
            }
        }
    }
}