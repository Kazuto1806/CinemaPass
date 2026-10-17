
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

                    ticketTypePrices = s.TicketTypeAssignments
                        .Select(assignment => new
                        {
                            ticketTypeId = assignment.TicketTypeId,

                            name = assignment.TicketType != null
                                ? assignment.TicketType.Name
                                : "",

                            category = assignment.TicketType != null
                                ? assignment.TicketType.Category
                                : "Customer",

                            price = assignment.Price
                        }),

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

                    ticketTypePrices = s.TicketTypeAssignments
                        .Select(assignment => new
                        {
                            ticketTypeId = assignment.TicketTypeId,

                            name = assignment.TicketType != null
                                ? assignment.TicketType.Name
                                : "",

                            category = assignment.TicketType != null
                                ? assignment.TicketType.Category
                                : "Customer",

                            price = assignment.Price
                        }),

                    Status = NormalizeShowtimeStatus(s.Status),
                    s.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (showtime == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy suất chiếu."
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
            var ticketTypeValidation =
                await ValidateTicketTypePrices(
                    showtime.TicketTypePrices);

            if (ticketTypeValidation != null)
            {
                return ticketTypeValidation;
            }

            var movieExists = await _context.Movies
                .AnyAsync(m => m.MovieId == showtime.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại."
                });
            }

            var room = await _context.Rooms
                .Include(r => r.Cinema)
                .FirstOrDefaultAsync(
                    r => r.RoomId == showtime.RoomId);

            if (room == null)
            {
                return BadRequest(new
                {
                    message = "Phòng chiếu không tồn tại."
                });
            }

            if (room.Cinema == null)
            {
                return BadRequest(new
                {
                    message = "Rạp của phòng chiếu không tồn tại."
                });
            }

            if (showtime.EndTime == showtime.StartTime)
            {
                return BadRequest(new
                {
                    message =
                        "Giờ kết thúc không được trùng giờ bắt đầu."
                });
            }

            if (showtime.TicketPrice <= 0)
            {
                return BadRequest(new
                {
                    message = "Giá vé phải lớn hơn 0."
                });
            }

            var conflict = await HasScheduleConflict(
                showtime.RoomId,
                showtime.ShowDate,
                showtime.StartTime,
                showtime.EndTime);

            if (conflict)
            {
                return BadRequest(new
                {
                    message =
                        "Phòng chiếu đã có suất chiếu trùng thời gian."
                });
            }

            showtime.ShowtimeId = 0;
            showtime.CreatedAt = DateTime.Now;

            showtime.Status = NormalizeShowtimeStatus(
                showtime.Status);

            showtime.TicketTypeAssignments =
                MapTicketTypePrices(showtime.TicketTypePrices);

            _context.Showtimes.Add(showtime);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm suất chiếu thành công.",
                showtimeId = showtime.ShowtimeId
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
            var ticketTypeValidation =
                await ValidateTicketTypePrices(
                    updatedShowtime.TicketTypePrices);

            if (ticketTypeValidation != null)
            {
                return ticketTypeValidation;
            }

            var showtime = await _context.Showtimes
                .FirstOrDefaultAsync(s => s.ShowtimeId == id);

            if (showtime == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy suất chiếu."
                });
            }

            // Không cho đổi thông tin cốt lõi của suất chiếu
            // nếu đã có vé, tránh làm sai lịch sử vé.
            var hasTickets = await _context.Tickets
                .AnyAsync(t => t.ShowtimeId == id);

            if (hasTickets)
            {
                return Conflict(new
                {
                    message =
                        "Không thể cập nhật suất chiếu đã có vé. " +
                        "Vui lòng giữ nguyên thông tin để bảo vệ lịch sử vé."
                });
            }

            var hasActiveHolds = await _context.SeatHolds
                .AnyAsync(h =>
                    h.ShowtimeId == id &&
                    h.ExpiresAtUtc > DateTime.UtcNow);

            if (hasActiveHolds)
            {
                return Conflict(new
                {
                    message =
                        "Không thể cập nhật suất chiếu khi khách đang giữ ghế. " +
                        "Vui lòng thử lại sau."
                });
            }

            var movieExists = await _context.Movies
                .AnyAsync(m =>
                    m.MovieId == updatedShowtime.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại."
                });
            }

            var room = await _context.Rooms
                .Include(r => r.Cinema)
                .FirstOrDefaultAsync(
                    r => r.RoomId == updatedShowtime.RoomId);

            if (room == null)
            {
                return BadRequest(new
                {
                    message = "Phòng chiếu không tồn tại."
                });
            }

            if (room.Cinema == null)
            {
                return BadRequest(new
                {
                    message = "Rạp của phòng chiếu không tồn tại."
                });
            }

            if (updatedShowtime.EndTime ==
                updatedShowtime.StartTime)
            {
                return BadRequest(new
                {
                    message =
                        "Giờ kết thúc không được trùng giờ bắt đầu."
                });
            }

            if (updatedShowtime.TicketPrice <= 0)
            {
                return BadRequest(new
                {
                    message = "Giá vé phải lớn hơn 0."
                });
            }

            var conflict = await HasScheduleConflict(
                updatedShowtime.RoomId,
                updatedShowtime.ShowDate,
                updatedShowtime.StartTime,
                updatedShowtime.EndTime,
                id);

            if (conflict)
            {
                return BadRequest(new
                {
                    message =
                        "Phòng chiếu đã có suất chiếu trùng thời gian."
                });
            }

            showtime.MovieId = updatedShowtime.MovieId;
            showtime.RoomId = updatedShowtime.RoomId;
            showtime.ShowDate = updatedShowtime.ShowDate;
            showtime.StartTime = updatedShowtime.StartTime;
            showtime.EndTime = updatedShowtime.EndTime;
            showtime.TicketPrice = updatedShowtime.TicketPrice;

            showtime.Status = NormalizeShowtimeStatus(
                updatedShowtime.Status);

            var existingAssignments =
                await _context.ShowtimeTicketTypes
                    .Where(assignment =>
                        assignment.ShowtimeId == id)
                    .ToListAsync();

            var requestedAssignments =
                MapTicketTypePrices(
                    updatedShowtime.TicketTypePrices)
                .ToDictionary(
                    assignment => assignment.TicketTypeId);

            foreach (var existingAssignment in existingAssignments)
            {
                if (requestedAssignments.Remove(
                    existingAssignment.TicketTypeId,
                    out var requestedAssignment))
                {
                    existingAssignment.Price =
                        requestedAssignment.Price;
                }
                else
                {
                    _context.ShowtimeTicketTypes.Remove(
                        existingAssignment);
                }
            }

            foreach (var assignment in requestedAssignments.Values)
            {
                assignment.ShowtimeId = id;
                _context.ShowtimeTicketTypes.Add(assignment);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật suất chiếu thành công."
            });
        }

        // =====================================================
        // Kiểm tra chính sách vé
        // =====================================================

        private async Task<IActionResult?> ValidateTicketTypePrices(
            List<ShowtimeTicketTypeInput>? ticketTypePrices)
        {
            if (ticketTypePrices == null ||
                ticketTypePrices.Count == 0)
            {
                return BadRequest(new
                {
                    message =
                        "Vui lòng chọn ít nhất một chính sách vé cho suất chiếu."
                });
            }

            var ticketTypeIds = ticketTypePrices
                .Select(item => item.TicketTypeId)
                .ToList();

            if (ticketTypeIds.Any(id => id <= 0) ||
                ticketTypeIds.Distinct().Count() !=
                    ticketTypeIds.Count ||
                ticketTypePrices.Any(item => item.Price <= 0))
            {
                return BadRequest(new
                {
                    message =
                        "Danh sách chính sách vé hoặc giá vé không hợp lệ."
                });
            }

            var ticketTypes = await _context.TicketTypes
                .Where(ticketType =>
                    ticketTypeIds.Contains(
                        ticketType.TicketTypeId))
                .Select(ticketType => new
                {
                    ticketType.TicketTypeId,
                    ticketType.Status
                })
                .ToListAsync();

            if (ticketTypes.Count != ticketTypeIds.Count ||
                ticketTypes.Any(ticketType =>
                    string.Equals(
                        ticketType.Status,
                        "Inactive",
                        StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new
                {
                    message =
                        "Có loại vé không tồn tại hoặc đang tạm ngưng."
                });
            }

            return null;
        }

        // =====================================================
        // Chuyển dữ liệu chính sách vé
        // =====================================================

        private static List<ShowtimeTicketType> MapTicketTypePrices(
            IEnumerable<ShowtimeTicketTypeInput> ticketTypePrices)
        {
            return ticketTypePrices
                .Select(item => new ShowtimeTicketType
                {
                    TicketTypeId = item.TicketTypeId,
                    Price = item.Price
                })
                .ToList();
        }

        // =====================================================
        // Chuẩn hóa trạng thái suất chiếu
        // =====================================================

        private static string NormalizeShowtimeStatus(
            string? status)
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

            var normalized =
                cleaned.Normalize(NormalizationForm.FormD);

            var builder = new StringBuilder();

            foreach (var ch in normalized)
            {
                var category =
                    CharUnicodeInfo.GetUnicodeCategory(ch);

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

            var lower = string.Join(
                " ",
                candidate.Split(
                    new[] { ' ', '\t', '\r', '\n' },
                    StringSplitOptions.RemoveEmptyEntries))
                .ToLowerInvariant();

            if (lower.Contains("active") ||
                lower.Contains("dang hoat dong") ||
                lower.Contains("dang hot dong") ||
                lower.Contains("hoat dong") ||
                lower.Contains("dang hoat"))
            {
                return "Đang hoạt động";
            }

            if (lower.Contains("tam ngung") ||
                lower.Contains("ngung"))
            {
                return "Tạm ngưng";
            }

            if (lower.Contains("da ket thuc") ||
                lower.Contains("ket thuc") ||
                lower.Contains("kt thuc") ||
                lower.Contains("da kt thuc") ||
                lower.Contains("thuc"))
            {
                return "Đã kết thúc";
            }

            return status.Trim();
        }

        // =====================================================
        // Kiểm tra suất chiếu trùng giờ trong cùng phòng
        // =====================================================

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

            var requestedStart =
                showDate.Date.Add(startTime);

            var requestedEnd =
                showDate.Date.Add(endTime);

            if (endTime < startTime)
            {
                requestedEnd = requestedEnd.AddDays(1);
            }

            return existingShowtimes.Any(existing =>
            {
                var existingStart =
                    existing.ShowDate.Date.Add(
                        existing.StartTime);

                var existingEnd =
                    existing.ShowDate.Date.Add(
                        existing.EndTime);

                if (existing.EndTime < existing.StartTime)
                {
                    existingEnd = existingEnd.AddDays(1);
                }

                return requestedStart < existingEnd &&
                       requestedEnd > existingStart;
            });
        }

        // =====================================================
        // Lấy giờ hiện tại theo múi giờ Việt Nam
        // =====================================================

        private static DateTime GetVietnamNow()
        {
            TimeZoneInfo vietnamTimeZone;

            try
            {
                vietnamTimeZone =
                    TimeZoneInfo.FindSystemTimeZoneById(
                        "Asia/Ho_Chi_Minh");
            }
            catch (TimeZoneNotFoundException)
            {
                vietnamTimeZone =
                    TimeZoneInfo.FindSystemTimeZoneById(
                        "SE Asia Standard Time");
            }

            return TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                vietnamTimeZone);
        }

        // =====================================================
        // DELETE: api/showtimes/{id}
        // Chặn xóa suất chiếu có vé, có người giữ ghế
        // hoặc đang diễn ra.
        // =====================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShowtime(int id)
        {
            var showtime = await _context.Showtimes
                .FirstOrDefaultAsync(
                    s => s.ShowtimeId == id);

            if (showtime == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy suất chiếu."
                });
            }

            // 1. Không xóa suất chiếu đã có vé.
            // Giữ lại lịch sử kể cả khi vé đã hủy.
            var hasTickets = await _context.Tickets
                .AnyAsync(t => t.ShowtimeId == id);

            if (hasTickets)
            {
                return Conflict(new
                {
                    message =
                        "Không thể xóa suất chiếu vì đã có vé liên quan. " +
                        "Vui lòng giữ lại suất chiếu để bảo toàn lịch sử vé."
                });
            }

            // 2. Không xóa suất chiếu còn lượt giữ ghế đang hiệu lực.
            var nowUtc = DateTime.UtcNow;

            var hasActiveHolds = await _context.SeatHolds
                .AnyAsync(h =>
                    h.ShowtimeId == id &&
                    h.ExpiresAtUtc > nowUtc);

            if (hasActiveHolds)
            {
                return Conflict(new
                {
                    message =
                        "Không thể xóa suất chiếu vì vẫn có khách đang giữ ghế. " +
                        "Vui lòng thử lại sau."
                });
            }

            // 3. Xác định suất chiếu có đang diễn ra không,
            // dựa trên giờ Việt Nam, hỗ trợ suất chiếu qua nửa đêm.
            var nowVietnam = GetVietnamNow();

            var startDateTime = showtime.ShowDate.Date
                .Add(showtime.StartTime);

            var endDateTime = showtime.ShowDate.Date
                .Add(showtime.EndTime);

            if (endDateTime <= startDateTime)
            {
                endDateTime = endDateTime.AddDays(1);
            }

            var isCurrentlyRunning =
                nowVietnam >= startDateTime &&
                nowVietnam < endDateTime;

            if (isCurrentlyRunning)
            {
                return Conflict(new
                {
                    message =
                        "Không thể xóa suất chiếu đang diễn ra."
                });
            }

            // 4. Chỉ xóa khi tất cả kiểm tra đều hợp lệ.
            _context.Showtimes.Remove(showtime);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa suất chiếu thành công."
            });
        }
    }
}
