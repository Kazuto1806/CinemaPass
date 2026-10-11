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
                showtime.ShowDate <= today)
            .ToListAsync(cancellationToken);

        var changed = false;

        foreach (var showtime in showtimes)
        {
            showtime.Status = NormalizeShowtimeStatus(showtime.Status);

            var endDateTime =
                showtime.ShowDate.Date.Add(showtime.EndTime);

            if (showtime.EndTime < showtime.StartTime)
            {
                endDateTime = endDateTime.AddDays(1);
            }

            if (showtime.Status != "Đã kết thúc" && endDateTime <= now)
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

    private static string NormalizeShowtimeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "Đang hoạt động";
        }

        var value = status.Trim();
        var lower = value.Replace("Ð", "Đ").ToLowerInvariant();

        if (
            lower.Contains("active") ||
            lower.Contains("dang hoat dong") ||
            lower.Contains("đang hoạt động") ||
            lower.Contains("dang ho?t d?ng") ||
            lower.Contains("dang hot dong") ||
            lower.Contains("hoat dong") ||
            lower.Contains("hoạt động")
        )
        {
            return "Đang hoạt động";
        }

        if (
            lower.Contains("tam ngung") ||
            lower.Contains("tạm ngưng") ||
            lower.Contains("ngung")
        )
        {
            return "Tạm ngưng";
        }

        if (
            lower.Contains("da ket thuc") ||
            lower.Contains("đã kết thúc") ||
            lower.Contains("da kt thuc") ||
            lower.Contains("đã kt thúc") ||
            lower.Contains("ket thuc") ||
            lower.Contains("kết thúc") ||
            lower.Contains("kt thuc") ||
            lower.Contains("kt thúc")
        )
        {
            return "Đã kết thúc";
        }

        return value;
    }
}