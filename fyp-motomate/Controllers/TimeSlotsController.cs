// Controllers/TimeSlotsController.cs
using fyp_motomate.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TimeSlotsController : ControllerBase
    {
        private readonly ITimeSlotService _timeSlotService;
        private readonly ILogger<TimeSlotsController> _logger;

        // Keep only one constructor to avoid the multiple constructor issue
        public TimeSlotsController(ITimeSlotService timeSlotService, ILogger<TimeSlotsController> logger)
        {
            _timeSlotService = timeSlotService;
            _logger = logger;
        }

        // GET: api/TimeSlots/Available?date=2023-07-15
        [HttpGet("Available")]
        public async Task<IActionResult> GetAvailableTimeSlots([FromQuery] DateTime date)
        {
            try
            {
                // Log the date received for debugging
                _logger.LogInformation("Received date for time slots: {Date}", date);
                
                // Don't allow past dates - Using date part only to avoid time component issues
                if (date.Date < DateTime.Now.Date)
                {
                    return BadRequest(new { success = false, message = "Cannot check availability for past dates" });
                }

                var availableSlots = await _timeSlotService.GetAvailableTimeSlotsAsync(date.Date);

                return Ok(new {
                    success = true,
                    date = date.ToString("yyyy-MM-dd"),
                    availableSlots
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available time slots for date {Date}", date);
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/TimeSlots/Info?date=2023-07-15
        [HttpGet("Info")]
        public async Task<IActionResult> GetTimeSlotsInfo([FromQuery] DateTime date)
        {
            try
            {
                // Log the date received for debugging
                _logger.LogInformation("Received date for time slots info: {Date}", date);
                
                // Don't allow past dates - Using date part only to avoid time component issues
                if (date.Date < DateTime.Now.Date)
                {
                    return BadRequest(new { success = false, message = "Cannot check availability for past dates" });
                }

                var timeSlotInfos = await _timeSlotService.GetAvailableTimeSlotsInfoAsync(date.Date);

                return Ok(new {
                    success = true,
                    date = date.ToString("yyyy-MM-dd"),
                    timeSlotInfos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting time slot info for date {Date}", date);
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/TimeSlots/IsAvailable?date=2023-07-15&timeSlot=09:00 AM - 11:00 AM
        [HttpGet("IsAvailable")]
        public async Task<IActionResult> IsTimeSlotAvailable([FromQuery] DateTime date, [FromQuery] string timeSlot)
        {
            try
            {
                // Log the inputs received for debugging
                _logger.LogInformation("Checking availability for date {Date}, time slot {TimeSlot}", date, timeSlot);
                
                // Don't allow past dates - Using date part only to avoid time component issues
                if (date.Date < DateTime.Now.Date)
                {
                    return BadRequest(new { success = false, message = "Cannot check availability for past dates" });
                }

                var availableCount = await _timeSlotService.GetTimeSlotAvailableCountAsync(date.Date, timeSlot);
                var isAvailable = availableCount > 0;

                return Ok(new {
                    success = true,
                    date = date.ToString("yyyy-MM-dd"),
                    timeSlot,
                    isAvailable,
                    availableCount,
                    totalSlots = 2
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking time slot availability for date {Date} and time slot {TimeSlot}", date, timeSlot);
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }
    }
}