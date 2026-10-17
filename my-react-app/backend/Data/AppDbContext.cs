
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

        // Bảng giữ ghế tạm thời
        public DbSet<SeatHold> SeatHolds { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =========================================
            // GIÁ VÉ THEO SUẤT CHIẾU
            // =========================================

            modelBuilder.Entity<ShowtimeTicketType>()
                .HasKey(item => new
                {
                    item.ShowtimeId,
                    item.TicketTypeId
                });

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

            // =========================================
            // VÉ: KHÔNG TỰ ĐỘNG XÓA VÉ KHI XÓA SUẤT CHIẾU
            // Tránh lỗi SQL Server: multiple cascade paths.
            // Bảo vệ lịch sử vé và dữ liệu ghế đã đặt.
            // =========================================

            modelBuilder.Entity<Ticket>()
                .HasOne(ticket => ticket.Showtime)
                .WithMany()
                .HasForeignKey(ticket => ticket.ShowtimeId)
                .OnDelete(DeleteBehavior.NoAction);

            // =========================================
            // GIỮ GHẾ TẠM THỜI
            // =========================================

            modelBuilder.Entity<SeatHold>(entity =>
            {
                entity.HasKey(hold => hold.SeatHoldId);

                entity.Property(hold => hold.HoldToken)
                    .HasMaxLength(128)
                    .IsRequired();

                entity.Property(hold => hold.CreatedAtUtc)
                    .IsRequired();

                entity.Property(hold => hold.ExpiresAtUtc)
                    .IsRequired();

                entity.HasIndex(hold => new
                {
                    hold.ShowtimeId,
                    hold.SeatId
                })
                .IsUnique();
            });
        }
    }
}
