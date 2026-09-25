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
        private readonly IWebHostEnvironment _environment;

        public MoviesController(
            AppDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }


        // =========================
        // GET TẤT CẢ PHIM
        // =========================

        [HttpGet]
        public async Task<IActionResult> GetMovies()
        {
            var movies = await _context.Movies
                .OrderByDescending(
                    x => x.MovieId
                )
                .ToListAsync();

            return Ok(movies);
        }


        // =========================
        // GET PHIM THEO ID
        // =========================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMovie(
            int id)
        {
            var movie =
                await _context.Movies
                    .FirstOrDefaultAsync(
                        x =>
                            x.MovieId == id
                    );

            if (movie == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy phim"
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
            [FromForm(Name = "PosterFile")]
            IFormFile? posterFile)
        {
            // Kiểm tra tên
            if (string.IsNullOrWhiteSpace(
                movie.Title))
            {
                return BadRequest(new
                {
                    message =
                        "Tên phim không được để trống"
                });
            }


            // Kiểm tra thời lượng
            if (movie.Duration <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Thời lượng phim phải lớn hơn 0"
                });
            }


            // Trạng thái mặc định
            if (string.IsNullOrWhiteSpace(
                movie.Status))
            {
                movie.Status =
                    "ComingSoon";
            }


            // =========================
            // UPLOAD POSTER
            // =========================

            if (posterFile != null &&
                posterFile.Length > 0)
            {
                var posterUrl =
                    await SavePoster(
                        posterFile
                    );

                movie.PosterUrl =
                    posterUrl;
            }


            // =========================
            // LƯU SQL
            // =========================

            _context.Movies.Add(movie);

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Thêm phim thành công",

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

            [FromForm(Name = "PosterFile")]
            IFormFile? posterFile)
        {
            var existingMovie =
                await _context.Movies
                    .FirstOrDefaultAsync(
                        x =>
                            x.MovieId == id
                    );

            if (existingMovie == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy phim"
                });
            }


            // Kiểm tra tên
            if (string.IsNullOrWhiteSpace(
                movie.Title))
            {
                return BadRequest(new
                {
                    message =
                        "Tên phim không được để trống"
                });
            }


            // Kiểm tra thời lượng
            if (movie.Duration <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Thời lượng phim phải lớn hơn 0"
                });
            }


            // =========================
            // CẬP NHẬT THÔNG TIN
            // =========================

            existingMovie.Title =
                movie.Title;

            existingMovie.Description =
                movie.Description;

            existingMovie.Genre =
                movie.Genre;

            existingMovie.Duration =
                movie.Duration;

            existingMovie.ReleaseDate =
                movie.ReleaseDate;

            existingMovie.Director =
                movie.Director;

            existingMovie.AgeRating =
                movie.AgeRating;

            existingMovie.TrailerUrl =
                movie.TrailerUrl;

            existingMovie.Status =
                string.IsNullOrWhiteSpace(
                    movie.Status)
                    ? "ComingSoon"
                    : movie.Status;


            // =========================
            // NẾU CHỌN POSTER MỚI
            // =========================

            if (posterFile != null &&
                posterFile.Length > 0)
            {
                // Xóa poster cũ nếu là file upload
                DeleteOldPoster(
                    existingMovie.PosterUrl
                );

                var posterUrl =
                    await SavePoster(
                        posterFile
                    );

                existingMovie.PosterUrl =
                    posterUrl;
            }

            // Nếu không chọn poster mới
            // thì giữ PosterUrl cũ


            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Cập nhật phim thành công",

                movie =
                    existingMovie
            });
        }


        // =========================
        // DELETE - XÓA PHIM
        // =========================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMovie(
            int id)
        {
            var movie =
                await _context.Movies
                    .FirstOrDefaultAsync(
                        x =>
                            x.MovieId == id
                    );

            if (movie == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy phim"
                });
            }


            // Xóa poster đã upload
            DeleteOldPoster(
                movie.PosterUrl
            );


            _context.Movies.Remove(movie);

            await _context.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Xóa phim thành công"
            });
        }


        // =========================
        // SEARCH
        // =========================

        [HttpGet("search")]
        public async Task<IActionResult> SearchMovies(
            [FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(
                keyword))
            {
                return await GetMovies();
            }

            var movies =
                await _context.Movies
                    .Where(x =>
                        x.Title.Contains(
                            keyword
                        )

                        ||

                        (
                            x.Genre != null &&
                            x.Genre.Contains(
                                keyword
                            )
                        )

                        ||

                        (
                            x.Director != null &&
                            x.Director.Contains(
                                keyword
                            )
                        )
                    )
                    .OrderByDescending(
                        x =>
                            x.MovieId
                    )
                    .ToListAsync();

            return Ok(movies);
        }


        // =========================
        // LƯU POSTER
        // =========================

        private async Task<string> SavePoster(
            IFormFile file)
        {
            // Chỉ nhận ảnh
            if (!file.ContentType.StartsWith(
                "image/"))
            {
                throw new InvalidOperationException(
                    "File poster phải là hình ảnh."
                );
            }


            // Giới hạn 10 MB
            if (file.Length >
                10 * 1024 * 1024)
            {
                throw new InvalidOperationException(
                    "Poster không được lớn hơn 10MB."
                );
            }


            // Tạo thư mục
            var uploadFolder =
                Path.Combine(
                    _environment.WebRootPath,
                    "uploads",
                    "posters"
                );


            if (!Directory.Exists(
                uploadFolder))
            {
                Directory.CreateDirectory(
                    uploadFolder
                );
            }


            // Lấy đuôi file
            var extension =
                Path.GetExtension(
                    file.FileName
                );


            // Tạo tên file mới
            var fileName =
                $"{Guid.NewGuid()}{extension}";


            var filePath =
                Path.Combine(
                    uploadFolder,
                    fileName
                );


            // Lưu file
            using var stream =
                new FileStream(
                    filePath,
                    FileMode.Create
                );

            await file.CopyToAsync(
                stream
            );


            // URL lưu vào SQL
            return
                $"/uploads/posters/{fileName}";
        }


        // =========================
        // XÓA POSTER CŨ
        // =========================

        private void DeleteOldPoster(
            string? posterUrl)
        {
            if (string.IsNullOrWhiteSpace(
                posterUrl))
            {
                return;
            }


            // Chỉ xóa file do backend upload
            if (!posterUrl.StartsWith(
                "/uploads/posters/"))
            {
                return;
            }


            var fileName =
                Path.GetFileName(
                    posterUrl
                );


            if (string.IsNullOrWhiteSpace(
                fileName))
            {
                return;
            }


            var filePath =
                Path.Combine(
                    _environment.WebRootPath,
                    "uploads",
                    "posters",
                    fileName
                );


            if (System.IO.File.Exists(
                filePath))
            {
                System.IO.File.Delete(
                    filePath
                );
            }
        }
    }
}