using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CozyLoops.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixBasketUserIdType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Baskets_AspNetUsers_AppUserId1",
                table: "Baskets");

            migrationBuilder.DropIndex(
                name: "IX_Baskets_AppUserId1",
                table: "Baskets");

            migrationBuilder.DropColumn(
                name: "AppUserId1",
                table: "Baskets");

            migrationBuilder.AlterColumn<string>(
                name: "AppUserId",
                table: "Baskets",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_Baskets_AppUserId",
                table: "Baskets",
                column: "AppUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Baskets_AspNetUsers_AppUserId",
                table: "Baskets",
                column: "AppUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Baskets_AspNetUsers_AppUserId",
                table: "Baskets");

            migrationBuilder.DropIndex(
                name: "IX_Baskets_AppUserId",
                table: "Baskets");

            migrationBuilder.AlterColumn<int>(
                name: "AppUserId",
                table: "Baskets",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<string>(
                name: "AppUserId1",
                table: "Baskets",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Baskets_AppUserId1",
                table: "Baskets",
                column: "AppUserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Baskets_AspNetUsers_AppUserId1",
                table: "Baskets",
                column: "AppUserId1",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
