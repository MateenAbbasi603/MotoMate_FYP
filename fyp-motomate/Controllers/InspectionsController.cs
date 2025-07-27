using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InspectionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InspectionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Inspections
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Inspection>>> GetInspections()
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // If user is a customer, only return their inspections
            if (userRole == "customer")
            {
                return await _context.Inspections
                    .Where(i => i.UserId == userId)
                    .Include(i => i.Vehicle)
                    .ToListAsync();
            }
            // If user is a mechanic, return inspections for appointments assigned to them
            else if (userRole == "mechanic")
            {
                // Find all orders assigned to this mechanic through appointments
                var assignments = await _context.Appointments
                    .Where(a => a.MechanicId == userId)
                    .Select(a => a.OrderId)
                    .ToListAsync();

                return await _context.Inspections
                    .Where(i => i.OrderId.HasValue && assignments.Contains(i.OrderId.Value))
                    .Include(i => i.User)
                    .Include(i => i.Vehicle)
                    .ToListAsync();
            }
            // If user is staff, return all inspections
            else
            {
                return await _context.Inspections
                    .Include(i => i.User)
                    .Include(i => i.Vehicle)
                    .ToListAsync();
            }
        }

        // GET: api/Inspections/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Inspection>> GetInspection(int id)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var inspection = await _context.Inspections
                .Include(i => i.User)
                .Include(i => i.Vehicle)
                .Include(i => i.Order)
                .FirstOrDefaultAsync(i => i.InspectionId == id);

            if (inspection == null)
            {
                return NotFound(new { message = "Inspection not found" });
            }

            // Check permissions
            if (userRole == "customer" && inspection.UserId != userId)
            {
                return Forbid();
            }
            else if (userRole == "mechanic")
            {
                // Mechanic can only access inspections for orders assigned to them
                if (inspection.OrderId.HasValue)
                {
                    var assignment = await _context.Appointments
                        .AnyAsync(a => a.OrderId == inspection.OrderId && a.MechanicId == userId);
                    
                    if (!assignment)
                    {
                        return Forbid();
                    }
                }
                else
                {
                    // If there's no order associated, mechanic can't access this inspection
                    return Forbid();
                }
            }

            return inspection;
        }

        // POST: api/Inspections
        [HttpPost]
        public async Task<ActionResult<Inspection>> CreateInspection([FromBody] InspectionRequest request)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Validate request
            if (request.ScheduledDate <DateTime.Now.Date)
            {
                return BadRequest(new { message = "Scheduled date must be in the future" });
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

            // Create inspection
            var inspection = new Inspection
            {
                UserId = request.UserId,
                VehicleId = request.VehicleId,
                ScheduledDate = request.ScheduledDate,
                TimeSlot = request.TimeSlot ?? "09:00 AM - 11:00 AM", // Default time slot
                Notes = request.Notes,
                Status = "pending",
                CreatedAt =DateTime.Now,
                // Initialize default values for inspection fields
                EngineCondition = "Not Inspected Yet",
                TransmissionCondition = "Not Inspected Yet",
                BrakeCondition = "Not Inspected Yet",
                ElectricalCondition = "Not Inspected Yet",
                BodyCondition = "Not Inspected Yet",
                TireCondition = "Not Inspected Yet"
            };

            _context.Inspections.Add(inspection);
            await _context.SaveChangesAsync();

            // Create a notification for the user
            var notification = new Notification
            {
                UserId = inspection.UserId,
                Message = $"Inspection scheduled for {inspection.ScheduledDate.ToString("MMM dd, yyyy")}",
                Status = "unread",
                CreatedAt =DateTime.Now
            };
            _context.Notifications.Add(notification);

            // Create a notification for mechanics/admins
            var staffNotification = new Notification
            {
                // Assuming there's an admin user with ID 1
                UserId = 1,
                Message = $"New inspection requested for {inspection.ScheduledDate.ToString("MMM dd, yyyy")}",
                Status = "unread",
                CreatedAt =DateTime.Now
            };
            _context.Notifications.Add(staffNotification);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInspection), new { id = inspection.InspectionId }, inspection);
        }

        // PUT: api/Inspections/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInspection(int id, [FromBody] InspectionUpdateRequest request)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var inspection = await _context.Inspections
                .Include(i => i.Order)
                .FirstOrDefaultAsync(i => i.InspectionId == id);

            if (inspection == null)
            {
                return NotFound(new { message = "Inspection not found" });
            }

            // Check permissions
            if (userRole == "customer")
            {
                if (inspection.UserId != userId)
                {
                    return Forbid();
                }

                // Customers can only update notes or cancel
                if (request.Status == "cancelled")
                {
                    inspection.Status = "cancelled";
                }

                if (!string.IsNullOrEmpty(request.Notes))
                {
                    inspection.Notes = request.Notes;
                }
            }
            else if (userRole == "mechanic")
            {
                // Mechanic can only update inspections for orders assigned to them
                if (inspection.OrderId.HasValue)
                {
                    var assignment = await _context.Appointments
                        .AnyAsync(a => a.OrderId == inspection.OrderId && a.MechanicId == userId);
                    
                    if (!assignment)
                    {
                        return Forbid();
                    }
                }
                else
                {
                    // If there's no order associated, mechanic can't modify this inspection
                    return Forbid();
                }

                // Mechanics can update inspection report details and status
                if (!string.IsNullOrEmpty(request.Status))
                {
                    inspection.Status = request.Status;
                }

                if (!string.IsNullOrEmpty(request.Notes))
                {
                    inspection.Notes = request.Notes;
                }

                // Update inspection report details
                if (!string.IsNullOrEmpty(request.EngineCondition))
                    inspection.EngineCondition = request.EngineCondition;

                if (!string.IsNullOrEmpty(request.TransmissionCondition))
                    inspection.TransmissionCondition = request.TransmissionCondition;

                if (!string.IsNullOrEmpty(request.BrakeCondition))
                    inspection.BrakeCondition = request.BrakeCondition;

                if (!string.IsNullOrEmpty(request.ElectricalCondition))
                    inspection.ElectricalCondition = request.ElectricalCondition;

                if (!string.IsNullOrEmpty(request.BodyCondition))
                    inspection.BodyCondition = request.BodyCondition;

                if (!string.IsNullOrEmpty(request.TireCondition))
                    inspection.TireCondition = request.TireCondition;

                // If marking as completed, set the completion date
                if (request.Status == "completed" && !inspection.CompletedAt.HasValue)
                {
                    inspection.CompletedAt =DateTime.Now;

                    // Also update the order status if there is an associated order
                    if (inspection.Order != null)
                    {
                        inspection.Order.Status = "in progress";
                    }
                }
            }
            else
            {
                // Staff can update all fields
                if (!string.IsNullOrEmpty(request.Status))
                {
                    inspection.Status = request.Status;
                }

                if (!string.IsNullOrEmpty(request.Notes))
                {
                    inspection.Notes = request.Notes;
                }

                // If marking as completed, set the completion date
                if (request.Status == "completed" && !inspection.CompletedAt.HasValue)
                {
                    inspection.CompletedAt =DateTime.Now;
                }

                // Update inspection report details
                if (!string.IsNullOrEmpty(request.EngineCondition))
                    inspection.EngineCondition = request.EngineCondition;

                if (!string.IsNullOrEmpty(request.TransmissionCondition))
                    inspection.TransmissionCondition = request.TransmissionCondition;

                if (!string.IsNullOrEmpty(request.BrakeCondition))
                    inspection.BrakeCondition = request.BrakeCondition;

                if (!string.IsNullOrEmpty(request.ElectricalCondition))
                    inspection.ElectricalCondition = request.ElectricalCondition;

                if (!string.IsNullOrEmpty(request.BodyCondition))
                    inspection.BodyCondition = request.BodyCondition;

                if (!string.IsNullOrEmpty(request.TireCondition))
                    inspection.TireCondition = request.TireCondition;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InspectionExists(id))
                {
                    return NotFound(new { message = "Inspection not found" });
                }
                else
                {
                    throw;
                }
            }

            // Create a notification about the update
            var notification = new Notification
            {
                UserId = inspection.UserId,
                Message = $"Your inspection status has been updated to {inspection.Status}",
                Status = "unread",
                CreatedAt =DateTime.Now
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Inspection updated successfully", inspection });
        }

        // DELETE: api/Inspections/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<IActionResult> DeleteInspection(int id)
        {
            var inspection = await _context.Inspections.FindAsync(id);
            if (inspection == null)
            {
                return NotFound(new { message = "Inspection not found" });
            }

            // Only allow deleting of cancelled or pending inspections
            if (inspection.Status != "cancelled" && inspection.Status != "pending")
            {
                return BadRequest(new { message = "Only cancelled or pending inspections can be deleted" });
            }

            _context.Inspections.Remove(inspection);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Inspection deleted successfully" });
        }

        // POST: api/Inspections/5/report
        [HttpPost("{id}/report")]
        [Authorize(Roles = "mechanic,admin,service_agent")]
        public async Task<IActionResult> SubmitInspectionReport(int id, [FromBody] InspectionReportRequest request)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var inspection = await _context.Inspections
                    .Include(i => i.Order)
                    .FirstOrDefaultAsync(i => i.InspectionId == id);

                if (inspection == null)
                {
                    return NotFound(new { message = "Inspection not found" });
                }

                // For mechanics, verify they are assigned to this inspection
                if (userRole == "mechanic" && inspection.OrderId.HasValue)
                {
                    var assignment = await _context.Appointments
                        .AnyAsync(a => a.OrderId == inspection.OrderId && a.MechanicId == userId);
                    
                    if (!assignment)
                    {
                        return Forbid();
                    }
                }

                // Update inspection fields
                if (!string.IsNullOrEmpty(request.EngineCondition))
                    inspection.EngineCondition = request.EngineCondition;
                
                if (!string.IsNullOrEmpty(request.TransmissionCondition))
                    inspection.TransmissionCondition = request.TransmissionCondition;
                
                if (!string.IsNullOrEmpty(request.BrakeCondition))
                    inspection.BrakeCondition = request.BrakeCondition;
                
                if (!string.IsNullOrEmpty(request.ElectricalCondition))
                    inspection.ElectricalCondition = request.ElectricalCondition;
                
                if (!string.IsNullOrEmpty(request.BodyCondition))
                    inspection.BodyCondition = request.BodyCondition;
                
                if (!string.IsNullOrEmpty(request.TireCondition))
                    inspection.TireCondition = request.TireCondition;
                
                if (!string.IsNullOrEmpty(request.Notes))
                    inspection.Notes = request.Notes;
                
                // Add this line to update the MechanicId in the Inspection table
                if (request.MechanicId > 0)  // Make sure it's a valid ID
                {
                    inspection.MechanicId = request.MechanicId;  // You'll need to add this field to your Inspection model
                }
                
                inspection.Status = "completed";
                inspection.CompletedAt = DateTime.Now;

                // Update the order status if available
                if (inspection.Order != null)
                {
                    inspection.Order.Status = "in progress";
                }

                // Update the appointment status if there is one for this order
                if (inspection.OrderId.HasValue)
                {
                    var appointment = await _context.Appointments
                        .FirstOrDefaultAsync(a => a.OrderId == inspection.OrderId);
                    
                    if (appointment != null)
                    {
                        appointment.Status = "completed";
                    }
                }

                await _context.SaveChangesAsync();

                // Create notification for customer
                var notification = new Notification
                {
                    UserId = inspection.UserId,
                    Message = "Your inspection has been completed",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Inspection report submitted successfully", inspection });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while submitting the inspection report", error = ex.Message });
            }
        }
        // POST: api/Inspections/5/convert-to-order
        [HttpPost("{id}/convert-to-order")]
        [Authorize(Roles = "super_admin,admin,service_agent")]
        public async Task<IActionResult> ConvertToOrder(int id, [FromBody] OrderConversionRequest request)
        {
            var inspection = await _context.Inspections.FindAsync(id);
            if (inspection == null)
            {
                return NotFound(new { message = "Inspection not found" });
            }

            // Check if already converted
            if (inspection.OrderId > 0)
            {
                return BadRequest(new { message = "Inspection already converted to an order" });
            }

            // Check if inspection is completed
            if (inspection.Status != "completed")
            {
                return BadRequest(new { message = "Only completed inspections can be converted to orders" });
            }

            // Validate service if provided
            Service service = null;
            if (request.ServiceId.HasValue)
            {
                service = await _context.Services.FindAsync(request.ServiceId.Value);
                if (service == null)
                {
                    return BadRequest(new { message = "Service not found" });
                }
            }

            // Create order
            var order = new Order
            {
                UserId = inspection.UserId,
                VehicleId = inspection.VehicleId,
                ServiceId = request.ServiceId,
                IncludesInspection = true,
                OrderDate =DateTime.Now,
                Status = "pending",
                TotalAmount = request.TotalAmount,
                Notes = request.Notes ?? inspection.Notes
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Link inspection to order
            inspection.OrderId = order.OrderId;
            await _context.SaveChangesAsync();

            // Create notification
            var notification = new Notification
            {
                UserId = inspection.UserId,
                Message = "Your inspection has been converted to an order",
                Status = "unread",
                CreatedAt =DateTime.Now
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Inspection converted to order successfully", orderId = order.OrderId });
        }

        // GET: api/Inspections/report/order/{orderId}
        [AllowAnonymous]
        [HttpGet("report/order/{orderId}")]
        public async Task<IActionResult> GetReportsByOrder(int orderId)
        {
            var reports = await _context.InspectionReports
                .Where(r => r.OrderId == orderId)
                .ToListAsync();
            return Ok(reports);
        }

        // POST: api/Inspections/report
        [HttpPost("report")]
        [Authorize(Roles = "mechanic")]
        public async Task<IActionResult> CreateOrUpdateReport([FromBody] InspectionReportDto dto)
        {
            var report = await _context.InspectionReports
                .FirstOrDefaultAsync(r => r.OrderId == dto.OrderId && r.ServiceId == dto.ServiceId);

            if (report == null)
            {
                report = new InspectionReport
                {
                    OrderId = dto.OrderId,
                    ServiceId = dto.ServiceId,
                    MechanicId = dto.MechanicId,
                    ReportData = dto.ReportData,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                _context.InspectionReports.Add(report);
            }
            else
            {
                report.ReportData = dto.ReportData;
                report.UpdatedAt = DateTime.Now;
            }
            await _context.SaveChangesAsync();
            return Ok(report);
        }

        private bool InspectionExists(int id)
        {
            return _context.Inspections.Any(e => e.InspectionId == id);
        }
    }

    // Request DTOs
    public class InspectionRequest
    {
        public int UserId { get; set; }
        public int VehicleId { get; set; }


        public DateTime ScheduledDate { get; set; }
        public string TimeSlot { get; set; }
        public string Notes { get; set; }
    }

    public class InspectionUpdateRequest
    {
        public string Status { get; set; }
        public string Notes { get; set; }
        public string EngineCondition { get; set; }
        public string TransmissionCondition { get; set; }
        public string BrakeCondition { get; set; }
        public string ElectricalCondition { get; set; }
        public string BodyCondition { get; set; }
        public string TireCondition { get; set; }
    }

    public class InspectionReportRequest
    {
        public string EngineCondition { get; set; }
        public string TransmissionCondition { get; set; }
        public string BrakeCondition { get; set; }
        public string ElectricalCondition { get; set; }
        public string BodyCondition { get; set; }
        public string TireCondition { get; set; }
        public string Notes { get; set; }
        public int MechanicId { get; set; }

    }

    public class OrderConversionRequest
    {
        public int? ServiceId { get; set; }
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; }
    }

    // Add DTO for InspectionReport
    public class InspectionReportDto
    {
        public int InspectionReportId { get; set; }
        public int OrderId { get; set; }
        public int ServiceId { get; set; }
        public int MechanicId { get; set; }
        public string ReportData { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}