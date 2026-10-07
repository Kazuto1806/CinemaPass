namespace CinemaBackend.Models
{
    public class TicketType
    {
        public int TicketTypeId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; }

        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}