// Controllers/DashboardController.cs
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
using System.Text.Json;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(ApplicationDbContext context, ILogger<DashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }


[HttpGet("mechanic")]
[Authorize(Roles = "mechanic")]
public async Task<JsonResult> GetMechanicDashboard()
{
    try
    {
        // Get mechanic ID from token
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int mechanicId))
        {
            return new JsonResult(new { success = false, message = "Invalid user credentials" });
        }

        _logger.LogInformation("Fetching mechanic dashboard data for mechanic ID: {MechanicId}", mechanicId);

        // Get mechanic information
        var mechanic = await _context.Users
            .Where(u => u.UserId == mechanicId)
            .FirstOrDefaultAsync();

        if (mechanic == null)
        {
            return new JsonResult(new { success = false, message = "Mechanic not found" });
        }

        // Calculate week start and end dates
        var today = DateTime.Today;
        var dayOfWeek = (int)today.DayOfWeek;
        var weekStart = today.AddDays(-dayOfWeek);
        var weekEnd = weekStart.AddDays(7);

        // Get today's appointments
        var todayAppointments = await _context.Appointments
            .Include(a => a.User)
            .Include(a => a.Vehicle)
            .Include(a => a.Service)
            .Where(a => a.MechanicId == mechanicId && 
                       a.AppointmentDate.Date == today &&
                       a.Status != "cancelled")
            .OrderBy(a => a.TimeSlot)
            .ToListAsync();

        // Get upcoming appointments (next 7 days)
        var upcomingAppointments = await _context.Appointments
            .Include(a => a.User)
            .Include(a => a.Vehicle)
            .Include(a => a.Service)
            .Where(a => a.MechanicId == mechanicId && 
                       a.AppointmentDate.Date > today &&
                       a.AppointmentDate.Date <= today.AddDays(7) &&
                       a.Status != "cancelled")
            .OrderBy(a => a.AppointmentDate)
            .ThenBy(a => a.TimeSlot)
            .Take(5)
            .ToListAsync();

        // Get current transfer services
        var currentServices = await _context.TransferToServices
            .Include(t => t.User)
            .Include(t => t.Vehicle)
            .Include(t => t.Service)
            .Include(t => t.Order)
            .Where(t => t.MechanicId == mechanicId && 
                       (t.Order.Status == "in progress" || t.Order.Status == "awaiting parts"))
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

        // Calculate basic stats with separate queries
        var totalAppointmentsThisWeek = await _context.Appointments
            .CountAsync(a => a.MechanicId == mechanicId &&
                           a.AppointmentDate >= weekStart &&
                           a.AppointmentDate < weekEnd &&
                           a.Status != "cancelled");

        var completedThisWeek = await _context.Appointments
            .CountAsync(a => a.MechanicId == mechanicId &&
                           a.AppointmentDate >= weekStart &&
                           a.AppointmentDate < weekEnd &&
                           a.Status == "completed");

        var totalCompletedJobs = await _context.Appointments
            .CountAsync(a => a.MechanicId == mechanicId && a.Status == "completed");

        // Get mechanic rating
        var mechanicPerformance = await _context.MechanicsPerformances
            .FirstOrDefaultAsync(mp => mp.MechanicId == mechanicId);

        var rating = mechanicPerformance?.Rating ?? 0;

        // Format today's appointments
        var todaySchedule = todayAppointments.Select(a => new {
            appointmentId = a.AppointmentId,
            timeSlot = a.TimeSlot,
            customerName = a.User?.Name ?? "Unknown",
            vehicleInfo = a.Vehicle != null ? $"{a.Vehicle.Make} {a.Vehicle.Model}" : "Unknown Vehicle",
            licensePlate = a.Vehicle?.LicensePlate ?? "",
            serviceName = a.Service?.ServiceName ?? "Inspection",
            status = a.Status,
            notes = a.Notes ?? ""
        }).ToArray();

        // Format upcoming appointments
        var upcomingSchedule = upcomingAppointments.Select(a => new {
            appointmentId = a.AppointmentId,
            date = a.AppointmentDate.ToString("MMM dd"),
            timeSlot = a.TimeSlot,
            customerName = a.User?.Name ?? "Unknown",
            vehicleInfo = a.Vehicle != null ? $"{a.Vehicle.Make} {a.Vehicle.Model}" : "Unknown Vehicle",
            licensePlate = a.Vehicle?.LicensePlate ?? "",
            serviceName = a.Service?.ServiceName ?? "Inspection",
            status = a.Status
        }).ToArray();

        // Format current services
        var activeServices = currentServices.Select(t => new {
            transferId = t.TransferId,
            orderId = t.OrderId,
            customerName = t.User?.Name ?? "Unknown",
            vehicleInfo = t.Vehicle != null ? $"{t.Vehicle.Make} {t.Vehicle.Model}" : "Unknown Vehicle",
            licensePlate = t.Vehicle?.LicensePlate ?? "",
            serviceName = t.Service?.ServiceName ?? "Service",
            status = t.Order?.Status ?? "unknown",
            eta = t.ETA ?? "Not set",
            notes = t.Notes ?? ""
        }).ToArray();

        var response = new {
            success = true,
            mechanic = new {
                mechanicId = mechanic.UserId,
                name = mechanic.Name,
                email = mechanic.Email,
                phone = mechanic.Phone ?? "",
                imgUrl = mechanic.imgUrl ?? ""
            },
            stats = new {
                todayAppointments = todayAppointments.Count,
                weeklyAppointments = totalAppointmentsThisWeek,
                completedThisWeek = completedThisWeek,
                totalCompleted = totalCompletedJobs,
                rating = Math.Round((double)rating, 1),
                activeServices = currentServices.Count
            },
            todaySchedule = todaySchedule,
            upcomingAppointments = upcomingSchedule,
            activeServices = activeServices
        };

        _logger.LogInformation("Mechanic dashboard data fetched successfully for mechanic ID: {MechanicId}", mechanicId);
        
        return new JsonResult(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
            ReferenceHandler = null
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching mechanic dashboard data");
        return new JsonResult(new { 
            success = false, 
            message = "An error occurred while fetching mechanic dashboard data", 
            error = ex.Message 
        });
    }
}
// Controllers/DashboardController.cs - Update the admin endpoint
[HttpGet("admin")]
[Authorize(Roles = "super_admin,admin")]
public async Task<JsonResult> GetAdminDashboard()
{
    try
    {
        _logger.LogInformation("Fetching admin dashboard data");

        // Get total users count
        var totalUsers = await _context.Users.CountAsync();

        // Get total mechanics count
        var totalMechanics = await _context.Users
            .CountAsync(u => u.Role.ToLower() == "mechanic");

        // Get total vehicles count
        var totalVehicles = await _context.Vehicles.CountAsync();

        // Get total revenue from all invoices
        var totalRevenue = await _context.Invoices
            .Where(i => i.Status != "cancelled")
            .SumAsync(i => i.TotalAmount);

        // Get active appointments count
        var activeAppointments = await _context.Appointments
            .CountAsync(a => a.Status == "scheduled" || a.Status == "in progress");

        // Get completed services count
        var completedServices = await _context.Orders
            .CountAsync(o => o.Status.ToLower() == "completed");

        // Get pending issues count (pending orders + overdue invoices)
        var pendingOrders = await _context.Orders
            .CountAsync(o => o.Status.ToLower() == "pending");

        var overdueInvoices = await _context.Invoices
            .CountAsync(i => i.DueDate < DateTime.Now && i.Status != "paid" && i.Status != "cancelled");

        var pendingIssues = pendingOrders + overdueInvoices;

        // Calculate monthly growth (current month vs previous month revenue)
        var currentMonth = DateTime.Now.Month;
        var currentYear = DateTime.Now.Year;
        var previousMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        var previousYear = currentMonth == 1 ? currentYear - 1 : currentYear;

        var currentMonthRevenue = await _context.Invoices
            .Where(i => i.InvoiceDate.Month == currentMonth && 
                       i.InvoiceDate.Year == currentYear && 
                       i.Status != "cancelled")
            .SumAsync(i => i.TotalAmount);

        var previousMonthRevenue = await _context.Invoices
            .Where(i => i.InvoiceDate.Month == previousMonth && 
                       i.InvoiceDate.Year == previousYear && 
                       i.Status != "cancelled")
            .SumAsync(i => i.TotalAmount);

        var monthlyGrowth = previousMonthRevenue > 0 
            ? Math.Round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100, 1)
            : 0;

        // Get mechanics performance data
        var mechanicsData = await _context.Users
            .Where(u => u.Role.ToLower() == "mechanic")
            .Include(u => u.MechanicPerformance)
            .ToListAsync();

        var mechanicsWithJobs = new List<object>();
        foreach (var mechanic in mechanicsData)
        {
            var completedJobs = await _context.Appointments
                .CountAsync(a => a.MechanicId == mechanic.UserId && a.Status == "completed");
            
            var mechanicTotalAssignedJobs = await _context.Appointments
                .CountAsync(a => a.MechanicId == mechanic.UserId);

            var rating = mechanic.MechanicPerformance?.Rating ?? 0;

            mechanicsWithJobs.Add(new {
                mechanicId = mechanic.UserId,
                name = mechanic.Name,
                phone = mechanic.Phone ?? "",
                completedJobs = completedJobs,
                totalJobs = mechanicTotalAssignedJobs,
                rating = rating
            });
        }

        var averageRating = mechanicsWithJobs.Any() 
            ? Math.Round(mechanicsWithJobs.Average(m => (double)((dynamic)m).rating), 1)
            : 0;

        var totalCompletedJobs = mechanicsWithJobs.Sum(m => (int)((dynamic)m).completedJobs);
        var totalAssignedJobs = mechanicsWithJobs.Sum(m => (int)((dynamic)m).totalJobs);

        var completionRate = totalAssignedJobs > 0 
            ? Math.Round((double)totalCompletedJobs / totalAssignedJobs * 100, 1)
            : 0;

        // Get vehicle services success rate
        var totalServiceOrders = await _context.Orders.CountAsync();
        var successfulServices = await _context.Orders
            .CountAsync(o => o.Status.ToLower() == "completed");

        var vehicleSuccessRate = totalServiceOrders > 0 
            ? Math.Round((double)successfulServices / totalServiceOrders * 100, 1)
            : 0;

        // Get customer satisfaction data from reviews
        var workshopReviews = await _context.Reviews
            .Where(r => r.ReviewType == "Workshop")
            .ToListAsync();

        var customerRating = workshopReviews.Any() 
            ? Math.Round(workshopReviews.Average(r => (double)r.Rating), 1)
            : 0;

        // Calculate resolution rate (completed vs total orders)
        var resolutionRate = totalServiceOrders > 0 
            ? Math.Round((double)successfulServices / totalServiceOrders * 100, 1)
            : 0;

        // Get recent orders - Direct array creation
        var recentOrdersQuery = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Vehicle)
            .Include(o => o.Service)
            .OrderByDescending(o => o.OrderDate)
            .Take(10)
            .ToListAsync();

        var recentOrders = recentOrdersQuery.Select(o => new {
            orderId = o.OrderId,
            customerName = o.User?.Name ?? "Unknown",
            customerEmail = o.User?.Email ?? "",
            vehicleInfo = o.Vehicle != null ? $"{o.Vehicle.Make} {o.Vehicle.Model} ({o.Vehicle.Year})" : "Unknown Vehicle",
            licensePlate = o.Vehicle?.LicensePlate ?? "",
            serviceName = o.Service?.ServiceName ?? (o.IncludesInspection ? "Inspection" : "Service"),
            status = o.Status,
            amount = o.TotalAmount,
            orderDate = o.OrderDate,
            includesInspection = o.IncludesInspection
        }).ToArray(); // Convert to array

        // Get upcoming appointments - Direct array creation
        var upcomingAppointmentsQuery = await _context.Appointments
            .Include(a => a.User)
            .Include(a => a.Vehicle)
            .Include(a => a.Mechanic)
            .Include(a => a.Service)
            .Where(a => a.AppointmentDate >= DateTime.Today && a.Status != "cancelled")
            .OrderBy(a => a.AppointmentDate)
            .Take(10)
            .ToListAsync();

        var upcomingAppointments = upcomingAppointmentsQuery.Select(a => new {
            appointmentId = a.AppointmentId,
            customerName = a.User?.Name ?? "Unknown",
            mechanicName = a.Mechanic?.Name ?? "Unknown",
            vehicleInfo = a.Vehicle != null ? $"{a.Vehicle.Make} {a.Vehicle.Model}" : "Unknown Vehicle",
            licensePlate = a.Vehicle?.LicensePlate ?? "",
            serviceName = a.Service?.ServiceName ?? "Inspection",
            appointmentDate = a.AppointmentDate,
            timeSlot = a.TimeSlot,
            status = a.Status
        }).ToArray(); // Convert to array

        // Get recent invoices - Direct array creation
        var recentInvoicesQuery = await _context.Invoices
            .Include(i => i.User)
            .OrderByDescending(i => i.InvoiceDate)
            .Take(10)
            .ToListAsync();

        var recentInvoices = recentInvoicesQuery.Select(i => new {
            invoiceId = i.InvoiceId,
            customerName = i.User?.Name ?? "Unknown",
            amount = i.TotalAmount,
            status = i.Status,
            invoiceDate = i.InvoiceDate,
            dueDate = i.DueDate
        }).ToArray(); // Convert to array

        // Get top performing mechanics - Direct array creation
        var topMechanics = mechanicsWithJobs
            .Where(m => (decimal)((dynamic)m).rating > 0)
            .OrderByDescending(m => ((dynamic)m).rating)
            .ThenByDescending(m => ((dynamic)m).completedJobs)
            .Take(5)
            .ToArray(); // Convert to array

        // Financial summary
        var totalInvoices = await _context.Invoices.CountAsync();
        var paidInvoices = await _context.Invoices.CountAsync(i => i.Status == "paid");
        var pendingPayments = await _context.Invoices
            .Where(i => i.Status == "issued" || i.Status == "pending")
            .SumAsync(i => i.TotalAmount);

        // System statistics
        var systemStats = new {
            totalServices = await _context.Services.CountAsync(),
            totalInspections = await _context.Inspections.CountAsync(),
            activeUsers = await _context.Users.CountAsync(u => u.Role == "customer"),
            staffMembers = await _context.Users.CountAsync(u => u.Role != "customer")
        };

        var response = new {
            success = true,
            stats = new {
                totalUsers = totalUsers,
                totalMechanics = totalMechanics,
                totalVehicles = totalVehicles,
                totalRevenue = totalRevenue,
                activeAppointments = activeAppointments,
                completedServices = completedServices,
                pendingIssues = pendingIssues,
                monthlyGrowth = monthlyGrowth,
                mechanicsPerformance = new {
                    averageRating = averageRating,
                    completionRate = completionRate
                },
                vehicleServices = new {
                    successRate = vehicleSuccessRate
                },
                customerSatisfaction = new {
                    rating = customerRating,
                    responseTime = 12.5,
                    resolutionRate = resolutionRate
                }
            },
            recentActivities = new {
                orders = recentOrders,
                appointments = upcomingAppointments,
                invoices = recentInvoices
            },
            topMechanics = topMechanics,
            financialSummary = new {
                thisMonthRevenue = currentMonthRevenue,
                lastMonthRevenue = previousMonthRevenue,
                pendingPayments = pendingPayments,
                totalInvoices = totalInvoices,
                paidInvoices = paidInvoices,
                paymentRate = totalInvoices > 0 ? Math.Round((double)paidInvoices / totalInvoices * 100, 1) : 0
            },
            systemStats = systemStats
        };

        _logger.LogInformation("Admin dashboard data fetched successfully");
        
        // Return with specific JSON options to avoid $values arrays
        return new JsonResult(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
            ReferenceHandler = null
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching admin dashboard data");
        return new JsonResult(new { 
            success = false, 
            message = "An error occurred while fetching admin dashboard data", 
            error = ex.Message 
        });
    }
}
        // GET: api/Dashboard/customer
        [HttpGet("customer")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<CustomerDashboardResponse>> GetCustomerDashboard()
        {
            try
            {
                // Get user ID from token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user credentials" });
                }

                _logger.LogInformation("Fetching dashboard data for user ID: {UserId}", userId);

                // Get user information
                var user = await _context.Users
                    .Where(u => u.UserId == userId)
                    .Select(u => new UserInfoDto
                    {
                        UserId = u.UserId,
                        Name = u.Name,
                        Email = u.Email,
                        Phone = u.Phone,
                        Address = u.Address,
                        ImgUrl = u.imgUrl ?? ""
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Get user's vehicles
                var vehicles = await _context.Vehicles
                    .Where(v => v.UserId == userId)
                    .Select(v => new VehicleDto
                    {
                        VehicleId = v.VehicleId,
                        Make = v.Make,
                        Model = v.Model,
                        Year = v.Year,
                        LicensePlate = v.LicensePlate,
                        CreatedAt = v.CreatedAt
                    })
                    .ToListAsync();

                // Get user's orders all related data
                var orders = await _context.Orders
                    .Where(o => o.UserId == userId)
                    .Include(o => o.Vehicle)
                    .Include(o => o.Service)
                    .Include(o => o.Inspection)
                        .ThenInclude(i => i.Service)
                    .Include(o => o.OrderServices)
                        .ThenInclude(os => os.Service)
                    .OrderByDescending(o => o.OrderDate)
                    .Select(o => new OrderDto
                    {
                        OrderId = o.OrderId,
                        UserId = o.UserId,
                        VehicleId = o.VehicleId,
                        ServiceId = o.ServiceId,
                        IncludesInspection = o.IncludesInspection,
                        OrderDate = o.OrderDate,
                        Status = o.Status,
                        TotalAmount = o.TotalAmount,
                        Notes = o.Notes,
                        Vehicle = o.Vehicle != null ? new VehicleDto
                        {
                            VehicleId = o.Vehicle.VehicleId,
                            Make = o.Vehicle.Make,
                            Model = o.Vehicle.Model,
                            Year = o.Vehicle.Year,
                            LicensePlate = o.Vehicle.LicensePlate
                        } : null,
                        Service = o.Service != null ? new ServiceDto1
                        {
                            ServiceId = o.Service.ServiceId,
                            ServiceName = o.Service.ServiceName,
                            Category = o.Service.Category,
                            Price = o.Service.Price,
                            Description = o.Service.Description,
                            SubCategory = o.Service.SubCategory
                        } : null,
                        Inspection = o.Inspection != null ? new InspectionDto
                        {
                            InspectionId = o.Inspection.InspectionId,
                            ScheduledDate = o.Inspection.ScheduledDate,
                            Status = o.Inspection.Status,
                            TimeSlot = o.Inspection.TimeSlot,
                            ServiceName = o.Inspection.Service == null ? null : o.Inspection.Service.ServiceName,
                            SubCategory = o.Inspection.SubCategory
                        } : null,
                        AdditionalServices = o.OrderServices.Select(os => new ServiceDto1
                        {
                            ServiceId = os.Service.ServiceId,
                            ServiceName = os.Service.ServiceName,
                            Category = os.Service.Category,
                            Price = os.Service.Price,
                            Description = os.Service.Description,
                            SubCategory = os.Service.SubCategory
                        }).ToList()
                    })
                    .ToListAsync();

                // Get invoice information for orders
                var orderIds = orders.Select(o => o.OrderId).ToList();
                var invoices = await _context.Invoices
                    .Where(i => orderIds.Contains(i.OrderId))
                    .Select(i => new { i.OrderId, i.InvoiceId, i.Status })
                    .ToListAsync();

                // Add invoice information to orders
                foreach (var order in orders)
                {
                    var invoice = invoices.FirstOrDefault(i => i.OrderId == order.OrderId);
                    if (invoice != null)
                    {
                        order.InvoiceId = invoice.InvoiceId;
                        order.InvoiceStatus = invoice.Status;
                    }
                }

                // Calculate statistics
                var stats = new DashboardStatsDto
                {
                    TotalOrders = orders.Count,
                    CompletedOrders = orders.Count(o => o.Status.ToLower() == "completed"),
                    PendingOrders = orders.Count(o => o.Status.ToLower() == "pending"),
                    InProgressOrders = orders.Count(o => o.Status.ToLower() == "in progress"),
                    TotalSpent = orders.Sum(o => o.TotalAmount),
                    TotalVehicles = vehicles.Count,
                    ActiveInspections = orders.Count(o =>
                        o.IncludesInspection &&
                        (o.Status.ToLower() == "pending" || o.Status.ToLower() == "in progress"))
                };

                // Get recent orders (last 5)
                var recentOrders = orders.Take(5).ToList();

                var response = new CustomerDashboardResponse
                {
                    Success = true,
                    User = user,
                    Orders = orders,
                    RecentOrders = recentOrders,
                    Vehicles = vehicles,
                    Stats = stats
                };

                _logger.LogInformation("Dashboard data fetched successfully for user ID: {UserId}", userId);
                return new JsonResult(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = true,
                    ReferenceHandler = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching dashboard data");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while fetching dashboard data",
                    error = ex.Message
                });
            }
        }
    }

    // DTOs for the dashboard response
    public class CustomerDashboardResponse
    {
        public bool Success { get; set; }
        public UserInfoDto User { get; set; }
        public List<OrderDto> Orders { get; set; }
        public List<OrderDto> RecentOrders { get; set; }
        public List<VehicleDto> Vehicles { get; set; }
        public DashboardStatsDto Stats { get; set; }
    }

    public class UserInfoDto
    {
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string ImgUrl { get; set; }
    }

    public class OrderDto
    {
        public int OrderId { get; set; }
        public int UserId { get; set; }
        public int VehicleId { get; set; }
        public int? ServiceId { get; set; }
        public bool IncludesInspection { get; set; }
        public DateTime OrderDate { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; }
        public int? InvoiceId { get; set; }
        public string InvoiceStatus { get; set; }
        public VehicleDto Vehicle { get; set; }
        public ServiceDto1 Service { get; set; }
        public InspectionDto Inspection { get; set; }
        public List<ServiceDto1> AdditionalServices { get; set; } = new List<ServiceDto1>();
    }

    public class VehicleDto
    {
        public int VehicleId { get; set; }
        public string Make { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
        public string LicensePlate { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class ServiceDto1
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }
        public string SubCategory { get; set; }
    }

    public class InspectionDto
    {
        public int InspectionId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Status { get; set; }
        public string TimeSlot { get; set; }
        public string ServiceName { get; set; }
        public string SubCategory { get; set; }
    }

    public class DashboardStatsDto
    {
        public int TotalOrders { get; set; }
        public int CompletedOrders { get; set; }
        public int PendingOrders { get; set; }
        public int InProgressOrders { get; set; }
        public decimal TotalSpent { get; set; }
        public int TotalVehicles { get; set; }
        public int ActiveInspections { get; set; }
    }
}