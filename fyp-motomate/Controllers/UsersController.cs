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
    // [Authorize(Roles = "super_admin,admin")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            // Get all users except customers
            var users = await _context.Users
                .Where(u => u.Role != "customer")
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.Name,
                    u.Phone,
                    u.Address,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetUser(int id)
        {
            var user = await _context.Users
                .Where(u => u.UserId == id && u.Role != "customer")
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.Name,
                    u.Phone,
                    u.Address,
                    u.CreatedAt,
                    u.UpdatedAt,
                    // Include additional details as needed
                    MechanicAppointments = u.Role == "mechanic" ? 
                        u.MechanicAppointments.Select(a => new {
                            a.AppointmentId,
                            a.AppointmentDate,
                            a.Status,
                            Vehicle = new {
                                a.Vehicle.Make,
                                a.Vehicle.Model,
                                a.Vehicle.Year
                            },
                            Service = new {
                                a.Service.ServiceName,
                                a.Service.Category
                            }
                        }) : null,
                    Performance = u.Role == "mechanic" ? 
                        u.MechanicPerformance != null ? new {
                            u.MechanicPerformance.TotalJobs,
                            u.MechanicPerformance.CompletedJobs,
                            u.MechanicPerformance.Rating
                        } : null : null
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = "User not found or is a customer" });
            }

            return Ok(user);
        }

        // GET: api/Users/Staff
        [HttpGet("Staff")]
        public async Task<ActionResult<IEnumerable<object>>> GetStaffUsers()
        {
            // Get users with specific staff roles
            var staffRoles = new[] { "mechanic", "service_agent", "finance_officer" };
            
            var users = await _context.Users
                .Where(u => staffRoles.Contains(u.Role))
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.Name,
                    u.Phone,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/Users/Admins
        [HttpGet("Admins")]
        public async Task<ActionResult<IEnumerable<object>>> GetAdminUsers()
        {
            // Get only admin users
            var adminRoles = new[] { "super_admin", "admin" };
            
            var users = await _context.Users
                .Where(u => adminRoles.Contains(u.Role))
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.Name,
                    u.Phone,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/Users/Mechanics
        [HttpGet("Mechanics")]
        public async Task<ActionResult<IEnumerable<object>>> GetMechanics()
        {
            // Get only mechanics with their performance data
            var mechanics = await _context.Users
                .Where(u => u.Role == "mechanic")
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.Name,
                    u.Phone,
                    Performance = u.MechanicPerformance != null ? new {
                        u.MechanicPerformance.TotalJobs,
                        u.MechanicPerformance.CompletedJobs,
                        u.MechanicPerformance.Rating
                    } : null
                })
                .ToListAsync();

            return Ok(mechanics);
        }
    }
}