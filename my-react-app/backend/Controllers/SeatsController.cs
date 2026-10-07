using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeatsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SeatsController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/seats?roomId=13
        // GET: api/seats?showtimeId=2
        // =========================================================
        [HttpGet]
        public async Task<IActionResult> GetSeats(
            [FromQuery] int? roomId,
            [FromQuery] int? showtimeId)
        {
            int? resolvedRoomId = roomId;

            // Nếu chỉ truyền showtimeId thì lấy RoomId từ Showtime
            if (!resolvedRoomId.HasValue && showtimeId.HasValue)
            {
                resolvedRoomId = await _context.Showtimes
                    .AsNoTracking()
                    .Where(s => s.ShowtimeId == showtimeId.Value)
                    .Select(s => (int?)s.RoomId)
                    .FirstOrDefaultAsync();
            }

            if (!resolvedRoomId.HasValue || resolvedRoomId <= 0)
            {
                return BadRequest(new
                {
                    message = "Thiếu roomId hoặc showtimeId không hợp lệ."
                });
            }

            // Kiểm tra phòng chiếu
            var room = await _context.Rooms
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.RoomId == resolvedRoomId.Value);

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Phòng chiếu không tồn tại."
                });
            }

            // Lấy danh sách mã ghế đã được đặt trong suất chiếu
            var bookedSeatCodes = new List<string>();

            if (showtimeId.HasValue)
            {
                bookedSeatCodes = await _context.Tickets
                    .AsNoTracking()
                    .Include(t => t.Seat)
                    .Where(t => t.ShowtimeId == showtimeId.Value)
                    .Where(t => t.Seat != null)
                    .Select(t => t.Seat!.SeatCode)
                    .ToListAsync();
            }

            // Lấy ghế thật từ database
            var seats = await _context.Seats
                .AsNoTracking()
                .Where(s => s.RoomId == resolvedRoomId.Value)
                .OrderBy(s => s.RowName)
                .ThenBy(s => s.SeatNumber)
                .Select(s => new
                {
                    seatId = s.SeatId,
                    seatCode = s.SeatCode,
                    rowName = s.RowName,
                    seatNumber = s.SeatNumber,
                    seatType = s.SeatType,
                    isBooked = bookedSeatCodes.Contains(s.SeatCode)
                })
                .ToListAsync();

            return Ok(seats);
        }

        // =========================================================
        // POST: api/seats
        // Thêm ghế mới
        // =========================================================
        [HttpPost]
        public async Task<IActionResult> CreateSeat([FromBody] CreateSeatRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu ghế không hợp lệ."
                });
            }

            // Kiểm tra RoomId
            if (request.RoomId <= 0)
            {
                return BadRequest(new
                {
                    message = "Vui lòng chọn phòng chiếu."
                });
            }

            // Kiểm tra mã ghế
            if (string.IsNullOrWhiteSpace(request.SeatCode))
            {
                return BadRequest(new
                {
                    message = "Mã ghế không được để trống."
                });
            }

            // Kiểm tra hàng ghế
            if (string.IsNullOrWhiteSpace(request.RowName))
            {
                return BadRequest(new
                {
                    message = "Hàng ghế không được để trống."
                });
            }

            // Kiểm tra số ghế
            if (request.SeatNumber <= 0)
            {
                return BadRequest(new
                {
                    message = "Số ghế phải lớn hơn 0."
                });
            }

            // Kiểm tra phòng
            var room = await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomId == request.RoomId);

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Phòng chiếu không tồn tại."
                });
            }

            // Đếm số ghế hiện tại
            var currentSeatCount = await _context.Seats
                .CountAsync(s => s.RoomId == request.RoomId);

            // Không cho vượt quá sức chứa
            if (currentSeatCount >= room.Capacity)
            {
                return BadRequest(new
                {
                    message = $"Phòng {room.RoomName} đã đủ {room.Capacity} ghế."
                });
            }

            // Chuẩn hóa dữ liệu
            var seatCode = request.SeatCode.Trim().ToUpper();
            var rowName = request.RowName.Trim().ToUpper();

            var seatType = string.IsNullOrWhiteSpace(request.SeatType)
                ? "Normal"
                : request.SeatType.Trim();

            // Kiểm tra ghế trùng trong cùng phòng
            var duplicateSeat = await _context.Seats
                .AnyAsync(s =>
                    s.RoomId == request.RoomId &&
                    s.SeatCode == seatCode);

            if (duplicateSeat)
            {
                return Conflict(new
                {
                    message = $"Ghế {seatCode} đã tồn tại trong phòng {room.RoomName}."
                });
            }

            // Tạo ghế
            var seat = new Seat
            {
                RoomId = request.RoomId,
                SeatCode = seatCode,
                RowName = rowName,
                SeatNumber = request.SeatNumber,
                SeatType = seatType
            };

            _context.Seats.Add(seat);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    message = "Không thể thêm ghế. Có thể mã ghế đã tồn tại."
                });
            }

            return CreatedAtAction(
                nameof(GetSeat),
                new { id = seat.SeatId },
                new
                {
                    seatId = seat.SeatId,
                    roomId = seat.RoomId,
                    seatCode = seat.SeatCode,
                    rowName = seat.RowName,
                    seatNumber = seat.SeatNumber,
                    seatType = seat.SeatType,
                    isBooked = false
                }
            );
        }

        // =========================================================
        // GET: api/seats/{id}
        // Lấy 1 ghế
        // =========================================================
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
                    message = "Ghế không tồn tại."
                });
            }

            return Ok(seat);
        }

        // =========================================================
        // DELETE: api/seats/{id}
        // Xóa ghế
        // =========================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteSeat(int id)
        {
            var seat = await _context.Seats
                .FirstOrDefaultAsync(s => s.SeatId == id);

            if (seat == null)
            {
                return NotFound(new
                {
                    message = "Ghế không tồn tại."
                });
            }

            // Kiểm tra ghế đã được sử dụng trong vé chưa
            var hasTickets = await _context.Tickets
                .AnyAsync(t => t.SeatId == id);

            if (hasTickets)
            {
                return BadRequest(new
                {
                    message = $"Không thể xóa ghế {seat.SeatCode} vì ghế đã có vé."
                });
            }

            _context.Seats.Remove(seat);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return BadRequest(new
                {
                    message = "Không thể xóa ghế vì ghế đang được sử dụng."
                });
            }

            return Ok(new
            {
                message = $"Đã xóa ghế {seat.SeatCode} thành công."
            });
        }
    }

    // =============================================================
    // REQUEST MODEL: THÊM GHẾ
    // =============================================================
    public class CreateSeatRequest
    {
        public int RoomId { get; set; }

        public string SeatCode { get; set; } = string.Empty;

        public string RowName { get; set; } = string.Empty;

        public int SeatNumber { get; set; }

        public string SeatType { get; set; } = "Normal";
    }
}