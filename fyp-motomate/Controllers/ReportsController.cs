using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Text.Json;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "super_admin,admin,finance_officer")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(ApplicationDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Reports/test
        [HttpGet("test")]
        [AllowAnonymous] // For testing only - remove this after testing
        public async Task<ActionResult> TestEndpoint()
        {
            return Ok(new { message = "Reports controller is working", timestamp = DateTime.Now });
        }

        // GET: api/Reports
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReportSummaryDto>>> GetReports([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var reports = await _context.FinancialReports
                    .Include(r => r.GeneratedByUser)
                    .OrderByDescending(r => r.GeneratedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(r => new ReportSummaryDto
                    {
                        ReportId = r.ReportId,
                        ReportName = r.ReportName,
                        ReportType = r.ReportType,
                        ReportCategory = r.ReportCategory,
                        StartDate = r.StartDate,
                        EndDate = r.EndDate,
                        TotalRevenue = r.TotalRevenue,
                        TotalTax = r.TotalTax,
                        NetRevenue = r.NetRevenue,
                        TotalInvoices = r.TotalInvoices,
                        GeneratedAt = r.GeneratedAt,
                        GeneratedByName = r.GeneratedByUser.Name
                    })
                    .ToListAsync();

                var totalCount = await _context.FinancialReports.CountAsync();

                return Ok(new
                {
                    reports,
                    totalCount,
                    currentPage = page,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving reports");
                return StatusCode(500, new { message = "An error occurred while retrieving reports" });
            }
        }

        // GET: api/Reports/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DetailedReportDto>> GetReport(int id)
        {
            try
            {
                var report = await _context.FinancialReports
                    .Include(r => r.GeneratedByUser)
                    .FirstOrDefaultAsync(r => r.ReportId == id);

                if (report == null)
                {
                    return NotFound(new { message = "Report not found" });
                }

                var detailedReport = new DetailedReportDto
                {
                    ReportId = report.ReportId,
                    ReportName = report.ReportName,
                    ReportType = report.ReportType,
                    ReportCategory = report.ReportCategory,
                    StartDate = report.StartDate,
                    EndDate = report.EndDate,
                    TotalRevenue = report.TotalRevenue,
                    TotalTax = report.TotalTax,
                    NetRevenue = report.NetRevenue,
                    TotalInvoices = report.TotalInvoices,
                    TotalItems = report.TotalItems,
                    InventoryValue = report.InventoryValue,
                    GeneratedAt = report.GeneratedAt,
                    GeneratedByName = report.GeneratedByUser.Name,
                    Notes = report.Notes,
                    ReportData = string.IsNullOrEmpty(report.ReportData) ? null : JsonSerializer.Deserialize<object>(report.ReportData)
                };

                return Ok(detailedReport);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving report {ReportId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the report" });
            }
        }

        // POST: api/Reports/generate
        [HttpPost("generate")]
        public async Task<ActionResult<DetailedReportDto>> GenerateReport([FromBody] GenerateReportRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                
                // Validate date range
                if (request.StartDate >= request.EndDate)
                {
                    return BadRequest(new { message = "Start date must be before end date" });
                }

                var reportData = await GenerateReportData(request);
                
                var report = new FinancialReport
                {
                    ReportName = GenerateReportName(request),
                    ReportType = request.ReportType,
                    ReportCategory = request.ReportCategory,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    TotalRevenue = reportData.TotalRevenue,
                    TotalTax = reportData.TotalTax,
                    NetRevenue = reportData.NetRevenue,
                    TotalInvoices = reportData.TotalInvoices,
                    TotalItems = reportData.TotalItems,
                    InventoryValue = reportData.InventoryValue,
                    ReportData = JsonSerializer.Serialize(reportData.DetailedData),
                    GeneratedBy = userId,
                    GeneratedAt = DateTime.Now,
                    Notes = request.Notes
                };

                _context.FinancialReports.Add(report);
                await _context.SaveChangesAsync();

                // Reload with user data
                await _context.Entry(report)
                    .Reference(r => r.GeneratedByUser)
                    .LoadAsync();

                var result = new DetailedReportDto
                {
                    ReportId = report.ReportId,
                    ReportName = report.ReportName,
                    ReportType = report.ReportType,
                    ReportCategory = report.ReportCategory,
                    StartDate = report.StartDate,
                    EndDate = report.EndDate,
                    TotalRevenue = report.TotalRevenue,
                    TotalTax = report.TotalTax,
                    NetRevenue = report.NetRevenue,
                    TotalInvoices = report.TotalInvoices,
                    TotalItems = report.TotalItems,
                    InventoryValue = report.InventoryValue,
                    GeneratedAt = report.GeneratedAt,
                    GeneratedByName = report.GeneratedByUser.Name,
                    Notes = report.Notes,
                    ReportData = reportData.DetailedData
                };

                return CreatedAtAction(nameof(GetReport), new { id = report.ReportId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating report");
                return StatusCode(500, new { message = "An error occurred while generating the report" });
            }
        }

        // DELETE: api/Reports/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            try
            {
                var report = await _context.FinancialReports.FindAsync(id);
                if (report == null)
                {
                    return NotFound(new { message = "Report not found" });
                }

                _context.FinancialReports.Remove(report);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Report deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting report {ReportId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the report" });
            }
        }

        private async Task<ReportGenerationResult> GenerateReportData(GenerateReportRequest request)
        {
            var result = new ReportGenerationResult();

            switch (request.ReportCategory.ToLower())
            {
                case "sales":
                    result = await GenerateSalesReport(request.StartDate, request.EndDate);
                    break;
                case "saleswithtax":
                    result = await GenerateSalesWithTaxReport(request.StartDate, request.EndDate);
                    break;
                case "saleswithouttax":
                    result = await GenerateSalesWithoutTaxReport(request.StartDate, request.EndDate);
                    break;
                case "inventory":
                    result = await GenerateInventoryReport(request.StartDate, request.EndDate);
                    break;
                default:
                    throw new ArgumentException("Invalid report category");
            }

            return result;
        }

        private async Task<ReportGenerationResult> GenerateSalesReport(DateTime startDate, DateTime endDate)
        {
            var invoices = await _context.Invoices
                .Include(i => i.User)
                .Include(i => i.InvoiceItems)
                .Where(i => i.InvoiceDate >= startDate && i.InvoiceDate <= endDate && i.Status != "cancelled")
                .ToListAsync();

            var result = new ReportGenerationResult
            {
                TotalRevenue = invoices.Sum(i => i.TotalAmount),
                TotalTax = invoices.Sum(i => i.TaxAmount),
                NetRevenue = invoices.Sum(i => i.SubTotal),
                TotalInvoices = invoices.Count,
                TotalItems = invoices.SelectMany(i => i.InvoiceItems).Sum(item => item.Quantity)
            };

            result.DetailedData = new
            {
                InvoiceBreakdown = invoices.Select(i => new
                {
                    InvoiceId = i.InvoiceId,
                    InvoiceDate = i.InvoiceDate.ToString("yyyy-MM-dd"),
                    CustomerName = i.User?.Name ?? "Unknown",
                    SubTotal = i.SubTotal,
                    TaxAmount = i.TaxAmount,
                    TotalAmount = i.TotalAmount,
                    Status = i.Status,
                    ItemCount = i.InvoiceItems?.Count ?? 0
                }).OrderByDescending(i => i.InvoiceDate),
                Summary = new
                {
                    AverageInvoiceValue = result.TotalInvoices > 0 ? result.TotalRevenue / result.TotalInvoices : 0,
                    TaxRate = result.NetRevenue > 0 ? (result.TotalTax / result.NetRevenue) * 100 : 0
                }
            };

            return result;
        }

        private async Task<ReportGenerationResult> GenerateSalesWithTaxReport(DateTime startDate, DateTime endDate)
        {
            var result = await GenerateSalesReport(startDate, endDate);
            
            // Focus on tax calculations
            var invoices = await _context.Invoices
                .Where(i => i.InvoiceDate >= startDate && i.InvoiceDate <= endDate && i.Status != "cancelled")
                .ToListAsync();

            var taxBreakdown = invoices
                .GroupBy(i => i.TaxRate)
                .Select(g => new
                {
                    TaxRate = g.Key,
                    InvoiceCount = g.Count(),
                    SubTotal = g.Sum(i => i.SubTotal),
                    TaxAmount = g.Sum(i => i.TaxAmount),
                    TotalAmount = g.Sum(i => i.TotalAmount)
                })
                .OrderBy(t => t.TaxRate);

            result.DetailedData = new
            {
                TaxBreakdown = taxBreakdown,
                TotalTaxCollected = result.TotalTax,
                EffectiveTaxRate = result.NetRevenue > 0 ? (result.TotalTax / result.NetRevenue) * 100 : 0,
                InvoicesWithTax = invoices.Where(i => i.TaxAmount > 0).Count(),
                InvoicesWithoutTax = invoices.Where(i => i.TaxAmount == 0).Count()
            };

            return result;
        }

        private async Task<ReportGenerationResult> GenerateSalesWithoutTaxReport(DateTime startDate, DateTime endDate)
        {
            var invoices = await _context.Invoices
                .Include(i => i.User)
                .Where(i => i.InvoiceDate >= startDate && i.InvoiceDate <= endDate && i.Status != "cancelled")
                .ToListAsync();

            var result = new ReportGenerationResult
            {
                TotalRevenue = invoices.Sum(i => i.SubTotal), // Exclude tax
                TotalTax = 0,
                NetRevenue = invoices.Sum(i => i.SubTotal),
                TotalInvoices = invoices.Count,
                TotalItems = await _context.InvoiceItems
                    .Where(item => invoices.Select(i => i.InvoiceId).Contains(item.InvoiceId))
                    .SumAsync(item => item.Quantity)
            };

            result.DetailedData = new
            {
                InvoiceBreakdown = invoices.Select(i => new
                {
                    InvoiceId = i.InvoiceId,
                    InvoiceDate = i.InvoiceDate.ToString("yyyy-MM-dd"),
                    CustomerName = i.User?.Name ?? "Unknown",
                    SubTotal = i.SubTotal,
                    Status = i.Status
                }).OrderByDescending(i => i.InvoiceDate),
                Summary = new
                {
                    AverageInvoiceValue = result.TotalInvoices > 0 ? result.TotalRevenue / result.TotalInvoices : 0,
                    Note = "Tax amounts excluded from calculations"
                }
            };

            return result;
        }

        private async Task<ReportGenerationResult> GenerateInventoryReport(DateTime startDate, DateTime endDate)
        {
            var inventoryItems = await _context.Inventory
                .Where(i => !i.PurchaseDate.HasValue || 
                           (i.PurchaseDate >= startDate && i.PurchaseDate <= endDate))
                .ToListAsync();

            var result = new ReportGenerationResult
            {
                TotalRevenue = 0, // Not applicable for inventory
                TotalTax = 0,
                NetRevenue = 0,
                TotalInvoices = 0,
                TotalItems = inventoryItems.Sum(i => i.Quantity),
                InventoryValue = inventoryItems.Sum(i => i.Price * i.Quantity)
            };

            result.DetailedData = new
            {
                InventoryBreakdown = inventoryItems.Select(i => new
                {
                    ToolId = i.ToolId,
                    ToolName = i.ToolName,
                    ToolType = i.ToolType,
                    Quantity = i.Quantity,
                    Price = i.Price,
                    TotalValue = i.Price * i.Quantity,
                    Condition = i.Condition,
                    PurchaseDate = i.PurchaseDate?.ToString("yyyy-MM-dd") ?? "N/A",
                    VendorName = i.VendorName ?? "Unknown"
                }).OrderBy(i => i.ToolName),
                Summary = new
                {
                    TotalItems = result.TotalItems,
                    TotalValue = result.InventoryValue,
                    AverageItemValue = result.TotalItems > 0 ? result.InventoryValue / result.TotalItems : 0,
                    ItemsByCondition = inventoryItems.GroupBy(i => i.Condition)
                        .Select(g => new { Condition = g.Key, Count = g.Sum(item => item.Quantity) })
                }
            };

            return result;
        }

        private string GenerateReportName(GenerateReportRequest request)
        {
            return $"{request.ReportCategory} Report ({request.ReportType}) - {request.StartDate:MMM yyyy} to {request.EndDate:MMM yyyy}";
        }

        private class ReportGenerationResult
        {
            public decimal TotalRevenue { get; set; }
            public decimal TotalTax { get; set; }
            public decimal NetRevenue { get; set; }
            public int TotalInvoices { get; set; }
            public int TotalItems { get; set; }
            public decimal InventoryValue { get; set; }
            public object DetailedData { get; set; }
        }
    }
}