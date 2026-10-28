
using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    public class HoldSeatRequest
    {
        public int ShowtimeId { get; set; }
        public string SeatCode { get; set; } = string.Empty;
        public string HoldToken { get; set; } = string.Empty;
        public int? UserId { get; set; }
    }

    public class ReleaseSeatRequest
    {
        public int ShowtimeId { get; set; }
        public string SeatCode { get; set; } = string.Empty;
        public string HoldToken { get; set; } = string.Empty;
    }

    public class ReleaseAllSeatsRequest
    {
        public int ShowtimeId { get; set; }
        public string HoldToken { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class SeatsController : ControllerBase
    {
        private readonly AppDbContext _context;

        private static readonly TimeSpan HoldDuration =
            TimeSpan.FromMinutes(10);

        public SeatsController(AppDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET: api/seats
        // GET: api/seats?roomId=4
        // GET: api/seats?showtimeId=3&holdToken=...
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetSeats(
            [FromQuery] int? roomId,
            [FromQuery] int? showtimeId,
            [FromQuery] string? holdToken)
        {
            if (showtimeId.HasValue)
            {
                var showtimeRoomId = await _context.Showtimes
                    .AsNoTracking()
                    .Where(s => s.ShowtimeId == showtimeId.Value)
                    .Select(s => (int?)s.RoomId)
                    .FirstOrDefaultAsync();

                if (!showtimeRoomId.HasValue)
                {
                    return NotFound(new
                    {
                        message = "Không tìm thấy suất chiếu."
                    });
                }

                if (roomId.HasValue &&
                    roomId.Value != showtimeRoomId.Value)
                {
                    return BadRequest(new
                    {
                        message = "Phòng không khớp với suất chiếu."
                    });
                }

                roomId = showtimeRoomId;
            }

            var now = DateTime.UtcNow;
            var token = holdToken?.Trim();

            var query = _context.Seats
                .AsNoTracking()
                .AsQueryable();

            if (roomId.HasValue)
            {
                query = query.Where(
                    seat => seat.RoomId == roomId.Value);
            }

            var seats = await query
                .OrderBy(seat => seat.RowName)
                .ThenBy(seat => seat.SeatNumber)
                .Select(seat => new
                {
                    seatId = seat.SeatId,
                    roomId = seat.RoomId,
                    seatCode = seat.SeatCode,
                    rowName = seat.RowName,
                    seatNumber = seat.SeatNumber,
                    seatType = seat.SeatType,

                    isBooked = showtimeId.HasValue &&
                        _context.Tickets.Any(ticket =>
                            ticket.ShowtimeId == showtimeId.Value &&
                            ticket.SeatId == seat.SeatId &&
                            ticket.Status != "Đã hủy"),

                    isHeld = showtimeId.HasValue &&
                        _context.SeatHolds.Any(hold =>
                            hold.ShowtimeId == showtimeId.Value &&
                            hold.SeatId == seat.SeatId &&
                            hold.ExpiresAtUtc > now &&
                            (token == null ||
                             hold.HoldToken != token)),

                    isHeldByMe = showtimeId.HasValue &&
                        token != null &&
                        _context.SeatHolds.Any(hold =>
                            hold.ShowtimeId == showtimeId.Value &&
                            hold.SeatId == seat.SeatId &&
                            hold.ExpiresAtUtc > now &&
                            hold.HoldToken == token)
                })
                .ToListAsync();

            return Ok(seats);
        }

        // =====================================================
        // POST: api/seats/hold
        // Giữ ghế tạm thời trong 5 phút
        // =====================================================

        [HttpPost("hold")]
        public async Task<IActionResult> HoldSeat(
            [FromBody] HoldSeatRequest request)
        {
            if (request.ShowtimeId <= 0)
            {
                return BadRequest(new
                {
                    message = "Suất chiếu không hợp lệ."
                });
            }

            var seatCode = request.SeatCode.Trim().ToUpperInvariant();
            var token = request.HoldToken.Trim();

            if (string.IsNullOrWhiteSpace(seatCode))
            {
                return BadRequest(new
                {
                    message = "Vui lòng chọn ghế."
                });
            }

            if (token.Length < 16 || token.Length > 128)
            {
                return BadRequest(new
                {
                    message = "Mã giữ ghế không hợp lệ."
                });
            }

            var now = DateTime.UtcNow;

            // Xóa các lượt giữ đã hết hạn để cho phép khách khác chọn.
            var expiredHolds = await _context.SeatHolds
                .Where(hold => hold.ExpiresAtUtc <= now)
                .ToListAsync();

            if (expiredHolds.Count > 0)
            {
                _context.SeatHolds.RemoveRange(expiredHolds);
                await _context.SaveChangesAsync();
            }

            var showtime = await _context.Showtimes
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    s => s.ShowtimeId == request.ShowtimeId);

            if (showtime == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy suất chiếu."
                });
            }

            var seat = await _context.Seats
                .FirstOrDefaultAsync(s =>
                    s.RoomId == showtime.RoomId &&
                    s.SeatCode == seatCode);

            if (seat == null)
            {
                return NotFound(new
                {
                    message = $"Không tìm thấy ghế {seatCode}."
                });
            }

            if (request.UserId.HasValue && request.UserId.Value > 0)
            {
                var userExists = await _context.Users
                    .AnyAsync(u => u.UserId == request.UserId.Value);

                if (!userExists)
                {
                    return BadRequest(new
                    {
                        message = "Tài khoản không tồn tại."
                    });
                }
            }

            var isBooked = await _context.Tickets.AnyAsync(ticket =>
                ticket.ShowtimeId == request.ShowtimeId &&
                ticket.SeatId == seat.SeatId &&
                ticket.Status != "Đã hủy");

            if (isBooked)
            {
                return Conflict(new
                {
                    message = $"Ghế {seatCode} đã được đặt."
                });
            }

            var currentHold = await _context.SeatHolds
                .FirstOrDefaultAsync(hold =>
                    hold.ShowtimeId == request.ShowtimeId &&
                    hold.SeatId == seat.SeatId);

            if (currentHold != null)
            {
                if (currentHold.HoldToken != token)
                {
                    return Conflict(new
                    {
                        message = $"Ghế {seatCode} đang được khách khác giữ."
                    });
                }

                // Khách sở hữu lượt giữ có thể gia hạn.
                currentHold.ExpiresAtUtc = now.Add(HoldDuration);
                currentHold.UserId = request.UserId;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Đã giữ ghế {seatCode}.",
                    seatCode,
                    expiresAtUtc = currentHold.ExpiresAtUtc
                });
            }

         // Các ghế thuộc cùng lượt đặt của cùng suất chiếu
