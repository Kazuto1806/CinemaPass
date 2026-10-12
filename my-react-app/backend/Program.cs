using CinemaBackend.Data;
using CinemaBackend.Services;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// Đăng ký dịch vụ Cloudinary
var cloudName = builder.Configuration["Cloudinary:CloudName"] 
    ?? Environment.GetEnvironmentVariable("Cloudinary__CloudName");
var apiKey = builder.Configuration["Cloudinary:ApiKey"] 
    ?? Environment.GetEnvironmentVariable("Cloudinary__ApiKey");
var apiSecret = builder.Configuration["Cloudinary:ApiSecret"] 
    ?? Environment.GetEnvironmentVariable("Cloudinary__ApiSecret");

if (!string.IsNullOrEmpty(cloudName) && !string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(apiSecret))
{
    var cloudinaryAccount = new Account(cloudName, apiKey, apiSecret);
    var cloudinary = new Cloudinary(cloudinaryAccount);
    builder.Services.AddSingleton(cloudinary);
}

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

var app = builder.Build();

var uploadsRoot = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(Path.Combine(uploadsRoot, "posters"));

app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads"
});

app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint(
        "/swagger/v1/swagger.json",
        "Cinema Pass API V1"
    );
});

app.UseCors("AllowReact");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Endpoint upload ảnh lên Cloudinary
app.MapPost("/api/upload", async (IFormFile file, Cloudinary cloudinary) =>
{
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { message = "Vui lòng chọn file hợp lệ." });

    await using var stream = file.OpenReadStream();
    var uploadParams = new ImageUploadParams
    {
        File = new FileDescription(file.FileName, stream),
        Folder = "cinemapass/posters"
    };

    var uploadResult = await cloudinary.UploadAsync(uploadParams);
    return Results.Ok(new { url = uploadResult.SecureUrl.ToString() });
});

app.MapControllers();

app.Run();