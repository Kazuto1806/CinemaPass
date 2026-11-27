namespace CinemaBackend.Services
{
    public interface ISendGridEmailSender
    {
        void EnsureConfigured();

        Task SendAsync(
            string toAddress,
            string toName,
            string subject,
            string textBody,
            string htmlBody,
            CancellationToken cancellationToken);
    }

    public sealed class SendGridEmailException : Exception
    {
        public SendGridEmailException(string message)
            : base(message)
        {
        }

        public SendGridEmailException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
