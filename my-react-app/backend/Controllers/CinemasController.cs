using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/cinemas")]
    public class CinemasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CinemasController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/cinemas
        // Lấy toàn bộ danh sách rạp
        [HttpGet]
        public async Task<IActionResult> GetCinemas()
        {
            var cinemas = await _context.Cinemas
                .AsNoTracking()
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(cinemas);
        }

        // GET: api/cinemas/5
        // Lấy một rạp theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCinema(int id)
        {
            var cinema = await _context.Cinemas
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CinemaId == id);

            if (cinema == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy rạp"
                });
            }

            return Ok(cinema);
        }

        // POST: api/cinemas
        // Thêm rạp mới
        [HttpPost]
        public async Task<IActionResult> CreateCinema(Cinema cinema)
        {
            cinema.CinemaId = 0;
            cinema.CreatedAt = DateTime.Now;

            if (string.IsNullOrWhiteSpace(cinema.Status))
            {
                cinema.Status = "Đang hoạt động";
            }

            _context.Cinemas.Add(cinema);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm rạp thành công",
                cinemaId = cinema.CinemaId
            });
        }

        // PUT: api/cinemas/5
        // Cập nhật rạp
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCinema(
            int id,
            Cinema updatedCinema)
        {
            var cinema = await _context.Cinemas
                .FirstOrDefaultAsync(c => c.CinemaId == id);

            if (cinema == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy rạp"
                });
            }

            cinema.Name = updatedCinema.Name;
            cinema.Address = updatedCinema.Address;
            cinema.Phone = updatedCinema.Phone;
            cinema.Status = updatedCinema.Status;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật rạp thành công"
            });
        }

        // DELETE: api/cinemas/5
        // Xóa rạp
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCinema(int id)
        {
            var cinema = await _context.Cinemas
                .FirstOrDefaultAsync(c => c.CinemaId == id);

            if (cinema == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy rạp"
                });
            }

            _context.Cinemas.Remove(cinema);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa rạp thành công"
            });
        }
    }
}