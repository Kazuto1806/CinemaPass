using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TicketTypes",
                columns: table => new
                {
                    TicketTypeId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation(
                            "SqlServer:Identity",
                            "1, 1"),

                    Name = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    Description = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    Price = table.Column<decimal>(
                        type: "decimal(18,2)",
                        nullable: false),

                    Status = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    CreatedAt = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_TicketTypes",
                        x => x.TicketTypeId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketTypes");
        }
    }
}