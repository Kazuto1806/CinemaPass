using CinemaBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Services;

public sealed class ShowtimeStatusBackgroundService : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ShowtimeStatusBackgroundService> _logger;

    public ShowtimeStatusBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<ShowtimeStatusBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdateFinishedShowtimes(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Failed to update finished showtimes"
                );
            }

            try
            {
                await Task.Delay(CheckInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
        }
    }

    private async Task UpdateFinishedShowtimes(
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var today = DateTime.Today;
        var now = DateTime.Now;

        var showtimes = await dbContext.Showtimes
            .Where(showtime =>
                showtime.Status != "Đã kết thúc" &&
                showtime.ShowDate <= today)
            .ToListAsync(cancellationToken);

        var changed = false;

        foreach (var showtime in showtimes)
        {
            var endDateTime =
                showtime.ShowDate.Date.Add(showtime.EndTime);

            if (showtime.EndTime < showtime.StartTime)
            {
                endDateTime = endDateTime.AddDays(1);
            }

            if (endDateTime <= now)
            {
                showtime.Status = "Đã kết thúc";
                changed = true;
            }
        }

        if (changed)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}