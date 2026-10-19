using CinemaBackend.Data;
using CinemaBackend.Models;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BannersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Cloudinary? _cloudinary;

        public BannersController(
            AppDbContext context,
            IConfiguration configuration)
        {
            _context = context;

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
                _cloudinary = new Cloudinary(new Account(
                    cloudName,
                    apiKey,
                    apiSecret))
                {
                    Api = { Secure = true }
                };
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetBanners()
        {
            var banners = await _context.Banners
                .OrderBy(banner => banner.DisplayOrder)
                .ThenBy(banner => banner.BannerId)
                .ToListAsync();

            return Ok(banners);
        }

        [HttpPost]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> CreateBanner(
            IFormFile? imageFile,
            [FromForm] string? altText)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn hình banner." });
            }

            if (string.IsNullOrWhiteSpace(imageFile.ContentType) ||
                !imageFile.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "File tải lên phải là hình ảnh." });
            }

            if (imageFile.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new { message = "Hình banner không được vượt quá 10MB." });
            }

            if (_cloudinary == null)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Backend chưa được cấu hình Cloudinary để tải ảnh lên."
                });
            }

            await using var stream = imageFile.OpenReadStream();
            var upload = await _cloudinary.UploadAsync(new ImageUploadParams
            {
                File = new FileDescription(imageFile.FileName, stream),
                Folder = "cinemapass/banners"
            });

            if (upload.Error != null || upload.SecureUrl == null)
            {
                return StatusCode(StatusCodes.Status502BadGateway, new
                {
                    message = upload.Error?.Message ?? "Không thể tải hình banner lên."
                });
            }

            var banner = new Banner
            {
                ImageUrl = upload.SecureUrl.ToString(),
                AltText = string.IsNullOrWhiteSpace(altText)
                    ? "Banner Cinema Pass"
                    : altText.Trim(),
                DisplayOrder = await _context.Banners.CountAsync()
            };

            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBanners), new { id = banner.BannerId }, banner);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteBanner(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null)
            {
                return NotFound(new { message = "Không tìm thấy banner." });
            }

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
