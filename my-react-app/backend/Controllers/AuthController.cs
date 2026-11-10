
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthController(
            AppDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // =====================================================
        // POST: api/auth/register
        // Đăng ký tài khoản và băm mật khẩu trước khi lưu.
        // =====================================================

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(
            [FromBody] RegisterRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu đăng ký không hợp lệ."
                });
            }

            var email = request.Email?.Trim();
            var password = request.PasswordHash;

            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(password) ||
                string.IsNullOrWhiteSpace(request.Phone))
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

            var user = new User
            {
                Email = email,
                FullName = request.FullName.Trim(),
                Phone = request.Phone.Trim(),
                Role = "Customer"
            };

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
        [AllowAnonymous]
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

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                message = "Đăng nhập thành công.",
                accessToken = token,
                userId = user.UserId,
                fullName = user.FullName,
                email = user.Email,
                phone = user.Phone,
                role = user.Role
            });
        }

        private string GenerateJwtToken(User user)
        {
            var key = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException(
                    "Chưa cấu hình Jwt:Key."
                );
            var issuer = _configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException(
                    "Chưa cấu hình Jwt:Issuer."
                );
            var audience = _configuration["Jwt:Audience"]
                ?? throw new InvalidOperationException(
                    "Chưa cấu hình Jwt:Audience."
                );

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256
            );
            var token = new JwtSecurityToken(
                issuer,
                audience,
                claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
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
        [Authorize(Roles = "Admin")]
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

    public class RegisterRequest
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}
