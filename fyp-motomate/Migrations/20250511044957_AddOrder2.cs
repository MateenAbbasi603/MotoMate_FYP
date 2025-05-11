using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class AddOrder2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "Reviews",
                type: "int",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<int>(
                name: "MechanicId",
                table: "Reviews",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewType",
                table: "Reviews",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "OrderId",
                table: "MechanicsPerformances",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$lYmA7tkJDAu8nBP/09ZeBuc3k30BxqWK2E9pyR9TgAnBBuKiU6q.O");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_MechanicId",
                table: "Reviews",
                column: "MechanicId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_OrderId",
                table: "Reviews",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_MechanicsPerformances_OrderId",
                table: "MechanicsPerformances",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_MechanicsPerformances_Orders_OrderId",
                table: "MechanicsPerformances",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Orders_OrderId",
                table: "Reviews",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_MechanicId",
                table: "Reviews",
                column: "MechanicId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MechanicsPerformances_Orders_OrderId",
                table: "MechanicsPerformances");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Orders_OrderId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_MechanicId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_MechanicId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_OrderId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_MechanicsPerformances_OrderId",
                table: "MechanicsPerformances");

            migrationBuilder.DropColumn(
                name: "MechanicId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ReviewType",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "MechanicsPerformances");

            migrationBuilder.AlterColumn<string>(
                name: "OrderId",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$Wxa4bvepOHf6siznZs2L/.pjCZ6PXx6fqhsZkwPqYprUdgqPWBVI.");
        }
    }
}
