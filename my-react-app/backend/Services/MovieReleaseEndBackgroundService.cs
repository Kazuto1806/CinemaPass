using CinemaBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Services;

public sealed class MovieReleaseEndBackgroundService : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MovieReleaseEndBackgroundService> _logger;

    public MovieReleaseEndBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<MovieReleaseEndBackgroundService> logger)
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
                await EndExpiredMovies(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to end expired movies");
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

    private async Task EndExpiredMovies(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var vietnamTime = DateTimeOffset.UtcNow
            .ToOffset(TimeSpan.FromHours(7))
            .DateTime;

        await dbContext.Movies
            .Where(movie =>
                movie.ReleaseEndDate.HasValue &&
                movie.ReleaseEndDate <= vietnamTime &&
                movie.Status != "Ended")
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(movie => movie.Status, "Ended"),
                cancellationToken);
    }
}
