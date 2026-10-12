namespace CinemaBackend.Models
{
    public class ShowtimeTicketType
    {
        public int ShowtimeId { get; set; }

        public int TicketTypeId { get; set; }

        public decimal Price { get; set; }

        public Showtime? Showtime { get; set; }

        public TicketType? TicketType { get; set; }
    }

    public sealed record ShowtimeTicketTypeInput
    {
        public int TicketTypeId { get; init; }

        public decimal Price { get; init; }
    }
}