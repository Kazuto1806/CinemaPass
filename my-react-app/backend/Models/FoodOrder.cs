using System.ComponentModel.DataAnnotations.Schema;

namespace CinemaBackend.Models
{
    public class FoodOrder
    {
        public int FoodOrderId { get; set; }

        public int UserId { get; set; }

        public decimal TotalAmount { get; set; }

        public string Status { get; set; } = "Chờ xử lý";

        public DateTime CreatedAt { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public ICollection<FoodOrderItem> Items { get; set; }
            = new List<FoodOrderItem>();
    }
}