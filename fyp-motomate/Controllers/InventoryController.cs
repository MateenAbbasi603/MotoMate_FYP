using fyp_motomate.Data;
using fyp_motomate.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace fyp_motomate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "super_admin,admin")]
    public class InventoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InventoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Inventory
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetInventory()
        {
            var inventoryItems = await _context.Inventory
                .Include(i => i.Instances)
                .ToListAsync();

            var result = inventoryItems.Select(item => new
            {
                item.ToolId,
                item.ToolName,
                item.ToolType,
                item.Condition,
                item.Price,
                item.PurchaseDate,
                item.VendorName,
                item.IsActive,
                TotalQuantity = item.Instances.Count,
                ActiveQuantity = item.Instances.Count(i => i.IsActive),
                InactiveQuantity = item.Instances.Count(i => !i.IsActive)
            });

            return Ok(result);
        }

        // GET: api/Inventory/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetInventory(int id)
        {
            var inventory = await _context.Inventory
                .Include(i => i.Instances)
                .FirstOrDefaultAsync(i => i.ToolId == id);

            if (inventory == null)
            {
                return NotFound(new { message = "Inventory item not found" });
            }

            var activeInstances = inventory.Instances.Count(i => i.IsActive);
            var inactiveInstances = inventory.Instances.Count - activeInstances;

            var result = new
            {
                inventory.ToolId,
                inventory.ToolName,
                inventory.ToolType,
                inventory.Condition,
                inventory.Price,
                inventory.PurchaseDate,
                inventory.VendorName,
                inventory.IsActive,
                TotalQuantity = inventory.Instances.Count,
                ActiveQuantity = activeInstances,
                InactiveQuantity = inactiveInstances,
                Instances = inventory.Instances.Select(instance => new
                {
                    instance.InstanceId,
                    instance.SerialNumber,
                    instance.IsActive,
                    instance.CreatedAt,
                    instance.LastUpdatedAt
                })
            };

            return Ok(result);
        }

        // POST: api/Inventory
        [HttpPost]
        public async Task<ActionResult<object>> CreateInventory([FromBody] InventoryRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var inventory = new Inventory
            {
                ToolName = request.ToolName,
                ToolType = request.ToolType,
                Quantity = request.Quantity, // Still store quantity for backward compatibility
                PurchaseDate = request.PurchaseDate,
                Condition = request.Condition,
                Price = request.Price,
                VendorName = request.VendorName,
                IsActive = true
            };

            _context.Inventory.Add(inventory);
            await _context.SaveChangesAsync();

            // Now create the individual tool instances
            for (int i = 0; i < request.Quantity; i++)
            {
                var instance = new ToolInstance
                {
                    ToolId = inventory.ToolId,
                    SerialNumber = $"{inventory.ToolId}-{DateTime.Now:yyyyMMdd}-{i+1:D4}",
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.ToolInstances.Add(instance);
            }

            await _context.SaveChangesAsync();

            // Refresh to get all instances
            inventory = await _context.Inventory
                .Include(i => i.Instances)
                .FirstOrDefaultAsync(i => i.ToolId == inventory.ToolId);

            var result = new
            {
                inventory.ToolId,
                inventory.ToolName,
                inventory.ToolType,
                inventory.Condition,
                inventory.Price,
                inventory.PurchaseDate,
                inventory.VendorName,
                inventory.IsActive,
                TotalQuantity = inventory.Instances.Count,
                ActiveQuantity = inventory.Instances.Count(i => i.IsActive),
                InactiveQuantity = inventory.Instances.Count(i => !i.IsActive),
                Instances = inventory.Instances.Select(instance => new
                {
                    instance.InstanceId,
                    instance.SerialNumber,
                    instance.IsActive,
                    instance.CreatedAt
                })
            };

            return CreatedAtAction(nameof(GetInventory), new { id = inventory.ToolId }, result);
        }

        // PUT: api/Inventory/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInventory(int id, [FromBody] InventoryUpdateRequest request)
        {
            if (id != request.ToolId)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var inventory = await _context.Inventory
                .Include(i => i.Instances)
                .FirstOrDefaultAsync(i => i.ToolId == id);

            if (inventory == null)
            {
                return NotFound(new { message = "Inventory item not found" });
            }

            // Update basic properties
            inventory.ToolName = request.ToolName;
            inventory.ToolType = request.ToolType;
            inventory.Condition = request.Condition;
            inventory.Price = request.Price;
            inventory.PurchaseDate = request.PurchaseDate;
            inventory.VendorName = request.VendorName;
            inventory.IsActive = request.IsActive;
            
            // Update quantity - this is tricky because we need to add/remove instances
            int currentInstanceCount = inventory.Instances.Count;
            
            // If quantity increased, add more instances
            if (request.Quantity > currentInstanceCount)
            {
                for (int i = 0; i < (request.Quantity - currentInstanceCount); i++)
                {
                    var instance = new ToolInstance
                    {
                        ToolId = inventory.ToolId,
                        SerialNumber = $"{inventory.ToolId}-{DateTime.Now:yyyyMMdd}-{currentInstanceCount+i+1:D4}",
                        IsActive = true,
                        CreatedAt = DateTime.Now
                    };

                    _context.ToolInstances.Add(instance);
                }
            }
            
            // Store the quantity for backward compatibility
            inventory.Quantity = request.Quantity;

            try
            {
                await _context.SaveChangesAsync();
                
                // Refresh data
                inventory = await _context.Inventory
                    .Include(i => i.Instances)
                    .FirstOrDefaultAsync(i => i.ToolId == id);
                
                var result = new
                {
                    inventory.ToolId,
                    inventory.ToolName,
                    inventory.ToolType,
                    inventory.Condition,
                    inventory.Price,
                    inventory.PurchaseDate,
                    inventory.VendorName,
                    inventory.IsActive,
                    TotalQuantity = inventory.Instances.Count,
                    ActiveQuantity = inventory.Instances.Count(i => i.IsActive),
                    InactiveQuantity = inventory.Instances.Count(i => !i.IsActive)
                };
                
                return Ok(new { message = "Inventory updated successfully", inventory = result });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InventoryExists(id))
                {
                    return NotFound(new { message = "Inventory item not found" });
                }
                else
                {
                    throw;
                }
            }
        }

        // PUT: api/Inventory/ToggleActive/5
        [HttpPut("ToggleActive/{id}")]
        public async Task<IActionResult> ToggleInventoryActive(int id)
        {
            var inventory = await _context.Inventory.FindAsync(id);
            
            if (inventory == null)
            {
                return NotFound(new { message = "Inventory item not found" });
            }
            
            // Toggle active status
            inventory.IsActive = !inventory.IsActive;
            
            await _context.SaveChangesAsync();
            
            return Ok(new { 
                message = $"Inventory item {(inventory.IsActive ? "activated" : "deactivated")} successfully", 
                isActive = inventory.IsActive 
            });
        }

        // PUT: api/Inventory/Instance/{id}
        [HttpPut("Instance/{id}")]
        public async Task<IActionResult> UpdateToolInstance(int id, [FromBody] ToolInstanceUpdateRequest request)
        {
            var instance = await _context.ToolInstances.FindAsync(id);
            
            if (instance == null)
            {
                return NotFound(new { message = "Tool instance not found" });
            }
            
            instance.IsActive = request.IsActive;
            instance.LastUpdatedAt = DateTime.Now;
            
            await _context.SaveChangesAsync();
            
            return Ok(new { 
                message = $"Tool instance {(instance.IsActive ? "activated" : "deactivated")} successfully", 
                instance 
            });
        }

        // DELETE: api/Inventory/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventory(int id)
        {
            var inventory = await _context.Inventory
                .Include(i => i.Instances)
                .FirstOrDefaultAsync(i => i.ToolId == id);
                
            if (inventory == null)
            {
                return NotFound(new { message = "Inventory item not found" });
            }

            // Instead of deleting, mark as inactive
            inventory.IsActive = false;
            
            // Mark all instances as inactive too
            foreach (var instance in inventory.Instances)
            {
                instance.IsActive = false;
                instance.LastUpdatedAt = DateTime.Now;
            }
            
            await _context.SaveChangesAsync();

            return Ok(new { message = "Inventory item and all instances marked as inactive" });
        }

        private bool InventoryExists(int id)
        {
            return _context.Inventory.Any(e => e.ToolId == id);
        }
    }

    public class InventoryRequest
    {
        [Required]
        public string ToolName { get; set; }
        
        [Required]
        public string ToolType { get; set; }
        
        [Required]
        public int Quantity { get; set; }
        
        public DateTime? PurchaseDate { get; set; }
        
        [Required]
        public string Condition { get; set; }
        
        [Required]
        public decimal Price { get; set; }
        
        public string VendorName { get; set; }
    }

    public class InventoryUpdateRequest
    {
        public int ToolId { get; set; }
        public string ToolName { get; set; }
        public string ToolType { get; set; }
        public int Quantity { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public string Condition { get; set; }
        public decimal Price { get; set; }
        public string VendorName { get; set; }
        public bool IsActive { get; set; }
    }

    public class ToolInstanceUpdateRequest
    {
        public bool IsActive { get; set; }
    }
}