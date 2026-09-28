namespace CinemaBackend.Models
{
    public class Showtime
    {
        public int ShowtimeId { get; set; }

        public int MovieId { get; set; }

        public int CinemaId { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime? EndTime { get; set; }

        public string RoomName { get; set; } = string.Empty;

        public decimal TicketPrice { get; set; }

        public string Status { get; set; } = "Đang hoạt động";

        public DateTime CreatedAt { get; set; }

        public Movie? Movie { get; set; }

        public Cinema? Cinema { get; set; }
    }
}