using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class Initial2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MechanicId",
                table: "Inspections",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$QHYRuOWFb6h5JAvISvTy1eSwNaCfpcxXTvI5nQZCiIx/OPmT4zHcK");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MechanicId",
                table: "Inspections");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$0pB5mXEmEERwpizF/x0LdunrENqpgPPYBjOlbTTF5lLmsaa3o.nxC");
        }
    }
}
