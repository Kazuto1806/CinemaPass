
using CinemaBackend.Data;
using CinemaBackend.Services;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using System.Net;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// SERVICES
// =====================================================

builder.Services.AddHttpClient<TmdbService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// =====================================================
// CLOUDINARY
// =====================================================

var cloudName = builder.Configuration["Cloudinary:CloudName"]
    ?? Environment.GetEnvironmentVariable("Cloudinary__CloudName");

var apiKey = builder.Configuration["Cloudinary:ApiKey"]
    ?? Environment.GetEnvironmentVariable("Cloudinary__ApiKey");

var apiSecret = builder.Configuration["Cloudinary:ApiSecret"]
    ?? Environment.GetEnvironmentVariable("Cloudinary__ApiSecret");

if (!string.IsNullOrWhiteSpace(cloudName) &&
    !string.IsNullOrWhiteSpace(apiKey) &&
    !string.IsNullOrWhiteSpace(apiSecret))
{
    var cloudinaryAccount = new Account(
        cloudName,
        apiKey,
        apiSecret
    );

    var cloudinary = new Cloudinary(cloudinaryAccount);
    builder.Services.AddSingleton(cloudinary);
}

// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins(
                "https://www.cinemapass.id.vn",
                "https://cinemapass.id.vn"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// =====================================================
// SWAGGER BASIC AUTHENTICATION
// =====================================================

app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/swagger"),
    swaggerApp =>
    {
        swaggerApp.Use(async (context, next) =>
        {
            var expectedUser =
                Environment.GetEnvironmentVariable("SWAGGER_USERNAME");

            var expectedPassword =
                Environment.GetEnvironmentVariable("SWAGGER_PASSWORD");

            if (string.IsNullOrWhiteSpace(expectedUser) ||
                string.IsNullOrWhiteSpace(expectedPassword))
            {
                context.Response.StatusCode =
                    StatusCodes.Status503ServiceUnavailable;

                await context.Response.WriteAsync(
                    "Swagger authentication is not configured."
                );

                return;
            }

            var authHeader =
                context.Request.Headers.Authorization.ToString();

            if (authHeader.StartsWith(
                "Basic ",
                StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var encoded = authHeader["Basic ".Length..].Trim();

                    var decoded = Encoding.UTF8.GetString(
                        Convert.FromBase64String(encoded)
                    );

                    var separator = decoded.IndexOf(':');

                    if (separator >= 0)
                    {
                        var username = decoded[..separator];
                        var password = decoded[(separator + 1)..];

                        if (string.Equals(
                                username,
                                expectedUser,
                                StringComparison.Ordinal) &&
                            string.Equals(
                                password,
                                expectedPassword,
                                StringComparison.Ordinal))
                        {
                            await next();
                            return;
                        }
                    }
                }
                catch (FormatException)
                {
                    // Header không hợp lệ.
                }
            }

            context.Response.Headers.WWWAuthenticate =
                "Basic realm=\"CinemaPass Swagger\", charset=\"UTF-8\"";

            context.Response.StatusCode =
                (int)HttpStatusCode.Unauthorized;
        });
    }
);

// =====================================================
// HTTP PIPELINE
// =====================================================

// CORS phải được đặt trước controller endpoints.
app.UseRouting();
app.UseCors("AllowReact");

// Swagger vẫn được bảo vệ bằng Basic Authentication.
app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint(
        "/swagger/v1/swagger.json",
        "Cinema Pass API V1"
    );
});

// =====================================================
// STATIC FILES
// =====================================================

var uploadsRoot = Path.Combine(
    app.Environment.ContentRootPath,
    "uploads"
);

Directory.CreateDirectory(
    Path.Combine(uploadsRoot, "posters")
);

app.UseStaticFiles();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads"
});

// =====================================================
// DATABASE
// Development: tạo schema cho database thử nghiệm mới.
// Môi trường khác: tiếp tục sử dụng EF Core migrations.
// =====================================================

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    try
    {
        if (app.Environment.IsDevelopment())
        {
            db.Database.EnsureCreated();
        }
        else
        {
            db.Database.Migrate();
        }
    }
    catch (Exception ex) when (
        ex is InvalidOperationException ||
        ex is Microsoft.Data.SqlClient.SqlException)
    {
        var connection = db.Database.GetDbConnection();

        if (connection.State != System.Data.ConnectionState.Open)
        {
            connection.Open();
        }

        using var command = connection.CreateCommand();

        command.CommandText = @"
            SELECT CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_NAME = 'Cinemas'
                ) THEN 1
                ELSE 0
            END;";

        var result = Convert.ToInt32(command.ExecuteScalar());

        if (result != 1)
        {
            throw;
        }

        // Database đã có bảng Cinemas nên không dừng ứng dụng.
    }

    db.Database.ExecuteSqlRaw(@"
        IF OBJECT_ID(N'dbo.Banners', N'U') IS NULL
        BEGIN
            CREATE TABLE dbo.Banners (
                BannerId int IDENTITY(1,1) NOT NULL
                    CONSTRAINT PK_Banners PRIMARY KEY,
                ImageUrl nvarchar(max) NOT NULL,
                AltText nvarchar(max) NOT NULL,
                DisplayOrder int NOT NULL,
                CreatedAt datetime2 NOT NULL
            );
        END;");
}

// =====================================================
// UPLOAD IMAGE TO CLOUDINARY
// =====================================================

app.MapPost(
    "/api/upload",
    async (IFormFile file, HttpContext context) =>
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new
            {
                message = "Vui lòng chọn file hợp lệ."
            });
        }

        var cloudinary = context.RequestServices
            .GetService<Cloudinary>();

        if (cloudinary == null)
        {
            return Results.Problem(
                detail: "Chưa cấu hình Cloudinary.",
                statusCode: StatusCodes.Status503ServiceUnavailable
            );
        }

        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "cinemapass/posters"
        };

        var uploadResult =
            await cloudinary.UploadAsync(uploadParams);

        return Results.Ok(new
        {
            url = uploadResult.SecureUrl.ToString()
        });
    }
);

app.MapControllers();

app.Run();
