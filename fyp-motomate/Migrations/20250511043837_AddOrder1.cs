using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class AddOrder1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OrderId",
                table: "Reviews",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$Wxa4bvepOHf6siznZs2L/.pjCZ6PXx6fqhsZkwPqYprUdgqPWBVI.");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "Reviews");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$p3L3SLcN7NRgAmPmE4jcZOct6fd.zMvIn914jJeTc.n.X4rzRIXXi");
        }
    }
}
