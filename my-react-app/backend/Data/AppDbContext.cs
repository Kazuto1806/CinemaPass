using CinemaBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<Movie> Movies { get; set; }

        public DbSet<Ticket> Tickets { get; set; }

        public DbSet<Food> Foods { get; set; }

        public DbSet<Cinema> Cinemas { get; set; }

        public DbSet<Showtime> Showtimes { get; set; }
        public DbSet<Room> Rooms {get; set;}
        public DbSet<Seat> Seats {get; set;}
    }
}