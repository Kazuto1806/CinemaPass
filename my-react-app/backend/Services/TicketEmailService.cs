using System.Globalization;
using System.Text.Encodings.Web;
using CinemaBackend.Data;
using Microsoft.EntityFrameworkCore;
using QRCoder;

namespace CinemaBackend.Services
{
    public sealed class TicketEmailService : ITicketEmailService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ISendGridEmailSender _emailSender;

        public TicketEmailService(
            AppDbContext context,
            IConfiguration configuration,
            ISendGridEmailSender emailSender)
        {
            _context = context;
            _configuration = configuration;
            _emailSender = emailSender;
        }

        public async Task SendPaidTicketAsync(
            int ticketId,
            CancellationToken cancellationToken = default)
        {
            var ticket = await _context.Tickets
                .AsNoTracking()
                .Include(item => item.User)
                .Include(item => item.Movie)
                .Include(item => item.Seat)
                .Include(item => item.TicketType)
                .Include(item => item.Showtime)
                    .ThenInclude(showtime => showtime!.Room)
                        .ThenInclude(room => room!.Cinema)
                .FirstOrDefaultAsync(
                    item => item.TicketId == ticketId,
                    cancellationToken);

            if (ticket == null)
            {
                throw new TicketEmailException(
                    "Không tìm thấy vé để gửi email.");
            }

            if (string.IsNullOrWhiteSpace(ticket.User?.Email))
            {
                throw new TicketEmailException(
                    "Tài khoản đặt vé chưa có email nhận vé.");
            }

            var frontendUrl = _configuration["Email:FrontendUrl"]?.TrimEnd('/');
            var message = CreateMessage(ticket, frontendUrl);

            try
            {
                await _emailSender.SendAsync(
                    ticket.User.Email,
                    ticket.User.FullName,
                    message.Subject,
                    message.TextBody,
                    message.HtmlBody,
                    cancellationToken,
                    new[]
                    {
                        new SendGridEmailAttachment(
                            "cinemapass-ticket-qr.png",
                            "image/png",
                            "cinemapass-ticket-qr",
                            message.QrCodePng)
                    });
            }
            catch (SendGridEmailException exception)
            {
                throw new TicketEmailException(
                    "SendGrid không gửi được email vé.",
                    exception);
            }
        }

