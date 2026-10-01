using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TicketsController(AppDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET: api/tickets
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetTickets()
        {
            var tickets = await _context.Tickets
                .Include(t => t.User)
                .Include(t => t.Movie)
                .Include(t => t.Seat)
                .Include(t => t.Showtime)
                    .ThenInclude(st => st.Room)
                        .ThenInclude(r => r!.Cinema)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    ticketId = t.TicketId,

                    userId = t.UserId,
                    userName = t.User != null
                        ? t.User.FullName
                        : "",

                    movieId = t.MovieId,
                    movieTitle = t.Movie != null
                        ? t.Movie.Title
                        : "",

                    showtimeId = t.ShowtimeId,

                    showDate = t.Showtime != null
                        ? t.Showtime.ShowDate
                        : DateTime.MinValue,

                    startTime = t.Showtime != null
                        ? t.Showtime.StartTime
                        : TimeSpan.Zero,

                    endTime = t.Showtime != null
                        ? t.Showtime.EndTime
                        : TimeSpan.Zero,

                    cinemaId = t.Showtime != null &&
                               t.Showtime.Room != null
                        ? t.Showtime.Room.CinemaId
                        : 0,

                    cinemaName = t.Showtime != null &&
                                 t.Showtime.Room != null &&
                                 t.Showtime.Room.Cinema != null
                        ? t.Showtime.Room.Cinema.Name
                        : "",

                    roomId = t.Showtime != null
                        ? t.Showtime.RoomId
                        : 0,

                    roomName = t.Showtime != null &&
                               t.Showtime.Room != null
                        ? t.Showtime.Room.RoomName
                        : "",

                    seatId = t.SeatId,

                    seatCode = t.Seat != null
                        ? t.Seat.SeatCode
                        : "",

                    rowName = t.Seat != null
                        ? t.Seat.RowName
                        : "",

                    seatNumber = t.Seat != null
                        ? t.Seat.SeatNumber
                        : 0,

                    ticketPrice = t.TicketPrice,

                    status = t.Status,

                    createdAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(tickets);
        }


        // =====================================================
        // GET: api/tickets/5
        // =====================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTicket(int id)
        {
            var ticket = await _context.Tickets
                .Include(t => t.User)
                .Include(t => t.Movie)
                .Include(t => t.Seat)
                .Include(t => t.Showtime)
                    .ThenInclude(st => st.Room)
                        .ThenInclude(r => r!.Cinema)
                .Where(t => t.TicketId == id)
                .Select(t => new
                {
                    ticketId = t.TicketId,

                    userId = t.UserId,
                    userName = t.User != null
                        ? t.User.FullName
                        : "",

                    movieId = t.MovieId,
                    movieTitle = t.Movie != null
                        ? t.Movie.Title
                        : "",

                    showtimeId = t.ShowtimeId,

                    showDate = t.Showtime != null
                        ? t.Showtime.ShowDate
                        : DateTime.MinValue,

                    startTime = t.Showtime != null
                        ? t.Showtime.StartTime
                        : TimeSpan.Zero,

                    endTime = t.Showtime != null
                        ? t.Showtime.EndTime
                        : TimeSpan.Zero,

                    cinemaId = t.Showtime != null &&
                               t.Showtime.Room != null
                        ? t.Showtime.Room.CinemaId
                        : 0,

                    cinemaName = t.Showtime != null &&
                                 t.Showtime.Room != null &&
                                 t.Showtime.Room.Cinema != null
                        ? t.Showtime.Room.Cinema.Name
                        : "",

                    roomId = t.Showtime != null
                        ? t.Showtime.RoomId
                        : 0,

                    roomName = t.Showtime != null &&
                               t.Showtime.Room != null
                        ? t.Showtime.Room.RoomName
                        : "",

                    seatId = t.SeatId,

                    seatCode = t.Seat != null
                        ? t.Seat.SeatCode
                        : "",

                    rowName = t.Seat != null
                        ? t.Seat.RowName
                        : "",

                    seatNumber = t.Seat != null
                        ? t.Seat.SeatNumber
                        : 0,

                    ticketPrice = t.TicketPrice,

                    status = t.Status,

                    createdAt = t.CreatedAt
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


        // =====================================================
        // POST: api/tickets
        // =====================================================

        [HttpPost]
        public async Task<IActionResult> CreateTicket([FromBody] Ticket ticket)
        {
            // Kiểm tra User
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == ticket.UserId);

            if (!userExists)
            {
                return BadRequest(new
                {
                    message = "User không tồn tại"
                });
            }


            // Kiểm tra Movie
            var movieExists = await _context.Movies
                .AnyAsync(m => m.MovieId == ticket.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại"
                });
            }


            // Kiểm tra Showtime
            var showtime = await _context.Showtimes
                .FirstOrDefaultAsync(
                    s => s.ShowtimeId == ticket.ShowtimeId
                );

            if (showtime == null)
            {
                return BadRequest(new
                {
                    message = "Suất chiếu không tồn tại"
                });
            }


            // Kiểm tra Seat
            var seat = await _context.Seats
                .FirstOrDefaultAsync(
                    s => s.SeatId == ticket.SeatId
                );

            if (seat == null)
            {
                return BadRequest(new
                {
                    message = "Ghế không tồn tại"
                });
            }


            // Đảm bảo ghế thuộc đúng phòng của suất chiếu
            if (seat.RoomId != showtime.RoomId)
            {
                return BadRequest(new
                {
                    message = "Ghế không thuộc phòng chiếu của suất này"
                });
            }


            // Kiểm tra ghế đã được đặt chưa
            var seatBooked = await _context.Tickets
                .AnyAsync(t =>
                    t.ShowtimeId == ticket.ShowtimeId &&
                    t.SeatId == ticket.SeatId &&
                    t.Status != "Đã hủy"
                );

            if (seatBooked)
            {
                return BadRequest(new
                {
                    message = "Ghế này đã được đặt"
                });
            }


            // Nếu không truyền giá thì lấy giá từ Showtimes
            if (ticket.TicketPrice <= 0)
            {
                ticket.TicketPrice = showtime.TicketPrice;
            }


            ticket.CreatedAt = DateTime.Now;

            if (string.IsNullOrWhiteSpace(ticket.Status))
            {
                ticket.Status = "Đã đặt";
            }


            _context.Tickets.Add(ticket);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đặt vé thành công",
                ticketId = ticket.TicketId
            });
        }


        // =====================================================
        // PUT: api/tickets/5
        // =====================================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTicket(
            int id,
            [FromBody] Ticket ticket
        )
        {
            var existingTicket = await _context.Tickets
                .FirstOrDefaultAsync(
                    t => t.TicketId == id
                );

            if (existingTicket == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy vé"
                });
            }


            var showtime = await _context.Showtimes
                .FirstOrDefaultAsync(
                    s => s.ShowtimeId == ticket.ShowtimeId
                );

            if (showtime == null)
            {
                return BadRequest(new
                {
                    message = "Suất chiếu không tồn tại"
                });
            }


            var seat = await _context.Seats
                .FirstOrDefaultAsync(
                    s => s.SeatId == ticket.SeatId
                );

            if (seat == null)
            {
                return BadRequest(new
                {
                    message = "Ghế không tồn tại"
                });
            }


            if (seat.RoomId != showtime.RoomId)
            {
                return BadRequest(new
                {
                    message =
                        "Ghế không thuộc phòng của suất chiếu"
                });
            }


            var duplicateSeat = await _context.Tickets
                .AnyAsync(t =>
                    t.TicketId != id &&
                    t.ShowtimeId == ticket.ShowtimeId &&
                    t.SeatId == ticket.SeatId &&
                    t.Status != "Đã hủy"
                );

            if (duplicateSeat)
            {
                return BadRequest(new
                {
                    message = "Ghế này đã được đặt"
                });
            }


            existingTicket.UserId = ticket.UserId;
            existingTicket.MovieId = ticket.MovieId;
            existingTicket.ShowtimeId = ticket.ShowtimeId;
            existingTicket.SeatId = ticket.SeatId;
            existingTicket.TicketPrice =
                ticket.TicketPrice > 0
                    ? ticket.TicketPrice
                    : showtime.TicketPrice;

            existingTicket.Status = ticket.Status;


            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật vé thành công"
            });
        }


        // =====================================================
        // DELETE: api/tickets/5
        // =====================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTicket(int id)
        {
            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(
                    t => t.TicketId == id
                );

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