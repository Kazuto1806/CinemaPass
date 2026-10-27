using System.ComponentModel.DataAnnotations.Schema;

namespace CinemaBackend.Models
{
    public class Ticket
    {
        public int TicketId { get; set; }

        public int UserId { get; set; }

        public int MovieId { get; set; }

        public int ShowtimeId { get; set; }

        public int SeatId { get; set; }

        public int? TicketTypeId { get; set; }

        public decimal TicketPrice { get; set; }

        public string Status { get; set; } = "Đã đặt";

        public string PaymentStatus { get; set; } = "Chưa thanh toán";

        public string? PaymentMethod { get; set; }

        public string? PaymentTransactionId { get; set; }

        public DateTime CreatedAt { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        [ForeignKey(nameof(MovieId))]
        public Movie? Movie { get; set; }

        [ForeignKey(nameof(ShowtimeId))]
        public Showtime? Showtime { get; set; }

        [ForeignKey(nameof(SeatId))]
        public Seat? Seat { get; set; }

        [ForeignKey(nameof(TicketTypeId))]
        public TicketType? TicketType { get; set; }
    }
}