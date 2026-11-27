using System.Globalization;
using System.Text.Encodings.Web;
using CinemaBackend.Data;
using Microsoft.EntityFrameworkCore;

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
                    cancellationToken);
            }
            catch (SendGridEmailException exception)
            {
                throw new TicketEmailException(
                    "SendGrid không gửi được email vé.",
                    exception);
            }
        }

        private static (string Subject, string TextBody, string HtmlBody) CreateMessage(
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
                    : $"Xem vé: {verificationUrl}\n") +
                "\nVui lòng xuất trình mã vé cho nhân viên rạp.";

            var htmlBody =
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

            return (
                $"Mã vé CinemaPass - {ticket.Movie?.Title ?? "Vé xem phim"}",
                textBody,
                htmlBody);
        }
    }
}
