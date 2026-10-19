namespace CinemaBackend.Models
{
    public class Banner
    {
        public int BannerId { get; set; }

        public string ImageUrl { get; set; } = string.Empty;

        public string AltText { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
