using System.Threading.Channels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace CinemaBackend.Services
{
    public sealed class PaidTicketEmailQueue : BackgroundService
    {
        private readonly Channel<int> _ticketIds =
            Channel.CreateUnbounded<int>(
                new UnboundedChannelOptions
                {
                    SingleReader = true,
                    SingleWriter = false
                });
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<PaidTicketEmailQueue> _logger;

        public PaidTicketEmailQueue(
            IServiceScopeFactory scopeFactory,
            ILogger<PaidTicketEmailQueue> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public bool Enqueue(int ticketId) =>
            _ticketIds.Writer.TryWrite(ticketId);

        protected override async Task ExecuteAsync(
            CancellationToken stoppingToken)
        {
            await foreach (var ticketId in
                _ticketIds.Reader.ReadAllAsync(stoppingToken))
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var emailService = scope.ServiceProvider
                        .GetRequiredService<ITicketEmailService>();

                    await emailService.SendPaidTicketAsync(
                        ticketId,
                        stoppingToken);
                }
                catch (OperationCanceledException)
                    when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (TicketEmailException exception)
                {
                    _logger.LogError(
                        exception,
                        "Không gửi được email vé cho TicketId {TicketId}.",
                        ticketId);
                }
                catch (Exception exception)
                {
                    _logger.LogError(
                        exception,
                        "Lỗi khi xử lý email vé cho TicketId {TicketId}.",
                        ticketId);
                }
            }
        }
    }
}
