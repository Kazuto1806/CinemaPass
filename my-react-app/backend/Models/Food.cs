namespace CinemaBackend.Models
{
    public class Food
    {
        public int FoodId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal Price { get; set; }

        public string? ImageUrl { get; set; }

        public string Category { get; set; } = "Bắp nước";

        public string Status { get; set; } = "Đang bán";

        public DateTime CreatedAt { get; set; }
    }
}