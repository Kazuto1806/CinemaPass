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

        // =====================================================
        // GET: api/seats
        // GET: api/seats?roomId=4
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetSeats(
            [FromQuery] int? roomId
        )
        {
            var query = _context.Seats
                .AsNoTracking()
                .AsQueryable();

            if (roomId.HasValue)
            {
                query = query.Where(
                    s => s.RoomId == roomId.Value
                );
            }

            var seats = await query
                .OrderBy(s => s.RowName)
                .ThenBy(s => s.SeatNumber)
                .Select(s => new
                {
                    seatId = s.SeatId,
                    roomId = s.RoomId,
                    seatCode = s.SeatCode,
                    rowName = s.RowName,
                    seatNumber = s.SeatNumber,
                    seatType = s.SeatType
                })
                .ToListAsync();

            return Ok(seats);
        }

        // =====================================================
        // GET: api/seats/5
        // =====================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSeat(
            int id
        )
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
            [FromBody] BulkSeatRequest request
        )
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
                    message =
                        "Số hàng phải từ 1 đến 26."
                });
            }

            if (
                request.SeatsPerRow <= 0 ||
                request.SeatsPerRow > 50
            )
            {
                return BadRequest(new
                {
                    message =
                        "Số ghế mỗi hàng phải từ 1 đến 50."
                });
            }

            // =================================================
            // KIỂM TRA ROOM
            // =================================================

            var room = await _context.Rooms
                .FirstOrDefaultAsync(
                    r => r.RoomId == request.RoomId
                );

            if (room == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy phòng chiếu."
                });
            }

            // =================================================
            // KIỂM TRA GHẾ ĐÃ TỒN TẠI
            // =================================================

            var existingCount =
                await _context.Seats
                    .CountAsync(
                        s =>
                            s.RoomId ==
                            request.RoomId
                    );

            if (existingCount > 0)
            {
                return BadRequest(new
                {
                    message =
                        $"Phòng {room.RoomName} đã có {existingCount} ghế. Hãy xóa sơ đồ cũ trước."
                });
            }

            // =================================================
            // KIỂM TRA LOẠI GHẾ
            // =================================================

            var seatType =
                string.IsNullOrWhiteSpace(
                    request.SeatType
                )
                    ? "Normal"
                    : request.SeatType.Trim();

            var validSeatTypes =
                new[]
                {
                    "Normal",
                    "VIP",
                    "Couple"
                };

            if (
                !validSeatTypes.Contains(
                    seatType,
                    StringComparer.OrdinalIgnoreCase
                )
            )
            {
                return BadRequest(new
                {
                    message =
                        "Loại ghế không hợp lệ."
                });
            }

            // =================================================
            // TẠO GHẾ
            // =================================================

            var seats = new List<Seat>();

            var capacity = room.Capacity;

            var requestedTotal =
                request.Rows *
                request.SeatsPerRow;

            var totalToCreate =
                Math.Min(
                    requestedTotal,
                    capacity
                );

            var createdCount = 0;

            for (
                var rowIndex = 0;
                rowIndex < request.Rows;
                rowIndex++
            )
            {
                if (
                    createdCount >=
                    totalToCreate
                )
                {
                    break;
                }

                var rowName =
                    ((char)(
                        'A' + rowIndex
                    )).ToString();

                for (
                    var seatNumber = 1;
                    seatNumber <=
                    request.SeatsPerRow;
                    seatNumber++
                )
                {
                    if (
                        createdCount >=
                        totalToCreate
                    )
                    {
                        break;
                    }

                    var seat = new Seat
                    {
                        RoomId =
                            request.RoomId,

                        SeatCode =
                            $"{rowName}{seatNumber}",

                        RowName =
                            rowName,

                        SeatNumber =
                            seatNumber,

                        SeatType =
                            seatType
                    };

                    seats.Add(seat);

                    createdCount++;
                }
            }

            // =================================================
            // SAVE
            // =================================================

            _context.Seats.AddRange(seats);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Tạo sơ đồ ghế thành công.",

                roomId =
                    room.RoomId,

                roomName =
                    room.RoomName,

                createdCount,

                capacity
            });
        }

        // =====================================================
        // DELETE ONE SEAT
        // DELETE: api/seats/5
        // =====================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSeat(
            int id
        )
        {
            var seat = await _context.Seats
                .FirstOrDefaultAsync(
                    s => s.SeatId == id
                );

            if (seat == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy ghế."
                });
            }

            // =================================================
            // KIỂM TRA VÉ
            // =================================================

            var hasTicket =
                await _context.Tickets
                    .AnyAsync(
                        t =>
                            t.SeatId ==
                            id
                    );

            if (hasTicket)
            {
                return BadRequest(new
                {
                    message =
                        "Không thể xóa ghế đã từng được sử dụng trong vé."
                });
            }

            _context.Seats.Remove(seat);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Xóa ghế thành công."
            });
        }

        // =====================================================
        // DELETE ALL SEATS OF ROOM
        // DELETE: api/seats/room/4
        // =====================================================

        [HttpDelete("room/{roomId}")]
        public async Task<IActionResult>
            DeleteSeatsByRoom(
                int roomId
            )
        {
            var room = await _context.Rooms
                .FirstOrDefaultAsync(
                    r => r.RoomId == roomId
                );

            if (room == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy phòng."
                });
            }

            var seats = await _context.Seats
                .Where(
                    s =>
                        s.RoomId ==
                        roomId
                )
                .ToListAsync();

            if (seats.Count == 0)
            {
                return BadRequest(new
                {
                    message =
                        "Phòng này chưa có ghế."
                });
            }

            var seatIds =
                seats
                    .Select(
                        s => s.SeatId
                    )
                    .ToList();

            // =================================================
            // KIỂM TRA TICKET
            // =================================================

            var hasTicket =
                await _context.Tickets
                    .AnyAsync(
                        t =>
                            seatIds.Contains(
                                t.SeatId
                            )
                    );

            if (hasTicket)
            {
                return BadRequest(new
                {
                    message =
                        "Không thể xóa sơ đồ ghế vì một hoặc nhiều ghế đã được sử dụng trong vé."
                });
            }

            _context.Seats.RemoveRange(
                seats
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Xóa toàn bộ sơ đồ ghế thành công.",

                deletedCount =
                    seats.Count
            });
        }
    }

    // =========================================================
    // REQUEST MODEL
    // =========================================================

    public class BulkSeatRequest
    {
        public int RoomId { get; set; }

        public int Rows { get; set; }

        public int SeatsPerRow { get; set; }

        public string SeatType { get; set; }
            = "Normal";
    }
}