        private static (
            string Subject,
            string TextBody,
            string HtmlBody,
            byte[] QrCodePng) CreateMessage(
            Models.Ticket ticket,
            string? frontendUrl)
        {
            var safeName = HtmlEncoder.Default.Encode(
                ticket.User?.FullName ?? "Quý khách");
            var safeMovieTitle = HtmlEncoder.Default.Encode(
                ticket.Movie?.Title ?? "Phim");
            var safeCinemaName = HtmlEncoder.Default.Encode(
                ticket.Showtime?.Room?.Cinema?.Name ?? "Chưa cập nhật");
            var safeRoomName = HtmlEncoder.Default.Encode(
                ticket.Showtime?.Room?.RoomName ?? "Chưa cập nhật");
            var safeSeatCode = HtmlEncoder.Default.Encode(
                ticket.Seat?.SeatCode ?? "Chưa cập nhật");
            var safeTicketType = HtmlEncoder.Default.Encode(
                ticket.TicketType?.Name ?? "Vé xem phim");
            var safeToken = HtmlEncoder.Default.Encode(ticket.QrCodeToken);
            var showDate = ticket.Showtime?.ShowDate.ToString(
                "dd/MM/yyyy",
                CultureInfo.GetCultureInfo("vi-VN")) ?? "Chưa cập nhật";
            var startTime = ticket.Showtime?.StartTime.ToString(
                @"hh\:mm",
                CultureInfo.InvariantCulture) ?? "Chưa cập nhật";
            var price = ticket.TicketPrice.ToString(
                "N0",
                CultureInfo.GetCultureInfo("vi-VN"));
            var verificationUrl = string.IsNullOrWhiteSpace(frontendUrl)
                ? null
                : $"{frontendUrl}/verify-ticket/{Uri.EscapeDataString(ticket.QrCodeToken)}";

            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(
                verificationUrl ?? ticket.QrCodeToken,
                QRCodeGenerator.ECCLevel.Q);
            var qrCodePng = new PngByteQRCode(qrCodeData).GetGraphic(12);

            var textBody =
                $"Xin chào {ticket.User?.FullName ?? "Quý khách"},\n\n" +
                $"Thanh toán vé xem phim {ticket.Movie?.Title ?? "Phim"} đã được xác nhận.\n" +
                $"Rạp: {ticket.Showtime?.Room?.Cinema?.Name ?? "Chưa cập nhật"}\n" +
                $"Phòng: {ticket.Showtime?.Room?.RoomName ?? "Chưa cập nhật"}\n" +
                $"Suất chiếu: {showDate} - {startTime}\n" +
                $"Ghế: {ticket.Seat?.SeatCode ?? "Chưa cập nhật"}\n" +
                $"Loại vé: {ticket.TicketType?.Name ?? "Vé xem phim"}\n" +
                $"Giá vé: {price} đ\n" +
                $"Mã vé: {ticket.QrCodeToken}\n" +
                (verificationUrl == null
                    ? string.Empty
                    : $"Xem vé điện tử: {verificationUrl}\n") +
                "\nVui lòng xuất trình mã vé cho nhân viên rạp.";

            var htmlBody =
                "<!doctype html><html><body style=\"margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#172033;\">" +
                "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;\">" +
                "<tr><td style=\"padding:28px 32px;background:#111827;color:#ffffff;\">" +
                "<div style=\"font-size:13px;font-weight:700;letter-spacing:2px;color:#c4b5fd;\">CINEMAPASS · VÉ ĐIỆN TỬ</div>" +
                "<h1 style=\"margin:10px 0 0;font-size:24px;line-height:1.3;\">Thanh toán thành công</h1>" +
                "</td></tr>" +
                "<tr><td style=\"padding:28px 32px 8px;\">" +
                $"<p style=\"margin:0 0 8px;color:#475569;\">Xin chào {safeName},</p>" +
                $"<h2 style=\"margin:0;font-size:22px;color:#111827;\">{safeMovieTitle}</h2>" +
                "<p style=\"margin:8px 0 0;color:#64748b;\">Cảm ơn bạn đã đặt vé tại CinemaPass.</p>" +
                "</td></tr>" +
                "<tr><td style=\"padding:20px 32px;\">" +
                "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;\">" +
                $"<tr><td style=\"padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;\">Rạp / Phòng</td><td align=\"right\" style=\"padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:600;\">{safeCinemaName} / {safeRoomName}</td></tr>" +
                $"<tr><td style=\"padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;\">Ngày / Suất chiếu</td><td align=\"right\" style=\"padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:600;\">{showDate} · {startTime}</td></tr>" +
                $"<tr><td style=\"padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;\">Ghế / Loại vé</td><td align=\"right\" style=\"padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:600;\">{safeSeatCode} · {safeTicketType}</td></tr>" +
                $"<tr><td style=\"padding:10px 0;color:#64748b;\">Tổng tiền</td><td align=\"right\" style=\"padding:10px 0;font-weight:700;color:#6d28d9;\">{price} đ</td></tr>" +
                "</table></td></tr>" +
                "<tr><td align=\"center\" style=\"padding:8px 32px 24px;\">" +
                "<div style=\"display:inline-block;padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;\">" +
                "<img src=\"cid:cinemapass-ticket-qr\" width=\"180\" height=\"180\" alt=\"Mã QR vé CinemaPass\" style=\"display:block;width:180px;height:180px;border:0;\" />" +
                "</div>" +
                (verificationUrl == null
                    ? "<p style=\"margin:12px 0 0;color:#64748b;font-size:13px;\">Quét mã QR để lấy mã vé và xuất trình tại rạp</p>"
                    : "<p style=\"margin:12px 0 0;color:#64748b;font-size:13px;\">Quét mã QR để mở thông tin vé</p>") +
                $"<p style=\"margin:8px 0 0;color:#334155;font-size:13px;\">Mã vé: <strong>{safeToken}</strong></p>" +
                "</td></tr>" +
                (verificationUrl == null
                    ? string.Empty
                    : "<tr><td align=\"center\" style=\"padding:0 32px 28px;\">" +
                      $"<a href=\"{HtmlEncoder.Default.Encode(verificationUrl)}\" style=\"display:inline-block;padding:13px 22px;border-radius:8px;background:#6d28d9;color:#ffffff;text-decoration:none;font-weight:700;\">MỞ VÉ ĐIỆN TỬ</a>" +
                      "</td></tr>") +
                "<tr><td style=\"padding:18px 32px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6;\">" +
                "Vui lòng lưu email này và xuất trình mã QR cho nhân viên rạp. Nếu bạn không thực hiện giao dịch này, hãy liên hệ bộ phận hỗ trợ CinemaPass." +
                "</td></tr></table></body></html>";

            return (
                $"Mã vé CinemaPass - {ticket.Movie?.Title ?? "Vé xem phim"}",
                textBody,
                htmlBody,
                qrCodePng);
        }
    }
}
