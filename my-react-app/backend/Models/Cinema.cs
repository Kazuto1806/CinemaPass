namespace CinemaBackend.Models
{
    public class Cinema
    {
        public int CinemaId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string Status { get; set; } = "Đang hoạt động";

        public DateTime CreatedAt { get; set; }
    }
}