using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddEnglishMovieFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EnglishDescription",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnglishDirector",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnglishGenre",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnglishTitle",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnglishDescription",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "EnglishDirector",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "EnglishGenre",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "EnglishTitle",
                table: "Movies");
        }
    }
}
