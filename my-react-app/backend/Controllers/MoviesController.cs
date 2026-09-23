using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MoviesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MoviesController(AppDbContext context)
        {
            _context = context;
        }

        // =========================
        // LẤY TẤT CẢ PHIM
        // GET: /api/Movies
        // =========================
        [HttpGet]
        public async Task<IActionResult> GetMovies()
        {
            var movies = await _context.Movies
                .OrderByDescending(x => x.MovieId)
                .ToListAsync();

            return Ok(movies);
        }

        // =========================
        // LẤY PHIM THEO ID
        // GET: /api/Movies/1
        // =========================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMovie(int id)
        {
            var movie = await _context.Movies
                .FirstOrDefaultAsync(x => x.MovieId == id);

            if (movie == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy phim"
                });
            }

            return Ok(movie);
        }

        // =========================
        // THÊM PHIM
        // POST: /api/Movies
        // =========================
        [HttpPost]
        public async Task<IActionResult> CreateMovie(Movie movie)
        {
            if (string.IsNullOrWhiteSpace(movie.Title))
            {
                return BadRequest(new
                {
                    message = "Tên phim không được để trống"
                });
            }

            if (movie.Duration <= 0)
            {
                return BadRequest(new
                {
                    message = "Thời lượng phim phải lớn hơn 0"
                });
            }

            if (string.IsNullOrWhiteSpace(movie.Status))
            {
                movie.Status = "ComingSoon";
            }

            movie.MovieId = 0;

            _context.Movies.Add(movie);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm phim thành công",
                movie = movie
            });
        }

        // =========================
        // CẬP NHẬT PHIM
        // PUT: /api/Movies/1
        // =========================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMovie(
            int id,
            Movie movie
        )
        {
            var existingMovie = await _context.Movies
                .FirstOrDefaultAsync(x => x.MovieId == id);

            if (existingMovie == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy phim"
                });
            }

            if (string.IsNullOrWhiteSpace(movie.Title))
            {
                return BadRequest(new
                {
                    message = "Tên phim không được để trống"
                });
            }

            if (movie.Duration <= 0)
            {
                return BadRequest(new
                {
                    message = "Thời lượng phim phải lớn hơn 0"
                });
            }

            existingMovie.Title = movie.Title;
            existingMovie.Description = movie.Description;
            existingMovie.Genre = movie.Genre;
            existingMovie.Duration = movie.Duration;
            existingMovie.ReleaseDate = movie.ReleaseDate;
            existingMovie.Director = movie.Director;
            existingMovie.AgeRating = movie.AgeRating;
            existingMovie.PosterUrl = movie.PosterUrl;
            existingMovie.TrailerUrl = movie.TrailerUrl;
            existingMovie.Status = movie.Status;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật phim thành công",
                movie = existingMovie
            });
        }

        // =========================
        // XÓA PHIM
        // DELETE: /api/Movies/1
        // =========================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMovie(int id)
        {
            var movie = await _context.Movies
                .FirstOrDefaultAsync(x => x.MovieId == id);

            if (movie == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy phim"
                });
            }

            _context.Movies.Remove(movie);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa phim thành công"
            });
        }

        // =========================
        // TÌM KIẾM PHIM
        // GET: /api/Movies/search?keyword=bat
        // =========================
        [HttpGet("search")]
        public async Task<IActionResult> SearchMovies(
            [FromQuery] string keyword
        )
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return await GetMovies();
            }

            var movies = await _context.Movies
                .Where(x =>
                    x.Title.Contains(keyword) ||
                    (x.Genre != null && x.Genre.Contains(keyword)) ||
                    (x.Director != null && x.Director.Contains(keyword))
                )
                .OrderByDescending(x => x.MovieId)
                .ToListAsync();

            return Ok(movies);
        }
    }
}