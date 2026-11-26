using System.Globalization;
using System.Net.Sockets;
using System.Text.Encodings.Web;
using CinemaBackend.Data;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using MimeKit;

namespace CinemaBackend.Services
{
    public sealed class TicketEmailService : ITicketEmailService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public TicketEmailService(
            AppDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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

            var smtpHost = _configuration["Email:Smtp:Host"] ?? "smtp.gmail.com";
            var smtpPort = _configuration.GetValue<int?>("Email:Smtp:Port") ?? 587;
            var smtpUsername = _configuration["Email:Smtp:Username"];
            var smtpAppPassword = _configuration["Email:Smtp:AppPassword"]
                ?.Replace(" ", string.Empty);
            var fromAddress = _configuration["Email:FromAddress"] ?? smtpUsername;
            var fromName = _configuration["Email:FromName"] ?? "CinemaPass";
            var frontendUrl = _configuration["Email:FrontendUrl"]?.TrimEnd('/');

            if (string.IsNullOrWhiteSpace(smtpUsername) ||
                string.IsNullOrWhiteSpace(smtpAppPassword) ||
                string.IsNullOrWhiteSpace(fromAddress))
            {
                throw new TicketEmailException(
                    "Chưa cấu hình Gmail SMTP. Hãy thiết lập Email__Smtp__Username, " +
                    "Email__Smtp__AppPassword.");
            }

            var message = CreateMessage(
                ticket,
                fromAddress,
                fromName,
                frontendUrl);

            try
            {
                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(
                    smtpHost,
                    smtpPort,
                    SecureSocketOptions.StartTls,
                    cancellationToken);
                await smtp.AuthenticateAsync(
                    smtpUsername,
                    smtpAppPassword,
                    cancellationToken);
                await smtp.SendAsync(message, cancellationToken);
                await smtp.DisconnectAsync(true, cancellationToken);
            }
            catch (Exception exception) when (
                exception is System.Security.Authentication.AuthenticationException ||
                exception is MailKit.Security.AuthenticationException ||
                exception is IOException ||
                exception is SocketException ||
                exception is SmtpCommandException ||
                exception is SmtpProtocolException)
            {
                throw new TicketEmailException(
                    "Gmail không gửi được email vé. Hãy kiểm tra cấu hình SMTP.",
                    exception);
            }
        }

        private static MimeMessage CreateMessage(
            Models.Ticket ticket,
            string fromAddress,
            string fromName,
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

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromAddress));
            message.To.Add(new MailboxAddress(
                ticket.User?.FullName ?? string.Empty,
                ticket.User!.Email));
            message.Subject = $"Mã vé CinemaPass - {ticket.Movie?.Title ?? "Vé xem phim"}";

            var body = new BodyBuilder
            {
                TextBody =
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
                        : $"Xem vé: {verificationUrl}\n") +
                    "\nVui lòng xuất trình mã vé cho nhân viên rạp."
            };

            body.HtmlBody =
                $"<p>Xin chào {safeName},</p>" +
                $"<p>Thanh toán vé xem phim <strong>{safeMovieTitle}</strong> đã được xác nhận.</p>" +
                "<ul>" +
                $"<li>Rạp: {safeCinemaName}</li>" +
                $"<li>Phòng: {safeRoomName}</li>" +
                $"<li>Suất chiếu: {showDate} - {startTime}</li>" +
                $"<li>Ghế: {safeSeatCode}</li>" +
                $"<li>Loại vé: {safeTicketType}</li>" +
                $"<li>Giá vé: {price} đ</li>" +
                "</ul>" +
                $"<p>Mã vé: <strong>{safeToken}</strong></p>" +
                (verificationUrl == null
                    ? string.Empty
                    : $"<p><a href=\"{HtmlEncoder.Default.Encode(verificationUrl)}\">Mở vé điện tử</a></p>") +
                "<p>Vui lòng xuất trình mã vé cho nhân viên rạp.</p>";

            message.Body = body.ToMessageBody();
            return message;
        }
    }
}
