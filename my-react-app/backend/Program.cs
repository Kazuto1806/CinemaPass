
using System;
using System.IO;
using System.Security.Claims;
using System.Text;

using CinemaBackend.Data;
using CinemaBackend.Services;

using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// SERVICES
// =====================================================

builder.Services.AddHttpClient<TmdbService>();
builder.Services.AddScoped<ITicketEmailService, TicketEmailService>();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

// =====================================================
// DATABASE CONTEXT
// =====================================================

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Chưa cấu hình ConnectionStrings:DefaultConnection."
    );
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString)
);

// =====================================================
// SWAGGER + BEARER JWT
// =====================================================

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token nhận được từ API đăng nhập."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});

// =====================================================
// JWT AUTHENTICATION
// =====================================================

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Chưa cấu hình Jwt:Key."
    );

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Chưa cấu hình Jwt:Issuer."
    );

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "Chưa cấu hình Jwt:Audience."
    );

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            ),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,

            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

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
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// =====================================================
// BUILD APPLICATION
// =====================================================

var app = builder.Build();

// =====================================================
// SWAGGER DOCUMENTATION
// =====================================================

app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint(
        "/swagger/v1/swagger.json",
        "Cinema Pass API V1"
    );
});

// =====================================================
// STATIC FILES + UPLOADS
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
// MIDDLEWARE
// =====================================================

app.UseRouting();

app.UseCors("AllowReact");

app.UseAuthentication();

app.UseAuthorization();

