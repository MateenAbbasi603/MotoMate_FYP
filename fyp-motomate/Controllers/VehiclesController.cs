// Controllers/VehiclesController.cs
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

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VehiclesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VehiclesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Vehicles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles()
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // If user is a customer, only return their vehicles
            if (userRole == "customer")
            {
                return await _context.Vehicles
                    .Where(v => v.UserId == userId)
                    .ToListAsync();
            }
            // If user is staff, return all vehicles
            else
            {
                return await _context.Vehicles
                    .Include(v => v.User)
                    .ToListAsync();
            }
        }

        // GET: api/Vehicles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetVehicle(int id)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            Vehicle vehicle = await _context.Vehicles
                .Include(v => v.User)
                .FirstOrDefaultAsync(v => v.VehicleId == id);

            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found" });
            }

            // If customer is trying to view a vehicle that doesn't belong to them
            if (userRole == "customer" && vehicle.UserId != userId)
            {
                return Forbid();
            }

            return vehicle;
        }

        // POST: api/Vehicles
        [HttpPost]
        public async Task<ActionResult<Vehicle>> CreateVehicle(VehicleRequest request)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Check if license plate already exists
            if (await _context.Vehicles.AnyAsync(v => v.LicensePlate.ToLower() == request.LicensePlate.ToLower()))
            {
                return BadRequest(new { message = "Vehicle with this license plate already exists" });
            }

            // Create vehicle object
            var vehicle = new Vehicle
            {
                Make = request.Make,
                Model = request.Model,
                Year = request.Year,
                LicensePlate = request.LicensePlate,
                CreatedAt =DateTime.Now,
                UpdatedAt =DateTime.Now
            };

            // If customer is creating a vehicle, set the UserId to their own ID
            if (userRole == "customer")
            {
                vehicle.UserId = userId;
            }
            // If staff is creating a vehicle for a customer, verify the customer exists
            else
            {
                if (request.UserId.HasValue)
                {
                    bool userExists = await _context.Users.AnyAsync(u => u.UserId == request.UserId.Value);
                    if (!userExists)
                    {
                        return BadRequest(new { message = "Specified user not found" });
                    }
                    vehicle.UserId = request.UserId.Value;
                }
                else
                {
                    return BadRequest(new { message = "User ID is required when staff creates a vehicle" });
                }
            }

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.VehicleId }, vehicle);
        }

        // PUT: api/Vehicles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVehicle(int id, VehicleRequest request)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found" });
            }

            // If customer is trying to update a vehicle that doesn't belong to them
            if (userRole == "customer" && vehicle.UserId != userId)
            {
                return Forbid();
            }

            // Check if license plate is being changed and if it's already taken
            if (vehicle.LicensePlate != request.LicensePlate && 
                await _context.Vehicles.AnyAsync(v => v.LicensePlate.ToLower() == request.LicensePlate.ToLower() && v.VehicleId != id))
            {
                return BadRequest(new { message = "Vehicle with this license plate already exists" });
            }

            // Update vehicle properties
            vehicle.Make = request.Make;
            vehicle.Model = request.Model;
            vehicle.Year = request.Year;
            vehicle.LicensePlate = request.LicensePlate;
            vehicle.UpdatedAt =DateTime.Now;

            // If staff is updating the owner of the vehicle
            if (userRole != "customer" && request.UserId.HasValue && vehicle.UserId != request.UserId.Value)
            {
                bool userExists = await _context.Users.AnyAsync(u => u.UserId == request.UserId.Value);
                if (!userExists)
                {
                    return BadRequest(new { message = "Specified user not found" });
                }
                vehicle.UserId = request.UserId.Value;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VehicleExists(id))
                {
                    return NotFound(new { message = "Vehicle not found" });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = "Vehicle updated successfully", vehicle });
        }

        // DELETE: api/Vehicles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            string userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found" });
            }

            // If customer is trying to delete a vehicle that doesn't belong to them
            if (userRole == "customer" && vehicle.UserId != userId)
            {
                return Forbid();
            }

            // Check if vehicle has any appointments or orders
            bool hasAppointments = await _context.Appointments.AnyAsync(a => a.VehicleId == id);
            bool hasOrders = await _context.Orders.AnyAsync(o => o.VehicleId == id);

            if (hasAppointments || hasOrders)
            {
                return BadRequest(new { 
                    message = "Cannot delete vehicle with existing appointments or orders" 
                });
            }

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Vehicle deleted successfully" });
        }

        private bool VehicleExists(int id)
        {
            return _context.Vehicles.Any(e => e.VehicleId == id);
        }
    }

    public class VehicleRequest
    {
        public int? UserId { get; set; } // Optional, used when staff creates vehicle for customer
        
        public string Make { get; set; }
        
        public string Model { get; set; }
        
        public int Year { get; set; }
        
        public string LicensePlate { get; set; }
    }
}