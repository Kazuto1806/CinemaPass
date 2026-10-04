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
        public async Task<IActionResult> GetSeats([FromQuery] int? roomId, [FromQuery] int? showtimeId)
        {
            int? resolvedRoomId = roomId;

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

            var roomCapacity = room.Capacity > 0 ? room.Capacity : 70;
            var maxSeatsPerRow = 10;
            var rowCount = Math.Max(1, (int)Math.Ceiling((double)roomCapacity / maxSeatsPerRow));

            var seats = new List<object>();

            for (int rowIndex = 0; rowIndex < rowCount; rowIndex++)
            {
                var rowName = ((char)('A' + rowIndex)).ToString();
                var seatsInThisRow = rowIndex == rowCount - 1 && roomCapacity % maxSeatsPerRow != 0
                    ? roomCapacity % maxSeatsPerRow
                    : maxSeatsPerRow;

                for (int seatNumber = 1; seatNumber <= seatsInThisRow; seatNumber++)
                {
                    var seatCode = $"{rowName}{seatNumber}";

                    seats.Add(new
                    {
                        seatId = 0,
                        seatCode,
                        rowName,
                        seatNumber,
                        isBooked = bookedSeatCodes.Contains(seatCode)
                    });
                }
            }

            return Ok(seats);
        }
    }
}
