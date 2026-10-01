using System.ComponentModel.DataAnnotations.Schema;

namespace CinemaBackend.Models
{
    public class Showtime
    {
        public int ShowtimeId { get; set; }

        public int MovieId { get; set; }

        public int RoomId { get; set; }

        public DateTime ShowDate { get; set; }

        public TimeSpan StartTime { get; set; }

        public TimeSpan EndTime { get; set; }

        public decimal TicketPrice { get; set; }

        public string Status { get; set; } = "Đang hoạt động";

        public DateTime CreatedAt { get; set; }

        // Navigation
        [ForeignKey(nameof(MovieId))]
        public Movie? Movie { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }
    }
}