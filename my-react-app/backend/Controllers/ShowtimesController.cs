using System.Globalization;
using System.Text;
using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/showtimes")]
    public class ShowtimesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ShowtimesController(AppDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // GET: api/showtimes
        // Lấy tất cả suất chiếu
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetShowtimes()
        {
            var showtimes = await _context.Showtimes
                .AsNoTracking()
                .Include(s => s.Movie)
                .Include(s => s.Room)
                    .ThenInclude(r => r.Cinema)
                .OrderBy(s => s.ShowDate)
                .ThenBy(s => s.StartTime)
                .Select(s => new
                {
                    s.ShowtimeId,

                    s.MovieId,

                    MovieTitle = s.Movie != null
                        ? s.Movie.Title
                        : "",

                    s.RoomId,

                    RoomName = s.Room != null
                        ? s.Room.RoomName
                        : "",

                    CinemaId = s.Room != null
                        ? s.Room.CinemaId
                        : 0,

                    CinemaName =
                        s.Room != null &&
                        s.Room.Cinema != null
                            ? s.Room.Cinema.Name
                            : "",

                    s.ShowDate,

                    s.StartTime,

                    s.EndTime,

                    s.TicketPrice,

                    Status = NormalizeShowtimeStatus(s.Status),

                    s.CreatedAt
                })
                .ToListAsync();

            return Ok(showtimes);
        }


        // =====================================================
        // GET: api/showtimes/{id}
        // Lấy một suất chiếu
        // =====================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetShowtime(int id)
        {
            var showtime = await _context.Showtimes
                .AsNoTracking()
                .Include(s => s.Movie)
                .Include(s => s.Room)
                    .ThenInclude(r => r.Cinema)
                .Where(s => s.ShowtimeId == id)
                .Select(s => new
                {
                    s.ShowtimeId,

                    s.MovieId,

                    MovieTitle = s.Movie != null
                        ? s.Movie.Title
                        : "",

                    s.RoomId,

                    RoomName = s.Room != null
                        ? s.Room.RoomName
                        : "",

                    CinemaId = s.Room != null
                        ? s.Room.CinemaId
                        : 0,

                    CinemaName =
                        s.Room != null &&
                        s.Room.Cinema != null
                            ? s.Room.Cinema.Name
                            : "",

                    s.ShowDate,

                    s.StartTime,

                    s.EndTime,

                    s.TicketPrice,

                    Status = NormalizeShowtimeStatus(s.Status),

                    s.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (showtime == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy suất chiếu"
                });
            }

            return Ok(showtime);
        }


        // =====================================================
        // POST: api/showtimes
        // Thêm suất chiếu
        // =====================================================

        [HttpPost]
        public async Task<IActionResult> CreateShowtime(
            Showtime showtime)
        {
            // =================================================
            // KIỂM TRA PHIM
            // =================================================

            var movieExists = await _context.Movies
                .AnyAsync(m =>
                    m.MovieId == showtime.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại"
                });
            }


            // =================================================
            // KIỂM TRA PHÒNG
            // =================================================

            var room = await _context.Rooms
                .Include(r => r.Cinema)
                .FirstOrDefaultAsync(r =>
                    r.RoomId == showtime.RoomId);

            if (room == null)
            {
                return BadRequest(new
                {
                    message = "Phòng chiếu không tồn tại"
                });
            }


            // =================================================
            // KIỂM TRA RẠP
            // =================================================

            if (room.Cinema == null)
            {
                return BadRequest(new
                {
                    message = "Rạp của phòng chiếu không tồn tại"
                });
            }


            // =================================================
            // KIỂM TRA GIỜ
            // =================================================

            if (showtime.EndTime == showtime.StartTime)
            {
                return BadRequest(new
                {
                    message =
                        "Giờ kết thúc không được trùng giờ bắt đầu"
                });
            }


            // =================================================
            // KIỂM TRA GIÁ
            // =================================================

            if (showtime.TicketPrice <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Giá vé phải lớn hơn 0"
                });
            }


            // =================================================
            // KIỂM TRA TRÙNG SUẤT CHIẾU
            // =================================================

            var conflict = await HasScheduleConflict(
                showtime.RoomId,
                showtime.ShowDate,
                showtime.StartTime,
                showtime.EndTime
            );

            if (conflict)
            {
                return BadRequest(new
                {
                    message =
                        "Phòng chiếu đã có suất chiếu trùng thời gian"
                });
            }


            // =================================================
            // GÁN GIÁ TRỊ MẶC ĐỊNH
            // =================================================

            showtime.ShowtimeId = 0;

            showtime.CreatedAt =
                DateTime.Now;

            showtime.Status = NormalizeShowtimeStatus(
                showtime.Status
            );


            // =================================================
            // LƯU DATABASE
            // =================================================

            _context.Showtimes.Add(
                showtime
            );

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Thêm suất chiếu thành công",

                showtimeId =
                    showtime.ShowtimeId
            });
        }


        // =====================================================
        // PUT: api/showtimes/{id}
        // Cập nhật suất chiếu
        // =====================================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateShowtime(
            int id,
            Showtime updatedShowtime)
        {
            // =================================================
            // TÌM SUẤT CHIẾU
            // =================================================

            var showtime =
                await _context.Showtimes
                    .FirstOrDefaultAsync(
                        s => s.ShowtimeId == id
                    );

            if (showtime == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy suất chiếu"
                });
            }


            // =================================================
            // KIỂM TRA PHIM
            // =================================================

            var movieExists =
                await _context.Movies
                    .AnyAsync(
                        m =>
                            m.MovieId ==
                            updatedShowtime.MovieId
                    );

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message =
                        "Phim không tồn tại"
                });
            }


            // =================================================
            // KIỂM TRA PHÒNG
            // =================================================

            var room =
                await _context.Rooms
                    .Include(r => r.Cinema)
                    .FirstOrDefaultAsync(
                        r =>
                            r.RoomId ==
                            updatedShowtime.RoomId
                    );

            if (room == null)
            {
                return BadRequest(new
                {
                    message =
                        "Phòng chiếu không tồn tại"
                });
            }


            if (room.Cinema == null)
            {
                return BadRequest(new
                {
                    message =
                        "Rạp của phòng chiếu không tồn tại"
                });
            }


            // =================================================
            // KIỂM TRA GIỜ
            // =================================================

            if (updatedShowtime.EndTime == updatedShowtime.StartTime)
            {
                return BadRequest(new
                {
                    message =
                        "Giờ kết thúc không được trùng giờ bắt đầu"
                });
            }


            // =================================================
            // KIỂM TRA GIÁ
            // =================================================

            if (
                updatedShowtime.TicketPrice <= 0
            )
            {
                return BadRequest(new
                {
                    message =
                        "Giá vé phải lớn hơn 0"
                });
            }


            // =================================================
            // KIỂM TRA TRÙNG SUẤT CHIẾU
            // =================================================

            var conflict = await HasScheduleConflict(
                updatedShowtime.RoomId,
                updatedShowtime.ShowDate,
                updatedShowtime.StartTime,
                updatedShowtime.EndTime,
                id
            );

            if (conflict)
            {
                return BadRequest(new
                {
                    message =
                        "Phòng chiếu đã có suất chiếu trùng thời gian"
                });
            }


            // =================================================
            // CẬP NHẬT
            // =================================================

            showtime.MovieId =
                updatedShowtime.MovieId;

            showtime.RoomId =
                updatedShowtime.RoomId;

            showtime.ShowDate =
                updatedShowtime.ShowDate;

            showtime.StartTime =
                updatedShowtime.StartTime;

            showtime.EndTime =
                updatedShowtime.EndTime;

            showtime.TicketPrice =
                updatedShowtime.TicketPrice;

            showtime.Status = NormalizeShowtimeStatus(
                updatedShowtime.Status
            );


            // =================================================
            // SAVE
            // =================================================

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Cập nhật suất chiếu thành công"
            });
        }

        private static string NormalizeShowtimeStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return "Đang hoạt động";
            }

            var cleaned = status
                .Trim()
                .Replace("Ð", "Đ")
                .Replace("?", string.Empty)
                .Replace("_", " ");

            var normalized = cleaned.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder();

            foreach (var ch in normalized)
            {
                var category = CharUnicodeInfo.GetUnicodeCategory(ch);
                if (category != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(ch);
                }
            }

            var candidate = builder.ToString()
                .Replace("đ", "d")
                .Replace("Đ", "D")
                .Replace("-", " ")
                .Replace("/", " ")
                .Replace("\\", " ")
                .Replace(".", " ")
                .Replace(",", " ");

            var lower = string.Join(" ", candidate.Split(
                new[] { ' ', '\t', '\r', '\n' },
                StringSplitOptions.RemoveEmptyEntries)).ToLowerInvariant();

            if (
                lower.Contains("active") ||
                lower.Contains("dang hoat dong") ||
                lower.Contains("dang hot dong") ||
                lower.Contains("hoat dong") ||
                lower.Contains("dang hoat")
            )
            {
                return "Đang hoạt động";
            }

            if (lower.Contains("tam ngung") || lower.Contains("ngung"))
            {
                return "Tạm ngưng";
            }

            if (
                lower.Contains("da ket thuc") ||
                lower.Contains("ket thuc") ||
                lower.Contains("kt thuc") ||
                lower.Contains("da kt thuc") ||
                lower.Contains("thuc")
            )
            {
                return "Đã kết thúc";
            }

            return status.Trim();
        }

        private async Task<bool> HasScheduleConflict(
            int roomId,
            DateTime showDate,
            TimeSpan startTime,
            TimeSpan endTime,
            int? excludedShowtimeId = null)
        {
            var dateFrom = showDate.Date.AddDays(-1);
            var dateTo = showDate.Date.AddDays(1);

            var query = _context.Showtimes
                .AsNoTracking()
                .Where(s =>
                    s.RoomId == roomId &&
                    s.ShowDate >= dateFrom &&
                    s.ShowDate <= dateTo);

            if (excludedShowtimeId.HasValue)
            {
                query = query.Where(s =>
                    s.ShowtimeId != excludedShowtimeId.Value);
            }

            var existingShowtimes = await query
                .Select(s => new
                {
                    s.ShowDate,
                    s.StartTime,
                    s.EndTime
                })
                .ToListAsync();

            var requestedStart = showDate.Date.Add(startTime);
            var requestedEnd = showDate.Date.Add(endTime);

            if (endTime < startTime)
            {
                requestedEnd = requestedEnd.AddDays(1);
            }

            return existingShowtimes.Any(existing =>
            {
                var existingStart = existing.ShowDate.Date.Add(existing.StartTime);
                var existingEnd = existing.ShowDate.Date.Add(existing.EndTime);

                if (existing.EndTime < existing.StartTime)
                {
                    existingEnd = existingEnd.AddDays(1);
                }

                return requestedStart < existingEnd && requestedEnd > existingStart;
            });
        }


        // =====================================================
        // DELETE: api/showtimes/{id}
        // Xóa suất chiếu
        // =====================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShowtime(
            int id)
        {
            var showtime =
                await _context.Showtimes
                    .FirstOrDefaultAsync(
                        s =>
                            s.ShowtimeId == id
                    );

            if (showtime == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy suất chiếu"
                });
            }


            _context.Showtimes.Remove(
                showtime
            );

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Xóa suất chiếu thành công"
            });
        }
    }
}