using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MoviesController : ControllerBase
    {
       private readonly AppDbContext _context;
private readonly IWebHostEnvironment _environment;
    private readonly Cloudinary? _cloudinary;

public MoviesController(
    AppDbContext context,
    IWebHostEnvironment environment,
    IConfiguration configuration)
{
    _context = context;
    _environment = environment;

    var cloudName = configuration["Cloudinary:CloudName"]
        ?? configuration["CLOUDINARY_CLOUD_NAME"];
    var apiKey = configuration["Cloudinary:ApiKey"]
        ?? configuration["CLOUDINARY_API_KEY"];
    var apiSecret = configuration["Cloudinary:ApiSecret"]
        ?? configuration["CLOUDINARY_API_SECRET"];

    if (!string.IsNullOrWhiteSpace(cloudName) &&
        !string.IsNullOrWhiteSpace(apiKey) &&
        !string.IsNullOrWhiteSpace(apiSecret))
    {
        var account = new Account(
            cloudName,
            apiKey,
            apiSecret
        );

        _cloudinary = new Cloudinary(account)
        {
            Api =
            {
                Secure = true
            }
        };
    }
}

        // =========================
        // GET TẤT CẢ PHIM
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
        // GET PHIM THEO ID
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
        // POST - THÊM PHIM
        // =========================

        [HttpPost]
        public async Task<IActionResult> CreateMovie(
            [FromForm] Movie movie,
            IFormFile? PosterFile)
        {
            // Kiểm tra tên
            if (string.IsNullOrWhiteSpace(movie.Title))
            {
                return BadRequest(new
                {
                    message = "Tên phim không được để trống"
                });
            }

            // Kiểm tra thời lượng
            if (movie.Duration <= 0)
            {
                return BadRequest(new
                {
                    message = "Thời lượng phim phải lớn hơn 0"
                });
            }

            if (PosterFile != null && PosterFile.Length > 0 && _cloudinary == null)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Chưa cấu hình Cloudinary. Vui lòng cấu hình Cloudinary:CloudName, Cloudinary:ApiKey và Cloudinary:ApiSecret."
                });
            }

            // Trạng thái mặc định
            if (string.IsNullOrWhiteSpace(movie.Status))
            {
                movie.Status = "ComingSoon";
            }

            // =========================
            // UPLOAD POSTER
            // =========================

            if (PosterFile != null && PosterFile.Length > 0)
            {
                var posterUrl = await SavePoster(PosterFile);

                movie.PosterUrl = posterUrl;
            }

            // =========================
            // LƯU SQL
            // =========================

            _context.Movies.Add(movie);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm phim thành công",
                movie = movie
            });
        }

        // =========================
        // PUT - CẬP NHẬT PHIM
        // =========================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMovie(
            int id,
            [FromForm] Movie movie,
            IFormFile? PosterFile)
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

            // Kiểm tra tên
            if (string.IsNullOrWhiteSpace(movie.Title))
            {
                return BadRequest(new
                {
                    message = "Tên phim không được để trống"
                });
            }

            // Kiểm tra thời lượng
            if (movie.Duration <= 0)
            {
                return BadRequest(new
                {
                    message = "Thời lượng phim phải lớn hơn 0"
                });
            }

            if (PosterFile != null && PosterFile.Length > 0 && _cloudinary == null)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Chưa cấu hình Cloudinary. Vui lòng cấu hình Cloudinary:CloudName, Cloudinary:ApiKey và Cloudinary:ApiSecret."
                });
            }

            // =========================
            // CẬP NHẬT THÔNG TIN
            // =========================

            existingMovie.Title = movie.Title;
            existingMovie.Description = movie.Description;
            existingMovie.Genre = movie.Genre;
            existingMovie.Duration = movie.Duration;
            existingMovie.ReleaseDate = movie.ReleaseDate;
            existingMovie.Director = movie.Director;
            existingMovie.AgeRating = movie.AgeRating;
            existingMovie.TrailerUrl = movie.TrailerUrl;

            existingMovie.Status =
                string.IsNullOrWhiteSpace(movie.Status)
                    ? "ComingSoon"
                    : movie.Status;

            // =========================
            // NẾU CHỌN POSTER MỚI
            // =========================

            if (PosterFile != null && PosterFile.Length > 0)
            {
                var posterUrl = await SavePoster(PosterFile);

                // Chỉ xóa poster cũ sau khi poster mới đã tải lên thành công.
                DeleteOldPoster(existingMovie.PosterUrl);
                existingMovie.PosterUrl = posterUrl;
            }

            // Nếu không chọn poster mới
            // thì giữ PosterUrl cũ

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật phim thành công",
                movie = existingMovie
            });
        }

        // =========================
        // DELETE - XÓA PHIM
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

            // Xóa poster đã upload
            DeleteOldPoster(movie.PosterUrl);

            _context.Movies.Remove(movie);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa phim thành công"
            });
        }

        // =========================
        // SEARCH
        // =========================

        [HttpGet("search")]
        public async Task<IActionResult> SearchMovies(
            [FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return await GetMovies();
            }

            var movies = await _context.Movies
                .Where(x =>
                    x.Title.Contains(keyword)
                    ||
                    (
                        x.Genre != null &&
                        x.Genre.Contains(keyword)
                    )
                    ||
                    (
                        x.Director != null &&
                        x.Director.Contains(keyword)
                    )
                )
                .OrderByDescending(x => x.MovieId)
                .ToListAsync();

            return Ok(movies);
        }

        // =========================
        // LƯU POSTER
        // =========================

        
private async Task<string> SavePoster(IFormFile file)
{
    var cloudinary = _cloudinary ?? throw new InvalidOperationException(
        "Chưa cấu hình thông tin Cloudinary."
    );

    // Chỉ nhận ảnh
    if (string.IsNullOrWhiteSpace(file.ContentType) ||
        !file.ContentType.StartsWith(
            "image/",
            StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException(
            "File poster phải là hình ảnh."
        );
    }

    // Giới hạn 10 MB
    if (file.Length <= 0 ||
        file.Length > 10 * 1024 * 1024)
    {
        throw new InvalidOperationException(
            "Poster phải lớn hơn 0 byte và không vượt quá 10MB."
        );
    }

    // Tải ảnh lên Cloudinary
    await using var stream = file.OpenReadStream();

    var uploadParams = new ImageUploadParams
    {
        File = new FileDescription(
            file.FileName,
            stream
        ),
        Folder = "cinemapass/posters"
    };

    var result = await cloudinary.UploadAsync(uploadParams);

    if (result.Error != null ||
        result.SecureUrl == null)
    {
        throw new InvalidOperationException(
            "Tải poster lên Cloudinary thất bại: " +
            (result.Error?.Message ?? "Không nhận được URL ảnh.")
        );
    }

    // Lưu URL HTTPS đầy đủ vào SQL Server
    return result.SecureUrl.ToString();
}


        // =========================
        // XÓA POSTER CŨ
        // =========================

        private void DeleteOldPoster(string? posterUrl)
        {
            if (string.IsNullOrWhiteSpace(posterUrl))
            {
                return;
            }

            // Chỉ xóa file do backend upload
            if (!posterUrl.StartsWith(
                "/uploads/posters/",
                StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var fileName = Path.GetFileName(
                posterUrl
            );

            if (string.IsNullOrWhiteSpace(fileName))
            {
                return;
            }

            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "uploads",
                "posters",
                fileName
            );

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
    }
}