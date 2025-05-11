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
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(ApplicationDbContext context, ILogger<NotificationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications()
        {
            try
            {
                _logger.LogInformation("GetNotifications endpoint called");
                
                // Get the current user's ID from the JWT token
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    _logger.LogWarning("Invalid user credentials in GetNotifications");
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                _logger.LogInformation("Fetching notifications for user ID: {UserId}", userId);

                // Get notifications for the current user, ordered by creation date (newest first)
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} notifications for user ID: {UserId}", notifications.Count, userId);
                
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications");
                return StatusCode(500, new { message = "Failed to get notifications", error = ex.Message });
            }
        }

        // GET: api/Notifications/unread
        [HttpGet("unread")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUnreadNotifications()
        {
            try
            {
                // Get the current user's ID from the JWT token
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                // Get unread notifications for the current user, ordered by creation date (newest first)
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId && n.Status == "unread")
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread notifications");
                return StatusCode(500, new { message = "Failed to get unread notifications", error = ex.Message });
            }
        }

        // PUT: api/Notifications/5/markasread
        [HttpPut("{id}/markasread")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                // Get the current user's ID from the JWT token
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                // Find the notification
                var notification = await _context.Notifications.FindAsync(id);

                // Check if notification exists
                if (notification == null)
                {
                    return NotFound(new { message = "Notification not found" });
                }

                // Verify the notification belongs to the current user
                if (notification.UserId != userId)
                {
                    return Forbid();
                }

                // Mark as read
                notification.Status = "read";

                await _context.SaveChangesAsync();
                return Ok(new { message = "Notification marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, new { message = "Failed to update notification", error = ex.Message });
            }
        }

        // PUT: api/Notifications/markallasread
        [HttpPut("markallasread")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                // Get the current user's ID from the JWT token
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                // Find all unread notifications for the user
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId && n.Status == "unread")
                    .ToListAsync();

                // Mark all as read
                foreach (var notification in notifications)
                {
                    notification.Status = "read";
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "All notifications marked as read", count = notifications.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return StatusCode(500, new { message = "Failed to update notifications", error = ex.Message });
            }
        }

        // DELETE: api/Notifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                // Get the current user's ID from the JWT token
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                // Find the notification
                var notification = await _context.Notifications.FindAsync(id);

                // Check if notification exists
                if (notification == null)
                {
                    return NotFound(new { message = "Notification not found" });
                }

                // Verify the notification belongs to the current user
                if (notification.UserId != userId)
                {
                    return Forbid();
                }

                // Delete the notification
                _context.Notifications.Remove(notification);

                await _context.SaveChangesAsync();
                return Ok(new { message = "Notification deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification");
                return StatusCode(500, new { message = "Failed to delete notification", error = ex.Message });
            }
        }

        // POST: api/Notifications/test
        // This is a test endpoint to create a notification for testing purposes
        [HttpPost("test")]
        [AllowAnonymous] // Allow this endpoint without authentication for testing
        public async Task<IActionResult> CreateTestNotification([FromBody] TestNotificationRequest request)
        {
            try
            {
                if (request == null || request.UserId <= 0 || string.IsNullOrEmpty(request.Message))
                {
                    return BadRequest(new { message = "Invalid request. UserId and Message are required." });
                }

                var notification = new Notification
                {
                    UserId = request.UserId,
                    Message = request.Message,
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Test notification created", notification });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating test notification");
                return StatusCode(500, new { message = "Failed to create test notification", error = ex.Message });
            }
        }
    }

    public class TestNotificationRequest
    {
        public int UserId { get; set; }
        public string Message { get; set; }
    }
}