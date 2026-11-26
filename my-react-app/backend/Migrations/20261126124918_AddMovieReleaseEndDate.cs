using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieReleaseEndDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReleaseEndDate",
                table: "Movies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE [Movies] SET [ReleaseEndDate] = '2026-11-30T23:59:00' WHERE [ReleaseEndDate] IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReleaseEndDate",
                table: "Movies");
        }
    }
}
