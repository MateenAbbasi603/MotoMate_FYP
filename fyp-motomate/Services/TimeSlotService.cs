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
            // Get all time slots for the specified date
            var existingSlots = await _context.Inspections
                .Where(i => i.ScheduledDate.Date == date.Date && i.Status != "cancelled")
                .GroupBy(i => i.TimeSlot)
                .Select(g => new { TimeSlot = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.TimeSlot, x => x.Count);

            // Create TimeSlotInfo objects for all time slots
            var timeSlotInfos = ALL_TIME_SLOTS.Select(slot =>
            {
                int usedCount = existingSlots.ContainsKey(slot) ? existingSlots[slot] : 0;
                int availableCount = MAX_SLOTS_PER_TIME_INTERVAL - usedCount;

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
            // Check if the specified time slot is available
            var slotCount = await _context.Inspections
                .Where(i => i.ScheduledDate.Date == date.Date && 
                           i.TimeSlot == timeSlot && 
                           i.Status != "cancelled")
                .CountAsync();

            return MAX_SLOTS_PER_TIME_INTERVAL - slotCount;
        }
    }
}