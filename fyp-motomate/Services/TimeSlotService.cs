// Services/TimeSlotService.cs
using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using fyp_motomate.Models.DTOs;

namespace fyp_motomate.Services
{
    public interface ITimeSlotService
    {
        Task<List<TimeSlotInfo>> GetAvailableTimeSlotsInfoAsync(DateTime date);
        Task<List<string>> GetAvailableTimeSlotsAsync(DateTime date);
        Task<bool> IsTimeSlotAvailableAsync(DateTime date, string timeSlot);
        Task<int> GetTimeSlotAvailableCountAsync(DateTime date, string timeSlot);
        Task<List<TimeSlotInfo>> GetAvailableTimeSlotsForMechanicAsync(DateTime date, int mechanicId);
        Task<bool> IsVehicleAvailableForDateAsync(int vehicleId, DateTime date);
        Task<DateTime?> GetNextAvailableDateForVehicleAsync(int vehicleId, DateTime fromDate);
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

            // Get all appointment slots for the specified date that are NOT linked to an inspection
            var existingAppointmentSlots = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == date.Date && a.Status != "cancelled")
                .GroupBy(a => new { a.TimeSlot, a.OrderId })
                .Select(g => new { TimeSlot = g.Key.TimeSlot, OrderId = g.Key.OrderId })
                .ToListAsync();

            // Count appointments that don't have a corresponding inspection in the same time slot
            var appointmentCounts = new Dictionary<string, int>();
            foreach (var app in existingAppointmentSlots)
            {
                // Check if this appointment's order has an inspection
                var hasInspection = await _context.Inspections
                    .AnyAsync(i => i.OrderId == app.OrderId && i.TimeSlot == app.TimeSlot);

                // Only count appointments without a corresponding inspection
                if (!hasInspection)
                {
                    if (!appointmentCounts.ContainsKey(app.TimeSlot))
                        appointmentCounts[app.TimeSlot] = 0;

                    appointmentCounts[app.TimeSlot]++;
                }
            }

            // Create TimeSlotInfo objects for all time slots
            var timeSlotInfos = ALL_TIME_SLOTS.Select(slot =>
            {
                // Count inspections
                int inspectionCount = existingInspectionSlots.ContainsKey(slot) ? existingInspectionSlots[slot] : 0;

                // Count appointments (that don't have corresponding inspections)
                int appointmentCount = appointmentCounts.ContainsKey(slot) ? appointmentCounts[slot] : 0;

                // Total used slots is the sum of inspections and appointments without inspections
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

            // Get all appointment slots for the specified date and time slot
            var existingAppointmentSlots = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == date.Date &&
                           a.TimeSlot == timeSlot &&
                           a.Status != "cancelled")
                .Select(a => new { a.OrderId })
                .ToListAsync();

            // Count appointments that don't have a corresponding inspection in the same time slot
            int appointmentCount = 0;
            foreach (var app in existingAppointmentSlots)
            {
                // Check if this appointment's order has an inspection
                var hasInspection = await _context.Inspections
                    .AnyAsync(i => i.OrderId == app.OrderId && i.TimeSlot == timeSlot);

                // Only count appointments without a corresponding inspection
                if (!hasInspection)
                {
                    appointmentCount++;
                }
            }

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

        public async Task<bool> IsVehicleAvailableForDateAsync(int vehicleId, DateTime date)
        {
            try
            {
                // Check if vehicle has any active orders/inspections/appointments for the given date
                var hasActiveOrders = await _context.Orders
                    .AnyAsync(o => o.VehicleId == vehicleId && 
                                  o.OrderDate.Date == date.Date && 
                                  o.Status != "cancelled" && 
                                  o.Status != "completed");

                if (hasActiveOrders)
                {
                    return false;
                }

                // Check if vehicle has any inspections for the given date
                var hasInspections = await _context.Inspections
                    .AnyAsync(i => i.VehicleId == vehicleId && 
                                  i.ScheduledDate.Date == date.Date && 
                                  i.Status != "cancelled");

                if (hasInspections)
                {
                    return false;
                }

                // Check if vehicle has any appointments for the given date
                var hasAppointments = await _context.Appointments
                    .AnyAsync(a => a.VehicleId == vehicleId && 
                                  a.AppointmentDate.Date == date.Date && 
                                  a.Status != "cancelled");

                if (hasAppointments)
                {
                    return false;
                }

                // Check if vehicle has any service transfers for the given date
                var hasServiceTransfers = await _context.TransferToServices
                    .AnyAsync(t => t.VehicleId == vehicleId && 
                                  t.OrderDate.Date == date.Date && 
                                  t.Status != "cancelled");

                if (hasServiceTransfers)
                {
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                // Log error and return false for safety
                return false;
            }
        }

        public async Task<DateTime?> GetNextAvailableDateForVehicleAsync(int vehicleId, DateTime fromDate)
        {
            try
            {
                // Start checking from the next day after the fromDate
                var checkDate = fromDate.AddDays(1);
                
                // Check up to 30 days in the future
                for (int i = 0; i < 30; i++)
                {
                    if (await IsVehicleAvailableForDateAsync(vehicleId, checkDate))
                    {
                        return checkDate;
                    }
                    checkDate = checkDate.AddDays(1);
                }

                return null; // No available date found within 30 days
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}