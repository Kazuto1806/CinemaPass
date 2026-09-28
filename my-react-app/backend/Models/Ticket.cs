namespace CinemaBackend.Models
{
    public class Ticket
    {
        public int TicketId { get; set; }

        public int UserId { get; set; }

        public int MovieId { get; set; }

        public string SeatNumber { get; set; } = string.Empty;

        public DateTime Showtime { get; set; }

        public decimal TicketPrice { get; set; }

        public string Status { get; set; } = "Đã đặt";

        public DateTime CreatedAt { get; set; }

        // Quan hệ với User
        public User? User { get; set; }

        // Quan hệ với Movie
        public Movie? Movie { get; set; }
    }
}