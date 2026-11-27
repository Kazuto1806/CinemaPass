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
            CancellationToken cancellationToken,
            IReadOnlyList<SendGridEmailAttachment>? attachments = null);
    }

    public sealed record SendGridEmailAttachment(
        string FileName,
        string ContentType,
        string ContentId,
        byte[] Content);

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
