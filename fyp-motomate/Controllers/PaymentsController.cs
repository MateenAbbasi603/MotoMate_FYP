using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using System.Security.Claims;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PaymentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/Payments/process-safepay
        [HttpPost("process-safepay")]
        [AllowAnonymous] // Allow anonymous access for testing
        public async Task<ActionResult<object>> ProcessSafepayPayment([FromBody] SafepayPaymentRequest request)
        {
            try
            {
                // Validate request
                if (request == null || request.InvoiceId <= 0 || string.IsNullOrEmpty(request.TransactionId))
                {
                    return BadRequest(new { success = false, message = "Invalid payment information" });
                }

                Console.WriteLine($"Processing payment for invoice #{request.InvoiceId} with transaction {request.TransactionId}");

                // Get the invoice
                var invoice = await _context.Invoices
                    .Include(i => i.Order)
                    .FirstOrDefaultAsync(i => i.InvoiceId == request.InvoiceId);

                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Invoice not found" });
                }

                // Skip auth check for testing - in production you'd check user permissions
                
                // Check if invoice is already paid
                if (invoice.Status.ToLower() == "paid")
                {
                    return BadRequest(new { success = false, message = "Invoice is already paid" });
                }

                // Create new payment record
                var payment = new Payment
                {
                    InvoiceId = invoice.InvoiceId,
                    Amount = invoice.TotalAmount,
                    Method = "Safepay",
                    PaymentDate = DateTime.Now,
                };

                _context.Payments.Add(payment);

                // Update invoice status
                invoice.Status = "paid";
                
                // Update order status if needed
                if (invoice.Order != null && invoice.Order.Status != "completed")
                {
                    invoice.Order.Status = "completed";
                }

                await _context.SaveChangesAsync();

                // Create notification for customer
                var notification = new Notification
                {
                    UserId = invoice.UserId,
                    Message = $"Payment of PKR {invoice.TotalAmount} received for Invoice #{invoice.InvoiceId}",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(notification);

                // Create notification for admin
                var adminNotification = new Notification
                {
                    UserId = 1, // Assuming admin has ID 1
                    Message = $"Payment received for Invoice #{invoice.InvoiceId} from User ID {invoice.UserId}",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(adminNotification);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Payment processed successfully",
                    payment = new
                    {
                        payment.PaymentId,
                        payment.InvoiceId,
                        payment.Amount,
                        payment.Method,
                        payment.PaymentDate,
                    }
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error processing payment: {ex.Message}");
                Console.Error.WriteLine(ex.StackTrace);

                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while processing the payment",
                    error = ex.Message
                });
            }
        }

        // GET: api/Payments/invoice/{invoiceId}
        [HttpGet("invoice/{invoiceId}")]
        public async Task<ActionResult<object>> GetPaymentsByInvoiceId(int invoiceId)
        {
            try
            {
                // Get the user ID from the token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user credentials" });
                }

                // Get the invoice to check permissions
                var invoice = await _context.Invoices
                    .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Invoice not found" });
                }

                // Security check - customer can only view their own payments
                if (userRole?.ToLower() == "customer" && invoice.UserId != userId)
                {
                    return Forbid();
                }

                // Get payments for the invoice
                var payments = await _context.Payments
                    .Where(p => p.InvoiceId == invoiceId)
                    .Select(p => new
                    {
                        p.PaymentId,
                        p.InvoiceId,
                        p.Amount,
                        p.Method,
                        p.PaymentDate,
                        // p.TransactionId,
                        // p.PaymentNotes
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    invoiceId,
                    totalAmount = invoice.TotalAmount,
                    payments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the payments",
                    error = ex.Message
                });
            }
        }
    }

    public class SafepayPaymentRequest
    {
        public int InvoiceId { get; set; }
        public string TransactionId { get; set; }
        // Add any other fields you might need from Safepay response
    }
}