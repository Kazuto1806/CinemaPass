using CinemaBackend.Data;
using CinemaBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CinemaBackend.Controllers
{
    [ApiController]
    [Route("api/foods")]
    public class FoodsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FoodsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/foods
        [HttpGet]
        public async Task<IActionResult> GetFoods()
        {
            var foods = await _context.Foods
                .AsNoTracking()
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return Ok(foods);
        }

        // GET: api/foods/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFood(int id)
        {
            var food = await _context.Foods
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.FoodId == id);

            if (food == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn"
                });
            }

            return Ok(food);
        }

        // POST: api/foods
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateFood(FoodWriteRequest food)
        {
            var newFood = new Food
            {
                Name = food.Name,
                Description = food.Description,
                Price = food.Price,
                ImageUrl = food.ImageUrl,
                Category = string.IsNullOrWhiteSpace(food.Category)
                    ? "Bắp nước"
                    : food.Category,
                Status = string.IsNullOrWhiteSpace(food.Status)
                    ? "Đang bán"
                    : food.Status,
                CreatedAt = DateTime.Now
            };

            _context.Foods.Add(newFood);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm món thành công",
                foodId = newFood.FoodId
            });
        }

        // PUT: api/foods/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateFood(
            int id,
            FoodWriteRequest updatedFood)
        {
            var food = await _context.Foods
                .FirstOrDefaultAsync(f => f.FoodId == id);

            if (food == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn"
                });
            }

            food.Name = updatedFood.Name;
            food.Description = updatedFood.Description;
            food.Price = updatedFood.Price;
            food.ImageUrl = updatedFood.ImageUrl;
            food.Category = updatedFood.Category;
            food.Status = updatedFood.Status;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật món thành công"
            });
        }

        // DELETE: api/foods/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteFood(int id)
        {
            var food = await _context.Foods
                .FirstOrDefaultAsync(f => f.FoodId == id);

            if (food == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy món ăn"
                });
            }

            _context.Foods.Remove(food);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Xóa món thành công"
            });
        }

        public sealed class FoodWriteRequest
        {
            public string Name { get; set; } = string.Empty;
            public string? Description { get; set; }
            public decimal Price { get; set; }
            public string? ImageUrl { get; set; }
            public string Category { get; set; } = "Bắp nước";
            public string Status { get; set; } = "Đang bán";
        }
    }
}