// Services/TimeSlotService.cs
using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace fyp_motomate.Services
{
    public interface ITimeSlotService
    {
        Task<List<TimeSlotInfo>> GetAvailableTimeSlotsInfoAsync(DateTime date);
        Task<List<string>> GetAvailableTimeSlotsAsync(DateTime date);
        Task<bool> IsTimeSlotAvailableAsync(DateTime date, string timeSlot);
        Task<int> GetTimeSlotAvailableCountAsync(DateTime date, string timeSlot);
        Task<List<TimeSlotInfo>> GetAvailableTimeSlotsForMechanicAsync(DateTime date, int mechanicId);
    }

    public class TimeSlotInfo
    {
        public string TimeSlot { get; set; }
        public int AvailableSlots { get; set; }
        public int TotalSlots { get; set; }
    }

    public class TimeSlotService : ITimeSlotService
    {
        private readonly ApplicationDbContext _context;
        private const int MAX_SLOTS_PER_TIME_INTERVAL = 2;

        // Available time slots (2-hour intervals)
        private static readonly string[] ALL_TIME_SLOTS = {
            "09:00 AM - 11:00 AM",
            "11:00 AM - 01:00 PM",
            "01:00 PM - 03:00 PM",
            "03:00 PM - 05:00 PM",
            "05:00 PM - 07:00 PM",
            "07:00 PM - 09:00 PM",
            "09:00 PM - 11:00 PM"
        };

        public TimeSlotService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<TimeSlotInfo>> GetAvailableTimeSlotsInfoAsync(DateTime date)
        {
            // Get all inspection slots for the specified date
            var existingInspectionSlots = await _context.Inspections
                .Where(i => i.ScheduledDate.Date == date.Date && i.Status != "cancelled")
                .GroupBy(i => i.TimeSlot)
                .Select(g => new { TimeSlot = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TimeSlot, x => x.Count);

            // Get all appointment slots for the specified date
            var existingAppointmentSlots = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == date.Date && a.Status != "cancelled")
                .GroupBy(a => a.TimeSlot)
                .Select(g => new { TimeSlot = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TimeSlot, x => x.Count);

            // Create TimeSlotInfo objects for all time slots
            var timeSlotInfos = ALL_TIME_SLOTS.Select(slot =>
            {
                // Count both inspections and appointments
                int inspectionCount = existingInspectionSlots.ContainsKey(slot) ? existingInspectionSlots[slot] : 0;
                int appointmentCount = existingAppointmentSlots.ContainsKey(slot) ? existingAppointmentSlots[slot] : 0;
                int totalUsed = inspectionCount + appointmentCount;
                int availableCount = MAX_SLOTS_PER_TIME_INTERVAL - totalUsed;

                return new TimeSlotInfo
                {
                    TimeSlot = slot,
                    AvailableSlots = availableCount > 0 ? availableCount : 0,
                    TotalSlots = MAX_SLOTS_PER_TIME_INTERVAL
                };
            }).ToList();

            return timeSlotInfos;
        }

        public async Task<List<string>> GetAvailableTimeSlotsAsync(DateTime date)
        {
            var timeSlotInfos = await GetAvailableTimeSlotsInfoAsync(date);
            
            // Filter to only those with available slots
            return timeSlotInfos
                .Where(tsi => tsi.AvailableSlots > 0)
                .Select(tsi => tsi.TimeSlot)
                .ToList();
        }

        public async Task<bool> IsTimeSlotAvailableAsync(DateTime date, string timeSlot)
        {
            int availableCount = await GetTimeSlotAvailableCountAsync(date, timeSlot);
            return availableCount > 0;
        }

        public async Task<int> GetTimeSlotAvailableCountAsync(DateTime date, string timeSlot)
        {
            // Count inspections in this time slot
            var inspectionCount = await _context.Inspections
                .Where(i => i.ScheduledDate.Date == date.Date && 
                           i.TimeSlot == timeSlot && 
                           i.Status != "cancelled")
                .CountAsync();

            // Count appointments in this time slot
            var appointmentCount = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == date.Date && 
                           a.TimeSlot == timeSlot && 
                           a.Status != "cancelled")
                .CountAsync();

            // Calculate available slots
            int totalUsed = inspectionCount + appointmentCount;
            return MAX_SLOTS_PER_TIME_INTERVAL - totalUsed;
        }

        public async Task<List<TimeSlotInfo>> GetAvailableTimeSlotsForMechanicAsync(DateTime date, int mechanicId)
        {
            // First get general availability for the date
            var generalAvailability = await GetAvailableTimeSlotsInfoAsync(date);
            
            // Now check which slots the mechanic is already booked for
            var mechanicBookedSlots = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == date.Date && 
                           a.MechanicId == mechanicId &&
                           a.Status != "cancelled")
                .Select(a => a.TimeSlot)
                .ToListAsync();
            
            // Mark slots where the mechanic is already booked as unavailable
            foreach (var slot in generalAvailability)
            {
                if (mechanicBookedSlots.Contains(slot.TimeSlot))
                {
                    slot.AvailableSlots = 0; // Mechanic is already booked for this slot
                }
            }
            
            return generalAvailability;
        }
    }
}