namespace CinemaBackend.Services
{
    public interface ITicketEmailService
    {
        Task SendPaidTicketAsync(
            int ticketId,
            CancellationToken cancellationToken = default);
    }

    public sealed class TicketEmailException : Exception
    {
        public TicketEmailException(string message)
            : base(message)
        {
        }

        public TicketEmailException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
