using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class AddFinancialReportsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FinancialReports",
                columns: table => new
                {
                    ReportId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReportName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ReportType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReportCategory = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalTax = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NetRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalInvoices = table.Column<int>(type: "int", nullable: false),
                    TotalItems = table.Column<int>(type: "int", nullable: false),
                    InventoryValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ReportData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneratedBy = table.Column<int>(type: "int", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinancialReports", x => x.ReportId);
                    table.ForeignKey(
                        name: "FK_FinancialReports_Users_GeneratedBy",
                        column: x => x.GeneratedBy,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$KeQvwlP/cdQx87wsjUpLqu.D64.lklYXwSKO0klzoVmshFDPG78pW");

            migrationBuilder.CreateIndex(
                name: "IX_FinancialReports_GeneratedBy",
                table: "FinancialReports",
                column: "GeneratedBy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinancialReports");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$gI4q8P92MJhOR8BOnK3ZDeKh6b3PJU3qNT2UOj..hrPYL.S3C/Y/i");
        }
    }
}
