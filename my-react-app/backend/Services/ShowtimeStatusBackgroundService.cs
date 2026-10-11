using System.Globalization;
using System.Text;
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

        var cleaned = status
            .Trim()
            .Replace("Ð", "Đ")
            .Replace("?", string.Empty)
            .Replace("_", " ");

        var normalized = cleaned.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var ch in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(ch);
            }
        }

        var candidate = builder.ToString()
            .Replace("đ", "d")
            .Replace("Đ", "D")
            .Replace("-", " ")
            .Replace("/", " ")
            .Replace("\\", " ")
            .Replace(".", " ")
            .Replace(",", " ");

        var lower = string.Join(" ", candidate.Split(
            new[] { ' ', '\t', '\r', '\n' },
            StringSplitOptions.RemoveEmptyEntries)).ToLowerInvariant();

        if (
            lower.Contains("active") ||
            lower.Contains("dang hoat dong") ||
            lower.Contains("dang hot dong") ||
            lower.Contains("hoat dong") ||
            lower.Contains("dang hoat")
        )
        {
            return "Đang hoạt động";
        }

        if (lower.Contains("tam ngung") || lower.Contains("ngung"))
        {
            return "Tạm ngưng";
        }

        if (
            lower.Contains("da ket thuc") ||
            lower.Contains("ket thuc") ||
            lower.Contains("kt thuc") ||
            lower.Contains("da kt thuc") ||
            lower.Contains("thuc")
        )
        {
            return "Đã kết thúc";
        }

        return status.Trim();
    }
}