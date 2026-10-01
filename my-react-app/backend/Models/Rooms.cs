namespace CinemaBackend.Models
{
    public class Room
    {
        public int RoomId { get; set; }

        public int CinemaId { get; set; }

        public string RoomName { get; set; } = string.Empty;

        public int Capacity { get; set; }

        public string Status { get; set; } =
            "Đang hoạt động";

        public DateTime CreatedAt { get; set; }

        public Cinema? Cinema { get; set; }

        public ICollection<Seat> Seats { get; set; } =
            new List<Seat>();

        public ICollection<Showtime> Showtimes { get; set; } =
            new List<Showtime>();
    }
}