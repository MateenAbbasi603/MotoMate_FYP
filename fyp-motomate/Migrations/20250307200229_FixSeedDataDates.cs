using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class FixSeedDataDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Password", "UpdatedAt" },
                values: new object[] { new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "$2a$11$OfjgHol09VDj//F9e/xtYO7SN3R2f78.VVbokqMUNG0Ociq/R2P7W", new DateTime(2023, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Password", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 3, 7, 20, 1, 4, 985, DateTimeKind.Utc).AddTicks(1450), "$2a$11$dDnT5ZPhg7rc5wWpfMhElubTAxQ78Ue.Gow5ueiIX8TdzMpGl8d8y", new DateTime(2025, 3, 7, 20, 1, 4, 985, DateTimeKind.Utc).AddTicks(1617) });
        }
    }
}
