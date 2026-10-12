using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketTypeCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "TicketTypes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Customer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "TicketTypes");
        }
    }
}
