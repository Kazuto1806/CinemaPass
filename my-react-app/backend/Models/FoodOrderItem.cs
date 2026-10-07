using System.ComponentModel.DataAnnotations.Schema;

namespace CinemaBackend.Models
{
    public class FoodOrderItem
    {
        public int FoodOrderItemId { get; set; }

        public int FoodOrderId { get; set; }

        public int FoodId { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        [ForeignKey(nameof(FoodOrderId))]
        public FoodOrder? FoodOrder { get; set; }

        [ForeignKey(nameof(FoodId))]
        public Food? Food { get; set; }
    }
}