// sử dụng chung thời điểm hết hạn.
var sessionExpiry = await _context.SeatHolds
    .Where(hold =>
        hold.ShowtimeId == request.ShowtimeId &&
        hold.HoldToken == token &&
        hold.ExpiresAtUtc > now)
    .Select(hold => (DateTime?)hold.ExpiresAtUtc)
    .MinAsync();

var expiresAt = sessionExpiry ?? now.Add(HoldDuration);

var newHold = new SeatHold
{
    ShowtimeId = request.ShowtimeId,
    SeatId = seat.SeatId,
    HoldToken = token,
    UserId = request.UserId,
    CreatedAtUtc = now,
    ExpiresAtUtc = expiresAt
};

            _context.SeatHolds.Add(newHold);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Hai khách có thể bấm cùng lúc.
                // Unique index bảo đảm chỉ một lượt giữ được ghi.
                return Conflict(new
                {
                    message = $"Ghế {seatCode} vừa được khách khác giữ. Vui lòng chọn ghế khác."
                });
            }

            return Ok(new
            {
                message = $"Đã giữ ghế {seatCode}.",
                seatCode,
                expiresAtUtc = newHold.ExpiresAtUtc
            });
        }

        // =====================================================
        // POST: api/seats/release
        // Nhả một ghế khi khách bỏ chọn
        // =====================================================

        [HttpPost("release")]
        public async Task<IActionResult> ReleaseSeat(
            [FromBody] ReleaseSeatRequest request)
        {
            var token = request.HoldToken.Trim();
            var seatCode = request.SeatCode.Trim().ToUpperInvariant();

            if (request.ShowtimeId <= 0 ||
                token.Length < 16 ||
                token.Length > 128 ||
                string.IsNullOrWhiteSpace(seatCode))
            {
                return BadRequest(new
                {
                    message = "Thông tin nhả ghế không hợp lệ."
                });
            }

                 var hold = await _context.SeatHolds
                 .FirstOrDefaultAsync(h =>
                    h.ShowtimeId == request.ShowtimeId &&
                    h.HoldToken == token &&
                  _context.Seats.Any(seat =>
                  seat.SeatId == h.SeatId &&
                  seat.SeatCode == seatCode));

            if (hold == null)
            {
                return Ok(new
                {
                    message = "Ghế không còn được phiên này giữ."
                });
            }

            _context.SeatHolds.Remove(hold);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Đã nhả ghế {seatCode}."
            });
        }

        // =====================================================
        // POST: api/seats/release-all
        // Nhả tất cả ghế trong suất chiếu của phiên này
        // =====================================================

        [HttpPost("release-all")]
        public async Task<IActionResult> ReleaseAllSeats(
            [FromBody] ReleaseAllSeatsRequest request)
        {
            var token = request.HoldToken.Trim();

            if (request.ShowtimeId <= 0 ||
                token.Length < 16 ||
                token.Length > 128)
            {
                return BadRequest(new
                {
                    message = "Thông tin nhả ghế không hợp lệ."
                });
            }

            var holds = await _context.SeatHolds
                .Where(h =>
                    h.ShowtimeId == request.ShowtimeId &&
                    h.HoldToken == token)
                .ToListAsync();

            if (holds.Count > 0)
            {
                _context.SeatHolds.RemoveRange(holds);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "Đã giải phóng các ghế của phiên này.",
                releasedCount = holds.Count
            });
        }

        // =====================================================
        // GET: api/seats/5
        // =====================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetSeat(int id)
        {
            var seat = await _context.Seats
                .AsNoTracking()
                .Where(s => s.SeatId == id)
                .Select(s => new
                {
                    seatId = s.SeatId,
                    roomId = s.RoomId,
                    seatCode = s.SeatCode,
                    rowName = s.RowName,
                    seatNumber = s.SeatNumber,
                    seatType = s.SeatType
                })
                .FirstOrDefaultAsync();

            if (seat == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy ghế."
                });
            }

            return Ok(seat);
        }

        // =====================================================
        // POST: api/seats/bulk
        // =====================================================

        [HttpPost("bulk")]
        public async Task<IActionResult> CreateSeatsBulk(
            [FromBody] BulkSeatRequest request)
        {
            if (request.RoomId <= 0)
            {
                return BadRequest(new
                {
                    message = "RoomId không hợp lệ."
                });
            }

            if (request.Rows <= 0 || request.Rows > 26)
            {
                return BadRequest(new
                {
                    message = "Số hàng phải từ 1 đến 26."
                });
            }

            if (request.SeatsPerRow <= 0 ||
                request.SeatsPerRow > 50)
            {
                return BadRequest(new
                {
                    message = "Số ghế mỗi hàng phải từ 1 đến 50."
                });
            }

            var room = await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomId == request.RoomId);

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy phòng chiếu."
                });
            }

            var existingCount = await _context.Seats
                .CountAsync(s => s.RoomId == request.RoomId);

            if (existingCount > 0)
            {
                return BadRequest(new
                {
                    message = $"Phòng {room.RoomName} đã có {existingCount} ghế. Hãy xóa sơ đồ cũ trước."
                });
            }

            var seatType = string.IsNullOrWhiteSpace(request.SeatType)
                ? "Normal"
                : request.SeatType.Trim();

            var validSeatTypes = new[]
            {
                "Normal",
                "VIP",
                "Couple"
            };

            if (!validSeatTypes.Contains(
                seatType,
                StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message = "Loại ghế không hợp lệ."
                });
            }

            var seats = new List<Seat>();
            var capacity = room.Capacity;
            var requestedTotal = request.Rows * request.SeatsPerRow;
            var totalToCreate = Math.Min(requestedTotal, capacity);
            var createdCount = 0;

            for (var rowIndex = 0; rowIndex < request.Rows; rowIndex++)
            {
                if (createdCount >= totalToCreate)
                    break;

                var rowName = ((char)('A' + rowIndex)).ToString();

                for (var seatNumber = 1;
                     seatNumber <= request.SeatsPerRow;
                     seatNumber++)
                {
                    if (createdCount >= totalToCreate)
                        break;

                    seats.Add(new Seat
                    {
                        RoomId = request.RoomId,
                        SeatCode = $"{rowName}{seatNumber}",
                        RowName = rowName,
                        SeatNumber = seatNumber,
                        SeatType = seatType
                    });

                    createdCount++;
                }
            }

            _context.Seats.AddRange(seats);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo sơ đồ ghế thành công.",
                roomId = room.RoomId,
                roomName = room.RoomName,
                createdCount,
                capacity
            });
        }

        // =====================================================
        // DELETE: api/seats/5
        // =====================================================

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteSeat(int id)
        {
            var seat = await _context.Seats
                .FirstOrDefaultAsync(s => s.SeatId == id);

            if (seat == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy ghế."
                });
            }

            var hasTicket = await _context.Tickets
                .AnyAsync(t => t.SeatId == id);

            if (hasTicket)
            {
                return BadRequest(new
                {
                    message = "Không thể xóa ghế đang có vé đã đặt."
                });
            }

            var hasHold = await _context.SeatHolds
                .AnyAsync(h => h.SeatId == id &&
                               h.ExpiresAtUtc > DateTime.UtcNow);

            if (hasHold)
            {
                return Conflict(new
                {
                    message = "Không thể xóa ghế đang được khách giữ."
                });
            }

            _context.Seats.Remove(seat);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa ghế thành công."
            });
        }

        // =====================================================
        // DELETE: api/seats/room/4
        // =====================================================

        [HttpDelete("room/{roomId:int}")]
        public async Task<IActionResult> DeleteSeatsByRoom(int roomId)
        {
            var room = await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomId == roomId);

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy phòng."
                });
            }

            var seats = await _context.Seats
                .Where(s => s.RoomId == roomId)
                .ToListAsync();

            if (seats.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Phòng này chưa có ghế."
                });
            }

            var seatIds = seats.Select(s => s.SeatId).ToList();

            var hasTicket = await _context.Tickets
                .AnyAsync(t => seatIds.Contains(t.SeatId));

            if (hasTicket)
            {
                return BadRequest(new
                {
                    message = "Không thể xóa ghế đang có vé đã đặt."
                });
            }

            var hasHold = await _context.SeatHolds
                .AnyAsync(h =>
                    seatIds.Contains(h.SeatId) &&
                    h.ExpiresAtUtc > DateTime.UtcNow);

            if (hasHold)
            {
                return Conflict(new
                {
                    message = "Không thể xóa sơ đồ vì có ghế đang được khách giữ."
                });
            }

            _context.Seats.RemoveRange(seats);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa toàn bộ sơ đồ ghế thành công.",
                deletedCount = seats.Count
            });
        }
    }

    public class BulkSeatRequest
    {
        public int RoomId { get; set; }
        public int Rows { get; set; }
        public int SeatsPerRow { get; set; }
        public string SeatType { get; set; } = "Normal";
    }
}
