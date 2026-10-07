using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoomsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/rooms
        [HttpGet]
        public async Task<IActionResult> GetRooms()
        {
            var rooms = await _context.Rooms
                .AsNoTracking()
                .OrderBy(r => r.RoomId)
                .Select(r => new
                {
                    roomId = r.RoomId,
                    cinemaId = r.CinemaId,
                    roomName = r.RoomName,
                    capacity = r.Capacity,
                    status = r.Status,
                    createdAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(rooms);
        }

        // GET: api/rooms/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetRoom(int id)
        {
            var room = await _context.Rooms
                .AsNoTracking()
                .Where(r => r.RoomId == id)
                .Select(r => new
                {
                    roomId = r.RoomId,
                    cinemaId = r.CinemaId,
                    roomName = r.RoomName,
                    capacity = r.Capacity,
                    status = r.Status,
                    createdAt = r.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Phòng chiếu không tồn tại."
                });
            }

            return Ok(room);
        }

        // POST: api/rooms
        [HttpPost]
        public async Task<IActionResult> CreateRoom([FromBody] Room room)
        {
            if (room == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu phòng chiếu không hợp lệ."
                });
            }

            if (room.CinemaId <= 0)
            {
                return BadRequest(new
                {
                    message = "Vui lòng chọn rạp chiếu."
                });
            }

            if (string.IsNullOrWhiteSpace(room.RoomName))
            {
                return BadRequest(new
                {
                    message = "Tên phòng không được để trống."
                });
            }

            if (room.Capacity <= 0)
            {
                return BadRequest(new
                {
                    message = "Sức chứa phải lớn hơn 0."
                });
            }

            var cinemaExists = await _context.Cinemas
                .AnyAsync(c => c.CinemaId == room.CinemaId);

            if (!cinemaExists)
            {
                return BadRequest(new
                {
                    message = "Rạp chiếu không tồn tại."
                });
            }

            var duplicateRoom = await _context.Rooms
                .AnyAsync(r =>
                    r.CinemaId == room.CinemaId &&
                    r.RoomName == room.RoomName);

            if (duplicateRoom)
            {
                return Conflict(new
                {
                    message = "Tên phòng này đã tồn tại trong rạp."
                });
            }

            room.RoomId = 0;
            room.CreatedAt = DateTime.Now;

            if (string.IsNullOrWhiteSpace(room.Status))
            {
                room.Status = "Đang hoạt động";
            }

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetRoom),
                new { id = room.RoomId },
                new
                {
                    roomId = room.RoomId,
                    cinemaId = room.CinemaId,
                    roomName = room.RoomName,
                    capacity = room.Capacity,
                    status = room.Status,
                    createdAt = room.CreatedAt
                }
            );
        }

        // PUT: api/rooms/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateRoom(
            int id,
            [FromBody] Room room)
        {
            if (room == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu phòng chiếu không hợp lệ."
                });
            }

            var existingRoom = await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomId == id);

            if (existingRoom == null)
            {
                return NotFound(new
                {
                    message = "Phòng chiếu không tồn tại."
                });
            }

            if (room.CinemaId <= 0)
            {
                return BadRequest(new
                {
                    message = "Vui lòng chọn rạp chiếu."
                });
            }

            if (string.IsNullOrWhiteSpace(room.RoomName))
            {
                return BadRequest(new
                {
                    message = "Tên phòng không được để trống."
                });
            }

            if (room.Capacity <= 0)
            {
                return BadRequest(new
                {
                    message = "Sức chứa phải lớn hơn 0."
                });
            }

            var cinemaExists = await _context.Cinemas
                .AnyAsync(c => c.CinemaId == room.CinemaId);

            if (!cinemaExists)
            {
                return BadRequest(new
                {
                    message = "Rạp chiếu không tồn tại."
                });
            }

            var duplicateRoom = await _context.Rooms
                .AnyAsync(r =>
                    r.RoomId != id &&
                    r.CinemaId == room.CinemaId &&
                    r.RoomName == room.RoomName);

            if (duplicateRoom)
            {
                return Conflict(new
                {
                    message = "Tên phòng này đã tồn tại trong rạp."
                });
            }

            existingRoom.CinemaId = room.CinemaId;
            existingRoom.RoomName = room.RoomName.Trim();
            existingRoom.Capacity = room.Capacity;
            existingRoom.Status = string.IsNullOrWhiteSpace(room.Status)
                ? "Đang hoạt động"
                : room.Status;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật phòng chiếu thành công.",
                roomId = existingRoom.RoomId,
                cinemaId = existingRoom.CinemaId,
                roomName = existingRoom.RoomName,
                capacity = existingRoom.Capacity,
                status = existingRoom.Status,
                createdAt = existingRoom.CreatedAt
            });
        }

        // DELETE: api/rooms/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var room = await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomId == id);

            if (room == null)
            {
                return NotFound(new
                {
                    message = "Phòng chiếu không tồn tại."
                });
            }

            var hasShowtimes = await _context.Showtimes
                .AnyAsync(s => s.RoomId == id);

            if (hasShowtimes)
            {
                return BadRequest(new
                {
                    message = "Không thể xóa phòng vì phòng đang có suất chiếu."
                });
            }

            var hasSeats = await _context.Seats
                .AnyAsync(s => s.RoomId == id);

            if (hasSeats)
            {
                return BadRequest(new
                {
                    message = "Không thể xóa phòng vì phòng đang có ghế."
                });
            }

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa phòng chiếu thành công."
            });
        }
    }
}