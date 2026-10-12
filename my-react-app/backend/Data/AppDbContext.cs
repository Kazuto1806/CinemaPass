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

        public DbSet<Room> Rooms { get; set; }

        public DbSet<Seat> Seats { get; set; }

        public DbSet<TicketType> TicketTypes { get; set; }

        public DbSet<FoodOrder> FoodOrders { get; set; }

        public DbSet<FoodOrderItem> FoodOrderItems { get; set; }

        public DbSet<ShowtimeTicketType> ShowtimeTicketTypes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ShowtimeTicketType>()
                .HasKey(item => new { item.ShowtimeId, item.TicketTypeId });

            modelBuilder.Entity<ShowtimeTicketType>()
                .HasOne(item => item.Showtime)
                .WithMany(showtime => showtime.TicketTypeAssignments)
                .HasForeignKey(item => item.ShowtimeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ShowtimeTicketType>()
                .HasOne(item => item.TicketType)
                .WithMany(ticketType => ticketType.ShowtimeAssignments)
                .HasForeignKey(item => item.TicketTypeId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}