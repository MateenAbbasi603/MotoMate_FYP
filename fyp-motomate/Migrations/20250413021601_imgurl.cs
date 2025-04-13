using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class imgurl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Inspections_OrderId",
                table: "Inspections");

            migrationBuilder.AddColumn<string>(
                name: "imgUrl",
                table: "Users",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "Inspections",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "ServiceId",
                table: "Appointments",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Appointments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "OrderId",
                table: "Appointments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TimeSlot",
                table: "Appointments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "Password", "imgUrl" },
                values: new object[] { "$2a$11$ovAj7kOeMBoNCX.jHca1iuw7JMVv829Y4z1/XyVSYSs7OYKK4D1Ya", "https://ui-avatars.com/api/?name=Super+Admin&background=random" });

            migrationBuilder.CreateIndex(
                name: "IX_Inspections_OrderId",
                table: "Inspections",
                column: "OrderId",
                unique: true,
                filter: "[OrderId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_OrderId",
                table: "Appointments",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_Orders_OrderId",
                table: "Appointments",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_Orders_OrderId",
                table: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_Inspections_OrderId",
                table: "Inspections");

            migrationBuilder.DropIndex(
                name: "IX_Appointments_OrderId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "imgUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "TimeSlot",
                table: "Appointments");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "Inspections",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ServiceId",
                table: "Appointments",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$uinnps6mTDbtz9jU2yEzdusjiGWsk1VnFw13IwHsKUvn1zR7QbxyW");

            migrationBuilder.CreateIndex(
                name: "IX_Inspections_OrderId",
                table: "Inspections",
                column: "OrderId",
                unique: true);
        }
    }
}
