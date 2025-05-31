using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvoicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("generate-from-order/{orderId}")]
        public async Task<ActionResult<Invoice>> GenerateInvoiceFromOrder(int orderId)
        {
            try
            {
                // Check if the order exists
                var order = await _context.Orders
                    .Include(o => o.User)
                    .Include(o => o.Vehicle)
                    .Include(o => o.Service)
                    .Include(o => o.Inspection)
                        .ThenInclude(i => i.Service)
                    .Include(o => o.OrderServices)
                        .ThenInclude(os => os.Service)
                    .FirstOrDefaultAsync(o => o.OrderId == orderId);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found" });
                }

                // Check if order is completed
                if (order.Status.ToLower() != "completed")
                {
                    return BadRequest(new { success = false, message = "Cannot generate invoice for an incomplete order" });
                }

                // Check if invoice already exists for this order
                var existingInvoice = await _context.Invoices
                    .Include(i => i.InvoiceItems)
                    .FirstOrDefaultAsync(i => i.OrderId == orderId);

                if (existingInvoice != null)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Invoice already exists for this order",
                        invoice = existingInvoice,
                        invoiceItems = existingInvoice.InvoiceItems,
                        paymentMethod = order.paymentMethod ?? "online",
                        isExisting = true
                    });
                }

                // Check if there's an appointment for this order
                var appointment = await _context.Appointments
                    .Include(a => a.Mechanic)
                    .FirstOrDefaultAsync(a => a.OrderId == orderId);

                // Calculate subtotal by summing all services
                decimal subTotal = 0;

                // Main service (if exists)
                if (order.ServiceId.HasValue && order.Service != null)
                {
                    subTotal += order.Service.Price;
                }

                // Inspection (if exists)
                if (order.IncludesInspection && order.Inspection?.Service != null)
                {
                    subTotal += order.Inspection.Service.Price;
                }

                // Additional services
                if (order.OrderServices != null && order.OrderServices.Any())
                {
                    subTotal += order.OrderServices.Sum(os => os.Service.Price);
                }

                // If no services found, use order total amount
                if (subTotal == 0)
                {
                    subTotal = order.TotalAmount;
                }

                decimal taxRate = 18.0m; // 18% tax rate
                decimal taxAmount = Math.Round(subTotal * (taxRate / 100), 2);
                decimal totalAmount = subTotal + taxAmount;

                // Create the invoice with payment method context
                var invoice = new Invoice
                {
                    OrderId = orderId,
                    UserId = order.UserId,
                    AppointmentId = appointment?.AppointmentId,
                    MechanicId = appointment?.MechanicId,
                    SubTotal = subTotal,
                    TaxRate = taxRate,
                    TaxAmount = taxAmount,
                    TotalAmount = totalAmount,
                    InvoiceDate = DateTime.Now,
                    Status = order.paymentMethod?.ToLower() == "cash" ? "pending_cash" : "issued", // Different status for cash
                    DueDate = DateTime.Now.AddDays(30),
                    Notes = $"Invoice for Order #{orderId} - Payment Method: {order.paymentMethod?.ToUpper() ?? "ONLINE"}"
                };

                // Add any additional details if appointment exists
                if (appointment != null)
                {
                    invoice.Notes += $" - Serviced by {appointment.Mechanic?.Name ?? "Unknown"}";
                }

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                // Create invoice items for the services
                var invoiceItems = new List<InvoiceItem>();

                // Main service (if exists)
                if (order.ServiceId.HasValue && order.Service != null)
                {
                    var mainServiceItem = new InvoiceItem
                    {
                        InvoiceId = invoice.InvoiceId,
                        Description = order.Service.ServiceName,
                        Quantity = 1,
                        UnitPrice = order.Service.Price,
                        TotalPrice = order.Service.Price
                    };
                    _context.InvoiceItems.Add(mainServiceItem);
                    invoiceItems.Add(mainServiceItem);
                }

                // Inspection (if exists)
                if (order.IncludesInspection && order.Inspection?.Service != null)
                {
                    var inspectionDescription = order.Inspection.Service.ServiceName;
                    if (!string.IsNullOrEmpty(order.Inspection.Service.SubCategory))
                    {
                        inspectionDescription += $" - {order.Inspection.Service.SubCategory}";
                    }

                    var inspectionItem = new InvoiceItem
                    {
                        InvoiceId = invoice.InvoiceId,
                        Description = $"Inspection: {inspectionDescription}",
                        Quantity = 1,
                        UnitPrice = order.Inspection.Service.Price,
                        TotalPrice = order.Inspection.Service.Price
                    };
                    _context.InvoiceItems.Add(inspectionItem);
                    invoiceItems.Add(inspectionItem);
                }

                // Additional services
                if (order.OrderServices != null && order.OrderServices.Any())
                {
                    foreach (var orderService in order.OrderServices)
                    {
                        var additionalServiceItem = new InvoiceItem
                        {
                            InvoiceId = invoice.InvoiceId,
                            Description = orderService.Service.ServiceName,
                            Quantity = 1,
                            UnitPrice = orderService.Service.Price,
                            TotalPrice = orderService.Service.Price
                        };
                        _context.InvoiceItems.Add(additionalServiceItem);
                        invoiceItems.Add(additionalServiceItem);
                    }
                }

                // If no items were created, create a generic service item
                if (invoiceItems.Count == 0)
                {
                    var genericItem = new InvoiceItem
                    {
                        InvoiceId = invoice.InvoiceId,
                        Description = "Automotive Service",
                        Quantity = 1,
                        UnitPrice = subTotal,
                        TotalPrice = subTotal
                    };
                    _context.InvoiceItems.Add(genericItem);
                    invoiceItems.Add(genericItem);
                }

                await _context.SaveChangesAsync();

                // Create notification for customer with payment method context
                var notification = new Notification
                {
                    UserId = order.UserId,
                    Message = order.paymentMethod?.ToLower() == "cash"
                        ? $"Invoice #{invoice.InvoiceId} has been generated for your order. Please pay at the workshop."
                        : $"Invoice #{invoice.InvoiceId} has been generated for your order",
                    Status = "unread",
                    CreatedAt = DateTime.Now
                };
                _context.Notifications.Add(notification);

                // Create notification for admin about cash payment
                if (order.paymentMethod?.ToLower() == "cash")
                {
                    var adminNotification = new Notification
                    {
                        UserId = 1, // Admin
                        Message = $"Cash payment pending for Invoice #{invoice.InvoiceId} - Customer: {order.User?.Name}",
                        Status = "unread",
                        CreatedAt = DateTime.Now
                    };
                    _context.Notifications.Add(adminNotification);
                }

                await _context.SaveChangesAsync();

                // Return the invoice details with payment method info
                return Ok(new
                {
                    success = true,
                    message = "Invoice generated successfully",
                    invoice,
                    invoiceItems,
                    paymentMethod = order.paymentMethod ?? "online",
                    isExisting = false
                });
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.Error.WriteLine($"Error generating invoice: {ex.Message}");
                Console.Error.WriteLine(ex.StackTrace);
                if (ex.InnerException != null)
                {
                    Console.Error.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.Error.WriteLine(ex.InnerException.StackTrace);
                }

                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while generating the invoice",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }


        [HttpGet("pay/{id}")]
        [Authorize]
        public async Task<ActionResult<object>> GetInvoiceForPayment(int id)
        {
            try
            {
                // Get the user ID from the token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user credentials" });
                }

                // Get the invoice with all necessary details
                var invoice = await _context.Invoices
                    .Include(i => i.InvoiceItems)
                    .Include(i => i.User)
                    .FirstOrDefaultAsync(i => i.InvoiceId == id);

                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Invoice not found" });
                }

                // Security check - ensure the customer can only access their own invoices
                if (invoice.UserId != userId)
                {
                    return Forbid();
                }

                // Check if invoice is already paid
                if (invoice.Status.ToLower() == "paid")
                {
                    return Ok(new
                    {
                        success = true,
                        invoice,
                        invoiceItems = invoice.InvoiceItems,
                        alreadyPaid = true,
                        message = "This invoice has already been paid"
                    });
                }

                return Ok(new
                {
                    success = true,
                    invoice,
                    invoiceItems = invoice.InvoiceItems,
                    alreadyPaid = false
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the invoice",
                    error = ex.Message
                });
            }
        }

        // Add this new endpoint to your InvoicesController.cs
        // GET: api/Invoices/customer/{orderId}
        [HttpGet("customer/{orderId}")]
        [Authorize] // Allow any authenticated user
        public async Task<ActionResult<object>> GetCustomerInvoiceByOrderId(int orderId)
        {
            try
            {
                // Get the user ID from the token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { success = false, message = "Invalid user credentials" });
                }

                // First verify this order belongs to the current user
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.OrderId == orderId);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found" });
                }

                // Security check - ensure the customer can only access their own orders
                if (order.UserId != userId)
                {
                    return Forbid();
                }

                // Get the invoice for this order
                var invoice = await _context.Invoices
                    .Include(i => i.InvoiceItems)
                    .FirstOrDefaultAsync(i => i.OrderId == orderId);

                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Invoice not found for this order" });
                }

                // Get the user/customer information
                var customer = await _context.Users
                    .Where(u => u.UserId == userId)
                    .Select(u => new
                    {
                        u.UserId,
                        u.Name,
                        u.Email,
                        u.Phone,
                        u.Address
                    })
                    .FirstOrDefaultAsync();

                // Get vehicle information
                var vehicle = await _context.Vehicles
                    .FirstOrDefaultAsync(v => v.VehicleId == order.VehicleId);

                // Get mechanic information if available
                var mechanic = invoice.MechanicId.HasValue
                    ? await _context.Users
                        .Where(u => u.UserId == invoice.MechanicId)
                        .Select(u => new
                        {
                            u.UserId,
                            u.Name,
                            u.Phone
                        })
                        .FirstOrDefaultAsync()
                    : null;

                return Ok(new
                {
                    success = true,
                    invoice,
                    invoiceItems = invoice.InvoiceItems,
                    order,
                    vehicle,
                    customer,
                    mechanic
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the invoice",
                    error = ex.Message
                });
            }
        }
        // GET: api/Invoices/{id}


        // GET: api/Invoices/customer/{id}
        [HttpGet("customerpay/{id}")]
        [AllowAnonymous] // Allow anonymous access for testing
        public async Task<ActionResult<object>> GetCustomerInvoiceByOrderId1(int id)
        {
            try
            {
                // Check if the invoice exists
                var invoice = await _context.Invoices
                    .Include(i => i.Order)
                    .Include(i => i.InvoiceItems)
                    .FirstOrDefaultAsync(i => i.InvoiceId == id);

                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Invoice not found" });
                }

                // Get the customer information
                var customer = await _context.Users
                    .Where(u => u.UserId == invoice.UserId)
                    .Select(u => new
                    {
                        u.UserId,
                        u.Name,
                        u.Email,
                        u.Phone,
                        u.Address
                    })
                    .FirstOrDefaultAsync();

                // Get vehicle information
                var vehicle = invoice.Order != null ?
                    await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == invoice.Order.VehicleId) : null;

                return Ok(new
                {
                    success = true,
                    invoice,
                    invoiceItems = invoice.InvoiceItems,
                    customer,
                    vehicle
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error retrieving invoice: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the invoice",
                    error = ex.Message
                });
            }
        }


        // Update the GetInvoice method in InvoicesController.cs
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetInvoice(int id)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Order)
                    .Include(i => i.User)
                    .Include(i => i.Mechanic)
                    .Include(i => i.InvoiceItems) // Make sure this is included
                    .FirstOrDefaultAsync(i => i.InvoiceId == id);

                if (invoice == null)
                {
                    return NotFound(new { success = false, message = "Invoice not found" });
                }

                // Check permission - admin can see all, customer can only see their own
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userIdClaim != null && !string.IsNullOrEmpty(userIdClaim.Value))
                {
                    if (int.TryParse(userIdClaim.Value, out int userId))
                    {
                        if (userRole?.ToLower() == "customer" && invoice.UserId != userId)
                        {
                            return Forbid();
                        }
                    }
                }

                // Get the related order and vehicle information
                var order = await _context.Orders
                    .Include(o => o.Vehicle)
                    .Include(o => o.Service)
                    .Include(o => o.OrderServices)
                        .ThenInclude(os => os.Service)
                    .Include(o => o.Inspection)
                        .ThenInclude(i => i.Service)
                    .FirstOrDefaultAsync(o => o.OrderId == invoice.OrderId);

                // Explicitly fetch the invoice items to ensure they're loaded
                var invoiceItems = await _context.InvoiceItems
                    .Where(item => item.InvoiceId == id)
                    .ToListAsync();

                // Log for debugging
                Console.WriteLine($"Found {invoiceItems.Count} invoice items for invoice {id}");
                foreach (var item in invoiceItems)
                {
                    Console.WriteLine($"Item: {item.Description}, Price: {item.UnitPrice}, Total: {item.TotalPrice}");
                }

                // Ensure we have full customer information
                var customer = await _context.Users
                    .Where(u => u.UserId == invoice.UserId)
                    .Select(u => new
                    {
                        u.UserId,
                        u.Name,
                        u.Email,
                        u.Phone,
                        u.Address
                    })
                    .FirstOrDefaultAsync();

                // Get mechanic information if available
                var mechanic = invoice.MechanicId.HasValue
                    ? await _context.Users
                        .Where(u => u.UserId == invoice.MechanicId)
                        .Select(u => new
                        {
                            u.UserId,
                            u.Name,
                            u.Email,
                            u.Phone
                        })
                        .FirstOrDefaultAsync()
                    : null;

                // Create a comprehensive response
                var response = new
                {
                    success = true,
                    invoice = new
                    {
                        invoice.InvoiceId,
                        invoice.OrderId,
                        invoice.UserId,
                        invoice.AppointmentId,
                        invoice.MechanicId,
                        invoice.SubTotal,
                        invoice.TaxRate,
                        invoice.TaxAmount,
                        invoice.TotalAmount,
                        invoice.InvoiceDate,
                        invoice.DueDate,
                        invoice.Status,
                        invoice.Notes
                    },
                    invoiceItems = invoiceItems.Select(item => new
                    {
                        item.InvoiceItemId,
                        item.InvoiceId,
                        item.Description,
                        item.Quantity,
                        item.UnitPrice,
                        item.TotalPrice
                    }).ToList(),
                    order = order != null ? new
                    {
                        order.OrderId,
                        order.UserId,
                        order.VehicleId,
                        order.ServiceId,
                        order.IncludesInspection,
                        order.OrderDate,
                        order.Status,
                        order.TotalAmount,
                        order.Notes,
                        // Include main service
                        service = order.Service != null ? new
                        {
                            order.Service.ServiceId,
                            order.Service.ServiceName,
                            order.Service.Category,
                            order.Service.Price,
                            order.Service.Description
                        } : null,
                        // Include additional services
                        additionalServices = order.OrderServices != null ? order.OrderServices.Select(os => new
                        {
                            os.Service.ServiceId,
                            os.Service.ServiceName,
                            os.Service.Category,
                            os.Service.Price,
                            os.Service.Description
                        }).ToList().Cast<object>().ToList() : new List<object>(),
                        // Include inspection details
                        inspection = order.Inspection != null ? new
                        {
                            order.Inspection.InspectionId,
                            order.Inspection.ServiceId,
                            serviceName = order.Inspection.Service?.ServiceName,
                            subCategory = order.Inspection.Service?.SubCategory,
                            price = order.Inspection.Service?.Price ?? 0,
                            order.Inspection.ScheduledDate,
                            order.Inspection.TimeSlot,
                            order.Inspection.Status,
                            order.Inspection.Notes
                        } : null
                    } : null,
                    vehicle = order?.Vehicle != null ? new
                    {
                        order.Vehicle.VehicleId,
                        order.Vehicle.Make,
                        order.Vehicle.Model,
                        order.Vehicle.Year,
                        order.Vehicle.LicensePlate
                    } : null,
                    customer,
                    mechanic
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.Error.WriteLine($"Error retrieving invoice: {ex.Message}");
                Console.Error.WriteLine(ex.StackTrace);

                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while retrieving the invoice",
                    error = ex.Message
                });
            }
        }

    }
}