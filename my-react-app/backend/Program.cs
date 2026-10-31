
using System;
using System.IO;
using System.Net;
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

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

// =====================================================
// SWAGGER + BEARER JWT
// Tương thích Swashbuckle.AspNetCore 10.x
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
// BASIC AUTHENTICATION FOR SWAGGER
// Giữ nguyên cơ chế bảo vệ Swagger hiện tại
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
                    // Header Basic Authentication không hợp lệ.
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
// SWAGGER
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
// Development: tạo schema nếu database chưa có.
// Môi trường khác: sử dụng EF Core migrations.
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

        // Database đã có bảng Cinemas nên tiếp tục khởi động.
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