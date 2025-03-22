// Controllers/TimeSlotsController.cs
using fyp_motomate.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TimeSlotsController : ControllerBase
    {
        private readonly ITimeSlotService _timeSlotService;

        public TimeSlotsController(ITimeSlotService timeSlotService)
        {
            _timeSlotService = timeSlotService;
        }

        // GET: api/TimeSlots/Available?date=2023-07-15
        [HttpGet("Available")]
        public async Task<IActionResult> GetAvailableTimeSlots([FromQuery] DateTime date)
        {
            try
            {
                // Don't allow past dates
                if (date.Date < DateTime.Now.Date)
                {
                    return BadRequest(new { success = false, message = "Cannot check availability for past dates" });
                }

                var availableSlots = await _timeSlotService.GetAvailableTimeSlotsAsync(date);

                return Ok(new { 
                    success = true, 
                    date = date.ToString("yyyy-MM-dd"),
                    availableSlots
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/TimeSlots/Info?date=2023-07-15
        [HttpGet("Info")]
        public async Task<IActionResult> GetTimeSlotsInfo([FromQuery] DateTime date)
        {
            try
            {
                // Don't allow past dates
                if (date.Date < DateTime.Now.Date)
                {
                    return BadRequest(new { success = false, message = "Cannot check availability for past dates" });
                }

                var timeSlotInfos = await _timeSlotService.GetAvailableTimeSlotsInfoAsync(date);

                return Ok(new { 
                    success = true, 
                    date = date.ToString("yyyy-MM-dd"),
                    timeSlotInfos
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/TimeSlots/IsAvailable?date=2023-07-15&timeSlot=09:00 AM - 11:00 AM
        [HttpGet("IsAvailable")]
        public async Task<IActionResult> IsTimeSlotAvailable([FromQuery] DateTime date, [FromQuery] string timeSlot)
        {
            try
            {
                // Don't allow past dates
                if (date.Date < DateTime.Now.Date)
                {
                    return BadRequest(new { success = false, message = "Cannot check availability for past dates" });
                }

                var availableCount = await _timeSlotService.GetTimeSlotAvailableCountAsync(date, timeSlot);
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
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }
    }
}