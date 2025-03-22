using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeSlotAndServiceIdToInspection3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Inspections_Services_ServiceId",
                table: "Inspections");

            migrationBuilder.DropForeignKey(
                name: "FK_Inspections_Users_UserId1",
                table: "Inspections");

            migrationBuilder.DropIndex(
                name: "IX_Inspections_UserId1",
                table: "Inspections");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "Inspections");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$C7GgSuIR9FaO8m5HZxtLgOg1aamH0cdOER4salCLxxFPJbwDGmCqK");

            migrationBuilder.AddForeignKey(
                name: "FK_Inspections_Services_ServiceId",
                table: "Inspections",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "ServiceId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Inspections_Services_ServiceId",
                table: "Inspections");

            migrationBuilder.AddColumn<int>(
                name: "UserId1",
                table: "Inspections",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$DeChmEYkL.4zmJd3dobA4.SmC6p1Zee1Xl09dHJqb6vM4hHRWcnhG");

            migrationBuilder.CreateIndex(
                name: "IX_Inspections_UserId1",
                table: "Inspections",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Inspections_Services_ServiceId",
                table: "Inspections",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "ServiceId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Inspections_Users_UserId1",
                table: "Inspections",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "UserId");
        }
    }
}
