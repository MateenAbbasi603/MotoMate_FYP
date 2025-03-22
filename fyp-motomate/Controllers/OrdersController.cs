// Controllers/OrdersController.cs
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
using fyp_motomate.Models.DTOs;


namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
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
        public async Task<ActionResult<Order>> GetOrder(int id)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Vehicle)
                .Include(o => o.Service)
                .Include(o => o.Inspection)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            // Check permissions
            if (userRole == "customer" && order.UserId != userId)
            {
                return Forbid();
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
                    ScheduledDate = request.InspectionDate.Value,
                    Status = "pending",
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow,
                    OrderId = order.OrderId
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

 
}