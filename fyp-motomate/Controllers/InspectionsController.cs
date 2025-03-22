// Controllers/InspectionsController.cs
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

            return inspection;
        }

        // POST: api/Inspections
        [HttpPost]
        public async Task<ActionResult<Inspection>> CreateInspection([FromBody] InspectionRequest request)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Validate request
            if (request.ScheduledDate < DateTime.UtcNow.Date)
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
                Notes = request.Notes,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Inspections.Add(inspection);
            await _context.SaveChangesAsync();

            // Create a notification for the user
            var notification = new Notification
            {
                UserId = inspection.UserId,
                Message = $"Inspection scheduled for {inspection.ScheduledDate.ToString("MMM dd, yyyy")}",
                Status = "unread",
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            // Create a notification for mechanics/admins
            var staffNotification = new Notification
            {
                // Assuming there's an admin user with ID 1
                UserId = 1,
                Message = $"New inspection requested for {inspection.ScheduledDate.ToString("MMM dd, yyyy")}",
                Status = "unread",
                CreatedAt = DateTime.UtcNow
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

            var inspection = await _context.Inspections.FindAsync(id);
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
                    inspection.CompletedAt = DateTime.UtcNow;
                }

                // Update inspection report details if provided
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
                CreatedAt = DateTime.UtcNow
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
            if (inspection.OrderId.HasValue)
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
                OrderDate = DateTime.UtcNow,
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
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Inspection converted to order successfully", orderId = order.OrderId });
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

    public class OrderConversionRequest
    {
        public int? ServiceId { get; set; }
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; }
    }
}