using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class AddToolInstancesAndActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Inventory",
                type: "decimal(10,2)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Inventory",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ToolInstances",
                columns: table => new
                {
                    InstanceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ToolId = table.Column<int>(type: "int", nullable: false),
                    SerialNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ToolInstances", x => x.InstanceId);
                    table.ForeignKey(
                        name: "FK_ToolInstances_Inventory_ToolId",
                        column: x => x.ToolId,
                        principalTable: "Inventory",
                        principalColumn: "ToolId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$ZFaWrts8qZnMBdvj.E./tuxFXzGlMsjq6GcQPtwHZG1jsDhi5XI92");

            migrationBuilder.CreateIndex(
                name: "IX_ToolInstances_ToolId",
                table: "ToolInstances",
                column: "ToolId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ToolInstances");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Inventory");

            migrationBuilder.AlterColumn<int>(
                name: "Price",
                table: "Inventory",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(10,2)");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$MFRGBl58KYSRz5h55uBSI.7e6HXEFgJ0cSRR5pGs6yS9xy7/tNuLS");
        }
    }
}
