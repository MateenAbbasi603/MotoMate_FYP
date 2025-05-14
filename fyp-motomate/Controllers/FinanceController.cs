using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "super_admin,admin,finance_officer")]
    public class FinanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FinanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Finance/summary
        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetFinancialSummary()
        {
            try
            {
                // Calculate total revenue (from all invoices)
                var totalRevenue = await _context.Invoices
                    .Where(i => i.Status != "cancelled")
                    .SumAsync(i => i.TotalAmount);

                // Calculate pending payments (invoices that aren't fully paid)
                var invoicesWithPayments = await _context.Invoices
                    .Include(i => i.Payments)
                    .Where(i => i.Status != "cancelled" && i.Status != "paid")
                    .ToListAsync();

                decimal pendingPayments = 0;
                int pendingInvoicesCount = 0;

                foreach (var invoice in invoicesWithPayments)
                {
                    var paidAmount = invoice.Payments?.Sum(p => p.Amount) ?? 0;
                    if (paidAmount < invoice.TotalAmount)
                    {
                        pendingPayments += (invoice.TotalAmount - paidAmount);
                        pendingInvoicesCount++;
                    }
                }

                // Calculate average invoice amount from last 30 days
                var thirtyDaysAgo = DateTime.Now.AddDays(-30);
                var recentInvoices = await _context.Invoices
                    .Where(i => i.InvoiceDate >= thirtyDaysAgo && i.Status != "cancelled")
                    .ToListAsync();

                decimal averageInvoice = 0;
                if (recentInvoices.Any())
                {
                    averageInvoice = recentInvoices.Average(i => i.TotalAmount);
                }

                // Calculate month-over-month percentage change
                var sixtyDaysAgo = DateTime.Now.AddDays(-60);
                var previousMonthInvoices = await _context.Invoices
                    .Where(i => i.InvoiceDate >= sixtyDaysAgo && i.InvoiceDate < thirtyDaysAgo && i.Status != "cancelled")
                    .ToListAsync();

                decimal previousMonthRevenue = previousMonthInvoices.Sum(i => i.TotalAmount);
                decimal currentMonthRevenue = recentInvoices.Sum(i => i.TotalAmount);

                decimal percentageChange = 0;
                if (previousMonthRevenue > 0)
                {
                    percentageChange = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
                }

                return Ok(new
                {
                    totalRevenue,
                    pendingPayments,
                    pendingInvoicesCount,
                    averageInvoice,
                    percentageChange,
                    success = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/Finance/invoices
        [HttpGet("invoices")]
        public async Task<ActionResult<List<object>>> GetInvoices()
        {
            try
            {
                // Check if we have any invoices
                var count = await _context.Invoices.CountAsync();
                if (count == 0)
                {
                    // Create sample data if no invoices exist
                    await CreateSampleData();
                }

                var invoices = await _context.Invoices
                    .Include(i => i.User)
                    .Include(i => i.Order)
                    .Include(i => i.Payments)
                    .Include(i => i.InvoiceItems)
                    .OrderByDescending(i => i.InvoiceDate)
                    .Take(20) // Limit to latest 20 for performance
                    .ToListAsync();

                var result = invoices.Select(i => new
                {
                    i.InvoiceId,
                    InvoiceDate = i.InvoiceDate.ToString("yyyy-MM-dd"), // Format date as ISO string
                    DueDate = i.DueDate.ToString("yyyy-MM-dd"), // Format date as ISO string
                    i.SubTotal,
                    i.TaxRate,
                    i.TaxAmount,
                    i.TotalAmount,
                    i.Status,
                    Customer = i.User != null ? new { i.User.Name, i.User.Email, i.User.Phone } : new { Name = "Unknown", Email = "unknown@example.com", Phone = "" },
                    OrderId = i.OrderId,
                    i.Notes,
                    PaidAmount = i.Payments?.Sum(p => p.Amount) ?? 0,
                    ItemsCount = i.InvoiceItems?.Count ?? 0,
                    IsOverdue = i.DueDate < DateTime.Now && i.Status != "paid" && i.Status != "cancelled"
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/Finance/payments
        [HttpGet("payments")]
        public async Task<ActionResult<List<object>>> GetPayments()
        {
            try
            {
                // Check if we have any payments
                var count = await _context.Payments.CountAsync();
                if (count == 0)
                {
                    // Create sample data if no payments exist
                    await CreateSampleData();
                }

                var payments = await _context.Payments
                    .Include(p => p.Invoice)
                        .ThenInclude(i => i.User)
                    .OrderByDescending(p => p.PaymentDate)
                    .Take(20) // Limit to latest 20 for performance
                    .ToListAsync();

                var result = payments.Select(p => new
                {
                    p.PaymentId,
                    PaymentDate = p.PaymentDate.ToString("yyyy-MM-dd"), // Format date as ISO string
                    p.Amount,
                    p.Method,
                    InvoiceId = p.InvoiceId,
                    InvoiceTotal = p.Invoice?.TotalAmount ?? 0,
                    Customer = p.Invoice?.User != null 
                        ? new { p.Invoice.User.Name, p.Invoice.User.Email } 
                        : new { Name = "Unknown", Email = "unknown@example.com" }
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        // GET: api/Finance/reports/monthly
        [HttpGet("reports/monthly")]
        public async Task<ActionResult<object>> GetMonthlyReports([FromQuery] int year = 0)
        {
            try
            {
                // Default to current year if not specified
                if (year == 0)
                {
                    year = DateTime.Now.Year;
                }

                // Check if we have any invoices
                var count = await _context.Invoices.CountAsync();
                if (count == 0)
                {
                    // Create sample data if no invoices exist
                    await CreateSampleData();
                }

                var invoices = await _context.Invoices
                    .Where(i => i.InvoiceDate.Year == year && i.Status != "cancelled")
                    .ToListAsync();

                // Group by month - ensure to format month names properly
                var monthlyData = invoices
                    .GroupBy(i => i.InvoiceDate.Month)
                    .Select(g => new
                    {
                        Month = g.Key,
                        MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(g.Key),
                        Revenue = g.Sum(i => i.TotalAmount),
                        Count = g.Count()
                    })
                    .OrderBy(d => d.Month)
                    .ToList();

                // Ensure all months are represented with proper month names
                var fullYearData = Enumerable.Range(1, 12)
                    .Select(month => {
                        var existingData = monthlyData.FirstOrDefault(d => d.Month == month);
                        return new
                        {
                            Month = month,
                            MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                            Revenue = existingData?.Revenue ?? 0,
                            Count = existingData?.Count ?? 0
                        };
                    })
                    .ToList();

                return Ok(new
                {
                    Year = year,
                    TotalRevenue = invoices.Sum(i => i.TotalAmount),
                    InvoiceCount = invoices.Count,
                    MonthlyData = fullYearData
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        // Helper method to create sample data for testing
        private async Task CreateSampleData()
        {
            // Check if we already have users
            var userCount = await _context.Users.CountAsync();
            if (userCount == 0)
            {
                // Add a sample customer user if none exists
                var customer = new User
                {
                    Username = "customer1",
                    Password = BCrypt.Net.BCrypt.HashPassword("Password@123"),
                    Email = "customer1@example.com",
                    Role = "customer",
                    Name = "Sample Customer",
                    Phone = "+9212345678",
                    Address = "123 Main St, Karachi",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                _context.Users.Add(customer);
                await _context.SaveChangesAsync();
            }

            // Get the first customer user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Role == "customer");
            if (user == null)
            {
                return; // Cannot continue without a user
            }

            // Create sample invoices
            var currentDate = DateTime.Now;
            
            // Create 6 invoices over the past 6 months
            for (int i = 0; i < 6; i++)
            {
                var invoiceDate = currentDate.AddMonths(-i);
                var dueDate = invoiceDate.AddDays(15);
                var subtotal = (decimal)(500 + (i * 100));
                var taxRate = 18m;
                var taxAmount = subtotal * (taxRate / 100);
                var total = subtotal + taxAmount;

                var invoice = new Invoice
                {
                    OrderId = 1,
                    UserId = user.UserId,
                    InvoiceDate = invoiceDate,
                    DueDate = dueDate,
                    SubTotal = subtotal,
                    TaxRate = taxRate,
                    TaxAmount = taxAmount,
                    TotalAmount = total,
                    Status = i < 3 ? "paid" : "pending",
                    Notes = $"Sample invoice #{i+1}"
                };
                _context.Invoices.Add(invoice);
            }
            
            await _context.SaveChangesAsync();

            // Add sample payments for the paid invoices
            var paidInvoices = await _context.Invoices.Where(i => i.Status == "paid").ToListAsync();
            foreach (var invoice in paidInvoices)
            {
                var payment = new Payment
                {
                    InvoiceId = invoice.InvoiceId,
                    PaymentDate = invoice.InvoiceDate.AddDays(5),
                    Amount = invoice.TotalAmount,
                    Method = "Cash"
                };
                _context.Payments.Add(payment);
            }

            await _context.SaveChangesAsync();
        }
    }
}