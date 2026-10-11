using CinemaBackend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? cinemaId,
            [FromQuery] int? movieId)
        {
            var start = (startDate ?? DateTime.Today.AddDays(-29)).Date;
            var end = (endDate ?? DateTime.Today).Date;

            if (end < start)
            {
                return BadRequest(new
                {
                    message = "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu."
                });
            }

            var endExclusive = end.AddDays(1);

            // Báo cáo vé theo ngày đặt vé.
            var query = _context.Tickets
                .AsNoTracking()
                .Include(t => t.User)
                .Include(t => t.Movie)
                .Include(t => t.Seat)
                .Include(t => t.Showtime)
                    .ThenInclude(s => s!.Room)
                        .ThenInclude(r => r!.Cinema)
                .Where(t =>
                    t.CreatedAt >= start &&
                    t.CreatedAt < endExclusive);

            if (movieId.HasValue)
            {
                query = query.Where(
                    t => t.MovieId == movieId.Value
                );
            }

            if (cinemaId.HasValue)
            {
                query = query.Where(t =>
                    t.Showtime != null &&
                    t.Showtime.Room != null &&
                    t.Showtime.Room.CinemaId == cinemaId.Value
                );
            }

            var tickets = await query.ToListAsync();

            // Không cộng vé đã hủy vào doanh thu và số vé hợp lệ.
            var validTickets = tickets
                .Where(t => !IsCancelled(t.Status))
                .ToList();

            var totalRevenue = validTickets.Sum(
                t => t.TicketPrice
            );

            var totalCustomers = validTickets
                .Select(t => t.UserId)
                .Distinct()
                .Count();

            // Biểu đồ doanh thu theo ngày đặt vé.
            var revenueByDay = validTickets
                .GroupBy(t => t.CreatedAt.Date)
                .Select(g => new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    revenue = g.Sum(t => t.TicketPrice),
                    tickets = g.Count()
                })
                .OrderBy(x => x.date)
                .ToList();

            // Top phim theo số vé hợp lệ.
            var topMovies = validTickets
                .GroupBy(t => new
                {
                    t.MovieId,
                    title = t.Movie != null
                        ? t.Movie.Title
                        : "Không xác định"
                })
                .Select(g => new
                {
                    movieId = g.Key.MovieId,
                    title = g.Key.title,
                    tickets = g.Count(),
                    revenue = g.Sum(t => t.TicketPrice)
                })
                .OrderByDescending(x => x.tickets)
                .Take(10)
                .ToList();

            // Doanh thu theo rạp.
            var cinemaReports = validTickets
                .GroupBy(t => new
                {
                    cinemaId = t.Showtime != null &&
                               t.Showtime.Room != null
                        ? (int?)t.Showtime.Room.CinemaId
                        : null,

                    name = t.Showtime != null &&
                           t.Showtime.Room != null &&
                           t.Showtime.Room.Cinema != null
                        ? t.Showtime.Room.Cinema.Name
                        : "Không xác định"
                })
                .Select(g => new
                {
                    cinemaId = g.Key.cinemaId ?? 0,
                    name = g.Key.name,
                    tickets = g.Count(),
                    revenue = g.Sum(t => t.TicketPrice)
                })
                .OrderByDescending(x => x.revenue)
                .ToList();

            // Số suất chiếu theo ngày chiếu.
            var showtimeQuery = _context.Showtimes
                .AsNoTracking()
                .Where(s =>
                    s.ShowDate >= start &&
                    s.ShowDate < endExclusive);

            if (movieId.HasValue)
            {
                showtimeQuery = showtimeQuery.Where(
                    s => s.MovieId == movieId.Value
                );
            }

            if (cinemaId.HasValue)
            {
                showtimeQuery = showtimeQuery.Where(s =>
                    s.Room != null &&
                    s.Room.CinemaId == cinemaId.Value
                );
            }

            var totalShowtimes = await showtimeQuery.CountAsync();

            // Tối đa 100 vé gần nhất; bao gồm trạng thái để đối soát.
            var recentTickets = tickets
                .OrderByDescending(t => t.CreatedAt)
                .Take(100)
                .Select(t => new
                {
                    ticketId = t.TicketId,
                    createdAt = t.CreatedAt,
                    customerName = t.User != null
                        ? t.User.FullName
                        : "Không xác định",
                    movieTitle = t.Movie != null
                        ? t.Movie.Title
                        : "Không xác định",
                    cinemaName =
                        t.Showtime != null &&
                        t.Showtime.Room != null &&
                        t.Showtime.Room.Cinema != null
                            ? t.Showtime.Room.Cinema.Name
                            : "-",
                    roomName =
                        t.Showtime != null &&
                        t.Showtime.Room != null
                            ? t.Showtime.Room.RoomName
                            : "-",
                    seatCode = t.Seat != null
                        ? t.Seat.SeatCode
                        : "-",
                    ticketPrice = t.TicketPrice,
                    status = t.Status
                })
                .ToList();

            return Ok(new
            {
                summary = new
                {
                    totalTickets = validTickets.Count,
                    totalRevenue,
                    totalCustomers,
                    totalShowtimes
                },
                revenueByDay,
                topMovies,
                cinemas = cinemaReports,
                tickets = recentTickets
            });
        }

        private static bool IsCancelled(string? status)
        {
            var value = (status ?? "")
                .Trim()
                .ToLowerInvariant();

            return value.StartsWith("hủy") ||
                   value.StartsWith("huỷ") ||
                   value.StartsWith("đã hủy") ||
                   value.StartsWith("đã huỷ") ||
                   value.StartsWith("cancel") ||
                   value.StartsWith("canceled") ||
                   value.StartsWith("cancelled");
        }
    }
}