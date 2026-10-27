using System.Data;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    // Một ghế có thể chọn một loại vé riêng.
    public class SeatTicketRequest
    {
        public string SeatCode { get; set; } = string.Empty;
        public int TicketTypeId { get; set; }
    }

    public class BookingRequest
    {
        public int UserId { get; set; }
        public int MovieId { get; set; }
        public int ShowtimeId { get; set; }

        public List<string> SeatCodes { get; set; } = new();

        // Danh sách loại vé theo từng ghế.
        public List<SeatTicketRequest> SeatTickets { get; set; } = new();

        // Giữ tương thích với cách đặt vé cũ: một loại vé cho tất cả ghế.
        public decimal TicketPrice { get; set; }
        public int? TicketTypeId { get; set; }

        public string HoldToken { get; set; } = string.Empty;
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
        // Đặt nhiều ghế, hỗ trợ nhiều loại vé trong một lần.
        // Tất cả ghế phải được giữ bởi đúng HoldToken.
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

            if (string.IsNullOrWhiteSpace(request.HoldToken))
            {
                return BadRequest(new
                {
                    message = "Thiếu mã giữ ghế. Vui lòng chọn lại ghế."
                });
            }

            var holdToken = request.HoldToken.Trim();

            if (holdToken.Length > 128)
            {
                return BadRequest(new
                {
                    message = "Mã giữ ghế không hợp lệ."
                });
            }

            // Chuẩn hóa mã ghế.
            var normalizedSeatCodes = request.SeatCodes
                .Where(code => !string.IsNullOrWhiteSpace(code))
                .Select(code => code.Trim().ToUpperInvariant())
                .ToList();

            if (normalizedSeatCodes.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Không có ghế hợp lệ để đặt."
                });
            }

            // Không cho phép gửi trùng ghế.
            if (normalizedSeatCodes.Distinct(
                    StringComparer.OrdinalIgnoreCase).Count()
                != normalizedSeatCodes.Count)
            {
                return BadRequest(new
                {
                    message = "Danh sách ghế có ghế bị trùng."
                });
            }

            foreach (var seatCode in normalizedSeatCodes)
            {
                if (!Regex.IsMatch(seatCode, @"^([A-Z]+)(\d+)$"))
                {
                    return BadRequest(new
                    {
                        message = $"Ghế {seatCode} không hợp lệ."
                    });
                }
            }

            // Kiểm tra tài khoản.
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == request.UserId);

            if (!userExists)
            {
                return BadRequest(new
                {
                    message = "User không tồn tại."
                });
            }

            // Kiểm tra phim.
            var movieExists = await _context.Movies
                .AnyAsync(m => m.MovieId == request.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại."
                });
            }

            // Kiểm tra suất chiếu.
            var showtime = await _context.Showtimes
                .Include(s => s.Room)
                .FirstOrDefaultAsync(
                    s => s.ShowtimeId == request.ShowtimeId);

            if (showtime == null)
            {
                return BadRequest(new
                {
                    message = "Suất chiếu không tồn tại."
                });
            }

            if (showtime.MovieId != request.MovieId)
            {
                return BadRequest(new
                {
                    message = "Phim không khớp với suất chiếu đã chọn."
                });
            }

            // Tạo danh sách loại vé theo ghế.
            // Nếu frontend gửi SeatTickets thì dùng loại vé riêng.
            // Nếu không gửi thì dùng TicketTypeId cũ cho tất cả ghế.
            var ticketTypeBySeat =
                new Dictionary<string, int>(
                    StringComparer.OrdinalIgnoreCase);

            if (request.SeatTickets != null &&
                request.SeatTickets.Count > 0)
            {
                foreach (var item in request.SeatTickets)
                {
                    if (item == null ||
                        string.IsNullOrWhiteSpace(item.SeatCode))
                    {
                        return BadRequest(new
                        {
                            message = "Thông tin loại vé theo ghế không hợp lệ."
                        });
                    }

                    var seatCode = item.SeatCode
                        .Trim()
                        .ToUpperInvariant();

                    if (!normalizedSeatCodes.Contains(
                            seatCode,
                            StringComparer.OrdinalIgnoreCase))
                    {
                        return BadRequest(new
                        {
                            message =
                                $"Ghế {seatCode} không nằm trong danh sách ghế đã chọn."
                        });
                    }

                    if (item.TicketTypeId <= 0)
                    {
                        return BadRequest(new
                        {
                            message =
                                $"Loại vé của ghế {seatCode} không hợp lệ."
                        });
                    }

                    if (ticketTypeBySeat.ContainsKey(seatCode))
                    {
                        return BadRequest(new
                        {
                            message =
                                $"Ghế {seatCode} có thông tin loại vé bị trùng."
                        });
                    }

                    ticketTypeBySeat[seatCode] = item.TicketTypeId;
                }

                // Mỗi ghế được chọn phải có đúng một loại vé.
                foreach (var seatCode in normalizedSeatCodes)
                {
                    if (!ticketTypeBySeat.ContainsKey(seatCode))
                    {
                        return BadRequest(new
                        {
                            message =
                                $"Vui lòng chọn loại vé cho ghế {seatCode}."
                        });
                    }
                }

                if (ticketTypeBySeat.Count != normalizedSeatCodes.Count)
                {
                    return BadRequest(new
                    {
                        message =
                            "Số lượng loại vé không khớp với số ghế đã chọn."
                    });
                }
            }
            else
            {
                // Tương thích với frontend cũ.
                if (!request.TicketTypeId.HasValue ||
                    request.TicketTypeId.Value <= 0)
                {
                    return BadRequest(new
                    {
                        message = "Vui lòng chọn chính sách vé của suất chiếu."
                    });
                }

                foreach (var seatCode in normalizedSeatCodes)
                {
                    ticketTypeBySeat[seatCode] =
                        request.TicketTypeId.Value;
                }
            }

            // Lấy toàn bộ loại vé được sử dụng.
            var requestedTicketTypeIds = ticketTypeBySeat.Values
                .Distinct()
                .ToList();

            var ticketTypes = await _context.TicketTypes
                .AsNoTracking()
                .Where(t => requestedTicketTypeIds.Contains(t.TicketTypeId))
                .ToListAsync();

            if (ticketTypes.Count != requestedTicketTypeIds.Count)
            {
                return BadRequest(new
                {
                    message = "Một hoặc nhiều loại vé không tồn tại."
                });
            }

            foreach (var ticketType in ticketTypes)
            {
                if (!string.Equals(
                    ticketType.Status,
                    "Active",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message =
                            $"Loại vé {ticketType.Name} hiện không hoạt động."
                    });
                }
            }

            var ticketTypeLookup = ticketTypes.ToDictionary(
                t => t.TicketTypeId);

            // Lấy giá áp dụng cho suất chiếu và từng loại vé.
            var showtimeTicketPrices =
                await _context.ShowtimeTicketTypes
                    .AsNoTracking()
                    .Where(x =>
                        x.ShowtimeId == request.ShowtimeId &&
                        requestedTicketTypeIds.Contains(x.TicketTypeId))
                    .ToListAsync();

            var priceByTicketType = showtimeTicketPrices
                .GroupBy(x => x.TicketTypeId)
                .ToDictionary(
                    group => group.Key,
                    group => group.First().Price);

            foreach (var ticketTypeId in requestedTicketTypeIds)
            {
                if (!priceByTicketType.ContainsKey(ticketTypeId))
                {
                    var ticketTypeName =
                        ticketTypeLookup[ticketTypeId].Name ?? "";

                    return BadRequest(new
                    {
                        message =
                            $"Loại vé {ticketTypeName} không áp dụng cho suất chiếu đã chọn."
                    });
                }
            }

            // Kiểm tra và tạo vé trong cùng một transaction.
            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                var nowUtc = DateTime.UtcNow;
                var selectedSeats = new List<Seat>();

                // Kiểm tra tất cả ghế trước khi tạo bất kỳ vé nào.
                foreach (var seatCode in normalizedSeatCodes)
                {
                    var seat = await _context.Seats
                        .FirstOrDefaultAsync(s =>
                            s.RoomId == showtime.RoomId &&
                            s.SeatCode == seatCode);

                    if (seat == null)
                    {
                        await transaction.RollbackAsync();

                        return BadRequest(new
                        {
                            message =
                                $"Ghế {seatCode} không tồn tại trong phòng chiếu."
                        });
                    }

                    // Ghế phải được giữ bởi đúng phiên đặt vé.
                    var activeHold = await _context.SeatHolds
                        .FirstOrDefaultAsync(h =>
                            h.ShowtimeId == request.ShowtimeId &&
                            h.SeatId == seat.SeatId &&
                            h.HoldToken == holdToken &&
                            h.ExpiresAtUtc > nowUtc);

                    if (activeHold == null)
                    {
                        await transaction.RollbackAsync();

                        return Conflict(new
                        {
                            message =
                                $"Bạn không còn giữ ghế {seatCode}, hoặc ghế đã hết thời gian giữ. Vui lòng chọn lại."
                        });
                    }

                    // Ghế chưa được đặt bởi vé khác.
                    var alreadyBooked = await _context.Tickets
                        .AnyAsync(t =>
                            t.ShowtimeId == request.ShowtimeId &&
                            t.SeatId == seat.SeatId &&
                            t.Status != "Đã hủy");

                    if (alreadyBooked)
                    {
                        await transaction.RollbackAsync();

                        return Conflict(new
                        {
                            message =
                                $"Ghế {seatCode} đã được đặt cho suất chiếu này."
                        });
                    }

                    selectedSeats.Add(seat);
                }

                var createdTickets = new List<Ticket>();

                // Tạo vé với loại vé và giá tương ứng từng ghế.
                foreach (var seat in selectedSeats)
                {
                    var seatCode = seat.SeatCode.Trim().ToUpperInvariant();

                    var selectedTicketTypeId =
                        ticketTypeBySeat[seatCode];

                    var selectedTicketType =
                        ticketTypeLookup[selectedTicketTypeId];

                    var finalTicketPrice =
                        priceByTicketType[selectedTicketTypeId];

                    var ticket = new Ticket
                    {
                          QrCodeToken = Convert.ToHexString(
                              RandomNumberGenerator.GetBytes(32)
                                ).ToLowerInvariant(),
                        UserId = request.UserId,
                        MovieId = request.MovieId,
                        ShowtimeId = request.ShowtimeId,
                        SeatId = seat.SeatId,
                        TicketTypeId = selectedTicketType.TicketTypeId,
                        TicketPrice = finalTicketPrice,
                        Status = "Đã đặt",
                        PaymentStatus = "Chưa thanh toán",
                        PaymentMethod = null,
                        PaymentTransactionId = null,
                        CreatedAt = DateTime.Now
                    };

                    _context.Tickets.Add(ticket);
                    createdTickets.Add(ticket);
                }

                // Chỉ xóa lượt giữ của phiên hiện tại cho các ghế đã đặt.
                var selectedSeatIds = selectedSeats
                    .Select(s => s.SeatId)
                    .ToList();

                var holdsToRemove = await _context.SeatHolds
                    .Where(h =>
                        h.ShowtimeId == request.ShowtimeId &&
                        h.HoldToken == holdToken &&
                        selectedSeatIds.Contains(h.SeatId))
                    .ToListAsync();

                _context.SeatHolds.RemoveRange(holdsToRemove);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Trả về thông tin thực tế của từng vé vừa tạo.
                var createdTicketResults = createdTickets
                    .Select(ticket =>
                    {
                        var seat = selectedSeats.First(
                            s => s.SeatId == ticket.SeatId);

                        var ticketType =
                            ticketTypeLookup[ticket.TicketTypeId!.Value];

                        return new
                        {
                            ticketId = ticket.TicketId,
                            qrCodeToken = ticket.QrCodeToken,
                            seatCode = seat.SeatCode,
                            ticketTypeId = ticket.TicketTypeId,
                            ticketTypeName = ticketType.Name ?? "",
                            price = ticket.TicketPrice,
                            paymentStatus = ticket.PaymentStatus
                        };
                    })
                    .ToList();

                var totalPrice = createdTickets.Sum(
                    t => t.TicketPrice);

                return Ok(new
                {
                    message = "Đặt vé thành công",
                    bookedSeats = normalizedSeatCodes,
                    tickets = createdTicketResults,
                    showtimeId = request.ShowtimeId,
                    totalTickets = createdTickets.Count,
                    totalPrice = totalPrice,
                    paymentStatus = "Chưa thanh toán"
                });
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync();

                return Conflict(new
                {
                    message =
                        "Không thể đặt ghế do dữ liệu vừa thay đổi. Vui lòng tải lại sơ đồ ghế và thử lại."
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =====================================================
        // GET: api/tickets
        // Lấy danh sách tất cả vé.
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
                    qrCodeToken = t.QrCodeToken,
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

                    ticketTypeName = t.TicketType != null
                        ? t.TicketType.Name
                        : "",

                    ticketPrice = t.TicketPrice,
                    status = t.Status,
                    paymentStatus = t.PaymentStatus,
                    paymentMethod = t.PaymentMethod,
                    paymentTransactionId = t.PaymentTransactionId,
                    createdAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(tickets);
        }

        // =====================================================
        // GET: api/tickets/user/1
        // Lịch sử vé của một tài khoản.
        // =====================================================

        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetTicketsByUser(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new
                {
                    message = "UserId không hợp lệ."
                });
            }

            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId);

            if (!userExists)
            {
                return NotFound(new
                {
                    message = "Người dùng không tồn tại."
                });
            }

            var tickets = await _context.Tickets
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    ticketId = t.TicketId,
                    userId = t.UserId,

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

                    cinemaName =
                        t.Showtime != null &&
                        t.Showtime.Room != null &&
                        t.Showtime.Room.Cinema != null
                            ? t.Showtime.Room.Cinema.Name
                            : "",

                    roomName =
                        t.Showtime != null &&
                        t.Showtime.Room != null
                            ? t.Showtime.Room.RoomName
                            : "",

                    seatCode = t.Seat != null
                        ? t.Seat.SeatCode
                        : "",

                    ticketTypeName = t.TicketType != null
                        ? t.TicketType.Name
                        : "",

                    ticketPrice = t.TicketPrice,
                    status = t.Status,
                    paymentStatus = t.PaymentStatus,
                    paymentMethod = t.PaymentMethod,
                    createdAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(tickets);
        }

        // =====================================================
        // GET: api/tickets/5
        // Lấy thông tin một vé.
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

                    ticketTypeName = t.TicketType != null
                        ? t.TicketType.Name
                        : "",

                    ticketPrice = t.TicketPrice,
                    status = t.Status,
                    paymentStatus = t.PaymentStatus,
                    paymentMethod = t.PaymentMethod,
                    paymentTransactionId = t.PaymentTransactionId,
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
        // Cập nhật trạng thái thanh toán.
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
                    message = "Dữ liệu thanh toán không hợp lệ."
                });
            }

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.TicketId == id);

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

            var paymentStatus = request.PaymentStatus?.Trim();

            if (string.IsNullOrWhiteSpace(paymentStatus))
            {
                return BadRequest(new
                {
                    message = "PaymentStatus không được để trống."
                });
            }

            if (!allowedStatuses.Contains(paymentStatus))
            {
                return BadRequest(new
                {
                    message =
                        "PaymentStatus không hợp lệ. Chỉ được dùng: " +
                        "Chưa thanh toán, Đã thanh toán, " +
                        "Thanh toán thất bại, Đã hoàn tiền."
                });
            }

            if (paymentStatus == "Đã thanh toán" &&
                string.IsNullOrWhiteSpace(request.PaymentMethod))
            {
                return BadRequest(new
                {
                    message = "Vui lòng cung cấp phương thức thanh toán."
                });
            }

            ticket.PaymentStatus = paymentStatus;

            ticket.PaymentMethod =
                string.IsNullOrWhiteSpace(request.PaymentMethod)
                    ? null
                    : request.PaymentMethod.Trim();

            ticket.PaymentTransactionId =
                string.IsNullOrWhiteSpace(request.PaymentTransactionId)
                    ? null
                    : request.PaymentTransactionId.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật thanh toán thành công.",
                ticketId = ticket.TicketId,
                paymentStatus = ticket.PaymentStatus,
                paymentMethod = ticket.PaymentMethod,
                paymentTransactionId = ticket.PaymentTransactionId
            });
        }

        // =====================================================
        // POST: api/tickets
        // Chặn tạo vé trực tiếp để tránh bỏ qua bước giữ ghế.
        // =====================================================

        [HttpPost]
        public IActionResult CreateTicket([FromBody] Ticket ticket)
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng đặt vé qua API api/tickets/book để xác minh mã giữ ghế."
            });
        }

        // =====================================================
        // PUT: api/tickets/5
        // Không cho đổi ghế hoặc suất chiếu bằng API cập nhật.
        // =====================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTicket(
            int id,
            [FromBody] Ticket ticket)
        {
            if (ticket == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu vé không hợp lệ."
                });
            }

            var existingTicket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.TicketId == id);

            if (existingTicket == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy vé"
                });
            }

            if (ticket.ShowtimeId != existingTicket.ShowtimeId ||
                ticket.SeatId != existingTicket.SeatId)
            {
                return BadRequest(new
                {
                    message =
                        "Không thể đổi ghế hoặc suất chiếu bằng API cập nhật vé. " +
                        "Vui lòng thực hiện quy trình đặt vé có giữ ghế."
                });
            }

            if (string.Equals(
                    existingTicket.Status,
                    "Đã hủy",
                    StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(
                    ticket.Status,
                    "Đã hủy",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new
                {
                    message =
                        "Vé đã hủy không thể khôi phục trực tiếp. " +
                        "Vui lòng đặt vé mới và giữ ghế trước."
                });
            }

            var showtime = await _context.Showtimes
                .FirstOrDefaultAsync(
                    s => s.ShowtimeId == ticket.ShowtimeId);

            if (showtime == null)
            {
                return BadRequest(new
                {
                    message = "Suất chiếu không tồn tại"
                });
            }

            var seat = await _context.Seats
                .FirstOrDefaultAsync(s => s.SeatId == ticket.SeatId);

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
                    message = "Ghế không thuộc phòng của suất chiếu"
                });
            }

            var duplicateSeat = await _context.Tickets
                .AnyAsync(t =>
                    t.TicketId != id &&
                    t.ShowtimeId == ticket.ShowtimeId &&
                    t.SeatId == ticket.SeatId &&
                    t.Status != "Đã hủy");

            if (duplicateSeat)
            {
                return Conflict(new
                {
                    message = "Ghế này đã được đặt"
                });
            }

            // Kiểm tra loại vé trước khi cập nhật.
            if (ticket.TicketTypeId.HasValue)
            {
                var ticketType = await _context.TicketTypes
                    .FirstOrDefaultAsync(
                        t => t.TicketTypeId == ticket.TicketTypeId.Value);

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

                var linkedPrice = await _context.ShowtimeTicketTypes
                    .AsNoTracking()
                    .Where(x =>
                        x.ShowtimeId == ticket.ShowtimeId &&
                        x.TicketTypeId == ticket.TicketTypeId.Value)
                    .Select(x => (decimal?)x.Price)
                    .FirstOrDefaultAsync();

                if (!linkedPrice.HasValue)
                {
                    return BadRequest(new
                    {
                        message =
                            "Loại vé này không áp dụng cho suất chiếu."
                    });
                }

                existingTicket.TicketTypeId = ticket.TicketTypeId;
                existingTicket.TicketPrice = linkedPrice.Value;
            }
            else
            {
                existingTicket.TicketTypeId = null;
                existingTicket.TicketPrice =
                    ticket.TicketPrice > 0
                        ? ticket.TicketPrice
                        : showtime.TicketPrice;
            }

            existingTicket.UserId = ticket.UserId;
            existingTicket.MovieId = ticket.MovieId;
            existingTicket.ShowtimeId = ticket.ShowtimeId;
            existingTicket.SeatId = ticket.SeatId;
            existingTicket.Status = ticket.Status;

            existingTicket.PaymentStatus =
                string.IsNullOrWhiteSpace(ticket.PaymentStatus)
                    ? existingTicket.PaymentStatus
                    : ticket.PaymentStatus;

            existingTicket.PaymentMethod = ticket.PaymentMethod;
            existingTicket.PaymentTransactionId =
                ticket.PaymentTransactionId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật vé thành công"
            });
        }

        // =====================================================
        // DELETE: api/tickets/5
        // Xóa vé.
        // =====================================================

        [HttpDelete("{id:int}")]
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