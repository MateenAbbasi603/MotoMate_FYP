using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fyp_motomate.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeSlotAndServiceIdToInspection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ServiceId",
                table: "Inspections",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TimeSlot",
                table: "Inspections",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$DeChmEYkL.4zmJd3dobA4.SmC6p1Zee1Xl09dHJqb6vM4hHRWcnhG");

            migrationBuilder.CreateIndex(
                name: "IX_Inspections_ServiceId",
                table: "Inspections",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Inspections_Services_ServiceId",
                table: "Inspections",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "ServiceId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Inspections_Services_ServiceId",
                table: "Inspections");

            migrationBuilder.DropIndex(
                name: "IX_Inspections_ServiceId",
                table: "Inspections");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "Inspections");

            migrationBuilder.DropColumn(
                name: "TimeSlot",
                table: "Inspections");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$V4BP43ognbvrUPJkeEVe3eOP5SjNL.vCYurbjr0Ec4T0cZo7a1xhe");
        }
    }
}
