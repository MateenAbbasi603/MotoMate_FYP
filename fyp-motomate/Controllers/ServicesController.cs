// Controllers/ServicesController.cs
using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicesController : ControllerBase  // Changed from OrdersController to ServicesController
    {
        private readonly ApplicationDbContext _context;

        public ServicesController(ApplicationDbContext context)  // Changed constructor name
        {
            _context = context;
        }

        // GET: api/Services
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Service>>> GetServices()  // Changed method name
        {
            return await _context.Services.ToListAsync();
        }

        // GET: api/Services/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Service>> GetService(int id)  // Changed method name
        {
            var service = await _context.Services.FindAsync(id);

            if (service == null)
            {
                return NotFound(new { message = "Service not found" });
            }

            return service;
        }

        // POST: api/Services
        [HttpPost]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<ActionResult<Service>> CreateService([FromBody] ServiceRequest request)  // Changed method name and parameter type
        {
            if (string.IsNullOrEmpty(request.ServiceName))
            {
                return BadRequest(new { message = "Service name is required" });
            }

            if (request.Price <= 0)
            {
                return BadRequest(new { message = "Price must be greater than zero" });
            }

            if (!new[] { "repair", "maintenance", "inspection" }.Contains(request.Category.ToLower()))
            {
                return BadRequest(new { message = "Category must be 'repair', 'maintenance', or 'inspection'" });
            }

            var service = new Service
            {
                ServiceName = request.ServiceName,
                Category = request.Category,
                Price = request.Price,
                Description = request.Description ?? ""
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetService), new { id = service.ServiceId }, service);
        }

        // PUT: api/Services/5
        [HttpPut("{id}")]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] ServiceRequest request)  // Changed method name and parameter type
        {
            if (string.IsNullOrEmpty(request.ServiceName))
            {
                return BadRequest(new { message = "Service name is required" });
            }

            if (request.Price <= 0)
            {
                return BadRequest(new { message = "Price must be greater than zero" });
            }

            if (!new[] { "repair", "maintenance", "inspection" }.Contains(request.Category.ToLower()))
            {
                return BadRequest(new { message = "Category must be 'repair', 'maintenance', or 'inspection'" });
            }

            var service = await _context.Services.FindAsync(id);
            if (service == null)
            {
                return NotFound(new { message = "Service not found" });
            }

            service.ServiceName = request.ServiceName;
            service.Category = request.Category;
            service.Price = request.Price;
            service.Description = request.Description ?? service.Description;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceExists(id))  // Changed method name
                {
                    return NotFound(new { message = "Service not found" });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = "Service updated successfully", service });
        }

        // DELETE: api/Services/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "super_admin,admin")]
        public async Task<IActionResult> DeleteService(int id)  // Changed method name
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null)
            {
                return NotFound(new { message = "Service not found" });
            }

            // Optional: Check if service is being used before allowing deletion
            var hasAppointments = await _context.Appointments.AnyAsync(a => a.ServiceId == id);
            if (hasAppointments)
            {
                return BadRequest(new { message = "Cannot delete service that is being used in appointments" });
            }

            _context.Services.Remove(service);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Service deleted successfully" });
        }

        // GET: api/Services/category/repair
        [HttpGet("category/{category}")]
        public async Task<ActionResult<IEnumerable<Service>>> GetServicesByCategory(string category)
        {
            if (!new[] { "repair", "maintenance", "inspection" }.Contains(category.ToLower()))
            {
                return BadRequest(new { message = "Invalid category" });
            }

            var services = await _context.Services
                .Where(s => s.Category.ToLower() == category.ToLower())
                .ToListAsync();

            return services;
        }

        private bool ServiceExists(int id)  // Changed method name
        {
            return _context.Services.Any(e => e.ServiceId == id);
        }
    }

    // DTO for Service creation/update
    public class ServiceRequest
    {
        public string ServiceName { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }
    }
}