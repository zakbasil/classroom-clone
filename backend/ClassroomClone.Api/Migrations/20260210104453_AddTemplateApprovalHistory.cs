using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClassroomClone.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateApprovalHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "QuizTemplates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "MaterialTemplates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "AssignmentTemplates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "TemplateApprovalHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TemplateType = table.Column<int>(type: "int", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReviewedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateApprovalHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemplateApprovalHistories_Users_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TemplateApprovalHistories_Users_ReviewedBy",
                        column: x => x.ReviewedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TemplateApprovalHistories_CreatedBy",
                table: "TemplateApprovalHistories",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateApprovalHistories_ReviewedBy",
                table: "TemplateApprovalHistories",
                column: "ReviewedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateApprovalHistories_TemplateId",
                table: "TemplateApprovalHistories",
                column: "TemplateId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TemplateApprovalHistories");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "QuizTemplates");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "MaterialTemplates");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "AssignmentTemplates");
        }
    }
}