// =====================================================
// DATABASE
// =====================================================

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

        if (app.Environment.IsDevelopment())
        {
            db.Database.EnsureCreated();
        }
        else
        {
            var productVersion =
                typeof(DbContext).Assembly.GetName().Version?.ToString(3) ?? "10.0.0";

            db.Database.ExecuteSqlInterpolated($@"
                IF OBJECT_ID(N'dbo.__EFMigrationsHistory', N'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.__EFMigrationsHistory (
                        MigrationId nvarchar(150) NOT NULL
                            CONSTRAINT PK___EFMigrationsHistory PRIMARY KEY,
                        ProductVersion nvarchar(32) NOT NULL
                    );
                END;

                DECLARE @InitialTables TABLE (Name sysname NOT NULL);
                INSERT INTO @InitialTables (Name)
                VALUES
                    (N'Cinemas'), (N'Foods'), (N'Movies'), (N'SeatHolds'),
                    (N'TicketTypes'), (N'Users'), (N'Rooms'), (N'FoodOrders'),
                    (N'Seats'), (N'Showtimes'), (N'FoodOrderItems'),
                    (N'ShowtimeTicketTypes'), (N'Tickets');

                IF NOT EXISTS (
                    SELECT 1 FROM dbo.__EFMigrationsHistory
                    WHERE MigrationId = N'20261018132217_InitialCreate'
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM @InitialTables AS requiredTable
                    LEFT JOIN INFORMATION_SCHEMA.TABLES AS existingTable
                        ON existingTable.TABLE_SCHEMA = N'dbo'
                        AND existingTable.TABLE_NAME = requiredTable.Name
                    WHERE existingTable.TABLE_NAME IS NULL
                )
                BEGIN
                    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
                    VALUES (N'20261018132217_InitialCreate', {productVersion});
                END;

                IF EXISTS (
                    SELECT 1 FROM dbo.__EFMigrationsHistory
                    WHERE MigrationId = N'20261018132217_InitialCreate'
                )
                AND OBJECT_ID(N'dbo.Banners', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM dbo.__EFMigrationsHistory
                    WHERE MigrationId = N'20261019132355_AddBanners'
                )
                BEGIN
                    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
                    VALUES (N'20261019132355_AddBanners', {productVersion});
                END;

                IF OBJECT_ID(N'dbo.Tickets', N'U') IS NOT NULL
                AND COL_LENGTH(N'dbo.Tickets', N'QrCodeToken') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM dbo.__EFMigrationsHistory
                    WHERE MigrationId = N'20261027130323_AddTicketQrCodeToken'
                )
                BEGIN
                    UPDATE dbo.Tickets
                    SET QrCodeToken = LOWER(REPLACE(CONVERT(varchar(36), NEWID()), '-', ''))
                    WHERE QrCodeToken IS NULL;

                    ALTER TABLE dbo.Tickets
                        ALTER COLUMN QrCodeToken nvarchar(64) NOT NULL;

                    IF NOT EXISTS (
                        SELECT 1 FROM sys.indexes
                        WHERE object_id = OBJECT_ID(N'dbo.Tickets')
                            AND name = N'IX_Tickets_QrCodeToken'
                    )
                    BEGIN
                        CREATE UNIQUE INDEX IX_Tickets_QrCodeToken
                            ON dbo.Tickets(QrCodeToken);
                    END;

                    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
                    VALUES (N'20261027130323_AddTicketQrCodeToken', {productVersion});
                END;

                IF OBJECT_ID(N'dbo.Movies', N'U') IS NOT NULL
                AND (
                    COL_LENGTH(N'dbo.Movies', N'EnglishTitle') IS NOT NULL
                    OR COL_LENGTH(N'dbo.Movies', N'EnglishDescription') IS NOT NULL
                    OR COL_LENGTH(N'dbo.Movies', N'EnglishGenre') IS NOT NULL
                    OR COL_LENGTH(N'dbo.Movies', N'EnglishDirector') IS NOT NULL
                )
                AND NOT EXISTS (
                    SELECT 1 FROM dbo.__EFMigrationsHistory
                    WHERE MigrationId = N'20261118143131_AddEnglishMovieFields'
                )
                BEGIN
                    IF COL_LENGTH(N'dbo.Movies', N'EnglishTitle') IS NULL
                        ALTER TABLE dbo.Movies ADD EnglishTitle nvarchar(max) NULL;
                    IF COL_LENGTH(N'dbo.Movies', N'EnglishDescription') IS NULL
                        ALTER TABLE dbo.Movies ADD EnglishDescription nvarchar(max) NULL;
                    IF COL_LENGTH(N'dbo.Movies', N'EnglishGenre') IS NULL
                        ALTER TABLE dbo.Movies ADD EnglishGenre nvarchar(max) NULL;
                    IF COL_LENGTH(N'dbo.Movies', N'EnglishDirector') IS NULL
                        ALTER TABLE dbo.Movies ADD EnglishDirector nvarchar(max) NULL;

                    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
                    VALUES (N'20261118143131_AddEnglishMovieFields', {productVersion});
                END;
            ");

            db.Database.Migrate();
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

    db.Database.ExecuteSqlRaw(@"
        IF OBJECT_ID(N'dbo.Movies', N'U') IS NOT NULL
        BEGIN
            IF COL_LENGTH(N'dbo.Movies', N'ReleaseEndDate') IS NULL
            BEGIN
                ALTER TABLE dbo.Movies ADD ReleaseEndDate datetime2 NULL;
                UPDATE dbo.Movies
                SET ReleaseEndDate = '2026-11-30T23:59:00'
                WHERE ReleaseEndDate IS NULL;
            END;

            IF COL_LENGTH(N'dbo.Movies', N'EnglishTitle') IS NULL
                ALTER TABLE dbo.Movies ADD EnglishTitle nvarchar(max) NULL;

            IF COL_LENGTH(N'dbo.Movies', N'EnglishDescription') IS NULL
                ALTER TABLE dbo.Movies ADD EnglishDescription nvarchar(max) NULL;

            IF COL_LENGTH(N'dbo.Movies', N'EnglishGenre') IS NULL
                ALTER TABLE dbo.Movies ADD EnglishGenre nvarchar(max) NULL;

            IF COL_LENGTH(N'dbo.Movies', N'EnglishDirector') IS NULL
                ALTER TABLE dbo.Movies ADD EnglishDirector nvarchar(max) NULL;
        END;");
}

// =====================================================
// UPLOAD IMAGE TO CLOUDINARY
// CHỈ ADMIN ĐƯỢC PHÉP UPLOAD
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
).RequireAuthorization(policy =>
    policy.RequireRole("Admin")
);

// =====================================================
// CONTROLLERS
// =====================================================

app.MapControllers();

app.Run();
