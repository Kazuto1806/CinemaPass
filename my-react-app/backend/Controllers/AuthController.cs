
using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // =====================================================
        // POST: api/auth/register
        // Đăng ký tài khoản và băm mật khẩu trước khi lưu.
        // =====================================================

        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] User user)
        {
            if (user == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu đăng ký không hợp lệ."
                });
            }

            var email = user.Email?.Trim();
            var password = user.PasswordHash;

            if (string.IsNullOrWhiteSpace(user.FullName) ||
                string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(password) ||
                string.IsNullOrWhiteSpace(user.Phone))
            {
                return BadRequest(new
                {
                    message =
                        "Vui lòng nhập đầy đủ họ tên, email, mật khẩu và số điện thoại."
                });
            }

            if (password.Length < 8)
            {
                return BadRequest(new
                {
                    message = "Mật khẩu phải có ít nhất 8 ký tự."
                });
            }

            var existingUser = await _context.Users
                .AnyAsync(u => u.Email == email);

            if (existingUser)
            {
                return Conflict(new
                {
                    message = "Email đã được sử dụng."
                });
            }

            user.Email = email;
            user.FullName = user.FullName.Trim();
            user.Phone = user.Phone.Trim();

            // Người đăng ký mới không được tự đặt quyền quản trị.
            user.Role = "Customer";

            // Không lưu mật khẩu gốc.
            user.PasswordHash = _passwordHasher.HashPassword(
                user,
                password
            );

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký thành công.",
                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone,
                role = user.Role
            });
        }

        // =====================================================
        // POST: api/auth/login
        // Hỗ trợ hash mới và chuyển đổi mật khẩu cũ khi hợp lệ.
        // =====================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new
                {
                    message = "Vui lòng nhập email và mật khẩu."
                });
            }

            var email = request.Email.Trim();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Email hoặc mật khẩu không đúng."
                });
            }

            var storedPassword = user.PasswordHash ?? string.Empty;

            // Phân biệt hash chuẩn của ASP.NET Identity
            // với mật khẩu cũ được lưu dạng chữ thường.
            if (!IsAspNetIdentityHash(storedPassword))
            {
                var legacyPasswordMatches = string.Equals(
                    storedPassword,
                    request.Password,
                    StringComparison.Ordinal
                );

                if (!legacyPasswordMatches)
                {
                    return Unauthorized(new
                    {
                        message = "Email hoặc mật khẩu không đúng."
                    });
                }

                // Mật khẩu cũ đúng: chuyển sang dạng hash.
                user.PasswordHash = _passwordHasher.HashPassword(
                    user,
                    request.Password
                );

                await _context.SaveChangesAsync();
            }
            else
            {
                var verificationResult =
                    _passwordHasher.VerifyHashedPassword(
                        user,
                        storedPassword,
                        request.Password
                    );

                if (verificationResult ==
                    PasswordVerificationResult.Failed)
                {
                    return Unauthorized(new
                    {
                        message = "Email hoặc mật khẩu không đúng."
                    });
                }

                if (verificationResult ==
                    PasswordVerificationResult.SuccessRehashNeeded)
                {
                    user.PasswordHash = _passwordHasher.HashPassword(
                        user,
                        request.Password
                    );

                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new
            {
                message = "Đăng nhập thành công.",
                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone,
                role = user.Role
            });
        }

        // =====================================================
        // Nhận diện định dạng hash của ASP.NET Identity.
        // V2: 49 byte, bắt đầu bằng 0x00.
        // V3: tối thiểu 61 byte, bắt đầu bằng 0x01.
        // =====================================================

        private static bool IsAspNetIdentityHash(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            try
            {
                var bytes = Convert.FromBase64String(value);

                if (bytes.Length == 49 && bytes[0] == 0x00)
                {
                    return true;
                }

                if (bytes.Length >= 61 && bytes[0] == 0x01)
                {
                    return true;
                }

                return false;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        // =====================================================
        // GET: api/auth/user/{id}
        // Không trả PasswordHash về frontend.
        // =====================================================

        [HttpGet("user/{id:int}")]
        public async Task<IActionResult> GetUser(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new
                {
                    message = "UserId không hợp lệ."
                });
            }

            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserId == id)
                .Select(u => new
                {
                    userId = u.UserId,
                    fullName = u.FullName,
                    email = u.Email,
                    phone = u.Phone,
                    role = u.Role
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy người dùng."
                });
            }

            return Ok(user);
        }

        // =====================================================
        // GET: api/auth/users/count
        // =====================================================

        [HttpGet("users/count")]
        public async Task<IActionResult> GetUsersCount()
        {
            var totalUsers = await _context.Users.CountAsync();

            return Ok(new
            {
                totalUsers
            });
        }
    }

    // =====================================================
    // LOGIN REQUEST
    // =====================================================

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}
