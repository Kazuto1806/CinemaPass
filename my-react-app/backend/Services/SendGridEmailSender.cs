using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

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
            CancellationToken cancellationToken,
            IReadOnlyList<SendGridEmailAttachment>? attachments = null)
        {
            var settings = GetSettings();
            var sendGridAttachments = attachments?
                .Select(attachment => new SendGridAttachmentPayload(
                    Convert.ToBase64String(attachment.Content),
                    attachment.ContentType,
                    attachment.FileName,
                    "inline",
                    attachment.ContentId))
                .ToArray();

            var payload = new Dictionary<string, object?>
            {
                ["personalizations"] = new[]
                {
                    new
                    {
                        to = new[]
                        {
                            new { email = toAddress, name = toName }
                        }
                    }
                },
                ["from"] = new { email = settings.FromAddress, name = settings.FromName },
                ["subject"] = subject,
                ["content"] = new[]
                {
                    new { type = "text/plain", value = textBody },
                    new { type = "text/html", value = htmlBody }
                }
            };

            if (sendGridAttachments is { Length: > 0 })
            {
                payload["attachments"] = sendGridAttachments;
            }

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "https://api.sendgrid.com/v3/mail/send");
            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", settings.ApiKey);
            request.Content = JsonContent.Create(payload);

            try
            {
                using var response = await _httpClient.SendAsync(
                    request,
                    cancellationToken);
                if (response.StatusCode != HttpStatusCode.Accepted)
                {
                    var errorBody = await response.Content.ReadAsStringAsync(
                        cancellationToken);
                    if (errorBody.Length > 2000)
                    {
                        errorBody = errorBody[..2000];
                    }

                    var details = string.IsNullOrWhiteSpace(errorBody)
                        ? string.Empty
                        : $" Response: {errorBody}";
                    throw new SendGridEmailException(
                        $"SendGrid rejected the email (HTTP {(int)response.StatusCode}).{details}");
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

        private sealed record SendGridAttachmentPayload(
            string Content,
            string Type,
            string Filename,
            string Disposition,
            [property: JsonPropertyName("content_id")] string ContentId);
    }
}