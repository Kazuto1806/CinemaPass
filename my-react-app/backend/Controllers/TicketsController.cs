using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/tickets")]
    public class TicketsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TicketsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/tickets
        [HttpGet]
        public async Task<IActionResult> GetTickets()
        {
            var tickets = await _context.Tickets
                .AsNoTracking()
                .Include(t => t.User)
                .Include(t => t.Movie)
                .Select(t => new
                {
                    t.TicketId,
                    t.UserId,
                    UserName = t.User != null
                        ? t.User.FullName
                        : "Không xác định",

                    t.MovieId,
                    MovieTitle = t.Movie != null
                        ? t.Movie.Title
                        : "Không xác định",

                    t.SeatNumber,
                    t.Showtime,
                    t.TicketPrice,
                    t.Status,
                    t.CreatedAt
                })
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(tickets);
        }

        // GET: api/tickets/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTicket(int id)
        {
            var ticket = await _context.Tickets
                .AsNoTracking()
                .Include(t => t.User)
                .Include(t => t.Movie)
                .Where(t => t.TicketId == id)
                .Select(t => new
                {
                    t.TicketId,
                    t.UserId,
                    UserName = t.User != null
                        ? t.User.FullName
                        : "Không xác định",

                    t.MovieId,
                    MovieTitle = t.Movie != null
                        ? t.Movie.Title
                        : "Không xác định",

                    t.SeatNumber,
                    t.Showtime,
                    t.TicketPrice,
                    t.Status,
                    t.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (ticket == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy vé"
                });
            }

            return Ok(ticket);
        }

        // POST: api/tickets
        [HttpPost]
        public async Task<IActionResult> CreateTicket(Ticket ticket)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == ticket.UserId);

            if (!userExists)
            {
                return BadRequest(new
                {
                    message = "Người dùng không tồn tại"
                });
            }

            var movieExists = await _context.Movies
                .AnyAsync(m => m.MovieId == ticket.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại"
                });
            }

            ticket.TicketId = 0;
            ticket.CreatedAt = DateTime.Now;

            if (string.IsNullOrWhiteSpace(ticket.Status))
            {
                ticket.Status = "Đã đặt";
            }

            _context.Tickets.Add(ticket);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo vé thành công",
                ticketId = ticket.TicketId
            });
        }

        // PUT: api/tickets/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTicket(
            int id,
            Ticket updatedTicket)
        {
            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.TicketId == id);

            if (ticket == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy vé"
                });
            }

            ticket.UserId = updatedTicket.UserId;
            ticket.MovieId = updatedTicket.MovieId;
            ticket.SeatNumber = updatedTicket.SeatNumber;
            ticket.Showtime = updatedTicket.Showtime;
            ticket.TicketPrice = updatedTicket.TicketPrice;
            ticket.Status = updatedTicket.Status;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật vé thành công"
            });
        }

        // DELETE: api/tickets/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTicket(int id)
        {
            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.TicketId == id);

            if (ticket == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy vé"
                });
            }

            _context.Tickets.Remove(ticket);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa vé thành công"
            });
        }
    }
}