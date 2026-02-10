using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClassroomClone.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "QuizTemplates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "MaterialTemplates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "AssignmentTemplates",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "QuizTemplates");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "MaterialTemplates");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "AssignmentTemplates");
        }
    }
}
