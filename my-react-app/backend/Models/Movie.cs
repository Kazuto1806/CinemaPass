namespace CinemaBackend.Models
{
    public class Movie
    {
        public int MovieId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Genre { get; set; }

        public int Duration { get; set; }

        public DateTime? ReleaseDate { get; set; }

        public string? Director { get; set; }

        public string? AgeRating { get; set; }

        public string? PosterUrl { get; set; }

        public string? TrailerUrl { get; set; }

        public string Status { get; set; } = "ComingSoon";
    }
}