namespace CinemaBackend.Services
{
    public interface IPasswordResetService
    {
        Task RequestCodeAsync(string email, CancellationToken cancellationToken);

        Task<bool> ResetPasswordAsync(
            string email,
            string code,
            string newPassword,
            CancellationToken cancellationToken);
    }

    public sealed class PasswordResetEmailException : Exception
    {
        public PasswordResetEmailException(string message)
            : base(message)
        {
        }

        public PasswordResetEmailException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
