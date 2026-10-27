
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CinemaBackend.Migrations
{
    public partial class AddTicketQrCodeToken : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Them cot tam thoi cho cac ve cu.
            migrationBuilder.AddColumn<string>(
                name: "QrCodeToken",
                table: "Tickets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            // Tao token rieng cho tung ve da ton tai.
            migrationBuilder.Sql(@"
                UPDATE Tickets
                SET QrCodeToken = LOWER(
                    REPLACE(CONVERT(varchar(36), NEWID()), '-', '')
                )
                WHERE QrCodeToken IS NULL;
            ");

            // Chuyen cot thanh bat buoc sau khi da co token.
            migrationBuilder.AlterColumn<string>(
                name: "QrCodeToken",
                table: "Tickets",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64,
                oldNullable: true);

            // Moi ve phai co ma QR duy nhat.
            migrationBuilder.CreateIndex(
                name: "IX_Tickets_QrCodeToken",
                table: "Tickets",
                column: "QrCodeToken",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_QrCodeToken",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "QrCodeToken",
                table: "Tickets");
        }
    }
}
