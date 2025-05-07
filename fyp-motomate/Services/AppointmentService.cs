using fyp_motomate.Data;
using fyp_motomate.Models;
using fyp_motomate.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace fyp_motomate.Services
{
    public interface IAppointmentService
    {
        Task<List<MechanicAvailabilityDto>> GetAvailableMechanicsAsync(DateTime date, string timeSlot);
        Task<bool> IsMechanicAvailableAsync(int mechanicId, DateTime date, string timeSlot);
        Task<List<string>> GetAvailableTimeSlotsAsync(DateTime date, int? mechanicId = null);
    }

    public class AppointmentService : IAppointmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AppointmentService> _logger;

        // Define standard time slots
        private readonly List<string> _standardTimeSlots = new List<string>
        {
            "09:00 AM - 11:00 AM",
            "11:00 AM - 01:00 PM",
            "02:00 PM - 04:00 PM",
            "04:00 PM - 06:00 PM"
        };

        public AppointmentService(ApplicationDbContext context, ILogger<AppointmentService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<MechanicAvailabilityDto>> GetAvailableMechanicsAsync(DateTime date, string timeSlot)
        {
            try
            {
                // Get all mechanics (users with role 'mechanic')
                var mechanics = await _context.Users
                    .Where(u => u.Role.ToLower() == "mechanic")
                    .ToListAsync();

                if (mechanics == null || !mechanics.Any())
                {
                    _logger.LogWarning("No mechanics found in the system");
                    return new List<MechanicAvailabilityDto>();
                }

                // Get all appointments for the specified date and time slot
                var existingAppointments = await _context.Appointments
                    .Where(a => a.AppointmentDate.Date == date.Date &&
                           a.TimeSlot == timeSlot &&
                           a.Status != "cancelled")
                    .ToListAsync();

                // Create list of mechanic availability DTOs
                var availabilityList = new List<MechanicAvailabilityDto>();

                foreach (var mechanic in mechanics)
                {
                    bool isAvailable = !existingAppointments.Any(a => a.MechanicId == mechanic.UserId);

                    availabilityList.Add(new MechanicAvailabilityDto
                    {
                        MechanicId = mechanic.UserId,
                        Name = mechanic.Name,
                        Email = mechanic.Email,
                        Phone = mechanic.Phone,
                        IsAvailable = isAvailable
                    });
                }

                return availabilityList;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available mechanics for date {Date} and time slot {TimeSlot}", date, timeSlot);
                throw;
            }
        }

        public async Task<bool> IsMechanicAvailableAsync(int mechanicId, DateTime date, string timeSlot)
        {
            try
            {
                // Check if the mechanic exists
                var mechanicExists = await _context.Users
                    .AnyAsync(u => u.UserId == mechanicId && u.Role.ToLower() == "mechanic");

                if (!mechanicExists)
                {
                    _logger.LogWarning("Mechanic with ID {MechanicId} not found or is not a mechanic", mechanicId);
                    return false;
                }

                // Check if the mechanic already has an appointment at the given date and time slot
                var hasExistingAppointment = await _context.Appointments
                    .AnyAsync(a => a.MechanicId == mechanicId &&
                             a.AppointmentDate.Date == date.Date &&
                             a.TimeSlot == timeSlot &&
                             a.Status != "cancelled");

                return !hasExistingAppointment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking mechanic availability for mechanic {MechanicId} on date {Date} and time slot {TimeSlot}",
                    mechanicId, date, timeSlot);
                throw;
            }
        }

        public async Task<List<string>> GetAvailableTimeSlotsAsync(DateTime date, int? mechanicId = null)
        {
            try
            {
                // Start with all standard time slots
                var availableTimeSlots = new List<string>(_standardTimeSlots);

                // If mechanicId is provided, filter by mechanic availability
                if (mechanicId.HasValue)
                {
                    // Get all appointments for the mechanic on the specified date
                    var mechanicAppointments = await _context.Appointments
                        .Where(a => a.MechanicId == mechanicId.Value &&
                               a.AppointmentDate.Date == date.Date &&
                               a.Status != "cancelled")
                        .Select(a => a.TimeSlot)
                        .ToListAsync();

                    // Remove time slots that the mechanic is already booked for
                    availableTimeSlots.RemoveAll(ts => mechanicAppointments.Contains(ts));
                }

                return availableTimeSlots;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available time slots for date {Date} and mechanic {MechanicId}", date, mechanicId);
                throw;
            }
        }
    }
}