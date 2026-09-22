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
        public DbSet<Movie> Movies {get;set;}
    }
}