using CinemaBackend.Data;
using CinemaBackend.Models;
using CinemaBackend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CinemaBackend.Controllers;

[ApiController]
[Route("api/tmdb")]
public class TmdbController : ControllerBase
{
    private readonly TmdbService _tmdbService;
    private readonly AppDbContext _context;

    public TmdbController(TmdbService tmdbService, AppDbContext context)
    {
        _tmdbService = tmdbService;
        _context = context;
    }

    // 1. Tìm kiếm phim trên TMDB
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string query,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Vui lòng nhập tên phim." });
        }

        try
        {
            var results = await _tmdbService.SearchMovies(query, cancellationToken);
            return Ok(results);
        }
        catch (HttpRequestException)
        {
            return StatusCode(502, new { message = "Không thể kết nối TMDB." });
        }
    }

    // 2. Lấy danh sách trailer của một phim theo TMDB Movie ID
    [HttpGet("movies/{id:int}/trailers")]
    public async Task<IActionResult> Trailers(
        int id,
        CancellationToken cancellationToken)
    {
        try
        {
            var results = await _tmdbService.GetTrailers(id, cancellationToken);

            var trailers = results
                .EnumerateArray()
                .Where(v =>
                    v.TryGetProperty("site", out var site) &&
                    site.GetString() == "YouTube" &&
                    v.TryGetProperty("type", out var type) &&
                    type.GetString() == "Trailer" &&
                    v.TryGetProperty("key", out var key) &&
                    !string.IsNullOrWhiteSpace(key.GetString()))
                .Select(v => new
                {
                    key = v.GetProperty("key").GetString(),
                    name = v.TryGetProperty("name", out var name) ? name.GetString() : null,
                    language = v.TryGetProperty("iso_639_1", out var language) ? language.GetString() : null,
                    official = v.TryGetProperty("official", out var official) && official.ValueKind == JsonValueKind.True
                })
                .OrderByDescending(v => v.official)
                .ToList();

            return Ok(trailers);
        }
        catch (HttpRequestException)
        {
            return StatusCode(502, new { message = "Không thể lấy trailer từ TMDB." });
        }
    }

    // 3. Tự động tìm và cập nhật trailer cho toàn bộ phim chưa có trailer trong SQL Server
    [HttpGet("auto-sync-trailers")]
    public async Task<IActionResult> AutoSyncTrailers(CancellationToken cancellationToken)
    {
        // Lấy danh sách các phim chưa có TrailerUrl
        var moviesWithoutTrailer = await _context.Movies
            .Where(m => string.IsNullOrEmpty(m.TrailerUrl))
            .ToListAsync(cancellationToken);

        if (!moviesWithoutTrailer.Any())
        {
            return Ok(new { message = "Tất cả các phim trong cơ sở dữ liệu đều đã có trailer!" });
        }

        int successCount = 0;
        var syncLogs = new List<object>();

        foreach (var movie in moviesWithoutTrailer)
        {
            try
            {
                // Tìm kiếm theo tiêu đề phim
                var searchResults = await _tmdbService.SearchMovies(movie.Title, cancellationToken);
                var firstMovie = searchResults.EnumerateArray().FirstOrDefault();

                if (firstMovie.ValueKind != JsonValueKind.Undefined && firstMovie.TryGetProperty("id", out var idProp))
                {
                    int tmdbId = idProp.GetInt32();

                    // Lấy trailer từ TMDB
                    var videoResults = await _tmdbService.GetTrailers(tmdbId, cancellationToken);

                    // Lấy trailer từ TMDB: ưu tiên Trailer -> Teaser -> Clip khác trên YouTube
                    var trailer = videoResults.EnumerateArray()
                        .Where(v =>
                            v.TryGetProperty("site", out var site) && site.GetString() == "YouTube" &&
                            v.TryGetProperty("key", out var key) && !string.IsNullOrWhiteSpace(key.GetString()))
                        .OrderByDescending(v => v.TryGetProperty("type", out var t) && t.GetString() == "Trailer")
                        .ThenByDescending(v => v.TryGetProperty("official", out var off) && off.ValueKind == JsonValueKind.True)
                        .ThenByDescending(v => v.TryGetProperty("type", out var t) && t.GetString() == "Teaser")
                        .FirstOrDefault();

                    if (trailer.ValueKind != JsonValueKind.Undefined)
                    {
                        string videoKey = trailer.GetProperty("key").GetString()!;
                        movie.TrailerUrl = $"https://www.youtube.com/watch?v={videoKey}";
                        successCount++;

                        syncLogs.Add(new { title = movie.Title, status = "Thành công", key = videoKey });
                    }
                    else
                    {
                        syncLogs.Add(new { title = movie.Title, status = "TMDB không có video trailer YouTube" });
                    }
                }
                else
                {
                    syncLogs.Add(new { title = movie.Title, status = "Không tìm thấy phim trên TMDB" });
                }

                // Tránh gửi request quá dồn dập tới TMDB
                await Task.Delay(150, cancellationToken);
            }
            catch (Exception ex)
            {
                syncLogs.Add(new { title = movie.Title, status = "Lỗi", error = ex.Message });
            }
        }

        // Lưu vào SQL Server
        if (successCount > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Ok(new
        {
            message = $"Đã cập nhật trailer thành công cho {successCount}/{moviesWithoutTrailer.Count} phim.",
            details = syncLogs
        });
    }
}