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
                $"Mã đặt lại mật khẩu CinemaPass của bạn: {code}\n\n" +
                "Mã có hiệu lực trong 10 phút và chỉ sử dụng được một lần. " +
                "Không chia sẻ mã này với bất kỳ ai.\n\n" +
                "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.";
            var htmlBody =
                "<!doctype html><html><body style=\"margin:0;padding:28px 16px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033;\">" +
                "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;\">" +
                "<tr><td style=\"padding:26px 32px;background:#111827;color:#ffffff;\">" +
                "<div style=\"font-size:13px;font-weight:700;letter-spacing:2px;color:#c4b5fd;\">CINEMAPASS</div>" +
                "<h1 style=\"margin:10px 0 0;font-size:23px;line-height:1.35;\">Đặt lại mật khẩu</h1>" +
                "</td></tr>" +
                "<tr><td style=\"padding:30px 32px 10px;\">" +
                $"<p style=\"margin:0 0 12px;color:#334155;\">Xin chào {safeName},</p>" +
                "<p style=\"margin:0;color:#475569;line-height:1.7;\">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CinemaPass của bạn. Nhập mã xác minh bên dưới để tiếp tục:</p>" +
                "</td></tr>" +
                "<tr><td align=\"center\" style=\"padding:20px 32px 24px;\">" +
                $"<div style=\"display:inline-block;min-width:220px;padding:18px 24px;border:1px solid #ddd6fe;border-radius:12px;background:#f5f3ff;color:#5b21b6;font-size:32px;font-weight:700;letter-spacing:9px;text-align:center;\">{code}</div>" +
                "<p style=\"margin:14px 0 0;color:#64748b;font-size:13px;\">Mã có hiệu lực trong <strong>10 phút</strong> và chỉ sử dụng được một lần.</p>" +
                "</td></tr>" +
                "<tr><td style=\"padding:0 32px 28px;\">" +
                "<div style=\"padding:14px 16px;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:13px;line-height:1.6;\">" +
                "<strong>Lưu ý bảo mật:</strong> Không chia sẻ mã này với bất kỳ ai. CinemaPass sẽ không yêu cầu bạn cung cấp mã qua điện thoại hoặc tin nhắn." +
                "</div>" +
                "<p style=\"margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.6;\">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu hiện tại của bạn vẫn được giữ nguyên.</p>" +
                "</td></tr>" +
                "<tr><td align=\"center\" style=\"padding:16px 24px;background:#f8fafc;color:#94a3b8;font-size:12px;\">Email tự động từ CinemaPass · Vui lòng không trả lời email này</td></tr>" +
                "</table></body></html>";

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
