using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddShowtimeTicketTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShowtimeTicketTypes",
                columns: table => new
                {
                    ShowtimeId = table.Column<int>(type: "int", nullable: false),
                    TicketTypeId = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowtimeTicketTypes", x => new { x.ShowtimeId, x.TicketTypeId });
                    table.ForeignKey(
                        name: "FK_ShowtimeTicketTypes_Showtimes_ShowtimeId",
                        column: x => x.ShowtimeId,
                        principalTable: "Showtimes",
                        principalColumn: "ShowtimeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShowtimeTicketTypes_TicketTypes_TicketTypeId",
                        column: x => x.TicketTypeId,
                        principalTable: "TicketTypes",
                        principalColumn: "TicketTypeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShowtimeTicketTypes_TicketTypeId",
                table: "ShowtimeTicketTypes",
                column: "TicketTypeId");

            migrationBuilder.Sql("""
                INSERT INTO ShowtimeTicketTypes (ShowtimeId, TicketTypeId, Price)
                SELECT s.ShowtimeId, t.TicketTypeId, t.Price
                FROM Showtimes AS s
                CROSS JOIN TicketTypes AS t
                WHERE LOWER(LTRIM(RTRIM(t.Status))) NOT IN
                    ('inactive', N'tạm ngưng', N'ngừng hoạt động');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShowtimeTicketTypes");
        }
    }
}
