using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace ClassroomClone.Api.Data;

/// <summary>Used by EF Core tools (e.g. dotnet ef migrations add) to create DbContext with SQL Server (LocalDB).</summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();
        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = config.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
            connectionString = "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=ClassroomClone;Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=False;";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        if (connectionString.IndexOf("LocalDB", StringComparison.OrdinalIgnoreCase) >= 0
            || connectionString.IndexOf("Server=", StringComparison.OrdinalIgnoreCase) >= 0)
            optionsBuilder.UseSqlServer(connectionString);
        else if (connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase))
            optionsBuilder.UseNpgsql(connectionString);
        else
            optionsBuilder.UseSqlite(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }
}
