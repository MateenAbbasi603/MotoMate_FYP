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
    [Authorize]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(ApplicationDbContext context, ILogger<ReviewsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Reviews
        [HttpGet]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetReviews()
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Mechanic)
                .Include(r => r.Order)
                .Select(r => new
                {
                    r.ReviewId,
                    r.OrderId,
                    r.UserId,
                    r.MechanicId,
                    r.ReviewType,
                    r.Rating,
                    r.Comments,
                    r.ReviewDate,
                    User = new
                    {
                        r.User.UserId,
                        r.User.Name,
                        r.User.Email
                    },
                    Mechanic = r.Mechanic != null ? new
                    {
                        r.Mechanic.UserId,
                        r.Mechanic.Name
                    } : null,
                    Order = new
                    {
                        r.Order.OrderId,
                        r.Order.TotalAmount,
                        r.Order.OrderDate,
                        r.Order.Status
                    }
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // GET: api/Reviews/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetReview(int id)
        {
            var review = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Mechanic)
                .Include(r => r.Order)
                .Where(r => r.ReviewId == id)
                .Select(r => new
                {
                    r.ReviewId,
                    r.OrderId,
                    r.UserId,
                    r.MechanicId,
                    r.ReviewType,
                    r.Rating,
                    r.Comments,
                    r.ReviewDate,
                    User = new
                    {
                        r.User.UserId,
                        r.User.Name,
                        r.User.Email
                    },
                    Mechanic = r.Mechanic != null ? new
                    {
                        r.Mechanic.UserId,
                        r.Mechanic.Name
                    } : null,
                    Order = new
                    {
                        r.Order.OrderId,
                        r.Order.TotalAmount,
                        r.Order.OrderDate,
                        r.Order.Status
                    }
                })
                .FirstOrDefaultAsync();

            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            return Ok(review);
        }

        // POST: api/Reviews/SubmitOrderReview
        [HttpPost("SubmitOrderReview")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<object>> SubmitOrderReview([FromBody] OrderReviewRequest request)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                // Validate request
                if (request.OrderId <= 0 || request.MechanicRating <= 0 || request.MechanicRating > 5)
                {
                    return BadRequest(new { success = false, message = "Invalid review data" });
                }

                // Verify that the order exists and belongs to the user
                var order = await _context.Orders
                    .Include(o => o.User)
                    .FirstOrDefaultAsync(o => o.OrderId == request.OrderId);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found" });
                }

                if (order.UserId != userId)
                {
                    return Forbid();
                }

                // Verify order is completed
                if (order.Status != "completed")
                {
                    return BadRequest(new { success = false, message = "Cannot review an order that is not completed" });
                }

                // Check if mechanic review already exists for this order
                var existingMechanicReview = await _context.Reviews
                    .AnyAsync(r => r.OrderId == request.OrderId && r.UserId == userId && r.ReviewType == "Mechanic");

                if (existingMechanicReview)
                {
                    return BadRequest(new { success = false, message = "Mechanic review already submitted for this order" });
                }

                // Find the mechanic for this order (from the first appointment)
                var appointment = await _context.Appointments
                    .Where(a => a.OrderId == request.OrderId)
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefaultAsync();

                if (appointment == null || appointment.MechanicId <= 0)
                {
                    return BadRequest(new { success = false, message = "No mechanic found for this order" });
                }

                int mechanicId = appointment.MechanicId;

                // Create mechanic review
                var mechanicReview = new Review
                {
                    OrderId = request.OrderId,
                    UserId = userId,
                    MechanicId = mechanicId,
                    ReviewType = "Mechanic",
                    Rating = request.MechanicRating,
                    Comments = request.MechanicComments,
                    ReviewDate = DateTime.Now
                };

                _context.Reviews.Add(mechanicReview);

                // Check if workshop review already exists for this order
                var existingWorkshopReview = await _context.Reviews
                    .AnyAsync(r => r.OrderId == request.OrderId && r.UserId == userId && r.ReviewType == "Workshop");

                // Create workshop review if workshop rating is provided and doesn't already exist
                if (request.WorkshopRating > 0 && request.WorkshopRating <= 5 && !existingWorkshopReview)
                {
                    var workshopReview = new Review
                    {
                        OrderId = request.OrderId,
                        UserId = userId,
                        ReviewType = "Workshop",
                        Rating = request.WorkshopRating,
                        Comments = request.WorkshopComments,
                        ReviewDate = DateTime.Now
                    };

                    _context.Reviews.Add(workshopReview);
                }

                // Update mechanic performance
                await UpdateMechanicPerformance(mechanicId, request.OrderId, request.MechanicRating);

                await _context.SaveChangesAsync();

                // Create notification for the mechanic
                var notification = new Notification
                {
                    UserId = mechanicId,
                    Message = $"You received a {request.MechanicRating}/5 rating for order #{request.OrderId}",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };
                
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Review submitted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting review for order");
                return StatusCode(500, new { success = false, message = "An error occurred while submitting the review", error = ex.Message });
            }
        }

        // GET: api/Reviews/PendingReviews
        [HttpGet("PendingReviews")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<object>> GetPendingReviews()
        {
            try 
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                // Get completed orders
                var completedOrders = await _context.Orders
                    .Include(o => o.Vehicle)
                    .Include(o => o.Service)
                    .Where(o => o.UserId == userId && o.Status == "completed")
                    .ToListAsync();

                // Get orders that already have mechanic reviews
                var ordersWithMechanicReviews = await _context.Reviews
                    .Where(r => r.UserId == userId && r.ReviewType == "Mechanic")
                    .Select(r => r.OrderId)
                    .Distinct()
                    .ToListAsync();

                // Find orders that need mechanic reviews
                var ordersNeedingReview = completedOrders
                    .Where(o => !ordersWithMechanicReviews.Contains(o.OrderId))
                    .ToList();

                // Get mechanic details for each order
                var result = new List<object>();
                foreach (var order in ordersNeedingReview)
                {
                    // Find the mechanic for this order from the appointment
                    var appointment = await _context.Appointments
                        .Include(a => a.Mechanic)
                        .Where(a => a.OrderId == order.OrderId)
                        .OrderByDescending(a => a.CreatedAt)
                        .FirstOrDefaultAsync();

                    result.Add(new
                    {
                        order.OrderId,
                        order.Status,
                        order.OrderDate,
                        order.TotalAmount,
                        Vehicle = new
                        {
                            order.Vehicle.VehicleId,
                            order.Vehicle.Make,
                            order.Vehicle.Model,
                            order.Vehicle.Year,
                            order.Vehicle.LicensePlate
                        },
                        Service = order.Service != null ? new
                        {
                            order.Service.ServiceId,
                            order.Service.ServiceName,
                            order.Service.Category,
                            order.Service.Price,
                            order.Service.Description
                        } : null,
                        Mechanic = appointment?.Mechanic != null ? new
                        {
                            MechanicId = appointment.Mechanic.UserId,
                            Name = appointment.Mechanic.Name
                        } : null
                    });
                }

                return Ok(new
                {
                    success = true,
                    pendingReviewCount = result.Count,
                    orders = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking pending reviews");
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/Reviews/HasReviewed/{orderId}
        [HttpGet("HasReviewed/{orderId}")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<object>> HasReviewed(int orderId)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                var hasReviewed = await _context.Reviews
                    .AnyAsync(r => r.OrderId == orderId && r.UserId == userId && r.ReviewType == "Mechanic");

                return Ok(new
                {
                    success = true,
                    hasReviewed
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user has reviewed order");
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/Reviews/MechanicRating/{mechanicId}
        [HttpGet("MechanicRating/{mechanicId}")]
        public async Task<ActionResult<object>> GetMechanicRating(int mechanicId)
        {
            try
            {
                var mechanic = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == mechanicId && u.Role.ToLower() == "mechanic");

                if (mechanic == null)
                {
                    return NotFound(new { success = false, message = "Mechanic not found" });
                }

                var reviews = await _context.Reviews
                    .Where(r => r.MechanicId == mechanicId && r.ReviewType == "Mechanic")
                    .ToListAsync();

                var totalReviews = reviews.Count;
                var averageRating = totalReviews > 0 ? reviews.Average(r => r.Rating) : 0;

                return Ok(new
                {
                    success = true,
                    mechanicId,
                    mechanicName = mechanic.Name,
                    totalReviews,
                    averageRating
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving mechanic rating");
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/Reviews/WorkshopRating
        [HttpGet("WorkshopRating")]
        public async Task<ActionResult<object>> GetWorkshopRating()
        {
            try
            {
                var reviews = await _context.Reviews
                    .Where(r => r.ReviewType == "Workshop")
                    .ToListAsync();

                var totalReviews = reviews.Count;
                var averageRating = totalReviews > 0 ? reviews.Average(r => r.Rating) : 0;

                return Ok(new
                {
                    success = true,
                    totalReviews,
                    averageRating
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving workshop rating");
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        // Helper method to update mechanic performance
        private async Task UpdateMechanicPerformance(int mechanicId, int orderId, int rating)
        {
            var performance = await _context.MechanicsPerformances
                .FirstOrDefaultAsync(mp => mp.MechanicId == mechanicId);

            if (performance == null)
            {
                // Create new performance record
                performance = new MechanicsPerformance
                {
                    MechanicId = mechanicId,
                    OrderId = orderId,
                    TotalJobs = 1,
                    CompletedJobs = 1,
                    Rating = rating
                };

                _context.MechanicsPerformances.Add(performance);
            }
            else
            {
                // Update existing performance record
                performance.TotalJobs++;
                performance.CompletedJobs++;

                // Calculate new average rating
                var mechanicReviews = await _context.Reviews
                    .Where(r => r.MechanicId == mechanicId && r.ReviewType == "Mechanic")
                    .ToListAsync();

                if (mechanicReviews.Any())
                {
                    decimal averageRating = (decimal)mechanicReviews.Average(r => r.Rating);
                    // Round to 2 decimal places
                    performance.Rating = Math.Round(averageRating, 2);
                }
            }
        }
    }

    // DTO for order review request
    public class OrderReviewRequest
    {
        public int OrderId { get; set; }
        public int MechanicRating { get; set; }
        public string MechanicComments { get; set; }
        public int WorkshopRating { get; set; }
        public string WorkshopComments { get; set; }
    }
}