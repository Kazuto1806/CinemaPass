using CinemaBackend.Data;
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
                    isBooked = bookedSeatCodes.Contains(s.SeatCode)
                })
                .ToListAsync();

            return Ok(seats);
        }
    }
}