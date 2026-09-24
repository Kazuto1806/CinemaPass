using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // =========================
        // ĐĂNG KÝ
        // =========================

        [HttpPost("register")]
        public async Task<IActionResult> Register(User user)
        {
            // Kiểm tra email đã tồn tại
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == user.Email);

            if (existingUser != null)
            {
                return BadRequest(new
                {
                    message = "Email đã được sử dụng"
                });
            }

            // Người đăng ký luôn là Customer
            user.Role = "Customer";

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký thành công",
                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone,
                role = user.Role
            });
        }


        // =========================
        // ĐĂNG NHẬP
        // =========================

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x =>
                    x.Email == request.Email &&
                    x.PasswordHash == request.Password);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Email hoặc mật khẩu không đúng"
                });
            }

            return Ok(new
            {
                message = "Đăng nhập thành công",
                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone,
                role = user.Role
            });
        }


        // =========================
        // LẤY THÔNG TIN USER TỪ SQL
        // =========================

        [HttpGet("user/{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            // Tìm user trong SQL Server theo UserId
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy người dùng"
                });
            }

            // Trả dữ liệu từ SQL Server về React
            return Ok(new
            {
                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone,
                role = user.Role
            });
        }
        // =========================
// ĐẾM SỐ NGƯỜI DÙNG
// GET: /api/Auth/users/count
// =========================

[HttpGet("users/count")]
public async Task<IActionResult> GetUsersCount()
{
    var totalUsers =
        await _context.Users.CountAsync();

    return Ok(new
    {
        totalUsers = totalUsers
    });
}
    }


    // =========================
    // LOGIN REQUEST
    // =========================

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}