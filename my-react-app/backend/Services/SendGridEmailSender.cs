using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace CinemaBackend.Services
{
    public sealed class SendGridEmailSender : ISendGridEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public SendGridEmailSender(
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public void EnsureConfigured()
        {
            _ = GetSettings();
        }

        public async Task SendAsync(
            string toAddress,
            string toName,
            string subject,
            string textBody,
            string htmlBody,
            CancellationToken cancellationToken)
        {
            var settings = GetSettings();
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "https://api.sendgrid.com/v3/mail/send");
            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", settings.ApiKey);
            request.Content = JsonContent.Create(new
            {
                personalizations = new[]
                {
                    new
                    {
                        to = new[]
                        {
                            new { email = toAddress, name = toName }
                        }
                    }
                },
                from = new { email = settings.FromAddress, name = settings.FromName },
                subject,
                content = new[]
                {
                    new { type = "text/plain", value = textBody },
                    new { type = "text/html", value = htmlBody }
                }
            });

            try
            {
                using var response = await _httpClient.SendAsync(
                    request,
                    cancellationToken);
                if (response.StatusCode != HttpStatusCode.Accepted)
                {
                    throw new SendGridEmailException(
                        $"SendGrid rejected the email (HTTP {(int)response.StatusCode}).");
                }
            }
            catch (HttpRequestException exception)
            {
                throw new SendGridEmailException(
                    "Could not connect to SendGrid to send the email.",
                    exception);
            }
        }

        private (string ApiKey, string FromAddress, string FromName) GetSettings()
        {
            var apiKey = _configuration["SendGrid:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                apiKey = _configuration["SENDGRID_API_KEY"];
            }

            var fromAddress = _configuration["Email:FromAddress"];
            if (string.IsNullOrWhiteSpace(apiKey) ||
                string.IsNullOrWhiteSpace(fromAddress))
            {
                throw new SendGridEmailException(
                    "SendGrid is not configured. Set SendGrid__ApiKey and Email__FromAddress.");
            }

            return (
                apiKey,
                fromAddress,
                _configuration["Email:FromName"] ?? "CinemaPass");
        }
    }
}
