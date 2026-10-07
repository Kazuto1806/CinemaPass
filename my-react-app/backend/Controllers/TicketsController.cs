using System.Text.RegularExpressions;
using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    public class BookingRequest
    {
        public int UserId { get; set; }

        public int MovieId { get; set; }

        public int ShowtimeId { get; set; }

        public List<string> SeatCodes { get; set; } = new();

        public decimal TicketPrice { get; set; }

        public int? TicketTypeId { get; set; }
    }

    public class PaymentRequest
    {
        public string PaymentStatus { get; set; } = string.Empty;

        public string? PaymentMethod { get; set; }

        public string? PaymentTransactionId { get; set; }
    }

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
        // POST: api/tickets/book
        // Đặt vé nhiều ghế theo suất chiếu
        // =====================================================

        [HttpPost("book")]
        public async Task<IActionResult> BookTickets(
            [FromBody] BookingRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu đặt vé không hợp lệ."
                });
            }

            if (request.UserId <= 0)
            {
                return BadRequest(new
                {
                    message = "User chưa đăng nhập hoặc không hợp lệ."
                });
            }

            if (request.MovieId <= 0)
            {
                return BadRequest(new
                {
                    message = "Phim không hợp lệ."
                });
            }

            if (request.ShowtimeId <= 0)
            {
                return BadRequest(new
                {
                    message = "Suất chiếu không hợp lệ."
                });
            }

            if (request.SeatCodes == null ||
                request.SeatCodes.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Vui lòng chọn ít nhất một ghế."
                });
            }

            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == request.UserId);

            if (!userExists)
            {
                return BadRequest(new
                {
                    message = "User không tồn tại."
                });
            }

            var movieExists = await _context.Movies
                .AnyAsync(m => m.MovieId == request.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại."
                });
            }

            var showtime = await _context.Showtimes
                .Include(s => s.Room)
                .FirstOrDefaultAsync(
                    s => s.ShowtimeId == request.ShowtimeId
                );

            if (showtime == null)
            {
                return BadRequest(new
                {
                    message = "Suất chiếu không tồn tại."
                });
            }

            // =================================================
            // Kiểm tra loại vé
            // =================================================

            TicketType? ticketType = null;

            if (request.TicketTypeId.HasValue)
            {
                ticketType = await _context.TicketTypes
                    .FirstOrDefaultAsync(
                        t => t.TicketTypeId ==
                             request.TicketTypeId.Value
                    );

                if (ticketType == null)
                {
                    return BadRequest(new
                    {
                        message = "Loại vé không tồn tại."
                    });
                }

                if (!string.Equals(
                        ticketType.Status,
                        "Active",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message = "Loại vé hiện không hoạt động."
                    });
                }
            }

            var normalizedSeatCodes = request.SeatCodes
                .Select(code => code?.Trim())
                .Where(code =>
                    !string.IsNullOrWhiteSpace(code))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(code =>
                    code!.ToUpperInvariant())
                .ToList();

            if (normalizedSeatCodes.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Không có ghế hợp lệ để đặt."
                });
            }

            // =================================================
            // Giá vé
            // Nếu có TicketType thì lấy giá từ TicketType.
            // Nếu không thì lấy giá từ request/showtime.
            // =================================================

            decimal finalTicketPrice;

            if (ticketType != null)
            {
                finalTicketPrice = ticketType.Price;
            }
            else
            {
                finalTicketPrice =
                    request.TicketPrice > 0
                        ? request.TicketPrice
                        : showtime.TicketPrice;
            }

            var createdTickets = new List<object>();

            foreach (var seatCode in normalizedSeatCodes)
            {
                var match = Regex.Match(
                    seatCode,
                    @"^([A-Za-z]+)(\d+)$"
                );

                if (!match.Success)
                {
                    return BadRequest(new
                    {
                        message =
                            $"Ghế {seatCode} không hợp lệ."
                    });
                }

                var rowName =
                    match.Groups[1].Value.ToUpperInvariant();

                var seatNumber =
                    int.Parse(match.Groups[2].Value);

                var seat = await _context.Seats
                    .FirstOrDefaultAsync(s =>
                        s.RoomId == showtime.RoomId &&
                        s.SeatCode == seatCode);

                if (seat == null)
                {
                    seat = new Seat
                    {
                        RoomId = showtime.RoomId,
                        SeatCode = seatCode,
                        RowName = rowName,
                        SeatNumber = seatNumber,
                        SeatType = "Normal"
                    };

                    _context.Seats.Add(seat);
                    await _context.SaveChangesAsync();
                }

                var duplicateSeat = await _context.Tickets
                    .AnyAsync(t =>
                        t.ShowtimeId == request.ShowtimeId &&
                        t.SeatId == seat.SeatId &&
                        t.Status != "Đã hủy");

                if (duplicateSeat)
                {
                    return BadRequest(new
                    {
                        message =
                            $"Ghế {seatCode} đã được đặt cho suất chiếu này."
                    });
                }

                var ticket = new Ticket
                {
                    UserId = request.UserId,
                    MovieId = request.MovieId,
                    ShowtimeId = request.ShowtimeId,
                    SeatId = seat.SeatId,
                    TicketTypeId =
                        ticketType?.TicketTypeId,

                    TicketPrice = finalTicketPrice,

                    Status = "Đã đặt",

                    PaymentStatus = "Chưa thanh toán",

                    PaymentMethod = null,

                    PaymentTransactionId = null,

                    CreatedAt = DateTime.Now
                };

                _context.Tickets.Add(ticket);
                await _context.SaveChangesAsync();

                createdTickets.Add(new
                {
                    ticketId = ticket.TicketId,
                    seatCode = seat.SeatCode,
                    ticketTypeId = ticket.TicketTypeId,
                    ticketTypeName =
                        ticketType?.Name ?? "",
                    price = ticket.TicketPrice,
                    paymentStatus =
                        ticket.PaymentStatus
                });
            }

            return Ok(new
            {
                message = "Đặt vé thành công",
                bookedSeats = normalizedSeatCodes,
                tickets = createdTickets,
                showtimeId = request.ShowtimeId,
                ticketTypeId =
                    ticketType?.TicketTypeId,
                ticketTypeName =
                    ticketType?.Name ?? "",
                ticketPrice = finalTicketPrice,
                paymentStatus = "Chưa thanh toán"
            });
        }

        // =====================================================
        // GET: api/tickets
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetTickets()
        {
            var tickets = await _context.Tickets
                .AsNoTracking()
                .Include(t => t.User)
                .Include(t => t.Movie)
                .Include(t => t.Seat)
                .Include(t => t.TicketType)
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

                    userEmail = t.User != null
                        ? t.User.Email
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

                    cinemaId =
                        t.Showtime != null &&
                        t.Showtime.Room != null
                            ? t.Showtime.Room.CinemaId
                            : 0,

                    cinemaName =
                        t.Showtime != null &&
                        t.Showtime.Room != null &&
                        t.Showtime.Room.Cinema != null
                            ? t.Showtime.Room.Cinema.Name
                            : "",

                    roomId = t.Showtime != null
                        ? t.Showtime.RoomId
                        : 0,

                    roomName =
                        t.Showtime != null &&
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

                    ticketTypeId = t.TicketTypeId,

                    ticketTypeName =
                        t.TicketType != null
                            ? t.TicketType.Name
                            : "",

                    ticketPrice = t.TicketPrice,

                    status = t.Status,

                    paymentStatus =
                        t.PaymentStatus,

                    paymentMethod =
                        t.PaymentMethod,

                    paymentTransactionId =
                        t.PaymentTransactionId,

                    createdAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(tickets);
        }

        // =====================================================
        // GET: api/tickets/5
        // =====================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTicket(int id)
        {
            var ticket = await _context.Tickets
                .AsNoTracking()
                .Include(t => t.User)
                .Include(t => t.Movie)
                .Include(t => t.Seat)
                .Include(t => t.TicketType)
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

                    userEmail = t.User != null
                        ? t.User.Email
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

                    cinemaId =
                        t.Showtime != null &&
                        t.Showtime.Room != null
                            ? t.Showtime.Room.CinemaId
                            : 0,

                    cinemaName =
                        t.Showtime != null &&
                        t.Showtime.Room != null &&
                        t.Showtime.Room.Cinema != null
                            ? t.Showtime.Room.Cinema.Name
                            : "",

                    roomId = t.Showtime != null
                        ? t.Showtime.RoomId
                        : 0,

                    roomName =
                        t.Showtime != null &&
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

                    ticketTypeId = t.TicketTypeId,

                    ticketTypeName =
                        t.TicketType != null
                            ? t.TicketType.Name
                            : "",

                    ticketPrice = t.TicketPrice,

                    status = t.Status,

                    paymentStatus =
                        t.PaymentStatus,

                    paymentMethod =
                        t.PaymentMethod,

                    paymentTransactionId =
                        t.PaymentTransactionId,

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
        // PUT: api/tickets/5/payment
        // Cập nhật thanh toán
        // =====================================================

        [HttpPut("{id:int}/payment")]
        public async Task<IActionResult> UpdatePayment(
            int id,
            [FromBody] PaymentRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Dữ liệu thanh toán không hợp lệ."
                });
            }

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(
                    t => t.TicketId == id
                );

            if (ticket == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy vé."
                });
            }

            var allowedStatuses = new[]
            {
                "Chưa thanh toán",
                "Đã thanh toán",
                "Thanh toán thất bại",
                "Đã hoàn tiền"
            };

            var paymentStatus =
                request.PaymentStatus?.Trim();

            if (string.IsNullOrWhiteSpace(paymentStatus))
            {
                return BadRequest(new
                {
                    message =
                        "PaymentStatus không được để trống."
                });
            }

            if (!allowedStatuses.Contains(paymentStatus))
            {
                return BadRequest(new
                {
                    message =
                        "PaymentStatus không hợp lệ. " +
                        "Chỉ được dùng: Chưa thanh toán, " +
                        "Đã thanh toán, Thanh toán thất bại, " +
                        "Đã hoàn tiền."
                });
            }

            if (paymentStatus == "Đã thanh toán" &&
                string.IsNullOrWhiteSpace(
                    request.PaymentMethod))
            {
                return BadRequest(new
                {
                    message =
                        "Vui lòng cung cấp phương thức thanh toán."
                });
            }

            ticket.PaymentStatus = paymentStatus;

            ticket.PaymentMethod =
                string.IsNullOrWhiteSpace(
                    request.PaymentMethod)
                    ? null
                    : request.PaymentMethod.Trim();

            ticket.PaymentTransactionId =
                string.IsNullOrWhiteSpace(
                    request.PaymentTransactionId)
                    ? null
                    : request.PaymentTransactionId.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Cập nhật thanh toán thành công.",

                ticketId = ticket.TicketId,

                paymentStatus =
                    ticket.PaymentStatus,

                paymentMethod =
                    ticket.PaymentMethod,

                paymentTransactionId =
                    ticket.PaymentTransactionId
            });
        }

        // =====================================================
        // POST: api/tickets
        // =====================================================

        [HttpPost]
        public async Task<IActionResult> CreateTicket(
            [FromBody] Ticket ticket)
        {
            if (ticket == null)
            {
                return BadRequest(new
                {
                    message =
                        "Dữ liệu vé không hợp lệ."
                });
            }

            var userExists = await _context.Users
                .AnyAsync(
                    u => u.UserId == ticket.UserId
                );

            if (!userExists)
            {
                return BadRequest(new
                {
                    message = "User không tồn tại"
                });
            }

            var movieExists = await _context.Movies
                .AnyAsync(
                    m => m.MovieId == ticket.MovieId
                );

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại"
                });
            }

            var showtime = await _context.Showtimes
                .FirstOrDefaultAsync(
                    s => s.ShowtimeId ==
                         ticket.ShowtimeId
                );

            if (showtime == null)
            {
                return BadRequest(new
                {
                    message =
                        "Suất chiếu không tồn tại"
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
                        "Ghế không thuộc phòng chiếu của suất này"
                });
            }

            var seatBooked = await _context.Tickets
                .AnyAsync(t =>
                    t.ShowtimeId ==
                        ticket.ShowtimeId &&
                    t.SeatId ==
                        ticket.SeatId &&
                    t.Status != "Đã hủy"
                );

            if (seatBooked)
            {
                return BadRequest(new
                {
                    message =
                        "Ghế này đã được đặt"
                });
            }

            // Kiểm tra loại vé nếu có
            TicketType? ticketType = null;

            if (ticket.TicketTypeId.HasValue)
            {
                ticketType =
                    await _context.TicketTypes
                        .FirstOrDefaultAsync(
                            t => t.TicketTypeId ==
                                 ticket.TicketTypeId.Value
                        );

                if (ticketType == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Loại vé không tồn tại."
                    });
                }

                if (!string.Equals(
                        ticketType.Status,
                        "Active",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message =
                            "Loại vé hiện không hoạt động."
                    });
                }

                ticket.TicketPrice =
                    ticketType.Price;
            }
            else if (ticket.TicketPrice <= 0)
            {
                ticket.TicketPrice =
                    showtime.TicketPrice;
            }

            ticket.CreatedAt = DateTime.Now;

            if (string.IsNullOrWhiteSpace(
                    ticket.Status))
            {
                ticket.Status = "Đã đặt";
            }

            if (string.IsNullOrWhiteSpace(
                    ticket.PaymentStatus))
            {
                ticket.PaymentStatus =
                    "Chưa thanh toán";
            }

            _context.Tickets.Add(ticket);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Đặt vé thành công",

                ticketId =
                    ticket.TicketId,

                paymentStatus =
                    ticket.PaymentStatus
            });
        }

        // =====================================================
        // PUT: api/tickets/5
        // =====================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTicket(
            int id,
            [FromBody] Ticket ticket)
        {
            var existingTicket =
                await _context.Tickets
                    .FirstOrDefaultAsync(
                        t => t.TicketId == id
                    );

            if (existingTicket == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy vé"
                });
            }

            var showtime =
                await _context.Showtimes
                    .FirstOrDefaultAsync(
                        s => s.ShowtimeId ==
                             ticket.ShowtimeId
                    );

            if (showtime == null)
            {
                return BadRequest(new
                {
                    message =
                        "Suất chiếu không tồn tại"
                });
            }

            var seat =
                await _context.Seats
                    .FirstOrDefaultAsync(
                        s => s.SeatId ==
                             ticket.SeatId
                    );

            if (seat == null)
            {
                return BadRequest(new
                {
                    message =
                        "Ghế không tồn tại"
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

            var duplicateSeat =
                await _context.Tickets
                    .AnyAsync(t =>
                        t.TicketId != id &&
                        t.ShowtimeId ==
                            ticket.ShowtimeId &&
                        t.SeatId ==
                            ticket.SeatId &&
                        t.Status != "Đã hủy"
                    );

            if (duplicateSeat)
            {
                return BadRequest(new
                {
                    message =
                        "Ghế này đã được đặt"
                });
            }

            existingTicket.UserId =
                ticket.UserId;

            existingTicket.MovieId =
                ticket.MovieId;

            existingTicket.ShowtimeId =
                ticket.ShowtimeId;

            existingTicket.SeatId =
                ticket.SeatId;

            existingTicket.TicketTypeId =
                ticket.TicketTypeId;

            if (ticket.TicketTypeId.HasValue)
            {
                var ticketType =
                    await _context.TicketTypes
                        .FirstOrDefaultAsync(
                            t => t.TicketTypeId ==
                                 ticket.TicketTypeId.Value
                        );

                if (ticketType == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Loại vé không tồn tại."
                    });
                }

                if (!string.Equals(
                        ticketType.Status,
                        "Active",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message =
                            "Loại vé hiện không hoạt động."
                    });
                }

                existingTicket.TicketPrice =
                    ticketType.Price;
            }
            else
            {
                existingTicket.TicketPrice =
                    ticket.TicketPrice > 0
                        ? ticket.TicketPrice
                        : showtime.TicketPrice;
            }

            existingTicket.Status =
                ticket.Status;

            existingTicket.PaymentStatus =
                string.IsNullOrWhiteSpace(
                    ticket.PaymentStatus)
                    ? existingTicket.PaymentStatus
                    : ticket.PaymentStatus;

            existingTicket.PaymentMethod =
                ticket.PaymentMethod;

            existingTicket.PaymentTransactionId =
                ticket.PaymentTransactionId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Cập nhật vé thành công"
            });
        }

        // =====================================================
        // DELETE: api/tickets/5
        // =====================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTicket(
            int id)
        {
            var ticket =
                await _context.Tickets
                    .FirstOrDefaultAsync(
                        t => t.TicketId == id
                    );

            if (ticket == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy vé"
                });
            }

            _context.Tickets.Remove(ticket);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Xóa vé thành công"
            });
        }
    }
}