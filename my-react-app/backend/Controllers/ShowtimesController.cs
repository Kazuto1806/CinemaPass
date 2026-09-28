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

        // GET: api/showtimes
        // Lấy danh sách suất chiếu
        [HttpGet]
        public async Task<IActionResult> GetShowtimes()
        {
            var showtimes = await _context.Showtimes
                .AsNoTracking()
                .Include(s => s.Movie)
                .Include(s => s.Cinema)
                .OrderBy(s => s.StartTime)
                .Select(s => new
                {
                    s.ShowtimeId,
                    s.MovieId,
                    MovieTitle = s.Movie != null
                        ? s.Movie.Title
                        : "",

                    s.CinemaId,
                    CinemaName = s.Cinema != null
                        ? s.Cinema.Name
                        : "",

                    s.StartTime,
                    s.EndTime,
                    s.RoomName,
                    s.TicketPrice,
                    s.Status,
                    s.CreatedAt
                })
                .ToListAsync();

            return Ok(showtimes);
        }

        // GET: api/showtimes/1
        // Lấy một suất chiếu
        [HttpGet("{id}")]
        public async Task<IActionResult> GetShowtime(int id)
        {
            var showtime = await _context.Showtimes
                .AsNoTracking()
                .Include(s => s.Movie)
                .Include(s => s.Cinema)
                .Where(s => s.ShowtimeId == id)
                .Select(s => new
                {
                    s.ShowtimeId,
                    s.MovieId,
                    MovieTitle = s.Movie != null
                        ? s.Movie.Title
                        : "",

                    s.CinemaId,
                    CinemaName = s.Cinema != null
                        ? s.Cinema.Name
                        : "",

                    s.StartTime,
                    s.EndTime,
                    s.RoomName,
                    s.TicketPrice,
                    s.Status,
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

        // POST: api/showtimes
        // Thêm suất chiếu
        [HttpPost]
        public async Task<IActionResult> CreateShowtime(Showtime showtime)
        {
            // Kiểm tra phim
            var movieExists = await _context.Movies
                .AnyAsync(m => m.MovieId == showtime.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại"
                });
            }

            // Kiểm tra rạp
            var cinemaExists = await _context.Cinemas
                .AnyAsync(c => c.CinemaId == showtime.CinemaId);

            if (!cinemaExists)
            {
                return BadRequest(new
                {
                    message = "Rạp không tồn tại"
                });
            }

            showtime.ShowtimeId = 0;
            showtime.CreatedAt = DateTime.Now;

            if (string.IsNullOrWhiteSpace(showtime.Status))
            {
                showtime.Status = "Đang hoạt động";
            }

            _context.Showtimes.Add(showtime);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm suất chiếu thành công",
                showtimeId = showtime.ShowtimeId
            });
        }

        // PUT: api/showtimes/1
        // Cập nhật suất chiếu
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateShowtime(
            int id,
            Showtime updatedShowtime)
        {
            var showtime = await _context.Showtimes
                .FirstOrDefaultAsync(s => s.ShowtimeId == id);

            if (showtime == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy suất chiếu"
                });
            }

            // Kiểm tra phim
            var movieExists = await _context.Movies
                .AnyAsync(m => m.MovieId == updatedShowtime.MovieId);

            if (!movieExists)
            {
                return BadRequest(new
                {
                    message = "Phim không tồn tại"
                });
            }

            // Kiểm tra rạp
            var cinemaExists = await _context.Cinemas
                .AnyAsync(c => c.CinemaId == updatedShowtime.CinemaId);

            if (!cinemaExists)
            {
                return BadRequest(new
                {
                    message = "Rạp không tồn tại"
                });
            }

            showtime.MovieId = updatedShowtime.MovieId;
            showtime.CinemaId = updatedShowtime.CinemaId;
            showtime.StartTime = updatedShowtime.StartTime;
            showtime.EndTime = updatedShowtime.EndTime;
            showtime.RoomName = updatedShowtime.RoomName;
            showtime.TicketPrice = updatedShowtime.TicketPrice;
            showtime.Status = updatedShowtime.Status;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật suất chiếu thành công"
            });
        }

        // DELETE: api/showtimes/1
        // Xóa suất chiếu
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShowtime(int id)
        {
            var showtime = await _context.Showtimes
                .FirstOrDefaultAsync(s => s.ShowtimeId == id);

            if (showtime == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy suất chiếu"
                });
            }

            _context.Showtimes.Remove(showtime);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa suất chiếu thành công"
            });
        }
    }
}