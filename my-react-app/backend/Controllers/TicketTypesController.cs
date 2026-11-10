using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TicketTypesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/tickettypes
        [HttpGet]
        public async Task<IActionResult> GetTicketTypes()
        {
            var ticketTypes = await _context.TicketTypes
                .AsNoTracking()
                .OrderBy(t => t.TicketTypeId)
                .Select(t => new
                {
                    ticketTypeId = t.TicketTypeId,
                    name = t.Name,
                    description = t.Description,
                    category = t.Category,
                    price = t.Price,
                    status = t.Status,
                    createdAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(ticketTypes);
        }

        // GET: api/tickettypes/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTicketType(int id)
        {
            var ticketType = await _context.TicketTypes
                .AsNoTracking()
                .Where(t => t.TicketTypeId == id)
                .Select(t => new
                {
                    ticketTypeId = t.TicketTypeId,
                    name = t.Name,
                    description = t.Description,
                    category = t.Category,
                    price = t.Price,
                    status = t.Status,
                    createdAt = t.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (ticketType == null)
            {
                return NotFound(new
                {
                    message = "Loại vé không tồn tại."
                });
            }

            return Ok(ticketType);
        }

        // POST: api/tickettypes
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateTicketType(
            [FromBody] TicketTypeWriteRequest ticketType)
        {
            if (ticketType == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu loại vé không hợp lệ."
                });
            }

            if (string.IsNullOrWhiteSpace(ticketType.Name))
            {
                return BadRequest(new
                {
                    message = "Tên loại vé không được để trống."
                });
            }

            if (ticketType.Price < 0)
            {
                return BadRequest(new
                {
                    message = "Giá vé không được nhỏ hơn 0."
                });
            }

            if (!IsValidCategory(ticketType.Category))
            {
                return BadRequest(new
                {
                    message = "Nhóm chính sách vé không hợp lệ."
                });
            }

            var duplicate = await _context.TicketTypes
                .AnyAsync(t =>
                    t.Name.ToLower() ==
                    ticketType.Name.Trim().ToLower());

            if (duplicate)
            {
                return Conflict(new
                {
                    message = "Loại vé này đã tồn tại."
                });
            }

            var newTicketType = new TicketType
            {
                Name = ticketType.Name.Trim(),
                Description = ticketType.Description?.Trim()
                    ?? string.Empty,
                Category = NormalizeCategory(ticketType.Category),
                Status =
                    string.IsNullOrWhiteSpace(ticketType.Status)
                        ? "Active"
                        : ticketType.Status.Trim(),
                Price = ticketType.Price,
                CreatedAt = DateTime.Now
            };

            _context.TicketTypes.Add(newTicketType);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetTicketType),
                new { id = newTicketType.TicketTypeId },
                new
                {
                    ticketTypeId = newTicketType.TicketTypeId,
                    name = newTicketType.Name,
                    description = newTicketType.Description,
                    category = newTicketType.Category,
                    price = newTicketType.Price,
                    status = newTicketType.Status,
                    createdAt = newTicketType.CreatedAt
                });
        }

        // PUT: api/tickettypes/1
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTicketType(
            int id,
            [FromBody] TicketTypeWriteRequest ticketType)
        {
            if (ticketType == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu loại vé không hợp lệ."
                });
            }

            var existingTicketType =
                await _context.TicketTypes
                    .FirstOrDefaultAsync(t =>
                        t.TicketTypeId == id);

            if (existingTicketType == null)
            {
                return NotFound(new
                {
                    message = "Loại vé không tồn tại."
                });
            }

            if (string.IsNullOrWhiteSpace(ticketType.Name))
            {
                return BadRequest(new
                {
                    message = "Tên loại vé không được để trống."
                });
            }

            if (ticketType.Price < 0)
            {
                return BadRequest(new
                {
                    message = "Giá vé không được nhỏ hơn 0."
                });
            }

            if (!IsValidCategory(ticketType.Category))
            {
                return BadRequest(new
                {
                    message = "Nhóm chính sách vé không hợp lệ."
                });
            }

            var duplicate = await _context.TicketTypes
                .AnyAsync(t =>
                    t.TicketTypeId != id &&
                    t.Name.ToLower() ==
                    ticketType.Name.Trim().ToLower());

            if (duplicate)
            {
                return Conflict(new
                {
                    message = "Loại vé này đã tồn tại."
                });
            }

            existingTicketType.Name =
                ticketType.Name.Trim();

            existingTicketType.Description =
                ticketType.Description?.Trim()
                ?? string.Empty;

            existingTicketType.Category =
                NormalizeCategory(ticketType.Category);

            existingTicketType.Price =
                ticketType.Price;

            existingTicketType.Status =
                string.IsNullOrWhiteSpace(ticketType.Status)
                    ? "Active"
                    : ticketType.Status.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật loại vé thành công.",
                ticketTypeId =
                    existingTicketType.TicketTypeId,
                name = existingTicketType.Name,
                description =
                    existingTicketType.Description,
                category = existingTicketType.Category,
                price = existingTicketType.Price,
                status = existingTicketType.Status,
                createdAt =
                    existingTicketType.CreatedAt
            });
        }

        private static bool IsValidCategory(string? category)
        {
            return string.IsNullOrWhiteSpace(category) ||
                category.Equals("Program", StringComparison.OrdinalIgnoreCase) ||
                category.Equals("Customer", StringComparison.OrdinalIgnoreCase);
        }

        private static string NormalizeCategory(string? category)
        {
            return string.Equals(category, "Program", StringComparison.OrdinalIgnoreCase)
                ? "Program"
                : "Customer";
        }

        // DELETE: api/tickettypes/1
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTicketType(int id)
        {
            var ticketType =
                await _context.TicketTypes
                    .FirstOrDefaultAsync(t =>
                        t.TicketTypeId == id);

            if (ticketType == null)
            {
                return NotFound(new
                {
                    message = "Loại vé không tồn tại."
                });
            }

            _context.TicketTypes.Remove(ticketType);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa loại vé thành công."
            });
        }

        public sealed class TicketTypeWriteRequest
        {
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; } = string.Empty;
            public string Category { get; set; } = "Customer";
            public decimal Price { get; set; }
            public string Status { get; set; } = "Active";
        }
    }
}