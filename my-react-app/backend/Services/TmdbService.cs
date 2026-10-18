using System.Net.Http.Headers;
using System.Text.Json;

namespace CinemaBackend.Services;

public class TmdbService
{
    private readonly HttpClient _httpClient;

    public TmdbService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;

        var token = configuration["TMDB:BearerToken"];

        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("Chưa cấu hình TMDB Bearer Token.");
        }

        _httpClient.BaseAddress = new Uri("https://api.themoviedb.org/3/");
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _httpClient.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    }

    // 1. Tìm phim theo từ khóa
    public async Task<JsonElement> SearchMovies(string query, CancellationToken cancellationToken = default)
    {
        var url = $"search/movie?query={Uri.EscapeDataString(query)}&language=vi-VN&page=1";

        using var response = await _httpClient.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);

        return json.RootElement.GetProperty("results").Clone();
    }

    // 2. Lấy video / trailer (Lấy tất cả ngôn ngữ để không bị sót)
    public async Task<JsonElement> GetTrailers(int tmdbMovieId, CancellationToken cancellationToken = default)
    {
        var url = $"movie/{tmdbMovieId}/videos";

        using var response = await _httpClient.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);

        return json.RootElement.GetProperty("results").Clone();
    }
}