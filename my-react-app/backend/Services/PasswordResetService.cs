using System.Globalization;
using System.Security.Cryptography;
using System.Text.Encodings.Web;
using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Services
{
    public sealed class PasswordResetService : IPasswordResetService
    {
        private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(10);
        private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);
        private const int MaximumFailedAttempts = 5;

        private readonly AppDbContext _context;
        private readonly ISendGridEmailSender _emailSender;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public PasswordResetService(
            AppDbContext context,
            ISendGridEmailSender emailSender)
        {
            _context = context;
            _emailSender = emailSender;
        }

        public async Task RequestCodeAsync(
            string email,
            CancellationToken cancellationToken)
        {
            try
            {
                _emailSender.EnsureConfigured();
            }
            catch (SendGridEmailException exception)
            {
                throw new PasswordResetEmailException(
                    exception.Message,
                    exception);
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(
                    item => item.Email == email.Trim(),
                    cancellationToken);

            if (user == null)
            {
                return;
            }

            var now = DateTimeOffset.UtcNow;
            if (user.PasswordResetLastSentAtUtc is { } lastSentAt &&
                now - lastSentAt < ResendCooldown)
            {
                return;
            }

            var code = RandomNumberGenerator
                .GetInt32(0, 1_000_000)
                .ToString("D6", CultureInfo.InvariantCulture);

            user.PasswordResetCodeHash =
                _passwordHasher.HashPassword(user, code);
            user.PasswordResetCodeExpiresAtUtc = now.Add(CodeLifetime);
            user.PasswordResetLastSentAtUtc = now;
            user.PasswordResetFailedAttempts = 0;
            await _context.SaveChangesAsync(cancellationToken);

            await SendCodeEmailAsync(user, code, cancellationToken);
        }

        public async Task<bool> ResetPasswordAsync(
            string email,
            string code,
            string newPassword,
            CancellationToken cancellationToken)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(
                    item => item.Email == email.Trim(),
                    cancellationToken);

            if (user?.PasswordResetCodeHash == null ||
                user.PasswordResetCodeExpiresAtUtc is not { } expiresAt ||
                expiresAt <= DateTimeOffset.UtcNow ||
                user.PasswordResetFailedAttempts >= MaximumFailedAttempts)
            {
                return false;
            }

            var verificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordResetCodeHash,
                code);

            if (verificationResult == PasswordVerificationResult.Failed)
            {
                user.PasswordResetFailedAttempts++;
                if (user.PasswordResetFailedAttempts >= MaximumFailedAttempts)
                {
                    ClearResetCode(user);
                }

                await _context.SaveChangesAsync(cancellationToken);
                return false;
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
            ClearResetCode(user);
            user.PasswordResetLastSentAtUtc = null;
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }

        private async Task SendCodeEmailAsync(
            User user,
            string code,
            CancellationToken cancellationToken)
        {
            var safeName = HtmlEncoder.Default.Encode(user.FullName);
            var textBody =
                $"Xin chào {user.FullName},\n\n" +
                $"Mã đặt lại mật khẩu của bạn là: {code}\n" +
                "Mã có hiệu lực trong 10 phút và chỉ sử dụng được một lần.\n\n" +
                "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.";
            var htmlBody =
                $"<p>Xin chào {safeName},</p>" +
                $"<p>Mã đặt lại mật khẩu CinemaPass của bạn là " +
                $"<strong>{code}</strong>.</p>" +
                "<p>Mã có hiệu lực trong 10 phút và chỉ sử dụng được một lần.</p>" +
                "<p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>";

            try
            {
                await _emailSender.SendAsync(
                    user.Email,
                    user.FullName,
                    "Mã đặt lại mật khẩu CinemaPass",
                    textBody,
                    htmlBody,
                    cancellationToken);
            }
            catch (SendGridEmailException exception)
            {
                throw new PasswordResetEmailException(
                    "SendGrid không gửi được email đặt lại mật khẩu.",
                    exception);
            }
        }

        private static void ClearResetCode(User user)
        {
            user.PasswordResetCodeHash = null;
            user.PasswordResetCodeExpiresAtUtc = null;
            user.PasswordResetFailedAttempts = 0;
        }
    }
}
